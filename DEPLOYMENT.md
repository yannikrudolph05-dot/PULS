# PULS online stellen (GitHub Pages) – Schritt für Schritt

Die App wird mit dem Paket **gh-pages** veröffentlicht. Die Werkzeuge sind schon
eingerichtet: in `package.json` gibt es den Befehl `npm run deploy`, und das
lokale Git-Repo mit erstem Commit ist bereits angelegt.

Es fehlen nur noch: ein GitHub-Repo, einmalig verbinden, dann veröffentlichen.

---

## 1. GitHub-Repo anlegen (im Browser, einmalig)
1. Auf **https://github.com** einloggen → oben rechts **+** → **New repository**.
2. **Repository name**: z. B. `puls` (klein, ohne Leerzeichen).
3. **Public** auswählen.
4. **Keine** Häkchen bei „Add a README/.gitignore/license" (das Projekt bringt alles mit).
5. **Create repository**. GitHub zeigt dir danach die Repo-Adresse, z. B.
   `https://github.com/DEIN-NAME/puls.git`.

## 2. Projekt mit dem Repo verbinden (Terminal, einmalig)
Im Projektordner `stoerungsmelder` (ersetze NAME und REPO durch deine Werte):
```
git remote add origin https://github.com/NAME/REPO.git
git push -u origin main
```
> Beim ersten `push` fragt GitHub nach Anmeldung. Als „Passwort" wird **kein**
> Passwort akzeptiert, sondern ein **Personal Access Token** (GitHub → Settings →
> Developer settings → Tokens). Alternativ einmalig die GitHub-Browser-Anmeldung
> bestätigen, wenn sie erscheint.

## 3. Veröffentlichen
```
npm run deploy
```
Das baut die App (`predeploy` läuft automatisch) und schiebt den fertigen
`dist/`-Ordner auf den Branch **gh-pages**.

## 4. GitHub Pages einschalten (im Browser, einmalig)
Repo öffnen → **Settings** → links **Pages** →
- **Source**: „Deploy from a branch"
- **Branch**: `gh-pages` / `(root)` → **Save**.

Nach ~1 Minute ist die Seite online unter:
```
https://NAME.github.io/REPO/
```

## 5. Später aktualisieren
Nach Änderungen am Code einfach erneut:
```
npm run deploy
```
(Optional vorher den Quellcode sichern: `git add -A && git commit -m "..." && git push`.)

---

## Falls die Seite weiß bleibt
Dann liegt es an der Pfad-Einstellung. In `vite.config.js` `base: "./"` ersetzen
durch `base: "/REPO/"` (mit deinem Repo-Namen), dann `npm run deploy` erneut.

## Tipp
Die `gh`-CLI (GitHub-Kommandozeile) ist auf deinem Rechner nicht installiert.
Du brauchst sie nicht – aber falls du die GitHub-Anmeldung einfacher haben
möchtest, kannst du sie später von **https://cli.github.com** installieren und
mit `gh auth login` einmalig anmelden.
