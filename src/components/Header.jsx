import React from "react";
import { C } from "../theme.js";
import { canCreate, APP_NAME, APP_PARENT } from "../config.js";
import Backup from "./Backup.jsx";

// Kopfzeile im GWS-Cockpit-Stil: Titel links, Navigation mittig, rechts die
// aktuelle Rolle samt Wechsel-Möglichkeit und die Alcon-Wortmarke.
export default function Header({ view, setView, role, onSwitchRole, data, notify }) {
  const tab = (id, label) => (
    <button
      onClick={() => setView(id)}
      style={{
        background: view === id ? C.white : "transparent",
        color: view === id ? C.navy : C.white,
        border: "1px solid rgba(255,255,255,0.4)",
        borderRadius: 6,
        padding: "7px 16px",
        marginLeft: 8,
        cursor: "pointer",
        fontSize: 14,
        fontWeight: view === id ? 700 : 400,
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        background: C.headerBg,
        color: C.white,
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ fontSize: 19, fontWeight: 700 }}>{APP_NAME}</span>
        <span style={{ fontSize: 13, opacity: 0.8 }}>· {APP_PARENT}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
        {tab("board", "Live-Board")}
        {/* "Neue Meldung" nur für die Rolle "An der Anlage" sichtbar. */}
        {canCreate(role) && tab("new", "Neue Meldung")}
        {tab("stats", "Statistik")}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Backup data={data} canImport={canCreate(role)} notify={notify} />
        <div style={{ textAlign: "right", lineHeight: 1.2 }}>
          <div style={{ fontSize: 10.5, opacity: 0.75 }}>Angemeldet als</div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{role.label}</div>
        </div>
        <button
          onClick={onSwitchRole}
          title="Rolle wechseln"
          style={{
            background: "transparent",
            color: C.white,
            border: "1px solid rgba(255,255,255,0.5)",
            borderRadius: 6,
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: 12.5,
          }}
        >
          Rolle wechseln
        </button>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 0.5 }}>Alcon</div>
      </div>
    </div>
  );
}
