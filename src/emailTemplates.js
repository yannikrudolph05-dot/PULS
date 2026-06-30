// ============================================================================
//  src/emailTemplates.js  –  HTML-Aufbau der versendeten E-Mails.
//  Design im Stil der echten Outlook-Vorlagen (Titelkopf, beschriftete
//  Feld-Tabelle, Abschnitt "Ergriffene Maßnahmen, Bemerkungen", Firmen-Footer).
//  Die Felder kommen aus dem zentralen Schema (fields.js) -> neue Meldungstypen
//  erscheinen automatisch auch in den Mails.
//
//  Der HTML-Text landet im EmailJS-Platzhalter und muss dort als {{{message}}}
//  (drei Klammern) eingebunden sein, damit er als HTML dargestellt wird.
// ============================================================================
import { APP_PARENT, APP_NAME } from "./config.js";
import { reportDisplayFields } from "./fields.js";

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// Eine Tabellenzeile (Label links, Wert rechts). highlight = gelb markiert.
function row(label, value, highlight) {
  const labelBg = highlight ? "#FFF1C2" : "#F1F6FA";
  const valBg = highlight ? "#FFF8DD" : "#FFFFFF";
  const mark = highlight ? ' <span style="color:#B8860B;font-weight:bold">◀ neu</span>' : "";
  return (
    `<tr>` +
    `<td style="padding:6px 10px;border:1px solid #D7E5EF;background:${labelBg};font-weight:bold;white-space:nowrap;vertical-align:top">${esc(label)}</td>` +
    `<td style="padding:6px 10px;border:1px solid #D7E5EF;background:${valBg}">${esc(value) || "–"}${mark}</td>` +
    `</tr>`
  );
}

// Feld-Tabelle der Meldung (mit optionaler Hervorhebung geänderter Felder).
function reportTable(r, highlightKeys = []) {
  const rows = reportDisplayFields(r)
    .map((f) => row(f.label, f.value, highlightKeys.includes(f.key)))
    .join("");
  return `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:13px">${rows}</table>`;
}

function measuresBlock(r, highlight) {
  const hl = highlight ? "background:#FFF8DD;border-color:#E8C46A;" : "";
  const content = r.measures ? esc(r.measures) : "<span style='color:#8aa0b0'>– keine Angabe –</span>";
  return (
    `<div style="margin-top:14px">` +
    `<div style="font-size:12px;font-weight:bold;margin-bottom:4px;color:#0A2F5E">Ergriffene Maßnahmen, Bemerkungen${highlight ? ' <span style="color:#B8860B">◀ neu</span>' : ""}</div>` +
    `<div style="font-size:13px;border:1px solid #D7E5EF;border-radius:4px;padding:8px 10px;white-space:pre-wrap;${hl}">${content}</div>` +
    `</div>`
  );
}

// Hinweis auf vorhandene Anhänge (liegen im Cockpit/Ticket).
function attachmentsBlock(r) {
  const a = r.attachments || [];
  if (!a.length) return "";
  const names = a.map((x) => esc(x.name)).join(", ");
  return (
    `<div style="margin-top:12px;font-size:12.5px;color:#3a5a72">` +
    `📎 <b>${a.length} Anhang${a.length > 1 ? "/Anhänge" : ""}</b> im Cockpit: ${names}` +
    `</div>`
  );
}

// Gemeinsamer Rahmen (Titelkopf im Alcon-Navy + Inhalt + Footer).
function shell(titleLine, subtitle, inner) {
  return (
    `<div style="font-family:Arial,Helvetica,sans-serif;color:#10324F;max-width:640px">` +
    `<div style="background:#0A2F5E;color:#ffffff;padding:14px 18px;border-radius:6px 6px 0 0">` +
    `<div style="font-size:11px;letter-spacing:.6px;opacity:.85">${esc(APP_PARENT.toUpperCase())} · ${esc(APP_NAME.toUpperCase())}</div>` +
    `<div style="font-size:18px;font-weight:bold;margin-top:3px">${esc(titleLine)}</div>` +
    (subtitle ? `<div style="font-size:12.5px;opacity:.9;margin-top:3px">${esc(subtitle)}</div>` : "") +
    `</div>` +
    `<div style="border:1px solid #D7E5EF;border-top:none;padding:16px 18px;border-radius:0 0 6px 6px">` +
    inner +
    `<div style="font-size:10.5px;color:#8aa0b0;margin-top:16px;border-top:1px solid #E3EDF4;padding-top:8px;line-height:1.45">` +
    `Automatisch erzeugt vom ${esc(APP_PARENT)} – ${esc(APP_NAME)} (Prototyp). Bitte im Cockpit bearbeiten.<br>` +
    `CIBA VISION GmbH · Industriering 1 · D-63868 Grosswallstadt<br>` +
    `Sitz der Gesellschaft: Grosswallstadt · Registergericht Aschaffenburg HRB 2513` +
    `</div>` +
    `</div>` +
    `</div>`
  );
}

