/**
 * LEARN Listening checkpoint: phase, independent choices, the exact support flags
 * and unfinished input. Audio files/voice aren't stored here. A paused draft is
 * neither a CEFR grade nor finished evidence.
 */
import { listeningReducer, startListening, type ListeningLesson, type ListeningSession } from "@hospodar/domain";

export interface ListeningDraftPayload { session: ListeningSession; input: string; contentFingerprint: string }

export function listeningFingerprint(lesson: ListeningLesson): string {
  // Detect editorial changes, not a signature/authenticity proof.
  const contents = JSON.stringify([lesson.id, lesson.title_fi, lesson.path, lesson.transcript_path ?? "",
    lesson.subtitles_path ?? "", lesson.duration_seconds, lesson.narrators_type, lesson.teacher_review ?? "",
    lesson.questions]);
  let hash = 2166136261;
  for (let i = 0; i < contents.length; i++) hash = Math.imul(hash ^ contents.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export const listeningPayload = (session: ListeningSession, input: string, lesson: ListeningLesson): ListeningDraftPayload =>
  ({ session, input, contentFingerprint: listeningFingerprint(lesson) });

/** Safely reconstruct the exact recorded phase before showing keys or classifying supported work. */
export function validListeningDraft(value: unknown, lesson: ListeningLesson): value is ListeningDraftPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const p = value as Record<string, unknown>;
  if (Object.keys(p).sort().join("|") !== "contentFingerprint|input|session" ||
      p.contentFingerprint !== listeningFingerprint(lesson) ||
      typeof p.input !== "string" || p.input.length > 400 ||
      !p.session || typeof p.session !== "object" || Array.isArray(p.session)) return false;
  const s = p.session as ListeningSession;
  if (Object.keys(s).sort().join("|") !== "answers|audioStarts|index|lessonId|phase|prediction|support" ||
      s.lessonId !== lesson.id || !["predict", "listen", "questions", "feedback", "review"].includes(s.phase) ||
      !Number.isInteger(s.audioStarts) || s.audioStarts < 0 || s.audioStarts > 1000 ||
      !Number.isInteger(s.index) || s.index < 0 || s.index > lesson.questions.length ||
      typeof s.prediction !== "string" || s.prediction.length > 400 ||
      !Array.isArray(s.support) || s.support.length > 2 || new Set(s.support).size !== s.support.length ||
      !s.support.every(k => k === "slow" || k === "transcript") ||
      !s.answers || typeof s.answers !== "object" || Array.isArray(s.answers)) return false;
  if (s.phase !== "predict" && s.phase !== "questions" && p.input !== "") return false;
  if (s.phase === "questions" && p.input !== "") {
    const q = lesson.questions[s.index];
    if (!q || !/^(0|[1-9]\d*)$/.test(p.input) || Number(p.input) >= q.options_fi.length) return false;
  }
  try {
    let expected = startListening(lesson);
    if (s.phase !== "predict") {
      expected = listeningReducer(expected, lesson, s.prediction
        ? { type: "SUBMIT_PREDICTION", text: s.prediction } : { type: "SKIP_PREDICTION" });
      for (const support of s.support)
        expected = listeningReducer(expected, lesson, { type: "REQUEST_SUPPORT", kind: support });
      for (let i = 0; i < s.audioStarts; i++)
        expected = listeningReducer(expected, lesson, { type: "AUDIO_STARTED" });
      if (s.phase !== "listen") {
        expected = listeningReducer(expected, lesson, { type: "BEGIN_QUESTIONS" });
        for (let i = 0; i < s.index; i++) {
          const q = lesson.questions[i]!;
          const answer = s.answers[q.id];
          if (!Number.isInteger(answer)) return false;
          expected = listeningReducer(expected, lesson, { type: "ANSWER", questionId: q.id, optionIndex: answer });
        }
        if (s.phase === "review") expected = listeningReducer(expected, lesson, { type: "OPEN_REVIEW" });
      }
    }
    return JSON.stringify(expected) === JSON.stringify(s);
  } catch { return false; }
}
