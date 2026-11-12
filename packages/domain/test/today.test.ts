import { describe, expect, it } from "vitest";
import { addDiagnostic, blankState, skillPracticeCounts, todayPlan, type TodayInput } from "../src/index.ts";

const base: TodayInput = { delayedDue: 0, phrasesDue: 0, grammarDue: 0, hasAnyEvidence: true, practice: { reading: 4, listening: 4, writing: 4, speaking: 4 } };

describe("today: one recommended next step with a visible reason (UIO-01, UIO-08, R06)", () => {
  it("a brand-new learner is sent to the short starting diagnostic, with exactly one action", () => {
    expect(todayPlan({ ...base, hasAnyEvidence: false, practice: { reading: 0, listening: 0, writing: 0, speaking: 0 } }))
      .toEqual([{ kind: "diagnostic", reason: "start_here", count: 0, skill: null }]);
  });
  it("order follows the evidence: delayed check, then missed phrases, then scheduled grammar; at most three actions", () => {
    const plan = todayPlan({ ...base, delayedDue: 2, phrasesDue: 3, grammarDue: 1 });
    expect(plan.map(a => [a.kind, a.reason, a.count])).toEqual([["delayed_check", "due_today", 2], ["phrase_review", "missed_last_time", 3], ["grammar_review", "scheduled_today", 1]]);
    expect(todayPlan({ ...base, phrasesDue: 1 })[0]).toMatchObject({ kind: "phrase_review" });
  });
  it("with nothing due: a never-practised skill first (fixed order), otherwise the least practised one — four skills get equal opportunity", () => {
    expect(todayPlan({ ...base, practice: { reading: 5, listening: 0, writing: 0, speaking: 2 } })[0]).toEqual({ kind: "skill_practice", reason: "never_practised", count: 0, skill: "listening" });
    expect(todayPlan({ ...base, practice: { reading: 5, listening: 3, writing: 7, speaking: 3 } })[0]).toEqual({ kind: "skill_practice", reason: "least_practised", count: 3, skill: "listening" });
  });
  it("is deterministic and never produces a level, percentage or readiness claim; bad counts are treated as zero", () => {
    const input = { ...base, delayedDue: -1, phrasesDue: Number.NaN, grammarDue: 1.5 };
    expect(todayPlan(input)).toEqual(todayPlan(structuredClone(input)));
    expect(todayPlan(input)[0]!.kind).toBe("skill_practice");
    expect(JSON.stringify(todayPlan({ ...base, delayedDue: 1 }))).not.toMatch(/level|percent|ready|grade|b1/i);
  });
  it("practice counts ignore delayed checks, so a delayed check never makes a skill look practised", () => {
    let s = addDiagnostic(blankState(), { skill: "reading", taskId: "r-1", status: "scored", correct: true });
    s = addDiagnostic(s, { skill: "reading", taskId: "d7-r-9", status: "scored", correct: false });
    s = addDiagnostic(s, { skill: "speaking", taskId: "d14-x", status: "ungraded", response: "x" });
    expect(skillPracticeCounts(s)).toEqual({ reading: 1, listening: 0, writing: 0, speaking: 0 });
  });
});
