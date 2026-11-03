/** G2-b: the TS import check must give the same verdict as R11 preflight + learn-backup inspection. */
import { describe, expect, it } from "vitest";
// @ts-expect-error legacy JS reference module
import { inspectLearnBackup } from "../../../app/learn-backup.mjs";
// @ts-expect-error legacy JS reference module
import { preflightLegacyLearnMigration } from "../../../app/r11-legacy-migration-preflight.mjs";
import { blankState, completeMission, addDiagnostic, inspectLegacyProgress, readState } from "../src/index.ts";

const now = new Date("2026-11-03T10:00:00Z");
let full = completeMission(blankState(), { taskId: "b1-g-001", firstAnswer: "x", firstCorrect: false, secondAnswer: "kirjastoon", repairCorrect: true, transferText: "Oma lause." }, now);
full = completeMission(full, { taskId: "b1-g-002", firstAnswer: "a", firstCorrect: true, transferText: "Toinen." }, now);
full = addDiagnostic(full, { skill: "reading", taskId: "r1", status: "scored", correct: true }, now);
full = addDiagnostic(full, { skill: "speaking", taskId: "s1", status: "ungraded", response: "Hei" }, now);
const j = (o: unknown) => JSON.stringify(o);
const noRetention: Record<string, unknown> = { ...full }; delete noRetention.retention;
const fixtures: Array<[string, unknown]> = [
  ["empty", ""], ["null", null], ["blank V1", j(blankState())], ["full", j(full)], ["pretty", JSON.stringify(full, null, 2)],
  ["no retention", j(noRetention)], ["broken", "{broken"], ["array", "[]"], ["v2", j({ ...full, version: 2 })],
  ["unknown root", j({ ...full, extra: 1 })], ["cards array", j({ ...full, cards: [] })],
  ["too many attempts", j({ ...full, attempts: Array.from({ length: 121 }, (_, i) => ({ ...full.attempts[0], taskId: "t" + i })) })],
  ["bad entry", j({ ...full, attempts: [{ notask: 1 }] })],
  ["bad card id", j({ ...full, cards: { "bad id!": { stage: 1, due: "2026-11-04" } } })],
  ["unknown card field", j({ ...full, cards: { ok: { stage: 1, due: "2026-11-04", x: 1 } } })],
  ["impossible due", j({ ...full, cards: { ok: { stage: 1, due: "2026-02-30" } } })],
  ["stage too high", j({ ...full, cards: { ok: { stage: 9, due: "2026-11-04" } } })],
  ["retention dropped", j({ ...full, retention: [{ taskId: "x", day: 5 }] })],
  ["attempt without date", j({ ...full, attempts: [{ ...full.attempts[0], completedAt: "nope" }] })],
  ["scored writing", j({ ...full, diagnostics: [{ skill: "writing", taskId: "w", status: "scored", correct: true, completedAt: now.toISOString() }] })],
];

describe("legacy import check parity with R11 preflight + learn-backup inspection", () => {
  it.each(fixtures)("%s", (_name, raw) => {
    const mine = inspectLegacyProgress(raw);
    const pre = preflightLegacyLearnMigration(raw);
    expect(mine.counts).toEqual(pre.counts);
    if (pre.status !== "ready") {
      expect([mine.status, mine.reason]).toEqual([pre.status, pre.reason]);
    } else {
      const lb = inspectLearnBackup(raw);
      expect(mine.status).toBe(lb.status);
      if (lb.status === "blocked") expect(mine.reason).toBe(lb.reason);
      else expect(mine.state).toEqual(readState(raw as string).state);
    }
  });
  it("a ready inspection reports counts only and the exact V1-loaded state", () => {
    const r = inspectLegacyProgress(j(full));
    expect(r).toMatchObject({ status: "ready", counts: { attempts: 2, diagnostics: 2, errors: 1, retention: 0, cards: 2 } });
    expect(r.state!.attempts[0]!.firstAnswer).toBe("x"); // first attempt preserved, not the repair
  });
});
