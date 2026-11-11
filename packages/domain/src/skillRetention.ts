/**
 * Delayed independent checks 7/14/30 for ALL FOUR skills (research #26 GL-03, method spaced-retrieval,
 * IV-REQ-03 / LE-10). The grammar-writing bank in retention.ts stays as it is; this module adds:
 *
 *   anchor     the learner's first LEARN evidence in that skill (a diagnostics entry, not a delayed check)
 *   due        on real elapsed day 7 / 14 / 30 one NEW item the learner has never seen; a missed window is
 *              reported as missed and never passed retroactively (same semantics as retention.ts)
 *   reading    a withheld text (never in a LEARN pool or EXAM), one question at a time, first answer frozen;
 *              keys + model answers only after the attempt is durably saved
 *   listening  a recorded lesson this learner has NOT met before (first exposure) and not used by EXAM;
 *              audio must be started first; text before answering is allowed for accessibility but then
 *              the attempt is saved as supported / ungraded
 *   writing,   a withheld prompt; own text; always ungraded — the task points are shown only as a
 *   speaking   self-check after saving, never as a grade
 *
 * Storage uses the existing V1 shapes only: one `retention` entry per check (taskId `skill-<skill>`),
 * plus `diagnostics` for each objective answer with taskId `d<day>-<questionId>`.
 */
import type { LearnerState, RetentionEntry, Skill } from "./learner.ts";
import { addDiagnostic } from "./learner.ts";
import { TRANSFER_DAYS, type TransferDay } from "./retention.ts";

export interface CheckQuestion {
  id: string; type: "single_choice" | "true_false" | "open"; prompt_fi: string;
  options_fi?: string[]; correct_index?: number; answer?: boolean; model_answer_fi?: string; why_uk?: string;
}
export interface ObjectiveCheckItem {
  id: string; title_fi: string; questions: CheckQuestion[];
  text_fi?: string;                                                  // reading
  audio?: { path: string; transcript_path?: string; subtitles_path?: string; credit?: string };   // listening
}
export interface ProductionCheckItem { id: string; prompt_fi: string; required_points_fi: string[] }
export interface SkillRetentionBank {
  version: string;
  reading: ObjectiveCheckItem[];       // index 0/1/2 = day 7/14/30 (withheld from LEARN and EXAM)
  writing: ProductionCheckItem[];      // index 0/1/2 = day 7/14/30
  speaking: ProductionCheckItem[];     // index 0/1/2 = day 7/14/30
  listening: ObjectiveCheckItem[];     // pool: the first lesson this learner has not met is used
}
export const RETENTION_SKILLS: Skill[] = ["reading", "listening", "writing", "speaking"];
export type SkillCheckItem = { kind: "objective"; item: ObjectiveCheckItem } | { kind: "production"; item: ProductionCheckItem };
export interface SkillRetentionStatus {
  skill: Skill; anchorDate: string | null; ageDays: number;
  due: { day: TransferDay; check: SkillCheckItem } | null;
  /** A window is open but no unseen item is left (listening): said honestly, never faked. */
  unavailable: TransferDay | null;
  completed: TransferDay[]; missed: TransferDay[]; nextDay: TransferDay | null;
}

const DELAYED = /^d(?:7|14|30)-/;
export const skillRetentionTaskId = (skill: Skill) => `skill-${skill}`;
const p2 = (v: number) => String(v).padStart(2, "0");
const localDay = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const ordinal = (v: string) => { const [y, m, d] = v.split("-").map(Number) as [number, number, number]; return Math.floor(Date.UTC(y, m - 1, d) / 86400000); };

export function validateSkillRetentionBank(b: SkillRetentionBank): boolean {
  const qOk = (q: CheckQuestion) => /^[a-z\d_-]{1,90}$/i.test(q.id) && typeof q.prompt_fi === "string" && q.prompt_fi.trim().length > 0 && (
    (q.type === "single_choice" && Array.isArray(q.options_fi) && q.options_fi.length >= 2 && Number.isInteger(q.correct_index) && q.correct_index! >= 0 && q.correct_index! < q.options_fi.length) ||
    (q.type === "true_false" && typeof q.answer === "boolean") || (q.type === "open" && typeof q.model_answer_fi === "string"));
  const obj = (i: ObjectiveCheckItem) => /^[a-z\d_-]{1,90}$/i.test(i.id) && i.questions.length > 0 && i.questions.every(qOk);
  const prod = (i: ProductionCheckItem) => /^[a-z\d_-]{1,90}$/i.test(i.id) && i.prompt_fi.trim().length > 0 && i.required_points_fi.length > 0;
  const ids = [...b.reading, ...b.listening, ...b.writing, ...b.speaking].map(i => i.id);
  return typeof b.version === "string" && b.version.length > 0 && new Set(ids).size === ids.length &&
    b.reading.length >= 3 && b.reading.every(i => obj(i) && typeof i.text_fi === "string") &&
    b.listening.every(i => obj(i) && !!i.audio && i.questions.every(q => q.type !== "open")) &&
    b.writing.length >= 3 && b.writing.every(prod) && b.speaking.length >= 3 && b.speaking.every(prod);
}

