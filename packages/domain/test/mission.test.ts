import { describe, expect, it } from "vitest";
import { MissionError, missionReducer, missionResult, missionView, startMission, completeMission, blankState } from "../src/index.ts";

const task = { id: "b1-cloze-x", answer_fi: "Helsingissä", accepted_alternatives_fi: ["helsingissä"] };

describe("mission phases (MVP-02…05, COLOR-02/03)", () => {
  it("correct first answer → feedback → transfer → done; key shown only in feedback", () => {
    let s = startMission(task.id);
    expect(missionView(s).showKey).toBe(false);
    s = missionReducer(s, task, { type: "SUBMIT_FIRST", answer: "Helsingissä" });
    expect([s.phase, s.firstCorrect, missionView(s).showKey]).toEqual(["feedback", true, true]);
    s = missionReducer(s, task, { type: "CONTINUE" });
    expect(missionView(s).showKey).toBe(false);
    s = missionReducer(s, task, { type: "SUBMIT_TRANSFER", text: "Asun Turussa." });
    expect(s.phase).toBe("done");
    expect(missionResult(s).firstCorrect).toBe(true);
  });
  it("wrong first answer → repair WITHOUT key → feedback; repair never rewrites the first attempt", () => {
    let s = missionReducer(startMission(task.id), task, { type: "SUBMIT_FIRST", answer: "Helsinki" });
    expect(s.phase).toBe("repair");
    expect(missionView(s)).toMatchObject({ showKey: false, showExplanation: false, showRepairHint: true, firstAnswerLocked: true });
    s = missionReducer(s, task, { type: "SUBMIT_REPAIR", answer: "Helsingissä" });
    expect([s.phase, s.firstAnswer, s.firstCorrect, s.repairCorrect]).toEqual(["feedback", "Helsinki", false, true]);
    s = missionReducer(missionReducer(s, task, { type: "CONTINUE" }), task, { type: "SUBMIT_TRANSFER", text: "Oma lause." });
    const state = completeMission(blankState(), missionResult(s), new Date("2026-11-03T10:00:00Z"));
    expect(state.cards[task.id]!.stage).toBe(0); // guided success does not count as independent recall
    expect(state.errors[0]!.resolution).toBe("guided_repair");
  });
  it("refuses empty answers and out-of-order events", () => {
    const s = startMission(task.id);
    expect(() => missionReducer(s, task, { type: "SUBMIT_FIRST", answer: "  " })).toThrow(MissionError);
    expect(() => missionReducer(s, task, { type: "CONTINUE" })).toThrow(/not allowed/);
    expect(() => missionReducer(s, task, { type: "SUBMIT_TRANSFER", text: "x" })).toThrow(/not allowed/);
    const fb = missionReducer(s, task, { type: "SUBMIT_FIRST", answer: "Helsingissä" });
    expect(() => missionReducer(fb, task, { type: "SUBMIT_FIRST", answer: "Helsinki" })).toThrow(/not allowed/);
    expect(() => missionResult(fb)).toThrow(MissionError);
  });
});
