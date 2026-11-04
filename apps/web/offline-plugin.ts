/**
 * Build-time plugin: emits `offline-manifest.json` and `sw.js` (= `const MANIFEST = …;` + src/sw/sw.js).
 * The buildId is a SHA-256 over the shell file names, so any code change yields a new shell cache.
 * Every file carries its SHA-256 so an offline pack download can verify integrity, not just size.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { Plugin } from "vite";
import { planOffline } from "./src/pwa/manifest.ts";

/** Web app manifest: Ukrainian UI, standalone, local-first. No shortcuts into the exam (it must be started deliberately). */
export const WEB_MANIFEST = {
  name: "Hospodar YKI — фінська для життя", short_name: "Hospodar YKI", lang: "uk", dir: "ltr",
  description: "Незалежний застосунок для вивчення фінської й тренувальних репетицій YKI. Не офіційний YKI. Прогрес зберігається лише на пристрої.",
  start_url: "./", scope: "./", display: "standalone", background_color: "#FFFFFF", theme_color: "#083B7A",
  icons: [{ src: "icons/hospodar-yki-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
};

export function offlinePlugin(): Plugin {
  return {
    name: "hospodar-offline",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      // Installability (WEB-06): the brand mark is copied into the BUILD output only (single owner stays assets/images/brand).
      const extra: [string, Buffer][] = [
        ["icons/hospodar-yki-mark.svg", readFileSync(new URL("../../assets/images/brand/hospodar-yki-mark.svg", import.meta.url))],
        ["manifest.webmanifest", Buffer.from(JSON.stringify(WEB_MANIFEST, null, 2))],
      ];
      for (const [fileName, source] of extra) this.emitFile({ type: "asset", fileName, source });
      const entry = (url: string, data: Buffer) => ({ url, bytes: data.byteLength, sha256: createHash("sha256").update(data).digest("hex") });
      const files = [...Object.values(bundle).map(o => entry(o.fileName,
        o.type === "chunk" ? Buffer.from(o.code) : typeof o.source === "string" ? Buffer.from(o.source) : Buffer.from(o.source))),
        ...extra.filter(([n]) => !(n in bundle)).map(([n, d]) => entry(n, d))];
      if (!files.some(f => f.url === "index.html")) files.push({ url: "index.html", bytes: 0 });
      const shellNames = files.filter(f => !f.url.endsWith(".map")).map(f => f.url).sort().join("\n");
      const manifest = planOffline(files, createHash("sha256").update(shellNames).digest("hex").slice(0, 16));
      const template = readFileSync(new URL("./src/sw/sw.js", import.meta.url), "utf8");
      this.emitFile({ type: "asset", fileName: "offline-manifest.json", source: JSON.stringify(manifest, null, 2) });
      this.emitFile({ type: "asset", fileName: "sw.js", source: `const MANIFEST = ${JSON.stringify({ buildId: manifest.buildId, shell: manifest.shell })};\n${template}` });
    },
  };
}
