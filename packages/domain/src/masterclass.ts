/**
 * LEARN masterclass (learning/exercises/b1/masterclasses/lessons.json; CURATED-09, IV-REQ-07, UIO-03).
 * One short original lesson per skill, in the order the file's own notes demand («зразок і ключі приховувати до
 * самостійної спроби»; «оцінювати незалежний перенос на нову ситуацію»):
 *
 *   check     a Finnish text and two questions, answered alone, one at a time; each answer is frozen
 *   checked   ONLY NOW: the key and the words in the text that show it
 *   repair    a weak answer: the learner writes it better themselves                       → ungraded
 *   repaired  ONLY NOW: a better version and why
 *   respond   own answer to the lesson's task (written, or said aloud and noted)           → ungraded
 *   model     ONLY NOW: the model, plus what to compare (labels, not a score); learner compares (self-report)
 *   transfer  a new situation: no text, no model                                          → ungraded
 *   done
 *
 * Only the two keyed questions are scored, as reading: the learner reads the text even in the listening lessons, where
 * the text is a teaching text, not a transcript of the recording (the file says so), so it is never listening evidence.
 * Nothing is a YKI grade; every lesson is a draft pending S2 review.
 */
import type { Skill } from "./learner.ts";

export interface MasterclassChoice { id: string; kind: "multiple_choice"; question_fi: string; options_fi: string[]; correct_index: number; evidence_fi: string }
export interface MasterclassRepair { id: string; kind: "self_correction"; bad_example_fi: string; corrected_fi: string; explanation_uk: string }
export interface MasterclassResponse { id: string; kind: "productive"; prompt_fi: string; model_fi: string; feedback_dimensions: string[] }
export interface MasterclassTransfer { id: string; kind: "new_unseen_task"; prompt_fi: string }
export interface MasterclassLesson {
  id: string; skill: "reading" | "listening" | "speaking" | "writing" | "integrated"; title_fi: string; level_target: string;
  duration_min: number; goal_uk: string; teaching_input_fi: string; audio_lesson_id: string | null; teacher_review: string;
  activities: (MasterclassChoice | MasterclassRepair | MasterclassResponse | MasterclassTransfer)[];
}
/** The lesson as the screen uses it: exactly two questions, one repair, one response, one transfer. */
export interface Masterclass {
  id: string; skill: MasterclassLesson["skill"]; title_fi: string; level: string; minutes: number; goal_uk: string; input_fi: string;
  audioLessonId: string | null; questions: MasterclassChoice[]; repair: MasterclassRepair; response: MasterclassResponse; transfer: MasterclassTransfer;
  /** Skill of the own response and of the transfer. */
  produceSkill: Extract<Skill, "speaking" | "writing">;
}

/** What to compare with the model — the file's feedback dimensions as plain Ukrainian labels (never weights or a score). */
export const MASTERCLASS_DIMENSIONS_UK: Readonly<Record<string, string>> = Object.freeze({
  task_goal: "Чи зроблено те, що просить завдання",
  meaning_clarity: "Чи зрозуміло, що ти маєш на увазі",
  politeness_register: "Чи пасує тон до ситуації й людини",
  grammar_and_vocabulary: "Слова й форми: що можна сказати точніше",
});

const norm = (t: string) => t.normalize("NFC").toLocaleLowerCase("fi-FI").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const str = (x: unknown) => typeof x === "string" && x.trim().length > 0;

/** null when the lesson does not have the expected shape, or when the text already prints a hidden answer. */
export function toMasterclass(l: MasterclassLesson): Masterclass | null {
  if (!l || !/^[a-z\d_-]{1,70}$/i.test(String(l.id)) || !str(l.teaching_input_fi) || !str(l.title_fi) || l.teacher_review === "published") return null;
  const acts = Array.isArray(l.activities) ? l.activities : [];
  const questions = acts.filter((a): a is MasterclassChoice => a.kind === "multiple_choice");
  const repair = acts.find((a): a is MasterclassRepair => a.kind === "self_correction");
  const response = acts.find((a): a is MasterclassResponse => a.kind === "productive");
  const transfer = acts.find((a): a is MasterclassTransfer => a.kind === "new_unseen_task");
  if (questions.length !== 2 || !repair || !response || !transfer) return null;
  if (!questions.every(q => str(q.question_fi) && Array.isArray(q.options_fi) && q.options_fi.length >= 2 && q.options_fi.every(str) &&
      Number.isInteger(q.correct_index) && q.correct_index >= 0 && q.correct_index < q.options_fi.length && str(q.evidence_fi))) return null;
  if (![repair.bad_example_fi, repair.corrected_fi, repair.explanation_uk, response.prompt_fi, response.model_fi, transfer.prompt_fi].every(str)) return null;
  const input = norm(l.teaching_input_fi);
  if ([repair.corrected_fi, response.model_fi].some(t => input.includes(norm(t)))) return null;   // leak guard
  return {
    id: l.id, skill: l.skill, title_fi: l.title_fi, level: l.level_target, minutes: l.duration_min, goal_uk: l.goal_uk, input_fi: l.teaching_input_fi,
    audioLessonId: l.audio_lesson_id ?? null, questions, repair, response, transfer, produceSkill: l.skill === "speaking" ? "speaking" : "writing",
  };
}

export type MasterclassPhase = "check" | "checked" | "repair" | "repaired" | "respond" | "model" | "transfer" | "done";
export type MasterclassJudgement = "same" | "partly" | "different";
export interface MasterclassSession {
  lessonId: string; phase: MasterclassPhase; answers: number[]; repair: string; response: string; judged: MasterclassJudgement | null; transfer: string;
}
export type MasterclassEvent =
  | { type: "ANSWER"; index: number } | { type: "CONTINUE" } | { type: "SUBMIT_REPAIR"; text: string }
  | { type: "SUBMIT_RESPONSE"; text: string } | { type: "JUDGE"; judgement: MasterclassJudgement } | { type: "SUBMIT_TRANSFER"; text: string };

