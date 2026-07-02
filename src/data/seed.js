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
    // demo: rein erfundene Anschauungsfälle. real: anonymisierte ECHTE Fälle
    // (Lot-Nr. ersetzt, sonst reale Zeiten/PM/Dauer) - siehe Kopf-Kommentar.
    demo: !o.real,
    real: !!o.real,
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

    // ===================== LS3 · Undichte Blister – ANONYMISIERTE ECHTE FÄLLE =====================
    // 156 reale, eindeutige Meldungen aus dem kompletten 2026er-Mailexport
    // (Ordner 01_undichte2026_LS3, Jan-Jun 2026, alle Faelle mit vollstaendigen
    // Feldern Lot+PM+Zeiten). Lot-Nummern sind ANONYMISIERT (echte Lots ersetzt,
    // Bereich A4500-A4999, ueberschneidet sich nicht mit den erfundenen Demo-
    // Lots). PM, Entdeckungszeitpunkt und Bearbeitungsdauer (Entdeckt -> Mail
    // gesendet) sind echt, per Skript aus den .msg-Dateien extrahiert.
    // real: true statt demo: true - siehe DemoBanner-Hinweis dazu.
    mk({ idn: 3101, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 178.46, durH: 0.30, lot: "A4665-14", pm: "PM1", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3102, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 178.38, durH: 0.56, lot: "A4702-11", pm: "PM1", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3103, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 178.06, durH: 0.88, lot: "A4537-27", pm: "PM1", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3104, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 177.55, durH: 0.79, lot: "A4548-21", pm: "PM1", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3105, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 176.31, durH: 0.33, lot: "A4798-11", pm: "PM1", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3106, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 172.73, durH: 0.71, lot: "A4965-26", pm: "PM4", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3107, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 170.46, durH: 4.15, lot: "A4609-11", pm: "PM2", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3108, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 170.46, durH: 0.32, lot: "A4544-23", pm: "FL4", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3109, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 165.88, durH: 0.98, lot: "A4714-12", pm: "PM2", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3110, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 159.37, durH: 0.80, lot: "A4623-12", pm: "PM1", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3111, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 159.36, durH: 0.61, lot: "A4782-23", pm: "PM1", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3112, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 159.35, durH: 0.46, lot: "A4530-28", pm: "PM2", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3113, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 157.91, durH: 0.30, lot: "A4563-17", pm: "FL2", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3114, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 151.47, durH: 3.73, lot: "A4822-28", pm: "FL3", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3115, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 151.12, durH: 0.30, lot: "A4985-11", pm: "FL2", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3116, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 150.47, durH: 1.37, lot: "A4795-28", pm: "FL2", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3117, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 150.42, durH: 1.35, lot: "A4703-11", pm: "FL2", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3118, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 150.31, durH: 0.85, lot: "A4999-17", pm: "FL4", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3119, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 148.71, durH: 0.30, lot: "A4523-27", pm: "FL2", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3120, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 146.51, durH: 0.74, lot: "A4939-14", pm: "FL3", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3121, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 144.77, durH: 3.83, lot: "A4648-23", pm: "FL4", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3122, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 139.22, durH: 0.38, lot: "A4573-27", pm: "FL3", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3123, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 139.16, durH: 2.98, lot: "A4560-28", pm: "FL2", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3124, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 139.15, durH: 0.54, lot: "A4657-27", pm: "FL2", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3125, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 138.42, durH: 0.84, lot: "A4917-15", pm: "FL4", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3126, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 133.02, durH: 0.32, lot: "A4552-28", pm: "FL4", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3127, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 129.83, durH: 1.01, lot: "A4792-16", pm: "FL3", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3128, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 128.54, durH: 0.30, lot: "A4690-13", pm: "FL3", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3129, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 124.27, durH: 0.30, lot: "A4780-12", pm: "PM1", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3130, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 122.18, durH: 0.37, lot: "A4788-11", pm: "PM5", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3131, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 116.85, durH: 6.26, lot: "A4816-16", pm: "FL3", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3132, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 114.26, durH: 0.30, lot: "A4754-27", pm: "FL2", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3133, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 114.05, durH: 0.30, lot: "A4718-20", pm: "PM3", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3134, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 109.03, durH: 0.60, lot: "A4738-28", pm: "PM4", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3135, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 109.03, durH: 0.30, lot: "A4972-24", pm: "PM4", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3136, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 106.50, durH: 3.28, lot: "A4685-19", pm: "FL2", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3137, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 103.06, durH: 0.45, lot: "A4627-15", pm: "PM2", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3138, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 102.45, durH: 0.30, lot: "A4857-17", pm: "PM4", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3139, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 101.72, durH: 0.30, lot: "A4541-28", pm: "FL2", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3140, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 94.17, durH: 1.86, lot: "A4653-26", pm: "PM2", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3141, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 94.12, durH: 0.99, lot: "A4753-20", pm: "PM2", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3142, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 90.94, durH: 0.30, lot: "A4873-24", pm: "PM5", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3143, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 90.94, durH: 0.30, lot: "A4647-29", pm: "PM5", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3144, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 90.94, durH: 0.30, lot: "A4762-23", pm: "PM6", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3145, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 90.52, durH: 1.46, lot: "A4584-20", pm: "PM3", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3146, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 90.11, durH: 0.30, lot: "A4577-25", pm: "PM6", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3147, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 89.93, durH: 0.30, lot: "A4715-11", pm: "PM6", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3148, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 89.88, durH: 2.67, lot: "A4992-12", pm: "PM6", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3149, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 89.88, durH: 2.65, lot: "A4891-27", pm: "PM5", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3150, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 89.88, durH: 2.64, lot: "A4793-20", pm: "PM5", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3151, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 89.88, durH: 2.62, lot: "A4674-21", pm: "PM5", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3152, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 89.88, durH: 2.42, lot: "A4804-25", pm: "PM6", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3153, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 89.88, durH: 0.90, lot: "A4796-24", pm: "PM6", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3154, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 89.88, durH: 0.63, lot: "A4535-12", pm: "PM6", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3155, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 89.88, durH: 0.38, lot: "A4983-18", pm: "PM6", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3156, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 89.88, durH: 0.32, lot: "A4742-12", pm: "PM6", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3157, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 89.81, durH: 1.30, lot: "A4531-19", pm: "PM2", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3158, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 89.67, durH: 0.36, lot: "A4831-28", pm: "PM2", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3159, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 88.23, durH: 0.53, lot: "A4848-24", pm: "PM5", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3160, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 87.70, durH: 0.32, lot: "A4645-22", pm: "PM6", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3161, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 87.68, durH: 1.68, lot: "A4954-21", pm: "PM6", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3162, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 87.67, durH: 1.47, lot: "A4511-24", pm: "PM5", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3163, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 86.12, durH: 0.86, lot: "A4681-15", pm: "PM2", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3164, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 85.58, durH: 2.74, lot: "A4812-13", pm: "PM1", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3165, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 85.58, durH: 0.30, lot: "A4752-11", pm: "PM1", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3166, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 85.02, durH: 0.60, lot: "A4611-19", pm: "PM4", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3167, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 84.83, durH: 2.18, lot: "A4566-17", pm: "PM4", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3168, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 84.83, durH: 2.02, lot: "A4700-25", pm: "PM4", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3169, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 84.83, durH: 1.73, lot: "A4585-24", pm: "PM4", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3170, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 84.83, durH: 1.56, lot: "A4705-27", pm: "PM4", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3171, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 84.83, durH: 1.51, lot: "A4642-14", pm: "PM4", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3172, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 84.83, durH: 1.28, lot: "A4919-23", pm: "PM4", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3173, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 84.83, durH: 1.22, lot: "A4942-27", pm: "PM4", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3174, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 84.76, durH: 0.79, lot: "A4861-23", pm: "PM4", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3175, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 84.76, durH: 0.70, lot: "A4683-22", pm: "PM4", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3176, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 84.76, durH: 0.60, lot: "A4990-17", pm: "PM4", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3177, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 84.06, durH: 0.30, lot: "A4542-15", pm: "PM6", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3178, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 82.81, durH: 0.88, lot: "A4618-17", pm: "PM2", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3179, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 82.79, durH: 0.72, lot: "A4506-25", pm: "PM3", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3180, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 82.49, durH: 2.21, lot: "A4925-28", pm: "FL2", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3181, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 81.83, durH: 0.77, lot: "A4593-18", pm: "PM1", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3182, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 81.83, durH: 0.72, lot: "A4644-10", pm: "PM1", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3183, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 80.75, durH: 1.51, lot: "A4574-23", pm: "PM2", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3184, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 80.40, durH: 1.50, lot: "A4773-21", pm: "PM2", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3185, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 80.26, durH: 0.30, lot: "A4789-20", pm: "PM3", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3186, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 80.15, durH: 3.57, lot: "A4987-14", pm: "FL4", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3187, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 79.54, durH: 0.43, lot: "A4853-26", pm: "PM3", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3188, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 78.49, durH: 0.88, lot: "A4986-29", pm: "PM6", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3189, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 78.41, durH: 0.30, lot: "A4835-11", pm: "PM6", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3190, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 78.41, durH: 0.30, lot: "A4733-27", pm: "PM6", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3191, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 78.30, durH: 1.09, lot: "A4704-22", pm: "PM3", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3192, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 77.33, durH: 0.54, lot: "A4553-25", pm: "PM1", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3193, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 77.01, durH: 1.02, lot: "A4824-22", pm: "PM2", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3194, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 76.69, durH: 0.61, lot: "A4597-12", pm: "FL2", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3195, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 75.19, durH: 0.50, lot: "A4606-24", pm: "PM2", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3196, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 73.81, durH: 0.72, lot: "A4583-13", pm: "PM3", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3197, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 72.46, durH: 1.69, lot: "A4807-11", pm: "FL2", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3198, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 72.36, durH: 2.79, lot: "A4500-28", pm: "PM6", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3199, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 71.33, durH: 0.77, lot: "A4774-13", pm: "PM3", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3200, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 68.51, durH: 1.10, lot: "A4686-29", pm: "PM1", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3201, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 67.03, durH: 2.83, lot: "A4513-12", pm: "PM3", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3202, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 66.01, durH: 1.14, lot: "A4947-16", pm: "PM6", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3203, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 64.75, durH: 2.63, lot: "A4814-22", pm: "PM3", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3204, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 64.28, durH: 0.53, lot: "A4576-18", pm: "PM1", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3205, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 63.13, durH: 5.19, lot: "A4989-21", pm: "FL2", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3206, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 62.40, durH: 2.37, lot: "A4808-21", pm: "PM2", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3207, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 60.48, durH: 1.09, lot: "A4562-13", pm: "PM2", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3208, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 60.08, durH: 0.36, lot: "A4934-25", pm: "FL4", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3209, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 57.38, durH: 1.00, lot: "A4745-25", pm: "PM6", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3210, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 57.38, durH: 1.06, lot: "A4659-12", pm: "PM6", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3211, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 56.52, durH: 5.58, lot: "A4883-20", pm: "PM4", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3212, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 53.62, durH: 0.37, lot: "A4879-18", pm: "FL4", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3213, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 52.53, durH: 2.65, lot: "A4924-15", pm: "FL4", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3214, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 50.15, durH: 0.30, lot: "A4764-10", pm: "FL2", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3215, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 48.04, durH: 2.71, lot: "A4605-26", pm: "PM2", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3216, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 47.95, durH: 0.50, lot: "A4575-27", pm: "PM3", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3217, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 45.81, durH: 0.30, lot: "A4968-10", pm: "FL4", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3218, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 44.11, durH: 0.82, lot: "A4888-26", pm: "FL2", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3219, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 43.99, durH: 0.62, lot: "A4652-12", pm: "FL2", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3220, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 41.62, durH: 0.45, lot: "A4856-18", pm: "PM1", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3221, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 37.79, durH: 0.30, lot: "A4765-21", pm: "FL2", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3222, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 36.83, durH: 0.82, lot: "A4682-17", pm: "PM3", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3223, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 35.73, durH: 1.23, lot: "A4772-27", pm: "PM7", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3224, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 35.72, durH: 0.30, lot: "A4898-26", pm: "PM7", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3225, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 35.72, durH: 0.32, lot: "A4668-17", pm: "PM7", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3226, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 35.71, durH: 1.58, lot: "A4813-16", pm: "PM7", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3227, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 35.71, durH: 0.36, lot: "A4912-17", pm: "PM7", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3228, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 35.55, durH: 0.30, lot: "A4918-22", pm: "FL2", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3229, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 35.51, durH: 1.22, lot: "A4878-17", pm: "PM7", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3230, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 35.39, durH: 0.30, lot: "A4602-26", pm: "FL2", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3231, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 35.26, durH: 0.30, lot: "A4874-10", pm: "FL2", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3232, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 35.14, durH: 0.40, lot: "A4514-18", pm: "FL2", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3233, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 35.12, durH: 0.30, lot: "A4741-18", pm: "FL2", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3234, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 34.95, durH: 0.30, lot: "A4599-29", pm: "FL2", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3235, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 34.60, durH: 0.74, lot: "A4676-24", pm: "FL2", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3236, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 34.42, durH: 2.59, lot: "A4913-21", pm: "FL3", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3237, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 34.38, durH: 1.71, lot: "A4988-21", pm: "FL3", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3238, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 34.31, durH: 1.53, lot: "A4612-13", pm: "FL2", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3239, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 33.20, durH: 0.30, lot: "A4616-25", pm: "PM3", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3240, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 33.03, durH: 0.66, lot: "A4600-20", pm: "PM3", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3241, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 28.26, durH: 0.30, lot: "A4604-25", pm: "FL2", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3242, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 27.09, durH: 0.63, lot: "A4819-29", pm: "FL3", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3243, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 26.55, durH: 0.44, lot: "A4930-10", pm: "FL4", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3244, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 25.40, durH: 0.30, lot: "A4834-21", pm: "FL3", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3245, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 25.29, durH: 0.30, lot: "A4909-12", pm: "FL3", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3246, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 24.28, durH: 0.38, lot: "A4927-13", pm: "FL3", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3247, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 22.78, durH: 0.73, lot: "A4698-16", pm: "PM3", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3248, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 21.43, durH: 0.30, lot: "A4744-15", pm: "PM6", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3249, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 19.31, durH: 0.41, lot: "A4722-20", pm: "FL4", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3250, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 15.46, durH: 3.54, lot: "A4910-22", pm: "FL3", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3251, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 15.40, durH: 1.62, lot: "A4737-22", pm: "FL3", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3252, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 15.10, durH: 0.76, lot: "A4880-12", pm: "PM3", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3253, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 14.63, durH: 0.30, lot: "A4871-15", pm: "PM7", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3254, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 10.19, durH: 3.18, lot: "A4587-14", pm: "PM5", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3255, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 8.72, durH: 1.17, lot: "A4802-24", pm: "FL2", depts: ["QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),
    mk({ idn: 3256, plant: "LS3", type: "Undichte Blister", status: "behoben", dStart: 7.46, durH: 1.65, lot: "A4923-29", pm: "PM3", depts: ["MST", "QC"], measures: "Anonymisierter Realfall (LS3, 2026).", real: true }),

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
