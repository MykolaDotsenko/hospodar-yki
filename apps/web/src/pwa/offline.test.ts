import swSource from "../sw/sw.js?raw";
import { describe, expect, it } from "vitest";
import { planOffline, packState } from "./manifest.ts";
import { downloadPack, isWaitingUpdate, packStatus, removePack, type CachesLike } from "./offline.ts";

const files = [
  { url: "index.html", bytes: 500 }, { url: "assets/index-a1.js", bytes: 9000 }, { url: "assets/index-a1.js.map", bytes: 99999 },
  { url: "assets/index-b2.css", bytes: 800 }, { url: "assets/clock-1.svg", bytes: 300 }, { url: "assets/talk-x.ogg", bytes: 4000 },
  { url: "assets/story-y.mp3", bytes: 6000 }, { url: "assets/park-z.jpg", bytes: 2000 }, { url: "assets/video-v.webm", bytes: 50000 },
];
class MemCache { m = new Map<string, Response>(); async match(u: string) { return this.m.get(u)?.clone(); } async put(u: string, r: Response) { this.m.set(u, r); }
  async delete(u: string) { return this.m.delete(u); } }
const memCaches = () => { const all = new Map<string, MemCache>(); const c: CachesLike & { all: typeof all } = { all, open: async n => { if (!all.has(n)) all.set(n, new MemCache()); return all.get(n)!; } }; return c; };
const abs = (u: string) => "https://app.test/" + u;

describe("offline manifest (WEB-05)", () => {
  it("shell = html/js/css/svg without sourcemaps; audio and pictures are separate opt-in packs; videos never offline", () => {
    const m = planOffline(files, "abcdef0123456789");
    expect(m.shell).toEqual(["assets/clock-1.svg", "assets/index-a1.js", "assets/index-b2.css", "index.html"]);
    expect(m.packs.map(p => [p.id, p.files.map(f => f.url), p.bytes])).toEqual([
      ["audio", ["assets/story-y.mp3", "assets/talk-x.ogg"], 10000], ["pictures", ["assets/park-z.jpg"], 2000]]);
    expect(m.notOffline.videos).toBe(1);
    expect(() => planOffline(files.filter(f => f.url !== "index.html"), "abcdef0123456789")).toThrow(/index.html/);
    expect(() => planOffline(files, "not-hex")).toThrow();
  });
  it("a pack is 'downloaded' only when every file is cached", () => {
    expect([packState(3, 3), packState(3, 1), packState(3, 0), packState(0, 0)]).toEqual(["downloaded", "partial", "online_only", "online_only"]);
  });
});

const hex = async (n: number) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new Uint8Array(n)))].map(x => x.toString(16).padStart(2, "0")).join("");
const withHashes = await Promise.all(files.map(async f => ({ ...f, sha256: await hex(f.bytes) })));
describe("update guard (WEB-06)", () => {
  it("only an installed worker in the waiting slot with another active worker is an update; a first install never is", () => {
    expect(isWaitingUpdate("installed", true, true)).toBe(true);
    expect(isWaitingUpdate("installed", false, false)).toBe(false);   // first install (WebKit may report this before activation)
    expect(isWaitingUpdate("installed", true, false)).toBe(false);
    expect(isWaitingUpdate("activated", false, false)).toBe(false);
    expect(isWaitingUpdate("installing", false, true)).toBe(false);
  });
});

