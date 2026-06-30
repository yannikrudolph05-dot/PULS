# PULS online stellen – der einfache Weg (GitHub Desktop, ohne Terminal)

Du brauchst **kein Git-Wissen und kein Terminal**. Eine GitHub-Action baut die
Seite automatisch, sobald du in GitHub Desktop auf „Push" klickst.

> Wichtig: **Nicht** „Create a New Repository" benutzen – das legt ein leeres
> Projekt an der falschen Stelle an. Dein fertiges Projekt liegt schon hier und
> ist ein Git-Repo:
> `/Users/yannikrudolph/Mailvorlagen_CC/stoerungsmelder`

---

## 1. Projekt in GitHub Desktop öffnen (einmalig)
1. Falls noch offen: den Dialog „Create a New Repository" mit **Cancel** schließen.
2. Oben links **Current Repository** anklicken → Button **Add** → **Add Existing
   Repository…**
3. Bei **Local Path** auf **Choose…** und diesen Ordner wählen:
   `Mailvorlagen_CC/stoerungsmelder`
   → **Add Repository**.

Jetzt zeigt GitHub Desktop oben „Current Repository: stoerungsmelder" und es gibt
schon Commits (von mir vorbereitet).

## 2. Auf GitHub veröffentlichen (einmalig)
1. Oben den blauen Button **Publish repository** klicken.
2. **Name**: `PULS`
3. Häkchen **„Keep this code private"** entfernen (es soll öffentlich sein).
4. **Publish Repository**.

GitHub Desktop lädt alles hoch (du bist schon als *yannikrudolph05-dot*
angemeldet, also keine extra Anmeldung nötig).

## 3. GitHub Pages auf „Actions" stellen (einmalig, im Browser)
1. Auf **github.com** dein neues Repo **PULS** öffnen.
2. Oben **Settings** → links **Pages**.
3. Bei **Source** „**GitHub Actions**" auswählen.

## 4. Die Automatik einmal laufen lassen
- Gehe im Repo auf den Tab **Actions** → links „Deploy to GitHub Pages" →
  rechts **Run workflow** (oder einfach 1 Minute warten; beim Veröffentlichen
  startet sie meist schon von selbst).
- Wenn der grüne Haken erscheint, ist die Seite online unter:
  ```
  https://yannikrudolph05-dot.github.io/PULS/
  ```

## Ab jetzt: Updates ganz einfach
Wenn ich später etwas ändere, machst du in **GitHub Desktop** nur:
**Commit** (unten links Text eingeben → „Commit to main") → oben **Push origin**.
Die Action baut und veröffentlicht die neue Version automatisch. Fertig.

---

## Falls die Seite weiß bleibt
Dann an der Pfad-Einstellung drehen: in `vite.config.js` `base: "./"` ersetzen
durch `base: "/PULS/"`, committen, pushen.

## Alternative (nur falls du es doch über Terminal willst)
Im Projektordner einmalig `npm run deploy` (nutzt das Paket `gh-pages`). Dann in
den Pages-Einstellungen Source = Branch `gh-pages`. Der Actions-Weg oben ist aber
einfacher und empfohlen.
