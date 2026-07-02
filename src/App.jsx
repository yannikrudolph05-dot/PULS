import React, { useState, useEffect } from "react";
import { C, TEXT } from "./theme.js";
import { useReports } from "./data/useReports.js";
import { roleById, canCreate } from "./config.js";
import Header from "./components/Header.jsx";
import DemoBanner from "./components/DemoBanner.jsx";
import Login from "./components/Login.jsx";
import Board from "./components/Board.jsx";
import NewReport from "./components/NewReport.jsx";
import Detail from "./components/Detail.jsx";
import Stats from "./components/Stats.jsx";

const ROLE_KEY = "stoerungsmelder.role";

export default function App() {
  const data = useReports();

  // Aktuelle Rolle (Funktion 1) – wird im localStorage gemerkt.
  const [role, setRole] = useState(() => {
    try {
      const id = localStorage.getItem(ROLE_KEY);
      return id ? roleById(id) || null : null;
    } catch {
      return null;
    }
  });

  const [view, setView] = useState("board"); // board | new | stats
  const [plant, setPlant] = useState("LS3");
  const [detail, setDetail] = useState(null); // id der geöffneten Meldung
  const [flash, setFlash] = useState(null); // kurze Rückmeldung (Toast)

  // Kurze Rückmeldung anzeigen (z. B. E-Mail-Ergebnis).
  const notify = (msg) => {
    setFlash(msg);
    window.clearTimeout(notify._t);
    notify._t = window.setTimeout(() => setFlash(null), 5000);
  };

  // Rolle wählen / wechseln.
  const pickRole = (r) => {
    setRole(r);
    try {
      localStorage.setItem(ROLE_KEY, r.id);
    } catch {
      /* Persistenz optional */
    }
    setView("board");
    setDetail(null);
  };
  const switchRole = () => {
    setRole(null);
    try {
      localStorage.removeItem(ROLE_KEY);
    } catch {
      /* egal */
    }
  };

  // Sicherheitsnetz: Abteilungs-Rolle darf nicht in der "Neue Meldung"-Ansicht landen.
  useEffect(() => {
    if (view === "new" && !canCreate(role)) setView("board");
  }, [view, role]);

  // Noch nicht angemeldet -> Login-Bildschirm.
  if (!role) {
    return <Login onPick={pickRole} onReset={data.reset} />;
  }

  return (
    <div style={{ fontFamily: "Arial, sans-serif", background: C.pageBg, minHeight: "100vh", color: TEXT }}>
      <Header view={view} setView={setView} role={role} onSwitchRole={switchRole} data={data} notify={notify} />

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "18px 20px 60px" }}>
        <DemoBanner />

        {view === "new" && canCreate(role) && (
          <NewReport plant={plant} setPlant={setPlant} data={data} role={role} notify={notify} onDone={() => setView("board")} />
        )}
        {view === "board" && <Board data={data} role={role} onOpen={setDetail} goNew={() => setView("new")} />}
        {view === "stats" && <Stats reports={data.reports} />}
      </div>

      {detail && (
        <Detail
          r={data.reports.find((x) => x.id === detail)}
          data={data}
          role={role}
          notify={notify}
          onClose={() => setDetail(null)}
        />
      )}

      {/* Toast: kurze Rückmeldung unten rechts */}
      {flash && (
        <div
          style={{
            position: "fixed",
            right: 18,
            bottom: 18,
            background: C.navy,
            color: C.white,
            padding: "11px 16px",
            borderRadius: 8,
            fontSize: 13.5,
            maxWidth: 420,
            boxShadow: "0 6px 20px rgba(10,30,55,0.35)",
            zIndex: 80,
          }}
        >
          {flash}
        </div>
      )}
    </div>
  );
}
