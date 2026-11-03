/**
 * R03/R08 meaning → form mission (TS port of app/r08-grammar-core.mjs, parity-tested).
 * research/pedagogy/30 (M01…M09) and /34: a wrong Finnish form can hide different mechanisms —
 * case meaning (M01), stem change (M02), object case (M03), valency/rektio (M04). The learner
 * first decides the MEANING, then produces the FORM; both first answers are kept separately.
 * Wrong forms get a cause ONLY when an editor listed that exact form (never regex guessing).
 *
 * Phase order (DEC-02, 03.11.2026 — canonical, same as cloze MVP-04/COLOR-02): a form that does
 * not match the key goes to `repair` FIRST (cause shown, key hidden); the key appears only in
 * `feedback` afterwards. This intentionally differs from the order in app/r08-grammar-core.mjs;
 * first-attempt evidence (meaning, form, error family) stays identical to the reference.
 *
 * Learner use requires S2-approved items. `reviewerPreview` lets an S2 reviewer walk a draft
 * in the real UI; such sessions are marked and are never learner evidence.
 */
export const R08_CHOICES = ["location", "toward", "from", "negated_object", "completed_object", "valency", "change_state"] as const;
export type R08Choice = typeof R08_CHOICES[number];
export type R08ErrorFamily = "case_selection" | "stem_allomorphy" | "valency" | "object_boundedness";
export type R08Focus = "case_choice" | "stem_change" | "valency" | "object_case";

export interface R08Task {
  id: string; mode: "LEARN"; examOnly?: boolean; heldOut?: boolean; origin: "original_draft";
  review_status: "editorial_draft_pending_S2_review" | "approved_S2"; answerKeyReviewed: boolean;
  prompt_fi: string; lemma_fi: string; semantic_question_uk: string;
  semantic_relation: R08Choice; semantic_options: R08Choice[];
  answer_fi: string; accepted_alternatives_fi: string[]; transfer_prompt_fi: string; explanation_uk: string;
  learning_focus: R08Focus; stem_transparency: "transparent" | "semitransparent";
  known_wrong_forms?: Array<{ form: string; error_family: R08ErrorFamily }>;
  meaning_hint_uk?: string; form_hint_uk?: string; stem_visual_after_answer?: string; level?: string;
}
export type R08Phase = "meaning" | "form" | "repair" | "feedback" | "transfer" | "done";
export interface R08Session {
  version: 1; taskId: string; phase: R08Phase; preview: boolean;
  supportUsed: Array<"meaning" | "form">;
  firstMeaning: { choice: R08Choice; independent: boolean; correct: boolean | null } | null;
  firstForm: { answer: string; independent: boolean; correct: boolean | null } | null;
  formEvidence: "formative_independent_objective_only" | "supported_ungraded" | null;
  feedback: { meaningCorrect: boolean | null; formCorrect: boolean | null; editorialErrorFamily: R08ErrorFamily | "unclassified" | null } | null;
  repair: { answer: string; matchesKey: boolean; status: "guided_ungraded" } | { skipped: true; status: "guided_ungraded" } | null;
  transfer: { answer: string; status: "ungraded_new_context"; independent: true } | null;
}
export type R08Event =
  | { type: "REQUEST_HELP"; kind: "meaning" | "form" }
  | { type: "CHOOSE_MEANING"; choice: R08Choice }
  | { type: "SUBMIT_FORM"; answer: string }
  | { type: "SUBMIT_REPAIR"; answer: string }
  | { type: "SKIP_REPAIR" }
  | { type: "CONTINUE" }
  | { type: "SUBMIT_TRANSFER"; answer: string };

const MAX_TEXT = 1600;
const EVIDENCE = "formative_independent_objective_only" as const;
const str = (x: unknown) => String(x ?? "").normalize("NFC").trim();
const norm = (x: unknown) => str(x).replace(/\s+/gu, " ").toLocaleLowerCase("fi-FI");
const safe = (x: unknown) => str(x).slice(0, MAX_TEXT);
const FOCI = ["case_choice", "stem_change", "valency", "object_case"];
const FAMILIES = ["case_selection", "stem_allomorphy", "valency", "object_boundedness"];

