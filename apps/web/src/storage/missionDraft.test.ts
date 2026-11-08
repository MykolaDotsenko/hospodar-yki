import { describe, expect, it } from "vitest";
import { missionReducer, startMission } from "@hospodar/domain";
import { exercises } from "../content/cloze.ts";
import { clozeFingerprint, validMissionDraft } from "./missionDraft.ts";

const task = exercises[0]!;
const p = (mission = startMission(task.id), input = "") =>
  ({ mission, input, contentFingerprint: clozeFingerprint(task) });

describe("LEARN cloze draft contract", () => {
  it("accepts independent unfinished answer and checkpoints for repair, feedback and novel transfer", () => {
    const start = startMission(task.id);
    const repair = missionReducer(start, task, { type: "SUBMIT_FIRST", answer: "kirjasto" });
    const feedback = missionReducer(repair, task, { type: "SUBMIT_REPAIR", answer: "kirjastoon" });
    const transfer = missionReducer(feedback, task, { type: "CONTINUE" });
    for (const draft of [p(start, "kirjast"), p(repair, "kirjastoon"),
      p(feedback), p(transfer, "Huomenna menen töihin.")])
      expect(validMissionDraft(JSON.parse(JSON.stringify(draft)), task)).toBe(true);
  });
  it("rejects a forged key reveal, inconsistent first answer and a completed mission", () => {
    const repair = missionReducer(startMission(task.id), task, { type: "SUBMIT_FIRST", answer: "kirjasto" });
    expect(validMissionDraft(p({ ...repair, phase: "feedback" }), task)).toBe(false);
    expect(validMissionDraft(p({ ...repair, firstCorrect: true }), task)).toBe(false);
    expect(validMissionDraft(p({ ...repair, firstAnswer: "kirjastoon" }), task)).toBe(false);
    expect(validMissionDraft(p({ ...repair, phase: "done" }), task)).toBe(false);
    expect(validMissionDraft(p(repair, "x".repeat(1601)), task)).toBe(false);
    expect(validMissionDraft({ ...p(repair), officialGrade: 4 }, task)).toBe(false);
  });
  it("rejects stale content fingerprint and a different exercise", () => {
    const draft = p(startMission(task.id));
    expect(validMissionDraft({ ...draft, contentFingerprint: "bad" }, task)).toBe(false);
    expect(validMissionDraft(draft, exercises[1]!)).toBe(false);
    expect(clozeFingerprint(task)).not.toEqual(clozeFingerprint(exercises[1]!));
  });
});
