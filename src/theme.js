// ============================================================================
//  src/theme.js  –  Farbpalette (aus dem GWS-Cockpit-Design abgeleitet)
//  Dunkelblauer Header, hellblaue Akzente, helle Panels. Hier zentral, damit
//  Farben überall identisch sind.
// ============================================================================
export const C = {
  navy: "#0A2F5E",
  navy2: "#0E3B73",
  headerBg: "#0A2F5E",
  tileBg: "#3FA9DD",
  tileBgDark: "#2F8FC4",
  panelBg: "#CFE6F2",
  pageBg: "#BBD9EA",
  white: "#FFFFFF",
  text: "#10324F",
  muted: "#5E7689",
};

export const TEXT = "#10324F";
export const MUTED = "#5E7689";
export const BORDER = "#9FC2D8";
export const RED = "#D8261F";
export const AMBER = "#E8870E";
export const GREEN = "#1E8E5A";

// Statusfarbe je Bearbeitungsstand.
export const statusColor = (s) =>
  s === "offen" ? RED : s === "in Bearbeitung" ? AMBER : GREEN;