export function validateR08Task(task: unknown, { requireApproved = false } = {}): task is R08Task {
  const t = task as R08Task;
  if (!t || typeof t !== "object" || !/^r08-g-\d{3}$/.test(t.id || "") ||
    t.mode !== "LEARN" || t.examOnly === true || t.heldOut === true ||
    t.origin !== "original_draft" || !["editorial_draft_pending_S2_review", "approved_S2"].includes(t.review_status) ||
    (requireApproved && t.review_status !== "approved_S2") ||
    t.answerKeyReviewed !== (t.review_status === "approved_S2") ||
    typeof t.prompt_fi !== "string" || !t.prompt_fi.includes("___") ||
    typeof t.lemma_fi !== "string" || !str(t.lemma_fi) ||
    typeof t.semantic_question_uk !== "string" || !str(t.semantic_question_uk) ||
    !R08_CHOICES.includes(t.semantic_relation) || !Array.isArray(t.semantic_options) ||
    t.semantic_options.length < 2 || new Set(t.semantic_options).size !== t.semantic_options.length ||
    !t.semantic_options.every(x => R08_CHOICES.includes(x)) || !t.semantic_options.includes(t.semantic_relation) ||
    typeof t.answer_fi !== "string" || !str(t.answer_fi) || !Array.isArray(t.accepted_alternatives_fi) ||
    !t.accepted_alternatives_fi.every(x => typeof x === "string" && !!str(x) && norm(x) !== norm(t.answer_fi)) ||
    new Set(t.accepted_alternatives_fi.map(norm)).size !== t.accepted_alternatives_fi.length ||
    typeof t.transfer_prompt_fi !== "string" || !str(t.transfer_prompt_fi) || t.transfer_prompt_fi === t.prompt_fi ||
    typeof t.explanation_uk !== "string" || !str(t.explanation_uk) ||
    !FOCI.includes(t.learning_focus) || !["transparent", "semitransparent"].includes(t.stem_transparency) ||
    (t.known_wrong_forms !== undefined && (!Array.isArray(t.known_wrong_forms) ||
      !t.known_wrong_forms.every(x => x && typeof x.form === "string" && x.form.trim() && x.form !== t.answer_fi &&
        FAMILIES.includes(x.error_family))))) return false;
  return true;
}

export function createR08Trial(task: R08Task, { reviewerPreview = false }: { reviewerPreview?: boolean } = {}): R08Session {
  if (!validateR08Task(task, { requireApproved: !reviewerPreview }))
    throw new TypeError(reviewerPreview ? "Invalid R08 task" : "R08 requires S2-approved, original, LEARN-only task");
  return Object.freeze({ version: 1, taskId: task.id, phase: "meaning", preview: reviewerPreview, supportUsed: [],
    firstMeaning: null, firstForm: null, formEvidence: null, feedback: null, repair: null, transfer: null });
}
function ensure(s: R08Session, task: R08Task) {
  if (!s || s.version !== 1 || s.taskId !== task?.id || !validateR08Task(task, { requireApproved: !s.preview }))
    throw new TypeError("Invalid R08 trial/task");
}
const frozen = (s: R08Session): R08Session => Object.freeze({ ...s, supportUsed: [...s.supportUsed] });

export function advanceR08(session: R08Session, task: R08Task, event: R08Event): R08Session {
  ensure(session, task);
  const s: R08Session = { ...session, supportUsed: [...session.supportUsed] };
  if (event.type === "REQUEST_HELP" && (s.phase === "meaning" || s.phase === "form")) {
    if (!["meaning", "form"].includes(event.kind)) throw new TypeError("Unknown help");
    if (!s.supportUsed.includes(event.kind)) s.supportUsed.push(event.kind);
    return frozen(s);
  }
  if (event.type === "CHOOSE_MEANING" && s.phase === "meaning") {
    if (!task.semantic_options.includes(event.choice)) throw new TypeError("Semantic option not available");
    const independent = s.supportUsed.length === 0;
    s.firstMeaning = { choice: event.choice, independent, correct: independent ? event.choice === task.semantic_relation : null };
    s.phase = "form"; return frozen(s);
  }
  if (event.type === "SUBMIT_FORM" && s.phase === "form") {
    const answer = safe(event.answer);
    if (!answer) throw new TypeError("R08 needs a Finnish first answer");
    const independent = s.supportUsed.length === 0;
    const accepted = [task.answer_fi, ...(task.accepted_alternatives_fi || [])];
    const correct = independent ? accepted.some(x => norm(x) === norm(answer)) : null;
    let family: R08ErrorFamily | "unclassified" | null = null;
    if (independent && correct === false)
      family = task.known_wrong_forms?.find(x => norm(x.form) === norm(answer))?.error_family || "unclassified";
    s.firstForm = { answer, independent, correct };
    s.formEvidence = independent ? EVIDENCE : "supported_ungraded";
    s.feedback = { meaningCorrect: s.firstMeaning!.correct, formCorrect: correct, editorialErrorFamily: family };
    const matches = accepted.some(x => norm(x) === norm(answer));
    s.phase = matches ? "feedback" : "repair"; return frozen(s);
  }
  if (event.type === "SUBMIT_REPAIR" && s.phase === "repair") {
    const answer = safe(event.answer);
    if (!answer) throw new TypeError("R08 needs nonempty repair");
    const matchesKey = [task.answer_fi, ...(task.accepted_alternatives_fi || [])].some(x => norm(x) === norm(answer));
    s.repair = { answer, matchesKey, status: "guided_ungraded" };
    s.phase = "feedback"; return frozen(s);
  }
  if (event.type === "SKIP_REPAIR" && s.phase === "repair") { s.repair = { skipped: true, status: "guided_ungraded" }; s.phase = "feedback"; return frozen(s); }
  if (event.type === "CONTINUE" && s.phase === "feedback") { s.phase = "transfer"; return frozen(s); }
  if (event.type === "SUBMIT_TRANSFER" && s.phase === "transfer") {
    const answer = safe(event.answer);
    if (!answer) throw new TypeError("R08 needs independent new context response");
    s.transfer = { answer, status: "ungraded_new_context", independent: true };
    s.phase = "done"; return frozen(s);
  }
  throw new TypeError("R08 event not permitted in this phase");
}

