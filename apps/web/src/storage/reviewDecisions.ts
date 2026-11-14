/**
 * The reviewer's unsent decisions, kept in this browser until they download the file (separate from learner progress:
 * own key, never read by LEARN). Every write is read back; a failed write is reported and nothing claims "saved".
 */
import { parseReviewDecisionsFile, REVIEW_DECISIONS_SCHEMA, type ReviewDecision } from "@hospodar/domain";

export const REVIEW_DECISIONS_KEY = "hospodar-yki:review-decisions:v1";
export interface ReviewSession { reviewerId: string; decisions: ReviewDecision[] }

export function readReviewSession(): ReviewSession {
  try {
    const raw = localStorage.getItem(REVIEW_DECISIONS_KEY);
    if (!raw) return { reviewerId: "", decisions: [] };
    const parsed = JSON.parse(raw) as { reviewerId?: unknown };
    return { reviewerId: typeof parsed.reviewerId === "string" ? parsed.reviewerId : "", decisions: parseReviewDecisionsFile(parsed) ?? [] };
  } catch { return { reviewerId: "", decisions: [] }; }
}

/** Throws when the browser refused the write or read back something else. */
export function writeReviewSession(s: ReviewSession): void {
  const text = JSON.stringify({ schema: REVIEW_DECISIONS_SCHEMA, reviewerId: s.reviewerId, decisions: s.decisions });
  localStorage.setItem(REVIEW_DECISIONS_KEY, text);
  if (localStorage.getItem(REVIEW_DECISIONS_KEY) !== text) throw new Error("READBACK_MISMATCH");
}
