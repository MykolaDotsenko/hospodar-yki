/**
 * TS port of app/exam-core.mjs + inspectSpeakingReceipt (app/e06-speaking-evidence-policy.mjs) — ADR-027 "pure
 * policies" half of the EXAM engine (the transition machine lives in apps/web on XState). Behaviour must equal the
 * legacy module on the same inputs (test/exam-parity.test.ts). NOT official YKI software; never emits YKI grades.
 *
 * Invariants kept: no answer key before finish (scoreSession throws), practice deadline refuses commands (E04),
 * monotonic elapsed high-watermark, voice receipts only with consent + valid E06 metadata, ExamCheckpoint ≠ evidence.
 */
export const EXAM_STORAGE_KEY = "hospodar-yki:digitesti-rehearsal:v1";
export const EXAM_STATE_VERSION = 1;
export const MAX_ANSWER_CHARS = 12000;
export const PRACTICE_LIMITS_MINUTES = [0, 15, 30, 60] as const;
export const DEADLINE_EXPIRED = "DEADLINE_EXPIRED";

export class DeadlineError extends Error {
  readonly code = DEADLINE_EXPIRED;
  constructor() { super("Practice time has expired"); this.name = "DeadlineError"; }
}
export const isDeadlineError = (e: unknown) => (e as { code?: string } | null)?.code === DEADLINE_EXPIRED;

export type ExamSkill = "reading" | "listening" | "writing" | "speaking";
export interface ExamItem {
  id: string; skill: ExamSkill; kind: "choice" | "boolean" | "text"; sourceId: string; heading?: string; passage?: string;
  prompt: string; options?: string[]; correct?: number | string; audioPath?: string; audioOrigin?: "synthetic" | "human";
  requiredPoints?: string[];
}
export interface ExamBlueprint { skill_blocks: { skill: string; item_id: string; question_ids?: string[] }[] }
interface ReadingQ { id: string; type: string; prompt_fi?: string; statement_fi?: string; options_fi?: string[]; correct_index?: number; answer?: boolean }
export interface ExamContent {
  reading: { items: { id: string; title_fi: string; text_fi: string; questions: ReadingQ[] }[] };
  listening: { lessons: { id: string; title_fi: string; path: string; synthetic_audio?: boolean; questions: { id: string; prompt_fi: string; options_fi: string[]; correct_index: number }[] }[] };
  baseline: Record<"writing" | "speaking", { id: string; prompt_fi: string; required_points_fi?: string[] }[]>;
}

export function buildItems(blueprint: ExamBlueprint, content: ExamContent): ExamItem[] {
  if (!blueprint || !Array.isArray(blueprint.skill_blocks) || blueprint.skill_blocks.length !== 4)
    throw new Error("Expected one source-linked item for each of four skills");
  const items: ExamItem[] = [];
  for (const block of blueprint.skill_blocks) {
    if (block.skill === "reading") {
      const original = content.reading.items.find(item => item.id === block.item_id);
      if (!original) throw new Error(`Missing reading source ${block.item_id}`);
      for (const qid of block.question_ids ?? []) {
        const q = original.questions.find(x => x.id === qid);
        if (!q) throw new Error(`Missing question ${qid}`);
        const kind = q.type === "single_choice" ? "choice" : q.type === "true_false" ? "boolean" : "text";
        items.push({
          id: qid, skill: "reading", kind, sourceId: original.id, heading: original.title_fi, passage: original.text_fi,
          prompt: (q.prompt_fi || q.statement_fi) as string,
          ...(kind === "choice" ? { options: q.options_fi, correct: q.correct_index } : {}),
          ...(kind === "boolean" ? { options: ["Oikein", "Väärin"], correct: q.answer === true ? "true" : "false" } : {}),
        });
      }
    } else if (block.skill === "listening") {
      const original = content.listening.lessons.find(item => item.id === block.item_id);
      if (!original) throw new Error(`Missing audio source ${block.item_id}`);
      for (const qid of block.question_ids ?? []) {
        const q = original.questions.find(x => x.id === qid);
        if (!q) throw new Error(`Missing audio question ${qid}`);
        items.push({ id: qid, skill: "listening", kind: "choice", sourceId: original.id, heading: original.title_fi, prompt: q.prompt_fi,
          audioPath: original.path, audioOrigin: original.synthetic_audio ? "synthetic" : "human", options: q.options_fi, correct: q.correct_index });
      }
    } else if (block.skill === "writing" || block.skill === "speaking") {
      const original = content.baseline[block.skill].find(x => x.id === block.item_id);
      if (!original) throw new Error(`Missing productive prompt ${block.item_id}`);
      items.push({ id: original.id, skill: block.skill, kind: "text", sourceId: original.id, prompt: original.prompt_fi,
        requiredPoints: original.required_points_fi || [] });
    } else throw new Error("Unexpected skill");
  }
  if (new Set(items.map(x => x.id)).size !== items.length) throw new Error("Duplicate item ID");
  return items;
}

