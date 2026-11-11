/**
 * G2 LEARN baseline Diagnostic resume contract. Pure replay enforces reading keys
 * only after all first choices and forbids constructing an unearned skill stage.
 * A draft is NOT an exam result. Audio never belongs in local persistence.
 */
import {
  diagnosticReducer, startDiagnostic, PRODUCTION_MAX_CHARS,
  type DiagnosticBaseline, type DiagnosticSession,
} from "@hospodar/domain";

export interface DiagnosticDraftPayload {
  session: DiagnosticSession;
  input: string;
  pick: number | null;
  contentFingerprint: string;
}

export function diagnosticFingerprint(b: DiagnosticBaseline): string {
  const content = JSON.stringify(b); // editorial guard; not a cryptographic signature
  let h = 2166136261;
  for (let i = 0; i < content.length; i++) h = Math.imul(h ^ content.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0");
}
export function diagnosticPayload(session: DiagnosticSession, input: string, pick: number | null, baseline: DiagnosticBaseline): DiagnosticDraftPayload {
  return { session, input, pick, contentFingerprint: diagnosticFingerprint(baseline) };
}

export function validDiagnosticDraft(value: unknown, b: DiagnosticBaseline): value is DiagnosticDraftPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const d = value as Record<string, unknown>;
  if (Object.keys(d).sort().join("|") !== "contentFingerprint|input|pick|session" ||
      d.contentFingerprint !== diagnosticFingerprint(b) ||
      typeof d.input !== "string" || d.input.length > PRODUCTION_MAX_CHARS ||
      !d.session || typeof d.session !== "object" || Array.isArray(d.session)) return false;
  const s = d.session as DiagnosticSession;
  if (Object.keys(s).sort().join("|") !== "baselineId|readingAnswers|readingIndex|saved|speaking|speakingChecked|step|writing|writingChecked" ||
      s.baselineId !== b.id || !Number.isInteger(s.readingIndex) ||
      s.readingIndex < 0 || s.readingIndex > b.reading.questions.length ||
      !["reading", "reading_feedback", "writing", "writing_check", "speaking", "speaking_check"].includes(s.step) ||
      !s.readingAnswers || typeof s.readingAnswers !== "object" || Array.isArray(s.readingAnswers) ||
      !s.speaking || typeof s.speaking !== "object" || Array.isArray(s.speaking) ||
      Object.keys(s.speaking).sort().join("|") !== "text|voiceRecorded" ||
      // An audio-only speaking attempt is volatile. It must be re-recorded after a reload.
      s.speaking.voiceRecorded !== false || typeof s.speaking.text !== "string" ||
      !Array.isArray(s.saved) || !Array.isArray(s.writingChecked) || !Array.isArray(s.speakingChecked)) return false;

  const reading = s.step === "reading";
  if (reading) {
    const q = b.reading.questions[s.readingIndex];
    if (!q || (d.pick !== null && (!Number.isInteger(d.pick) || (d.pick as number) < 0 ||
      (d.pick as number) >= q.options.length)) || d.input !== "") return false;
  } else if (d.pick !== null || (s.step !== "writing" && s.step !== "speaking" && d.input !== "")) return false;

  try {
    let replay = startDiagnostic(b);
    for (let i = 0; i < s.readingIndex; i++) {
      const q = b.reading.questions[i]!;
      if (!Object.prototype.hasOwnProperty.call(s.readingAnswers, q.id)) return false;
      replay = diagnosticReducer(replay, b, { type: "ANSWER_READING", questionId: q.id,
        optionIndex: s.readingAnswers[q.id]! });
    }
    if (s.step !== "reading" && replay.step !== "reading_feedback") return false;
    if (["writing", "writing_check", "speaking", "speaking_check"].includes(s.step)) {
      replay = diagnosticReducer(replay, b, { type: "MARK_SAVED", skill: "reading" });
      replay = diagnosticReducer(replay, b, { type: "CONTINUE" });
    }
    if (["writing_check", "speaking", "speaking_check"].includes(s.step))
      replay = diagnosticReducer(replay, b, { type: "SUBMIT_WRITING", text: s.writing });
    if (["writing_check", "speaking", "speaking_check"].includes(s.step))
      replay = diagnosticReducer(replay, b, { type: "SELF_CHECK", points: s.writingChecked });
    if (["speaking", "speaking_check"].includes(s.step)) {
      replay = diagnosticReducer(replay, b, { type: "MARK_SAVED", skill: "writing" });
      replay = diagnosticReducer(replay, b, { type: "CONTINUE" });
    }
    if (s.step === "speaking_check") {
      // A saved speaking_check MUST have text; a voice-only recording is not durable.
      if (!s.speaking.text) return false;
      replay = diagnosticReducer(replay, b, { type: "SUBMIT_SPEAKING", text: s.speaking.text, voiceRecorded: false });
      replay = diagnosticReducer(replay, b, { type: "SELF_CHECK", points: s.speakingChecked });
    }
    return JSON.stringify(replay) === JSON.stringify(s);
  } catch { return false; }
}
