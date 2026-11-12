import { describe, expect, it } from "vitest";
import { exposure, learnFocus, preferredBlueprint, repeatedSkills, retestPlan, setStatuses, type PrepAttempt } from "../src/index.ts";

const sets = ["yki-mini-a", "yki-mini-b"];
const zero = { correct: 0, objective: 0, ungraded: 0, unanswered: 0 };
const attempt = (sessionId: string, blueprintId: string, skills: PrepAttempt["skills"], finishedAt: string, bySkill: Partial<PrepAttempt["bySkill"]> = {}): PrepAttempt =>
  ({ sessionId, blueprintId, skills, finishedAt, bySkill: { reading: zero, listening: zero, writing: zero, speaking: zero, ...bySkill } });

describe("YKI preparation cycle: unseen sets, labelled repeats, day-14 re-check, LEARN focus (TZ-EXAM-14/19, EXV-03, AC-20)", () => {
  it("exposure is per set AND skill: a speaking-only subtest exposes only speaking of that set", () => {
    const h = [attempt("s1", "yki-mini-a", ["speaking"], "2026-11-01T10:00:00Z")];
    expect([...exposure(h).get("yki-mini-a")!]).toEqual(["speaking"]);
    expect(setStatuses(h, sets, ["reading"])[0]).toMatchObject({ seen: ["speaking"], unseenForChoice: true });
    expect(setStatuses(h, sets, ["speaking"])[0]).toMatchObject({ unseenForChoice: false });
  });
  it("the default set is the first one still unseen for the chosen skills; none left → null (never recycled silently)", () => {
    const afterA = [attempt("s1", "yki-mini-a", null, "2026-11-01T10:00:00Z")];
    expect(preferredBlueprint([], sets, ["reading"])).toBe("yki-mini-a");
    expect(preferredBlueprint(afterA, sets, ["reading", "writing"])).toBe("yki-mini-b");
    const afterAB = [...afterA, attempt("s2", "yki-mini-b", null, "2026-11-16T10:00:00Z")];
    expect(preferredBlueprint(afterAB, sets, ["reading"])).toBeNull();
  });
  it("a repeat on a familiar set is labelled with exactly the skills it repeated (EXV-03)", () => {
    const h = [attempt("s1", "yki-mini-a", ["reading"], "2026-11-01T10:00:00Z"), attempt("s2", "yki-mini-a", null, "2026-11-03T10:00:00Z")];
    expect(repeatedSkills(h).get("s1")).toEqual([]);
    expect(repeatedSkills(h).get("s2")).toEqual(["reading"]);
  });
  it("14 calendar days after the latest rehearsal an unseen set is the delayed re-check; when none is left the plan says so", () => {
    const h = [attempt("s1", "yki-mini-a", null, "2026-11-01T10:00:00Z")];
    expect(retestPlan(h, sets, "2026-11-14")).toMatchObject({ lastOn: "2026-11-01", retestOn: "2026-11-15", due: false, unseenBlueprint: "yki-mini-b" });
    expect(retestPlan(h, sets, "2026-11-15").due).toBe(true);
    const done = [...h, attempt("s2", "yki-mini-b", null, "2026-11-15T10:00:00Z")];
    expect(retestPlan(done, sets, "2026-12-01")).toMatchObject({ due: false, noneLeft: true, unseenBlueprint: null });
    expect(retestPlan([], sets, "2026-11-15")).toMatchObject({ due: false, lastOn: null });
  });
  it("LEARN focus lists only skills with wrong or unanswered keyed tasks or ungraded productions — counts, no grade", () => {
    const f = learnFocus({ reading: { correct: 2, objective: 3, ungraded: 0, unanswered: 1 }, listening: { correct: 4, objective: 4, ungraded: 0, unanswered: 0 },
      writing: { correct: 0, objective: 0, ungraded: 1, unanswered: 0 }, speaking: zero });
    expect(f).toEqual([{ skill: "reading", wrong: 1, unanswered: 1, ungraded: 0 }, { skill: "writing", wrong: 0, unanswered: 0, ungraded: 1 }]);
    expect(Object.keys(f[0]!)).not.toContain("level");
  });
});