export interface SpeakingReceipt {
  sessionId: string; taskId: string; storageKey: string; sha256: string; bytes: number; durationMs: number; mimeType: string;
  revision: number; consentToLocalStorage: boolean; firstAttemptSealed: boolean; committedAt: string;
}
const RECEIPT_ID = /^[a-zA-Z0-9_-]{3,128}$/;
const SHA256 = /^[a-f0-9]{64}$/i;
const AUDIO_MIMES = new Set(["audio/webm", "audio/ogg", "audio/mp4", "audio/wav"]);
/** Validates receipt *metadata* only; it cannot prove the audio bytes exist (the store re-verifies them). */
export function inspectSpeakingReceipt(receipt: unknown, { sessionId, taskId }: { sessionId?: string; taskId?: string } = {}) {
  const errors: string[] = [];
  const r = receipt as Partial<SpeakingReceipt> | null;
  if (!r || typeof r !== "object" || Array.isArray(r)) return Object.freeze({ valid: false, errors: Object.freeze(["MISSING_RECEIPT"]) });
  if (!RECEIPT_ID.test(r.sessionId || "") || (sessionId && r.sessionId !== sessionId)) errors.push("WRONG_SESSION");
  if (!RECEIPT_ID.test(r.taskId || "") || (taskId && r.taskId !== taskId)) errors.push("WRONG_TASK");
  if (typeof r.storageKey !== "string" || !/^local-audio:[a-zA-Z0-9_-]{3,128}$/.test(r.storageKey)) errors.push("NO_DURABLE_STORAGE_REFERENCE");
  if (!SHA256.test(r.sha256 || "")) errors.push("AUDIO_HASH_MISSING");
  if (!Number.isSafeInteger(r.bytes) || (r.bytes as number) <= 0) errors.push("AUDIO_BYTES_MISSING");
  if (!Number.isFinite(r.durationMs) || (r.durationMs as number) <= 0) errors.push("POSITIVE_DURATION_REQUIRED");
  if (!AUDIO_MIMES.has(r.mimeType as string)) errors.push("UNSUPPORTED_OR_UNVERIFIED_AUDIO_FORMAT");
  if (!Number.isSafeInteger(r.revision) || (r.revision as number) < 1) errors.push("NO_COMMIT_REVISION");
  if (r.consentToLocalStorage !== true) errors.push("CONSENT_TO_STORAGE_MISSING");
  if (r.firstAttemptSealed !== true) errors.push("FIRST_ATTEMPT_NOT_SEALED");
  if (typeof r.committedAt !== "string" || !Number.isFinite(Date.parse(r.committedAt))) errors.push("NO_COMMIT_TIMESTAMP");
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}

