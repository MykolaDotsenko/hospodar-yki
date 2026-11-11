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
    item.roleplay_transfer_fi, item.audio_status, item.quality_status, item.negotiation ?? null]);
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
  if (Object.keys(s).sort().join("|") !== "answers|itemId|judged|phase|qIndex|repair|repairJudged|replies|roleplay|transfer|turn" ||
      s.itemId !== item.id || !["turns", "questions", "roleplay", "transfer"].includes(s.phase) ||
      typeof s.repair !== "string" || s.repair.length > DIALOGUE_MAX_CHARS ||
      typeof s.roleplay !== "string" || s.roleplay.length > DIALOGUE_MAX_CHARS ||
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
    // Negotiation: the second wording and its self-confirmation are replayed exactly where they happened.
    const repairAt = item.negotiation?.repairTurn ?? -1;
    const replayRepair = (complete: boolean) => {
      if (s.repair) replay = dialogueReducer(replay, item, { type: "REPHRASE", text: s.repair });
      if (s.repairJudged !== null) replay = dialogueReducer(replay, item, { type: "JUDGE_REPAIR", judgement: s.repairJudged });
      return !complete || (s.repair !== "" && s.repairJudged !== null);
    };
    for (let i = 0; i < played; i++) {
      if (item.turns[i]!.speaker === "A") {
        if (!Object.prototype.hasOwnProperty.call(s.replies, i)) return false;
        const reply = s.replies[i];
        if (typeof reply !== "string" || reply.length > DIALOGUE_MAX_CHARS) return false;
        replay = dialogueReducer(replay, item, reply === "" ? { type: "SKIP_REPLY" } : { type: "REPLY", text: reply });
        if (i === repairAt && reply !== "" && !replayRepair(true)) return false;
      }
      replay = dialogueReducer(replay, item, { type: "NEXT_TURN" });
    }
    if (s.phase === "turns" && item.turns[s.turn]!.speaker === "A" &&
        Object.prototype.hasOwnProperty.call(s.replies, s.turn)) {
      const reply = s.replies[s.turn];
      if (typeof reply !== "string" || reply.length > DIALOGUE_MAX_CHARS) return false;
      replay = dialogueReducer(replay, item, reply === "" ? { type: "SKIP_REPLY" } : { type: "REPLY", text: reply });
      if (s.turn === repairAt && reply !== "") replayRepair(false);
    }
    const questionsPlayed = s.phase === "turns" ? 0 : s.qIndex;
    for (let i = 0; i < questionsPlayed; i++) {
      const q = item.questions[i]!;
      const answer = s.answers[q.id];
      const judgement = s.judged[q.id];
      if (typeof answer !== "string" || answer.length > DIALOGUE_MAX_CHARS ||
          (judgement !== "same" && judgement !== "partly" && judgement !== "different")) return false;
      replay = dialogueReducer(replay, item, { type: "ANSWER", questionId: q.id, text: answer });
      replay = dialogueReducer(replay, item, { type: "JUDGE", questionId: q.id, judgement });
    }
    if (s.phase === "questions" && item.questions[s.qIndex] &&
        Object.prototype.hasOwnProperty.call(s.answers, item.questions[s.qIndex]!.id)) {
      const q = item.questions[s.qIndex]!;
      const answer = s.answers[q.id];
      if (typeof answer !== "string" || answer.length > DIALOGUE_MAX_CHARS) return false;
      replay = dialogueReducer(replay, item, { type: "ANSWER", questionId: q.id, text: answer });
    }
    if (s.phase === "transfer" && item.negotiation) replay = dialogueReducer(replay, item, { type: "SUBMIT_ROLEPLAY", text: s.roleplay });
    const awaitingRephrase = s.phase === "turns" && s.turn === repairAt && Boolean(s.replies[s.turn]) && s.repair === "";
    if (p.input && (s.phase === "turns"
      ? item.turns[s.turn]!.speaker !== "A" || (Object.prototype.hasOwnProperty.call(s.replies, s.turn) && !awaitingRephrase)
      : s.phase === "questions"
        ? Object.prototype.hasOwnProperty.call(s.answers, item.questions[s.qIndex]!.id)
        : s.phase !== "transfer" && s.phase !== "roleplay")) return false;
    return JSON.stringify(replay) === JSON.stringify(s);
  } catch { return false; }
}
