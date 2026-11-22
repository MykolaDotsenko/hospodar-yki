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
import { addDiagnostic, dueCards, localDate, updateCard, withOwnCue, OWN_CUE_MAX_CHARS, type LearnerState, type LocalDate, type Skill } from "./learner.ts";

export type PracticeKind = "paraphrase" | "reaction" | "opinion" | "chunk" | "rektio" | "form" | "time";
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
  /** An illustration (assets/images/illustrations library id) shown only with the reveal: it shows the answer. */
  illustrationId?: string;
}
export type PracticePhase = "plan" | "attempt" | "reveal" | "recall" | "transfer" | "done";
export interface PracticeSession {
  cardId: string; phase: PracticePhase; first: string; judged: PracticeJudgement | null; recall: string; transfer: string;
  /** Optional own pre-task plan (opinion cards only): hidden while answering, shown again for self-comparison. Never scored or stored. */
  plan?: string;
  /**
   * Own memory cue (keyword-mnemonic-retrieval; chunk/rektio only). `cue`: the text the learner typed after seeing the
   * phrase (undefined = not touched, "" = remove). `cueShown`: on a review the learner opened their stored cue before
   * answering — the first answer is then labelled as made with their own cue.
   */
  cue?: string;
  cueShown?: true;
}

/**
 * Pre-task planning (methods pre-task-planning, learner-concept-map; research #26/#27): before a monologue the learner
 * may jot a short own plan. It disappears while they answer — they speak from memory, not by reading notes — and
 * comes back next to the model so they can see what they managed to say. Optional, untimed, ungraded, never stored.
 */
export const PLAN_FRAME_UK: readonly string[] = Object.freeze([
  "Головна думка: що ти про це думаєш?",
  "Дві причини: чому саме так?",
  "Приклад із життя: коли ти це бачив(ла) чи робив(ла)?",
]);
export const canPlan = (card: PracticeCard) => card.kind === "opinion";
/**
 * learner-concept-map (research conceptmap25; registry example «sijainti→hinta→matka→johtopäätös»): the own plan before a
 * monologue is an argument map — opinion → reasons → example → conclusion — with one short node each, any language.
 * It is kept as the plan text (lines «label: node»), so the session, its evidence label and old plans are unchanged;
 * `readArgumentMap` turns such a plan back into nodes for drawing the map next to the model. Never scored or stored.
 */
export const ARGUMENT_MAP_SLOTS = Object.freeze([
  { key: "claim", label_uk: "Моя думка" },
  { key: "reason1", label_uk: "Причина 1" },
  { key: "reason2", label_uk: "Причина 2" },
  { key: "example", label_uk: "Приклад із життя" },
  { key: "conclusion", label_uk: "Висновок" },
] as const);
export type ArgumentSlot = typeof ARGUMENT_MAP_SLOTS[number]["key"];
export type ArgumentMap = Partial<Record<ArgumentSlot, string>>;
export const ARGUMENT_NODE_MAX_CHARS = 120;
const node = (t: unknown) => String(t ?? "").replace(/\s+/g, " ").trim().slice(0, ARGUMENT_NODE_MAX_CHARS);

