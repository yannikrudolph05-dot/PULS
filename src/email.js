// ============================================================================
//  src/email.js  –  EINZIGES Modul für den E-Mail-Versand.
//  Wird überall wiederverwendet: Neue Meldung, Update, Hilfe anfordern, Rückfrage.
//
//  Mehrere Empfänger gleichzeitig: toEmails kann eine LISTE von Adressen sein
//  (Abteilungen UND einzelne Personen) – es wird EINE Mail an alle verschickt,
//  nicht viele Einzelmails.
//
//  Transport gekapselt: Heute EmailJS. Für den späteren EIGENEN OUTLOOK-SERVER
//  (Graph/SMTP) genügt es, sendViaOutlook() auszuprogrammieren und in der Config
//  MAIL_TRANSPORT = "outlook" zu setzen – der restliche Code bleibt unverändert.
//
//  Robust: wirft NIE nach außen, gibt immer { ok, skipped, info } zurück.
// ============================================================================
import emailjs from "@emailjs/browser";
import { EMAILJS, ABSENDER_EMAIL, MAIL_TRANSPORT, APP_NAME } from "./config.js";

// Empfängerliste säubern (leere weg, Duplikate weg) und als String "a, b, c".
export function normalizeRecipients(toEmails) {
  const list = Array.isArray(toEmails) ? toEmails : [toEmails];
  const clean = [...new Set(list.filter((e) => e && String(e).trim()).map((e) => String(e).trim()))];
  return { list: clean, joined: clean.join(", "), count: clean.length };
}

export function emailConfigured() {
  return Boolean(EMAILJS.SERVICE_ID && EMAILJS.TEMPLATE_ID && EMAILJS.PUBLIC_KEY);
}

// ---- Transport 1: EmailJS (aktiv) ------------------------------------------
async function sendViaEmailJS({ to, subject, message, fromName }) {
  if (!emailConfigured()) {
    return { ok: false, skipped: true, info: "E-Mail nicht versendet (Demo/kein Schlüssel)." };
  }
  // Empfänger sowohl als {{email}} als auch {{to_email}} – egal welcher
  // Platzhalter im Template steht. Mehrere Adressen sind kommagetrennt erlaubt.
  await emailjs.send(
    EMAILJS.SERVICE_ID,
    EMAILJS.TEMPLATE_ID,
    {
      email: to,
      to_email: to,
      subject,
      message,
      from_name: fromName,
      from_email: ABSENDER_EMAIL,
      reply_to: ABSENDER_EMAIL,
    },
    { publicKey: EMAILJS.PUBLIC_KEY }
  );
  return { ok: true, skipped: false, info: `E-Mail versendet an ${to}.` };
}

// ---- Transport 2: Outlook (Platzhalter für die interne Anbindung) ----------
//  Hier später den Aufruf eures Outlook-/Graph-Endpunkts einsetzen, z. B.:
//    await fetch("/api/mail", { method:"POST", body: JSON.stringify({to,subject,message}) })
async function sendViaOutlook() {
  return {
    ok: false,
    skipped: true,
    info: "Outlook-Transport noch nicht angebunden (Platzhalter in email.js).",
  };
}

// ---- Öffentliche Versand-Funktion ------------------------------------------
//  toEmails : string | string[]   (ein oder mehrere Empfänger)
//  subject  : string
//  message  : string (HTML)
//  fromName : string
//  attachments (optional): [{ name, type, dataUrl }] – im Ticket gespeichert.
//    Hinweis: Über EmailJS müssten Anhänge im Template als Datei-Variablen
//    konfiguriert werden; im Prototyp bleiben sie am Ticket. Der spätere
//    Outlook-Transport kann sie direkt mitsenden.
export async function sendMail({ toEmails, subject, message, fromName = APP_NAME, attachments }) {
  const { joined: to, count } = normalizeRecipients(toEmails);
  if (!to) return { ok: false, skipped: true, info: "E-Mail nicht versendet (kein Empfänger)." };

  try {
    const payload = { to, subject, message, fromName, attachments, recipientCount: count };
    const res = MAIL_TRANSPORT === "outlook" ? await sendViaOutlook(payload) : await sendViaEmailJS(payload);
    return res;
  } catch (e) {
    // Versand fehlgeschlagen (falscher Schlüssel, Netzwerk ...) -> kein Crash.
    const detail = e?.text || e?.message || "unbekannter Fehler";
    return { ok: false, skipped: false, info: `E-Mail-Versand fehlgeschlagen: ${detail}` };
  }
}
