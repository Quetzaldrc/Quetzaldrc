import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANT — GitHub Pages :
// Si ton site est publié sur https://TON-PSEUDO.github.io/NOM-DU-REPO/,
// remplace "/" ci-dessous par "/NOM-DU-REPO/" (avec les slashs).
// Si ton repo s'appelle exactement TON-PSEUDO.github.io (site "utilisateur"),
// laisse "/" tel quel.
export default defineConfig({
  plugins: [react()],
  base: "/",
});
