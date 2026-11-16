import { describe, expect, it } from "vitest";
import { addDiagnostic, blankState, goalPlaces, goalRecord, LEARNER_GOAL_IDS, parseGoalRecord, planSession, shouldWelcome,
  type SessionCandidates, type SessionTask } from "../src/index.ts";

const NOW = new Date("2026-11-16T09:00:00+02:00");
const task = (id: string, skill: SessionTask["skill"], place: SessionTask["place"]): SessionTask => ({ id, skill, minutes: 8, place, prefix: id, published: false });

describe("learner goals and the first run (MOT-02, MOT-11; docs/29 stage 3)", () => {
  it("a goal is one of the nine life places or YKI; stored in a fixed order, unknown values dropped, never a level", () => {
    expect(LEARNER_GOAL_IDS).toHaveLength(10);
    expect(goalRecord(["work", "yki", "housing", "work", "B1", 7], "2026-11-16")).toEqual({ version: 1, goals: ["housing", "work", "yki"], seen: "2026-11-16" });
    expect(goalPlaces(goalRecord(["yki", "health"], "2026-11-16"))).toEqual(["health"]);
    expect(goalPlaces(null)).toEqual([]);
    expect(() => goalRecord([], "16.11.2026")).toThrow();
    expect(JSON.stringify(goalRecord(LEARNER_GOAL_IDS, "2026-11-16"))).not.toMatch(/level|cefr|age|country|score/i);
  });
  it("a damaged record reads as no record (the first run shows again); a valid one survives a round trip", () => {
    const ok = goalRecord(["services"], "2026-11-16");
    expect(parseGoalRecord(JSON.parse(JSON.stringify(ok)))).toEqual(ok);
    for (const bad of [null, "x", { version: 2, goals: [], seen: "2026-11-16" }, { version: 1, goals: "work", seen: "2026-11-16" }, { version: 1, goals: [], seen: "yesterday" }])
      expect(parseGoalRecord(bad)).toBeNull();
    expect(parseGoalRecord({ version: 1, goals: ["work", "mars"], seen: "2026-11-16" })).toEqual({ version: 1, goals: ["work"], seen: "2026-11-16" });
  });
  it("the first run is only for a learner with nothing saved and no record; never again once closed or once anything is saved", () => {
    expect(shouldWelcome(blankState(), null)).toBe(true);
    expect(shouldWelcome(blankState(), goalRecord([], "2026-11-16"))).toBe(false);          // closed without choosing: still closed
    expect(shouldWelcome(addDiagnostic(blankState(), { skill: "reading", taskId: "r1", status: "scored", correct: true }), null)).toBe(false);
    expect(shouldWelcome(null, null)).toBe(false);                                             // progress not loaded yet: show nothing
  });
  it("goals prefer their places among equals in the session plan, with a visible reason; skill balance still comes first", () => {
    const c: SessionCandidates = { review: { delayed: [], phrases: [], grammar: [] }, weakSpot: null,
      tasks: [task("read-identity", "reading", "identity"), task("read-work", "reading", "work"), task("listen-travel", "listening", "travel")] };
    const plain = planSession(blankState(), c, { minutes: 10 }, { now: NOW, allowDrafts: true }).blocks[0]!;
    const withGoal = planSession(blankState(), c, { minutes: 10, goals: ["work"] }, { now: NOW, allowDrafts: true }).blocks[0]!;
    expect(plain.items[0]!.id).toBe("read-identity");
    expect(withGoal).toMatchObject({ place: "work", reasons: ["NEW_TASK", "NEVER_PRACTISED_SKILL", "GOAL_PLACE"] });
    // One saved reading answer outweighs the goal: listening (never practised) comes first, reading in the goal place later.
    const read = addDiagnostic(blankState(), { skill: "reading", taskId: "x-1", status: "scored", correct: true }, NOW);
    expect(planSession(read, c, { minutes: 10, goals: ["work"] }, { now: NOW, allowDrafts: true }).blocks[0]!.skill).toBe("listening");
    // An explicitly chosen place is a filter and wins over the goals; the reason then says "chosen", not "goal".
    expect(planSession(blankState(), c, { minutes: 10, goals: ["work"], place: "identity" }, { now: NOW, allowDrafts: true }).blocks[0]!)
      .toMatchObject({ place: "identity", reasons: ["NEW_TASK", "NEVER_PRACTISED_SKILL", "CHOSEN_PLACE"] });
  });
});