export interface ExamSession {
  version: number; blueprintId: string; timeLimitMinutes: number; startedAt: string; finishedAt: string | null;
  index: number; answers: Record<string, string>; voiceRecorded: Record<string, boolean>; voiceReceipts: Record<string, SpeakingReceipt>;
  voiceConsent: boolean; elapsedHighWaterMs: number; lastSavedAt: string; sessionId: string;
  /** TZ-EXAM-02: the exam profile (id + content hash) this attempt started with; later profile edits never change it. */
  profileId?: string; profileHash?: string;
}
const SESSION_ID = /^[a-zA-Z0-9_-]{3,60}$/;
const TASK_ID = /^[a-z0-9_-]{1,110}$/i;
type SessionLike = { sessionId?: string; startedAt?: string };
export function sessionIdOf(session: SessionLike | null | undefined): string {
  if (SESSION_ID.test(session?.sessionId || "")) return session!.sessionId!;
  return "legacy-" + String(session?.startedAt || "").replace(/\D/g, "").slice(0, 40);
}

export function createSession(blueprintId: string, minutes = 0, now: Date = new Date(), sessionId: string | null = null,
  profile: { id: string; hash: string } | null = null): ExamSession {
  if (profile && !(/^[a-z0-9-]{3,60}$/.test(profile.id) && /^[0-9a-f]{8}$/.test(profile.hash))) throw new Error("Invalid exam profile");
  if (!/^yki-mini-[a-z0-9-]+$/.test(blueprintId)) throw new Error("Unknown blueprint id");
  if (!(PRACTICE_LIMITS_MINUTES as readonly number[]).includes(minutes)) throw new Error("Unsupported practice timer");
  if (Number.isNaN(now.getTime())) throw new Error("Invalid now");
  if (sessionId !== null && !SESSION_ID.test(sessionId)) throw new Error("Invalid session id");
  const base = { version: EXAM_STATE_VERSION, blueprintId, timeLimitMinutes: minutes, startedAt: now.toISOString(), finishedAt: null,
    index: 0, answers: {}, voiceRecorded: {}, voiceReceipts: {}, voiceConsent: false, elapsedHighWaterMs: 0, lastSavedAt: now.toISOString() };
  return { ...base, sessionId: sessionId || sessionIdOf(base), ...(profile ? { profileId: profile.id, profileHash: profile.hash } : {}) };
}

export function loadSession(raw: string | null | undefined, blueprintIds: string[]): { session: ExamSession | null; recovered: boolean } {
  if (!raw) return { session: null, recovered: false };
  try {
    const s = JSON.parse(raw);
    if (!s || s.version !== EXAM_STATE_VERSION || !blueprintIds.includes(s.blueprintId) ||
      !(PRACTICE_LIMITS_MINUTES as readonly number[]).includes(s.timeLimitMinutes) ||
      typeof s.startedAt !== "string" || Number.isNaN(Date.parse(s.startedAt)) ||
      !(s.finishedAt === null || typeof s.finishedAt === "string") ||
      !Number.isInteger(s.index) || s.index < 0 || s.index > 100 ||
      typeof s.answers !== "object" || !s.answers || Array.isArray(s.answers) ||
      typeof s.voiceRecorded !== "object" || !s.voiceRecorded || Array.isArray(s.voiceRecorded) ||
      !(s.elapsedHighWaterMs === undefined || (typeof s.elapsedHighWaterMs === "number" && Number.isFinite(s.elapsedHighWaterMs) && s.elapsedHighWaterMs >= 0)))
      throw new Error("Invalid state");
    const answers: Record<string, string> = {};
    for (const [id, answer] of Object.entries(s.answers)) if (TASK_ID.test(id) && typeof answer === "string") answers[id] = answer.slice(0, MAX_ANSWER_CHARS);
    const elapsedHighWaterMs = Math.min(s.elapsedHighWaterMs ?? 0, s.timeLimitMinutes * 60_000);
    const sessionId = sessionIdOf(s);
    const voiceReceipts: Record<string, SpeakingReceipt> = {};
    if (s.voiceReceipts && typeof s.voiceReceipts === "object" && !Array.isArray(s.voiceReceipts))
      for (const [id, r] of Object.entries(s.voiceReceipts))
        if (TASK_ID.test(id) && inspectSpeakingReceipt(r, { sessionId, taskId: id }).valid) voiceReceipts[id] = r as SpeakingReceipt;
    // Ephemeral (non-consented) recordings never survive a reload.
    const { profileId, profileHash, ...rest } = s;                       // a malformed profile pin is dropped, never trusted
    const pinned = typeof profileId === "string" && /^[a-z0-9-]{3,60}$/.test(profileId) && typeof profileHash === "string" && /^[0-9a-f]{8}$/.test(profileHash)
      ? { profileId, profileHash } : {};
    return { session: { ...rest, ...pinned, sessionId, answers, voiceRecorded: {}, voiceReceipts, voiceConsent: s.voiceConsent === true, elapsedHighWaterMs }, recovered: false };
  } catch {
    return { session: null, recovered: true };
  }
}

