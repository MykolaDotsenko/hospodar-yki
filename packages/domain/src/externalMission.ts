/**
 * Missions with an external source (CURATED-09; sources/audio/oph-adult-spoken-finnish, sources/learning/a2-b1-verified-
 * source-missions, sources/audio/authentic-dialogues). The recording or text stays on the publisher's site (OPH,
 * Kielibuusti, aoe.fi): nothing is downloaded, copied or embedded. The app gives only an original task around it:
 *
 *   open      the source link and the task; the learner listens or reads THERE, then answers in own words
 *             (or says honestly that the track was not found — then nothing is saved, nothing is invented)
 *   reflect   ONLY NOW: how to check the own answer; and, where the publisher's teacher page shows the answers,
 *             that page's link (before the attempt only the audio index is linked)
 *   transfer  a new situation without the source                                         → ungraded
 *   done      plus a suggestion for a later own recall (not scheduled, not tracked)
 *
 * Nothing is scored: the app never heard the recording the learner chose, so it cannot check the answer.
 * The task texts are original drafts pending S2 review; a release build shows only published ones.
 */
import { admitCatalogLink } from "./media.ts";
import type { Skill } from "./learner.ts";

export interface ExternalSourceItem {
  id: string; title_fi: string; title_uk?: string; cefr_suggested?: string; material_kind: string; publisher: string;
  source_page: string; audio_index_url?: string; first_attempt_url_policy?: string; source_note_uk?: string;
  is_official_yki?: boolean; ui_status?: string;
  mission?: { independent_prompt_fi?: string; reflection_uk?: string; transfer_prompt_fi?: string; delayed_recall_prompt_fi?: string };
}
export interface ExternalMission {
  id: string; title_fi: string; title_uk: string | null; level: string | null; publisher: string; skill: Extract<Skill, "listening" | "reading">;
  /** The only link before the attempt. */
  firstUrl: string; firstHost: string;
  /** The publisher page with the answers: shown only after the own attempt (null when the first link is that page). */
  afterUrl: string | null;
  note_uk: string | null; prompt_fi: string; reflection_uk: string; transfer_fi: string; later_fi: string | null;
}

/** Slides, PDFs and written dialogues ("…_not_audio") are read; audio and video kinds are listened to. */
const READ = /not_audio|pdf|slide|docx|written/i;
const LISTEN = /audio|mp3|podcast|video|spoken/i;
const str = (x: unknown): x is string => typeof x === "string" && x.trim().length > 0;

export function toExternalMission(x: ExternalSourceItem): ExternalMission | null {
  const m = x?.mission;
  if (!x || !/^[a-z\d_-]{1,80}$/i.test(String(x.id)) || x.is_official_yki === true || x.ui_status !== "external_task_usable_now") return null;
  if (!m || !str(m.independent_prompt_fi) || !str(m.reflection_uk) || !str(m.transfer_prompt_fi) || !str(x.title_fi)) return null;
  const skill = READ.test(x.material_kind) ? "reading" : LISTEN.test(x.material_kind) ? "listening" : null;
  if (!skill) return null;
  const hideTeacherPage = x.first_attempt_url_policy === "audio_index_only_hide_teacher_answer_page_until_attempt";
  const first = admitCatalogLink({ url: hideTeacherPage ? x.audio_index_url : x.source_page, official_yki: x.is_official_yki });
  if (!first.ok) return null;
  let afterUrl: string | null = null;
  if (hideTeacherPage) {
    const after = admitCatalogLink({ url: x.source_page, official_yki: x.is_official_yki });
    if (!after.ok) return null;
    afterUrl = after.url;
  }
  return {
    id: x.id, title_fi: x.title_fi, title_uk: str(x.title_uk) ? x.title_uk : null, level: str(x.cefr_suggested) ? x.cefr_suggested : null,
    publisher: x.publisher, skill, firstUrl: first.url, firstHost: first.host, afterUrl, note_uk: str(x.source_note_uk) ? x.source_note_uk : null,
    prompt_fi: m.independent_prompt_fi, reflection_uk: m.reflection_uk, transfer_fi: m.transfer_prompt_fi,
    later_fi: str(m.delayed_recall_prompt_fi) ? m.delayed_recall_prompt_fi : null,
  };
}

