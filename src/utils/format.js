// ============================================================================
//  src/utils/format.js  –  Datum-, Dauer- und Verlaufs-Hilfsfunktionen.
// ============================================================================
import { deptLabels, deptLabel } from "../config.js";

// Datum/Uhrzeit deutsch und kurz, z. B. "Di, 24.06. 14:30".
export const fmt = (iso) => {
  if (!iso) return "–";
  const d = new Date(iso);
  return d.toLocaleString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Alter einer Meldung in ganzen Stunden seit Erstellung.
export const ageH = (iso) => Math.round((Date.now() - new Date(iso).getTime()) / 3600000);

// Bearbeitungsdauer einer abgeschlossenen Meldung in Stunden
// (Erstmeldung -> behoben). Gibt null zurück, wenn nicht abgeschlossen.
export const durationH = (r) => {
  if (r.status !== "behoben" || !r.resolvedAt || !r.created) return null;
  return (new Date(r.resolvedAt).getTime() - new Date(r.created).getTime()) / 3600000;
};

// Dauer menschenlesbar: "<1 h", "7 h", "2 T 5 h".
export const fmtDuration = (h) => {
  if (h == null) return "–";
  if (h < 1) return "<1 h";
  if (h < 48) return `${Math.round(h)} h`;
  const days = Math.floor(h / 24);
  const rest = Math.round(h % 24);
  return rest > 0 ? `${days} T ${rest} h` : `${days} T`;
};

// Anzahl offener Rückfragen = (Rückfragen) − (Antworten) im Verlauf.
// >0 bedeutet: die Anlage hat noch nicht geantwortet.
export const openQueryCount = (r) => {
  const log = r.log || [];
  const q = log.filter((l) => l.kind === "query").length;
  const a = log.filter((l) => l.kind === "answer").length;
  return Math.max(0, q - a);
};
export const hasOpenQuery = (r) => openQueryCount(r) > 0;

// Kompakter Klartext einer Meldung für den E-Mail-Body.
export const reportText = (r) => {
  const lines = [
    `Meldung: ${r.id}`,
    `Anlage: ${r.plant}`,
    `Typ: ${r.type}${r.particleType ? " – " + r.particleType : ""}`,
    `Status: ${r.status}`,
    r.lot ? `Lot-Nr.: ${r.lot}` : null,
    r.pm ? `PM: ${r.pm}` : null,
    r.pp ? `PP: ${r.pp}` : null,
    r.count != null ? `Betroffene Streifen: ${r.count}` : null,
    r.discovery ? `Entdeckt bei: ${r.discovery}` : null,
    r.cause ? `Ursache: ${r.cause}` : null,
    r.order ? `Auftrag: ${r.order}` : null,
    r.ak ? `Autoklav: ${r.ak}` : null,
    r.depts?.length ? `Benachrichtigt: ${deptLabels(r.depts)}` : null,
    r.measures ? `Maßnahmen/Bemerkungen: ${r.measures}` : null,
  ];
  return lines.filter(Boolean).join("\n");
};

// Re-Export für bequemen Zugriff in Komponenten.
export { deptLabel, deptLabels };
