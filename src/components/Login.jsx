import React from "react";
import { C, TEXT, MUTED, BORDER } from "../theme.js";
import { buildRoles, isAnlage, APP_NAME, APP_PARENT, APP_LONG } from "../config.js";

// Einfaches, simuliertes Login (KEINE echten Passwörter): Auswahl der Rolle.
// Die Rollen werden aus der Config erzeugt: "An der Anlage" + je Abteilung eine
// eigene Login-Klasse. Eine neue Abteilung in der Config erscheint hier sofort.
export default function Login({ onPick, onReset }) {
  const roles = buildRoles();
  const anlage = roles.filter(isAnlage);
  const depts = roles.filter((r) => !isAnlage(r));

  const card = (r) => (
    <button
      key={r.id}
      onClick={() => onPick(r)}
      style={{
        textAlign: "left",
        padding: "14px 16px",
        borderRadius: 8,
        cursor: "pointer",
        border: `1.5px solid ${BORDER}`,
        background: C.white,
        color: TEXT,
        fontSize: 14,
        fontWeight: 700,
      }}
    >
      {r.label}
      <div style={{ fontSize: 11.5, fontWeight: 400, color: MUTED, marginTop: 3 }}>
        {isAnlage(r)
          ? "Voller Zugriff: melden, bearbeiten, Status, Hilfe anfordern"
          : "Lesezugriff + Rückfragen stellen"}
      </div>
    </button>
  );

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        background: C.pageBg,
        minHeight: "100vh",
        color: TEXT,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Schlanke Kopfzeile, damit das Cockpit-Branding auch im Login sichtbar ist. */}
      <div
        style={{
          background: C.headerBg,
          color: C.white,
          padding: "12px 24px",
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontSize: 19, fontWeight: 700 }}>{APP_NAME}</span>
          <span style={{ fontSize: 13, opacity: 0.8 }}>· {APP_PARENT}</span>
        </div>
        <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 0.5 }}>Alcon</span>
      </div>

      <div style={{ maxWidth: 720, width: "100%", margin: "40px auto 0", padding: "0 20px" }}>
        <div
          style={{
            background: C.white,
            border: `1px solid ${BORDER}`,
            borderRadius: 10,
            padding: 24,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: C.tileBg, letterSpacing: 0.4, textTransform: "uppercase" }}>
            {APP_NAME} · {APP_LONG}
          </div>
          <h2 style={{ margin: "2px 0 4px", color: C.navy, fontSize: 20 }}>Rolle wählen</h2>
          <p style={{ margin: "0 0 18px", fontSize: 13, color: MUTED }}>
            Prototyp – kein echtes Login. Wähle eine Rolle, um die App aus ihrer
            Sicht zu erleben. Später wird das durch den Windows-Anmeldenamen ersetzt.
          </p>

          <div style={{ fontSize: 12.5, fontWeight: 700, color: TEXT, marginBottom: 8 }}>Anlage</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginBottom: 20 }}>
            {anlage.map(card)}
          </div>

          <div style={{ fontSize: 12.5, fontWeight: 700, color: TEXT, marginBottom: 8 }}>Abteilungen</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {depts.map(card)}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button
            onClick={onReset}
            style={{
              background: "transparent",
              border: "none",
              color: C.navy,
              cursor: "pointer",
              fontSize: 12.5,
              textDecoration: "underline",
            }}
          >
            Demo-Daten zurücksetzen
          </button>
        </div>
      </div>
    </div>
  );
}
