import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite-Konfiguration.
// base: "./" sorgt für RELATIVE Pfade im fertigen Build. Damit funktioniert die
// Seite sowohl lokal (npm run preview) als auch später auf GitHub Pages, ohne
// dass die Seite "weiß" bleibt. Falls du ein klassisches Projekt-Pages-Repo
// nutzt und es doch Probleme gibt, kann hier stattdessen "/<repo-name>/" stehen.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
