/**
 * Exposure to model answers in practice videos (MOCK-VID-08; sources/official/YKI-MOCK-VIDEO-SOURCES-2026-10.md: watching
 * the model answers makes a video "seen" — it is no longer a new unhinted check). On «Як виглядає іспит» the learner can
 * mark that they watched a video's model answers; from then on that video is labelled an example, not a fresh check.
 *
 *  - only the learner's own mark: the app cannot see what happens on YouTube, so it never infers exposure;
 *  - only on this device; removable; erased together with the exam rehearsal data; never a score or a count;
 *  - only for videos that have model answers (a start time is known).
 */
export interface VideoExposureLog { version: 1; seen: Record<string, string> }
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[a-z\d_-]{1,80}$/i;

export const emptyVideoExposure = (): VideoExposureLog => ({ version: 1, seen: {} });

export function parseVideoExposure(raw: unknown): VideoExposureLog {
  const r = raw as { version?: unknown; seen?: unknown } | null;
  if (!r || typeof r !== "object" || Array.isArray(r) || r.version !== 1 || !r.seen || typeof r.seen !== "object" || Array.isArray(r.seen)) return emptyVideoExposure();
  const seen: Record<string, string> = {};
  for (const [id, d] of Object.entries(r.seen as Record<string, unknown>)) if (ID.test(id) && typeof d === "string" && DATE.test(d)) seen[id] = d;
  return { version: 1, seen };
}

export function markModelAnswersSeen(log: VideoExposureLog, videoId: string, day: string): VideoExposureLog {
  if (!ID.test(videoId)) throw new Error("BAD_ID");
  if (!DATE.test(day)) throw new Error("BAD_DAY");
  return { version: 1, seen: { ...log.seen, [videoId]: log.seen[videoId] ?? day } };   // the first day stays
}

export function unmarkModelAnswersSeen(log: VideoExposureLog, videoId: string): VideoExposureLog {
  const seen = { ...log.seen };
  delete seen[videoId];
  return { version: 1, seen };
}

export type VideoCheckStatus = "fresh" | "seen";
/** "fresh": the learner may still use the video's task part as an unhinted try; "seen": an example now, not a check. */
export const videoCheckStatus = (log: VideoExposureLog, videoId: string): VideoCheckStatus => (log.seen[videoId] ? "seen" : "fresh");
