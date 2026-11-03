/**
 * LEARN starting diagnostic: one short probe per productive/receptive skill (UX-01, UIO-03, R04, A10).
 *
 *   reading (objective, first answer frozen; keys only after all answers)
 *   → writing (own text first, then learner self-check of the task points — self-report, NOT a grade)
 *   → speaking (voice with explicit consent OR text plan; never scored, audio never persisted)
 *   → summary (counts and next steps — no %, no CEFR/YKI level)
 *
 * Listening is not probed here: the baseline listening item is script-only (no recording), so it is
 * NOT valid for diagnosis; the learner is pointed to the recorded listening missions instead.
 */
import type { Skill } from "./learner.ts";

export interface DiagnosticReadingQuestion { id: string; prompt_fi: string; options: string[]; correct_index: number; explanation_uk?: string }
export interface DiagnosticProductionTask { id: string; kind: string; prompt_fi: string; required_points_fi: string[] }
export interface DiagnosticBaseline {
  id: string; is_official_exam_content: boolean;
  reading: { title_fi: string; text_fi: string; questions: DiagnosticReadingQuestion[] };
  writing: DiagnosticProductionTask[]; speaking: DiagnosticProductionTask[];
}
export type DiagnosticStep = "reading" | "reading_feedback" | "writing" | "writing_check" | "speaking" | "speaking_check" | "summary";
export interface DiagnosticSession {
  baselineId: string; step: DiagnosticStep; readingIndex: number; readingAnswers: Record<string, number>;
  writing: string; writingChecked: number[]; speaking: { text: string; voiceRecorded: boolean }; speakingChecked: number[];
  saved: Skill[];
}
export type DiagnosticEvent =
  | { type: "ANSWER_READING"; questionId: string; optionIndex: number } | { type: "CONTINUE" }
  | { type: "SUBMIT_WRITING"; text: string } | { type: "SUBMIT_SPEAKING"; text: string; voiceRecorded: boolean }
  | { type: "SELF_CHECK"; points: number[] } | { type: "MARK_SAVED"; skill: Skill };

export const WRITING_MIN_CHARS = 20;
export const PRODUCTION_MAX_CHARS = 1600;

export class DiagnosticError extends Error {
  constructor(public readonly code: "NOT_ALLOWED" | "INVALID_ANSWER" | "TOO_SHORT" | "EMPTY_RESPONSE" | "NOT_SAVED", m: string) {
    super(m); this.name = "DiagnosticError";
  }
}

export function validateBaseline(b: unknown): b is DiagnosticBaseline {
  const x = b as DiagnosticBaseline;
  const task = (t: DiagnosticProductionTask) => t && typeof t.id === "string" && typeof t.prompt_fi === "string" &&
    Array.isArray(t.required_points_fi) && t.required_points_fi.length >= 1;
  return Boolean(x && typeof x.id === "string" && x.is_official_exam_content === false && x.reading &&
    Array.isArray(x.reading.questions) && x.reading.questions.length >= 1 &&
    x.reading.questions.every(q => q && typeof q.id === "string" && Array.isArray(q.options) && q.options.length >= 2 &&
      Number.isInteger(q.correct_index) && q.correct_index >= 0 && q.correct_index < q.options.length) &&
    Array.isArray(x.writing) && x.writing.length >= 1 && x.writing.every(task) &&
    Array.isArray(x.speaking) && x.speaking.length >= 1 && x.speaking.every(task));
}

export function startDiagnostic(b: DiagnosticBaseline): DiagnosticSession {
  if (!validateBaseline(b)) throw new TypeError("Invalid diagnostic baseline");
  return { baselineId: b.id, step: "reading", readingIndex: 0, readingAnswers: {}, writing: "", writingChecked: [],
    speaking: { text: "", voiceRecorded: false }, speakingChecked: [], saved: [] };
}

const SAVE_BEFORE: Partial<Record<DiagnosticStep, Skill>> = { reading_feedback: "reading", writing_check: "writing", speaking_check: "speaking" };

export function diagnosticReducer(s: DiagnosticSession, b: DiagnosticBaseline, e: DiagnosticEvent): DiagnosticSession {
  if (b.id !== s.baselineId) throw new TypeError("Baseline mismatch");
  const no = (): never => { throw new DiagnosticError("NOT_ALLOWED", `${e.type} not allowed in ${s.step}`); };
  switch (e.type) {
    case "ANSWER_READING": {
      if (s.step !== "reading") return no();
      const q = b.reading.questions[s.readingIndex];
      if (!q || q.id !== e.questionId) return no();
      if (!Number.isInteger(e.optionIndex) || e.optionIndex < 0 || e.optionIndex >= q.options.length)
        throw new DiagnosticError("INVALID_ANSWER", "Choose an option");
      const readingIndex = s.readingIndex + 1;                      // first answer frozen
      return { ...s, readingAnswers: { ...s.readingAnswers, [q.id]: e.optionIndex }, readingIndex,
        step: readingIndex >= b.reading.questions.length ? "reading_feedback" : "reading" };
    }
    case "SUBMIT_WRITING": {
      if (s.step !== "writing") return no();
      const text = e.text.trim();
      if (text.length < WRITING_MIN_CHARS) throw new DiagnosticError("TOO_SHORT", "Write at least 20 characters");
      return { ...s, writing: text.slice(0, PRODUCTION_MAX_CHARS), step: "writing_check" };
    }
    case "SUBMIT_SPEAKING": {
      if (s.step !== "speaking") return no();
      const text = e.text.trim();
      if (!text && !e.voiceRecorded) throw new DiagnosticError("EMPTY_RESPONSE", "Record or type your answer");
      return { ...s, speaking: { text: text.slice(0, PRODUCTION_MAX_CHARS), voiceRecorded: e.voiceRecorded }, step: "speaking_check" };
    }
    case "SELF_CHECK": {
      const n = s.step === "writing_check" ? b.writing[0]!.required_points_fi.length
        : s.step === "speaking_check" ? b.speaking[0]!.required_points_fi.length : no();
      const points = [...new Set(e.points)].filter(i => Number.isInteger(i) && i >= 0 && i < n).sort((x, y) => x - y);
      return s.step === "writing_check" ? { ...s, writingChecked: points } : { ...s, speakingChecked: points };
    }
    case "MARK_SAVED": return s.saved.includes(e.skill) ? s : { ...s, saved: [...s.saved, e.skill] };
    case "CONTINUE": {
      const need = SAVE_BEFORE[s.step];
      if (need && !s.saved.includes(need)) throw new DiagnosticError("NOT_SAVED", "Persist evidence before moving on");
      const next: Partial<Record<DiagnosticStep, DiagnosticStep>> = { reading_feedback: "writing", writing_check: "speaking", speaking_check: "summary" };
      return next[s.step] ? { ...s, step: next[s.step]! } : no();
    }
  }
}

