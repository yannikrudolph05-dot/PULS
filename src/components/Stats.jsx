import React, { useState, useMemo } from "react";
import { C, TEXT, MUTED, BORDER, RED, AMBER, GREEN } from "../theme.js";
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

// Rang-basierte Farbabstufung navy -> hellblau (dunkelster Balken = größter Wert).
function rankColor(i, n) {
  const t = n <= 1 ? 0 : i / (n - 1);
  const c1 = [10, 47, 94]; // navy
  const c2 = [154, 205, 232]; // hell, Richtung tileBg/panelBg
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
  return `rgb(${r},${g},${b})`;
}

function lerp3(a, b, t) {
  return [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t));
}

// Ampel-Farbverlauf auf einer festen, absoluten Stundenskala (0-24h) statt
// relativ zum größten Wert der Auswahl – sonst würde der "beste" Fehlertyp
// einer Auswahl immer grün erscheinen, selbst wenn er absolut lahm ist.
function trafficColor(h) {
  if (h == null) return BORDER;
  const GREEN_RGB = [30, 142, 90], AMBER_RGB = [232, 135, 14], RED_RGB = [216, 38, 31];
  const clamped = Math.max(0, Math.min(24, h));
  const [r, g, b] = clamped <= 12 ? lerp3(GREEN_RGB, AMBER_RGB, clamped / 12) : lerp3(AMBER_RGB, RED_RGB, (clamped - 12) / 12);
  return `rgb(${r},${g},${b})`;
}

// Farbpalette für den Donut (mehr Kategorien als feste Theme-Farben -> zyklisch).
const DONUT_COLORS = [C.navy, C.tileBg, AMBER, GREEN, "#7B5EA7", RED, C.tileBgDark, MUTED];

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

// Icons (handgezeichnet, keine externe Icon-Bibliothek nötig).
const IconList = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);
const IconAlert = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconCheck = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

