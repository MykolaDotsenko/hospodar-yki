/**
 * LE-11 / AC-57: an optional own confidence mark before the first answer is checked — frozen with the answer, related to
 * it in one calm sentence, used for the review schedule only where a right answer was a guess, and summarised as counts
 * (never a %, level or YKI score). Safe schema change: older data, export/restore and the legacy reader.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { blankState, buildDataExport, calibrationSummary, completeMission, confidenceNote, inspectWebLearnBackup, missionReducer, missionResult,
  readState, serialiseDataExport, startMission, type ClozeTask, type LearnerState } from "../src/index.ts";

const task: ClozeTask & { id: string } = { id: "b1-g-001", answer_fi: "kirjastoon" };
const DAY1 = new Date("2026-11-11T09:00:00+02:00");
const exportOf = (state: LearnerState) => serialiseDataExport(buildDataExport({
  learn: { state, revision: 3, imports: [] }, exam: { current: null, history: [] }, exportedAt: DAY1 }));
function run(answer: string, confidence?: "sure" | "unsure" | "guess" | null) {
  let s = missionReducer(startMission(task.id), task, { type: "SUBMIT_FIRST", answer, confidence });
  if (s.phase === "repair") s = missionReducer(s, task, { type: "SUBMIT_REPAIR", answer: "kirjastoon" });
  s = missionReducer(s, task, { type: "CONTINUE" });
  return missionReducer(s, task, { type: "SUBMIT_TRANSFER", text: "Menen kirjastoon." });
}

describe("own confidence mark on the first answer (LE-11)", () => {
  it("is optional, taken only with the first answer and frozen with it; an unknown value is ignored", () => {
    expect(run("kirjastoon")).not.toHaveProperty("confidence");
    expect(run("kirjastoon", null)).not.toHaveProperty("confidence");
    expect(run("kirjastoon", "maybe" as never)).not.toHaveProperty("confidence");
    expect(run("kirjasto", "sure").confidence).toBe("sure");
    expect(missionResult(run("kirjasto", "sure"))).toMatchObject({ firstCorrect: false, confidence: "sure" });
  });

  it("is stored with the attempt only when given; a record without it has no such field", () => {
    expect(completeMission(blankState(), missionResult(run("kirjastoon")), DAY1).attempts[0]).not.toHaveProperty("confidence");
    expect(completeMission(blankState(), missionResult(run("kirjastoon", "unsure")), DAY1).attempts[0]).toMatchObject({ confidence: "unsure" });
  });

  it("a right answer marked as a guess comes back the next day without counting a failure; a sure right answer advances", () => {
    const guessed = completeMission(blankState(), missionResult(run("kirjastoon", "guess")), DAY1).cards[task.id];
    expect(guessed).toMatchObject({ stage: 0, due: "2026-11-12", failures: 0, lastCorrect: true });
    const sure = completeMission(blankState(), missionResult(run("kirjastoon", "sure")), DAY1).cards[task.id];
    expect(sure).toMatchObject({ stage: 1, due: "2026-11-12", failures: 0 });
    const noMark = completeMission(blankState(), missionResult(run("kirjastoon")), DAY1).cards[task.id];
    expect(noMark).toEqual(sure);                                              // without a mark: the documented rule, unchanged
    const wrong = completeMission(blankState(), missionResult(run("kirjasto", "guess")), DAY1).cards[task.id];
    expect(wrong).toMatchObject({ stage: 0, failures: 1, lastCorrect: false });
  });

  it("relates the mark to the answer in one calm category — never a score", () => {
    expect([confidenceNote("sure", false), confidenceNote("sure", true), confidenceNote("guess", true), confidenceNote("unsure", true),
      confidenceNote("unsure", false), confidenceNote(undefined, true)]).toEqual(["confident_miss", "sure_right", "lucky", "lucky", "unsure_miss", null]);
  });

  it("summary counts first answers per mark only; unmarked attempts are left out; no %, level or score field", () => {
    let st = blankState();
    for (const [a, c] of [["kirjastoon", "sure"], ["kirjasto", "sure"], ["kirjastoon", "guess"], ["kirjasto", undefined]] as const)
      st = completeMission(st, missionResult(run(a, c)), DAY1);
    const sum = calibrationSummary(st);
    expect(sum).toEqual({ sure: { answers: 2, right: 1 }, unsure: { answers: 0, right: 0 }, guess: { answers: 1, right: 1 } });
    expect(JSON.stringify(sum)).not.toMatch(/percent|level|score|cefr|yki/i);
  });
});

describe("safe attempt schema change: old data, export/restore, legacy reader", () => {
  const marked = completeMission(blankState(), missionResult(run("kirjasto", "sure")), DAY1);
  const old = completeMission(blankState(), missionResult(run("kirjasto")), DAY1);

  it("states with and without the mark read back unchanged", () => {
    expect(readState(JSON.stringify(marked)).state).toEqual(marked);
    expect(readState(JSON.stringify(old)).state).toEqual(old);
  });
  it("export → restore keeps the mark; an export from before the change still restores", () => {
    const r = inspectWebLearnBackup(exportOf(marked));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.state.attempts[0]!.confidence).toBe("sure");
    expect(inspectWebLearnBackup(exportOf(old))).toMatchObject({ ok: true });
  });
  it("restore fails closed on an unknown mark or any other extra attempt field", () => {
    for (const tamper of [(a: Record<string, unknown>) => { a.confidence = "very"; }, (a: Record<string, unknown>) => { a.hint = "x"; }]) {
      const doc = JSON.parse(exportOf(marked));
      tamper(doc.learn.state.attempts[0]);
      expect(inspectWebLearnBackup(JSON.stringify(doc))).toMatchObject({ ok: false, reason: "UNSAFE_LEARN_DATA" });
    }
  });
  it("legacy app/core.mjs never writes the mark and keeps an attempt that has one", async () => {
    const legacy = await import(new URL("../../../app/core.mjs", import.meta.url).href) as { readState: (raw: string) => { state: LearnerState } };
    expect(readState(JSON.stringify(old)).state.attempts[0]).not.toHaveProperty("confidence");
    expect(legacy.readState(JSON.stringify(marked)).state.attempts[0]).toMatchObject({ taskId: task.id, firstCorrect: false });
    expect(readFileSync(new URL("../../../app/core.mjs", import.meta.url), "utf8")).not.toMatch(/confidence/);
  });
});
