// ============================================================================
//  src/data/useReports.js  –  Gekapselte Datenschicht.
//  Die gesamte App spricht NUR über diesen Hook mit den Daten. Dadurch kann
//  später leicht von "In-Memory + localStorage" auf eine SharePoint-Liste
//  (Power Apps / Microsoft Graph) umgestellt werden – nur dieser Hook ändert
//  sich, die Komponenten bleiben gleich.
//
//  Persistenz: Die Meldungen werden zusätzlich im localStorage des Browsers
//  gespeichert, damit sie einen Reload überleben. Über reset() lassen sich die
//  Demo-Daten neu laden.
// ============================================================================
import { useState, useRef, useEffect } from "react";
import { seedReports } from "./seed.js";
import { deptLabels } from "../config.js";

// Version hochzählen, wenn sich das Datenmodell ändert -> lädt frische Demo-Daten.
const STORAGE_KEY = "stoerungsmelder.reports.v2";

// Beim Start aus dem localStorage laden, sonst frische Demo-Daten erzeugen.
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {
    /* localStorage nicht verfügbar/defekt -> einfach Demo-Daten nehmen */
  }
  return seedReports();
}

function persist(reports) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch {
    /* z. B. privater Modus: Persistenz ist optional, App läuft trotzdem */
  }
}

export function useReports() {
  const [reports, setReports] = useState(load);

  // Spiegel der aktuellen Liste, um synchron die nächste ID berechnen zu können.
  const ref = useRef(reports);
  useEffect(() => {
    ref.current = reports;
    persist(reports);
  }, [reports]);

  // Nächste freie Meldungs-ID ("M-####") aus der höchsten vorhandenen Nummer.
  const nextId = () => {
    const nums = ref.current
      .map((r) => parseInt(String(r.id).replace(/\D/g, ""), 10))
      .filter((n) => !Number.isNaN(n));
    const max = nums.length ? Math.max(...nums) : 2040;
    return "M-" + (max + 1);
  };

  // Neue Meldung anlegen. Gibt die fertige Meldung (inkl. ID) zurück.
  const add = (r) => {
    const id = nextId();
    const now = new Date().toISOString();
    const created = r.created || now;
    const depts = r.depts || [];
    const report = {
      helpDepts: [],
      measures: "",
      ...r,
      id,
      created,
      log: r.log || [
        {
          t: now,
          kind: "create",
          by: "An der Anlage",
          txt:
            "Meldung angelegt." +
            (depts.length ? " Benachrichtigt: " + deptLabels(depts) + "." : " Nur ins Cockpit hochgeladen."),
        },
      ],
    };
    setReports((prev) => [report, ...prev]);
    ref.current = [report, ...ref.current];
    return report;
  };

  // Meldung aktualisieren. Optional gleich einen Verlaufseintrag schreiben.
  //  patch  : Teilobjekt mit zu ändernden Feldern
  //  logTxt : Text für den Verlauf (optional)
  //  kind   : Art des Eintrags ("status"|"edit"|"note"|"mail"|"help"|"query"|"answer")
  //  by     : wer den Eintrag erzeugt hat (Rollen-/Abteilungsname)
  const update = (id, patch = {}, logTxt, kind = "note", by = "An der Anlage") => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const nr = { ...r, ...patch };
        if (logTxt) {
          nr.log = [...(r.log || []), { t: new Date().toISOString(), txt: logTxt, kind, by }];
        }
        return nr;
      })
    );
  };

  // Nur einen Verlaufseintrag hinzufügen (ohne Felder zu ändern).
  const addLog = (id, txt, kind = "note", by = "An der Anlage") => update(id, {}, txt, kind, by);

  // Demo-Daten neu laden (localStorage zurücksetzen).
  const reset = () => {
    const fresh = seedReports();
    setReports(fresh);
    ref.current = fresh;
    persist(fresh);
  };

  return { reports, add, update, addLog, reset };
}
