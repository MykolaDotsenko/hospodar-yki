/** 7/14/30 delayed transfer: same queue and records as app/retention-core.mjs. */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
// @ts-expect-error legacy JS reference module
import * as ref from "../../../app/retention-core.mjs";
import * as d from "../src/index.ts";

const bank: d.TransferBank = JSON.parse(readFileSync(new URL("../../../learning/exercises/b1/grammar/delayed-transfer-v1.json", import.meta.url), "utf8"));
const start = new Date("2026-10-01T09:00:00Z");
const day = (n: number) => new Date(start.getTime() + n * 86400000);
const base = d.completeMission(d.blankState(), { taskId: bank.items[0]!.task_id, firstAnswer: "x", firstCorrect: true, transferText: "Oma." }, start);

describe("delayed transfer parity", () => {
  it("queue matches the reference on days 0…40 incl. Helsinki DST (25.10.2026)", () => {
    for (let n = 0; n <= 40; n++) expect(d.delayedTransferQueue(base, bank, day(n))).toEqual(ref.delayedTransferQueue(base, bank, day(n)));
  });
  it("records match; duplicate, early, wrong-day and empty submissions fail in both", () => {
    const a = ref.recordDelayedTransfer(base, bank, { taskId: bank.items[0]!.task_id, day: 7, response: "Menen kirjastoon." }, day(8));
    const b = d.recordDelayedTransfer(base, bank, { taskId: bank.items[0]!.task_id, day: 7, response: "Menen kirjastoon." }, day(8));
    expect(b).toEqual(a);
    expect(b.retention[0]).toMatchObject({ status: "ungraded", independent: true, lateByDays: 1 });
    for (const [state, args, when] of [[b, { day: 7, response: "uudelleen" }, day(9)], [base, { day: 7, response: "liian aikaisin" }, day(3)],
      [base, { day: 14, response: "väärä päivä" }, day(8)], [base, { day: 7, response: "  " }, day(8)]] as const) {
      const input = { taskId: bank.items[0]!.task_id, ...args };
      expect(() => ref.recordDelayedTransfer(state, bank, input, when)).toThrow();
      expect(() => d.recordDelayedTransfer(state as d.LearnerState, bank, input, when)).toThrow();
    }
  });
  it("a missed day-7 window is reported missed on day 14, never passed retroactively", () => {
    const q = d.delayedTransferQueue(base, bank, day(15))[0]!;
    expect(q.missed).toEqual([7]);
    expect(q.due!.day).toBe(14);
  });
});
