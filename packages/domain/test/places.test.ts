import { describe, expect, it } from "vitest";
import { addDiagnostic, HISTORY_LIMIT, readState, blankState, buildPlaceIndex, placeOfTask, placeOfTheme, placeProgress, PLACE_IDS, type LearnerState } from "../src/index.ts";

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
  it("archived attempts keep doors open without inventing old keys or awarding keys for a replay", () => {
    const archived = { ...blankState(), archivedDiagnosticIds: ["ctx-reading-02-housing-q1", "ctx-reading-02-housing-q2", "ctx-dialog-10-roleplay", "unknown-id"] };
    expect(of(archived, "housing")).toMatchObject({ doorOpen: true, itemsTried: 1, keys: 0, practice: 0 });
    expect(of(archived, "health")).toMatchObject({ doorOpen: true, itemsTried: 1, keys: 0, practice: 0 });
    expect(of(archived, "work")).toMatchObject({ doorOpen: false, itemsTried: 0 });
    const replay = { ...archived, diagnostics: [scored("ctx-reading-02-housing-q1", true), own("ctx-dialog-10-roleplay"),
      scored("ctx-reading-02-housing-q3", true), own("ctx-dialog-02-roleplay")] };
    expect(of(replay, "housing")).toMatchObject({ doorOpen: true, itemsTried: 2, keys: 1, practice: 1 });
    expect(of(replay, "health")).toMatchObject({ doorOpen: true, itemsTried: 1, keys: 0, practice: 0 });
  });
  it("known first outcomes preserve earned keys and ungraded practice after eviction and replay", () => {
    const at = new Date("2026-11-01T10:00:00Z");
    let s = blankState();
    const q1 = "ctx-reading-02-housing-q1", q2 = "ctx-reading-02-housing-q2", q3 = "ctx-reading-02-housing-q3";
    s = addDiagnostic(s, { skill: "reading", taskId: q1, status: "scored", correct: true }, at);
    s = addDiagnostic(s, { skill: "reading", taskId: q2, status: "scored", correct: false }, at);
    s = addDiagnostic(s, { skill: "speaking", taskId: "ctx-dialog-02-roleplay", status: "ungraded", response: "Private text" }, at);
    s = addDiagnostic(s, { skill: "listening", taskId: q3, status: "ungraded", response: "supported:transcript" }, at);
    const initial = s;
    const before = of(s, "housing");
    expect(before).toMatchObject({ keys: 1, practice: 2, doorOpen: true });
    s = addDiagnostic(s, { skill: "reading", taskId: q1, status: "scored", correct: false }, at);
    s = addDiagnostic(s, { skill: "reading", taskId: q2, status: "scored", correct: true }, at);
    s = addDiagnostic(s, { skill: "listening", taskId: q3, status: "scored", correct: true }, at);
    for (let i = 0; i < HISTORY_LIMIT + 1; i++)
      s = addDiagnostic(s, { skill: "writing", taskId: `filler-${i}`, status: "ungraded", response: "Oma vastaus" }, at);
    expect(initial.archivedFirstDiagnostics).toBeUndefined();
    expect(s.diagnostics).toHaveLength(HISTORY_LIMIT);
    expect(s.archivedFirstDiagnostics?.filter(e => e.taskId.startsWith("ctx-"))).toEqual([
      { taskId: q1, skill: "reading", outcome: "correct" },
      { taskId: q2, skill: "reading", outcome: "incorrect" },
      { taskId: "ctx-dialog-02-roleplay", skill: "speaking", outcome: "ungraded" },
      { taskId: q3, skill: "listening", outcome: "ungraded" },
    ]);
    expect(JSON.stringify(s.archivedFirstDiagnostics)).not.toContain("Private text");
    expect(of(readState(JSON.stringify(s)).state, "housing")).toEqual(before);
  });
  it("legacy archive IDs never gain a fabricated first outcome from a later replay", () => {
    const at = new Date("2026-11-01T10:00:00Z"), id = "ctx-reading-02-housing-q1";
    let s: LearnerState = { ...blankState(), archivedDiagnosticIds: [id] };
    s = addDiagnostic(s, { skill: "reading", taskId: id, status: "scored", correct: true }, at);
    for (let i = 0; i < HISTORY_LIMIT; i++)
      s = addDiagnostic(s, { skill: "writing", taskId: `filler-${i}`, status: "ungraded" }, at);
    expect(s.archivedFirstDiagnostics?.some(e => e.taskId === id) ?? false).toBe(false);
    expect(of(s, "housing")).toMatchObject({ keys: 0, practice: 0, doorOpen: true, itemsTried: 1 });
  });
  it("an item cannot belong to two places", () => {
    expect(() => buildPlaceIndex([{ itemId: "x", place: "work" }, { itemId: "x", place: "health" }])).toThrow(/two places/);
  });
});