describe("explicit pack download", () => {
  const pack = planOffline(withHashes, "abcdef0123456789").packs[0]!;
  const okFetch = (async (u: string) => new Response(new Uint8Array(u.endsWith(".mp3") ? 6000 : 4000), { headers: { "content-type": "audio/x" } })) as unknown as typeof fetch;
  it("stores every file after a size check, then reports downloaded; removal returns to online_only", async () => {
    const c = memCaches(); const seen: number[] = [];
    expect(await downloadPack(pack, c, d => seen.push(d), okFetch, abs)).toEqual({ ok: true, files: 2 });
    expect(seen).toEqual([1, 2]);
    expect(await packStatus(pack, c, abs)).toEqual({ state: "downloaded", cached: 2 });
    await removePack(pack, c, abs);
    expect((await packStatus(pack, c, abs)).state).toBe("online_only");
  });
  it("a truncated file is refused (SIZE_MISMATCH) and never stored; earlier files stay → honest 'partial'", async () => {
    const c = memCaches();
    const bad = (async (u: string) => new Response(new Uint8Array(u.endsWith(".mp3") ? 6000 : 3999))) as unknown as typeof fetch;
    expect(await downloadPack(pack, c, () => {}, bad, abs)).toMatchObject({ ok: false, reason: "SIZE_MISMATCH", failedUrl: "assets/talk-x.ogg", done: 1 });
    expect(await packStatus(pack, c, abs)).toEqual({ state: "partial", cached: 1 });
  });
  it("same size but different bytes is refused (HASH_MISMATCH); a file without a recorded hash is never offline", async () => {
    const tampered = (async (u: string) => new Response(new Uint8Array(u.endsWith(".mp3") ? 6000 : 4000).fill(1))) as unknown as typeof fetch;
    expect(await downloadPack(pack, memCaches(), () => {}, tampered, abs)).toMatchObject({ ok: false, reason: "HASH_MISMATCH", done: 0 });
    const noHash = { ...pack, files: pack.files.map(f => ({ url: f.url, bytes: f.bytes })) };
    expect(await downloadPack(noHash, memCaches(), () => {}, okFetch, abs)).toMatchObject({ ok: false, reason: "HASH_MISMATCH" });
  });
  it("detects a same-size stale cache entry, reports partial and downloads only the invalid file", async () => {
    const c = memCaches();
    expect((await downloadPack(pack, c, () => {}, okFetch, abs)).ok).toBe(true);
    const cache = await c.open("hospodar-media-v1");
    const url = abs(pack.files[0]!.url);
    const entry = await cache.match(url);
    const changed = new Uint8Array(await entry!.arrayBuffer());
    changed[0] ^= 1; // same URL and byte length, different SHA-256
    await cache.put(url, new Response(changed));
    expect(await packStatus(pack, c, abs)).toEqual({ state: "partial", cached: 1 });
    const fetched: string[] = [];
    const fetchSpy = (async (u: string) => { fetched.push(u); return okFetch(u); }) as unknown as typeof fetch;
    expect(await downloadPack(pack, c, () => {}, fetchSpy, abs)).toEqual({ ok: true, files: 2 });
    expect(fetched).toEqual([url]);
    expect(await packStatus(pack, c, abs)).toEqual({ state: "downloaded", cached: 2 });
  });
  it("evicts an invalid cached asset even if network repair is impossible", async () => {
    const c = memCaches();
    await downloadPack(pack, c, () => {}, okFetch, abs);
    const cache = await c.open("hospodar-media-v1");
    const url = abs(pack.files[0]!.url);
    await cache.put(url, new Response(new Uint8Array(pack.files[0]!.bytes - 1)));
    const down = (async () => { throw new TypeError("offline"); }) as unknown as typeof fetch;
    expect(await downloadPack(pack, c, () => {}, down, abs)).toMatchObject({ ok: false, failedUrl: pack.files[0]!.url, reason: "NETWORK", done: 0 });
    expect(await cache.match(url)).toBeUndefined(); // the SW cannot serve stale bytes
    expect(await packStatus(pack, c, abs)).toEqual({ state: "partial", cached: 1 });
  });
  it("refuses an already-cached file when the current manifest has no usable SHA-256", async () => {
    const c = memCaches();
    await downloadPack(pack, c, () => {}, okFetch, abs);
    const noHash = { ...pack, files: [{ ...pack.files[0]!, sha256: undefined }, pack.files[1]!] };
    expect(await packStatus(noHash, c, abs)).toEqual({ state: "partial", cached: 1 });
    expect(await downloadPack(noHash, c, () => {}, okFetch, abs)).toMatchObject({ ok: false, reason: "HASH_MISMATCH", done: 0 });
    expect(await (await c.open("hospodar-media-v1")).match(abs(pack.files[0]!.url))).toBeUndefined();
  });
  it("refuses silent CacheStorage eviction after put: no false success or progress increment", async () => {
    const c = memCaches();
    const cache = await c.open("hospodar-media-v1") as MemCache;
    cache.put = async () => {}; // emulates a successful but lost cache write
    const seen: number[] = [];
    expect(await downloadPack(pack, c, n => seen.push(n), okFetch, abs)).toMatchObject({ ok: false, reason: "CACHE_READBACK_FAILED", done: 0 });
    expect(seen).toEqual([]);
    expect(await packStatus(pack, c, abs)).toEqual({ state: "online_only", cached: 0 });
  });
  it("network failure and HTTP errors are reported, not hidden", async () => {
    const down = (async () => { throw new TypeError("offline"); }) as unknown as typeof fetch;
    expect(await downloadPack(pack, memCaches(), () => {}, down, abs)).toMatchObject({ ok: false, reason: "NETWORK" });
    const missing = (async () => new Response("no", { status: 404 })) as unknown as typeof fetch;
    expect(await downloadPack(pack, memCaches(), () => {}, missing, abs)).toMatchObject({ ok: false, reason: "HTTP" });
  });
});

