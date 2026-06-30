// ============================================================================
//  src/config.js  –  ZENTRALE KONFIGURATION (einzige Quelle der Wahrheit)
// ----------------------------------------------------------------------------
//  HIER und NUR HIER stehen alle veränderlichen Werte. Im restlichen Code ist
//  nichts davon hartcodiert. Wenn du später etwas anpasst (EmailJS-Schlüssel,
//  E-Mail-Adressen, eine neue Abteilung), änderst du es ausschließlich in
//  dieser Datei – alle anderen Stellen ziehen sich die Werte automatisch.
// ============================================================================

// --- 0) Produkt-Identität ---------------------------------------------------
//  "GWS Cockpit" ist die Dachmarke, "PULS" das Produkt darin.
export const APP_NAME = "PULS";
export const APP_LONG = "Produktions-Linien-Überwachung & Störungsmeldung";
export const APP_PARENT = "GWS Cockpit";

// --- 1) EmailJS-Schlüssel ---------------------------------------------------
//  Diese drei Werte bekommst du auf https://www.emailjs.com (siehe
//  SETUP_ANLEITUNG.md, Teil D). Solange sie leer sind, läuft die App im
//  Demo-Modus: Meldungen werden trotzdem angelegt, es wird nur keine echte
//  E-Mail verschickt (kein Absturz).
export const EMAILJS = {
  SERVICE_ID: "service_db3h1jp", // z. B. "service_ab12cde"
  TEMPLATE_ID: "template_wm9s4kr", // z. B. "template_xy34fgh"
  PUBLIC_KEY: "dlj8fN2hDYmiG6spg", // z. B. "AbCdEfGhIjKlMnOp"
};

//  Versand-Transport: Heute "emailjs". Später lässt sich hier "outlook"
//  einstellen (eigener Outlook-/Graph-Server) – dann wird in email.js nur die
//  Transport-Funktion getauscht, der restliche Code bleibt unverändert.
export const MAIL_TRANSPORT = "emailjs"; // "emailjs" | "outlook"

// --- 2) E-Mail-Adressen -----------------------------------------------------
//  Absender aller Benachrichtigungen (in EmailJS als verbundenes Konto).
export const ABSENDER_EMAIL = "yannik.rudolph05@gmail.com";

//  Postfach "der Anlage": Empfänger für Rückfragen der Abteilungen an die
//  Anlage. Vorerst dieselbe Adresse wie der Absender (so kommen die Test-Mails
//  bei dir an). Später hier die echte Anlagen-/Schicht-Adresse eintragen.
export const ANLAGE_EMAIL = ABSENDER_EMAIL;

// --- 3) Abteilungen (EINZIGE QUELLE DER WAHRHEIT) ---------------------------
//  Aus dieser Liste leiten sich AUTOMATISCH ab:
//    (a) die Login-Klassen (eine Rolle je Abteilung)         -> buildRoles()
//    (b) die Benachrichtigungs-Toggles bei "Neue Meldung"    -> DEPARTMENTS
//    (c) die Abteilungsauswahl bei "Hilfe anfordern"         -> DEPARTMENTS
//  Eine neue Abteilung hier eintragen => sie erscheint sofort an allen drei
//  Stellen. "key" ist der stabile, technische Bezeichner (wird gespeichert),
//  "label" der angezeigte Name, "email" der Empfänger.
export const DEPARTMENTS = [
  { key: "MST", label: "MS&T", email: "yannikrudolph@outlook.de" },
  { key: "RND", label: "R&D", email: "yannikrudolph@outlook.de" },
  { key: "QC", label: "QC", email: "yannikrudolph@outlook.de" },
  { key: "MGMT", label: "MGMT", email: "yannikrudolph@outlook.de" },
  { key: "MAINT", label: "Maintenance", email: "yannikrudolph@outlook.de" },
  { key: "PROD", label: "Production", email: "yannikrudolph@outlook.de" },
];

// Bequeme Nachschlage-Helfer für die Abteilungen.
export const deptByKey = (key) => DEPARTMENTS.find((d) => d.key === key);
export const deptLabel = (key) => deptByKey(key)?.label ?? key;
export const deptLabels = (keys = []) => keys.map(deptLabel).join(", ");
export const deptEmails = (keys = []) =>
  keys.map((k) => deptByKey(k)?.email).filter(Boolean);

