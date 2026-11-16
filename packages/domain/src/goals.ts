/**
 * The learner's own goals and the first run (docs/29 stage 3, code queue 8; MOT-02 the learner chooses a real Finnish goal;
 * MOT-11 a plan is stored only on the learner's explicit action and can be edited or erased; R08-MOT §3 onboarding asks
 * what the learner genuinely needs to do in Finnish).
 *
 * A goal is a life place of «Моє господарство» (housing, work, health…) or passing the YKI exam. Goals are optional and
 * only steer which new task comes first among tasks the R06 ranker scores alike: a +2 topic preference, smaller than
 * the balance for one saved answer, so the four skills keep equal opportunity. Never a filter, never a level. Nothing
 * here asks for or stores a level, an age, a country of origin or any other personal attribute.
 *
 * The record also says that the learner has seen the first-run screen, so it is shown once: a learner with no saved
 * evidence and no record sees it; anyone who has saved anything never does.
 */
import type { LearnerState } from "./learner.ts";
import { PLACE_IDS, type PlaceId } from "./places.ts";

export const LEARNER_GOAL_IDS = Object.freeze([...PLACE_IDS, "yki"] as const);
export type LearnerGoal = typeof LEARNER_GOAL_IDS[number];
export interface GoalRecord {
  version: 1;
  /** In the fixed order of LEARNER_GOAL_IDS, without duplicates; may be empty (seen, nothing chosen). */
  goals: LearnerGoal[];
  /** Local date the learner closed the first-run screen. */
  seen: string;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ordered = (goals: readonly unknown[]): LearnerGoal[] =>
  LEARNER_GOAL_IDS.filter(g => goals.includes(g));

/** Tolerant reader: unknown goals are dropped, a damaged record reads as "no record" (the welcome shows again). */
export function parseGoalRecord(raw: unknown): GoalRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { version?: unknown; goals?: unknown; seen?: unknown };
  if (r.version !== 1 || !Array.isArray(r.goals) || typeof r.seen !== "string" || !DATE.test(r.seen)) return null;
  return { version: 1, goals: ordered(r.goals), seen: r.seen };
}

export function goalRecord(goals: readonly unknown[], today: string): GoalRecord {
  if (!DATE.test(today)) throw new TypeError("Invalid local date");
  return { version: 1, goals: ordered(goals), seen: today };
}

/** The life places among the goals (YKI is a goal, not a place). */
export const goalPlaces = (record: GoalRecord | null): PlaceId[] =>
  (record?.goals ?? []).filter((g): g is PlaceId => g !== "yki");

/** The first run is for a learner who has saved nothing yet and has not closed it before. */
export function shouldWelcome(state: Pick<LearnerState, "attempts" | "diagnostics" | "retention"> | null, record: GoalRecord | null): boolean {
  if (!state || record) return false;
  return (state.attempts?.length ?? 0) === 0 && (state.diagnostics?.length ?? 0) === 0 && (state.retention?.length ?? 0) === 0;
}
