/**
 * Offline manifest (WEB-05/WEB-06): which built files form the app shell (always precached by the service worker)
 * and which media form optional, explicitly downloaded packs. Pure; used by the build plugin and the app.
 * Videos are never offered offline: without reviewed captions they are not playable here (A11Y-03).
 */
export interface OfflineFile { url: string; bytes: number; sha256?: string }
export interface OfflinePack { id: "audio" | "pictures"; title_uk: string; files: OfflineFile[]; bytes: number }
export interface OfflineManifest { buildId: string; shell: string[]; shellBytes: number; packs: OfflinePack[]; notOffline: { videos: number } }

const ext = (f: string) => (f.split("?")[0]!.match(/\.([a-z0-9]+)$/i)?.[1] ?? "").toLowerCase();
const SHELL = new Set(["html", "js", "css", "svg", "woff", "woff2", "ico", "json", "webmanifest"]);
const AUDIO = new Set(["mp3", "ogg", "oga", "opus", "wav", "m4a"]);
const PICTURES = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);
const VIDEO = new Set(["webm", "mp4", "m4v", "mov"]);

export function planOffline(files: OfflineFile[], buildId: string): OfflineManifest {
  if (!/^[a-f0-9]{8,64}$/.test(buildId)) throw new TypeError("buildId must be a hex digest");
  const list = files.filter(f => !f.url.endsWith(".map") && f.url !== "sw.js" && f.url !== "offline-manifest.json")
    .sort((a, b) => a.url.localeCompare(b.url));
  const shellFiles = list.filter(f => SHELL.has(ext(f.url)));
  if (!shellFiles.some(f => f.url === "index.html")) throw new Error("index.html missing from the shell");
  const pack = (id: OfflinePack["id"], title_uk: string, kinds: Set<string>): OfflinePack => {
    const fs = list.filter(f => kinds.has(ext(f.url)));
    return { id, title_uk, files: fs, bytes: fs.reduce((n, f) => n + f.bytes, 0) };
  };
  return {
    buildId, shell: shellFiles.map(f => f.url), shellBytes: shellFiles.reduce((n, f) => n + f.bytes, 0),
    packs: [pack("audio", "Аудіо: аудіювання, медіатека й записи для іспиту", AUDIO), pack("pictures", "Фото для фото-місій і медіатеки", PICTURES)],
    notOffline: { videos: list.filter(f => VIDEO.has(ext(f.url))).length },
  };
}

export type PackState = "downloaded" | "partial" | "online_only";
/** Honest status: "downloaded" only when every file of the pack is cached. */
export const packState = (total: number, cached: number): PackState => total > 0 && cached === total ? "downloaded" : cached > 0 ? "partial" : "online_only";

export const formatMb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} МБ`;
