/* Hospodar YKI service worker (WEB-05, WEB-06). Classic script; the build prepends `const MANIFEST = {...}`.
 *
 *  - App shell (HTML/JS/CSS/SVG) is precached per build in `hospodar-shell-<buildId>` so the app opens offline.
 *  - Media (audio/pictures) is NOT cached implicitly. Only an explicit "save for offline" in the app writes a pack
 *    into `hospodar-media-v1`; anything else is network-only and the UI says `online_only` (no false offline claim).
 *  - A new version installs and then WAITS. It activates only when the page sends SKIP_WAITING, which the app does
 *    only on the learner's click outside an active exam (update guard: an exam is never reloaded underneath them).
 *  - Cached media answers Range requests with 206 so <audio> seeking works offline.
 *  - Never touches IndexedDB/localStorage (learner data), never caches cross-origin requests.
 */
/* global MANIFEST */
const SHELL_CACHE = "hospodar-shell-" + MANIFEST.buildId;
const MEDIA_CACHE = "hospodar-media-v1";

/** Parse a single `bytes=a-b` / `bytes=a-` / `bytes=-n` range against a known size. null = serve whole; "invalid" = 416. */
function parseRange(header, size) {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(String(header).trim());
  if (!m || (m[1] === "" && m[2] === "")) return "invalid";
  let start, end;
  if (m[1] === "") { const n = Number(m[2]); start = Math.max(0, size - n); end = size - 1; }
  else { start = Number(m[1]); end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1); }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) return "invalid";
  return { start, end };
}

async function withRange(request, response) {
  const header = request.headers.get("range");
  if (!header || !response || response.status !== 200) return response;
  const buf = await response.arrayBuffer();
  const r = parseRange(header, buf.byteLength);
  const type = response.headers.get("content-type") || "application/octet-stream";
  if (r === "invalid") return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${buf.byteLength}` } });
  if (r === null) return new Response(buf, { status: 200, headers: { "Content-Type": type } });
  return new Response(buf.slice(r.start, r.end + 1), { status: 206, headers: {
    "Content-Type": type, "Content-Range": `bytes ${r.start}-${r.end}/${buf.byteLength}`, "Content-Length": String(r.end - r.start + 1), "Accept-Ranges": "bytes" } });
}

const scopeUrl = () => new URL(self.registration ? self.registration.scope : self.location.href);
const abs = path => new URL(path, scopeUrl()).href;

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await cache.addAll(MANIFEST.shell.map(abs));          // all-or-nothing: a partial shell never becomes "offline ready"
  })());
  // No skipWaiting(): a new version waits for the learner's click (update guard).
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys())
      if (key.startsWith("hospodar-shell-") && key !== SHELL_CACHE) await caches.delete(key);   // media packs are kept
    await self.clients.claim();
  })());
});

self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== scopeUrl().origin) return;           // cross-origin (e.g. external links) untouched
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE);
      try {
        const fresh = await fetch(req);
        if (fresh.ok) return fresh;
        return (await cache.match(abs("index.html"), { ignoreVary: true })) || fresh;
      } catch {
        return (await cache.match(abs("index.html"), { ignoreVary: true })) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const shell = await (await caches.open(SHELL_CACHE)).match(url.href, { ignoreSearch: true, ignoreVary: true });   // Vary: Origin must not hide the shell offline
    if (shell) return shell;
    const media = await (await caches.open(MEDIA_CACHE)).match(url.href, { ignoreSearch: true, ignoreVary: true });
    if (media) return withRange(req, media);
    return fetch(req);
  })());
});

if (typeof module !== "undefined") module.exports = { parseRange, withRange };   // unit tests only (never in the browser)
