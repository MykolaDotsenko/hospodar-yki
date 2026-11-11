/**
 * LEARN "practice without a hint" (research #26 GL-02, registry methods productive-paraphrasing,
 * pragmatic/negotiation reactions, pre-task opinion, chunk-learning, R03 rektio chunks).
 * One pure phase machine for already existing project content that the apps did not use yet:
 *
 *   attempt   own answer first — a choice (paraphrase) or Finnish text (all other kinds);
 *             no key, no model, no scaffold, no Ukrainian gloss of the expected answer is visible
 *   reveal    ONLY NOW: key / model / scaffold / example. Free text is compared by the learner
 *             (same / partly / different) — a self-report, never `correct`
 *   recall    (paraphrase only) retell the source in own words without the choices → ungraded, guided
 *   transfer  a new situation without the model → ungraded
 *   done
 *
 * Nothing here is a grade: only the paraphrase choice (single key, editor-authored) is scored; free
 * Finnish answers are never string-matched because valid variants exist (R03: never punish valid forms).
 * Every card is an editorial draft pending S2 review and must be shown as such.
 */
import type { Skill } from "./learner.ts";

export type PracticeKind = "paraphrase" | "reaction" | "opinion" | "chunk" | "rektio";
export type PracticeJudgement = "same" | "partly" | "different";
export interface PracticeLine { label_uk: string; text: string; lang: "fi" | "uk" }
export interface PracticeCard {
  id: string;
  kind: PracticeKind;
  group: string;                        // theme / domain shown in the picker
  /** What the learner reads before answering (no expected answer inside). */
  prompt: PracticeLine[];
  /** Paraphrase only: the options of the first attempt. */
  choice?: { options_fi: string[]; correct_index: number };
  /** Skill of the first attempt and of the transfer (reading for the paraphrase choice). */
  attemptSkill: Skill; transferSkill: Skill;
  /** Shown only after the first attempt. */
  reveal: PracticeLine[];
  recall_uk?: string;
  transfer: PracticeLine;
  reviewStatus: string;                 // never "published" today: S2 review pending
}
export type PracticePhase = "attempt" | "reveal" | "recall" | "transfer" | "done";
export interface PracticeSession {
  cardId: string; phase: PracticePhase; first: string; judged: PracticeJudgement | null; recall: string; transfer: string;
}
export type PracticeEvent =
  | { type: "ANSWER"; value: string } | { type: "JUDGE"; judgement: PracticeJudgement }
  | { type: "CONTINUE" } | { type: "SUBMIT_RECALL"; text: string } | { type: "SUBMIT_TRANSFER"; text: string };

export const PRACTICE_MAX_CHARS = 1200;
export class PracticeError extends Error {
  constructor(public readonly code: "NOT_ALLOWED" | "EMPTY" | "INVALID" | "NOT_JUDGED", m: string) { super(m); this.name = "PracticeError"; }
}

const KINDS: PracticeKind[] = ["paraphrase", "reaction", "opinion", "chunk", "rektio"];
const SKILLS: Skill[] = ["reading", "listening", "writing", "speaking"];
const okLine = (l: PracticeLine | undefined) => !!l && typeof l.text === "string" && l.text.trim().length > 0 &&
  typeof l.label_uk === "string" && (l.lang === "fi" || l.lang === "uk");
const norm = (t: string) => t.normalize("NFC").toLocaleLowerCase("fi-FI").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export function validatePracticeCard(x: unknown): x is PracticeCard {
  const c = x as PracticeCard;
  if (!c || !/^[a-z\d_-]{1,90}$/i.test(String(c.id)) || !KINDS.includes(c.kind) || typeof c.group !== "string" ||
      !Array.isArray(c.prompt) || c.prompt.length < 1 || !c.prompt.every(okLine) ||
      !Array.isArray(c.reveal) || c.reveal.length < 1 || !c.reveal.every(okLine) || !okLine(c.transfer) ||
      !SKILLS.includes(c.attemptSkill) || !SKILLS.includes(c.transferSkill) || c.reviewStatus === "published") return false;
  if (c.kind === "paraphrase") {
    const ch = c.choice;
    if (!ch || !Array.isArray(ch.options_fi) || ch.options_fi.length < 2 || !ch.options_fi.every(o => typeof o === "string" && o.trim()) ||
        !Number.isInteger(ch.correct_index) || ch.correct_index < 0 || ch.correct_index >= ch.options_fi.length ||
        typeof c.recall_uk !== "string" || !c.recall_uk.trim() || c.attemptSkill !== "reading") return false;
  } else if (c.choice || c.attemptSkill === "reading" || c.attemptSkill === "listening") return false;
  // Exam-style leak guard: the expected answer must not already be printed in what the learner sees first.
  const before = norm(c.prompt.map(l => l.text).join(" "));
  const keys = c.kind === "paraphrase" ? [] : c.reveal.filter(l => l.lang === "fi").map(l => norm(l.text)).filter(k => k.length >= 4);
  return !keys.some(k => before.includes(k));
}

