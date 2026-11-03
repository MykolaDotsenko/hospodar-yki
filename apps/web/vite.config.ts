import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

// Content JSON and the generated design tokens are read from their single physical
// owners in the repository (learning/, app/tokens.css) — never copied into apps/web.
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: { fs: { allow: [repoRoot] } },
  build: { outDir: "dist", sourcemap: true },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
