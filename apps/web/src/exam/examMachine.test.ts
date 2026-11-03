import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { createActor, waitFor } from "xstate";
import { scoreSession } from "@hospodar/domain";
import { createExamMachine } from "./examMachine.ts";
import { createExamRepository, type ExamRepository } from "../storage/examRepository.ts";
import { StorageError } from "../storage/learnerRepository.ts";
import { examBlueprints, itemsFor } from "../content/exam.ts";

const T0 = Date.parse("2026-11-03T10:00:00Z");
const ids = examBlueprints.map(b => b.id);
const db = () => "exam-test-" + Math.random().toString(16).slice(2);
const boot = async (repo: ExamRepository) => {
  const a = createActor(createExamMachine(repo, itemsFor, ids)).start();
  await waitFor(a, s => !s.matches("loading"));
  return a;
};
const settled = (a: ReturnType<typeof createActor>) => waitFor(a, s => !s.matches("saving") && !s.matches("clearing"));

describe("EXAM machine (XState) over the parity-tested domain policies", () => {
  it("starts a practice rehearsal and persists it before showing the first item", async () => {
    const repo = createExamRepository(db());
    const a = await boot(repo);
    expect(a.getSnapshot().matches("setup")).toBe(true);
    a.send({ type: "START", blueprintId: ids[0]!, minutes: 0, now: T0, sessionId: "sess-ux1" });
    await settled(a);
    expect(a.getSnapshot().matches("active")).toBe(true);
    expect((await repo.read())!.session.sessionId).toBe("sess-ux1");
  });
  it("C-04: navigation is persisted first; reload resumes the same item with the typed answer", async () => {
    const name = db(); const repo = createExamRepository(name);
    const a = await boot(repo);
    a.send({ type: "START", blueprintId: ids[0]!, minutes: 0, now: T0, sessionId: "sess-ux2" });
    await settled(a);
    const first = a.getSnapshot().context.items[0]!;
    a.send({ type: "ANSWER", itemId: first.id, value: "1", now: T0 + 1000 });
    a.send({ type: "GOTO", index: 1, now: T0 + 2000 });
    await settled(a);
    const b = await boot(createExamRepository(name));
    expect(b.getSnapshot().matches("active")).toBe(true);
    expect(b.getSnapshot().context.session!.index).toBe(1);
    expect(b.getSnapshot().context.session!.answers[first.id]).toBe("1");
  });
  it("EXAM-05: no result is computable before a durable finish; after it, objective only and never a grade", async () => {
    const repo = createExamRepository(db());
    const a = await boot(repo);
    a.send({ type: "START", blueprintId: ids[0]!, minutes: 0, now: T0, sessionId: "sess-ux3" });
    await settled(a);
    const { items, session } = a.getSnapshot().context;
    expect(() => scoreSession(items, session!)).toThrow(/before finishing/);
    a.send({ type: "REQUEST_FINISH" });
    expect(a.getSnapshot().matches("confirming")).toBe(true);
    a.send({ type: "CONFIRM_FINISH", now: T0 + 5000 });
    await settled(a);
    expect(a.getSnapshot().matches("finished")).toBe(true);
    expect((await repo.read())!.session.finishedAt).not.toBeNull();
    const r = scoreSession(a.getSnapshot().context.items, a.getSnapshot().context.session!);
    expect([r.officialGrade, r.ykiPassPrediction]).toEqual([null, null]);
  });
  it("E04: after the practice deadline answers and navigation are refused; only finishing is possible", async () => {
    const repo = createExamRepository(db());
    const a = await boot(repo);
    a.send({ type: "START", blueprintId: ids[0]!, minutes: 15, now: T0, sessionId: "sess-ux4" });
    await settled(a);
    const it0 = a.getSnapshot().context.items[0]!;
    a.send({ type: "ANSWER", itemId: it0.id, value: "0", now: T0 + 16 * 60_000 });
    expect(a.getSnapshot().matches("expired")).toBe(true);
    expect(a.getSnapshot().context.session!.answers[it0.id]).toBeUndefined();
    a.send({ type: "GOTO", index: 2, now: T0 + 16 * 60_000 });
    expect(a.getSnapshot().matches("expired")).toBe(true);
    a.send({ type: "CONFIRM_FINISH", now: T0 + 16 * 60_000 });
    await settled(a);
    expect(a.getSnapshot().matches("finished")).toBe(true);
  });
  it("a failed save never moves on: the learner stays with their answer and can retry", async () => {
    const real = createExamRepository(db());
    let fail = false;
    const repo: ExamRepository = { ...real, commit: (s, r) => fail ? Promise.reject(new StorageError("QUOTA_OR_DISK_FULL", "full")) : real.commit(s, r) };
    const a = await boot(repo);
    a.send({ type: "START", blueprintId: ids[0]!, minutes: 0, now: T0, sessionId: "sess-ux5" });
    await settled(a);
    const it0 = a.getSnapshot().context.items[0]!;
    a.send({ type: "ANSWER", itemId: it0.id, value: "2", now: T0 + 1000 });
    fail = true;
    a.send({ type: "GOTO", index: 1, now: T0 + 2000 });
    await waitFor(a, s => s.matches("saveError"));
    expect(a.getSnapshot().context.error).toBe("QUOTA_OR_DISK_FULL");
    expect((await real.read())!.session.index).toBe(0);
    fail = false;
    a.send({ type: "RETRY" });
    await settled(a);
    expect(a.getSnapshot().matches("active")).toBe(true);
    expect((await real.read())!.session.answers[it0.id]).toBe("2");
  });
  it("a second tab with a stale revision cannot overwrite the rehearsal (REVISION_CONFLICT)", async () => {
    const name = db();
    const a = await boot(createExamRepository(name));
    a.send({ type: "START", blueprintId: ids[0]!, minutes: 0, now: T0, sessionId: "sess-ux6" });
    await settled(a);
    const b = await boot(createExamRepository(name));
    b.send({ type: "GOTO", index: 1, now: T0 + 1000 });
    await settled(b);
    a.send({ type: "GOTO", index: 2, now: T0 + 2000 });
    await waitFor(a, s => s.matches("saveError"));
    expect(a.getSnapshot().context.error).toBe("REVISION_CONFLICT");
  });
});
