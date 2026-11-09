/**
 * LEARN dialogue checkpoint: replay answer-before-model turns and comprehension judgements
 * before displaying scripts or evidence. A draft is private local work, NOT completed progress.
 */
import { dialogueReducer, startDialogue, DIALOGUE_MAX_CHARS,
  type DialogueItem, type DialogueSession } from "@hospodar/domain";

export interface DialogueDraftPayload { session: DialogueSession; input: string; contentFingerprint: string }

export function dialogueFingerprint(item: DialogueItem): string {
  // Editorial-change guard, not an authenticity proof.
  const text = JSON.stringify([item.id, item.title_fi, item.turns, item.questions,
    item.roleplay_transfer_fi, item.audio_status, item.quality_status]);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export const dialoguePayload = (session: DialogueSession, input: string, item: DialogueItem): DialogueDraftPayload =>
  ({ session, input, contentFingerprint: dialogueFingerprint(item) });

export function validDialogueDraft(value: unknown, item: DialogueItem): value is DialogueDraftPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const p = value as Record<string, unknown>;
  if (Object.keys(p).sort().join("|") !== "contentFingerprint|input|session" ||
      p.contentFingerprint !== dialogueFingerprint(item) || typeof p.input !== "string" ||
      p.input.length > DIALOGUE_MAX_CHARS || !p.session || typeof p.session !== "object" ||
      Array.isArray(p.session)) return false;
  const s = p.session as DialogueSession;
  if (Object.keys(s).sort().join("|") !== "answers|itemId|judged|phase|qIndex|replies|transfer|turn" ||
      s.itemId !== item.id || !["turns", "questions", "transfer"].includes(s.phase) ||
      !Number.isInteger(s.turn) || s.turn < 0 || s.turn > item.turns.length ||
      !Number.isInteger(s.qIndex) || s.qIndex < 0 || s.qIndex > item.questions.length ||
      !s.replies || typeof s.replies !== "object" || Array.isArray(s.replies) ||
      !s.answers || typeof s.answers !== "object" || Array.isArray(s.answers) ||
      !s.judged || typeof s.judged !== "object" || Array.isArray(s.judged) ||
      s.transfer !== "" || (s.phase === "turns" && s.turn >= item.turns.length) ||
      (s.phase === "questions" && s.qIndex >= item.questions.length)) return false;
  try {
    let replay = startDialogue(item);
    const played = s.phase === "turns" ? s.turn : item.turns.length;
    for (let i = 0; i < played; i++) {
      if (item.turns[i]!.speaker === "A") {
        if (!Object.prototype.hasOwnProperty.call(s.replies, i)) return false;
        const reply = s.replies[i];
        if (typeof reply !== "string" || reply.length > DIALOGUE_MAX_CHARS) return false;
        replay = dialogueReducer(replay, item, reply === "" ? { type: "SKIP_REPLY" } : { type: "REPLY", text: reply });
      }
      replay = dialogueReducer(replay, item, { type: "NEXT_TURN" });
    }
    if (s.phase === "turns" && item.turns[s.turn]!.speaker === "A" &&
        Object.prototype.hasOwnProperty.call(s.replies, s.turn)) {
      const reply = s.replies[s.turn];
      if (typeof reply !== "string" || reply.length > DIALOGUE_MAX_CHARS) return false;
      replay = dialogueReducer(replay, item, reply === "" ? { type: "SKIP_REPLY" } : { type: "REPLY", text: reply });
    }
    const questionsPlayed = s.phase === "turns" ? 0 : s.qIndex;
    for (let i = 0; i < questionsPlayed; i++) {
      const q = item.questions[i]!;
      if (typeof s.answers[q.id] !== "string" || s.answers[q.id].length > DIALOGUE_MAX_CHARS) return false;
      replay = dialogueReducer(replay, item, { type: "ANSWER", questionId: q.id, text: s.answers[q.id] });
      replay = dialogueReducer(replay, item, { type: "JUDGE", questionId: q.id, judgement: s.judged[q.id] });
    }
    if (s.phase === "questions" && item.questions[s.qIndex] &&
        Object.prototype.hasOwnProperty.call(s.answers, item.questions[s.qIndex]!.id)) {
      const q = item.questions[s.qIndex]!;
      if (typeof s.answers[q.id] !== "string" || s.answers[q.id].length > DIALOGUE_MAX_CHARS) return false;
      replay = dialogueReducer(replay, item, { type: "ANSWER", questionId: q.id, text: s.answers[q.id] });
    }
    if (p.input && (s.phase === "turns"
      ? item.turns[s.turn]!.speaker !== "A" || Object.prototype.hasOwnProperty.call(s.replies, s.turn)
      : s.phase === "questions"
        ? Object.prototype.hasOwnProperty.call(s.answers, item.questions[s.qIndex]!.id)
        : s.phase !== "transfer")) return false;
    return JSON.stringify(replay) === JSON.stringify(s);
  } catch { return false; }
}
