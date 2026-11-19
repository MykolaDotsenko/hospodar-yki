/**
 * Audio guide for YKI listening preparation (CURATED-09, docs/29 queue 10; sources/audio/yki-targeted-sources-2026-10.json).
 * External publisher pages (VIERKO/aoe.fi, Kielibuusti, Yle, Sitra, Selkosanomat, Papunet) with listening material,
 * shown on the rehearsal set-up screen only — never inside an attempt. Link-only: nothing is downloaded, copied or
 * embedded. Every entry must be labelled as not an exam simulation; official YKI samples are listed elsewhere
 * («Як виглядає іспит»), so they are refused here. A direct file download is refused: the learner goes to the
 * publisher's page, where its own terms and context apply.
 *
 * Bands are only a reading aid from the catalog's level label: warm-up (A-levels), B1 practice, stretch (B1+ or B2).
 * They are not a proficiency claim about the material or the learner.
 */
import { CATALOG_LINK_HOSTS } from "./media.ts";

/** The learning-link list plus three Finnish public publishers of plain-language or acted audio. */
export const YKI_AUDIO_GUIDE_HOSTS = Object.freeze([...CATALOG_LINK_HOSTS, "www.sitra.fi", "selkosanomat.fi", "papunet.net"]);

export interface YkiAudioCandidate {
  id: string; name: string; provider: string; level: string; format?: string; page: string; license?: string; notes?: string;
  not_exam_simulation?: boolean; is_official_yki_sample?: boolean;
}
export type YkiAudioBand = "warmup" | "b1" | "stretch";
export interface YkiAudioLink { id: string; title_fi: string; provider: string; level: string; band: YkiAudioBand; note_uk: string; url: string; host: string }

export function audioBand(level: string): YkiAudioBand {
  const l = String(level ?? "");
  if (/B1\+|B2/.test(l)) return "stretch";
  if (/B1/.test(l)) return "b1";
  return "warmup";
}

export function ykiAudioGuide(candidates: readonly YkiAudioCandidate[]): { links: YkiAudioLink[]; refused: { id: string; reason: string }[] } {
  const links: YkiAudioLink[] = [], refused: { id: string; reason: string }[] = [];
  for (const c of candidates ?? []) {
    const no = (reason: string) => refused.push({ id: String(c?.id), reason });
    if (!c || !/^[a-z0-9-]{3,80}$/.test(String(c.id))) { no("invalid id"); continue; }
    if (c.is_official_yki_sample === true) { no("official YKI samples are linked from «Як виглядає іспит»"); continue; }
    if (c.not_exam_simulation !== true) { no("not labelled as 'not an exam simulation'"); continue; }
    const m = /^https:\/\/([a-z0-9.-]+)(\/[^\s"'<>]*)?$/i.exec(String(c.page ?? ""));
    if (!m) { no("invalid or non-https url"); continue; }
    const host = m[1]!.toLowerCase();
    if (!YKI_AUDIO_GUIDE_HOSTS.includes(host)) { no(`host not allowed: ${host}`); continue; }
    if (/\/download\/|\.(pdf|mp3|ogg|wav|docx?)(\?|$)/i.test(m[2] ?? "")) { no("a direct file download, not a publisher page"); continue; }
    if (typeof c.name !== "string" || !c.name.trim() || typeof c.notes !== "string" || !c.notes.trim()) { no("no title or note"); continue; }
    links.push({ id: c.id, title_fi: c.name, provider: c.provider, level: c.level, band: audioBand(c.level), note_uk: c.notes, url: c.page, host });
  }
  const order: YkiAudioBand[] = ["warmup", "b1", "stretch"];
  return { links: links.sort((a, b) => order.indexOf(a.band) - order.indexOf(b.band)), refused };
}