/** Has this learner already met the lesson (any diagnostic on one of its questions, or an earlier delayed check)? */
function met(state: Pick<LearnerState, "diagnostics" | "retention">, item: ObjectiveCheckItem): boolean {
  const qs = new Set(item.questions.map(q => q.id));
  return (state.diagnostics || []).some(d => qs.has(d.taskId.replace(DELAYED, ""))) ||
    (state.retention || []).some(r => r.response.startsWith(`[${item.id}]`));
}

export function skillRetentionQueue(state: Pick<LearnerState, "diagnostics" | "retention">, bank: SkillRetentionBank, now: Date = new Date()): SkillRetentionStatus[] {
  const today = ordinal(localDay(now));
  return RETENTION_SKILLS.map(skill => {
    const dates = (state.diagnostics || []).filter(d => d.skill === skill && !DELAYED.test(d.taskId) && typeof d.completedAt === "string")
      .map(d => new Date(d.completedAt)).filter(d => !Number.isNaN(d.getTime())).map(localDay).sort();
    const anchorDate = dates[0] ?? null;
    const empty = { skill, anchorDate, ageDays: 0, due: null, unavailable: null, completed: [], missed: [], nextDay: null };
    if (!anchorDate || today < ordinal(anchorDate)) return empty;
    const age = today - ordinal(anchorDate);
    const records = (state.retention || []).filter(r => r.taskId === skillRetentionTaskId(skill) && r.independent === true);
    const completed = TRANSFER_DAYS.filter(d => records.some(r => r.day === d));
    const last = [...TRANSFER_DAYS].reverse().find(d => d <= age);
    const open = last && !completed.includes(last) && !completed.some(d => d > last) ? last : null;
    let check: SkillCheckItem | null = null;
    if (open) {
      const idx = TRANSFER_DAYS.indexOf(open);
      if (skill === "reading") check = { kind: "objective", item: bank.reading[idx]! };
      else if (skill === "writing") check = { kind: "production", item: bank.writing[idx]! };
      else if (skill === "speaking") check = { kind: "production", item: bank.speaking[idx]! };
      else { const fresh = bank.listening.find(l => !met(state, l)); check = fresh ? { kind: "objective", item: fresh } : null; }
    }
    return {
      skill, anchorDate, ageDays: age,
      due: open && check ? { day: open, check } : null,
      unavailable: open && !check ? open : null,
      completed,
      missed: TRANSFER_DAYS.filter(d => d <= (last ?? 0) && d !== last && !completed.includes(d)),
      nextDay: TRANSFER_DAYS.find(d => d > age) ?? null,
    };
  });
}

/* ---------- one check session: first answer per question frozen, nothing revealed before saving ---------- */

export interface SkillCheckSession {
  skill: Skill; day: TransferDay; itemId: string; audioStarts: number; supported: boolean;
  index: number; answers: Record<string, string>; text: string; phase: "answer" | "ready";
}
export type SkillCheckEvent =
  | { type: "AUDIO_STARTED" } | { type: "SHOW_TEXT" }
  | { type: "ANSWER"; questionId: string; value: string } | { type: "SUBMIT_TEXT"; text: string };
export class SkillCheckError extends Error {
  constructor(public readonly code: "NOT_ALLOWED" | "EMPTY" | "INVALID" | "AUDIO_NOT_STARTED", m: string) { super(m); this.name = "SkillCheckError"; }
}
export const SKILL_CHECK_MAX_CHARS = 1400;

export function startSkillCheck(skill: Skill, day: TransferDay, check: SkillCheckItem): SkillCheckSession {
  return { skill, day, itemId: check.item.id, audioStarts: 0, supported: false, index: 0, answers: {}, text: "", phase: "answer" };
}