/** Only what the learner may see in each phase — keys appear in `feedback` only. */
export function r08View(session: R08Session, task: R08Task) {
  ensure(session, task);
  const phase = session.phase;
  if (phase === "meaning") return { phase, semanticQuestionUk: task.semantic_question_uk, options: [...task.semantic_options],
    contextFi: task.prompt_fi, supportVisible: session.supportUsed.includes("meaning") ? (task.meaning_hint_uk || null) : null, noAudioAutoplay: true } as const;
  if (phase === "form") return { phase, promptFi: task.prompt_fi, lemmaFi: task.lemma_fi,
    supportVisible: session.supportUsed.includes("form") ? (task.form_hint_uk || null) : null, noAudioAutoplay: true } as const;
  if (phase === "repair") return { phase, promptFi: task.prompt_fi, lemmaFi: task.lemma_fi, meaningRelation: task.semantic_relation,
    meaningCorrect: session.firstMeaning?.correct ?? null, errorFamily: session.feedback?.editorialErrorFamily || null, noKey: true } as const;
  if (phase === "feedback") return { phase, repair: session.repair, meaningRelation: task.semantic_relation, answerFi: task.answer_fi,
    explanationUk: task.explanation_uk, meaningCorrect: session.firstMeaning?.correct ?? null,
    formCorrect: session.firstForm?.correct ?? null, errorFamily: session.feedback?.editorialErrorFamily || null,
    evidence: session.formEvidence, stemCue: task.stem_transparency === "semitransparent" ? (task.stem_visual_after_answer || null) : null } as const;
  if (phase === "transfer") return { phase, transferPromptFi: task.transfer_prompt_fi, evidence: "ungraded_new_context", noHints: true } as const;
  return { phase, complete: true, independentForm: session.formEvidence === EVIDENCE, transferUngraded: true, noOfficialYkiGrade: true } as const;
}

/** Ukrainian labels for meaning options and editor-tagged error families (UI copy, not diagnosis). */
export const R08_CHOICE_UK: Record<R08Choice, string> = {
  location: "де? — перебування (missä?)", toward: "куди? — рух до (mihin?)", from: "звідки? — рух від (mistä?)",
  negated_object: "заперечення: «не …» (партитив)", completed_object: "дію завершено повністю (тотальний об'єкт)",
  valency: "цього вимагає дієслово (рекція)", change_state: "зміна стану: ким/чим стати",
};
export const R08_FAMILY_UK: Record<R08ErrorFamily | "unclassified", string> = {
  case_selection: "Обрано не той відмінок для цього значення (M01).",
  stem_allomorphy: "Відмінок правильний, але основа слова змінюється (M02).",
  valency: "Це дієслово вимагає іншого відмінка — рекція (M04).",
  object_boundedness: "Форма об'єкта залежить від заперечення чи завершеності дії (M03).",
  unclassified: "Цю помилку не класифіковано: порівняй свою форму з правильною.",
};
