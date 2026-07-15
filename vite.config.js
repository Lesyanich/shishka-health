import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { aeoPlugin } from "./scripts/aeo.mjs";

export default defineConfig({
  plugins: [react(), aeoPlugin()],
  server: { port: 5173 },
});
