import { describe, expect, it } from "vitest";
import { blankState, buildPlaceIndex, coverageMap, SKILL_CAN_DO_UK, type LearnerState } from "../src/index.ts";

const withDiag = (...d: LearnerState["diagnostics"]): LearnerState => ({ ...blankState(), diagnostics: d });
const index = buildPlaceIndex([
  { itemId: "r-housing", place: "housing", skill: "reading" },
  { itemId: "l-1", place: "housing", skill: "listening" },
  { itemId: "w-housing", place: "housing", skill: "writing" },
  { itemId: "chunk-housing-01", place: "housing" },                         // vocabulary card: no YKI skill
  { itemId: "d-work", place: "work", skill: "speaking" },
]);

describe("YKI preparation map: 9 themes × 4 skills (yki-constructive-alignment)", () => {
  it("has 36 cells; a cell without items is an honest CONTENT gap, never a learner weakness", () => {
    const m = coverageMap(blankState(), index);
    expect(m.cells).toHaveLength(36);
    expect(m.availableCells).toBe(4);
    expect(m.contentGaps).toHaveLength(32);
    expect(m.untried.map(c => `${c.place}:${c.skill}`)).toEqual(["housing:reading", "housing:listening", "housing:writing", "work:speaking"]);
  });
  it("counts only FIRST attempts: a later correct retry adds no key; ungraded production is practice, not success", () => {
    const m = coverageMap(withDiag(
      { skill: "reading", taskId: "r-housing-q1", status: "scored", correct: false },
      { skill: "reading", taskId: "r-housing-q1", status: "scored", correct: true },
      { skill: "reading", taskId: "r-housing-q2", status: "scored", correct: true },
      { skill: "writing", taskId: "w-housing-final", status: "ungraded", response: "Hana vuotaa." },
      { skill: "listening", taskId: "l-1-q1", status: "scored", correct: true },
      { skill: "speaking", taskId: "chunk-housing-01-transfer", status: "ungraded", response: "x" },
    ), index);
    const cell = (p: string, s: string) => m.cells.find(c => c.place === p && c.skill === s)!;
    expect(cell("housing", "reading")).toMatchObject({ itemsTotal: 1, itemsTried: 1, keys: 1, practice: 0 });
    expect(cell("housing", "writing")).toMatchObject({ itemsTried: 1, keys: 0, practice: 1 });
    expect(cell("housing", "listening")).toMatchObject({ itemsTried: 1, keys: 1 });
    expect(cell("housing", "speaking").itemsTotal).toBe(0);                  // the chunk card counts for no skill
    expect(m.triedCells).toBe(3);
    expect(m.untried.map(c => `${c.place}:${c.skill}`)).toEqual(["work:speaking"]);
  });
  it("names what each skill asks the learner to do, for all four skills", () => {
    expect(Object.keys(SKILL_CAN_DO_UK)).toEqual(["reading", "listening", "writing", "speaking"]);
    for (const t of Object.values(SKILL_CAN_DO_UK)) expect(t).not.toMatch(/рівень|B1|%|офіційн/);
  });
  it("one item cannot belong to two skills", () => {
    expect(() => buildPlaceIndex([{ itemId: "x", place: "work", skill: "reading" }, { itemId: "x", place: "work", skill: "writing" }])).toThrow();
  });
});
