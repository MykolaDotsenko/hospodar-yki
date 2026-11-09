/**
 * Paused LEARN Reading is editable state, not completed learning evidence.
 * Rebuild every answered question and judgement through the pure reducer before
 * allowing saved feedback or highlighted evidence to become visible.
 */
import { readingReducer, startReading, type ReadingItem, type ReadingSession } from "@hospodar/domain";

export interface ReadingDraftPayload { session: ReadingSession; input: string; contentFingerprint: string }

export function readingFingerprint(item: ReadingItem): string {
  // Editorial version guard, NOT a cryptographic authenticity proof.
  const content = JSON.stringify([item.id, item.title_fi, item.text_fi, item.questions,
    item.writing_transfer_fi, item.speaking_transfer_fi, item.quality_status, item.is_official_exam]);
  let hash = 2166136261;
  for (let i = 0; i < content.length; i++) hash = Math.imul(hash ^ content.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export const readingPayload = (session: ReadingSession, input: string, item: ReadingItem): ReadingDraftPayload =>
  ({ session, input, contentFingerprint: readingFingerprint(item) });

/** Never open a forged, stale-content, extra-field or impossible checkpoint. */
export function validReadingDraft(value: unknown, item: ReadingItem): value is ReadingDraftPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const p = value as Record<string, unknown>;
  if (Object.keys(p).sort().join("|") !== "contentFingerprint|input|session" ||
      p.contentFingerprint !== readingFingerprint(item) ||
      typeof p.input !== "string" || p.input.length > 1600 ||
      !p.session || typeof p.session !== "object" || Array.isArray(p.session)) return false;
  const s = p.session as ReadingSession;
  if (Object.keys(s).sort().join("|") !== "answers|index|itemId|judged|phase|transfer|transferKind" ||
      s.itemId !== item.id || !["questions", "feedback", "transfer"].includes(s.phase) ||
      !Number.isInteger(s.index) || s.index < 0 || s.index > item.questions.length ||
      !s.answers || typeof s.answers !== "object" || Array.isArray(s.answers) ||
      !s.judged || typeof s.judged !== "object" || Array.isArray(s.judged) ||
      (s.transferKind !== "writing" && s.transferKind !== "speaking") ||
      s.transfer !== "" || (s.phase === "feedback" && p.input !== "") ||
      (s.phase === "questions" && p.input.length > 600)) return false;
  try {
    let expected = startReading(item);
    for (let i = 0; i < s.index; i++) {
      const q = item.questions[i]!;
      const valueForQuestion = s.answers[q.id];
      if (typeof valueForQuestion !== "string" || valueForQuestion.length > 600) return false;
      expected = readingReducer(expected, item, { type: "ANSWER", questionId: q.id, value: valueForQuestion });
    }
    if (s.phase !== "questions") {
      for (const id of Object.keys(s.judged)) {
        const judgement = s.judged[id];
        if (judgement !== "same" && judgement !== "partly" && judgement !== "different") return false;
        expected = readingReducer(expected, item, { type: "JUDGE", questionId: id, judgement });
      }
      if (s.phase === "transfer")
        expected = readingReducer(expected, item, { type: "TO_TRANSFER", kind: s.transferKind });
    }
    return JSON.stringify(expected) === JSON.stringify(s);
  } catch { return false; }
}
