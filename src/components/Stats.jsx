import React, { useState, useMemo } from "react";
import { C, TEXT, MUTED, BORDER, RED, GREEN } from "../theme.js";
import { Panel } from "../ui.jsx";
import { durationH, fmtDuration } from "../utils/format.js";
import { PLANTS, PLANT_KEYS } from "../config.js";

const yearOf = (r) => new Date(r.created).getFullYear();

// ISO-Kalenderwoche eines Datums.
function isoWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((date - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
}

// Wiederverwendbare Balkenzeile (Label · Balken · Wert).
function BarRow({ label, value, max, suffix, color = C.navy, labelW = 180 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
      <span style={{ width: labelW, fontSize: 13, color: TEXT }}>{label}</span>
      <div style={{ flex: 1, background: "#EAF2F7", borderRadius: 4, height: 22 }}>
        <div style={{ width: `${(value / max) * 100}%`, background: color, height: "100%", borderRadius: 4, minWidth: value ? 2 : 0 }} />
      </div>
      <span style={{ width: 96, textAlign: "right", fontSize: 13, fontWeight: 700 }}>{value}{suffix || ""}</span>
    </div>
  );
}

export default function Stats({ reports }) {
  const [plant, setPlant] = useState("LS3");
  const [pm, setPm] = useState("alle");
  // Standardmäßig das aktuelle Jahr zeigen (sonst das jüngste vorhandene).
  const [year, setYear] = useState(() => {
    const ys = [...new Set(reports.map(yearOf))];
    const cur = new Date().getFullYear();
    return ys.includes(cur) ? String(cur) : ys.length ? String(Math.max(...ys)) : "all";
  });
  const [period, setPeriod] = useState("Monat"); // Woche | Monat | Quartal (nur bei konkretem Jahr)

  const rsPlant = useMemo(() => reports.filter((r) => r.plant === plant), [reports, plant]);
  const years = useMemo(() => [...new Set(rsPlant.map(yearOf))].sort((a, b) => b - a), [rsPlant]);
  const rsPM = useMemo(() => (pm === "alle" ? rsPlant : rsPlant.filter((r) => r.pm === pm)), [rsPlant, pm]);
  const rs = useMemo(() => (year === "all" ? rsPM : rsPM.filter((r) => yearOf(r) === Number(year))), [rsPM, year]);

  // Verteilung nach Fehlertyp
  const byType = useMemo(() => {
    const m = {};
    rs.forEach((r) => { const k = r.type + (r.particleType ? ` (${r.particleType})` : ""); m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [rs]);
  const maxType = Math.max(1, ...byType.map((x) => x[1]));

  // Ø Bearbeitungsdauer je Fehlertyp
  const durByType = useMemo(() => {
    const acc = {};
    PLANTS[plant].types.forEach((t) => (acc[t] = { sum: 0, n: 0 }));
    rs.forEach((r) => { const d = durationH(r); if (d != null && acc[r.type]) { acc[r.type].sum += d; acc[r.type].n += 1; } });
    return PLANTS[plant].types.map((t) => ({ type: t, n: acc[t].n, avgH: acc[t].n ? acc[t].sum / acc[t].n : null }));
  }, [rs, plant]);
  const maxAvg = Math.max(1, ...durByType.map((d) => d.avgH || 0));

  // Trend (aus echten Daten): bei "All time" je Jahr, sonst je Monat des Jahres.
  const trend = useMemo(() => {
    // All time: ein Balken je Jahr.
    if (year === "all") {
      const ys = years.slice().sort((a, b) => a - b);
      return { labels: ys.map(String), series: ys.map((y) => rsPM.filter((r) => yearOf(r) === y).length), caption: "Meldungen je Jahr (alle Jahre)" };
    }
    const Y = Number(year);
    if (period === "Quartal") {
      const labels = ["Q1", "Q2", "Q3", "Q4"];
      return { labels, series: labels.map((_, q) => rs.filter((r) => Math.floor(new Date(r.created).getMonth() / 3) === q).length), caption: `Meldungen je Quartal · ${Y}` };
    }
    if (period === "Woche") {
      // Letzte 12 Wochen bis heute (laufendes Jahr) bzw. bis Jahresende.
      const end = Y === new Date().getFullYear() ? Date.now() : new Date(Y, 11, 31, 23, 59, 59).getTime();
      const W = 12, day = 864e5;
      const labels = [], series = [];
      for (let i = W - 1; i >= 0; i--) {
        const e = end - i * 7 * day, s = e - 7 * day;
        labels.push("KW" + isoWeek(new Date(s + 3.5 * day)));
        series.push(rs.filter((r) => { const t = new Date(r.created).getTime(); return t > s && t <= e; }).length);
      }
      return { labels, series, caption: `Meldungen je Woche · ${Y} (letzte 12 Wochen)` };
    }
    const labels = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
    return { labels, series: labels.map((_, m) => rs.filter((r) => new Date(r.created).getMonth() === m).length), caption: `Meldungen je Monat · ${Y}` };
  }, [rs, rsPM, year, years, period]);
  const maxTrend = Math.max(1, ...trend.series);

  // Pareto nach Ursache (absteigend + kumulativer Anteil)
  const pareto = useMemo(() => {
    const m = {};
    rs.forEach((r) => { if (r.cause) m[r.cause] = (m[r.cause] || 0) + 1; });
    const arr = Object.entries(m).sort((a, b) => b[1] - a[1]);
    const total = arr.reduce((s, [, v]) => s + v, 0);
    let run = 0;
    return { rows: arr.map(([k, v]) => { run += v; return { k, v, cum: total ? Math.round((run / total) * 100) : 0 }; }), total, max: arr.length ? arr[0][1] : 1 };
  }, [rs]);

  // Hotspot nach PM
  const hotspot = useMemo(() => {
    const m = {};
    rs.forEach((r) => { if (r.pm) m[r.pm] = (m[r.pm] || 0) + 1; });
    const arr = Object.entries(m).sort((a, b) => b[1] - a[1]);
    return { rows: arr, max: arr.length ? arr[0][1] : 1 };
  }, [rs]);

  const sig = (r) => `${r.pm || "?"} · ${r.cause || r.type}`;

  // Auffälligkeits-/Trendwarnung: ≥3 gleiche (PM · Ursache) in den letzten 28 Tagen
  const warnings = useMemo(() => {
    const cutoff = Date.now() - 28 * 864e5;
    const recent = rsPM.filter((r) => new Date(r.created).getTime() >= cutoff);
    const m = {};
    recent.forEach((r) => { const k = sig(r); (m[k] = m[k] || []).push(r); });
    return Object.entries(m).filter(([, a]) => a.length >= 3).map(([k, a]) => ({ k, n: a.length })).sort((a, b) => b.n - a.n);
  }, [rsPM]);

  // Wirksamkeits-Check (PDCA): trat nach Abschluss derselbe (PM · Ursache) erneut auf?
  const pdca = useMemo(() => {
    const closed = rsPM.filter((r) => r.status === "behoben" && r.resolvedAt && (r.cause || r.pm));
    const groups = {};
    closed.forEach((r) => {
      const recurred = rsPM.some((o) => o !== r && sig(o) === sig(r) && new Date(o.created).getTime() > new Date(r.resolvedAt).getTime());
      const g = (groups[sig(r)] = groups[sig(r)] || { total: 0, recur: 0 });
      g.total++; if (recurred) g.recur++;
    });
    const rows = Object.entries(groups).map(([k, g]) => ({ k, ...g })).sort((a, b) => b.recur - a.recur || b.total - a.total);
    const totalClosed = rows.reduce((s, g) => s + g.total, 0);
    const totalRecur = rows.reduce((s, g) => s + g.recur, 0);
    return { rows, totalClosed, totalRecur };
  }, [rsPM]);

  const selBtn = (active) => ({ padding: "8px 18px", border: `1px solid ${active ? C.navy : BORDER}`, borderRadius: 6, cursor: "pointer", background: active ? C.navy : C.white, color: active ? C.white : TEXT, fontWeight: 700, fontSize: 14 });

  return (
    <>
      {/* Filterzeile: Anlage · PM · Jahr */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        {PLANT_KEYS.map((p) => (
          <button key={p} onClick={() => { setPlant(p); setPm("alle"); }} style={selBtn(plant === p)}>{PLANTS[p].label}</button>
        ))}
        <span style={{ width: 1, height: 26, background: BORDER }} />
        <label style={{ fontSize: 12.5, color: MUTED }}>PM/Anlage:</label>
        <select value={pm} onChange={(e) => setPm(e.target.value)} style={{ padding: "7px 10px", border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 13.5, fontFamily: "Arial" }}>
          <option value="alle">Alle PM</option>
          {PLANTS[plant].pmOptions.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <label style={{ fontSize: 12.5, color: MUTED }}>Jahr:</label>
        <select value={year} onChange={(e) => setYear(e.target.value)} style={{ padding: "7px 10px", border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 13.5, fontFamily: "Arial" }}>
          <option value="all">All time</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 18 }}>
        <Stat big={rs.length} label="Meldungen (Auswahl)" />
        <Stat big={rs.filter((r) => r.status !== "behoben").length} label="aktuell offen" color={RED} />
        <Stat big={rs.filter((r) => r.status === "behoben").length} label="behoben" color={GREEN} />
      </div>

      {/* Auffälligkeits-/Trendwarnung */}
      <Panel title="Auffälligkeits-Erkennung (letzte 4 Wochen)">
        {warnings.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: MUTED }}>Keine Häufungen erkannt (Schwelle: 3× gleiche PM · Ursache in 28 Tagen).</p>
        ) : (
          warnings.map((w) => (
            <div key={w.k} style={{ display: "flex", alignItems: "center", gap: 10, background: "#FCEFD3", border: "1px solid #E8C46A", borderRadius: 6, padding: "8px 12px", marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>⚠</span>
              <span style={{ fontSize: 13.5, color: "#7A5A12" }}><b>{w.n}× {w.k}</b> in den letzten 4 Wochen – bitte prüfen.</span>
            </div>
          ))
        )}
      </Panel>

      {/* Trend */}
      <Panel
        title={`Fehler je Zeiteinheit · ${plant}`}
        right={
          year !== "all" ? (
            <div style={{ display: "flex", gap: 6 }}>
              {["Woche", "Monat", "Quartal"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{ padding: "5px 12px", borderRadius: 14, fontSize: 12.5, cursor: "pointer", border: `1px solid ${period === p ? C.navy : BORDER}`, background: period === p ? C.navy : C.white, color: period === p ? C.white : TEXT }}
                >
                  {p}
                </button>
              ))}
            </div>
          ) : null
        }
      >
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 180, padding: "0 6px" }}>
          {trend.series.map((v, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>{v}</span>
              <div style={{ width: "70%", height: `${(v / maxTrend) * 130}px`, background: C.tileBg, borderRadius: "4px 4px 0 0", minHeight: v ? 2 : 0 }} />
              <span style={{ fontSize: 11.5, color: MUTED, marginTop: 6 }}>{trend.labels[i]}</span>
            </div>
          ))}
          {trend.series.length === 0 && <p style={{ color: MUTED, fontSize: 13 }}>Keine Daten.</p>}
        </div>
        <p style={{ fontSize: 11.5, color: MUTED, margin: "12px 0 0" }}>{trend.caption} – aus den erfassten Meldungen berechnet.</p>
      </Panel>

      {/* Pareto */}
      <Panel title={`Pareto nach Ursache · ${plant}`}>
        <p style={{ fontSize: 12.5, color: MUTED, margin: "0 0 12px" }}>
          Ursachen absteigend sortiert; die Prozentzahl ist der <b>kumulative Anteil</b>. So sieht man die „wenigen vielen" Ursachen, die den Großteil der Fälle ausmachen (80/20).
        </p>
        {pareto.rows.length === 0 ? (
          <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>keine Daten (Ursachen v. a. bei „Undichte Blister")</p>
        ) : (
          pareto.rows.map((row) => (
            <BarRow key={row.k} label={row.k} value={row.v} max={pareto.max} suffix={`  ·  ${row.cum}%`} color={C.navy} labelW={150} />
          ))
        )}
      </Panel>

      {/* Hotspot nach PM */}
      <Panel title={`Hotspot nach PM/Anlage · ${plant}`}>
        <p style={{ fontSize: 12.5, color: MUTED, margin: "0 0 12px" }}>Welche Anlage (PM) erzeugt die meisten Meldungen – zeigt das Problem-Equipment.</p>
        {hotspot.rows.length === 0 ? (
          <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>keine Daten</p>
        ) : (
          hotspot.rows.map(([k, v]) => <BarRow key={k} label={k} value={v} max={hotspot.max} color={C.tileBgDark} labelW={120} />)
        )}
      </Panel>

      {/* Wirksamkeits-Check (PDCA) */}
      <Panel title={`Wirksamkeits-Check (PDCA) · ${plant}`}>
        <p style={{ fontSize: 12.5, color: MUTED, margin: "0 0 12px" }}>
          Trat nach Abschluss derselbe Fall (PM · Ursache) erneut auf? <b>Wiederauftritt</b> deutet auf eine nicht wirksame Maßnahme hin.
        </p>
        {pdca.rows.length === 0 ? (
          <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>noch keine abgeschlossenen Fälle in der Auswahl</p>
        ) : (
          <>
            <div style={{ fontSize: 13, marginBottom: 10 }}>
              <b>{pdca.totalClosed - pdca.totalRecur}</b> von <b>{pdca.totalClosed}</b> abgeschlossenen Fällen ohne Wiederauftritt
              {pdca.totalRecur > 0 && <span style={{ color: RED }}> · {pdca.totalRecur} mit Wiederauftritt</span>}
            </div>
            {pdca.rows.map((g) => (
              <div key={g.k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${BORDER}`, padding: "6px 0", fontSize: 13 }}>
                <span>{g.k}</span>
                {g.recur > 0 ? (
                  <span style={{ color: RED, fontWeight: 700 }}>⚠ {g.recur}× Wiederauftritt (von {g.total})</span>
                ) : (
                  <span style={{ color: GREEN, fontWeight: 700 }}>✓ wirksam ({g.total})</span>
                )}
              </div>
            ))}
          </>
        )}
      </Panel>

      {/* Verteilung nach Fehlertyp */}
      <Panel title={`Verteilung nach Fehlertyp · ${plant}`}>
        {byType.length === 0 ? (
          <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>keine Daten</p>
        ) : (
          byType.map(([k, v]) => <BarRow key={k} label={k} value={v} max={maxType} color={C.navy} labelW={180} />)
        )}
      </Panel>

      {/* Ø Bearbeitungsdauer je Fehlertyp */}
      <Panel title={`Ø Bearbeitungsdauer je Fehlertyp · ${plant}`}>
        <p style={{ fontSize: 12.5, color: MUTED, margin: "0 0 12px" }}>Zeit von der Erstmeldung bis „behoben", gemittelt über die abgeschlossenen Fälle.</p>
        {durByType.map((d) => (
          <div key={d.type} style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
            <span style={{ width: 200, fontSize: 13, color: TEXT }}>{d.type}</span>
            <div style={{ flex: 1, background: "#EAF2F7", borderRadius: 4, height: 22 }}>
              {d.avgH != null && <div style={{ width: `${(d.avgH / maxAvg) * 100}%`, background: C.tileBg, height: "100%", borderRadius: 4 }} />}
            </div>
            <span style={{ width: 120, textAlign: "right", fontSize: 13, fontWeight: 700, color: d.avgH == null ? MUTED : TEXT }}>
              {d.avgH == null ? "keine Daten" : `${fmtDuration(d.avgH)} (n=${d.n})`}
            </span>
          </div>
        ))}
      </Panel>
    </>
  );
}

function Stat({ big, label, color }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "14px 16px" }}>
      <div style={{ fontSize: 34, fontWeight: 700, color: color || C.navy, lineHeight: 1 }}>{big}</div>
      <div style={{ fontSize: 12.5, color: MUTED, marginTop: 4 }}>{label}</div>
    </div>
  );
}
