import "fake-indexeddb/auto";
import Dexie from "dexie";
import { describe, expect, it } from "vitest";
import { addDiagnostic, blankState, diagnosticEvidence, diagnosticReducer, startDiagnostic } from "@hospodar/domain";
import { baseline as b } from "../content/diagnostic.ts";
import { diagnosticPayload } from "./diagnosticDraft.ts";
import { createLearnerRepository } from "./learnerRepository.ts";

const db = () => "diagnostic-v9-" + Math.random().toString(16).slice(2);
const written = "Hei! Puhun suomea vähän. Milloin kurssi alkaa?";
const spoken = "Valitettavasti en pääse torstaina. Sopiiko perjantai?";
const first = () => startDiagnostic(b);
const feedback = () => b.reading.questions.reduce((s, q) =>
  diagnosticReducer(s, b, { type: "ANSWER_READING", questionId: q.id, optionIndex: 0 }), first());
const advance = (s: ReturnType<typeof first>, skill: "reading" | "writing") =>
  diagnosticReducer(diagnosticReducer(s, b, { type: "MARK_SAVED", skill }), b, { type: "CONTINUE" });
const writingCheck = () => diagnosticReducer(advance(feedback(), "reading"), b, { type: "SUBMIT_WRITING", text: written });
const speaking = () => advance(writingCheck(), "writing");
const speakingCheck = () => diagnosticReducer(speaking(), b, { type: "SUBMIT_SPEAKING", text: spoken, voiceRecorded: false });
function evidence(from: ReturnType<typeof first>, skill: "reading" | "writing" | "speaking") {
  let state = blankState();
  for (const ev of diagnosticEvidence(from, b, skill)) state = addDiagnostic(state, ev);
  return state;
}
describe("Dexie v9 Diagnostic evidence and draft atomicity", () => {
  it("reads an unfinished first choice independently from completed diagnostics", async () => {
    const n = db(), a = createLearnerRepository(n);
    const row = await a.saveDiagnosticDraft(diagnosticPayload(first(), "", 0, b), 0, 0);
    expect(row).toMatchObject({ revision: 1, learnerRevision: 0, pick: 0 });
    expect(await createLearnerRepository(n).readDiagnosticDraft()).toEqual(row);
    expect((await a.read()).state.diagnostics).toHaveLength(0);
  });
  it("commits reading and writing evidence atomically with correct next-stage checkpoints", async () => {
    const n = db(), repo = createLearnerRepository(n), f = feedback(), w = advance(f, "reading"), wc = writingCheck(), sp = speaking();
    await repo.saveDiagnosticDraft(diagnosticPayload(f, "", null, b), 0, 0);
    const reading = await repo.commitDiagnosticDraftStep(evidence(f, "reading"), diagnosticPayload(w, "", null, b), "reading", 0, 1);
    expect(reading.snapshot.revision).toBe(1);
    expect(reading.draft).toMatchObject({ revision: 2, learnerRevision: 1, session: { step: "writing" } });
    const s1 = reading.snapshot.state;
    await repo.saveDiagnosticDraft(diagnosticPayload(wc, "", null, b), 1, 2);
    let s2 = s1;
    for (const ev of diagnosticEvidence(wc, b, "writing")) s2 = addDiagnostic(s2, ev);
    const writing = await repo.commitDiagnosticDraftStep(s2, diagnosticPayload(sp, "", null, b), "writing", 1, 3);
    expect(writing.snapshot.revision).toBe(2);
    expect(writing.draft).toMatchObject({ revision: 4, learnerRevision: 2, session: { step: "speaking" } });
    const back = createLearnerRepository(n);
    expect((await back.read()).state.diagnostics).toHaveLength(b.reading.questions.length + 1);
    expect((await back.readDiagnosticDraft())?.session.step).toBe("speaking");
  });
  it("blocks competing tab stale writes, step commit, discard and erasure", async () => {
    const n = db(), a = createLearnerRepository(n), bRepo = createLearnerRepository(n), f = feedback();
    await a.saveDiagnosticDraft(diagnosticPayload(f, "", null, b), 0, 0);
    await a.saveDiagnosticDraft(diagnosticPayload(f, "", null, b), 0, 1);
    await expect(bRepo.saveDiagnosticDraft(diagnosticPayload(f, "", null, b), 0, 1))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    await expect(bRepo.commitDiagnosticDraftStep(evidence(f, "reading"), diagnosticPayload(advance(f, "reading"), "", null, b), "reading", 0, 1))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    await expect(bRepo.discardDiagnosticDraft(0, 1)).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    await expect(a.eraseAll(0, 0, 0, 0, 0, 0, 0, 1)).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    await a.eraseAll(0, 0, 0, 0, 0, 0, 0, 2);
    expect(await bRepo.readDiagnosticDraft()).toBeNull();
  });
  it("completes writing/speaking without fabricated score, deletes matching draft once", async () => {
    const n = db(), repo = createLearnerRepository(n), f = feedback(), w = advance(f, "reading"), wc = writingCheck(), sp = speaking(), sc = speakingCheck();
    await repo.saveDiagnosticDraft(diagnosticPayload(f, "", null, b), 0, 0);
    let state = evidence(f, "reading");
    await repo.commitDiagnosticDraftStep(state, diagnosticPayload(w, "", null, b), "reading", 0, 1);
    await repo.saveDiagnosticDraft(diagnosticPayload(wc, "", null, b), 1, 2);
    for (const ev of diagnosticEvidence(wc, b, "writing")) state = addDiagnostic(state, ev);
    await repo.commitDiagnosticDraftStep(state, diagnosticPayload(sp, "", null, b), "writing", 1, 3);
    await repo.saveDiagnosticDraft(diagnosticPayload(sc, "", null, b), 2, 4);
    await expect(repo.finishDiagnosticDraft(state, 2, 5, "wrong", false)).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    for (const ev of diagnosticEvidence(sc, b, "speaking")) state = addDiagnostic(state, ev);
    const saved = await repo.finishDiagnosticDraft(state, 2, 5, spoken, false);
    expect(saved.revision).toBe(3);
    const back = createLearnerRepository(n);
    expect(await back.readDiagnosticDraft()).toBeNull();
    expect((await back.read()).state.diagnostics).toHaveLength(b.reading.questions.length + 2);
    expect((await back.read()).state.diagnostics.filter(d => d.status === "ungraded")).toHaveLength(2);
    await expect(back.finishDiagnosticDraft(state, 2, 5, spoken, false)).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
  });
  it("accepts voice-only completion from a speaking checkpoint without writing voice/audio to IDB", async () => {
    const n = db(), repo = createLearnerRepository(n), sp = speaking();
    await repo.saveDiagnosticDraft(diagnosticPayload(sp, "", null, b), 0, 0);
    await expect(repo.finishDiagnosticDraft(blankState(), 0, 1, "", false)).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    await repo.finishDiagnosticDraft(blankState(), 0, 1, "", true);
    expect(await repo.readDiagnosticDraft()).toBeNull();
  });
  it("prevents import/restore over a draft and preserves v8 rows in additive v9 upgrade", async () => {
    const n = db(), old = new Dexie(n);
    old.version(8).stores({ learner: "id", imports: "id", missionDraft: "id", clinicDraft: "id",
      readingDraft: "id", listeningDraft: "id", dialogueDraft: "id", pictureDraft: "id" });
    await old.table("learner").put({ id: "current", revision: 0, state: blankState(), updatedAt: "2026-11-10T00:00:00Z" });
    await old.table("pictureDraft").put({ id: "active", revision: 1, learnerRevision: 0, session: { lessonId: "preserved", phase: "look", first: "", transfer: "" },
      input: "private", contentFingerprint: "existing", savedAt: "2026-11-10T00:00:00Z" });
    old.close();
    const repo = createLearnerRepository(n);
    expect((await repo.readPictureDraft())?.input).toBe("private");
    expect(await repo.readDiagnosticDraft()).toBeNull();
    await repo.saveDiagnosticDraft(diagnosticPayload(first(), "", 0, b), 0, 0);
    await expect(repo.restoreWebLearn(blankState(), [], 0)).rejects.toMatchObject({ code: "DESTINATION_NOT_EMPTY" });
    await expect(repo.importLegacy(blankState(), { id: "diag", source: "legacy_v1_file", originalSha256: "b".repeat(64),
      originalBytes: 3, counts: { attempts: 0, diagnostics: 0, errors: 0, retention: 0, cards: 0 } }))
      .rejects.toMatchObject({ code: "DESTINATION_NOT_EMPTY" });
  });
});
