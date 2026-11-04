/**
 * Build-time plugin: emits `offline-manifest.json` and `sw.js` (= `const MANIFEST = …;` + src/sw/sw.js).
 * The buildId is a SHA-256 over the shell file names, so any code change yields a new shell cache.
 * Every file carries its SHA-256 so an offline pack download can verify integrity, not just size.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { Plugin } from "vite";
import { planOffline } from "./src/pwa/manifest.ts";

export function offlinePlugin(): Plugin {
  return {
    name: "hospodar-offline",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      const files = Object.values(bundle).map(o => {
        const data = o.type === "chunk" ? Buffer.from(o.code) : typeof o.source === "string" ? Buffer.from(o.source) : Buffer.from(o.source);
        return { url: o.fileName, bytes: data.byteLength, sha256: createHash("sha256").update(data).digest("hex") };
      });
      if (!files.some(f => f.url === "index.html")) files.push({ url: "index.html", bytes: 0 });
      const shellNames = files.filter(f => !f.url.endsWith(".map")).map(f => f.url).sort().join("\n");
      const manifest = planOffline(files, createHash("sha256").update(shellNames).digest("hex").slice(0, 16));
      const template = readFileSync(new URL("./src/sw/sw.js", import.meta.url), "utf8");
      this.emitFile({ type: "asset", fileName: "offline-manifest.json", source: JSON.stringify(manifest, null, 2) });
      this.emitFile({ type: "asset", fileName: "sw.js", source: `const MANIFEST = ${JSON.stringify({ buildId: manifest.buildId, shell: manifest.shell })};\n${template}` });
    },
  };
}
