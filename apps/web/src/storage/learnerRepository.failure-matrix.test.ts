import "fake-indexeddb/auto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addDiagnostic, blankState, completeMission, diagnosticEvidence, diagnosticReducer,
  startDiagnostic,
} from "@hospodar/domain";
import { baseline } from "../content/diagnostic.ts";
import { diagnosticPayload } from "./diagnosticDraft.ts";
import { createLearnerRepository } from "./learnerRepository.ts";

const unique = () => "g2-fault-matrix-" + Math.random().toString(16).slice(2);
const sample = () => completeMission(blankState(), {
  taskId: "b1-g-001", firstAnswer: "kotissa", firstCorrect: false, transferText: "Olen kotona.",
});
const receipt = (id = "legacy-original", counts = {
  attempts: 1, diagnostics: 0, errors: 1, retention: 0, cards: 1,
}) => ({
  id, source: "legacy_v1_file" as const, originalSha256: "f".repeat(64),
  originalBytes: 103, counts,
});

const firstReading = () => startDiagnostic(baseline);
const completeReading = () => baseline.reading.questions.reduce((state, q) =>
  diagnosticReducer(state, baseline, {
    type: "ANSWER_READING", questionId: q.id, optionIndex: 0,
  }), firstReading());
const nextSkill = (s: ReturnType<typeof firstReading>, skill: "reading" | "writing") =>
  diagnosticReducer(diagnosticReducer(s, baseline, { type: "MARK_SAVED", skill }), baseline, { type: "CONTINUE" });
const written = "Hei, haluaisin kysyä suomen kurssista ensi viikolla.";
const spoken = "Valitettavasti en pääse huomenna. Sopiiko perjantai?";
const writtenCheck = () => diagnosticReducer(nextSkill(completeReading(), "reading"), baseline, {
  type: "SUBMIT_WRITING", text: written,
});
const spokenCheck = () => diagnosticReducer(nextSkill(writtenCheck(), "writing"), baseline, {
  type: "SUBMIT_SPEAKING", text: spoken, voiceRecorded: false,
});
const withEvidence = (state: ReturnType<typeof blankState>, source: ReturnType<typeof firstReading>,
  skill: "reading" | "writing" | "speaking") =>
  diagnosticEvidence(source, baseline, skill).reduce((s, event) => addDiagnostic(s, event), state);

/**
 * Inject one real IndexedDB transaction abort at the object-store boundary.
 * The method fails AFTER a prior write was already queued in that transaction:
 * atomic rollback must leave neither half of a completed LEARN step.
 * This tests real fake-indexeddb transaction semantics, not a mocked repository.
 */
function abortStoreOnce(
  method: "put" | "delete", store: string, errorName: "AbortError" | "QuotaExceededError",
) {
  const original = IDBObjectStore.prototype[method];
  let triggered = false;
  const spy = vi.spyOn(IDBObjectStore.prototype, method).mockImplementation(
    function (this: IDBObjectStore, ...args: unknown[]) {
      if (!triggered && this.name === store) {
        triggered = true;
        this.transaction.abort();
        throw new DOMException("Injected IndexedDB fault", errorName);
      }
      return Reflect.apply(original, this, args) as IDBRequest;
    },
  );
  return { triggered: () => triggered, restore: () => spy.mockRestore() };
}
afterEach(() => vi.restoreAllMocks());

describe("G2 migration replay and ambiguous readback safety", () => {
  it("rejects re-import even when previously imported LEARN state contains zero records", async () => {
    const db = unique(), repo = createLearnerRepository(db);
    const blankReceipt = receipt("zero-original", {
      attempts: 0, diagnostics: 0, errors: 0, retention: 0, cards: 0,
    });
    const imported = await repo.importLegacy(blankState(), blankReceipt);
    expect(imported.receipt.revision).toBe(1);
    expect(await repo.listImports()).toHaveLength(1);
    await expect(repo.importLegacy(blankState(), { ...blankReceipt, id: "second-original" }))
      .rejects.toMatchObject({ code: "DESTINATION_NOT_EMPTY" });
    const reopened = createLearnerRepository(db);
    expect(await reopened.read()).toEqual({ state: blankState(), revision: 1 });
    expect((await reopened.listImports()).map(r => r.id)).toEqual(["zero-original"]);
  });

  it("does not replace a blank but already-owned learner row, even without import receipts", async () => {
    const db = unique(), repo = createLearnerRepository(db);
    await repo.commit(blankState(), 0);
    await expect(repo.importLegacy(sample(), receipt()))
      .rejects.toMatchObject({ code: "DESTINATION_NOT_EMPTY" });
    expect(await repo.listImports()).toEqual([]);
    expect((await repo.read()).revision).toBe(1);
  });

  it("after a committed import with mismatched readback counts, retry fails closed without duplicate receipt", async () => {
    const db = unique(), repo = createLearnerRepository(db);
    const wrongCounts = receipt("ambiguous-import", {
      attempts: 100, diagnostics: 0, errors: 1, retention: 0, cards: 1,
    });
    await expect(repo.importLegacy(sample(), wrongCounts))
      .rejects.toMatchObject({ code: "READBACK_MISMATCH" });
    // The transaction was committed before the verification failed.
    expect((await repo.read()).state.attempts).toHaveLength(1);
    expect(await repo.listImports()).toHaveLength(1);
    await expect(repo.importLegacy(sample(), receipt("retry-import")))
      .rejects.toMatchObject({ code: "DESTINATION_NOT_EMPTY" });
    expect((await repo.read()).revision).toBe(1);
    expect((await repo.listImports()).map(r => r.id)).toEqual(["ambiguous-import"]);
  });

  it("quota fault on receipt write aborts the preceding learner write; retry has exactly one receipt", async () => {
    const db = unique(), repo = createLearnerRepository(db);
    expect((await repo.read()).revision).toBe(0); // open schema before injection
    const fault = abortStoreOnce("put", "imports", "QuotaExceededError");
    try {
      await expect(repo.importLegacy(sample(), receipt()))
        .rejects.toMatchObject({ code: "QUOTA_OR_DISK_FULL" });
      expect(fault.triggered()).toBe(true);
    } finally { fault.restore(); }
    expect(await repo.read()).toEqual({ state: blankState(), revision: 0 });
    expect(await repo.listImports()).toEqual([]);
    const success = await repo.importLegacy(sample(), receipt());
    expect(success.snapshot.revision).toBe(1);
    expect((await repo.read()).state.attempts).toHaveLength(1);
    expect(await repo.listImports()).toHaveLength(1);
  });
});

