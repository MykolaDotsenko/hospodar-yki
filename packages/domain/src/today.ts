/**
 * "Сьогодні": one recommended next step with a learner-visible reason (UIO-01 one main action, UIO-08 actionable
 * progress, R06 transparent reasons + manual choice, research #26 order of the learning cycle).
 *
 * Order — what the evidence ranks highest comes first:
 *   1. a delayed 7/14/30 check that is due (independent delayed transfer is the outcome that matters)
 *   2. phrases the learner did not recall last time (spaced retrieval of confirmed problem items)
 *   3. grammar items scheduled for today
 *   4. brand-new learner → the short starting diagnostic
 *   5. a skill with no practice yet, otherwise the least practised skill (four skills get equal opportunity)
 * Deterministic, explainable, never a level or readiness estimate. The learner can always choose something else.
 */
import type { LearnerState, Skill } from "./learner.ts";

export type TodayKind = "delayed_check" | "phrase_review" | "grammar_review" | "diagnostic" | "skill_practice";
export type TodayReason = "due_today" | "missed_last_time" | "scheduled_today" | "start_here" | "never_practised" | "least_practised";
export interface TodayAction { kind: TodayKind; reason: TodayReason; count: number; skill: Skill | null }
export interface TodayInput {
  delayedDue: number; phrasesDue: number; grammarDue: number;
  /** Any saved LEARN evidence at all (missions, practice, diagnostic). */
  hasAnyEvidence: boolean;
  practice: Record<Skill, number>;
}
const SKILL_ORDER: Skill[] = ["reading", "listening", "writing", "speaking"];
const count = (n: number) => (Number.isInteger(n) && n > 0 ? n : 0);

/** Saved answers per skill from ordinary practice; delayed checks (`d7-…`) are a separate signal and not counted here. */
export function skillPracticeCounts(state: Pick<LearnerState, "diagnostics">): Record<Skill, number> {
  const out: Record<Skill, number> = { reading: 0, listening: 0, writing: 0, speaking: 0 };
  for (const d of state.diagnostics ?? []) if (d.skill in out && !/^d(?:7|14|30)-/.test(d.taskId)) out[d.skill] += 1;
  return out;
}

/** Ordered actions; the first is the single primary step, the rest (at most two) are secondary. */
export function todayPlan(input: TodayInput): TodayAction[] {
  const plan: TodayAction[] = [];
  if (count(input.delayedDue)) plan.push({ kind: "delayed_check", reason: "due_today", count: count(input.delayedDue), skill: null });
  if (count(input.phrasesDue)) plan.push({ kind: "phrase_review", reason: "missed_last_time", count: count(input.phrasesDue), skill: null });
  if (count(input.grammarDue)) plan.push({ kind: "grammar_review", reason: "scheduled_today", count: count(input.grammarDue), skill: null });
  if (!input.hasAnyEvidence) plan.push({ kind: "diagnostic", reason: "start_here", count: 0, skill: null });
  else {
    const never = SKILL_ORDER.find(s => count(input.practice[s]) === 0);
    const least = [...SKILL_ORDER].sort((a, b) => count(input.practice[a]) - count(input.practice[b]) || SKILL_ORDER.indexOf(a) - SKILL_ORDER.indexOf(b))[0]!;
    plan.push(never ? { kind: "skill_practice", reason: "never_practised", count: 0, skill: never }
      : { kind: "skill_practice", reason: "least_practised", count: count(input.practice[least]), skill: least });
  }
  return plan.slice(0, 3);
}
