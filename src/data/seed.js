// ============================================================================
//  src/data/seed.js  –  ERFUNDENE DEMO-DATEN
//  Viele abgeschlossene Fälle über Wochen/Monate UND Vorjahre, plus offene /
//  in Bearbeitung, über beide Anlagen, Fehlertypen und PMs. Enthält bewusst:
//   - genügend Ursachen/PMs, damit Pareto & Hotspot aussagekräftig sind,
//   - eine Häufung (3× PM3 · Siegelfehler in 4 Wochen) für die Trendwarnung,
//   - einen Wiederauftritt nach Abschluss für den Wirksamkeits-Check (PDCA),
//   - Beispiele der neuen Typen (Integritätsverletzung, Produktauffälligkeiten).
//  ALLE Einträge sind demo: true.
// ============================================================================
import { deptLabels } from "../config.js";

const now = Date.now();
const H = 3600 * 1000;
const D = 24 * H;
const iso = (msAgo) => new Date(now - msAgo).toISOString();
const dAgo = (days, hours = 0) => iso(days * D + hours * H);

const OPT_KEYS = [
  "particleType", "lot", "pm", "pp", "count", "cause", "discovery", "order", "causeFound", "ak", "akRun",
  // Felder der neuen Meldungstypen:
  "integrityCause", "affectedEquipment", "emptied", "hygieneZone", "sopAssessed",
  "anomaly", "magazin", "quantity", "needs100", "qab",
];

function mk(o) {
  const created = dAgo(o.dStart);
  const r = {
    id: "M-" + o.idn,
    plant: o.plant,
    type: o.type,
    status: o.status,
    created,
    discoveredAt: iso(o.dStart * D + 2 * H),
    depts: o.depts || [],
    helpDepts: o.helpDepts || [],
    recipients: o.recipients || [],
    attachments: o.attachments || [],
    measures: o.measures || "",
    demo: true,
  };
  for (const k of OPT_KEYS) if (o[k] !== undefined) r[k] = o[k];

  const log = [
    {
      t: created,
      kind: "create",
      by: "An der Anlage",
      txt: "Meldung angelegt." + (r.depts.length ? " Benachrichtigt: " + deptLabels(r.depts) + "." : " Nur ins Cockpit hochgeladen."),
    },
  ];
  (o.logExtra || []).forEach((e) => log.push({ t: dAgo(e.dStart), kind: e.kind, by: e.by, txt: e.txt }));
  if (o.status === "behoben") {
    const resolvedAt = new Date(new Date(created).getTime() + (o.durH || 12) * H).toISOString();
    r.resolvedAt = resolvedAt;
    log.push({ t: resolvedAt, kind: "status", by: "An der Anlage", txt: "Status geändert auf „behoben\"." });
  }
  log.sort((a, b) => new Date(a.t) - new Date(b.t));
  r.log = log;
  return r;
}

