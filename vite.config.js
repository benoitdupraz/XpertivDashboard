import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// "base" doit correspondre au sous-dossier final sur xpertiv.pro.
// Pour un premier test sur Vercel/Netlify (racine du domaine), mets "/".
// Pour la mise en ligne définitive sur xpertiv.pro/admin, garde "/admin/".
export default defineConfig({
  plugins: [react()],
  base: "/",
});
