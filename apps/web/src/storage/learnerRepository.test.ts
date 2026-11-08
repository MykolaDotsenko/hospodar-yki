import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { blankState, completeMission, missionReducer, missionResult, startMission } from "@hospodar/domain";
import { exercises } from "../content/cloze.ts";
import { clozeFingerprint } from "./missionDraft.ts";
import { createLearnerRepository, StorageError } from "./learnerRepository.ts";

const name = () => "test-" + Math.random().toString(16).slice(2);
const done = (s = blankState()) => completeMission(s, { taskId: "b1-g-001", firstAnswer: "x", firstCorrect: false, transferText: "Oma lause." }, new Date("2026-11-03T10:00:00Z"));

describe("Dexie learner repository", () => {
  it("starts blank at revision 0, commits atomically and reads back after reopen", async () => {
    const db = name();
    const repo = createLearnerRepository(db);
    expect(await repo.read()).toEqual({ state: blankState(), revision: 0 });
    const saved = await repo.commit(done(), 0);
    expect(saved.revision).toBe(1);
    const reopened = await createLearnerRepository(db).read();
    expect(reopened.revision).toBe(1);
    expect(reopened.state.attempts[0]!.firstAnswer).toBe("x");
  });
  it("stale writer (second tab) gets REVISION_CONFLICT and nothing is overwritten", async () => {
    const db = name();
    const a = createLearnerRepository(db), b = createLearnerRepository(db);
    await a.commit(done(), 0);
    await expect(b.commit(blankState(), 0)).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    expect((await a.read()).state.attempts).toHaveLength(1);
  });
  it("errors are typed StorageError", async () => {
    const repo = createLearnerRepository(name());
    const err = await repo.commit(blankState(), 5).catch(e => e);
    expect(err).toBeInstanceOf(StorageError);
  });
});

describe("legacy import (G2-b)", () => {
  const receipt = (counts = { attempts: 1, diagnostics: 0, errors: 1, retention: 0, cards: 1 }) =>
    ({ id: "imp-1", source: "legacy_v1_file" as const, originalSha256: "a".repeat(64), originalBytes: 10, counts });
  it("imports into an empty profile atomically with a receipt, then verifies by readback", async () => {
    const db = name();
    const repo = createLearnerRepository(db);
    const { snapshot, receipt: r } = await repo.importLegacy(done(), receipt());
    expect(snapshot.revision).toBe(1);
    expect(r.revision).toBe(1);
    const reopened = createLearnerRepository(db);
    expect((await reopened.read()).state.attempts[0]!.firstAnswer).toBe("x");
    expect(await reopened.listImports()).toHaveLength(1);
  });
  it("refuses to overwrite existing progress in the new app (no silent merge)", async () => {
    const db = name();
    const repo = createLearnerRepository(db);
    await repo.commit(done(), 0);
    await expect(repo.importLegacy(done(), receipt())).rejects.toMatchObject({ code: "DESTINATION_NOT_EMPTY" });
    expect(await repo.listImports()).toHaveLength(0);
    expect((await repo.read()).revision).toBe(1);
  });
  it("count mismatch on readback is reported, never claimed as success", async () => {
    const repo = createLearnerRepository(name());
    await expect(repo.importLegacy(done(), receipt({ attempts: 5, diagnostics: 0, errors: 1, retention: 0, cards: 1 })))
      .rejects.toMatchObject({ code: "READBACK_MISMATCH" });
  });
  it("a v1 database opened by the v2 schema keeps its learner row", async () => {
    const db = name();
    await createLearnerRepository(db).commit(done(), 0);
    expect((await createLearnerRepository(db).read()).state.attempts).toHaveLength(1);
  });
});

describe("erase my data (LEARN-16)", () => {
  it("erases progress and import receipts together and verifies the store is empty", async () => {
    const db = name();
    const repo = createLearnerRepository(db);
    await repo.importLegacy(done(), { id: "imp-e", source: "legacy_v1_file", originalSha256: "b".repeat(64), originalBytes: 3,
      counts: { attempts: 1, diagnostics: 0, errors: 1, retention: 0, cards: 1 } });
    expect(await repo.eraseAll(1)).toEqual({ state: blankState(), revision: 0 });
    const again = createLearnerRepository(db);
    expect(await again.read()).toEqual({ state: blankState(), revision: 0 });
    expect(await again.listImports()).toEqual([]);
  });
  it("a stale tab cannot erase progress it has not seen (REVISION_CONFLICT, nothing removed)", async () => {
    const db = name();
    const a = createLearnerRepository(db);
    await a.commit(done(), 0);
    await expect(createLearnerRepository(db).eraseAll(0)).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    expect((await a.read()).state.attempts).toHaveLength(1);
  });
});