export function seedReports() {
  const reports = [
    // ===================== LS3 · Undichte Blister (aktuell) =====================
    mk({ idn: 2042, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 2, durH: 7, lot: "A4471-22", pm: "PM3", pp: "PP2", count: 2, cause: "Siegelfehler", discovery: "QS80/DSP80 (nach AK)", depts: ["MST", "QC"], measures: "Nachkontrolle durchgeführt, Siegelpaket geprüft, Lot freigegeben." }),
    mk({ idn: 2031, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 9, durH: 18, lot: "A4468-15", pm: "PM1", pp: "PP1", count: 1, cause: "Folienfehler", discovery: "QS50/DSP50 (vor AK)", depts: ["MST"], measures: "Folienrolle gewechselt, Parallel-Lot geprüft." }),
    mk({ idn: 2018, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 23, durH: 30, lot: "A4451-08", pm: "PM4", pp: "PP3", count: 3, cause: "Schalenfehler", discovery: "NK80 (Nachkontrolle QS80)", depts: ["QC"], measures: "Schalencharge gesperrt, Lieferant informiert." }),
    mk({ idn: 1990, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 47, durH: 12, lot: "A4420-31", pm: "PM2", pp: "PP2", count: 1, cause: "Siegelfehler", depts: ["MST", "QC"], measures: "Siegeltemperatur nachjustiert." }),
    mk({ idn: 1944, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 88, durH: 55, lot: "A4361-09", pm: "PM5", pp: "PP4", count: 4, cause: "WT Fehler", depts: ["MST", "MAINT"], measures: "Werkzeug getauscht, QAB eröffnet und abgeschlossen." }),
    mk({ idn: 1902, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 121, durH: 9, lot: "A4290-12", pm: "PM3", pp: "PP1", count: 2, cause: "Siegelfehler", depts: ["QC"], measures: "Reinigung Siegelpaket, danach i. O." }),
    // Häufung PM3 · Siegelfehler (zusammen mit M-2042 = 3× in 4 Wochen -> Trendwarnung)
    mk({ idn: 2056, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 8, durH: 10, lot: "A4474-07", pm: "PM3", pp: "PP2", count: 1, cause: "Siegelfehler", discovery: "QS80/DSP80 (nach AK)", depts: ["QC"], measures: "Siegelpaket gereinigt." }),
    mk({ idn: 2057, plant: "LS3", type: "Undichte Blister", status: "in Bearbeitung", dStart: 16, lot: "A4470-03", pm: "PM3", pp: "PP1", count: 2, cause: "Siegelfehler", discovery: "QS80/DSP80 (nach AK)", depts: ["MST", "QC"], measures: "Siegelparameter werden geprüft." }),
    mk({ idn: 2050, plant: "LS3", type: "Undichte Blister", status: "in Bearbeitung", dStart: 1.5, lot: "A4475-02", pm: "PM7", pp: "PP2", count: 2, cause: "Siegelfehler", discovery: "QS80/DSP80 (nach AK)", depts: ["MST", "QC"], measures: "Nachkontrolle läuft.", logExtra: [{ dStart: 1.0, kind: "note", by: "An der Anlage", txt: "Parallel-Lot zur Sicherheit nachkontrolliert." }] }),
    mk({ idn: 2052, plant: "LS3", type: "Undichte Blister", status: "offen", dStart: 0.2, lot: "A4476-10", pm: "PM2", pp: "PP1", count: 1, cause: "Folienfehler", discovery: "QS50/DSP50 (vor AK)", depts: ["QC"] }),

    // ===================== LS3 · Partikelfund (mit PM) =====================
    mk({ idn: 2040, plant: "LS3", type: "Partikelfund", particleType: "IM", pm: "PM2", status: "behoben", dStart: 6, durH: 14, lot: "A4466-03", depts: ["QC"], measures: "Partikel gesichert, Partikelwalk durchgeführt." }),
    mk({ idn: 2009, plant: "LS3", type: "Partikelfund", particleType: "PP", pm: "PM4", status: "behoben", dStart: 33, durH: 20, lot: "A4438-17", depts: ["QC", "MST"], measures: "Formblatt auf SharePoint abgelegt, Bereich gereinigt." }),
    mk({ idn: 1965, plant: "LS3", type: "Partikelfund", particleType: "EM", pm: "PM2", status: "behoben", dStart: 60, durH: 8, lot: "A4399-21", depts: ["QC"], measures: "Einzelfund, kein Trend erkennbar." }),
    mk({ idn: 1921, plant: "LS3", type: "Partikelfund", particleType: "TM", pm: "PM6", status: "behoben", dStart: 95, durH: 26, lot: "A4350-05", depts: ["QC"], measures: "TM-Bereich gereinigt, Wirksamkeit geprüft." }),
    mk({ idn: 2015, plant: "LS3", type: "Partikelfund", particleType: "MM", pm: "PM2", status: "behoben", dStart: 15, durH: 16, lot: "A4455-44", depts: ["QC"], measures: "MM-Fund dokumentiert." }),
    mk({ idn: 2051, plant: "LS3", type: "Partikelfund", particleType: "IM", pm: "PM2", status: "in Bearbeitung", dStart: 0.6, lot: "A4476-01", depts: ["QC"], measures: "Partikel aufgenommen, QAB-Erstellung wird geprüft." }),
    mk({ idn: 2053, plant: "LS3", type: "Partikelfund", particleType: "EM", pm: "PM5", status: "offen", dStart: 0.3, lot: "A4476-22", depts: ["QC"] }),

    // ===================== LS3 · AK-Störungsmitteilung =====================
    mk({ idn: 2049, plant: "LS3", type: "AK-Störungsmitteilung", status: "offen", dStart: 0.4, ak: "SBM 3490", akRun: "AK-7781", depts: ["MAINT", "MST"], measures: "Störung am Autoklav gemeldet." }),
    mk({ idn: 2047, plant: "LS3", type: "AK-Störungsmitteilung", status: "in Bearbeitung", dStart: 2.2, ak: "AK 22509", akRun: "AK-7790", depts: ["MAINT"], measures: "Techniker hinzugezogen.", logExtra: [{ dStart: 1.5, kind: "note", by: "An der Anlage", txt: "Ersatzteil bestellt, Wiederanlauf geplant." }] }),

    // ===================== LS3 · Integritätsverletzungsmitteilung (neu) =====================
    mk({ idn: 2058, plant: "LS3", type: "Integritätsverletzungsmitteilung", status: "offen", dStart: 0.7, integrityCause: "Stromausfall", affectedEquipment: "LSFLEX1, LS3 classic", emptied: "Nein", hygieneZone: "Nein", sopAssessed: "Ja", depts: ["MAINT", "MGMT", "QC"], measures: "Notstrom angelaufen, Anlagen kontrolliert, Bewertung läuft." }),

    // ===================== DSMFLEX · Undichte Blister =====================
    mk({ idn: 2037, plant: "DSMFLEX", type: "Undichte Blister", status: "behoben", dStart: 4, durH: 11, lot: "D7770-11", pm: "PM2", pp: "PP1", count: 1, cause: "Folienfehler", discovery: "QS50/DSP50 (vor AK)", depts: ["MST"], measures: "Siegelpaket gereinigt, Verpackungsauftrag fortgesetzt." }),
    mk({ idn: 2006, plant: "DSMFLEX", type: "Undichte Blister", status: "behoben", dStart: 18, durH: 40, lot: "D7741-02", pm: "PM3", pp: "PP2", count: 2, cause: "Siegelfehler", depts: ["MST", "QC"], measures: "Siegelparameter angepasst, Nachkontrolle ohne Befund." }),
    mk({ idn: 1972, plant: "DSMFLEX", type: "Undichte Blister", status: "behoben", dStart: 52, durH: 22, lot: "D7702-19", pm: "PM1", count: 1, cause: "Schalenfehler", depts: ["QC"], measures: "Schalencharge gesperrt." }),
    mk({ idn: 1935, plant: "DSMFLEX", type: "Undichte Blister", status: "behoben", dStart: 77, durH: 16, lot: "D7660-08", pm: "PM4", count: 3, cause: "Siegelfehler", depts: ["MST"], measures: "Reinigung & Überprüfung, danach i. O." }),
    mk({ idn: 2054, plant: "DSMFLEX", type: "Undichte Blister", status: "offen", dStart: 0.25, lot: "D7781-03", pm: "PM2", pp: "PP1", count: 1, cause: "Folienfehler", depts: ["MST", "QC"] }),
    mk({ idn: 2048, plant: "DSMFLEX", type: "Undichte Blister", status: "in Bearbeitung", dStart: 1.1, lot: "D7780-14", pm: "PM3", pp: "PP2", count: 2, cause: "WT Fehler", depts: ["QC"], helpDepts: ["MAINT"], measures: "Werkzeugschaden vermutet.", logExtra: [{ dStart: 0.9, kind: "help", by: "An der Anlage", txt: "Hilfe angefordert von Maintenance: Werkzeug prüfen." }] }),

    // ===================== DSMFLEX · Partikelfund (mit PM) =====================
    mk({ idn: 2029, plant: "DSMFLEX", type: "Partikelfund", particleType: "EM", pm: "PM2", status: "behoben", dStart: 7, durH: 12, lot: "D7768-05", depts: ["QC"], measures: "Partikel gesichert, Bereich gereinigt." }),
    mk({ idn: 1998, plant: "DSMFLEX", type: "Partikelfund", particleType: "IMC", pm: "PM3", status: "behoben", dStart: 26, durH: 30, lot: "D7730-12", depts: ["QC", "MST"], measures: "IMC-Bereich kontrolliert, Wirksamkeit bestätigt." }),
    mk({ idn: 1958, plant: "DSMFLEX", type: "Partikelfund", particleType: "Buffer", pm: "PM1", status: "behoben", dStart: 64, durH: 18, lot: "D7690-30", depts: ["QC"], measures: "Buffer-Tank gereinigt." }),
    mk({ idn: 1912, plant: "DSMFLEX", type: "Partikelfund", particleType: "Casting/Curing DND", pm: "PM4", status: "behoben", dStart: 100, durH: 44, lot: "D7640-09", depts: ["QC", "MST"], measures: "DND-Bereich gespült, QAB abgeschlossen." }),
    mk({ idn: 2055, plant: "DSMFLEX", type: "Partikelfund", particleType: "PP", pm: "PM2", status: "offen", dStart: 0.5, lot: "D7781-20", depts: ["QC"] }),

    // ===================== DSMFLEX · Mengenabweichung =====================
    mk({ idn: 2002, plant: "DSMFLEX", type: "Mengenabweichung", status: "behoben", dStart: 30, durH: 26, lot: "D7726-01", order: "AO-99001", causeFound: "Ja", depts: ["MST", "MGMT"], measures: "Differenz auf Fehlbuchung zurückgeführt, korrigiert." }),
    mk({ idn: 1949, plant: "DSMFLEX", type: "Mengenabweichung", status: "behoben", dStart: 70, durH: 50, lot: "D7672-16", order: "AO-99120", causeFound: "Ja", depts: ["MGMT"], measures: "Mit Frontend abgeglichen, Bestand korrigiert." }),
    mk({ idn: 2039, plant: "DSMFLEX", type: "Mengenabweichung", status: "offen", dStart: 0.8, lot: "D7782-04", order: "AO-99312", causeFound: "Nein – mit Frontend ermitteln", depts: ["MST", "MGMT"], measures: "", logExtra: [{ dStart: 0.3, kind: "query", by: "Abteilung MGMT", txt: "Rückfrage MGMT: Ist die Abweichung schon dem Frontend gemeldet? Bitte Status." }] }),

    // ===================== DSMFLEX · Integritätsverletzung + Produktauffälligkeiten (neu) =====================
    mk({ idn: 2059, plant: "DSMFLEX", type: "Integritätsverletzungsmitteilung", status: "behoben", dStart: 40, durH: 30, integrityCause: "Ausfall der Lüftungsanlagen", affectedEquipment: "DSMFLEX Modul 2", emptied: "Ja", hygieneZone: "Nein", sopAssessed: "Ja", depts: ["MAINT", "MGMT"], measures: "Lüftung wiederhergestellt, Reinigung/Desinfektion durchgeführt, Bewertung abgeschlossen." }),
    mk({ idn: 2060, plant: "DSMFLEX", type: "Produktauffälligkeiten", status: "offen", dStart: 1.2, anomaly: "Verfärbung an Blisterfolie", order: "AO-99410", lot: "D7783-02", magazin: "MAG-114", quantity: "12 Streifen", causeFound: "Nein", needs100: "Ja", qab: "Ja", depts: ["QC", "MST"], measures: "Muster gezogen, an Labor übergeben." }),
    mk({ idn: 2061, plant: "DSMFLEX", type: "Produktauffälligkeiten", status: "behoben", dStart: 55, durH: 36, anomaly: "Fremdpartikel im Sekundärkarton", order: "AO-99200", lot: "D7705-09", magazin: "MAG-090", quantity: "3 Kartons", causeFound: "Ja", needs100: "Nein", qab: "Nein", depts: ["QC"], measures: "Charge kontrolliert, Ursache beim Kartonlieferanten." }),

    // ===================== Vorjahre (für den Jahresfilter) =====================
    // 2025
    mk({ idn: 1850, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 230, durH: 14, lot: "A4100-04", pm: "PM3", pp: "PP1", count: 1, cause: "Siegelfehler", depts: ["QC"], measures: "Siegelpaket gereinigt." }),
    mk({ idn: 1820, plant: "LS3", type: "Partikelfund", particleType: "IM", pm: "PM2", status: "behoben", dStart: 320, durH: 22, lot: "A4040-11", depts: ["QC"], measures: "Partikelwalk durchgeführt." }),
    mk({ idn: 1795, plant: "DSMFLEX", type: "Undichte Blister", status: "behoben", dStart: 400, durH: 28, lot: "D7300-06", pm: "PM4", count: 2, cause: "Folienfehler", depts: ["MST"], measures: "Folienrolle gewechselt." }),
    mk({ idn: 1770, plant: "DSMFLEX", type: "Mengenabweichung", status: "behoben", dStart: 500, durH: 40, lot: "D7180-02", order: "AO-91002", causeFound: "Ja", depts: ["MGMT"], measures: "Bestand korrigiert." }),
    // 2024
    mk({ idn: 1700, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 560, durH: 20, lot: "A3800-09", pm: "PM5", pp: "PP2", count: 2, cause: "WT Fehler", depts: ["MST", "MAINT"], measures: "Werkzeug überarbeitet." }),
    mk({ idn: 1665, plant: "LS3", type: "Partikelfund", particleType: "PP", pm: "PM4", status: "behoben", dStart: 640, durH: 16, lot: "A3700-21", depts: ["QC"], measures: "Bereich gereinigt." }),
    mk({ idn: 1620, plant: "DSMFLEX", type: "Undichte Blister", status: "behoben", dStart: 720, durH: 33, lot: "D6900-14", pm: "PM3", count: 1, cause: "Siegelfehler", depts: ["MST", "QC"], measures: "Siegelparameter angepasst." }),
    mk({ idn: 1580, plant: "DSMFLEX", type: "Partikelfund", particleType: "EM", pm: "PM2", status: "behoben", dStart: 800, durH: 19, lot: "D6700-03", depts: ["QC"], measures: "Einzelfund dokumentiert." }),
  ];

  reports.sort((a, b) => new Date(b.created) - new Date(a.created));
  return reports;
}
