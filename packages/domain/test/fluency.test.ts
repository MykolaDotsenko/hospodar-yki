import { describe, expect, it } from "vitest";
import { fluencyEvidence, fluencySecondsLeft, FLUENCY_ROUNDS_SECONDS } from "../src/index.ts";

describe("repeated telling with shrinking time (fluency-432)", () => {
  it("three rounds, each shorter; countdown in whole seconds, never negative", () => {
    expect([...FLUENCY_ROUNDS_SECONDS]).toEqual([120, 90, 60]);
    expect(fluencySecondsLeft(0, 0, 0)).toBe(120);
    expect(fluencySecondsLeft(1, 1000, 1500)).toBe(90);
    expect(fluencySecondsLeft(2, 0, 59_001)).toBe(1);
    expect(fluencySecondsLeft(2, 0, 999_999)).toBe(0);
    expect(() => fluencySecondsLeft(3, 0, 0)).toThrow();
  });
  it("saves only the learner's report — speech is never recorded or graded", () => {
    const ev = fluencyEvidence("opinion-01", 3, "easier");
    expect(ev).toMatchObject({ skill: "speaking", taskId: "opinion-01-fluency-432", status: "ungraded" });
    expect(ev.response).toMatch(/aloud, not recorded; 3 round\(s\); last round felt easier/);
    expect(() => fluencyEvidence("x", 0, "same")).toThrow();
    expect(() => fluencyEvidence("x", 2, "great" as never)).toThrow();
  });
});