export const MASTERCLASS_MAX_CHARS = 1200;
export class MasterclassError extends Error {
  constructor(public readonly code: "NOT_ALLOWED" | "EMPTY" | "INVALID" | "NOT_JUDGED", m: string) { super(m); this.name = "MasterclassError"; }
}

export function startMasterclass(m: Masterclass): MasterclassSession {
  return { lessonId: m.id, phase: "check", answers: [], repair: "", response: "", judged: null, transfer: "" };
}

const text = (t: string) => {
  const v = String(t ?? "").trim();
  if (!v) throw new MasterclassError("EMPTY", "Write something first");
  return v.slice(0, MASTERCLASS_MAX_CHARS);
};

export function masterclassReducer(s: MasterclassSession, m: Masterclass, e: MasterclassEvent): MasterclassSession {
  if (m.id !== s.lessonId) throw new TypeError("Lesson mismatch");
  const no = (): never => { throw new MasterclassError("NOT_ALLOWED", `${e.type} not allowed in ${s.phase}`); };
  switch (e.type) {
    case "ANSWER": {
      if (s.phase !== "check") return no();                               // each answer is frozen once given
      const q = m.questions[s.answers.length]!;
      if (!Number.isInteger(e.index) || e.index < 0 || e.index >= q.options_fi.length) throw new MasterclassError("INVALID", "Choose an option");
      const answers = [...s.answers, e.index];
      return { ...s, answers, phase: answers.length === m.questions.length ? "checked" : "check" };
    }
    case "CONTINUE": {
      if (s.phase === "checked") return { ...s, phase: "repair" };
      if (s.phase === "repaired") return { ...s, phase: "respond" };
      if (s.phase === "model") {
        if (!s.judged) throw new MasterclassError("NOT_JUDGED", "Compare your answer first");
        return { ...s, phase: "transfer" };
      }
      return no();
    }
    case "SUBMIT_REPAIR": return s.phase === "repair" ? { ...s, repair: text(e.text), phase: "repaired" } : no();
    case "SUBMIT_RESPONSE": return s.phase === "respond" ? { ...s, response: text(e.text), phase: "model" } : no();
    case "JUDGE": {
      if (s.phase !== "model" || !["same", "partly", "different"].includes(e.judgement)) return no();
      return { ...s, judged: e.judgement };
    }
    case "SUBMIT_TRANSFER": return s.phase === "transfer" ? { ...s, transfer: text(e.text), phase: "done" } : no();
  }
}

/** Visibility: keys only after both answers; better version only after the own repair; model only after the own answer;
 *  the transfer shows neither the text nor the model. */
export function masterclassView(s: MasterclassSession, m: Masterclass) {
  const after = (p: MasterclassPhase[]) => p.includes(s.phase);
  return {
    phase: s.phase,
    input_fi: after(["check", "checked", "repair", "repaired", "respond", "model"]) ? m.input_fi : null,
    question: s.phase === "check" ? { n: s.answers.length + 1, of: m.questions.length, question_fi: m.questions[s.answers.length]!.question_fi, options_fi: m.questions[s.answers.length]!.options_fi } : null,
    results: s.phase === "checked" ? m.questions.map((q, i) => ({
      question_fi: q.question_fi, chosen_fi: q.options_fi[s.answers[i]!]!, correct: s.answers[i] === q.correct_index,
      key_fi: q.options_fi[q.correct_index]!, evidence_fi: q.evidence_fi,
    })) : null,
    bad_fi: after(["repair", "repaired"]) ? m.repair.bad_example_fi : null,
    ownRepair: s.phase === "repaired" ? s.repair : null,
    corrected_fi: s.phase === "repaired" ? m.repair.corrected_fi : null,
    why_uk: s.phase === "repaired" ? m.repair.explanation_uk : null,
    prompt_fi: after(["respond", "model"]) ? m.response.prompt_fi : null,
    ownResponse: s.phase === "model" ? s.response : null,
    model_fi: s.phase === "model" ? m.response.model_fi : null,
    compare_uk: s.phase === "model" ? m.response.feedback_dimensions.map(d => MASTERCLASS_DIMENSIONS_UK[d]).filter((x): x is string => !!x) : null,
    judged: s.judged,
    transfer_fi: s.phase === "transfer" ? m.transfer.prompt_fi : null,
  };
}

/** Evidence for addDiagnostic: the two keyed questions are reading; every Finnish text is ungraded. */
export function masterclassEvidence(s: MasterclassSession, m: Masterclass) {
  if (s.phase !== "done") throw new MasterclassError("NOT_ALLOWED", "Not finished");
  return [
    ...m.questions.map((q, i) => ({ skill: "reading" as const, taskId: `${m.id}-${q.id}`, status: "scored" as const,
      correct: s.answers[i] === q.correct_index, response: q.options_fi[s.answers[i]!] ?? "" })),
    { skill: "writing" as const, taskId: `${m.id}-repair`, status: "ungraded" as const, response: `[own repair of a weak answer, before the better version] ${s.repair}` },
    { skill: m.produceSkill, taskId: `${m.id}-response`, status: "ungraded" as const, response: `[own answer before the model; self-compared ${s.judged ?? "none"}] ${s.response}` },
    { skill: m.produceSkill, taskId: `${m.id}-transfer`, status: "ungraded" as const, response: `[new situation, no text or model shown] ${s.transfer}` },
  ];
}
