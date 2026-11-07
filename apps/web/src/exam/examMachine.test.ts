import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { createActor, waitFor } from "xstate";
import { finishSession, scoreSession, voiceEvidenceOf, type SpeakingReceipt } from "@hospodar/domain";
import { createExamMachine, type VoiceCleanup } from "./examMachine.ts";
import { createExamRepository, type ExamRepository } from "../storage/examRepository.ts";
import { StorageError } from "../storage/learnerRepository.ts";
import { examBlueprints, itemsFor } from "../content/exam.ts";

const T0 = Date.parse("2026-11-03T10:00:00Z");
const ids = examBlueprints.map(b => b.id);
const db = () => "exam-test-" + Math.random().toString(16).slice(2);
const boot = async (repo: ExamRepository) => {
  const a = createActor(createExamMachine(repo, itemsFor, ids, "test-v1")).start();
  await waitFor(a, s => !s.matches("loading"));
  return a;
};
const settled = (a: ReturnType<typeof createActor>) => waitFor(a, s => !["saving", "finishing", "autosaving", "clearing"].some(x => s.matches(x)));

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
    const repo: ExamRepository = { ...real, commit: (s, r, k) => fail ? Promise.reject(new StorageError("QUOTA_OR_DISK_FULL", "full")) : real.commit(s, r, k) };
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
  it("EXAM-03: a chosen subset (speaking only) contains exactly those items and survives a reload", async () => {
    const name = db();
    const a = await boot(createExamRepository(name));
    a.send({ type: "START", blueprintId: ids[0]!, minutes: 0, now: T0, sessionId: "sess-ux7", skills: ["speaking"] });
    await settled(a);
    expect(a.getSnapshot().context.items.map(i => i.skill)).toEqual(["speaking"]);
    const b = await boot(createExamRepository(name));
    expect(b.getSnapshot().context.skills).toEqual(["speaking"]);
    expect(b.getSnapshot().context.items.map(i => i.skill)).toEqual(["speaking"]);
    a.send({ type: "START", blueprintId: ids[0]!, minutes: 0, now: T0, sessionId: "x" });          // ignored outside setup
    expect(a.getSnapshot().context.session!.sessionId).toBe("sess-ux7");
  });
  it("all four skills selected (or none) means the full rehearsal, never a partial claim", async () => {
    const a = await boot(createExamRepository(db()));
    a.send({ type: "START", blueprintId: ids[0]!, minutes: 0, now: T0, sessionId: "sess-ux8", skills: ["reading", "listening", "writing", "speaking"] });
    await settled(a);
    expect(a.getSnapshot().context.skills).toBeNull();
    expect(a.getSnapshot().context.items).toHaveLength(itemsFor(ids[0]!).length);
  });
  it("AUTOSAVE persists typed text without navigation; nothing to save means no write", async () => {
    const name = db(); const repo = createExamRepository(name);
    const a = await boot(repo);
    a.send({ type: "START", blueprintId: ids[0]!, minutes: 0, now: T0, sessionId: "sess-ux9", skills: ["writing"] });
    await settled(a);
    const before = (await repo.read())!.revision;
    a.send({ type: "AUTOSAVE" });
    expect(a.getSnapshot().matches("active")).toBe(true);                                  // not dirty → no write
    const w = a.getSnapshot().context.items[0]!;
    a.send({ type: "ANSWER", itemId: w.id, value: "Hei! Haluaisin tietää kurssista.", now: T0 + 1000 });
    a.send({ type: "AUTOSAVE" });
    await waitFor(a, s => s.matches("active") && !s.context.dirty);
    const cp = (await repo.read())!;
    expect([cp.revision, cp.session.answers[w.id], cp.session.index]).toEqual([before + 1, "Hei! Haluaisin tietää kurssista.", 0]);
  });
  it("EXAM-09: finishing writes the checkpoint and a history record atomically; history outlives a new rehearsal", async () => {
    const repo = createExamRepository(db());
    const a = await boot(repo);
    a.send({ type: "START", blueprintId: ids[0]!, minutes: 0, now: T0, sessionId: "sess-ux10", skills: ["reading"] });
    await settled(a);
    const r0 = a.getSnapshot().context.items[0]!;
    a.send({ type: "ANSWER", itemId: r0.id, value: String(r0.correct), now: T0 + 1000 });
    a.send({ type: "REQUEST_FINISH" });
    a.send({ type: "CONFIRM_FINISH", now: T0 + 2000 });
    await settled(a);
    await waitFor(a, s => s.matches("finished"));
    const [h] = await repo.history();
    expect(h).toMatchObject({ sessionId: "sess-ux10", contentVersion: "test-v1", skills: ["reading"] });
    expect(h!.bySkill.reading.correct).toBe(1);
    expect(JSON.stringify(h)).not.toMatch(/officialGrade|ykiPass|predict|level|\bgrade\b/i);
    a.send({ type: "NEW_REHEARSAL" });
    await waitFor(a, s => s.matches("setup"));
    expect(await repo.history()).toHaveLength(1);
  });
  it("a failed finish writes neither the checkpoint nor history; RETRY finishes once", async () => {
    const real = createExamRepository(db());
    let fail = true;
    const repo: ExamRepository = { ...real, finish: (s, r, k, rec) => fail ? Promise.reject(new StorageError("SAVE_FAILED", "x")) : real.finish(s, r, k, rec) };
    const a = await boot(repo);
    a.send({ type: "START", blueprintId: ids[0]!, minutes: 0, now: T0, sessionId: "sess-ux11", skills: ["writing"] });
    await settled(a);
    a.send({ type: "REQUEST_FINISH" }); a.send({ type: "CONFIRM_FINISH", now: T0 + 1000 });
    await waitFor(a, s => s.matches("saveError"));
    expect((await real.read())!.session.finishedAt).toBeNull();
    expect(await real.history()).toHaveLength(0);
    fail = false;
    a.send({ type: "RETRY" });
    await waitFor(a, s => s.matches("finished"));
    expect(await real.history()).toHaveLength(1);
  });
});