const task = exercises[0]!;
const initial = () => ({ mission: startMission(task.id), input: "", contentFingerprint: clozeFingerprint(task) });

describe("P0 durable LEARN cloze checkpoints (not completed evidence)", () => {
  it("persists an editable draft across Dexie reopens without counting a finished mission", async () => {
    const db = name(), a = createLearnerRepository(db);
    const written = await a.saveMissionDraft({ ...initial(), input: "kirjast" }, 0, 0);
    expect(written).toMatchObject({ revision: 1, learnerRevision: 0, input: "kirjast" });
    expect((await a.read()).state.attempts).toEqual([]);
    const reopened = createLearnerRepository(db);
    expect(await reopened.readMissionDraft()).toEqual(written);
    const first = missionReducer(startMission(task.id), task, { type: "SUBMIT_FIRST", answer: "kirjasto" });
    const saved = await reopened.saveMissionDraft({ ...initial(), mission: first }, 0, 1);
    expect(saved.revision).toBe(2);
    expect(saved.mission).toMatchObject({ phase: "repair", firstAnswer: "kirjasto", firstCorrect: false });
    expect((await reopened.read()).state.attempts).toHaveLength(0);
  });
  it("stale tabs cannot silently replace the saved answer or advance the checkpoint", async () => {
    const db = name(), first = createLearnerRepository(db), second = createLearnerRepository(db);
    await first.saveMissionDraft({ ...initial(), input: "oma" }, 0, 0);
    await expect(second.saveMissionDraft({ ...initial(), input: "hijack" }, 0, 0))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    expect((await second.readMissionDraft())?.input).toBe("oma");
    await first.saveMissionDraft({ ...initial(), input: "oma2" }, 0, 1);
    await expect(second.discardMissionDraft(0, 1))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    expect((await first.readMissionDraft())?.input).toBe("oma2");
  });
  it("atomically commits the finished mission and removes its draft; rejects replay", async () => {
    const db = name(), a = createLearnerRepository(db);
    const first = missionReducer(startMission(task.id), task, { type: "SUBMIT_FIRST", answer: "kirjasto" });
    const repair = missionReducer(first, task, { type: "SUBMIT_REPAIR", answer: "kirjastoon" });
    const transfer = missionReducer(repair, task, { type: "CONTINUE" });
    await a.saveMissionDraft({ ...initial(), mission: transfer, input: "Menen nyt töihin." }, 0, 0);
    const completed = missionReducer(transfer, task, { type: "SUBMIT_TRANSFER", text: "Menen nyt töihin." });
    const next = completeMission(blankState(), missionResult(completed, task.grammar_tag), new Date("2026-11-08T08:00:00Z"));
    await expect(a.finishMissionDraft(next, 0, 0, task.id)).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    const saved = await a.finishMissionDraft(next, 0, 1, task.id);
    expect(saved).toMatchObject({ revision: 1, state: { version: 1 } });
    const reopened = createLearnerRepository(db);
    expect(await reopened.readMissionDraft()).toBeNull();
    expect((await reopened.read()).state.attempts[0]).toMatchObject({
      taskId: task.id, firstAnswer: "kirjasto", firstCorrect: false,
      secondAnswer: "kirjastoon", transferText: "Menen nyt töihin.",
    });
    await expect(a.finishMissionDraft(next, 0, 1, task.id)).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    expect((await reopened.read()).state.attempts).toHaveLength(1);
  });
  it("a draft blocks legacy import and JSON restore; explicit discard is durable", async () => {
    const db = name(), a = createLearnerRepository(db);
    await a.saveMissionDraft(initial(), 0, 0);
    await expect(a.importLegacy(done(), { id: "draft-imp", source: "legacy_v1_file",
      originalSha256: "a".repeat(64), originalBytes: 2,
      counts: { attempts: 1, diagnostics: 0, errors: 1, retention: 0, cards: 1 } }))
      .rejects.toMatchObject({ code: "DESTINATION_NOT_EMPTY" });
    await expect(a.restoreWebLearn(done(), [], 0))
      .rejects.toMatchObject({ code: "DESTINATION_NOT_EMPTY" });
    await a.discardMissionDraft(0, 1);
    expect(await createLearnerRepository(db).readMissionDraft()).toBeNull();
    expect(await a.read()).toEqual({ state: blankState(), revision: 0 });
  });
  it("erasing LEARN also erases a draft without touching EXAM", async () => {
    const db = name(), a = createLearnerRepository(db);
    await a.saveMissionDraft({ ...initial(), input: "ei lähetetty" }, 0, 0);
    expect(await a.eraseAll(0)).toEqual({ state: blankState(), revision: 0 });
    expect(await createLearnerRepository(db).readMissionDraft()).toBeNull();
  });
});