// KPI-Kachel mit Icon + optionalem, ehrlich berechnetem Trend.
// judgment steuert nur die Farbe der Trendzahl: "good-up" (steigen=gut),
// "good-down" (fallen=gut) oder "neutral" (keine Wertung, nur Richtung).
function Kpi({ icon, big, label, color, delta, deltaSuffix = "%", judgment = "neutral", note }) {
  let deltaColor = MUTED;
  if (delta != null && delta !== 0) {
    if (judgment === "good-up") deltaColor = delta > 0 ? GREEN : RED;
    else if (judgment === "good-down") deltaColor = delta < 0 ? GREEN : RED;
  }
  const arrow = delta == null ? null : delta > 0 ? "▲" : delta < 0 ? "▼" : "–";
  return (
    <div className="puls-card" style={{ background: C.white, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}1A`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 30, fontWeight: 700, color, lineHeight: 1 }}>{big}</span>
          {delta != null && (
            <span style={{ fontSize: 12, fontWeight: 700, color: deltaColor }}>{arrow} {Math.abs(delta)}{deltaSuffix}</span>
          )}
        </div>
        <div style={{ fontSize: 12.5, color: MUTED, marginTop: 3 }}>{label}</div>
        {note && <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>{note}</div>}
      </div>
    </div>
  );
}

// Vertikales Pareto-Chart: Balken (Anzahl, linke Skala) + Linie (kumulativer
// Anteil, rechte Skala 0-100 %, über dieselbe Zeichenhöhe gelegt).
function ParetoChart({ rows, max }) {
  if (!rows.length) return <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>keine Daten (Ursachen v. a. bei „Undichte Blister")</p>;
  const W = 640, H = 240, padL = 8, padR = 40, padT = 18, padB = 34;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const n = rows.length;
  const bw = Math.min(64, (innerW / n) * 0.5);
  const cx = (i) => padL + (innerW / n) * (i + 0.5);
  const barTop = (i) => padT + innerH - (rows[i].v / max) * innerH;
  const cumY = (i) => padT + innerH - (rows[i].cum / 100) * innerH;
  const linePoints = rows.map((r, i) => `${cx(i)},${cumY(i)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block" }}>
      {[0, 25, 50, 75, 100].map((p) => {
        const y = padT + innerH - (p / 100) * innerH;
        return (
          <g key={p}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#EAF2F7" strokeWidth={1} />
            <text x={W - padR + 6} y={y + 4} fontSize={10.5} fill={MUTED}>{p}%</text>
          </g>
        );
      })}
      {rows.map((r, i) => (
        <g key={r.k}>
          <rect x={cx(i) - bw / 2} y={barTop(i)} width={bw} height={padT + innerH - barTop(i)} fill={rankColor(i, n)} rx={3} />
          <text x={cx(i)} y={barTop(i) - 7} textAnchor="middle" fontSize={12} fontWeight={700} fill={TEXT}>{r.v}</text>
          <text x={cx(i)} y={H - padB + 16} textAnchor="middle" fontSize={10.5} fill={MUTED}>{r.k}</text>
        </g>
      ))}
      <polyline points={linePoints} fill="none" stroke={AMBER} strokeWidth={2} />
      {rows.map((r, i) => (
        <circle key={r.k} cx={cx(i)} cy={cumY(i)} r={3.5} fill={AMBER} stroke="#fff" strokeWidth={1.5} />
      ))}
    </svg>
  );
}

// Donut (CSS conic-gradient) + Legende mit Werten und Prozentanteilen.
function DonutChart({ data }) {
  const total = data.reduce((s, [, v]) => s + v, 0);
  let acc = 0;
  const stops = data
    .map(([, v], i) => {
      const start = (acc / total) * 360;
      acc += v;
      const end = (acc / total) * 360;
      return `${DONUT_COLORS[i % DONUT_COLORS.length]} ${start}deg ${end}deg`;
    })
    .join(", ");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
      <div style={{ width: 160, height: 160, borderRadius: "50%", background: total ? `conic-gradient(${stops})` : "#EAF2F7", position: "relative", flexShrink: 0 }}>
        <div style={{ position: "absolute", inset: 28, borderRadius: "50%", background: C.white, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: C.navy }}>{total}</span>
          <span style={{ fontSize: 10.5, color: MUTED }}>gesamt</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 200 }}>
        {data.map(([k, v], i) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: DONUT_COLORS[i % DONUT_COLORS.length], flexShrink: 0 }} />
            <span style={{ color: TEXT }}>{k}</span>
            <span style={{ color: MUTED, marginLeft: "auto", paddingLeft: 12, whiteSpace: "nowrap" }}>{v} · {total ? Math.round((v / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const TABS = [
  { key: "ueberblick", label: "Überblick" },
  { key: "ursachen", label: "Ursachen & Verteilung" },
  { key: "anlagen", label: "Anlagen" },
  { key: "wirksamkeit", label: "Wirksamkeit" },
];

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
  const [tab, setTab] = useState("ueberblick");

  const rsPlant = useMemo(() => reports.filter((r) => r.plant === plant), [reports, plant]);
  const years = useMemo(() => [...new Set(rsPlant.map(yearOf))].sort((a, b) => b - a), [rsPlant]);
  const rsPM = useMemo(() => (pm === "alle" ? rsPlant : rsPlant.filter((r) => r.pm === pm)), [rsPlant, pm]);
  const rs = useMemo(() => (year === "all" ? rsPM : rsPM.filter((r) => yearOf(r) === Number(year))), [rsPM, year]);

  // Vorjahresvergleich für die KPI-Trends – nur wenn ein konkretes Jahr
  // gewählt ist UND für das Vorjahr überhaupt Daten vorliegen (sonst kein
  // Trend anzeigen statt eine irreführende Zahl zu erfinden). Zusätzlich:
  // bei sehr kleiner Vorjahres-Basis (<5) keine Prozentzahl zeigen, weil
  // dann schon 1-2 Fälle Unterschied absurde Ausschläge (z. B. "8700%")
  // erzeugen, die zwar rechnerisch stimmen, aber in die Irre führen.
  const MIN_BASE = 5;
  const prevYear = year !== "all" ? Number(year) - 1 : null;
  const hasPrev = prevYear != null && years.includes(prevYear);
  const rsPrev = useMemo(() => (hasPrev ? rsPM.filter((r) => yearOf(r) === prevYear) : []), [rsPM, hasPrev, prevYear]);
  const totalDelta = hasPrev && rsPrev.length >= MIN_BASE ? Math.round(((rs.length - rsPrev.length) / rsPrev.length) * 100) : null;
  const openDelta = useMemo(() => {
    if (!hasPrev) return null;
    const prevOpen = rsPrev.filter((r) => r.status !== "behoben").length;
    if (prevOpen < MIN_BASE) return null;
    const curOpen = rs.filter((r) => r.status !== "behoben").length;
    return Math.round(((curOpen - prevOpen) / prevOpen) * 100);
  }, [hasPrev, rsPrev, rs]);
  const rateDeltaPts = useMemo(() => {
    if (!hasPrev || rsPrev.length < MIN_BASE || rs.length < MIN_BASE) return null;
    const rateNow = rs.filter((r) => r.status === "behoben").length / rs.length;
    const ratePrev = rsPrev.filter((r) => r.status === "behoben").length / rsPrev.length;
    return Math.round((rateNow - ratePrev) * 100);
  }, [hasPrev, rsPrev, rs]);

  // Verteilung nach Fehlertyp
  const byType = useMemo(() => {
    const m = {};
    rs.forEach((r) => { const k = r.type + (r.particleType ? ` (${r.particleType})` : ""); m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [rs]);

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

      {/* Reiter */}
      <div style={{ display: "flex", gap: 4, borderBottom: `2px solid ${BORDER}`, marginBottom: 18 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 18px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 700,
              color: tab === t.key ? C.navy : MUTED,
              borderBottom: `2px solid ${tab === t.key ? C.navy : "transparent"}`,
              marginBottom: -2,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "ueberblick" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 18 }}>
            <Kpi
              icon={<IconList color={C.navy} />} color={C.navy}
              big={rs.length} label="Meldungen (Auswahl)"
              delta={totalDelta} judgment="neutral" note={hasPrev ? `vs. ${prevYear}` : null}
            />
            <Kpi
              icon={<IconAlert color={RED} />} color={RED}
              big={rs.filter((r) => r.status !== "behoben").length} label="aktuell offen"
              delta={openDelta} judgment="good-down" note={hasPrev ? `vs. ${prevYear}` : null}
            />
            <Kpi
              icon={<IconCheck color={GREEN} />} color={GREEN}
              big={rs.filter((r) => r.status === "behoben").length} label="behoben"
              delta={rateDeltaPts} deltaSuffix=" Pp" judgment="good-up" note={hasPrev ? `Lösungsquote vs. ${prevYear}` : null}
            />
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
        </>
      )}

      {tab === "ursachen" && (
        <>
          {/* Pareto */}
          <Panel title={`Pareto nach Ursache · ${plant}`}>
            <p style={{ fontSize: 12.5, color: MUTED, margin: "0 0 12px" }}>
              Ursachen absteigend sortiert; die Linie zeigt den <b>kumulativen Anteil</b>. So sieht man die „wenigen vielen" Ursachen, die den Großteil der Fälle ausmachen (80/20).
            </p>
            <ParetoChart rows={pareto.rows} max={pareto.max} />
          </Panel>

          {/* Verteilung nach Fehlertyp */}
          <Panel title={`Verteilung nach Fehlertyp · ${plant}`}>
            {byType.length === 0 ? (
              <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>keine Daten</p>
            ) : (
              <DonutChart data={byType} />
            )}
          </Panel>
        </>
      )}

      {tab === "anlagen" && (
        <Panel title={`Hotspot nach PM/Anlage · ${plant}`}>
          <p style={{ fontSize: 12.5, color: MUTED, margin: "0 0 12px" }}>Welche Anlage (PM) erzeugt die meisten Meldungen – zeigt das Problem-Equipment.</p>
          {hotspot.rows.length === 0 ? (
            <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>keine Daten</p>
          ) : (
            hotspot.rows.map(([k, v], i) => <BarRow key={k} label={k} value={v} max={hotspot.max} color={rankColor(i, hotspot.rows.length)} labelW={120} />)
          )}
        </Panel>
      )}

      {tab === "wirksamkeit" && (
        <>
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

          {/* Ø Bearbeitungsdauer je Fehlertyp */}
          <Panel title={`Ø Bearbeitungsdauer je Fehlertyp · ${plant}`}>
            <p style={{ fontSize: 12.5, color: MUTED, margin: "0 0 12px" }}>
              Zeit von der Erstmeldung bis „behoben", gemittelt über die abgeschlossenen Fälle. Farbe = Ampel auf fester Stundenskala (grün ≤12h, rot ≥24h) – unabhängig vom Vergleich zwischen Fehlertypen.
            </p>
            {durByType.map((d) => (
              <div key={d.type} style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                <span style={{ width: 200, fontSize: 13, color: TEXT }}>{d.type}</span>
                <div style={{ flex: 1, background: "#EAF2F7", borderRadius: 4, height: 22 }}>
                  {d.avgH != null && <div style={{ width: `${(d.avgH / maxAvg) * 100}%`, background: trafficColor(d.avgH), height: "100%", borderRadius: 4 }} />}
                </div>
                <span style={{ width: 120, textAlign: "right", fontSize: 13, fontWeight: 700, color: d.avgH == null ? MUTED : TEXT }}>
                  {d.avgH == null ? "keine Daten" : `${fmtDuration(d.avgH)} (n=${d.n})`}
                </span>
              </div>
            ))}
          </Panel>
        </>
      )}
    </>
  );
}