/** max(wall-clock elapsed, persisted high-watermark): a clock moved back cannot give time back (E04 R01). */
function elapsedMs(session: ExamSession, now: Date): number {
  const t = now instanceof Date ? now.getTime() : Number.NaN;
  if (!Number.isFinite(t)) throw new Error("Invalid now");
  return Math.max(0, t - Date.parse(session.startedAt), session.elapsedHighWaterMs ?? 0);
}
export function remainingSeconds(session: ExamSession | null, now: Date = new Date()): number | null {
  if (!session || !session.timeLimitMinutes) return null;
  const limit = session.timeLimitMinutes * 60_000;
  return Math.max(0, Math.ceil((limit - Math.min(limit, elapsedMs(session, now))) / 1000));
}
export function isPracticeExpired(session: ExamSession | null, now: Date = new Date()): boolean {
  return Boolean(session?.timeLimitMinutes) && !session!.finishedAt && elapsedMs(session!, now) >= session!.timeLimitMinutes * 60_000;
}
export function withElapsedHighWater(session: ExamSession, observedElapsedMs: number): ExamSession {
  if (!session.timeLimitMinutes || session.finishedAt) return session;
  if (typeof observedElapsedMs !== "number" || !Number.isFinite(observedElapsedMs) || observedElapsedMs < 0) throw new Error("Invalid elapsed time");
  const next = Math.min(session.timeLimitMinutes * 60_000, Math.max(session.elapsedHighWaterMs ?? 0, observedElapsedMs));
  return next === (session.elapsedHighWaterMs ?? 0) ? session : { ...session, elapsedHighWaterMs: next };
}
function assertBeforeDeadline(session: ExamSession, now: Date) { if (isPracticeExpired(session, now)) throw new DeadlineError(); }