export function skillCheckReducer(s: SkillCheckSession, check: SkillCheckItem, e: SkillCheckEvent): SkillCheckSession {
  if (check.item.id !== s.itemId) throw new TypeError("Item mismatch");
  const no = (): never => { throw new SkillCheckError("NOT_ALLOWED", `${e.type} not allowed`); };
  if (s.phase !== "answer") return no();
  switch (e.type) {
    case "AUDIO_STARTED":
      return s.skill === "listening" ? { ...s, audioStarts: s.audioStarts + 1 } : no();
    case "SHOW_TEXT":                                                   // accessibility support → attempt becomes ungraded
      return s.skill === "listening" ? { ...s, supported: true } : no();
    case "ANSWER": {
      if (check.kind !== "objective") return no();
      if (s.skill === "listening" && s.audioStarts === 0 && !s.supported) throw new SkillCheckError("AUDIO_NOT_STARTED", "Start the audio first");
      const q = check.item.questions[s.index];
      if (!q || q.id !== e.questionId) return no();
      const v = String(e.value ?? "").trim();
      if (!v) throw new SkillCheckError("EMPTY", "Answer first");
      if (q.type === "single_choice" && !(Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) < q.options_fi!.length)) throw new SkillCheckError("INVALID", "Choose an option");
      if (q.type === "true_false" && v !== "true" && v !== "false") throw new SkillCheckError("INVALID", "Choose true or false");
      const index = s.index + 1;
      return { ...s, answers: { ...s.answers, [q.id]: v.slice(0, 600) }, index, phase: index >= check.item.questions.length ? "ready" : "answer" };
    }
    case "SUBMIT_TEXT": {
      if (check.kind !== "production") return no();
      const t = String(e.text ?? "").trim();
      if (!t) throw new SkillCheckError("EMPTY", "Write something first");
      return { ...s, text: t.slice(0, SKILL_CHECK_MAX_CHARS), phase: "ready" };
    }
  }
}

/** What the learner may see while answering: never keys, model answers, transcript (unless supported) or task self-check. */
export function skillCheckView(s: SkillCheckSession, check: SkillCheckItem) {
  const q = check.kind === "objective" && s.phase === "answer" ? check.item.questions[s.index] : undefined;
  return {
    question: q ? { id: q.id, type: q.type, n: s.index + 1, of: (check.item as ObjectiveCheckItem).questions.length, prompt_fi: q.prompt_fi,
      options_fi: q.type === "single_choice" ? q.options_fi! : q.type === "true_false" ? ["Oikein", "Väärin"] : null } : null,
    canAnswer: s.skill !== "listening" || s.audioStarts > 0 || s.supported,
    showReadingText: s.skill === "reading" && s.phase === "answer",
    showTranscript: s.skill === "listening" && s.supported,
    ready: s.phase === "ready",
  };
}

const isCorrect = (q: CheckQuestion, v: string | undefined) =>
  q.type === "single_choice" ? v === String(q.correct_index) : q.type === "true_false" ? v === String(q.answer) : null;

/** Persistable result. Throws unless this exact check is due now (no early, duplicate or wrong-item submissions). */
export function recordSkillCheck(state: LearnerState, bank: SkillRetentionBank, s: SkillCheckSession, now: Date = new Date()): LearnerState {
  if (s.phase !== "ready") throw new SkillCheckError("NOT_ALLOWED", "Not finished");
  const status = skillRetentionQueue(state, bank, now).find(x => x.skill === s.skill);
  if (!status?.due || status.due.day !== s.day || status.due.check.item.id !== s.itemId) throw new Error("Check not due or already submitted");
  const check = status.due.check;
  let next = state;
  let summary: string;
  if (check.kind === "objective") {
    const qs = check.item.questions;
    for (const q of qs) {
      const v = s.answers[q.id] ?? "";
      const graded = q.type !== "open" && !s.supported;
      next = addDiagnostic(next, graded
        ? { skill: s.skill, taskId: `d${s.day}-${q.id}`, status: "scored", correct: isCorrect(q, v) === true, response: v }
        : { skill: s.skill, taskId: `d${s.day}-${q.id}`, status: "ungraded", response: `${s.supported ? "[supported: text shown] " : ""}${v}` }, now);
    }
    const scored = qs.filter(q => q.type !== "open" && !s.supported);
    summary = `[${check.item.id}] ${s.supported ? "supported, ungraded" : `${scored.filter(q => isCorrect(q, s.answers[q.id])).length}/${scored.length} first answers correct`}`;
  } else summary = `[${check.item.id}] ${s.text}`;
  const age = status.ageDays;
  const entry: RetentionEntry = { taskId: skillRetentionTaskId(s.skill), day: s.day, status: "ungraded", independent: true,
    actualAgeDays: age, lateByDays: age - s.day, promptVersion: bank.version, response: summary.slice(0, 1600), submittedAt: now.toISOString() };
  return { ...next, retention: [...next.retention, entry].slice(-120) };
}

