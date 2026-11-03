/**
 * Media rights gate + presentation helpers (AGENTS: "Media must have verified redistribution rights; external
 * official/YouTube material is link-only"). Pure: callers pass manifest entries; nothing here touches the network.
 *
 *  - admitMedia: a local binary may be shown only with an allowed licence, an author/creator, a source page
 *    (unless project-original) and a safe repo path under assets/. NC/ND or unknown licences are refused.
 *  - admitExternalLink: YouTube/Yle/OPH items are link cards only — https, allow-listed host, no local
 *    transcript/media copy, LEARN only, never official YKI material.
 *  - shuffleOptions: deterministic per-question order so a key is not always in the same position.
 */
export interface MediaEntry {
  id: string; path: string; license?: string; rights?: string; author?: string; creator?: string; narrator?: string;
  source_page?: string; source_url?: string; audio_source?: string; license_url?: string;
}
export type Admission = { ok: true; licence: string; credit: string; source: string | null } | { ok: false; reason: string };

const LICENCE = /^(cc0(\s*1\.0)?|cc[- ]by(-sa)?[- ]\d\.\d|pd-self|public domain\b.*|project_original)$/i;
const SAFE_PATH = /^assets\/(audio|video|images)\/[a-z0-9_./-]+\.(ogg|mp3|webm|jpg|jpeg|png|svg)$/i;

export function admitMedia(e: MediaEntry): Admission {
  const licence = String(e.license ?? e.rights ?? "").trim();
  if (!e || typeof e.id !== "string" || !e.id) return { ok: false, reason: "missing id" };
  if (typeof e.path !== "string" || !SAFE_PATH.test(e.path) || e.path.includes("..")) return { ok: false, reason: "unsafe path" };
  if (!LICENCE.test(licence) || /\b(nc|nd)\b/i.test(licence)) return { ok: false, reason: `licence not redistributable: ${licence || "none"}` };
  const credit = String(e.author ?? e.creator ?? e.narrator ?? "").trim();
  if (!credit) return { ok: false, reason: "no author/creator" };
  const source = e.source_page ?? e.source_url ?? e.audio_source ?? null;
  const original = /^project_original$/i.test(licence);
  if (!original && !(typeof source === "string" && /^https:\/\//.test(source))) return { ok: false, reason: "no https source page" };
  return { ok: true, licence: normaliseLicence(licence), credit, source: original ? null : source };
}

/** "CC-BY-SA-3.0" / "CC BY-SA 3.0" → "CC BY-SA 3.0" (one display form for the same licence). */
export function normaliseLicence(l: string): string {
  const m = /^cc[- ]by(-sa)?[- ](\d\.\d)$/i.exec(l.trim());
  return m ? `CC BY${m[1] ? "-SA" : ""} ${m[2]}` : l.trim();
}

export interface ExternalLink {
  id: string; provider?: string; watch_url?: string; source_page?: string; title?: string; creator?: string; license?: string;
  transcript_locally_stored?: boolean; learning_mode_only?: boolean; official_yki_material?: boolean;
}
const LINK_HOSTS = ["www.youtube.com", "youtube.com", "youtu.be", "areena.yle.fi", "yle.fi", "www.oph.fi", "oph.fi", "www.jyu.fi"];

export function admitExternalLink(x: ExternalLink): { ok: true; url: string; host: string } | { ok: false; reason: string } {
  const raw = String(x?.watch_url ?? x?.source_page ?? "");
  // Strict, dependency-free parse (the domain has no DOM URL): https://host[/path][?query], no credentials or port.
  const m = /^https:\/\/([a-z0-9.-]+)(\/[^\s"'<>]*)?$/i.exec(raw);
  if (!m) return { ok: false, reason: "invalid or non-https url" };
  const host = m[1]!.toLowerCase();
  if (!LINK_HOSTS.includes(host)) return { ok: false, reason: `host not allowed: ${host}` };
  if (x.transcript_locally_stored === true) return { ok: false, reason: "local copy of third-party transcript" };
  if (x.learning_mode_only !== true) return { ok: false, reason: "not marked LEARN-only" };
  if (x.official_yki_material === true) return { ok: false, reason: "official YKI material is not linked from LEARN cards" };
  if (x.provider === "youtube" && !/^youtube_link_only/i.test(String(x.license ?? ""))) return { ok: false, reason: "YouTube item without link-only licence note" };
  return { ok: true, url: raw, host };
}

/** FNV-1a — tiny, stable across engines; used only to order options, never for security. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h;
}
export function shuffleOptions<T>(id: string, options: T[], correctIndex: number): { options: T[]; correct_index: number } {
  const order = options.map((_, i) => i).sort((a, b) => hash(`${id}:${a}`) - hash(`${id}:${b}`) || a - b);
  return { options: order.map(i => options[i]!), correct_index: order.indexOf(correctIndex) };
}
