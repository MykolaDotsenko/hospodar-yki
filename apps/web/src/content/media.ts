/**
 * Repo media for apps/web, read from the physical owners' manifests (assets/*, learning/…/librivox-human.json,
 * sources/youtube). Every item passes the domain rights gate AND must exist as a bundled file; anything else is
 * dropped and listed in `refused` (shown to reviewers, never silently used). YouTube is link-only — no embed.
 */
import { admitExternalLink, admitMedia, type MediaEntry } from "@hospodar/domain";
import audioManifest from "../../../../assets/audio/available.json";
import videoManifest from "../../../../assets/video/open/available.json";
import pictureManifest from "../../../../assets/images/pictures/available.json";
import illustrationManifest from "../../../../assets/images/illustrations/library.json";
import librivoxManifest from "../../../../learning/exercises/b1/audio-training/librivox-human.json";
import youtube from "../../../../sources/youtube/youtube-catalog.json";

const files = import.meta.glob([
  "../../../../assets/audio/open/**/*.{ogg,mp3}", "../../../../assets/audio/segments/**/*.ogg", "../../../../assets/audio/human/librivox/**/*.ogg",
  "../../../../assets/video/open/*.webm", "../../../../assets/images/pictures/*.jpg", "../../../../assets/images/illustrations/*.svg",
], { query: "?url", import: "default", eager: true }) as Record<string, string>;
const urlOf = (repoPath: string) => Object.entries(files).find(([k]) => k.endsWith("/" + repoPath))?.[1] ?? null;

export interface Credit { credit: string; licence: string; licenceUrl: string | null; source: string | null }
export type Admitted<T> = T & { url: string; credit: Credit };
export const refused: { id: string; reason: string }[] = [];

function admit<T extends MediaEntry>(items: T[]): Admitted<T>[] {
  return items.flatMap(e => {
    const g = admitMedia(e);
    const url = urlOf(e.path);
    if (!g.ok || !url) { refused.push({ id: e.id, reason: g.ok ? "file not bundled" : g.reason }); return []; }
    return [{ ...e, url, credit: { credit: g.credit, licence: g.licence, licenceUrl: e.license_url ?? null, source: g.source } }];
  });
}
/** Commons page title → readable source title ("File:Fi-Suomi_johdanto.ogg" → "Fi-Suomi johdanto"). */
export const sourceTitle = (source: string | null, fallback: string) => {
  const s = source ? decodeURIComponent(source) : "";
  const skn = /\/SKN\w*?_([A-Za-zÅÄÖåäö]+)_\d+\.mp3$/.exec(s);
  if (skn) return `Murrenäyte: ${skn[1]}`;
  const m = /File:(?:Fi-)?([^/?#]+)\.(ogg|mp3|webm|jpg)$/i.exec(s);
  return m ? m[1]!.replace(/_/g, " ") : fallback;
};

type AudioEntry = MediaEntry & { kind: string; topic?: string; level?: string; parent?: string; approx_duration_seconds?: number };
const audio = admit((audioManifest as unknown as { items: AudioEntry[] }).items);
export const openRecordings = audio.filter(a => a.kind === "original_recording");
/** Time-cut parts of the two monologues; boundaries are NOT verified phrase boundaries (manifest warning). */
export const segmentsOf = (parentPath: string) => audio.filter(a => a.kind === "derived_excerpt" && a.parent === parentPath);

type LibriVoxEntry = MediaEntry & { work: string; writer: string; duration_seconds: number; boundary_start: string; boundary_end: string; level_hint: string;
  questions: { kind: string; prompt_fi: string }[] };
const librivox = admit((librivoxManifest as unknown as { items: LibriVoxEntry[] }).items);
/** Grouped by work → narrator → parts (parts cut at detected pauses in read speech). */
export const librivoxWorks = [...new Set(librivox.map(l => l.work))].map(work => {
  const parts = librivox.filter(l => l.work === work);
  return { work, writer: parts[0]!.writer, level: parts[0]!.level_hint, questions: parts[0]!.questions,
    narrators: [...new Set(parts.map(p => p.narrator!))].map(n => ({ narrator: n, parts: parts.filter(p => p.narrator === n) })) };
});

type VideoEntry = MediaEntry & { duration_seconds: number; teacher_review: string };
export const videos = admit((videoManifest as unknown as { assets: VideoEntry[] }).assets);

type PictureEntry = MediaEntry & { alt_fi: string; alt_uk: string; topics: string[]; levels: string[]; width: number; height: number };
export const pictures = admit((pictureManifest as unknown as { assets: PictureEntry[] }).assets);

type IllustrationEntry = MediaEntry & { alt_fi: string; alt_uk: string; topic: string; has_visible_solution: boolean; mode: string };
export const illustrations = admit((illustrationManifest as unknown as { items: IllustrationEntry[] }).items).filter(i => i.mode === "LEARN_only");

type LinkEntry = Parameters<typeof admitExternalLink>[0] & { creator: string; title: string; cefr_estimate?: string; skills?: string[];
  why_useful?: string; original_question_seeds?: { id: string; prompt_fi: string }[] };
export const externalLinks = (youtube as unknown as { items: LinkEntry[] }).items.flatMap(l => {
  const g = admitExternalLink(l);
  if (!g.ok) { refused.push({ id: l.id, reason: g.reason }); return []; }
  return [{ ...l, url: g.url, host: g.host }];
});