export function startPractice(card: PracticeCard): PracticeSession {
  if (!validatePracticeCard(card)) throw new TypeError("Invalid practice card");
  return { cardId: card.id, phase: "attempt", first: "", judged: null, recall: "", transfer: "" };
}

const text = (t: string) => {
  const v = String(t ?? "").trim();
  if (!v) throw new PracticeError("EMPTY", "Write something first");
  return v.slice(0, PRACTICE_MAX_CHARS);
};

export function practiceReducer(s: PracticeSession, card: PracticeCard, e: PracticeEvent): PracticeSession {
  if (card.id !== s.cardId) throw new TypeError("Card mismatch");
  const no = (): never => { throw new PracticeError("NOT_ALLOWED", `${e.type} not allowed in ${s.phase}`); };
  switch (e.type) {
    case "ANSWER": {
      if (s.phase !== "attempt") return no();                              // first answer frozen
      if (card.choice) {
        const v = String(e.value ?? "").trim(), n = Number(v);
        if (!v || !Number.isInteger(n) || n < 0 || n >= card.choice.options_fi.length) throw new PracticeError("INVALID", "Choose an option");
        return { ...s, first: String(n), phase: "reveal" };
      }
      return { ...s, first: text(e.value), phase: "reveal" };
    }
    case "JUDGE": {
      if (s.phase !== "reveal" || card.choice || !["same", "partly", "different"].includes(e.judgement)) return no();
      return { ...s, judged: e.judgement };
    }
    case "CONTINUE": {
      if (s.phase !== "reveal") return no();
      if (!card.choice && !s.judged) throw new PracticeError("NOT_JUDGED", "Compare your answer first");
      return { ...s, phase: card.kind === "paraphrase" ? "recall" : "transfer" };
    }
    case "SUBMIT_RECALL": {
      if (s.phase !== "recall") return no();
      return { ...s, recall: text(e.text), phase: "transfer" };
    }
    case "SUBMIT_TRANSFER": {
      if (s.phase !== "transfer") return no();
      return { ...s, transfer: text(e.text), phase: "done" };
    }
  }
}

/** Visibility rules: reveal lines only in `reveal`; nothing of the model in recall/transfer. */
export function practiceView(s: PracticeSession, card: PracticeCard) {
  const reveal = s.phase === "reveal";
  const correct = card.choice && s.first !== "" ? Number(s.first) === card.choice.correct_index : null;
  return {
    phase: s.phase,
    prompt: s.phase === "attempt" || reveal ? card.prompt : [],
    options_fi: s.phase === "attempt" && card.choice ? card.choice.options_fi : null,
    first: s.phase === "attempt" ? null : card.choice ? card.choice.options_fi[Number(s.first)] ?? null : s.first,
    correct: reveal ? correct : null,
    key_fi: reveal && card.choice ? card.choice.options_fi[card.choice.correct_index]! : null,
    reveal: reveal ? card.reveal : null,
    needsJudgement: reveal && !card.choice,
    judged: s.judged,
    recall_uk: s.phase === "recall" ? card.recall_uk ?? null : null,
    transfer: s.phase === "transfer" ? card.transfer : null,
  };
}

/** Evidence for addDiagnostic: only the paraphrase choice is scored; every Finnish text is ungraded. */
export function practiceEvidence(s: PracticeSession, card: PracticeCard) {
  if (s.phase !== "done") throw new PracticeError("NOT_ALLOWED", "Not finished");
  const first = card.choice
    ? { skill: "reading" as const, taskId: card.id, status: "scored" as const, correct: Number(s.first) === card.choice.correct_index,
        response: card.choice.options_fi[Number(s.first)] ?? "" }
    : { skill: card.attemptSkill, taskId: card.id, status: "ungraded" as const, response: `[own first answer; self-compared ${s.judged ?? "none"}] ${s.first}` };
  return [
    first,
    ...(card.kind === "paraphrase" ? [{ skill: "writing" as const, taskId: `${card.id}-recall`, status: "ungraded" as const, response: `[guided retell after feedback] ${s.recall}` }] : []),
    { skill: card.transferSkill, taskId: `${card.id}-transfer`, status: "ungraded" as const, response: `[new situation, no model shown] ${s.transfer}` },
  ];
}

/* ---------- adapters from the existing content files (single physical owners) ---------- */

export interface ParaphraseItem { id: string; domain: string; source_fi: string; task_fi: string; choices_fi: string[]; correct_index: number; explanation_uk: string; recall_prompt_uk: string; transfer_prompt_fi: string }
export interface ReactionItem { id: string; domain: string; stimulus_fi: string; objective_uk: string; required_functions_fi: string[]; model_answer_fi: string; feedback_uk: string; transfer_prompt_fi: string }
export interface OpinionItem { id: string; theme: string; question_fi: string; question_uk: string; required_points_fi: string[]; constraint_change_fi: string; scaffold_hidden_until_attempt: string[]; linguistic_review: string }
export interface ChunkItem { id: string; theme: string; expression_fi: string; meaning_uk: string; context_fi: string; context_uk: string; grammar_note: string | null; linguistic_review: string }
export interface RektioItem { id: string; construction_fi: string; case_or_pattern: string; meaning_uk: string; example_fi: string; example_uk: string; quality_status: string }

