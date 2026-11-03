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