describe("G2 Diagnostic atomic evidence and crash-style transaction faults", () => {
  it("abort after learner evidence put, before next Diagnostic draft put, rolls back the whole step", async () => {
    const db = unique(), repo = createLearnerRepository(db);
    const before = completeReading();
    const after = nextSkill(before, "reading");
    const draft = await repo.saveDiagnosticDraft(diagnosticPayload(before, "", null, baseline), 0, 0);
    const newProgress = withEvidence(blankState(), before, "reading");
    const fault = abortStoreOnce("put", "diagnosticDraft", "QuotaExceededError");
    try {
      await expect(repo.commitDiagnosticDraftStep(
        newProgress, diagnosticPayload(after, "", null, baseline),
        "reading", 0, draft.revision,
      )).rejects.toMatchObject({ code: "QUOTA_OR_DISK_FULL" });
      expect(fault.triggered()).toBe(true);
    } finally { fault.restore(); }
    const afterFailure = createLearnerRepository(db);
    expect(await afterFailure.read()).toEqual({ state: blankState(), revision: 0 });
    expect((await afterFailure.readDiagnosticDraft())?.session.step).toBe("reading_feedback");
    expect((await afterFailure.readDiagnosticDraft())?.revision).toBe(1);

    const committed = await afterFailure.commitDiagnosticDraftStep(
      newProgress, diagnosticPayload(after, "", null, baseline), "reading", 0, 1,
    );
    expect(committed.snapshot.revision).toBe(1);
    expect((await afterFailure.read()).state.diagnostics).toHaveLength(baseline.reading.questions.length);
    await expect(repo.commitDiagnosticDraftStep(
      newProgress, diagnosticPayload(after, "", null, baseline), "reading", 0, 1,
    )).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
  });

  it("abort on final draft removal rolls back the preceding speaking evidence write", async () => {
    const db = unique(), repo = createLearnerRepository(db);
    const reading = completeReading(), writing = writtenCheck(), speaking = spokenCheck();
    await repo.saveDiagnosticDraft(diagnosticPayload(reading, "", null, baseline), 0, 0);
    const withReading = withEvidence(blankState(), reading, "reading");
    await repo.commitDiagnosticDraftStep(
      withReading, diagnosticPayload(nextSkill(reading, "reading"), "", null, baseline),
      "reading", 0, 1,
    );
    await repo.saveDiagnosticDraft(diagnosticPayload(writing, "", null, baseline), 1, 2);
    const withWriting = withEvidence(withReading, writing, "writing");
    await repo.commitDiagnosticDraftStep(
      withWriting, diagnosticPayload(nextSkill(writing, "writing"), "", null, baseline),
      "writing", 1, 3,
    );
    await repo.saveDiagnosticDraft(diagnosticPayload(speaking, "", null, baseline), 2, 4);
    const withSpeaking = withEvidence(withWriting, speaking, "speaking");
    const fault = abortStoreOnce("delete", "diagnosticDraft", "AbortError");
    try {
      await expect(repo.finishDiagnosticDraft(withSpeaking, 2, 5, spoken, false))
        .rejects.toMatchObject({ code: "SAVE_FAILED" });
      expect(fault.triggered()).toBe(true);
    } finally { fault.restore(); }

    const reopened = createLearnerRepository(db);
    expect((await reopened.read()).revision).toBe(2);
    expect((await reopened.read()).state.diagnostics).toHaveLength(baseline.reading.questions.length + 1);
    expect((await reopened.readDiagnosticDraft())?.session.step).toBe("speaking_check");
    expect((await reopened.readDiagnosticDraft())?.revision).toBe(5);

    const saved = await reopened.finishDiagnosticDraft(withSpeaking, 2, 5, spoken, false);
    expect(saved.revision).toBe(3);
    expect(await reopened.readDiagnosticDraft()).toBeNull();
    expect((await reopened.read()).state.diagnostics).toHaveLength(baseline.reading.questions.length + 2);
    await expect(reopened.finishDiagnosticDraft(withSpeaking, 2, 5, spoken, false))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
  });
});