const subtitleOf = (r) => `${r.id} · Status: ${r.status} · Erstmeldung ${reportDate(r)}`;
const reportDate = (r) => reportDisplayFields(r).find((f) => f.key === "created")?.value || "";
const titleOf = (r) => `Meldung ${r.type}${r.particleType ? ` ${r.particleType}` : ""} · ${r.plant}`;

// ---- Öffentliche Builder ---------------------------------------------------

export function buildNewReportEmail(r) {
  const inner =
    `<p style="font-size:13.5px;margin:0 0 12px">Es wurde eine <b>neue Störungsmeldung</b> angelegt:</p>` +
    reportTable(r) +
    measuresBlock(r, false) +
    attachmentsBlock(r);
  return shell(titleOf(r), subtitleOf(r), inner);
}

// changes = [{ key, label, from, to }]
export function buildUpdateEmail(r, changes = []) {
  const highlightKeys = changes.map((c) => c.key);
  const measuresChanged = highlightKeys.includes("measures");
  const changeItems = changes
    .map(
      (c) =>
        `<li style="margin-bottom:3px"><b>${esc(c.label)}:</b> ` +
        (c.from && c.from !== "–"
          ? `<span style="color:#9aa7b0;text-decoration:line-through">${esc(c.from)}</span> → `
          : "") +
        `<b>${esc(c.to)}</b></li>`
    )
    .join("");
  const updateBox =
    `<div style="background:#FFF6D6;border:1px solid #E8C46A;border-radius:6px;padding:10px 12px;margin:0 0 14px">` +
    `<div style="font-weight:bold;font-size:13px;color:#7A5A12;margin-bottom:6px">★ Was wurde nachgetragen / geändert</div>` +
    (changeItems
      ? `<ul style="margin:0;padding-left:18px;font-size:13px">${changeItems}</ul>`
      : `<div style="font-size:13px">Aktualisierung ohne Feldänderung.</div>`) +
    `</div>`;
  const inner =
    `<p style="font-size:13.5px;margin:0 0 12px">Die folgende Meldung wurde <b>aktualisiert</b>. Geänderte Felder sind unten gelb markiert:</p>` +
    updateBox +
    reportTable(r, highlightKeys) +
    measuresBlock(r, measuresChanged) +
    attachmentsBlock(r);
  return shell(`Aktualisierung – ${r.type}${r.particleType ? ` ${r.particleType}` : ""} · ${r.plant}`, subtitleOf(r), inner);
}

export function buildHelpEmail(r, fromLabel) {
  const inner =
    `<p style="font-size:13.5px;margin:0 0 12px"><b>${esc(fromLabel)}</b> bittet um <b>Unterstützung</b> zu folgender Meldung:</p>` +
    reportTable(r) +
    measuresBlock(r, false) +
    attachmentsBlock(r);
  return shell(`Hilfe angefordert – ${r.type} · ${r.plant}`, subtitleOf(r), inner);
}

export function buildQueryEmail(r, fromLabel, question) {
  const qBox =
    `<div style="background:#FBEAD2;border:1px solid #E8C46A;border-radius:6px;padding:10px 12px;margin:0 0 14px">` +
    `<div style="font-weight:bold;font-size:13px;color:#8A5A12;margin-bottom:4px">Rückfrage von ${esc(fromLabel)}</div>` +
    `<div style="font-size:13.5px;white-space:pre-wrap">${esc(question)}</div>` +
    `</div>`;
  const inner = qBox + `<p style="font-size:12.5px;color:#5E7689;margin:0 0 8px">Bezug:</p>` + reportTable(r);
  return shell(`Rückfrage zu ${r.id}`, subtitleOf(r), inner);
}