describe("EXAM voice (E06) in the XState machine", () => {
  const T = T0 + 1000;
  const receiptFor = (sessionId: string, taskId: string, revision: number): SpeakingReceipt => ({ sessionId, taskId, storageKey: `local-audio:${sessionId}_${taskId}`,
    sha256: "a".repeat(64), bytes: 1200, durationMs: 3000, mimeType: "audio/webm", revision, consentToLocalStorage: true, firstAttemptSealed: true,
    committedAt: new Date(T).toISOString() });
  const speaking = async (repo: ExamRepository, voice: VoiceCleanup | null = null) => {
    const a = createActor(createExamMachine(repo, itemsFor, ids, "test-v1", voice)).start();
    await waitFor(a, s => !s.matches("loading"));
    a.send({ type: "START", blueprintId: ids[0]!, minutes: 0, now: T0, sessionId: "sess-voice1", skills: ["speaking"] });
    await settled(a);
    return { a, item: a.getSnapshot().context.items[0]! };
  };
  it("a receipt is refused without persisted consent; with consent it is committed and survives reload as 'stored'", async () => {
    const name = db(); const repo = createExamRepository(name);
    const { a, item } = await speaking(repo);
    a.send({ type: "VOICE_STORED", itemId: item.id, receipt: receiptFor("sess-voice1", item.id, 2), now: T });
    expect(a.getSnapshot().context.session!.voiceReceipts).toEqual({});                      // no consent → ignored
    a.send({ type: "CONSENT", consent: true, now: T });
    await settled(a);
    expect((await repo.read())!.session.voiceConsent).toBe(true);
    a.send({ type: "VOICE_STORED", itemId: item.id, receipt: receiptFor("sess-voice1", item.id, a.getSnapshot().context.revision + 1), now: T });
    await settled(a);
    const b = await boot(createExamRepository(name));
    expect(voiceEvidenceOf(b.getSnapshot().context.session!, item.id)).toBe("stored");
  });
  it("an unconsented recording is ephemeral: it counts on this page, but not after a reload", async () => {
    const name = db(); const repo = createExamRepository(name);
    const { a, item } = await speaking(repo);
    a.send({ type: "VOICE_EPHEMERAL", itemId: item.id, now: T });
    expect(voiceEvidenceOf(a.getSnapshot().context.session!, item.id)).toBe("ephemeral");
    a.send({ type: "AUTOSAVE" });
    await waitFor(a, s => s.matches("active") && !s.context.dirty);
    const b = await boot(createExamRepository(name));
    expect(voiceEvidenceOf(b.getSnapshot().context.session!, item.id)).toBeNull();
  });
  it("receipts for a wrong session or a non-speaking item are refused; consent cannot be withdrawn while recordings exist", async () => {
    const { a, item } = await speaking(createExamRepository(db()));
    a.send({ type: "CONSENT", consent: true, now: T }); await settled(a);
    a.send({ type: "VOICE_STORED", itemId: item.id, receipt: receiptFor("sess-other", item.id, 9), now: T });
    expect(a.getSnapshot().context.session!.voiceReceipts).toEqual({});
    a.send({ type: "VOICE_STORED", itemId: item.id, receipt: receiptFor("sess-voice1", item.id, 3), now: T }); await settled(a);
    a.send({ type: "CONSENT", consent: false, now: T });
    expect(a.getSnapshot().context.session!.voiceConsent).toBe(true);
    a.send({ type: "VOICE_REMOVED", itemId: item.id, now: T }); await settled(a);
    a.send({ type: "CONSENT", consent: false, now: T }); await settled(a);
    expect(a.getSnapshot().context.session!.voiceConsent).toBe(false);
  });
  it("a receipt whose bytes no longer verify is dropped and the drop is persisted", async () => {
    const repo = createExamRepository(db());
    const { a, item } = await speaking(repo);
    a.send({ type: "CONSENT", consent: true, now: T }); await settled(a);
    a.send({ type: "VOICE_STORED", itemId: item.id, receipt: receiptFor("sess-voice1", item.id, 3), now: T }); await settled(a);
    a.send({ type: "VOICE_UNVERIFIED", itemId: item.id }); await settled(a);
    expect((await repo.read())!.session.voiceReceipts).toEqual({});
    expect(scoreSession(a.getSnapshot().context.items, finishSession(a.getSnapshot().context.session!, new Date(T))).bySkill.speaking.unanswered).toBe(1);
  });
  it("a new rehearsal deletes the finished session's recordings before clearing the checkpoint", async () => {
    const pruned: string[] = [];
    const { a } = await speaking(createExamRepository(db()), { pruneSession: async id => { pruned.push(id); return 1; } });
    a.send({ type: "REQUEST_FINISH" }); a.send({ type: "CONFIRM_FINISH", now: T }); await settled(a);
    a.send({ type: "NEW_REHEARSAL" });
    await waitFor(a, s => s.matches("setup"));
    expect(pruned).toEqual(["sess-voice1"]);
  });
});


