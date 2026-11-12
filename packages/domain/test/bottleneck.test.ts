import { describe, expect, it } from "vitest";
import { blankState, familyOfTag, workshopStatus, type GrammarFamily, type LearnerState, type MissionAttempt, type WorkshopItem } from "../src/index.ts";

const families: GrammarFamily[] = [
  { id: "location", tags: ["inessiivi", "elatiivi", "illatiivi", "adessiivi"] },
  { id: "past", tags: ["imperfekti", "perfekti"] },
];
const items: WorkshopItem[] = [
  { id: "l1", tag: "illatiivi" }, { id: "l2", tag: "elatiivi" }, { id: "l3", tag: "elatiivi" }, { id: "l4", tag: "inessiivi" },
  { id: "l5", tag: "adessiivi" }, { id: "l6", tag: "illatiivi" }, { id: "l7", tag: "inessiivi" },
  { id: "p1", tag: "imperfekti" }, { id: "p2", tag: "perfekti" },
];
const attempt = (taskId: string, firstCorrect: boolean, completedAt: string): MissionAttempt => ({
  taskId, grammarTag: "", firstAnswer: "x", firstCorrect, secondAnswer: "", repairCorrect: null, transferText: "y",
  transferScoring: "ungraded", skill: "grammar", completedAt,
});
const withAttempts = (...a: MissionAttempt[]): LearnerState => ({ ...blankState(), attempts: a });
const loc = (s: LearnerState, today = "2026-11-12") => workshopStatus(s, families, items, today).find(f => f.family === "location")!;

describe("Майстерня слабких місць — deliberate practice, interleaving, delayed re-test (error-bottleneck-deliberate, interleaving-grammar)", () => {
  it("a family becomes a bottleneck only after wrong FIRST answers on two different tasks", () => {
    expect(loc(withAttempts(attempt("l1", false, "2026-11-10T10:00:00"))).isBottleneck).toBe(false);
    const s = withAttempts(attempt("l1", false, "2026-11-10T10:00:00"), attempt("l2", false, "2026-11-11T10:00:00"));
    expect(loc(s)).toMatchObject({ isBottleneck: true, wrongFirst: 2, attempted: 2, wrongByTag: { illatiivi: 1, elatiivi: 1 } });
  });
  it("a later correct review of the same task never clears the first wrong answer (MOT-09)", () => {
    const s = withAttempts(attempt("l1", false, "2026-11-01T10:00:00"), attempt("l2", false, "2026-11-01T11:00:00"), attempt("l1", true, "2026-11-04T10:00:00"));
    expect(loc(s)).toMatchObject({ isBottleneck: true, wrongFirst: 2, attempted: 2 });
  });
  it("the set holds only never-seen tasks, interleaved across forms with the most-missed form first", () => {
    const s = withAttempts(attempt("l2", false, "2026-11-10T10:00:00"), attempt("l1", false, "2026-11-10T11:00:00"), attempt("l3", false, "2026-11-11T09:00:00"));
    // missed: elatiivi 2, illatiivi 1 → unseen elatiivi: none left; illatiivi: l6; inessiivi: l4, l7; adessiivi: l5
    expect(loc(s).set).toEqual(["l6", "l4", "l5", "l7"]);
    expect(loc(s).set.some(id => ["l1", "l2", "l3"].includes(id))).toBe(false);
  });
  it("seven calendar days after the last practice the next new task is a delayed check; earlier it is not", () => {
    const s = withAttempts(attempt("l1", false, "2026-11-10T21:00:00"), attempt("l2", false, "2026-11-12T09:00:00"));
    expect(loc(s, "2026-11-18")).toMatchObject({ lastPracticeOn: "2026-11-12", retestOn: "2026-11-19", retestDue: false });
    expect(loc(s, "2026-11-19").retestDue).toBe(true);
  });
  it("a first answer given ≥ 7 days after the previous practice is reported as delayed evidence — not as mastery", () => {
    const s = withAttempts(attempt("l1", false, "2026-11-01T10:00:00"), attempt("l2", false, "2026-11-02T10:00:00"),
      attempt("l4", true, "2026-11-04T10:00:00"), attempt("l5", true, "2026-11-12T10:00:00"));
    expect(loc(s).delayed).toEqual([{ taskId: "l5", gapDays: 8, correct: true }]);
    expect(Object.keys(loc(s))).not.toContain("mastered");
  });
  it("when fewer than three new tasks remain the set is thin — nothing is invented or repeated", () => {
    const s = withAttempts(attempt("p1", false, "2026-11-10T10:00:00"));
    const past = workshopStatus(s, families, items, "2026-11-12").find(f => f.family === "past")!;
    expect(past).toMatchObject({ set: ["p2"], thin: true });
  });
  it("bottlenecks are listed first; a tag can belong to only one family", () => {
    const s = withAttempts(attempt("p1", false, "2026-11-10T10:00:00"), attempt("p2", false, "2026-11-10T11:00:00"));
    expect(workshopStatus(s, families, items, "2026-11-12").map(f => f.family)).toEqual(["past", "location"]);
    expect(() => familyOfTag([{ id: "a", tags: ["x"] }, { id: "b", tags: ["x"] }])).toThrow(/two families/);
  });
});
