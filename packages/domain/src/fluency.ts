/**
 * Repeated telling with shrinking time — "4/3/2" (method fluency-432, P1): after an opinion card the learner may tell the
 * same content aloud three times, each round shorter. Research reports fluency gains from repetition under growing time
 * pressure; it is optional, for learners who feel ready, and nothing is recorded or graded.
 *
 *  - practice windows (120 / 90 / 60 s) are a shortened 4/3/2 for B1 monologues — labelled practice, not a rule;
 *  - speech is NOT recorded: only the learner's own report of how the last round felt is saved, ungraded.
 */
export const FLUENCY_ROUNDS_SECONDS = Object.freeze([120, 90, 60]);
export type FluencyFeel = "easier" | "same" | "harder";

/** Seconds left in a running round (whole seconds, never negative). */
export function fluencySecondsLeft(round: number, startedMs: number, nowMs: number): number {
  const total = FLUENCY_ROUNDS_SECONDS[round];
  if (total === undefined) throw new RangeError("No such round");
  return Math.max(0, Math.ceil(total - Math.max(0, nowMs - startedMs) / 1000));
}

export function fluencyEvidence(cardId: string, roundsDone: number, feel: FluencyFeel, skill: "speaking" | "writing" = "speaking") {
  if (!Number.isInteger(roundsDone) || roundsDone < 1 || roundsDone > FLUENCY_ROUNDS_SECONDS.length) throw new RangeError("rounds");
  if (!["easier", "same", "harder"].includes(feel)) throw new Error("NO_FEEL");
  return { skill, taskId: `${cardId}-fluency-432`, status: "ungraded" as const,
    response: `[repeated telling 4/3/2 (practice ${FLUENCY_ROUNDS_SECONDS.slice(0, roundsDone).join("/")} s), aloud, not recorded; ${roundsDone} round(s); last round felt ${feel}]` };
}
