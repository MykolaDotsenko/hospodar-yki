/**
 * Speaking "as in the exam" (TZ-EXAM-11, MOCK-VID-07, E06-G08): task → preparation window → signal → recording that
 * starts by itself → response window that ends the recording. Pure, deterministic.
 *
 * Durations come from the pinned exam profile ONLY when its records `speaking.prep_seconds` and
 * `speaking.response_seconds` are verified (source, date, reviewer, scope). Otherwise the practice windows below are
 * used and are always labelled as practice — the OPH 2027 values are not verified and are never invented.
 * The microphone still starts only because of the learner's own action (starting the timed task).
 */
import { isVerifiedRecord, type ExamProfile } from "./examProfile.ts";

/** Practice values, labelled as such on screen; not OPH figures. */
export const PRACTICE_SPEAKING_WINDOWS = Object.freeze({ prepSeconds: 30, responseSeconds: 60 });

export interface SpeakingWindows { prepSeconds: number; responseSeconds: number; source: "practice" | "profile" }
export type SpeakingPhase = "prep" | "respond" | "over";

export function speakingWindows(profile: ExamProfile | null | undefined): SpeakingWindows {
  const value = (id: string) => {
    const r = profile?.records.find(x => x.parameter === id);
    return r && profile && isVerifiedRecord(profile, r) && typeof r.value === "number" && r.value > 0 ? r.value : null;
  };
  const prep = value("speaking.prep_seconds"), response = value("speaking.response_seconds");
  return prep !== null && response !== null
    ? { prepSeconds: prep, responseSeconds: response, source: "profile" }
    : { ...PRACTICE_SPEAKING_WINDOWS, source: "practice" };
}

/** Phase and whole seconds left at `nowMs` for a timed task started at `startedMs`. */
export function speakingPhase(w: Pick<SpeakingWindows, "prepSeconds" | "responseSeconds">, startedMs: number, nowMs: number): { phase: SpeakingPhase; secondsLeft: number } {
  const elapsed = Math.max(0, nowMs - startedMs) / 1000;
  if (elapsed < w.prepSeconds) return { phase: "prep", secondsLeft: Math.ceil(w.prepSeconds - elapsed) };
  if (elapsed < w.prepSeconds + w.responseSeconds) return { phase: "respond", secondsLeft: Math.ceil(w.prepSeconds + w.responseSeconds - elapsed) };
  return { phase: "over", secondsLeft: 0 };
}
