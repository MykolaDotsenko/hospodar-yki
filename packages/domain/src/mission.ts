/**
 * LEARN cloze mission phase machine (docs/11 MVP-02…05, docs/15 COLOR-02/03, LE-01, MULTI-01).
 *
 *   answer ──correct──────────────▶ feedback ─▶ transfer ─▶ done
 *     └──wrong──▶ repair (no key) ─▶ feedback ─▶ transfer ─▶ done
 *
 * - The first independent answer is frozen the moment it is submitted.
 * - The key / explanation become visible ONLY in `feedback` (never in answer, repair or transfer).
 * - Repair is one guided second attempt; it never changes `firstCorrect`.
 * - Transfer is free production, always ungraded.
 */
import { checkCloze, type ClozeTask, type MissionResult } from "./learner.ts";

export type MissionPhase = "answer" | "repair" | "feedback" | "transfer" | "done";
export interface MissionState {
  taskId: string;
  phase: MissionPhase;
  firstAnswer: string;
  firstCorrect: boolean | null;
  secondAnswer: string;
  repairCorrect: boolean | null;
  transferText: string;
}
export type MissionEvent =
  | { type: "SUBMIT_FIRST"; answer: string }
  | { type: "SUBMIT_REPAIR"; answer: string }
  | { type: "CONTINUE" }
  | { type: "SUBMIT_TRANSFER"; text: string };

export class MissionError extends Error {
  constructor(public readonly code: "EMPTY_ANSWER" | "NOT_ALLOWED", message: string) { super(message); this.name = "MissionError"; }
}

export function startMission(taskId: string): MissionState {
  return { taskId, phase: "answer", firstAnswer: "", firstCorrect: null, secondAnswer: "", repairCorrect: null, transferText: "" };
}

export function missionReducer(state: MissionState, task: ClozeTask, event: MissionEvent): MissionState {
  const refuse = () => { throw new MissionError("NOT_ALLOWED", `${event.type} is not allowed in phase ${state.phase}`); };
  switch (event.type) {
    case "SUBMIT_FIRST": {
      if (state.phase !== "answer") return refuse();
      const r = checkCloze(task, event.answer);
      if (!r.valid) throw new MissionError("EMPTY_ANSWER", "Write an answer first");
      return { ...state, firstAnswer: event.answer.trim(), firstCorrect: r.correct, phase: r.correct ? "feedback" : "repair" };
    }
    case "SUBMIT_REPAIR": {
      if (state.phase !== "repair") return refuse();
      const r = checkCloze(task, event.answer);
      if (!r.valid) throw new MissionError("EMPTY_ANSWER", "Write an answer first");
      return { ...state, secondAnswer: event.answer.trim(), repairCorrect: r.correct, phase: "feedback" };
    }
    case "CONTINUE":
      if (state.phase !== "feedback") return refuse();
      return { ...state, phase: "transfer" };
    case "SUBMIT_TRANSFER": {
      if (state.phase !== "transfer") return refuse();
      if (!event.text.trim()) throw new MissionError("EMPTY_ANSWER", "Write your own sentence first");
      return { ...state, transferText: event.text.trim(), phase: "done" };
    }
  }
}

/** What the UI may show in each phase — the single place that decides answer visibility. */
export function missionView(state: MissionState) {
  return {
    showPrompt: state.phase === "answer" || state.phase === "repair",
    showKey: state.phase === "feedback",
    showExplanation: state.phase === "feedback",
    showRepairHint: state.phase === "repair",
    showTransfer: state.phase === "transfer",
    firstAnswerLocked: state.phase !== "answer",
  };
}

/** Convert a finished mission into the persisted record (input to completeMission). */
export function missionResult(state: MissionState, grammarTag?: string): MissionResult {
  if (state.phase !== "done" || state.firstCorrect === null) throw new MissionError("NOT_ALLOWED", "Mission is not finished");
  return {
    taskId: state.taskId, firstAnswer: state.firstAnswer, firstCorrect: state.firstCorrect,
    secondAnswer: state.secondAnswer, repairCorrect: state.repairCorrect, transferText: state.transferText,
    ...(grammarTag !== undefined ? { grammarTag } : {}),
  };
}
