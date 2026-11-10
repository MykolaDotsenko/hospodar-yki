import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { createSession, finishSession, writeAnswer } from "@hospodar/domain";
import { createExamRepository, type ExamHistoryRecord } from "./examRepository.ts";

const name = () => "exam-repo-" + Math.random().toString(16).slice(2);
const T0 = new Date("2026-11-03T10:00:00Z");
const record = (id: string): ExamHistoryRecord => ({ sessionId: id, blueprintId: "yki-mini-test", contentVersion: "v", skills: null, startedAt: T0.toISOString(),
  finishedAt: T0.toISOString(), timeLimitMinutes: 0, bySkill: { reading: { correct: 0, objective: 0, ungraded: 0, unanswered: 0 },
    listening: { correct: 0, objective: 0, ungraded: 0, unanswered: 0 }, writing: { correct: 0, objective: 0, ungraded: 0, unanswered: 0 },
    speaking: { correct: 0, objective: 0, ungraded: 0, unanswered: 0 } } });

describe("exam repository: erase my exam data (LEARN-16 control)", () => {
  it("erases the current rehearsal and every history record in one step, verified empty after reopen", async () => {
    const db = name();
    const repo = createExamRepository(db);
    const s = createSession("yki-mini-test", 0, T0, "sess-erase1");
    const c1 = await repo.commit(s, 0, null);
    const c2 = await repo.finish(finishSession(s, T0), c1.revision, null, record("s1"));
    await repo.eraseAll(c2.revision);
    const again = createExamRepository(db);
    expect(await again.read()).toBeNull();
    expect(await again.history()).toEqual([]);
  });
  it("a stale revision cannot erase (REVISION_CONFLICT); history is kept", async () => {
    const repo = createExamRepository(name());
    const s = createSession("yki-mini-test", 0, T0, "sess-erase2");
    const c1 = await repo.commit(s, 0, null);
    await repo.finish(finishSession(s, T0), c1.revision, null, record("s2"));
    await expect(repo.eraseAll(c1.revision)).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    expect(await repo.history()).toHaveLength(1);
  });
});


describe("E07 exact Unicode readback of writing checkpoints", () => {
  it("returns a committed revision only after the stored Unicode draft and finished history match", async () => {
    const repo = createExamRepository(name());
    const started = createSession("yki-mini-test", 0, T0, "sess-e07-receipt");
    const created = await repo.commit(started, 0, ["writing"]);
    const exact = "Hyvää päivää! Ysta\u0308vä, äiti, Töölö.";
    const updated = writeAnswer(started, "d-w1", exact, T0);
    const saved = await repo.commit(updated, created.revision, ["writing"]);
    expect((await repo.read())!.session.answers["d-w1"]).toBe(exact);
    expect(saved.revision).toBeGreaterThan(created.revision);
    const finished = finishSession(updated, T0);
    const hist = record("sess-e07-receipt");
    const done = await repo.finish(finished, saved.revision, ["writing"], hist);
    expect(done.session.answers["d-w1"]).toBe(exact);
    expect((await repo.read())!.session.answers["d-w1"]).toBe(exact);
    expect((await repo.history())[0]).toEqual(hist);
  });
});
