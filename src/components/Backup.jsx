import React, { useRef, useState } from "react";
import { C } from "../theme.js";

// Backup: alle Meldungen als JSON-Datei sichern / aus einer Sicherung
// wiederherstellen. Übergangslösung, solange es keine echte Datenbank/
// SharePoint-Anbindung gibt (Daten leben sonst nur im Browser).
export default function Backup({ data, canImport, notify }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const onImportClick = () => fileRef.current?.click();

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!window.confirm("Aktuelle Meldungen werden durch den Inhalt der Sicherungsdatei ersetzt. Fortfahren?")) return;
    setBusy(true);
    try {
      const n = await data.importJSON(file);
      notify(`✓ ${n} Meldungen aus Sicherung wiederhergestellt.`);
    } catch (err) {
      notify(`⚠ Import fehlgeschlagen: ${err.message}`);
    }
    setBusy(false);
  };

  const btnStyle = {
    background: "transparent",
    color: C.white,
    border: "1px solid rgba(255,255,255,0.5)",
    borderRadius: 6,
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: 12,
  };

  return (
    <div style={{ display: "flex", gap: 6 }}>
      <button onClick={data.exportJSON} title="Alle Meldungen als JSON-Datei sichern (Backup)" style={btnStyle}>
        ↓ Sichern
      </button>
      {canImport && (
        <>
          <button
            onClick={onImportClick}
            disabled={busy}
            title="Meldungen aus einer JSON-Sicherung wiederherstellen (ersetzt aktuelle Daten)"
            style={btnStyle}
          >
            ↑ Wiederherstellen
          </button>
          <input ref={fileRef} type="file" accept="application/json" onChange={onFileChange} style={{ display: "none" }} />
        </>
      )}
    </div>
  );
}
