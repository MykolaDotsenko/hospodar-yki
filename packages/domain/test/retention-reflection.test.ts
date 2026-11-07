import { describe, expect, it } from "vitest";
import { blankState, completeMission, delayedTransferQueue, recordDelayedTransfer,
  completedTransferReflection, type LearnerState, type TransferBank } from "../src/index.ts";

const T0 = new Date("2026-10-01T09:00:00.000Z");
const at = (day: number) => new Date(T0.getTime() + day * 86_400_000);
const bank: TransferBank = { schema_version: "reflection-fi-1", items: [
  { task_id: "b1-g-001", grammar_tag: "illatiivi", checkpoints: [
    { day: 7, prompt_fi: "Minne menet?" }, { day: 14, prompt_fi: "Minne ja miksi?" },
    { day: 30, prompt_fi: "Minne harrastamaan?" },
  ] },
  { task_id: "b1-g-002", grammar_tag: "elatiivi", checkpoints: [
    { day: 7, prompt_fi: "Mistä tulit?" }, { day: 14, prompt_fi: "Mistä ja miksi?" },
    { day: 30, prompt_fi: "Mistä tulet?" },
  ] },
] };
const first = (state: LearnerState, id: string, sentence: string, now = T0) =>
  completeMission(state, { taskId: id, grammarTag: "place", firstAnswer: "kirjasto",
    firstCorrect: false, secondAnswer: "kirjastoon", repairCorrect: false,
    transferText: sentence }, now);

describe("delayed learner-owned reflection (not a grade)", () => {
  it("does not expose the first sentence while the delayed response is not yet stored", () => {
    const state = first(blankState(), "b1-g-001", "Menen kirjastoon.");
    expect(completedTransferReflection(state, "b1-g-001", 7)).toBeNull();
    expect(delayedTransferQueue(state, bank, at(8))[0]?.due?.day).toBe(7);
    expect(completedTransferReflection(state, "other", 7)).toBeNull();
    expect(completedTransferReflection(state, "b1-g-001", 42)).toBeNull();
  });
  it("returns EXACT learner-authored text only after independent ungraded evidence exists", () => {
    const state = first(blankState(), "b1-g-001", "Menen kirjastoon: ystävä.");
    const answer = "Huomenna menen töihin, ystävä. ä ö.";
    const saved = recordDelayedTransfer(state, bank,
      { taskId: "b1-g-001", day: 7, response: answer }, at(8));
    expect(completedTransferReflection(saved, "b1-g-001", 7)).toMatchObject({
      taskId: "b1-g-001", day: 7,
      earlierResponse: "Menen kirjastoon: ystävä.", delayedResponse: answer,
    });
    expect(JSON.stringify(completedTransferReflection(saved, "b1-g-001", 7))).not.toMatch(/grade|correct|score|B1|YKI/i);
    expect(completedTransferReflection(saved, "b1-g-001", 14)).toBeNull();
  });
  it("uses the earliest independent original, not a later guided attempt; survives serialisation", () => {
    const one = first(blankState(), "b1-g-001", "Menen ensimmäisenä.");
    const two = first(one, "b1-g-001", "Menen myöhemmin.", at(2));
    const saved = recordDelayedTransfer(two, bank,
      { taskId: "b1-g-001", day: 7, response: "Menen huomenna." }, at(8));
    const restored = JSON.parse(JSON.stringify(saved)) as LearnerState;
    expect(completedTransferReflection(restored, "b1-g-001", 7)?.earlierResponse)
      .toBe("Menen ensimmäisenä.");
  });
  it("retains the next due independent task after saving the previous one; no automatic passing", () => {
    let state = first(blankState(), "b1-g-001", "Menen kirjastoon.");
    state = first(state, "b1-g-002", "Tulin kaupasta.");
    expect(delayedTransferQueue(state, bank, at(8)).filter(q => q.due)).toHaveLength(2);
    state = recordDelayedTransfer(state, bank, { taskId: "b1-g-001", day: 7, response: "Menen töihin." }, at(8));
    const remaining = delayedTransferQueue(state, bank, at(8)).filter(q => q.due);
    expect(remaining.map(q => q.taskId)).toEqual(["b1-g-002"]);
    expect(completedTransferReflection(state, "b1-g-002", 7)).toBeNull();
    state = recordDelayedTransfer(state, bank, { taskId: "b1-g-002", day: 7, response: "Tulin töistä." }, at(8));
    expect(delayedTransferQueue(state, bank, at(8)).filter(q => q.due)).toHaveLength(0);
    expect(state.retention.every(x => x.status === "ungraded" && x.independent)).toBe(true);
  });
  it("rejects a forged reflection when the original was recorded after the delayed submission", () => {
    const saved = recordDelayedTransfer(first(blankState(), "b1-g-001", "Oma."),
      bank, { taskId: "b1-g-001", day: 7, response: "Nyt." }, at(8));
    saved.attempts[0]!.completedAt = at(9).toISOString();
    expect(completedTransferReflection(saved, "b1-g-001", 7)).toBeNull();
  });
});
