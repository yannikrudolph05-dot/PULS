import React from "react";

// Durchgängiger Hinweis: alles sind erfundene Demo-Daten.
export default function DemoBanner() {
  return (
    <div
      style={{
        background: "#FCEFD3",
        border: "1px solid #E8C46A",
        borderRadius: 6,
        padding: "7px 12px",
        fontSize: 12.5,
        color: "#7A5A12",
        marginBottom: 14,
      }}
    >
      Prototyp – alle Meldungen sind erfundene Demo-Daten. Datenhaltung im Browser
      (localStorage), keine SharePoint-Anbindung. Die Datenschicht ist für eine
      spätere SharePoint-Integration vorbereitet.
    </div>
  );
}