/** After a durable save: keys, model answers and explanations (objective), or the task points as a self-check (production). */
export function skillCheckReveal(s: SkillCheckSession, check: SkillCheckItem) {
  if (check.kind === "production") return { kind: "production" as const, text: s.text, points_fi: check.item.required_points_fi };
  return { kind: "objective" as const, supported: s.supported, results: check.item.questions.map((q, i) => ({
    n: i + 1, prompt_fi: q.prompt_fi, answer: q.type === "single_choice" ? q.options_fi![Number(s.answers[q.id])] ?? "" : q.type === "true_false" ? (s.answers[q.id] === "true" ? "Oikein" : "Väärin") : s.answers[q.id] ?? "",
    correct: s.supported ? null : isCorrect(q, s.answers[q.id]),
    key_fi: q.type === "single_choice" ? q.options_fi![q.correct_index!]! : q.type === "true_false" ? (q.answer ? "Oikein" : "Väärin") : q.model_answer_fi!,
    why_uk: q.why_uk ?? null })) };
}

/* ---------- bank builder from the existing single physical owners ---------- */

interface InferenceText { id: string; title_fi: string; text_fi: string; questions: Array<CheckQuestion & { statement_fi?: string; explanation_uk?: string }> }
interface ThemeTask { id: string; prompt_fi: string; required_points_fi: string[] }
interface ListeningLike { id: string; title_fi: string; path: string; transcript_path?: string; subtitles_path?: string;
  questions: Array<{ id: string; prompt_fi: string; options_fi: string[]; correct_index: number; why_uk?: string }>; credit?: { credit: string } }

/** Picks: reading = first three withheld inference texts; writing/speaking = the theme task ids given (withheld:
 * the 9 theme files are not loaded by any LEARN screen); listening = every lesson not used by an EXAM blueprint. */
export function buildSkillRetentionBank(input: {
  version: string; inference: InferenceText[]; themeTasks: ThemeTask[]; writingIds: string[]; speakingIds: string[];
  listening: ListeningLike[]; examItemIds: string[];
}): SkillRetentionBank {
  const pick = (ids: string[]) => ids.map(id => {
    const t = input.themeTasks.find(x => x.id === id);
    if (!t) throw new Error(`theme task ${id} missing`);
    return { id: t.id, prompt_fi: t.prompt_fi, required_points_fi: t.required_points_fi };
  });
  const exam = new Set(input.examItemIds);
  // JSON round-trip drops undefined optional fields (exactOptionalPropertyTypes) and detaches from source objects.
  return JSON.parse(JSON.stringify({
    version: input.version,
    reading: input.inference.filter(i => !exam.has(i.id)).slice(0, 3).map(i => ({ id: i.id, title_fi: i.title_fi, text_fi: i.text_fi,
      questions: i.questions.map(q => ({ id: q.id, type: q.type, prompt_fi: q.prompt_fi ?? q.statement_fi ?? "", options_fi: q.options_fi,
        correct_index: q.correct_index, answer: q.answer, model_answer_fi: q.model_answer_fi, why_uk: q.explanation_uk })) })),
    writing: pick(input.writingIds),
    speaking: pick(input.speakingIds),
    listening: input.listening.filter(l => !exam.has(l.id)).map(l => ({ id: l.id, title_fi: l.title_fi,
      audio: { path: l.path, transcript_path: l.transcript_path, subtitles_path: l.subtitles_path, credit: l.credit?.credit },
      questions: l.questions.map(q => ({ id: q.id, type: "single_choice" as const, prompt_fi: q.prompt_fi, options_fi: q.options_fi, correct_index: q.correct_index, why_uk: q.why_uk })) })),
  })) as SkillRetentionBank;
}
