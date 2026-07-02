import React, { useState } from "react";
import { C, TEXT, MUTED, BORDER, RED, AMBER, statusColor } from "../theme.js";
import { Panel, Button, Chip, StatusBadge, DeptTag } from "../ui.jsx";
import { ageH, hasOpenQuery } from "../utils/format.js";
import { PLANT_KEYS, isAnlage, isDept, canCreate, deptLabel } from "../config.js";

// Gehört eine Meldung zur angemeldeten Abteilung?
// (benachrichtigt ODER um Hilfe gebeten ODER hat selbst eine Rückfrage gestellt)
function isMine(r, role) {
  if (!isDept(role)) return true;
  const k = role.deptKey;
  if ((r.depts || []).includes(k)) return true;
  if ((r.helpDepts || []).includes(k)) return true;
  return (r.log || []).some((l) => l.kind === "query" && l.by === role.label);
}

export default function Board({ data, role, onOpen, goNew }) {
  const [pFilter, setPFilter] = useState("alle"); // Anlage
  const [sFilter, setSFilter] = useState("aktiv"); // Status
  const [mineOnly, setMineOnly] = useState(false); // nur Abteilungs-Rollen

  const rows = data.reports.filter((r) => {
    if (pFilter !== "alle" && r.plant !== pFilter) return false;
    if (sFilter === "aktiv" && r.status === "behoben") return false;
    if (isDept(role) && mineOnly && !isMine(r, role)) return false;
    return true;
  });

  const openCount = data.reports.filter((r) => r.status !== "behoben").length;

  return (
    <Panel
      title={`Live-Board – offene Störungsmeldungen (${openCount} aktiv)`}
      right={
        canCreate(role) ? (
          <Button onClick={goNew} style={{ padding: "7px 16px", fontSize: 13.5 }}>
            + Neue Meldung
          </Button>
        ) : null
      }
    >
      <p style={{ margin: "0 0 12px", fontSize: 12.5, color: MUTED }}>
        Diese Live-Übersicht ersetzt die manuell getippte „Problemmeldung an QA" –
        sie zeigt automatisch alle aktuell offenen Fälle beider Anlagen.
        {isDept(role) && " Als Abteilung hast du Lesezugriff und kannst Rückfragen stellen."}
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <Chip active={pFilter === "alle"} onClick={() => setPFilter("alle")}>Alle Anlagen</Chip>
        {PLANT_KEYS.map((p) => (
          <Chip key={p} active={pFilter === p} onClick={() => setPFilter(p)}>{p}</Chip>
        ))}
        <span style={{ width: 1, height: 22, background: BORDER, margin: "0 4px" }} />
        <Chip active={sFilter === "aktiv"} onClick={() => setSFilter("aktiv")}>Nur aktive</Chip>
        <Chip active={sFilter === "alle"} onClick={() => setSFilter("alle")}>Inkl. behobene</Chip>

        {/* Abteilungs-Filter (Funktion 7): "Alle" <-> "Nur meine benachrichtigten" */}
        {isDept(role) && (
          <>
            <span style={{ width: 1, height: 22, background: BORDER, margin: "0 4px" }} />
            <Chip active={!mineOnly} onClick={() => setMineOnly(false)}>Alle Meldungen</Chip>
            <Chip active={mineOnly} onClick={() => setMineOnly(true)}>
              Nur meine ({deptLabel(role.deptKey)})
            </Chip>
          </>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 12 }}>
        {rows.map((r) => {
          const old = ageH(r.created) > 24 && r.status !== "behoben";
          const query = hasOpenQuery(r);
          return (
            <div
              key={r.id}
              onClick={() => onOpen(r.id)}
              className="puls-card"
              style={{
                border: `1px solid ${query ? AMBER : BORDER}`,
                borderLeft: `4px solid ${statusColor(r.status)}`,
                borderRadius: 8,
                padding: "13px 13px 13px 11px",
                cursor: "pointer",
                background: "#F7FBFD",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                <StatusBadge status={r.status} />
                <span style={{ fontSize: 12, color: MUTED }}>{r.plant} · {r.id}</span>
              </div>

              <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 3 }}>
                {r.type}{r.particleType ? ` – ${r.particleType}` : ""}
              </div>
              <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 8 }}>
                Lot {r.lot || "–"}{r.pm ? ` · ${r.pm}` : ""}{r.cause ? ` · ${r.cause}` : ""}
              </div>

              {/* Marker: offene Rückfrage / Hilfeanforderung */}
              {(query || (r.helpDepts || []).length > 0) && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  {query && (
                    <span style={{ fontSize: 10.5, fontWeight: 700, background: "#FBEAD2", color: "#8A5A12", padding: "2px 7px", borderRadius: 8 }}>
                      ⚠ Rückfrage offen
                    </span>
                  )}
                  {(r.helpDepts || []).length > 0 && (
                    <span style={{ fontSize: 10.5, fontWeight: 700, background: C.panelBg, color: C.navy, padding: "2px 7px", borderRadius: 8 }}>
                      Hilfe angefragt
                    </span>
                  )}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: old ? RED : MUTED, fontWeight: old ? 700 : 400 }}>
                  offen seit {ageH(r.created)} h
                </span>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {(r.depts || []).map((d) => (
                    <DeptTag key={d}>{deptLabel(d)}</DeptTag>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <p style={{ color: MUTED, fontSize: 14 }}>Keine Meldungen für diese Filter.</p>}
      </div>
    </Panel>
  );
}
