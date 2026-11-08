/**
 * Runtime side of WEB-05/WEB-06: service-worker registration with an update guard, and explicit offline packs.
 * Media is cached only when the learner asks; each file is checked against the manifest size AND SHA-256 before it is stored,
 * and a pack counts as "downloaded" only when every file is present (no false offline claim).
 */
import { packState, type OfflineFile, type OfflineManifest, type OfflinePack, type PackState } from "./manifest.ts";

export const MEDIA_CACHE = "hospodar-media-v1";
export interface CacheLike { match(url: string): Promise<Response | undefined>; put(url: string, r: Response): Promise<void>; delete(url: string): Promise<boolean> }
export interface CachesLike { open(name: string): Promise<CacheLike> }
const absolute = (url: string) => new URL(url, document.baseURI).href;

export async function loadManifest(fetchFn: typeof fetch = fetch): Promise<OfflineManifest | null> {
  try {
    const r = await fetchFn("./offline-manifest.json", { cache: "no-store" });
    return r.ok ? (await r.json()) as OfflineManifest : null;
  } catch { return null; }
}

/** An offline-ready pack requires matching current content bytes, not just a cache key.
 * Recheck after deployments as unchanged URLs may contain old media. Sequential digesting
 * avoids loading an entire pack at once (SubtleCrypto.digest is not streaming).
 */
export async function packStatus(pack: OfflinePack, caches: CachesLike, abs = absolute): Promise<{ state: PackState; cached: number }> {
  const cache = await caches.open(MEDIA_CACHE);
  let cached = 0;
  for (const f of pack.files) {
    if (await responseMatchesFile(await cache.match(abs(f.url)), f)) cached++;
  }
  return { state: packState(pack.files.length, cached), cached };
}

export type DownloadResult = { ok: true; files: number } | { ok: false; failedUrl: string; reason: "NETWORK" | "HTTP" | "SIZE_MISMATCH" | "HASH_MISMATCH" | "QUOTA_OR_DISK_FULL" | "CACHE_READBACK_FAILED"; done: number };
const sha256Hex = async (b: ArrayBuffer) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", b))].map(x => x.toString(16).padStart(2, "0")).join("");

/** A CacheStorage match is not a receipt: old assets keep the same URL across builds. */
async function responseMatchesFile(response: Response | undefined, file: OfflineFile): Promise<boolean> {
  if (!response?.ok || !Number.isSafeInteger(file.bytes) || file.bytes < 0 ||
      !/^[a-f0-9]{64}$/.test(file.sha256 ?? "")) return false;
  try {
    const bytes = await response.arrayBuffer();
    return bytes.byteLength === file.bytes && (await sha256Hex(bytes)) === file.sha256;
  } catch { return false; }
}

/** Sequential verified download. Invalid cached entries are evicted before refetching.
 * A write only counts after fresh CacheStorage readback verifies current SHA-256.
 */
export async function downloadPack(pack: OfflinePack, caches: CachesLike, onProgress: (done: number, total: number) => void,
  fetchFn: typeof fetch = fetch, abs = absolute): Promise<DownloadResult> {
  let cache: CacheLike;
  try { cache = await caches.open(MEDIA_CACHE); }
  catch { return { ok: false, failedUrl: pack.files[0]?.url ?? "", reason: "CACHE_READBACK_FAILED", done: 0 }; }
  let done = 0;
  for (const f of pack.files) {
    const url = abs(f.url);
    let stored: Response | undefined;
    try { stored = await cache.match(url); }
    catch { return { ok: false, failedUrl: f.url, reason: "CACHE_READBACK_FAILED", done }; }
    if (stored) {
      if (await responseMatchesFile(stored, f)) { onProgress(++done, pack.files.length); continue; }
      // Never let the service worker serve known-stale or corrupt media when network repair fails.
      try { await cache.delete(url); }
      catch { return { ok: false, failedUrl: f.url, reason: "CACHE_READBACK_FAILED", done }; }
    }
    let res: Response;
    try { res = await fetchFn(url, { cache: "no-store" }); }
    catch { return { ok: false, failedUrl: f.url, reason: "NETWORK", done }; }
    if (!res.ok) return { ok: false, failedUrl: f.url, reason: "HTTP", done };
    let buf: ArrayBuffer;
    try { buf = await res.arrayBuffer(); }
    catch { return { ok: false, failedUrl: f.url, reason: "NETWORK", done }; }
    if (buf.byteLength !== f.bytes) return { ok: false, failedUrl: f.url, reason: "SIZE_MISMATCH", done };
    if (!/^[a-f0-9]{64}$/.test(f.sha256 ?? "") || (await sha256Hex(buf)) !== f.sha256)
      return { ok: false, failedUrl: f.url, reason: "HASH_MISMATCH", done };
    try { await cache.put(url, new Response(buf, { headers: { "Content-Type": res.headers.get("content-type") ?? "application/octet-stream" } })); }
    catch { return { ok: false, failedUrl: f.url, reason: "QUOTA_OR_DISK_FULL", done }; }
    let verified = false;
    try { verified = await responseMatchesFile(await cache.match(url), f); }
    catch { /* readback failed: fail closed */ }
    if (!verified) {
      try { await cache.delete(url); } catch { /* never report a successful save */ }
      return { ok: false, failedUrl: f.url, reason: "CACHE_READBACK_FAILED", done };
    }
    onProgress(++done, pack.files.length);
  }
  return { ok: true, files: done };
}

export async function removePack(pack: OfflinePack, caches: CachesLike, abs = absolute) {
  const cache = await caches.open(MEDIA_CACHE);
  for (const f of pack.files) await cache.delete(abs(f.url));
}

/** A NEW version is waiting only if it is installed, sits in `registration.waiting`, and a DIFFERENT worker is active.
 * (A first install is never an "update"; engines differ in the order of statechange vs controller, so the
 * registration slots are the source of truth.) */
export const isWaitingUpdate = (state: string, inWaitingSlot: boolean, otherActive: boolean) => state === "installed" && inWaitingSlot && otherActive;

/** Update guard state shared with the UI: a waiting worker is only activated by an explicit learner action. */
type Listener = (ready: boolean) => void;
let waiting: ServiceWorker | null = null;
const listeners = new Set<Listener>();
const announce = () => listeners.forEach(l => l(waiting !== null));
export const onUpdateReady = (l: Listener) => { listeners.add(l); l(waiting !== null); return () => { listeners.delete(l); }; };

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return null;
  try {
    const reg = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
    const track = (w: ServiceWorker | null) => {
      if (!w) return;
      const check = () => {
        const next = isWaitingUpdate(w.state, reg.waiting === w, reg.active !== null && reg.active !== w) ? w : waiting === w ? null : waiting;
        if (next !== waiting) { waiting = next; announce(); }
      };
      check(); w.addEventListener("statechange", check);
    };
    track(reg.waiting); track(reg.installing);
    reg.addEventListener("updatefound", () => track(reg.installing));
    return reg;
  } catch { return null; }
}

/** Activate the waiting version and reload once it controls the page. The caller guarantees no active exam. */
export function applyUpdate() {
  if (!waiting) return;
  navigator.serviceWorker.addEventListener("controllerchange", () => location.reload(), { once: true });
  waiting.postMessage({ type: "SKIP_WAITING" });
}

export const isOfflineReady = () => "serviceWorker" in navigator && navigator.serviceWorker.controller !== null;