export function writeAnswer(session: ExamSession, itemId: string, answer: string, now: Date = new Date()): ExamSession {
  if (session.finishedAt) throw new Error("Rehearsal finished");
  assertBeforeDeadline(session, now);
  if (!TASK_ID.test(itemId)) throw new Error("Invalid task ID");
  if (typeof answer !== "string") throw new Error("Invalid response");
  return { ...session, answers: { ...session.answers, [itemId]: answer.slice(0, MAX_ANSWER_CHARS) }, lastSavedAt: now.toISOString() };
}
export function goToIndex(session: ExamSession, index: number, itemCount: number, now: Date = new Date()): ExamSession {
  if (session.finishedAt) throw new Error("Finished");
  if (!Number.isInteger(index) || index < 0 || index >= itemCount) throw new Error("Invalid task index");
  assertBeforeDeadline(session, now);
  return { ...session, index };
}
export function recordVoiceEvidence(session: ExamSession, itemId: string, hasAudio: boolean, now: Date = new Date()): ExamSession {
  if (session.finishedAt) throw new Error("Finished");
  assertBeforeDeadline(session, now);
  return { ...session, voiceRecorded: { ...session.voiceRecorded, [itemId]: hasAudio === true } };
}
export function setVoiceConsent(session: ExamSession, consent: boolean): ExamSession {
  if (session.finishedAt) throw new Error("Finished");
  return { ...session, voiceConsent: consent === true };
}
export function attachVoiceReceipt(session: ExamSession, itemId: string, receipt: SpeakingReceipt, now: Date = new Date()): ExamSession {
  if (session.finishedAt) throw new Error("Finished");
  assertBeforeDeadline(session, now);
  if (session.voiceConsent !== true) throw new Error("Voice storage consent missing");
  const check = inspectSpeakingReceipt(receipt, { sessionId: sessionIdOf(session), taskId: itemId });
  if (!check.valid) throw new Error("Invalid voice receipt: " + check.errors.join(","));
  return { ...session, voiceReceipts: { ...(session.voiceReceipts || {}), [itemId]: receipt }, voiceRecorded: { ...session.voiceRecorded, [itemId]: true } };
}
export function removeVoiceReceipt(session: ExamSession, itemId: string): ExamSession {
  const voiceReceipts = { ...(session.voiceReceipts || {}) }; delete voiceReceipts[itemId];
  const voiceRecorded = { ...session.voiceRecorded }; delete voiceRecorded[itemId];
  return { ...session, voiceReceipts, voiceRecorded };
}
export function voiceEvidenceOf(session: ExamSession, itemId: string): "stored" | "ephemeral" | null {
  if (session.voiceReceipts?.[itemId]) return "stored";
  if (session.voiceRecorded?.[itemId] === true) return "ephemeral";
  return null;
}
export function finishSession(session: ExamSession, now: Date = new Date()): ExamSession {
  return { ...session, finishedAt: session.finishedAt || now.toISOString(), lastSavedAt: now.toISOString() };
}

type SkillCount = { correct: number; objective: number; ungraded: number; unanswered: number };
export type ExamDetail = { id: string; skill: ExamSkill; status: "unanswered" | "correct" | "incorrect" | "ungraded"; correct?: number | string | undefined; voice?: "stored" | "ephemeral" | null };
/** Only after finish. Objective keys only; open responses ungraded; never a YKI grade or pass prediction. */
export function scoreSession(items: ExamItem[], session: ExamSession) {
  if (!session.finishedAt) throw new Error("Cannot reveal assessment before finishing");
  const blank = (): SkillCount => ({ correct: 0, objective: 0, ungraded: 0, unanswered: 0 });
  const bySkill: Record<ExamSkill, SkillCount> = { reading: blank(), listening: blank(), writing: blank(), speaking: blank() };
  const details: ExamDetail[] = [];
  for (const t of items) {
    const answer = String(session.answers[t.id] ?? "").trim();
    const voice = voiceEvidenceOf(session, t.id);
    const hasAnswer = answer.length > 0 || voice !== null;
    if (!hasAnswer) { bySkill[t.skill].unanswered++; details.push({ id: t.id, skill: t.skill, status: "unanswered" }); continue; }
    if (t.kind === "choice" || t.kind === "boolean") {
      const correct = t.kind === "choice" ? answer === String(t.correct) : answer === t.correct;
      bySkill[t.skill].objective++;
      if (correct) bySkill[t.skill].correct++;
      details.push({ id: t.id, skill: t.skill, status: correct ? "correct" : "incorrect", correct: t.correct });
    } else {
      bySkill[t.skill].ungraded++;
      details.push({ id: t.id, skill: t.skill, status: "ungraded", ...(t.skill === "speaking" ? { voice } : {}) });
    }
  }
  return { bySkill, details, officialGrade: null, ykiPassPrediction: null,
    qualification: "Objective-key accuracy only; open responses not assessed; no YKI grade." };
}
