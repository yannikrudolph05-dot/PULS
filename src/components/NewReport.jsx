import React, { useState } from "react";
import { C, TEXT, MUTED, BORDER } from "../theme.js";
import { Panel, Button, Pill, Field, inputStyle } from "../ui.jsx";
import { sendMail } from "../email.js";
import { buildNewReportEmail } from "../emailTemplates.js";
import { typeFieldDefs } from "../fields.js";
import { AttachmentPicker } from "./Attachments.jsx";
import {
  PLANTS,
  PLANT_KEYS,
  DEPARTMENTS,
  CONTACTS,
  APP_NAME,
  deptEmails,
  deptLabels,
} from "../config.js";

const isEmail = (s) => /\S+@\S+\.\S+/.test(s);

// Kleine Abschnitts-Überschrift, um das Formular in benannte Gruppen zu
// gliedern (Icon + Label + dezente Trennlinie), statt einer langen Feldliste.
function SectionHeader({ icon, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: C.navy, textTransform: "uppercase", letterSpacing: 0.4, margin: "4px 0 10px", gridColumn: "1 / -1" }}>
      {icon}
      {children}
    </div>
  );
}
const IconPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const IconAlert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconPaperclip = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

// Generisches Eingabefeld nach Schema (text/number/select).
function FieldInput({ fd, value, onChange }) {
  if (fd.kind === "select") {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
        {fd.options.map((o) => (
          <option key={o} value={o}>{o === "" ? "–" : o}</option>
        ))}
      </select>
    );
  }
  return (
    <input
      type={fd.kind === "number" ? "number" : "text"}
      min={fd.kind === "number" ? "0" : undefined}
      placeholder={fd.placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={inputStyle}
    />
  );
}