export function paraphraseCard(i: ParaphraseItem): PracticeCard {
  return {
    id: i.id, kind: "paraphrase", group: i.domain, attemptSkill: "reading", transferSkill: "writing", reviewStatus: "pending_S2",
    prompt: [{ label_uk: "Речення", text: i.source_fi, lang: "fi" }, { label_uk: "Завдання", text: i.task_fi, lang: "fi" }],
    choice: { options_fi: i.choices_fi, correct_index: i.correct_index },
    // The bank's explanation field is partly written in Finnish; it is shown as authored, labelled neutrally.
    reveal: [{ label_uk: "Чому", text: i.explanation_uk, lang: /[іїєґ]/i.test(i.explanation_uk) || /[а-я]/i.test(i.explanation_uk) ? "uk" : "fi" }],
    recall_uk: i.recall_prompt_uk,
    transfer: { label_uk: "Нова ситуація", text: i.transfer_prompt_fi, lang: "fi" },
  };
}
export function reactionCard(i: ReactionItem): PracticeCard {
  return {
    id: i.id, kind: "reaction", group: i.domain, attemptSkill: "speaking", transferSkill: "speaking", reviewStatus: "pending_S2",
    prompt: [{ label_uk: "Ситуація", text: i.stimulus_fi, lang: "fi" }, { label_uk: "Мета", text: i.objective_uk, lang: /[а-яіїєґ]/i.test(i.objective_uk) ? "uk" : "fi" }],
    reveal: [
      { label_uk: "Одна з можливих відповідей (не ключ)", text: i.model_answer_fi, lang: "fi" },
      { label_uk: "Що мало прозвучати", text: i.required_functions_fi.join(" · "), lang: "fi" },
      { label_uk: "Порада", text: i.feedback_uk, lang: /[а-яіїєґ]/i.test(i.feedback_uk) ? "uk" : "fi" },
    ],
    transfer: { label_uk: "Нова ситуація", text: i.transfer_prompt_fi, lang: "fi" },
  };
}
export function opinionCard(i: OpinionItem): PracticeCard {
  return {
    id: i.id, kind: "opinion", group: i.theme, attemptSkill: "speaking", transferSkill: "writing", reviewStatus: i.linguistic_review,
    prompt: [{ label_uk: "Питання", text: i.question_fi, lang: "fi" }, { label_uk: "Українською", text: i.question_uk, lang: "uk" },
      { label_uk: "Обов'язково скажи", text: i.required_points_fi.join(" "), lang: "fi" }],
    reveal: [{ label_uk: "Фрази для структури (тепер, після твоєї спроби)", text: i.scaffold_hidden_until_attempt.join(" · "), lang: "fi" }],
    transfer: { label_uk: "Змінена умова", text: i.constraint_change_fi, lang: "fi" },
  };
}
export function chunkCard(i: ChunkItem): PracticeCard {
  return {
    id: i.id, kind: "chunk", group: i.theme, attemptSkill: "writing", transferSkill: "writing", reviewStatus: i.linguistic_review,
    prompt: [{ label_uk: "Як сказати фінською", text: i.meaning_uk, lang: "uk" }],
    reveal: [
      { label_uk: "Фраза", text: i.expression_fi, lang: "fi" },
      { label_uk: "У контексті", text: i.context_fi, lang: "fi" },
      { label_uk: "Переклад", text: i.context_uk, lang: "uk" },
      ...(i.grammar_note ? [{ label_uk: "Граматика", text: i.grammar_note, lang: "uk" as const }] : []),
    ],
    transfer: { label_uk: "Нова ситуація", text: `Склади власне нове речення з «${i.expression_fi}» про свою ситуацію.`, lang: "uk" },
  };
}
export function rektioCard(i: RektioItem): PracticeCard {
  return {
    id: i.id, kind: "rektio", group: i.case_or_pattern, attemptSkill: "writing", transferSkill: "writing", reviewStatus: i.quality_status,
    prompt: [{ label_uk: "Скажи фінською, з правильним відмінком", text: i.example_uk, lang: "uk" }],
    reveal: [
      { label_uk: "Приклад", text: i.example_fi, lang: "fi" },
      { label_uk: "Конструкція", text: i.construction_fi, lang: "fi" },
      { label_uk: "Відмінок / модель", text: i.case_or_pattern, lang: "fi" },
      { label_uk: "Значення", text: i.meaning_uk, lang: "uk" },
    ],
    transfer: { label_uk: "Нова ситуація", text: `Склади нове речення з конструкцією «${i.construction_fi}» про себе (інший відмінок не підставляй).`, lang: "uk" },
  };
}
