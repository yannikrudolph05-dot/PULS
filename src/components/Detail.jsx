import React, { useState } from "react";
import { C, TEXT, MUTED, BORDER, statusColor } from "../theme.js";
import { Button, Pill, Field, inputStyle, Kv, DeptTag } from "../ui.jsx";
import { fmt, hasOpenQuery } from "../utils/format.js";
import { sendMail } from "../email.js";
import { buildUpdateEmail, buildHelpEmail, buildQueryEmail } from "../emailTemplates.js";
import { typeFieldDefs, reportDisplayFields } from "../fields.js";
import { AttachmentPicker, AttachmentView } from "./Attachments.jsx";
import {
  DEPARTMENTS,
  CONTACTS,
  APP_NAME,
  ANLAGE_EMAIL,
  deptEmails,
  deptLabel,
  deptLabels,
  isAnlage,
  isDept,
  canEdit,
  canChangeStatus,
  canRequestHelp,
  canRaiseQuery,
} from "../config.js";

const isEmail = (s) => /\S+@\S+\.\S+/.test(s);
const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const preview = (txt) => {
  const s = (txt || "").replace(/\s+/g, " ").trim();
  return s.length > 72 ? s.slice(0, 72) + "…" : s;
};

const KIND = {
  query: { bg: "#FBEAD2", color: "#8A5A12", label: "Rückfrage" },
  answer: { bg: "#DDF1E6", color: "#13653F", label: "Antwort" },
  help: { bg: "#E1EEF7", color: C.navy, label: "Hilfe" },
  mail: { bg: "#EAF2F7", color: C.navy, label: "E-Mail" },
  status: { bg: "#EAF2F7", color: C.navy, label: "Status" },
  edit: { bg: "#EAF2F7", color: C.navy, label: "Bearbeitet" },
  create: { bg: "#EFF4F8", color: MUTED, label: "Angelegt" },
  note: { bg: "#EFF4F8", color: MUTED, label: "Notiz" },
};