describe("E07: composition-safe Finnish writing", () => {
  it("never autosaves an unfinished IME composition, navigates or finishes; exact Unicode is committed on compositionend", async () => {
    const name = db(), repo = createExamRepository(name), a = await boot(repo);
    a.send({ type: "START", blueprintId: ids[0]!, minutes: 0, now: T0, sessionId: "sess-e07-ime", skills: ["writing"] });
    await settled(a);
    const item = a.getSnapshot().context.items[0]!;
    expect(item.skill).toBe("writing");
    const rev = (await repo.read())!.revision;
    a.send({ type: "COMPOSE_START", itemId: item.id });
    a.send({ type: "ANSWER", itemId: item.id, value: "partial", now: T0 + 1000 });
    a.send({ type: "AUTOSAVE" });
    a.send({ type: "GOTO", index: 0, now: T0 + 1000 });
    a.send({ type: "REQUEST_FINISH" });
    expect(a.getSnapshot().matches("active")).toBe(true);
    expect(a.getSnapshot().context.composingItemId).toBe(item.id);
    expect((await repo.read())!.revision).toBe(rev);
    expect((await repo.read())!.session.answers[item.id]).toBeUndefined();
    const exact = "Hyvää päivää! Kävin Töölössä. ysta\u0308vä ja äiti.";
    a.send({ type: "COMPOSE_END", itemId: "wrong-item", value: "bad", now: T0 + 1100 });
    expect(a.getSnapshot().context.composingItemId).toBe(item.id);
    a.send({ type: "COMPOSE_END", itemId: item.id, value: exact, now: T0 + 1200 });
    expect(a.getSnapshot().context.composingItemId).toBeNull();
    expect(a.getSnapshot().context.session!.answers[item.id]).toBe(exact);
    a.send({ type: "AUTOSAVE" });
    await waitFor(a, s => s.matches("active") && !s.context.dirty);
    expect((await repo.read())!.session.answers[item.id]).toBe(exact);
    const reopened = await boot(createExamRepository(name));
    expect(reopened.getSnapshot().context.session!.answers[item.id]).toBe(exact);
    a.send({ type: "REQUEST_FINISH" });
    expect(a.getSnapshot().matches("confirming")).toBe(true);
    a.send({ type: "CONFIRM_FINISH", now: T0 + 2000 });
    await waitFor(a, s => s.matches("finished"));
    expect((await repo.read())!.session.answers[item.id]).toBe(exact);
    expect((await repo.history())[0]!.bySkill.writing.ungraded).toBe(1);
  });
  it("refuses composition claims on unrelated/non-writing items", async () => {
    const repo = createExamRepository(db()), a = await boot(repo);
    a.send({ type: "START", blueprintId: ids[0]!, minutes: 0, now: T0, sessionId: "sess-e07-guards", skills: ["reading"] });
    await settled(a);
    const id = a.getSnapshot().context.items[0]!.id;
    a.send({ type: "COMPOSE_START", itemId: id });
    expect(a.getSnapshot().context.composingItemId).toBeNull();
    a.send({ type: "COMPOSE_END", itemId: id, value: "bad", now: T0 + 1000 });
    expect(a.getSnapshot().context.session!.answers[id]).toBeUndefined();
  });
  it("edits made during an in-flight autosave remain dirty, including completed composition", async () => {
    const name = db(), actual = createExamRepository(name);
    let release: (() => void) | undefined;
    let delay = false;
    const repo: ExamRepository = { ...actual, commit: async (s, r, skills) => {
      if (delay) { delay = false; await new Promise<void>(resolve => { release = resolve; }); }
      return actual.commit(s, r, skills);
    } };
    const a = await boot(repo);
    a.send({ type: "START", blueprintId: ids[0]!, minutes: 0, now: T0, sessionId: "sess-e07-race", skills: ["writing"] });
    await settled(a);
    const id = a.getSnapshot().context.items[0]!.id;
    a.send({ type: "ANSWER", itemId: id, value: "Old", now: T0 + 1000 });
    delay = true;
    a.send({ type: "AUTOSAVE" });
    expect(a.getSnapshot().matches("autosaving")).toBe(true);
    a.send({ type: "COMPOSE_START", itemId: id });
    const exact = "Uusi teksti: yö, ä, ö.";
    a.send({ type: "COMPOSE_END", itemId: id, value: exact, now: T0 + 2000 });
    expect(a.getSnapshot().context.dirty).toBe(true);
    release?.();
    await waitFor(a, s => s.matches("active"));
    expect(a.getSnapshot().context.dirty).toBe(true);
    a.send({ type: "AUTOSAVE" });
    await waitFor(a, s => s.matches("active") && !s.context.dirty);
    expect((await actual.read())!.session.answers[id]).toBe(exact);
  });
});
