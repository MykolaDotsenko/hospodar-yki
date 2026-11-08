/**
 * Lossless LEARN cloze checkpoints. A draft is NOT evidence of mastery or a
 * completed first attempt. Reconstruct the mission from its frozen answers:
 * an inconsistent or content-stale draft must never reveal a Finnish answer key.
 */
import { missionReducer, startMission, type MissionState } from "@hospodar/domain";
import type { ClozeExercise } from "../content/cloze.ts";

export interface MissionDraftPayload {
  mission: MissionState;
  input: string;
  contentFingerprint: string;
}
const MAX_INPUT = 1600;
export function clozeFingerprint(task: ClozeExercise): string {
  // Content-revision guard, not a cryptographic authenticator.
  const text = JSON.stringify([task.id, task.prompt_fi, task.answer_fi,
    task.accepted_alternatives_fi ?? [], task.transfer_task_fi ?? "", task.grammar_tag ?? ""]);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function validMissionDraft(data: unknown, task: ClozeExercise): data is MissionDraftPayload {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  const d = data as Record<string, unknown>;
  if (Object.keys(d).sort().join("|") !== "contentFingerprint|input|mission" ||
      typeof d.contentFingerprint !== "string" || d.contentFingerprint !== clozeFingerprint(task) ||
      typeof d.input !== "string" || d.input.length > MAX_INPUT ||
      !d.mission || typeof d.mission !== "object" || Array.isArray(d.mission)) return false;
  const state = d.mission as MissionState;
  if (Object.keys(state).sort().join("|") !==
      "firstAnswer|firstCorrect|phase|repairCorrect|secondAnswer|taskId|transferText" ||
      state.taskId !== task.id || !["answer", "repair", "feedback", "transfer"].includes(state.phase) ||
      typeof state.firstAnswer !== "string" || typeof state.secondAnswer !== "string" ||
      typeof state.transferText !== "string" || state.transferText !== "" ||
      state.firstAnswer.length > MAX_INPUT || state.secondAnswer.length > MAX_INPUT ||
      (state.firstCorrect !== null && typeof state.firstCorrect !== "boolean") ||
      (state.repairCorrect !== null && typeof state.repairCorrect !== "boolean")) return false;
  try {
    let expected = startMission(task.id);
    if (state.phase !== "answer") expected = missionReducer(expected, task, { type: "SUBMIT_FIRST", answer: state.firstAnswer });
    if (expected.phase === "repair" && state.phase !== "repair")
      expected = missionReducer(expected, task, { type: "SUBMIT_REPAIR", answer: state.secondAnswer });
    if (expected.phase === "feedback" && state.phase === "transfer")
      expected = missionReducer(expected, task, { type: "CONTINUE" });
    return JSON.stringify(state) === JSON.stringify(expected) &&
      (state.phase !== "feedback" || d.input === "");
  } catch { return false; }
}