export default function Detail({ r, data, role, onClose, notify }) {
  const [editing, setEditing] = useState(false);
  const [eState, setEState] = useState({});
  const [sendUpdateMail, setSendUpdateMail] = useState(false);
  const [helpSel, setHelpSel] = useState([]);
  const [helpPeople, setHelpPeople] = useState([]);
  const [helpDraft, setHelpDraft] = useState("");
  const [note, setNote] = useState("");
  const [queryText, setQueryText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(() => new Set()); // eingeklappter Verlauf (Standard: alles zu)

  if (!r) return null;
  const editable = canEdit(role) && r.status !== "behoben";
  const openQuery = hasOpenQuery(r);

  // Editierbare Felder = Entdeckt am (universell) + Typ-Felder aus dem Schema.
  const editDefs = [{ key: "discoveredAt", label: "Entdeckt am", kind: "datetime" }, ...typeFieldDefs(r.plant, r.type)];

  // Empfänger einer optionalen Update-Mail: Abteilungen (benachrichtigt + Hilfe) + Personen.
  const updateRecipients = [
    ...new Set([...deptEmails([...(r.depts || []), ...(r.helpDepts || [])]), ...(r.recipients || [])]),
  ];

  const enterEdit = () => {
    const init = { measures: r.measures || "" };
    editDefs.forEach((fd) => {
      init[fd.key] = fd.kind === "datetime" ? toLocalInput(r[fd.key]) : r[fd.key] ?? "";
    });
    setEState(init);
    setSendUpdateMail(false);
    setEditing(true);
  };
  const eSet = (k, v) => setEState((p) => ({ ...p, [k]: v }));

  const setStatus = (s) => {
    if (s === r.status) return;
    const patch = { status: s, resolvedAt: s === "behoben" ? new Date().toISOString() : undefined };
    data.update(r.id, patch, `Status geändert auf „${s}".`, "status", role.label);
  };

  const saveEdit = async () => {
    const patch = {};
    const changeList = [];
    const norm = (x) => (x === undefined || x === null ? "" : String(x));

    if (norm(eState.measures) !== norm(r.measures)) {
      patch.measures = eState.measures;
      changeList.push({ key: "measures", label: "Maßnahmen/Bemerkungen", from: r.measures || "–", to: eState.measures || "–" });
    }
    editDefs.forEach((fd) => {
      let nv = eState[fd.key];
      if (fd.kind === "number") nv = nv === "" || nv == null ? undefined : Number(nv);
      else if (fd.kind === "datetime") nv = nv ? new Date(nv).toISOString() : undefined;
      else if (nv === "") nv = undefined;
      if (norm(nv) !== norm(r[fd.key])) {
        patch[fd.key] = nv;
        const from = fd.kind === "datetime" ? (r[fd.key] ? fmt(r[fd.key]) : "–") : norm(r[fd.key]) || "–";
        const to = fd.kind === "datetime" ? (nv ? fmt(nv) : "–") : norm(nv) || "–";
        changeList.push({ key: fd.key, label: fd.label, from, to });
      }
    });

    if (changeList.length === 0) {
      setEditing(false);
      return;
    }

    const logTxt = "Bearbeitet – " + changeList.map((c) => `${c.label}: ${c.to}`).join("; ") + ".";
    data.update(r.id, patch, logTxt, "edit", role.label);

    if (sendUpdateMail && updateRecipients.length > 0) {
      setBusy(true);
      const updated = { ...r, ...patch };
      const res = await sendMail({
        toEmails: updateRecipients,
        subject: `[${APP_NAME}] Aktualisierung ${r.id} – ${r.plant} – ${r.type}`,
        message: buildUpdateEmail(updated, changeList),
      });
      data.addLog(r.id, `Update-Mail an ${updateRecipients.length} Empfänger. ${res.info}`, "mail", role.label);
      notify(res.ok ? "✓ Update-Mail gesendet. " + res.info : "⚠ " + res.info);
      setBusy(false);
    }
    setEditing(false);
  };

  // Anhänge im Ticket aktualisieren (nur Bearbeiter).
  const setAttachments = (arr) => {
    data.update(r.id, { attachments: arr }, `Anhänge aktualisiert (${arr.length}).`, "note", role.label);
  };

  // Hilfe anfordern an Abteilungen + einzelne Personen.
  const toggleHelp = (k) => setHelpSel((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  const toggleHelpPerson = (e) => setHelpPeople((p) => (p.includes(e) ? p.filter((x) => x !== e) : [...p, e]));
  const addHelpDraft = () => {
    const e = helpDraft.trim();
    if (isEmail(e) && !helpPeople.includes(e)) setHelpPeople((p) => [...p, e]);
    setHelpDraft("");
  };
  const requestHelp = async () => {
    const recip = [...new Set([...deptEmails(helpSel), ...helpPeople])];
    if (!recip.length || busy) return;
    setBusy(true);
    const res = await sendMail({
      toEmails: recip,
      subject: `[${APP_NAME}] Hilfe angefordert – ${r.id} ${r.type}`,
      message: buildHelpEmail(r, role.label),
    });
    const merged = Array.from(new Set([...(r.helpDepts || []), ...helpSel]));
    const who = [helpSel.length ? deptLabels(helpSel) : "", ...helpPeople].filter(Boolean).join(", ");
    data.update(r.id, { helpDepts: merged }, `Hilfe angefordert von ${who}. ${res.info}`, "help", role.label);
    notify(res.ok ? "✓ " + res.info : "⚠ " + res.info);
    setHelpSel([]);
    setHelpPeople([]);
    setBusy(false);
  };

  const sendQuery = async () => {
    const t = queryText.trim();
    if (!t || busy) return;
    setBusy(true);
    const res = await sendMail({
      toEmails: ANLAGE_EMAIL,
      subject: `[${APP_NAME}] Rückfrage zu ${r.id}`,
      message: buildQueryEmail(r, role.label, t),
    });
    data.addLog(r.id, `Rückfrage: ${t}`, "query", role.label);
    data.addLog(r.id, res.info, "mail", role.label);
    notify(res.ok ? "✓ Rückfrage gesendet. " + res.info : "⚠ " + res.info);
    setQueryText("");
    setBusy(false);
  };

  const sendAnswer = () => {
    const t = answerText.trim();
    if (!t) return;
    data.addLog(r.id, `Antwort: ${t}`, "answer", role.label);
    notify("Antwort im Verlauf ergänzt.");
    setAnswerText("");
  };
  const addNote = () => {
    const t = note.trim();
    if (!t) return;
    data.addLog(r.id, t, "note", role.label);
    setNote("");
  };

  const log = r.log || [];
  const toggleEntry = (i) => setExpanded((prev) => {
    const next = new Set(prev);
    next.has(i) ? next.delete(i) : next.add(i);
    return next;
  });
  const allOpen = expanded.size === log.length && log.length > 0;
  const toggleAllEntries = () => setExpanded(allOpen ? new Set() : new Set(log.map((_, i) => i)));

  const gridFields = reportDisplayFields(r).filter((fld) => fld.key !== "status");

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(10,30,55,0.55)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", overflowY: "auto", zIndex: 50 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.white, borderRadius: 10, width: "100%", maxWidth: 640, overflow: "hidden" }}>
        <div style={{ background: C.navy, color: C.white, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>
            {r.type}{r.particleType ? ` – ${r.particleType}` : ""} · {r.id}
          </span>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.white, fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 18 }}>
          {openQuery && (
            <div style={{ background: "#FBEAD2", border: "1px solid #E8C46A", color: "#8A5A12", borderRadius: 6, padding: "8px 11px", fontSize: 12.5, fontWeight: 700, marginBottom: 14 }}>
              ⚠ Offene Rückfrage – wartet auf Antwort der Anlage.
            </div>
          )}

          {canChangeStatus(role) ? (
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {["offen", "in Bearbeitung", "behoben"].map((s) => (
                <button key={s} onClick={() => setStatus(s)} style={{ padding: "7px 14px", borderRadius: 6, fontSize: 13, cursor: "pointer", fontWeight: 700, border: `1.5px solid ${statusColor(s)}`, background: r.status === s ? statusColor(s) : C.white, color: r.status === s ? C.white : statusColor(s) }}>{s}</button>
              ))}
            </div>
          ) : (
            <div style={{ marginBottom: 16, fontSize: 13.5 }}>
              <span style={{ color: MUTED }}>Status: </span>
              <span style={{ fontWeight: 700, color: statusColor(r.status) }}>{r.status}</span>
            </div>
          )}

          {/* Stammdaten generisch aus dem Schema */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 18px", fontSize: 13.5, marginBottom: 16 }}>
            {gridFields.map((fld) => <Kv key={fld.key} k={fld.label} v={fld.value} />)}
          </div>

          {(r.depts?.length > 0 || r.helpDepts?.length > 0 || r.recipients?.length > 0) && (
            <div style={{ marginBottom: 16, fontSize: 13, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
              {r.depts?.length > 0 && <span style={{ color: MUTED }}>Benachrichtigt:</span>}
              {(r.depts || []).map((d) => <DeptTag key={d}>{deptLabel(d)}</DeptTag>)}
              {r.helpDepts?.length > 0 && <span style={{ color: MUTED, marginLeft: 8 }}>Hilfe:</span>}
              {(r.helpDepts || []).map((d) => <DeptTag key={"h" + d}>{deptLabel(d)}</DeptTag>)}
              {r.recipients?.length > 0 && <span style={{ color: MUTED, marginLeft: 8 }}>Personen: {r.recipients.length}</span>}
            </div>
          )}

          {r.measures && !editing && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 3 }}>Maßnahmen / Bemerkungen</div>
              <div style={{ fontSize: 13.5, background: "#F4F8FB", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "8px 10px", whiteSpace: "pre-wrap" }}>{r.measures}</div>
            </div>
          )}

          {/* Anhänge */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Anhänge</div>
            {canEdit(role) ? (
              <AttachmentPicker value={r.attachments || []} onChange={setAttachments} compact />
            ) : (r.attachments || []).length ? (
              <AttachmentView items={r.attachments} />
            ) : (
              <span style={{ fontSize: 12.5, color: MUTED }}>– keine –</span>
            )}
          </div>

          {editable && !editing && (
            <div style={{ marginBottom: 16 }}>
              <Button variant="ghost" onClick={enterEdit} style={{ padding: "7px 16px", fontSize: 13.5 }}>✎ Bearbeiten</Button>
            </div>
          )}

          {editing && (
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: 14, marginBottom: 16, background: "#FAFCFE" }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: C.navy, marginBottom: 10 }}>
                Meldung bearbeiten <span style={{ fontWeight: 400, color: MUTED }}>(Meldungstyp bleibt fix)</span>
              </div>

              <Field label="Maßnahmen / Bemerkungen (Nachtrag)">
                <textarea rows={3} value={eState.measures} onChange={(e) => eSet("measures", e.target.value)} style={{ ...inputStyle, resize: "vertical" }} placeholder="Maßnahmen / Zwischenstände ergänzen …" />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
                {editDefs.map((fd) => (
                  <Field key={fd.key} label={fd.label}>
                    {fd.kind === "select" ? (
                      <select value={eState[fd.key]} onChange={(e) => eSet(fd.key, e.target.value)} style={inputStyle}>
                        {fd.options.map((o) => <option key={o} value={o}>{o === "" ? "–" : o}</option>)}
                      </select>
                    ) : fd.kind === "datetime" ? (
                      <input type="datetime-local" value={eState[fd.key]} onChange={(e) => eSet(fd.key, e.target.value)} style={inputStyle} />
                    ) : (
                      <input type={fd.kind === "number" ? "number" : "text"} value={eState[fd.key]} onChange={(e) => eSet(fd.key, e.target.value)} style={inputStyle} />
                    )}
                  </Field>
                ))}
              </div>

              <label style={{ display: "flex", gap: 9, alignItems: "flex-start", cursor: updateRecipients.length ? "pointer" : "not-allowed", fontSize: 13, margin: "8px 0 12px", opacity: updateRecipients.length ? 1 : 0.55 }}>
                <input type="checkbox" disabled={!updateRecipients.length} checked={sendUpdateMail && updateRecipients.length > 0} onChange={(e) => setSendUpdateMail(e.target.checked)} style={{ marginTop: 2, width: 16, height: 16 }} />
                <span>
                  <b>Beteiligte per E-Mail über die Aktualisierung informieren</b>
                  <br />
                  <span style={{ color: MUTED, fontSize: 12 }}>
                    {updateRecipients.length ? `Änderungen werden hervorgehoben. Empfänger: ${updateRecipients.length}.` : "Keine Empfänger hinterlegt – keine Update-Mail möglich."}
                  </span>
                </span>
              </label>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                <Button variant="ghost" onClick={() => setEditing(false)} disabled={busy} style={{ padding: "7px 16px", fontSize: 13.5 }}>Abbrechen</Button>
                <Button onClick={saveEdit} disabled={busy} style={{ padding: "7px 18px", fontSize: 13.5 }}>{busy ? "Wird gesendet …" : "Änderungen speichern"}</Button>
              </div>
            </div>
          )}

          {/* Hilfe anfordern (nur Anlage): Abteilungen + einzelne Personen */}
          {canRequestHelp(role) && (
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Hilfe anfordern</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                {DEPARTMENTS.map((d) => (
                  <Pill key={d.key} active={helpSel.includes(d.key)} onClick={() => toggleHelp(d.key)}>{d.label}</Pill>
                ))}
              </div>
              <div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>Einzelne Personen:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                {CONTACTS.map((c) => (
                  <Pill key={c.key} active={helpPeople.includes(c.email)} onClick={() => toggleHelpPerson(c.email)}>{c.label}</Pill>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, maxWidth: 420, marginBottom: 10 }}>
                <input value={helpDraft} onChange={(e) => setHelpDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHelpDraft())} placeholder="weitere E-Mail-Adresse …" style={{ ...inputStyle, flex: 1 }} />
                <Button variant="ghost" onClick={addHelpDraft} style={{ padding: "7px 14px", fontSize: 13 }}>+ </Button>
              </div>
              {helpPeople.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {helpPeople.map((e) => (
                    <span key={e} style={{ fontSize: 12, background: C.panelBg, color: C.navy, padding: "3px 8px", borderRadius: 10 }}>{e}</span>
                  ))}
                </div>
              )}
              <Button onClick={requestHelp} disabled={(!helpSel.length && !helpPeople.length) || busy} style={{ padding: "8px 18px", fontSize: 13.5 }}>
                {busy ? "Wird gesendet …" : "Hilfe anfordern"}
              </Button>
            </div>
          )}

          {/* Verlauf – einklappbar, Standard: eingeklappt */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: C.navy }}>Verlauf ({log.length})</span>
            {log.length > 1 && (
              <button onClick={toggleAllEntries} style={{ border: "none", background: "transparent", color: C.navy, cursor: "pointer", fontSize: 12, textDecoration: "underline" }}>
                {allOpen ? "Alle einklappen" : "Alle ausklappen"}
              </button>
            )}
          </div>
          <div style={{ borderLeft: `2px solid ${BORDER}`, paddingLeft: 12, marginBottom: 14 }}>
            {log.map((l, i) => {
              const k = KIND[l.kind] || KIND.note;
              const open = expanded.has(i);
              return (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div onClick={() => toggleEntry(i)} style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
                    <span style={{ fontSize: 10, color: MUTED, width: 10 }}>{open ? "▾" : "▸"}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, background: k.bg, color: k.color, padding: "1px 7px", borderRadius: 8 }}>{k.label}</span>
                    <span style={{ fontSize: 11.5, color: MUTED, whiteSpace: "nowrap" }}>{fmt(l.t)}{l.by ? ` · ${l.by}` : ""}</span>
                    {!open && <span style={{ fontSize: 12.5, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>— {preview(l.txt)}</span>}
                  </div>
                  {open && <div style={{ fontSize: 13.5, whiteSpace: "pre-wrap", margin: "3px 0 0 26px" }}>{l.txt}</div>}
                </div>
              );
            })}
          </div>

          {canRaiseQuery(role) && (
            <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <input value={queryText} onChange={(e) => setQueryText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendQuery()} placeholder="Rückfrage an die Anlage stellen …" style={{ flex: 1, padding: "8px 10px", border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 13.5, fontFamily: "Arial" }} />
              <Button onClick={sendQuery} disabled={busy} style={{ padding: "8px 18px", fontSize: 13.5 }}>{busy ? "…" : "Rückfrage senden"}</Button>
            </div>
          )}

          {isAnlage(role) && openQuery && (
            <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <input value={answerText} onChange={(e) => setAnswerText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendAnswer()} placeholder="Auf Rückfrage antworten …" style={{ flex: 1, padding: "8px 10px", border: `1px solid #1E8E5A`, borderRadius: 6, fontSize: 13.5, fontFamily: "Arial" }} />
              <Button onClick={sendAnswer} style={{ padding: "8px 18px", fontSize: 13.5 }}>Antworten</Button>
            </div>
          )}

          {isAnlage(role) && (
            <div style={{ display: "flex", gap: 8 }}>
              <input value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addNote()} placeholder="Zwischenstand / Notiz ergänzen …" style={{ flex: 1, padding: "8px 10px", border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 13.5, fontFamily: "Arial" }} />
              <Button variant="ghost" onClick={addNote} style={{ padding: "8px 18px", fontSize: 13.5 }}>Hinzufügen</Button>
            </div>
          )}

          <p style={{ fontSize: 11.5, color: MUTED, marginTop: 10 }}>
            {isDept(role)
              ? "Als Abteilung kannst du Rückfragen stellen; bearbeiten/abschließen kann nur die Anlage."
              : "Die Meldung lebt über die gesamte Bearbeitung – Zwischenstände werden zentral und schichtübergreifend ergänzt, ohne den Versand zu blockieren."}
          </p>
        </div>
      </div>
    </div>
  );
}