// --- 3b) Einzelne Personen (Adressbuch) -------------------------------------
//  Zusätzlich zu Abteilungen können einzelne Personen als E-Mail-Empfänger
//  gewählt werden (eine Mail an mehrere gleichzeitig). Adressen vorerst auf die
//  Testadresse gesetzt – hier später die echten Personen-Adressen eintragen.
export const CONTACTS = [
  { key: "p_mst", label: "MS&T Rufbereitschaft", email: "yannikrudolph@outlook.de" },
  { key: "p_schicht", label: "Schichtleitung", email: "yannikrudolph@outlook.de" },
  { key: "p_qa", label: "QA-Bereitschaft", email: "yannikrudolph@outlook.de" },
];

// --- 4) Anlagen (ebenfalls aus der Config ableitbar) ------------------------
//  Meldungstypen, Partikel-Fundorte und PM-Optionen je Anlage.
export const PLANTS = {
  LS3: {
    label: "LS3",
    types: ["Undichte Blister", "Partikelfund", "AK-Störungsmitteilung", "Integritätsverletzungsmitteilung"],
    particleOptions: ["EM", "IM", "MM", "PP", "TM"],
    pmOptions: ["PM1", "PM2", "PM3", "PM4", "PM5", "PM6", "PM7", "FL2", "FL3", "FL4"],
  },
  DSMFLEX: {
    label: "DSMFLEX",
    types: ["Undichte Blister", "Partikelfund", "Mengenabweichung", "Integritätsverletzungsmitteilung", "Produktauffälligkeiten"],
    particleOptions: ["Buffer", "EM", "Casting/Curing DND", "IM", "IMC", "PP"],
    pmOptions: ["PM1", "PM2", "PM3", "PM4", "FL2", "FL3", "FL4"],
  },
};
export const PLANT_KEYS = Object.keys(PLANTS);

// Weitere Dropdown-Stammdaten (zentral, damit überall gleich).
export const PP_OPTIONS = ["PP1", "PP2", "PP3", "PP4"];
export const DISCOVERY = [
  "Prozess (in der PP)",
  "QS50/DSP50 (vor AK)",
  "QS80/DSP80 (nach AK)",
  "NK80 (Nachkontrolle QS50)",
  "NK80 (Nachkontrolle QS80)",
  "SV",
  "100%-Kontrolle",
];
export const CAUSES = [
  "Siegelfehler",
  "Schalenfehler",
  "Folienfehler",
  "Eingesiegelte KL",
  "WT Fehler",
  "Sonstige",
];
export const AK_OPTIONS = [
  "SBM 3490",
  "SBM 3491",
  "SBM 3789",
  "AK 22509",
  "LSFLEX AK01",
  "LSFLEX AK02",
  "LSFLEX AK03",
];
// Auslöser einer Integritätsverletzung / eines ungeplanten Stillstands.
export const INTEGRITY_CAUSES = [
  "Stromausfall",
  "Feueralarm",
  "Ausfall Wassersysteme",
  "Ausfall der Lüftungsanlagen",
  "Wassereinbruch",
  "Sonstiges",
];
// Häufig genutzte Ja/Nein-Auswahl (für die Checklisten-Felder der neuen Typen).
export const JA_NEIN = ["Ja", "Nein"];

// --- 5) Rollen / Login ------------------------------------------------------
//  Es gibt die Rolle "An der Anlage" plus je Abteilung eine eigene Login-Klasse.
//  Die Abteilungs-Rollen werden direkt aus DEPARTMENTS erzeugt.
export const ROLE_ANLAGE = {
  id: "anlage",
  type: "anlage",
  label: "An der Anlage",
};

export function buildRoles() {
  const deptRoles = DEPARTMENTS.map((d) => ({
    id: "dept:" + d.key,
    type: "dept",
    deptKey: d.key,
    label: "Abteilung " + d.label,
  }));
  return [ROLE_ANLAGE, ...deptRoles];
}

export const roleById = (id) => buildRoles().find((r) => r.id === id);

// --- 6) Rechte je Rolle (zentral definiert) ---------------------------------
//  Nur "An der Anlage" darf erstellen/bearbeiten/Status ändern/Hilfe anfordern
//  und auf Rückfragen antworten. Abteilungs-Rollen dürfen lesen + Rückfragen
//  stellen.
export const isAnlage = (role) => role?.type === "anlage";
export const isDept = (role) => role?.type === "dept";
export const canCreate = (role) => isAnlage(role);
export const canEdit = (role) => isAnlage(role);
export const canChangeStatus = (role) => isAnlage(role);
export const canRequestHelp = (role) => isAnlage(role);
export const canAnswerQuery = (role) => isAnlage(role);
export const canRaiseQuery = (role) => isDept(role);
