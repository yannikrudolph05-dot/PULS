# PULS – GWS Cockpit (Prototyp, Vite + React)

**PULS** (Produktions-Linien-Überwachung & Störungsmeldung) ist das Produkt im
Dach **GWS Cockpit**: ein modernisierter Fehlermelde-Prozess für die
Verpackungslinien **LS3** und **DSMFLEX**. Dieser Ordner ist die auf
**Vite + React** migrierte, in mehrere Dateien aufgeteilte App.

> **Status:** Prototyp / Proof of Concept. Alle Meldungen sind erfundene
> Demo-Daten. Kein Produktivsystem, nicht GxP-validiert.

---

## Schnellstart (3 Befehle)

Im Terminal in **diesem** Ordner (`stoerungsmelder`):

```
npm install      # einmalig: lädt alle benötigten Pakete
npm run dev      # startet die App, öffnet z. B. http://localhost:5173
```

Stoppen mit `Strg + C`. Fertige Website bauen: `npm run build` (Ergebnis in `dist/`).

---

## Projektstruktur

```
stoerungsmelder/
├─ index.html              Einstiegsseite
├─ vite.config.js          Vite-Konfiguration (base: "./" für GitHub Pages)
├─ package.json            Abhängigkeiten & Befehle
└─ src/
   ├─ main.jsx             Startpunkt (hängt React in die Seite)
   ├─ App.jsx              Wurzel: Login-Gate, Navigation, Detailfenster, Toast
   ├─ config.js            ★ ZENTRALE CONFIG – alle veränderlichen Werte (Name, Keys, Abteilungen, Personen, Typen)
   ├─ fields.js            Feld-Schema je Meldungstyp (eine Quelle für Formular/Detail/E-Mail)
   ├─ email.js             Versand (Transport gekapselt: EmailJS jetzt / Outlook später)
   ├─ emailTemplates.js    HTML-Aufbau der Mails (Design wie die echten Vorlagen)
   ├─ theme.js             Farbpalette (GWS-Cockpit-Optik)
   ├─ ui.jsx               Wiederverwendbare UI-Bausteine
   ├─ utils/format.js      Datum/Dauer/Verlauf-Hilfsfunktionen
   ├─ data/
   │  ├─ useReports.js     Gekapselte Datenschicht (+ localStorage)
   │  └─ seed.js           Erfundene Demo-Daten (inkl. Vorjahre)
   └─ components/
      ├─ Header.jsx  DemoBanner.jsx  Login.jsx  Attachments.jsx
      ├─ Board.jsx   NewReport.jsx   Detail.jsx   Stats.jsx
```

---

## Was steckt drin (Funktionsüberblick)

1. **Rollen-Login** – „An der Anlage" + je Abteilung eine Login-Klasse
   (automatisch aus der Config). Rolle oben rechts wechselbar.
2. **Rechte je Rolle** – nur „An der Anlage" darf melden/bearbeiten/Status
   ändern/Hilfe anfordern/antworten. Abteilungen: lesen + Rückfragen.
3. **Bearbeiten** laufender Meldungen – Maßnahmen-Nachtrag oben, übrige Felder
   darunter; Meldungstyp bleibt fix; jede Änderung landet im Verlauf.
4. **E-Mail-Versand (EmailJS)** – getrennt „im Cockpit benachrichtigen" vs.
   „per E-Mail"; eine Mail an **mehrere Empfänger** (Abteilungen **und** einzelne
   Personen); HTML-Mails im Stil der echten Vorlagen; Ergebnis im Verlauf; stürzt
   ohne Schlüssel nicht ab. Transport gekapselt → später Outlook-Server.
5. **Hilfe anfordern** – Abteilungen und einzelne Personen anschreiben.
6. **Rückfragen (Ticket-Stil)** – Abteilungen fragen, Anlage antwortet; offene
   Rückfragen im Board markiert. **Verlauf ein-/ausklappbar** (Standard: zu).
7. **Abteilungs-Ansicht** – Filter „Alle" ↔ „Nur meine benachrichtigten".
8. **Meldungstypen** – Undichte Blister, Partikelfund (mit PM/Modul),
   AK-Störungsmitteilung, Mengenabweichung, Integritätsverletzungsmitteilung,
   Produktauffälligkeiten. Neue Typen über `fields.js` leicht erweiterbar.
9. **Anhänge** – PDF/Bilder am Ticket (Prototyp: im Browser, max. 1,5 MB/Datei).
10. **Statistik je Anlage** – Filter nach **Jahr/All-time** und **PM**; Trend,
    Verteilung, Ø Bearbeitungsdauer, **Pareto** nach Ursache, **Hotspot** nach
    PM, **Auffälligkeits-Erkennung** (Häufungen) und **Wirksamkeits-Check (PDCA)**.
11. **Viele Demo-Daten** – abgeschlossene Fälle über Monate und Vorjahre.

---

## Was DU noch selbst tun musst

Alles in **einer** Datei: `src/config.js`.

1. **EmailJS einrichten** (siehe `../SETUP_ANLEITUNG.md`, Teil D) und die drei
   Schlüssel eintragen: `EMAILJS.SERVICE_ID`, `EMAILJS.TEMPLATE_ID`,
   `EMAILJS.PUBLIC_KEY`. Im Template: „To Email" = `{{email}}`, Betreff
   `{{subject}}`, und der Inhalt als **`{{{message}}}`** (drei Klammern! sonst
   wird das HTML als Text angezeigt). Ohne Schlüssel: Demo-Modus, kein Absturz.
2. **Echte E-Mail-Adressen** nachtragen: pro Abteilung in `DEPARTMENTS` (`email`),
   einzelne Personen in `CONTACTS`, ggf. `ABSENDER_EMAIL` und `ANLAGE_EMAIL`.
3. Optional: weitere **Abteilung**/Person ergänzen – erscheint automatisch an
   allen Stellen. Neuer **Meldungstyp**: Typ in `PLANTS` + Felder in `fields.js`.
4. Später **Outlook-Server**: in `config.js` `MAIL_TRANSPORT = "outlook"` setzen
   und in `email.js` die Funktion `sendViaOutlook()` an euren Endpunkt anbinden.

---

## Online stellen (GitHub Pages, Kurzfassung)

```
npm run build               # erzeugt den Ordner dist/
```

`dist/` zu GitHub Pages bringen (am einfachsten via Paket `gh-pages`). Bei
einem klassischen Projekt-Repo ggf. in `vite.config.js` `base: "/<repo-name>/"`
setzen. Details in `../SETUP_ANLEITUNG.md`, Teil E.
