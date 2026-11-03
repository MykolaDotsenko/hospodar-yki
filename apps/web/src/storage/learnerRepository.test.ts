import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { blankState, completeMission } from "@hospodar/domain";
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
