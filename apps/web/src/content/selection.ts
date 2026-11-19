/** R06-ranked cloze selection with human-readable reasons (research/pedagogy/33). */
import { explainR06, interleaveByGroup, localDate, rankR06Tasks, type LearnerState, type R06Ranked, type R06Task } from "@hospodar/domain";
import { exercises, isDraft, type ClozeExercise } from "./cloze.ts";
import { IN_RELEASE } from "./release.ts";

export interface Recommendation { exercise: ClozeExercise; ranked: R06Ranked; why: string[] }

const asR06 = (e: ClozeExercise): R06Task => ({
  id: e.id, skill: "grammar", reviewStatus: isDraft(e) ? "labelled_draft" : "s2_approved",
  redistributionCleared: true, offlineAvailable: true, estimatedMinutes: 3, // project-original, bundled
  ...(e.grammar_tag ? { topic: e.grammar_tag } : {}),
});

export const INTERLEAVED_WHY = "Інша граматична форма, ніж у щойно завершеній місії: форми чергуються, щоб щоразу вирішувати, яка потрібна.";

/** The grammar form of the mission finished last today, or null (a new day starts without a block to break). */
export function lastFormToday(state: LearnerState, today: string): string | null {
  const last = state.attempts.filter(a => localDate(new Date(a.completedAt)) === today)
    .reduce<(typeof state.attempts)[number] | null>((m, a) => (!m || a.completedAt >= m.completedAt ? a : m), null);
  return last ? exercises.find(e => e.id === last.taskId)?.grammar_tag ?? last.grammarTag ?? null : null;
}

/** Tasks already practised today are not re-served at once (spacing, not massed repetition),
 *  unless nothing else is left. Method interleaving-grammar: the R06 order is kept, except that the next task is never
 *  a second block of the same grammar form (the one just finished, or the one before it in the list) while another
 *  form is left; a task without a form tag never blocks. */
export function recommend(state: LearnerState, now: Date = new Date()): Recommendation[] {
  const today = localDate(now);
  const practisedToday = new Set(state.attempts.filter(a => localDate(new Date(a.completedAt)) === today).map(a => a.taskId));
  const pool = exercises.filter(e => !practisedToday.has(e.id));
  const ranked = rankR06Tasks({ tasks: (pool.length ? pool : exercises).map(asR06), state: state as never, today,
    availableMinutes: 30, skills: ["grammar"], allowLabelledDrafts: !IN_RELEASE });
  const items = ranked.map(r => {
    const exercise = exercises.find(e => e.id === r.taskId)!;
    return { exercise, ranked: r, why: explainR06(r, state.cards, today), group: exercise.grammar_tag ?? `untagged:${exercise.id}` };
  });
  const last = lastFormToday(state, today);
  const ordered = interleaveByGroup(items, last ?? undefined);
  return ordered.map(({ group: _g, ...o }, i) =>
    i === 0 && last && o.exercise.id !== items[0]?.exercise.id && items[0]?.group === last ? { ...o, why: [INTERLEAVED_WHY, ...o.why] } : o);
}
