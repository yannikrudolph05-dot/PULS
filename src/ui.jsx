// ============================================================================
//  src/ui.jsx  –  Wiederverwendbare, schlichte UI-Bausteine im Cockpit-Stil.
//  Reduziert Wiederholung in den einzelnen Ansichten (Eingabefelder, Buttons,
//  Chips, Badges, Panel-Rahmen ...).
// ============================================================================
import React from "react";
import { C, TEXT, MUTED, BORDER, statusColor } from "./theme.js";

// Einheitlicher Stil für Eingabefelder/Dropdowns.
export const inputStyle = {
  width: "100%",
  padding: "7px 9px",
  border: `1px solid ${BORDER}`,
  borderRadius: 5,
  fontSize: 13.5,
  boxSizing: "border-box",
  fontFamily: "Arial",
  background: C.white,
};

// Feld = Label + Eingabe-Element darunter.
export function Field({ label, children, full }) {
  return (
    <div style={{ marginBottom: 12, gridColumn: full ? "1 / -1" : undefined }}>
      <label style={{ fontSize: 12.5, fontWeight: 700, color: TEXT, marginBottom: 3, display: "block" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// Schlüssel-Wert-Zeile (Detailansicht).
export const Kv = ({ k, v }) => (
  <div>
    <span style={{ color: MUTED }}>{k}: </span>
    <span style={{ fontWeight: 700 }}>{v}</span>
  </div>
);

// Panel-Rahmen mit Titelzeile und optionalem Element rechts.
export function Panel({ title, right, children }) {
  return (
    <div className="puls-panel" style={{ background: C.white, border: `1px solid ${BORDER}`, borderRadius: 8, marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "11px 16px",
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 15, color: C.navy }}>{title}</span>
        {right}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

// Allgemeiner Button. variant: "primary" (navy) | "ghost" (weiß mit Rahmen).
export function Button({ variant = "primary", style, ...rest }) {
  const base = {
    padding: "9px 20px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
  };
  const variants = {
    primary: { border: "none", background: C.navy, color: C.white },
    ghost: { border: `1px solid ${BORDER}`, background: C.white, color: TEXT, fontWeight: 400 },
  };
  return <button style={{ ...base, ...variants[variant], ...style }} {...rest} />;
}

// Filter-Chip (an/aus).
export function Chip({ active, children, ...rest }) {
  return (
    <button
      style={{
        padding: "6px 14px",
        borderRadius: 16,
        fontSize: 13,
        cursor: "pointer",
        border: `1px solid ${active ? C.navy : BORDER}`,
        background: active ? C.navy : C.white,
        color: active ? C.white : TEXT,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

// Auswählbarer "Pillen"-Button (z. B. Abteilungen togglen).
export function Pill({ active, children, ...rest }) {
  return (
    <button
      style={{
        padding: "8px 16px",
        borderRadius: 18,
        cursor: "pointer",
        fontSize: 13.5,
        fontWeight: 700,
        border: `1.5px solid ${active ? C.navy : BORDER}`,
        background: active ? C.navy : C.white,
        color: active ? C.white : TEXT,
      }}
      {...rest}
    >
      {active ? "✓ " : ""}
      {children}
    </button>
  );
}

// Farbiges Status-Etikett.
export const StatusBadge = ({ status }) => (
  <span
    style={{
      background: statusColor(status),
      color: C.white,
      fontSize: 11,
      fontWeight: 700,
      padding: "3px 9px",
      borderRadius: 10,
    }}
  >
    {status}
  </span>
);

// Kleines Abteilungs-Etikett.
export const DeptTag = ({ children }) => (
  <span
    style={{
      fontSize: 10.5,
      background: C.panelBg,
      color: C.navy,
      padding: "2px 6px",
      borderRadius: 8,
    }}
  >
    {children}
  </span>
);