/** The map as plan text; empty nodes are left out, so an empty map is "without a plan". */
export function argumentMapPlan(map: ArgumentMap): string {
  return ARGUMENT_MAP_SLOTS.map(s => [s.label_uk, node(map[s.key])] as const).filter(([, t]) => t).map(([l, t]) => `${l}: ${t}`).join("\n");
}
/** Nodes of a plan written as a map, in map order; null when the plan is not one (then it is shown as plain text). */
export function readArgumentMap(plan: string | null | undefined): { key: ArgumentSlot; label_uk: string; text: string }[] | null {
  const lines = String(plan ?? "").split("\n").map(l => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  const out: { key: ArgumentSlot; label_uk: string; text: string }[] = [];
  for (const l of lines) {
    const slot = ARGUMENT_MAP_SLOTS.find(s => l.startsWith(`${s.label_uk}: `));
    if (!slot || out.some(o => o.key === slot.key)) return null;
    out.push({ key: slot.key, label_uk: slot.label_uk, text: l.slice(slot.label_uk.length + 2) });
  }
  return ARGUMENT_MAP_SLOTS.flatMap(s => out.filter(o => o.key === s.key));
}

export type PracticeEvent =
  | { type: "ANSWER"; value: string } | { type: "JUDGE"; judgement: PracticeJudgement }
  | { type: "CONTINUE" } | { type: "SUBMIT_RECALL"; text: string } | { type: "SUBMIT_TRANSFER"; text: string }
  | { type: "START_PLAN" } | { type: "SUBMIT_PLAN"; text: string }
  | { type: "SHOW_CUE" } | { type: "SET_CUE"; text: string };

export const PRACTICE_MAX_CHARS = 1200;
export class PracticeError extends Error {
  constructor(public readonly code: "NOT_ALLOWED" | "EMPTY" | "INVALID" | "NOT_JUDGED", m: string) { super(m); this.name = "PracticeError"; }
}

const KINDS: PracticeKind[] = ["paraphrase", "reaction", "opinion", "chunk", "rektio", "form", "time"];
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
  if (c.kind === "paraphrase" || c.kind === "time") {
    const ch = c.choice;
    if (!ch || !Array.isArray(ch.options_fi) || ch.options_fi.length < 2 || !ch.options_fi.every(o => typeof o === "string" && o.trim()) ||
        !Number.isInteger(ch.correct_index) || ch.correct_index < 0 || ch.correct_index >= ch.options_fi.length || c.attemptSkill !== "reading") return false;
    if (c.kind === "paraphrase" && (typeof c.recall_uk !== "string" || !c.recall_uk.trim())) return false;
  } else if (c.choice || c.attemptSkill === "reading" || c.attemptSkill === "listening") return false;
  // Exam-style leak guard: the expected answer must not already be printed in what the learner sees first.
  const before = norm(c.prompt.map(l => l.text).join(" "));
  const keys = c.kind === "paraphrase" || c.kind === "time" ? [] : c.reveal.filter(l => l.lang === "fi").map(l => norm(l.text)).filter(k => k.length >= 4);
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
    case "START_PLAN": {
      if (s.phase !== "attempt" || !canPlan(card) || s.plan !== undefined) return no();   // only before the first answer, once
      return { ...s, phase: "plan" };
    }
    case "SUBMIT_PLAN": {
      if (s.phase !== "plan") return no();
      const plan = String(e.text ?? "").trim().slice(0, PRACTICE_MAX_CHARS);   // an empty plan = "without a plan"
      return { ...s, plan, phase: "attempt" };
    }
    case "SHOW_CUE": {
      if (s.phase !== "attempt" || !hasOwnCue(card)) return no();         // before the first answer only, on problem phrases
      return s.cueShown ? s : { ...s, cueShown: true };
    }
    case "SET_CUE": {
      if (s.phase !== "reveal" || !hasOwnCue(card)) return no();          // after seeing the phrase, never before the answer
      return { ...s, cue: String(e.text ?? "").slice(0, OWN_CUE_MAX_CHARS) };
    }
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
    prompt: s.phase === "plan" || s.phase === "attempt" || reveal ? card.prompt : [],
    canPlan: s.phase === "attempt" && canPlan(card) && s.plan === undefined,
    planFrame_uk: s.phase === "plan" ? PLAN_FRAME_UK : null,
    planHidden: s.phase === "attempt" && !!s.plan,                         // the plan is out of sight while answering
    plan: reveal && s.plan ? s.plan : null,                                // back only for self-comparison
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
/**
 * `review`: this run is a spaced review of a card the learner has already answered (it is in their schedule). Its choice is
 * then NOT a new scored first attempt — the item was seen with its key before — so it is kept as ungraded practice with the
 * match noted in the text; reading counts and first-attempt evidence stay first exposures only (LE-01, IV-REQ-03).
 */
export function practiceEvidence(s: PracticeSession, card: PracticeCard, opts: { review?: boolean } = {}) {
  if (s.phase !== "done") throw new PracticeError("NOT_ALLOWED", "Not finished");
  const chosen = card.choice ? card.choice.options_fi[Number(s.first)] ?? "" : "";
  const first = card.choice && opts.review
    ? { skill: "reading" as const, taskId: card.id, status: "ungraded" as const,
        response: `[spaced review of an item seen before with its key; choice matched the key: ${Number(s.first) === card.choice.correct_index ? "yes" : "no"}] ${chosen}` }
    : card.choice
    ? { skill: "reading" as const, taskId: card.id, status: "scored" as const, correct: Number(s.first) === card.choice.correct_index,
        response: chosen }
    : { skill: card.attemptSkill, taskId: card.id, status: "ungraded" as const,
        response: `[own first answer${s.plan ? ", after an own plan (hidden while answering)" : ""}${s.cueShown ? ", after opening own memory cue" : ""}; self-compared ${s.judged ?? "none"}] ${s.first}` };
  return [
    first,
    ...(card.kind === "paraphrase" ? [{ skill: "writing" as const, taskId: `${card.id}-recall`, status: "ungraded" as const, response: `[guided retell after feedback] ${s.recall}` }] : []),
    { skill: card.transferSkill, taskId: `${card.id}-transfer`, status: "ungraded" as const, response: `[new situation, no model shown] ${s.transfer}` },
  ];
}

/**
 * Spaced retrieval of CONFIRMED problems (method spaced-retrieval, research #27 PSY-04, and the
 * chunk bank's own usage_rule: "add a chunk to the learner's personal SRS ONLY after explicit failure").
 *  - scheduled kinds: chunk and rektio phrases, «Форма слова в реченні» (form) and «Час дієслова й годинник» (time);
 *  - a card enters the 1/3/7/14/30 schedule only after a failed retrieval: a free answer the learner judged "partly" or
 *    "different", or a keyed choice (time) whose first choice was not the key; a card that was right at first sight is
 *    never scheduled (no bank flooding);
 *  - on a later review a recall ("same" / the key chosen) moves it one stage up, anything else returns it to day 1;
 *  - for free answers the signal is the learner's SELF-REPORT: it schedules practice, it is never a score or a level;
 *    a review of a keyed choice is kept as ungraded practice, not as a new scored first attempt (see practiceEvidence);
 *  - an own memory cue typed after seeing the phrase is kept with a SCHEDULED phrase card only (chunk/rektio: no mnemonic
 *    for a phrase the learner already knew — keyword-mnemonic-retrieval limitation "not for every word"); "" removes it.
 */
export const SPACED_KINDS: readonly PracticeKind[] = Object.freeze(["chunk", "rektio", "form", "time"]);
export const isSpacedKind = (card: PracticeCard) => SPACED_KINDS.includes(card.kind);
/** Own memory cues belong to phrases (keyword-mnemonic-retrieval), not to every scheduled card. */
export const hasOwnCue = (card: PracticeCard) => card.kind === "chunk" || card.kind === "rektio";
/** Did the learner retrieve it on this run? Keyed choice: the first choice was the key; free answer: judged "same". */
export function practiceRecalled(s: PracticeSession, card: PracticeCard): boolean {
  return card.choice ? s.first !== "" && Number(s.first) === card.choice.correct_index : s.judged === "same";
}
/** What a finished run does to the schedule — for an honest message after saving. `state` is the state BEFORE the save. */
export type SpacedOutcome = "not_spaced" | "not_scheduled" | "back_tomorrow" | "longer_gap";
export function spacedOutcome(state: Pick<LearnerState, "cards">, s: PracticeSession, card: PracticeCard): SpacedOutcome {
  if (!isSpacedKind(card)) return "not_spaced";
  const recalled = practiceRecalled(s, card);
  if (!recalled) return "back_tomorrow";
  return card.id in state.cards ? "longer_gap" : "not_scheduled";
}
export function completePractice(state: LearnerState, s: PracticeSession, card: PracticeCard, now: Date = new Date()): LearnerState {
  const known = state.cards[card.id];
  let next = state;
  for (const ev of practiceEvidence(s, card, { review: !!known && isSpacedKind(card) })) next = addDiagnostic(next, ev, now);
  if (!isSpacedKind(card)) return next;
  const recalled = practiceRecalled(s, card);
  if (!known && recalled) return next;
  const updated = updateCard(known, recalled, now);
  return { ...next, cards: { ...next.cards, [card.id]: s.cue === undefined || !hasOwnCue(card) ? updated : withOwnCue(updated, s.cue) } };
}
/**
 * Interleaving of confusable forms (method interleaving-grammar; COG/PSY research #27): a rektio card's group is its case
 * or pattern (elatiivi, illatiivi, partitiivi …). Due cards keep their oldest-first order, except that the next card is
 * the oldest one whose group differs from the previous card's, so the learner has to decide which case each verb takes
 * instead of repeating one case in a block. Research #27 found forced interleaving of plain word lists unhelpful, so this
 * applies to rektio (case choice) only; chunks keep their order.
 * `after` is the group of the task the learner has just finished (R06 cloze missions: its grammar form), so the first
 * item is also not a second block of that form when another is left.
 */
export function interleaveByGroup<T extends { group: string }>(cards: readonly T[], after?: string): T[] {
  const rest = [...cards], out: T[] = [];
  while (rest.length) {
    const prev = out.length ? out[out.length - 1]!.group : after;
    const i = rest.findIndex(c => c.group !== prev);
    out.push(rest.splice(i === -1 ? 0 : i, 1)[0]!);
  }
  return out;
}

/** Scheduled practice cards that are due today, oldest first (rektio interleaved by case); a late return is simply due.
 * `cards` is the learner pool: a scheduled id that is not in it (e.g. an EXAM item, or a release build without drafts) is never served. */
export function practiceDue<T extends PracticeCard>(state: LearnerState, cards: T[], today: LocalDate = localDate()): T[] {
  const due = dueCards(state, today).map(c => cards.find(x => x.id === c.id && isSpacedKind(x))).filter((x): x is T => !!x);
  const rektio = interleaveByGroup(due.filter(c => c.kind === "rektio"));
  let r = 0;
  return due.map(c => (c.kind === "rektio" ? rektio[r++]! : c));             // chunks keep their place and order
}

/**
 * The next new card of the same kind after a finished one. For rektio it is the first unfinished card whose case differs
 * from the one just practised (interleaving); for every other kind, simply the next unfinished one.
 */
export function nextPracticeCard<T extends PracticeCard>(cards: readonly T[], current: T, finished: (id: string) => boolean): T | null {
  const open = cards.filter(c => c.kind === current.kind && c.id !== current.id && !finished(c.id));
  if (current.kind === "rektio") return open.find(c => c.group !== current.group) ?? open[0] ?? null;
  return open[0] ?? null;
}

/* ---------- adapters from the existing content files (single physical owners) ---------- */

export interface ParaphraseItem { id: string; domain: string; source_fi: string; task_fi: string; choices_fi: string[]; correct_index: number; explanation_uk: string; recall_prompt_uk: string; transfer_prompt_fi: string }
export interface ReactionItem { id: string; domain: string; stimulus_fi: string; objective_uk: string; required_functions_fi: string[]; model_answer_fi: string; feedback_uk: string; transfer_prompt_fi: string }
export interface OpinionItem { id: string; theme: string; question_fi: string; question_uk: string; required_points_fi: string[]; constraint_change_fi: string; scaffold_hidden_until_attempt: string[]; linguistic_review: string }
export interface ChunkItem { id: string; theme: string; expression_fi: string; meaning_uk: string; context_fi: string; context_uk: string; grammar_note: string | null; linguistic_review: string }
export interface RektioItem { id: string; construction_fi: string; case_or_pattern: string; meaning_uk: string; example_fi: string; example_uk: string; quality_status: string }

/** A corpus sentence with one word form removed (UD Finnish FTB, CC BY 4.0): ftb-frequency-cloze-v1.json. */
export interface FormItem {
  id: string; grammar_focus: string; cloze_fi: string; context_fi: string; answer_fi: string; lemma_fi: string;
  teacher_review: string; original_source: string; source_license: string;
}
/**
 * «Форма слова в реченні» (CURATED-09): write the form of the lemma that fits the sentence, then see the corpus form and
 * compare yourself. The corpus keeps ONE form; another natural form may be right too, so the first answer is
 * self-compared and never scored. The source and the adaptation are named on the card (CC BY 4.0 requires it).
 */
export function formCard(i: FormItem): PracticeCard {
  return {
    id: i.id, kind: "form", group: i.grammar_focus, attemptSkill: "writing", transferSkill: "writing", reviewStatus: i.teacher_review,
    prompt: [{ label_uk: "Впиши форму слова в дужках, яка пасує до речення", text: `${i.cloze_fi.replace(/_{3,}/, "___")} (${i.lemma_fi})`, lang: "fi" }],
    reveal: [
      { label_uk: "Форма в джерелі", text: i.answer_fi, lang: "fi" },
      { label_uk: "Усе речення", text: i.context_fi, lang: "fi" },
      { label_uk: "Зверни увагу", text: "Речення з корпусу має одну форму; інша природна форма теж може бути правильною — порівняй сам(а), це не бал.", lang: "uk" },
      { label_uk: "Джерело", text: `${i.original_source} · ${i.source_license} · адаптовано: одне слово замінено пропуском`, lang: "uk" },
    ],
    transfer: { label_uk: "Нова ситуація", text: `Склади власне речення про своє життя з формою «${i.answer_fi}».`, lang: "uk" },
  };
}

/** tenses/lessons.json and time-and-clock/lessons.json (project-original drafts, S2-pending). */
export interface TenseLesson { tense: string; label_uk: string; form: string; examples: { fi: string; uk: string }[] }
export interface TimeChoiceItem { id: string; prompt_fi: string; choices: string[]; answer: string | null; tense?: string; type?: string }
export interface ClockExample { fi: string; time: string; uk: string }
/**
 * «Час дієслова й годинник» (CURATED-09): choose the form or the time first (scored, like every keyed choice), then the
 * explanation and the picture that shows the answer (tense timeline, clock face), then an own sentence (ungraded).
 */
export function tenseCard(i: TimeChoiceItem, lesson: TenseLesson, transfer_fi: string | null): PracticeCard | null {
  const correct = i.answer ? i.choices.indexOf(i.answer) : -1;
  if (correct < 0) return null;
  return {
    id: i.id, kind: "time", group: "tenses", attemptSkill: "reading", transferSkill: "writing", reviewStatus: "pending_S2",
    prompt: [{ label_uk: "Обери форму, яка пасує до речення", text: i.prompt_fi, lang: "fi" }],
    choice: { options_fi: i.choices, correct_index: correct },
    reveal: [
      { label_uk: lesson.label_uk, text: lesson.form, lang: "fi" },
      ...lesson.examples.flatMap(e => [{ label_uk: "Приклад", text: e.fi, lang: "fi" as const }, { label_uk: "Переклад", text: e.uk, lang: "uk" as const }]),
    ],
    transfer: transfer_fi ? { label_uk: "Нова ситуація", text: transfer_fi, lang: "fi" }
      : { label_uk: "Нова ситуація", text: `Склади власне речення про себе в цьому часі (${lesson.label_uk.toLocaleLowerCase("uk")}).`, lang: "uk" },
    illustrationId: "tense-timeline",
  };
}
export function clockCard(i: TimeChoiceItem, example: ClockExample | null, illustrationId: string | null): PracticeCard | null {
  const correct = i.answer ? i.choices.indexOf(i.answer) : -1;
  if (correct < 0) return null;
  return {
    id: i.id, kind: "time", group: "clock", attemptSkill: "reading", transferSkill: "writing", reviewStatus: "pending_S2",
    prompt: [{ label_uk: "Котра година?", text: i.prompt_fi, lang: "fi" }],
    choice: { options_fi: i.choices, correct_index: correct },
    reveal: example ? [{ label_uk: "Так кажуть", text: example.fi, lang: "fi" }, { label_uk: "Переклад", text: example.uk, lang: "uk" }]
      : [{ label_uk: "Відповідь", text: i.answer!, lang: "fi" }],
    transfer: { label_uk: "Нова ситуація", text: "Напиши фінською, о котрій годині починається й закінчується твій звичайний день.", lang: "uk" },
    ...(illustrationId ? { illustrationId } : {}),
  };
}

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

/**
 * Pause and resume a practice card (COG-11; LE-01 first answer frozen). An unfinished card is kept on this device
 * so that a reload, a break or leaving the screen continues it at the same step — and, as important, so that a reload
 * after the model was shown can never give a "first" answer again. What is kept is the card's own session plus the
 * text being typed. Never kept: an own pre-task plan (promised "never stored"), so a card with a plan stays session-only.
 * A damaged or foreign record is refused (null), never guessed.
 */
export interface PracticeDraft { cardId: string; session: PracticeSession; value: string; savedAt: string }
const PHASES: PracticePhase[] = ["plan", "attempt", "reveal", "recall", "transfer", "done"];
const JUDGED: PracticeJudgement[] = ["same", "partly", "different"];
const short = (v: unknown, max = PRACTICE_MAX_CHARS) => typeof v === "string" && v.length <= max;

/** The draft to keep for this session, or null when it must stay session-only (finished, or an own plan is in it). */
export function practiceDraft(s: PracticeSession, value: string, now: Date = new Date()): PracticeDraft | null {
  if (s.phase === "done" || s.phase === "plan" || (typeof s.plan === "string" && s.plan.trim() !== "")) return null;
  if (s.phase === "attempt" && !s.first && !String(value ?? "").trim() && !s.cueShown) return null;   // nothing to keep yet
  const { plan: _plan, ...session } = s;
  return { cardId: s.cardId, session: { ...session }, value: String(value ?? "").slice(0, PRACTICE_MAX_CHARS), savedAt: now.toISOString() };
}

/** A kept draft for this card, checked against the card and the session rules; anything else is null. */
export function restorePracticeDraft(raw: unknown, card: PracticeCard): PracticeDraft | null {
  const d = raw as PracticeDraft | null;
  if (!d || typeof d !== "object" || d.cardId !== card.id || !short(d.value) || typeof d.savedAt !== "string" || !Number.isFinite(Date.parse(d.savedAt))) return null;
  const s = d.session as PracticeSession | null;
  if (!s || s.cardId !== card.id || !PHASES.includes(s.phase) || s.phase === "done" || s.phase === "plan" || "plan" in s) return null;
  if (!short(s.first) || !short(s.recall) || !short(s.transfer) || !(s.judged === null || JUDGED.includes(s.judged))) return null;
  if (s.cue !== undefined && !short(s.cue, OWN_CUE_MAX_CHARS)) return null;
  if (s.cueShown !== undefined && s.cueShown !== true) return null;
  const answered = s.phase !== "attempt";
  if (answered !== (s.first.trim() !== "")) return null;                                  // a later step always has a frozen first answer
  if (card.choice && answered && !(Number.isInteger(Number(s.first)) && Number(s.first) >= 0 && Number(s.first) < card.choice.options_fi.length)) return null;
  if (s.phase === "recall" && card.kind !== "paraphrase") return null;
  if (s.phase === "transfer" && !card.choice && s.judged === null) return null;           // free text is self-compared before moving on
  if (s.phase === "attempt" && (s.judged !== null || s.recall || s.transfer)) return null;
  return { cardId: d.cardId, session: { ...s }, value: d.value, savedAt: d.savedAt };
}
