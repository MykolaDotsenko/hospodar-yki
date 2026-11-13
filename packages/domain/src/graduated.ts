/**
 * Graduated task sequencing (method graduated-task-sequencing, P0): after a practice card is finished, the learner MAY
 * redo the same situation with constraints added one at a time. Constraints accumulate — each step keeps the earlier
 * ones — so the task grows harder in small steps (research #26/#27: complexity added gradually, never imposed).
 *
 *  - constraints are Ukrainian instructions over the card's existing situation: no new Finnish model or key;
 *  - each step is the learner's own Finnish text, saved ungraded with a self-check of the constraint (yes/partly/no);
 *  - optional and stoppable after any step; nothing locks, decays or counts as a level.
 */
import type { PracticeCard } from "./practice.ts";

export interface StepUpConstraint { id: string; uk: string; check_uk: string }
export type StepUpCheck = "yes" | "partly" | "no";

const STEP_UP: Partial<Record<PracticeCard["kind"], readonly StepUpConstraint[]>> = {
  reaction: Object.freeze([
    { id: "brief", uk: "Коротко: одне-два речення, але все головне.", check_uk: "Не більше двох речень і все головне сказано?" },
    { id: "polite", uk: "Ввічливіше: тепер ти звертаєшся до незнайомої офіційної особи — на «ви», з м'яким проханням.", check_uk: "Звертаєшся на «ви» і прохання звучить м'яко?" },
    { id: "specific", uk: "Конкретніше: додай час, місце або причину.", check_uk: "Є час, місце або причина?" },
  ]),
  opinion: Object.freeze([
    { id: "second-reason", uk: "Додай друге обґрунтування своєї думки.", check_uk: "Є дві різні причини?" },
    { id: "counter", uk: "Згадай іншу думку й поясни, чому ти все ж думаєш інакше.", check_uk: "Є чужа думка і твоя відповідь на неї?" },
    { id: "example", uk: "Додай короткий приклад з власного життя.", check_uk: "Є конкретний приклад?" },
  ]),
};

/** The ordered constraints for a card, or null when its kind has no graduated sequence. */
export function stepUpFor(card: Pick<PracticeCard, "kind">): readonly StepUpConstraint[] | null {
  return STEP_UP[card.kind] ?? null;
}

/** Constraints active at step `index` (0-based): every constraint up to and including this one. */
export function activeConstraints(card: Pick<PracticeCard, "kind">, index: number): StepUpConstraint[] {
  const all = stepUpFor(card) ?? [];
  if (!Number.isInteger(index) || index < 0 || index >= all.length) throw new RangeError("No such step");
  return all.slice(0, index + 1);
}

export const STEP_UP_MAX_CHARS = 800;

/** Ungraded speaking/writing evidence for one step; the learner's self-check is a report, never a score. */
export function stepUpEvidence(card: PracticeCard, index: number, text: string, check: StepUpCheck) {
  const active = activeConstraints(card, index);
  const t = String(text ?? "").trim();
  if (!t) throw new Error("EMPTY");
  if (!["yes", "partly", "no"].includes(check)) throw new Error("NO_CHECK");
  return {
    skill: card.transferSkill, taskId: `${card.id}-step-${active[index]!.id}`, status: "ungraded" as const,
    response: `[graduated step ${index + 1}/${(stepUpFor(card) ?? []).length}: ${active.map(c => c.id).join("+")}; self-check ${check}] ${t.slice(0, STEP_UP_MAX_CHARS)}`,
  };
}
