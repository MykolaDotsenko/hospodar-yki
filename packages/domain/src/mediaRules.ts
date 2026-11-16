/**
 * One set of media rules for every screen with audio or video (docs/29 stage 3; R7-05, R7-03, AUD-03, UIO-10).
 *
 *   1. The learner starts the sound. Nothing plays on its own, nothing loads ahead in a task (`preload="none"`).
 *   2. Own answer first. Text (transcript, subtitles) appears only after the answer, or on request as help.
 *   3. Help makes the attempt ungraded. In a LEARN task, text or a slower speed before answering is allowed for
 *      accessibility, but the answers are then saved as supported — never as a failure, never as independent evidence.
 *
 * The EXAM rehearsal has no help at all: no text before the end and no speed change, because neither is an
 * OPH-verified 2027 feature. Replay stays unlimited there and is labelled practice (the 2027 rule is unverified).
 * The learner's own recordings and the media library are not task stimuli: only rule 1 applies.
 *
 * Pure and framework-free: a web player (apps/web `TaskAudio`) and a future Android player apply the same verdicts.
 */
export type MediaContext =
  | "learn-task"      // a LEARN stimulus before the answer is saved: listening mission, delayed listening check
  | "learn-after"     // the same recording after the answer: review with text, mediation relay, dictogloss compare
  | "exam"            // the EXAM rehearsal's listening recording
  | "own-recording"   // playing back the learner's own voice (diagnostic, exam speaking)
  | "library";        // the media library: watching or listening outside a task

export const NORMAL_RATE = 1;
/** The one slower speed offered as listening support (0.75×, pitch preserved). */
export const SUPPORT_RATE = 0.75;

export interface MediaRules {
  /** Never true: rule 1 holds everywhere. */
  autoplay: false;
  /** May the browser's own playback-speed menu be shown? Only outside tasks and exam. */
  nativeSpeedMenu: boolean;
  /** Text before the answer: as recorded help (LEARN task), never (EXAM), or free (after the answer / outside tasks). */
  textBeforeAnswer: "support" | "never" | "free";
  /** Is a slower speed help that makes the attempt ungraded? */
  slowerIsSupport: boolean;
  /** Is the speed locked at 1× (any change is undone)? */
  rateLocked: boolean;
}

const RULES: Readonly<Record<MediaContext, MediaRules>> = Object.freeze({
  "learn-task":    { autoplay: false, nativeSpeedMenu: false, textBeforeAnswer: "support", slowerIsSupport: true,  rateLocked: false },
  "learn-after":   { autoplay: false, nativeSpeedMenu: false, textBeforeAnswer: "free",    slowerIsSupport: false, rateLocked: false },
  "exam":          { autoplay: false, nativeSpeedMenu: false, textBeforeAnswer: "never",   slowerIsSupport: false, rateLocked: true },
  "own-recording": { autoplay: false, nativeSpeedMenu: true,  textBeforeAnswer: "free",    slowerIsSupport: false, rateLocked: false },
  "library":       { autoplay: false, nativeSpeedMenu: true,  textBeforeAnswer: "free",    slowerIsSupport: false, rateLocked: false },
});

export const MEDIA_CONTEXTS = Object.freeze(Object.keys(RULES) as MediaContext[]);

export function mediaRules(context: MediaContext): MediaRules {
  const r = RULES[context];
  if (!r) throw new TypeError(`Unknown media context: ${String(context)}`);
  return r;
}

/**
 * What to do when a player's speed changed by any route (our button, the browser's controls, a keyboard shortcut or an
 * extension):
 *   "ok"       keep it;
 *   "support"  a slower speed in a LEARN task: record the help durably first, then slow down — until then keep 1×;
 *   "reset"    put it back to 1× (EXAM; or a value that is not a finite positive number).
 * A faster speed is not help, so it is kept in LEARN.
 */
export type RateVerdict = "ok" | "support" | "reset";

export function rateVerdict(context: MediaContext, rate: number, supportRecorded = false): RateVerdict {
  const r = mediaRules(context);
  if (!Number.isFinite(rate) || rate <= 0) return "reset";
  if (r.rateLocked) return rate === NORMAL_RATE ? "ok" : "reset";
  if (r.slowerIsSupport && rate < NORMAL_RATE && !supportRecorded) return "support";
  return "ok";
}
