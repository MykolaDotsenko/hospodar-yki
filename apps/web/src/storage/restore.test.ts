import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { addDiagnostic, blankState, completeMission } from "@hospodar/domain";
import { createLearnerRepository, type ImportReceipt } from "./learnerRepository.ts";

const name = () => "restore-test-" + Math.random().toString(16).slice(2);
const T = new Date("2026-11-04T10:00:00.000Z");
const learned = () => addDiagnostic(completeMission(blankState(), {
  taskId: "b1-g-001", firstAnswer: "kirjasto", firstCorrect: false,
  secondAnswer: "kirjastoon", repairCorrect: true, transferText: "Menen kirjastoon."
}, T), { skill: "speaking", taskId: "voice1", status: "ungraded", response: "Hei!" }, T);
const receipt = (): ImportReceipt => ({ id: "import-aabb", source: "legacy_v1_file", originalSha256: "a".repeat(64),
  originalBytes: 200, importedAt: T.toISOString(), revision: 1,
  counts: { attempts: 1, diagnostics: 1, errors: 1, retention: 0, cards: 1 } });

describe("new Web LEARN JSON recovery", () => {
  it("restores state and original receipts atomically into an empty profile, verifies after reopening", async () => {
    const db = name(), r = createLearnerRepository(db), state = learned();
    const saved = await r.restoreWebLearn(state, [receipt()], 0);
    expect(saved.revision).toBe(1);
    const reopened = createLearnerRepository(db);
    expect((await reopened.read()).state).toEqual(state);
    expect(await reopened.listImports()).toEqual([receipt()]);
    expect((await reopened.read()).state.diagnostics[0]!.status).toBe("ungraded");
  });
  it("never overwrites existing data or import receipts", async () => {
    const r = createLearnerRepository(name());
    await r.commit(learned(), 0);
    await expect(r.restoreWebLearn(blankState(), [], 1)).rejects.toMatchObject({ code: "DESTINATION_NOT_EMPTY" });
    expect((await r.read()).state.attempts).toHaveLength(1);
  });
  it("stale tab cannot replace a concurrent write, even if its preview was empty", async () => {
    const db = name(), a = createLearnerRepository(db), b = createLearnerRepository(db);
    await b.commit(learned(), 0);
    await expect(a.restoreWebLearn(blankState(), [], 0)).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    expect((await a.read()).state.attempts).toHaveLength(1);
  });
  it("invalid duplicate receipt fails the transaction without a partial learner write", async () => {
    const r = createLearnerRepository(name()), duplicate = receipt();
    await expect(r.restoreWebLearn(learned(), [duplicate, duplicate], 0)).rejects.toMatchObject({ code: "SAVE_FAILED" });
    expect(await r.read()).toEqual({ state: blankState(), revision: 0 });
    expect(await r.listImports()).toEqual([]);
  });
});
