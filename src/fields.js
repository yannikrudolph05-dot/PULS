// ============================================================================
//  src/fields.js  –  Feld-Schema je Meldungstyp (eine Quelle für Formular,
//  Detailansicht UND E-Mail). Eine neue Abfrage hier ergänzen => sie erscheint
//  automatisch beim Anlegen, beim Bearbeiten und in den E-Mails.
//
//  Feldtypen: "text" | "number" | "select" | "datetime"
// ============================================================================
import { fmt } from "./utils/format.js";
import { PLANTS, PP_OPTIONS, DISCOVERY, CAUSES, AK_OPTIONS, INTEGRITY_CAUSES, JA_NEIN } from "./config.js";

const JN = ["", ...JA_NEIN]; // mit Leer-Option für Dropdowns

// Editierbare/abfragbare Felder eines Typs (OHNE den fixen Meldungstyp und
// OHNE particleType – das ist Teil der Fehlerart und bleibt fix).
export function typeFieldDefs(plant, type) {
  const cfg = PLANTS[plant] || { pmOptions: [] };
  switch (type) {
    case "Undichte Blister":
      return [
        { key: "lot", label: "Lot-Nr.", kind: "text", placeholder: "z. B. A4471-22" },
        { key: "pm", label: "PM", kind: "select", options: ["", ...cfg.pmOptions] },
        { key: "pp", label: "PP", kind: "select", options: ["", ...PP_OPTIONS] },
        { key: "count", label: "Anzahl betroffene Blisterstreifen", kind: "number" },
        { key: "discovery", label: "Wo entdeckt?", kind: "select", options: ["", ...DISCOVERY] },
        { key: "cause", label: "Mögliche Fehlerursache", kind: "select", options: ["", ...CAUSES] },
      ];
    case "Partikelfund":
      // PM/Modul ist hier wichtige Pflichtinfo (Anlage – Modul in der Vorlage).
      return [
        { key: "lot", label: "Lot-Nr.", kind: "text", placeholder: "z. B. A4471-22" },
        { key: "pm", label: "Anlage / Modul (PM)", kind: "select", options: ["", ...cfg.pmOptions] },
      ];
    case "Mengenabweichung":
      return [
        { key: "lot", label: "Lot-Nr.", kind: "text" },
        { key: "order", label: "Auftragsnummer", kind: "text", placeholder: "z. B. AO-99312" },
        { key: "causeFound", label: "Ursache gefunden?", kind: "select", options: ["", "Ja", "Nein – mit Frontend ermitteln"] },
      ];
    case "AK-Störungsmitteilung":
      return [
        { key: "ak", label: "Betroffener Autoklav", kind: "select", options: ["", ...AK_OPTIONS] },
        { key: "akRun", label: "Autoklavenlaufnummer", kind: "text" },
      ];
    case "Integritätsverletzungsmitteilung":
      return [
        { key: "integrityCause", label: "Verursacht durch", kind: "select", options: ["", ...INTEGRITY_CAUSES] },
        { key: "affectedEquipment", label: "Betroffene Anlagen", kind: "text", placeholder: "Anlagen benennen" },
        { key: "emptied", label: "Anlagen vorher leergefahren?", kind: "select", options: JN },
        { key: "hygieneZone", label: "Hygienezone (HZ1/HZ2) verletzt?", kind: "select", options: JN },
        { key: "ak", label: "Betroffener Autoklav (falls Prozess abgebrochen)", kind: "select", options: ["", ...AK_OPTIONS] },
        { key: "sopAssessed", label: "Produkt gemäß SOP V-QMS-0037129 bewertet?", kind: "select", options: JN },
      ];
    case "Produktauffälligkeiten":
      return [
        { key: "anomaly", label: "Welche Auffälligkeiten liegen vor?", kind: "text" },
        { key: "order", label: "Betroffener Auftrag", kind: "text" },
        { key: "lot", label: "Betroffene Lots", kind: "text" },
        { key: "magazin", label: "Magazin-Nummer", kind: "text" },
        { key: "quantity", label: "Aussortierte / betroffene Menge", kind: "text" },
        { key: "causeFound", label: "Ursache festgestellt? (Frontend)", kind: "select", options: ["", "Ja", "Nein"] },
        { key: "needs100", label: "100%-Kontrolle notwendig?", kind: "select", options: JN },
        { key: "qab", label: "QAB eröffnen?", kind: "select", options: JN },
      ];
    default:
      return [];
  }
}

// Anzeige-/E-Mail-Felder einer konkreten Meldung in fester Reihenfolge:
// Kopf (Anlage, Status) + die gefüllten Typ-Felder + Zeitstempel.
export function reportDisplayFields(r) {
  const out = [];
  out.push({ key: "plant", label: "Anlage", value: r.plant });
  out.push({ key: "status", label: "Status", value: r.status });
  typeFieldDefs(r.plant, r.type).forEach((d) => {
    const v = r[d.key];
    if (v !== undefined && v !== null && v !== "") out.push({ key: d.key, label: d.label, value: v });
  });
  out.push({ key: "discoveredAt", label: "Entdeckt am", value: r.discoveredAt ? fmt(r.discoveredAt) : "–" });
  out.push({ key: "created", label: "Erstmeldung", value: fmt(r.created) });
  if (r.resolvedAt) out.push({ key: "resolvedAt", label: "Behoben am", value: fmt(r.resolvedAt) });
  return out;
}
