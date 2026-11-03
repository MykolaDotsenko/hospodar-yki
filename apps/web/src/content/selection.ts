/** R06-ranked cloze selection with human-readable reasons (research/pedagogy/33). */
import { explainR06, localDate, rankR06Tasks, type LearnerState, type R06Ranked, type R06Task } from "@hospodar/domain";
import { exercises, isDraft, type ClozeExercise } from "./cloze.ts";

export interface Recommendation { exercise: ClozeExercise; ranked: R06Ranked; why: string[] }

const asR06 = (e: ClozeExercise): R06Task => ({
  id: e.id, skill: "grammar", reviewStatus: isDraft(e) ? "labelled_draft" : "s2_approved",
  redistributionCleared: true, offlineAvailable: true, estimatedMinutes: 3, // project-original, bundled
  ...(e.grammar_tag ? { topic: e.grammar_tag } : {}),
});

/** Tasks already practised today are not re-served at once (spacing, not massed repetition),
 *  unless nothing else is left. */
export function recommend(state: LearnerState, now: Date = new Date()): Recommendation[] {
  const today = localDate(now);
  const practisedToday = new Set(state.attempts.filter(a => localDate(new Date(a.completedAt)) === today).map(a => a.taskId));
  const pool = exercises.filter(e => !practisedToday.has(e.id));
  const ranked = rankR06Tasks({ tasks: (pool.length ? pool : exercises).map(asR06), state: state as never, today,
    availableMinutes: 30, skills: ["grammar"], allowLabelledDrafts: true });
  return ranked.map(r => ({ exercise: exercises.find(e => e.id === r.taskId)!, ranked: r, why: explainR06(r, state.cards, today) }));
}