/** What the screen may show. Keys/explanations only after every reading answer is frozen. */
export function diagnosticView(s: DiagnosticSession, b: DiagnosticBaseline) {
  const q = s.step === "reading" ? b.reading.questions[s.readingIndex] : undefined;
  const readingDone = s.step !== "reading";
  const reading = readingDone ? b.reading.questions.map(x => ({ id: x.id, prompt_fi: x.prompt_fi, key_fi: x.options[x.correct_index]!,
    chosen_fi: x.id in s.readingAnswers ? x.options[s.readingAnswers[x.id]!]! : null, isCorrect: s.readingAnswers[x.id] === x.correct_index,
    explanation_uk: x.explanation_uk ?? null })) : null;
  const w = b.writing[0]!, sp = b.speaking[0]!;
  return {
    step: s.step,
    stepNumber: ({ reading: 1, reading_feedback: 1, writing: 2, writing_check: 2, speaking: 3, speaking_check: 3, summary: 4 } as const)[s.step],
    text: { title_fi: b.reading.title_fi, text_fi: b.reading.text_fi },
    question: q ? { id: q.id, prompt_fi: q.prompt_fi, options: q.options, n: s.readingIndex + 1, of: b.reading.questions.length } : null,
    reading,
    writingTask: { id: w.id, prompt_fi: w.prompt_fi, points_fi: w.required_points_fi },
    // Points are shown with the task (what to cover) — that is the task, not an answer key.
    speakingTask: { id: sp.id, prompt_fi: sp.prompt_fi, points_fi: sp.required_points_fi },
    writing: s.writing, writingChecked: s.writingChecked, speaking: s.speaking, speakingChecked: s.speakingChecked,
    mustSave: SAVE_BEFORE[s.step] && !s.saved.includes(SAVE_BEFORE[s.step]!) ? SAVE_BEFORE[s.step]! : null,
  };
}

/** Evidence for one skill — writing/speaking are ALWAYS ungraded; self-check is self-report, kept beside the text. */
export function diagnosticEvidence(s: DiagnosticSession, b: DiagnosticBaseline, skill: "reading" | "writing" | "speaking") {
  if (skill === "reading") {
    if (s.step === "reading") throw new DiagnosticError("NOT_ALLOWED", "Reading not finished");
    return b.reading.questions.filter(q => q.id in s.readingAnswers).map(q => ({ skill: "reading" as const, taskId: q.id,
      status: "scored" as const, correct: s.readingAnswers[q.id] === q.correct_index, response: String(s.readingAnswers[q.id]) }));
  }
  if (skill === "writing") {
    if (!s.writing) throw new DiagnosticError("NOT_ALLOWED", "Writing not submitted");
    const t = b.writing[0]!;
    return [{ skill: "writing" as const, taskId: t.id, status: "ungraded" as const,
      response: `[self-check ${s.writingChecked.length}/${t.required_points_fi.length}] ${s.writing}` }];
  }
  if (!s.speaking.text && !s.speaking.voiceRecorded) throw new DiagnosticError("NOT_ALLOWED", "Speaking not submitted");
  const t = b.speaking[0]!;
  const voice = s.speaking.voiceRecorded ? "Voice recorded this session (not retained). " : "";
  return [{ skill: "speaking" as const, taskId: t.id, status: "ungraded" as const,
    response: `[self-check ${s.speakingChecked.length}/${t.required_points_fi.length}] ${voice}${s.speaking.text}`.trim() }];
}

/** Next steps from what was actually observed — never a level or percentage. */
export function diagnosticSummary(s: DiagnosticSession, b: DiagnosticBaseline) {
  if (s.step !== "summary") throw new DiagnosticError("NOT_ALLOWED", "Diagnostic not finished");
  const total = b.reading.questions.length;
  const correct = b.reading.questions.filter(q => s.readingAnswers[q.id] === q.correct_index).length;
  const wMissing = b.writing[0]!.required_points_fi.filter((_, i) => !s.writingChecked.includes(i));
  const sMissing = b.speaking[0]!.required_points_fi.filter((_, i) => !s.speakingChecked.includes(i));
  const next: Array<"grammar_in_context" | "listening_missions" | "writing_points" | "speaking_points" | "reading_detail"> = [];
  if (correct < total) next.push("reading_detail");
  if (wMissing.length) next.push("writing_points");
  if (sMissing.length) next.push("speaking_points");
  next.push("listening_missions", "grammar_in_context");
  return { reading: { correct, total, tooFewForConclusion: total < 5 }, writingMissing_fi: wMissing, speakingMissing_fi: sMissing,
    speakingMode: s.speaking.voiceRecorded ? "voice" as const : "text" as const, next };
}