describe("service worker (src/sw/sw.js, executed in a sandbox)", () => {
  const load = (manifest = { buildId: "b1", shell: ["index.html", "assets/index-a1.js"] }) => {
    const listeners: Record<string, (e: unknown) => void> = {};
    const c = memCaches();
    const net: string[] = [];
    let online = true;
    const sandbox: Record<string, unknown> = {
      MANIFEST: manifest, module: { exports: {} }, URL, Response, Promise, Number, String, Math,
      caches: { open: c.open, keys: async () => [...c.all.keys()], delete: async (k: string) => c.all.delete(k) },
      fetch: async (r: Request | string) => { const u = typeof r === "string" ? r : r.url; net.push(u); if (!online) throw new TypeError("offline"); return new Response("net:" + u); },
      self: { location: { href: "https://app.test/sw.js" }, registration: { scope: "https://app.test/" }, clients: { claim: async () => {} }, skipWaiting: () => { sandbox.skipped = true; },
        addEventListener: (t: string, f: (e: unknown) => void) => { listeners[t] = f; } },
    };
    (sandbox.self as Record<string, unknown>).caches = sandbox.caches;
    new Function(...Object.keys(sandbox), swSource)(...Object.values(sandbox));   // the real SW source, with stubbed globals
    const run = async (type: string, extra: Record<string, unknown>) => {
      let p: Promise<unknown> | undefined, resp: Promise<Response> | undefined;
      listeners[type]!({ ...extra, waitUntil: (x: Promise<unknown>) => { p = x; }, respondWith: (x: Promise<Response>) => { resp = x; } });
      await p; return resp ? await resp : undefined;
    };
    return { run, c, net, sandbox, setOnline: (v: boolean) => { online = v; }, exports: (sandbox.module as { exports: { parseRange: (h: string | null, n: number) => unknown } }).exports };
  };
  const req = (url: string, init: { mode?: string; range?: string; method?: string } = {}) =>
    ({ url, method: init.method ?? "GET", mode: init.mode ?? "no-cors", headers: new Headers(init.range ? { range: init.range } : {}) });

  it("parseRange: open, closed and suffix ranges; invalid → 416 marker", () => {
    const { parseRange } = load().exports;
    expect(parseRange(null, 100)).toBeNull();
    expect(parseRange("bytes=0-", 100)).toEqual({ start: 0, end: 99 });
    expect(parseRange("bytes=10-19", 100)).toEqual({ start: 10, end: 19 });
    expect(parseRange("bytes=-30", 100)).toEqual({ start: 70, end: 99 });
    expect(parseRange("bytes=90-500", 100)).toEqual({ start: 90, end: 99 });
    for (const h of ["bytes=200-", "bytes=5-2", "items=0-1", "bytes=-"]) expect(parseRange(h, 100)).toBe("invalid");
  });
  it("install precaches the whole shell without activating itself (update waits for the learner)", async () => {
    const sw = load();
    const shellCache = await sw.c.open("hospodar-shell-b1") as MemCache & { addAll?: (u: string[]) => Promise<void> };
    shellCache.addAll = async (urls: string[]) => { for (const u of urls) await shellCache.put(u, new Response("shell:" + u)); };
    await sw.run("install", {});
    expect([...shellCache.m.keys()]).toEqual(["https://app.test/index.html", "https://app.test/assets/index-a1.js"]);
    expect(sw.sandbox.skipped).toBeUndefined();
    await sw.run("message", { data: { type: "SKIP_WAITING" } });
    expect(sw.sandbox.skipped).toBe(true);
  });
  it("offline navigation gets the cached shell; media not saved by the learner goes to the network; saved media answers ranges with 206", async () => {
    const sw = load();
    await (await sw.c.open("hospodar-shell-b1")).put("https://app.test/index.html", new Response("<html>shell</html>"));
    await (await sw.c.open("hospodar-media-v1")).put("https://app.test/assets/talk-x.ogg", new Response(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), { headers: { "content-type": "audio/ogg" } }));
    sw.setOnline(false);
    expect(await (await sw.run("fetch", { request: req("https://app.test/", { mode: "navigate" }) }))!.text()).toBe("<html>shell</html>");
    const part = (await sw.run("fetch", { request: req("https://app.test/assets/talk-x.ogg", { range: "bytes=2-5" }) }))!;
    expect([part.status, part.headers.get("content-range"), [...new Uint8Array(await part.arrayBuffer())]]).toEqual([206, "bytes 2-5/10", [2, 3, 4, 5]]);
    sw.setOnline(true);
    expect(await (await sw.run("fetch", { request: req("https://app.test/assets/story-y.mp3") }))!.text()).toBe("net:https://app.test/assets/story-y.mp3");
    expect((await (await sw.c.open("hospodar-media-v1")).match("https://app.test/assets/story-y.mp3"))).toBeUndefined();   // never cached implicitly
    expect(await sw.run("fetch", { request: req("https://other.test/x.mp3") })).toBeUndefined();                           // cross-origin untouched
  });
  it("activate removes old shell versions but keeps the learner's media packs", async () => {
    const sw = load();
    for (const k of ["hospodar-shell-old", "hospodar-shell-b1", "hospodar-media-v1"]) await sw.c.open(k);
    await sw.run("activate", {});
    expect([...sw.c.all.keys()].sort()).toEqual(["hospodar-media-v1", "hospodar-shell-b1"]);
  });
});