// Neue Störungsmeldung anlegen (nur Rolle "An der Anlage").
export default function NewReport({ plant, setPlant, data, role, onDone, notify }) {
  const cfg = PLANTS[plant];
  const [type, setType] = useState(cfg.types[0]);
  const [f, setF] = useState({}); // gesammelte Feldwerte
  const [depts, setDepts] = useState([]); // im Cockpit benachrichtigte Abteilungen
  const [sendEmailDepts, setSendEmailDepts] = useState(true); // Abteilungen auch per E-Mail?
  const [people, setPeople] = useState([]); // einzelne E-Mail-Empfänger
  const [emailDraft, setEmailDraft] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const defs = typeFieldDefs(plant, type);

  const switchPlant = (p) => {
    setPlant(p);
    setType(PLANTS[p].types[0]);
    setF({});
  };
  const switchType = (t) => {
    setType(t);
    setF({}); // Felder beim Typwechsel zurücksetzen (andere Felder)
  };

  const toggleDept = (key) =>
    setDepts((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  const allKeys = DEPARTMENTS.map((d) => d.key);
  const allSelected = depts.length === allKeys.length;
  const toggleAll = () => setDepts(allSelected ? [] : allKeys);

  const togglePerson = (email) =>
    setPeople((prev) => (prev.includes(email) ? prev.filter((x) => x !== email) : [...prev, email]));
  const addDraftEmail = () => {
    const e = emailDraft.trim();
    if (isEmail(e) && !people.includes(e)) setPeople((p) => [...p, e]);
    setEmailDraft("");
  };

  // Tatsächliche E-Mail-Empfänger = (Abteilungen, falls aktiviert) + Personen.
  const emailRecipients = [...new Set([...(sendEmailDepts ? deptEmails(depts) : []), ...people])];
  const willMail = emailRecipients.length > 0;

  const submit = async () => {
    setSending(true);

    // Zahlenfelder von String -> Number normalisieren.
    const cleanF = { ...f };
    defs.forEach((fd) => {
      if (fd.kind === "number") {
        cleanF[fd.key] = cleanF[fd.key] === "" || cleanF[fd.key] == null ? undefined : Number(cleanF[fd.key]);
      }
    });

    const now = new Date().toISOString();
    const parts = [];
    if (depts.length) parts.push("Benachrichtigt: " + deptLabels(depts));
    if (willMail) parts.push(`E-Mail an ${emailRecipients.length} Empfänger`);
    const createTxt =
      "Meldung angelegt." + (parts.length ? " " + parts.join(" · ") + "." : " Nur ins Cockpit hochgeladen.");

    const report = data.add({
      plant,
      type,
      status: "offen",
      depts,
      recipients: people,
      attachments,
      ...cleanF,
      particleType: type === "Partikelfund" ? f.particleType || cfg.particleOptions[0] : undefined,
      log: [{ t: now, kind: "create", by: role.label, txt: createTxt }],
    });

    if (willMail) {
      const res = await sendMail({
        toEmails: emailRecipients,
        subject: `[${APP_NAME}] Neue Meldung ${report.id} – ${plant} – ${type}`,
        message: buildNewReportEmail(report),
      });
      data.addLog(report.id, res.info, "mail");
      notify(res.ok ? "✓ " + res.info : "⚠ " + res.info);
    } else if (depts.length) {
      notify(`Meldung ${report.id} angelegt – im Cockpit benachrichtigt (ohne E-Mail).`);
    } else {
      notify(`Meldung ${report.id} angelegt (nur Cockpit).`);
    }

    setSending(false);
    onDone();
  };

  return (
    <>
      {/* Anlagen-Tabs (strikt getrennt wie im Cockpit) */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {PLANT_KEYS.map((p) => (
          <button
            key={p}
            onClick={() => switchPlant(p)}
            style={{
              padding: "8px 22px",
              border: `1px solid ${BORDER}`,
              borderRadius: 6,
              cursor: "pointer",
              background: plant === p ? C.navy : C.white,
              color: plant === p ? C.white : TEXT,
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {PLANTS[p].label}
          </button>
        ))}
      </div>

      <Panel title={`Neue Störungsmeldung · ${cfg.label}`}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
          <SectionHeader icon={<IconPin />}>Meldungstyp &amp; Zeitpunkt</SectionHeader>

          <Field label="Meldungstyp">
            <select value={type} onChange={(e) => switchType(e.target.value)} style={inputStyle}>
              {cfg.types.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>

          {/* Partikelfund: EIN Typ + Fundort-Dropdown statt vieler Vorlagen */}
          {type === "Partikelfund" && (
            <Field label="Partikel-Typ / Fundort">
              <select
                value={f.particleType || cfg.particleOptions[0]}
                onChange={(e) => set("particleType", e.target.value)}
                style={inputStyle}
              >
                {cfg.particleOptions.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Entdeckt am">
            <input
              type="datetime-local"
              style={inputStyle}
              onChange={(e) => set("discoveredAt", e.target.value ? new Date(e.target.value).toISOString() : undefined)}
            />
          </Field>

          {defs.length > 0 && (
            <>
              <div style={{ gridColumn: "1 / -1", borderTop: `1px dashed ${BORDER}`, margin: "6px 0 14px" }} />
              <SectionHeader icon={<IconAlert />}>Details zum Fehler</SectionHeader>
              {/* Typ-spezifische Felder generisch aus dem Schema */}
              {defs.map((fd) => (
                <Field key={fd.key} label={fd.label}>
                  <FieldInput fd={fd} value={f[fd.key] ?? ""} onChange={(v) => set(fd.key, v)} />
                </Field>
              ))}
            </>
          )}

          <div style={{ gridColumn: "1 / -1", borderTop: `1px dashed ${BORDER}`, margin: "6px 0 14px" }} />
          <SectionHeader icon={<IconPaperclip />}>Beschreibung &amp; Anhänge</SectionHeader>
        </div>

        <Field label="Erste Beschreibung / ergriffene Maßnahmen (kann später ergänzt werden)" full>
          <textarea
            rows={2}
            style={{ ...inputStyle, resize: "vertical" }}
            placeholder="Optional bei Erstmeldung – wird über die Bearbeitungsdauer ergänzt."
            onChange={(e) => set("measures", e.target.value)}
          />
        </Field>

        <Field label="Anhänge (PDF/Bilder, optional)" full>
          <AttachmentPicker value={attachments} onChange={setAttachments} />
        </Field>
      </Panel>

      {/* Benachrichtigung: (1) im Cockpit, (2) per E-Mail an Abteilungen + Personen */}
      <Panel title="Benachrichtigung">
        <p style={{ margin: "0 0 10px", fontSize: 13, color: MUTED }}>
          Ohne Auswahl wird die Meldung nur ins Cockpit hochgeladen (erscheint im
          Live-Board für alle). Angehakte Abteilungen sehen sie zusätzlich in ihrer
          Ansicht „Nur meine".
        </p>

        <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Abteilungen benachrichtigen (im Cockpit)</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Pill active={allSelected} onClick={toggleAll}>Alle</Pill>
          <span style={{ width: 1, background: BORDER, margin: "2px 4px" }} />
          {DEPARTMENTS.map((d) => (
            <Pill key={d.key} active={depts.includes(d.key)} onClick={() => toggleDept(d.key)}>
              {d.label}
            </Pill>
          ))}
        </div>

        {/* E-Mail-Empfänger getrennt: Abteilungen optional + einzelne Personen */}
        <div style={{ marginTop: 16, borderTop: `1px dashed ${BORDER}`, paddingTop: 12 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Per E-Mail informieren</div>

          {depts.length > 0 && (
            <label style={{ display: "flex", gap: 9, alignItems: "flex-start", cursor: "pointer", fontSize: 13.5, marginBottom: 10 }}>
              <input type="checkbox" checked={sendEmailDepts} onChange={(e) => setSendEmailDepts(e.target.checked)} style={{ marginTop: 2, width: 16, height: 16 }} />
              <span>
                <b>Ausgewählte Abteilungen auch per E-Mail</b>
                <br />
                <span style={{ color: MUTED, fontSize: 12 }}>
                  {sendEmailDepts ? `geht an: ${deptLabels(depts)}` : "Abteilungen nur im Cockpit, keine E-Mail an sie"}
                </span>
              </span>
            </label>
          )}

          <div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>
            Einzelne Personen (eine Mail geht an alle gleichzeitig):
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
            {CONTACTS.map((c) => (
              <Pill key={c.key} active={people.includes(c.email)} onClick={() => togglePerson(c.email)}>
                {c.label}
              </Pill>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, maxWidth: 420 }}>
            <input
              value={emailDraft}
              onChange={(e) => setEmailDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDraftEmail())}
              placeholder="weitere E-Mail-Adresse …"
              style={{ ...inputStyle, flex: 1 }}
            />
            <Button variant="ghost" onClick={addDraftEmail} style={{ padding: "7px 14px", fontSize: 13 }}>+ hinzufügen</Button>
          </div>
          {people.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {people.map((e) => (
                <span key={e} style={{ fontSize: 12, background: C.panelBg, color: C.navy, padding: "3px 8px", borderRadius: 10, display: "inline-flex", gap: 6, alignItems: "center" }}>
                  {e}
                  <button onClick={() => togglePerson(e)} style={{ border: "none", background: "transparent", color: C.navy, cursor: "pointer", fontSize: 14, lineHeight: 1 }}>×</button>
                </span>
              ))}
            </div>
          )}

          <p style={{ margin: "10px 0 0", fontSize: 12, color: MUTED }}>
            {willMail ? `E-Mail-Empfänger gesamt: ${emailRecipients.length}` : "Aktuell keine E-Mail-Empfänger."}
          </p>
        </div>
      </Panel>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Button variant="ghost" onClick={onDone} disabled={sending}>Abbrechen</Button>
        <Button onClick={submit} disabled={sending}>
          {sending
            ? "Wird gesendet …"
            : willMail
            ? `Meldung anlegen & ${emailRecipients.length} per E-Mail`
            : depts.length > 0
            ? `Meldung anlegen & ${depts.length} benachrichtigen`
            : "Meldung anlegen"}
        </Button>
      </div>
    </>
  );
}
