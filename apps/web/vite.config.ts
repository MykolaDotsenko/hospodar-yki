import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { offlinePlugin } from "./offline-plugin.ts";
import { cspPlugin } from "./csp-plugin.ts";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

// Content JSON and the generated design tokens are read from their single physical
// owners in the repository (learning/, app/tokens.css) — never copied into apps/web.
// docs/RELEASE.md: source maps must not be published with a release. A release build (VITE_HOSPODAR_CHANNEL=release)
// therefore emits none; the beta build keeps them for debugging. Checked by scripts/release_readiness.py and release.spec.ts.
export default defineConfig(({ mode }) => ({
  plugins: [react(), offlinePlugin(), cspPlugin()],
  base: "./",
  server: { fs: { allow: [repoRoot] } },
  build: { outDir: "dist", sourcemap: loadEnv(mode, process.cwd(), "VITE_").VITE_HOSPODAR_CHANNEL !== "release" },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
}));
