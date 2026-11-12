import { describe, expect, it } from "vitest";
import { blankState, buildPlaceIndex, placeOfTask, placeOfTheme, placeProgress, PLACE_IDS, type LearnerState } from "../src/index.ts";

const index = buildPlaceIndex([
  { itemId: "ctx-reading-02-housing", place: "housing" },
  { itemId: "ctx-dialog-02", place: "housing" },
  { itemId: "ctx-dialog-1", place: "work" },
  { itemId: "ctx-dialog-10", place: "health" },
]);
const withDiag = (...d: LearnerState["diagnostics"]): LearnerState => ({ ...blankState(), diagnostics: d });
const scored = (taskId: string, correct: boolean) => ({ skill: "reading" as const, taskId, status: "scored" as const, correct, response: "", completedAt: "2026-11-01T10:00:00Z" });
const own = (taskId: string) => ({ skill: "speaking" as const, taskId, status: "ungraded" as const, response: "Hei", completedAt: "2026-11-01T10:00:00Z" });
const of = (s: LearnerState, id: string) => placeProgress(s, index).find(p => p.place === id)!;

describe("places: «Господарство» — nine everyday places, honest keys, never locked (R08-MOT, GAM-01)", () => {
  it("nine places = the nine YKI themes; content theme aliases resolve, unknown keys do not", () => {
    expect(PLACE_IDS).toHaveLength(9);
    expect(placeOfTheme("online_shopping")).toBe("services");
    expect(placeOfTheme("transport")).toBe("travel");
    expect(placeOfTheme("courses")).toBe("society");
    expect(placeOfTheme("partitiivi")).toBeNull();
  });
  it("a key is the FIRST scored answer and it was correct (MOT-07); a later correct retry adds nothing (MOT-09)", () => {
    const s = withDiag(scored("ctx-reading-02-housing-q1", false), scored("ctx-reading-02-housing-q1", true), scored("ctx-reading-02-housing-q2", true));
    expect(of(s, "housing")).toMatchObject({ keys: 1, practice: 0, doorOpen: true, itemsTried: 1, itemsTotal: 2 });
  });
  it("ungraded Finnish writing/speaking opens the door and counts as practice, never as a key (MOT-08)", () => {
    const s = withDiag(own("ctx-dialog-02-roleplay"), own("ctx-dialog-02-change"));
    expect(of(s, "housing")).toMatchObject({ keys: 0, practice: 2, doorOpen: true });
  });
  it("an untouched place is open to enter but its door is still closed; nothing is locked or hidden", () => {
    const p = of(blankState(), "health");
    expect(p).toMatchObject({ keys: 0, practice: 0, doorOpen: false, itemsTotal: 1 });
  });
  it("prefix matching is exact: ctx-dialog-10 evidence never counts for ctx-dialog-1", () => {
    expect(placeOfTask(index, "ctx-dialog-10-q1")?.place).toBe("health");
    expect(placeOfTask(index, "ctx-dialog-1-q1")?.place).toBe("work");
    expect(placeOfTask(index, "ctx-dialog-1")?.place).toBe("work");
    expect(placeOfTask(index, "delayed-ctx-dialog-1-q1")).toBeNull();          // delayed checks are their own evidence
  });
  it("no decay, streak or level: the same evidence gives the same result whatever the date (MOT-04/06)", () => {
    const s = withDiag(scored("ctx-reading-02-housing-q1", true));
    const later = withDiag({ ...scored("ctx-reading-02-housing-q1", true), completedAt: "2027-06-01T10:00:00Z" });
    expect(placeProgress(s, index)).toEqual(placeProgress(later, index));
    expect(Object.keys(of(s, "housing")).sort()).toEqual(["doorOpen", "itemsTotal", "itemsTried", "keys", "place", "practice"]);
  });
  it("an item cannot belong to two places", () => {
    expect(() => buildPlaceIndex([{ itemId: "x", place: "work" }, { itemId: "x", place: "health" }])).toThrow(/two places/);
  });
});
