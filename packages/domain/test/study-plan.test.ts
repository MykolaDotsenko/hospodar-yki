import { describe, expect, it } from "vitest";
import { parseStudyPlan, studyPlan, studyPlanSentence, STUDY_PLAN_MINUTES } from "../src/index.ts";

describe("voluntary if-then study plan (micro-missions, R08-MOT MOT-E11/E12)", () => {
  it("study plan: the learner's own cue, a skill and 5/10/20 minutes; nothing is guessed, no reminder, no streak field", () => {
    const p = studyPlan("  коли я  сідаю в автобус до роботи. ", "listening", 10, "2026-11-18");
    expect(p).toEqual({ version: 1, cue_uk: "коли я сідаю в автобус до роботи.", skill: "listening", minutes: 10, created: "2026-11-18" });
    expect(studyPlanSentence(p)).toBe("Коли я сідаю в автобус до роботи, я 10 хв слухатиму фінську.");
    expect(Object.keys(p).sort()).toEqual(["created", "cue_uk", "minutes", "skill", "version"]);   // no reminder, streak or count
    expect(STUDY_PLAN_MINUTES).toEqual([5, 10, 20]);                                                // same as the R08 reference
    expect(() => studyPlan(" ", "reading", 5, "2026-11-18")).toThrow("EMPTY_CUE");
    expect(() => studyPlan("x".repeat(151), "reading", 5, "2026-11-18")).toThrow("CUE_TOO_LONG");
    expect(() => studyPlan("після обіду", "grammar" as never, 5, "2026-11-18")).toThrow("BAD_SKILL");
    expect(() => studyPlan("після обіду", "reading", 15, "2026-11-18")).toThrow("BAD_MINUTES");
  });
  it("study plan: the reader returns the saved plan or nothing — a damaged record is never turned into a plan", () => {
    const p = studyPlan("Після вечері у вівторок", "speaking", 5, "2026-11-18");
    expect(parseStudyPlan(JSON.parse(JSON.stringify(p)))).toEqual(p);
    expect(studyPlanSentence(p)).toBe("Коли після вечері у вівторок, я 5 хв говоритиму фінською.");
    for (const bad of [null, "x", { version: 2 }, { ...p, minutes: 7 }, { ...p, cue_uk: "" }, { ...p, created: "18.11.2026" }]) expect(parseStudyPlan(bad)).toBeNull();
  });
});