export type ExternalPhase = "open" | "reflect" | "transfer" | "done" | "not_found";
export interface ExternalSession { missionId: string; phase: ExternalPhase; answer: string; transfer: string }
export type ExternalEvent = { type: "ANSWER"; text: string } | { type: "NOT_FOUND" } | { type: "CONTINUE" } | { type: "SUBMIT_TRANSFER"; text: string };
export const EXTERNAL_MAX_CHARS = 1200;
export class ExternalMissionError extends Error {
  constructor(public readonly code: "NOT_ALLOWED" | "EMPTY", m: string) { super(m); this.name = "ExternalMissionError"; }
}

export const startExternal = (m: ExternalMission): ExternalSession => ({ missionId: m.id, phase: "open", answer: "", transfer: "" });
const text = (t: string) => {
  const v = String(t ?? "").trim();
  if (!v) throw new ExternalMissionError("EMPTY", "Write something first");
  return v.slice(0, EXTERNAL_MAX_CHARS);
};

export function externalReducer(s: ExternalSession, m: ExternalMission, e: ExternalEvent): ExternalSession {
  if (m.id !== s.missionId) throw new TypeError("Mission mismatch");
  const no = (): never => { throw new ExternalMissionError("NOT_ALLOWED", `${e.type} not allowed in ${s.phase}`); };
  switch (e.type) {
    case "ANSWER": return s.phase === "open" ? { ...s, answer: text(e.text), phase: "reflect" } : no();
    case "NOT_FOUND": return s.phase === "open" ? { ...s, phase: "not_found" } : no();
    case "CONTINUE": return s.phase === "reflect" ? { ...s, phase: "transfer" } : no();
    case "SUBMIT_TRANSFER": return s.phase === "transfer" ? { ...s, transfer: text(e.text), phase: "done" } : no();
  }
}

export function externalView(s: ExternalSession, m: ExternalMission) {
  const after = s.phase === "reflect" || s.phase === "transfer" || s.phase === "done";
  return {
    phase: s.phase,
    firstUrl: s.phase === "open" || s.phase === "reflect" ? m.firstUrl : null,
    prompt_fi: s.phase === "open" || s.phase === "reflect" ? m.prompt_fi : null,
    ownAnswer: after ? s.answer : null,
    reflection_uk: s.phase === "reflect" ? m.reflection_uk : null,
    afterUrl: after ? m.afterUrl : null,
    transfer_fi: s.phase === "transfer" ? m.transfer_fi : null,
    later_fi: s.phase === "done" ? m.later_fi : null,
  };
}

/** Both texts are ungraded: the app cannot know which recording or page the learner used. */
export function externalEvidence(s: ExternalSession, m: ExternalMission) {
  if (s.phase !== "done") throw new ExternalMissionError("NOT_ALLOWED", "Not finished");
  return [
    { skill: m.skill, taskId: m.id, status: "ungraded" as const, response: `[external source on ${m.firstHost}; own words, not checked by the app] ${s.answer}` },
    { skill: "speaking" as const, taskId: `${m.id}-transfer`, status: "ungraded" as const, response: `[new situation, no source] ${s.transfer}` },
  ];
}

/**
 * Pause and resume an external-source mission (COG-11): the own answer and the text being typed are kept on this
 * device. A finished mission or an honest «not found» is not kept; an inconsistent record is refused.
 */
export interface ExternalDraft { missionId: string; session: ExternalSession; value: string; savedAt: string }
export function externalDraft(s: ExternalSession, value: string, now: Date = new Date()): ExternalDraft | null {
  if (s.phase === "done" || s.phase === "not_found") return null;
  if (s.phase === "open" && !String(value ?? "").trim()) return null;
  return { missionId: s.missionId, session: { ...s }, value: String(value ?? "").slice(0, EXTERNAL_MAX_CHARS), savedAt: now.toISOString() };
}
export function restoreExternalDraft(raw: unknown, m: ExternalMission): ExternalDraft | null {
  const d = raw as ExternalDraft | null;
  const ok = (v: unknown) => typeof v === "string" && v.length <= EXTERNAL_MAX_CHARS;
  if (!d || typeof d !== "object" || d.missionId !== m.id || !ok(d.value) || typeof d.savedAt !== "string" || !Number.isFinite(Date.parse(d.savedAt))) return null;
  const s = d.session as ExternalSession | null;
  if (!s || s.missionId !== m.id || !["open", "reflect", "transfer"].includes(s.phase) || !ok(s.answer) || !ok(s.transfer)) return null;
  if ((s.phase !== "open") !== (s.answer.trim() !== "") || s.transfer !== "") return null;
  return { missionId: d.missionId, session: { ...s }, value: d.value, savedAt: d.savedAt };
}
