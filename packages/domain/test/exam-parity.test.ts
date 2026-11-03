/**
 * EXAM pure-policy parity: packages/domain/src/exam.ts must behave exactly like the running legacy
 * app/exam-core.mjs (+ inspectSpeakingReceipt from app/e06-speaking-evidence-policy.mjs) on the same inputs.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
// @ts-expect-error legacy JS module without types
import * as legacy from "../../../app/exam-core.mjs";
// @ts-expect-error legacy JS module without types
import * as e06 from "../../../app/e06-speaking-evidence-policy.mjs";
import * as d from "../src/index.ts";

const root = new URL("../../../", import.meta.url);
const json = (p: string) => JSON.parse(readFileSync(new URL(p, root), "utf8"));
const blueprints = json("learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json").blueprints;
const content = { reading: json("learning/exercises/b1/contextual/reading-pack-v1.json"), listening: json("learning/exercises/b1/audio-long/lessons.json"),
  baseline: json("learning/exercises/b1/diagnostics/baseline-v1.json") };
const T0 = new Date("2026-11-03T10:00:00Z");
const at = (ms: number) => new Date(T0.getTime() + ms);
const receipt = (sessionId: string, taskId: string, over: Record<string, unknown> = {}) => ({ sessionId, taskId, storageKey: `local-audio:${sessionId}-${taskId}`,
  sha256: "a".repeat(64), bytes: 1200, durationMs: 4000, mimeType: "audio/webm", revision: 1, consentToLocalStorage: true,
  firstAttemptSealed: true, committedAt: T0.toISOString(), ...over });
/** Run the same operation on both implementations; compare result or thrown message. */
const both = (f: (m: typeof d) => unknown) => {
  const run = (m: typeof d) => { try { return { ok: f(m) }; } catch (e) { return { err: (e as Error).message, code: (e as { code?: string }).code } } };
  expect(run(d)).toEqual(run(legacy as typeof d));
};

describe("EXAM pure policies: TS port ≡ legacy exam-core.mjs", () => {
  it("constants", () => {
    expect([d.EXAM_STORAGE_KEY, d.EXAM_STATE_VERSION, d.MAX_ANSWER_CHARS, [...d.PRACTICE_LIMITS_MINUTES], d.DEADLINE_EXPIRED])
      .toEqual([legacy.EXAM_STORAGE_KEY, legacy.EXAM_STATE_VERSION, legacy.MAX_ANSWER_CHARS, legacy.PRACTICE_LIMITS_MINUTES, legacy.DEADLINE_EXPIRED]);
  });
  it("buildItems on both real blueprints + malformed blueprints", () => {
    for (const b of blueprints) both(m => m.buildItems(b, content));
    both(m => m.buildItems({ skill_blocks: [] }, content));
    both(m => m.buildItems({ skill_blocks: [{ ...blueprints[0].skill_blocks[0], item_id: "missing" }, ...blueprints[0].skill_blocks.slice(1)] }, content));
  });
  it("createSession / loadSession incl. corrupt, legacy and receipt-bearing states", () => {
    const ids = blueprints.map((b: { id: string }) => b.id);
    for (const min of [0, 15, 30, 60, 7]) both(m => m.createSession(ids[0], min, T0, "sess-1"));
    both(m => m.createSession("nope", 0, T0));
    const s = d.createSession(ids[0], 15, T0, "sess-1");
    const withVoice = { ...d.setVoiceConsent(s, true), voiceReceipts: { "d-s1": receipt("sess-1", "d-s1"), "d-w1": receipt("other", "d-w1") }, voiceRecorded: { "d-s1": true } };
    for (const raw of [JSON.stringify(s), JSON.stringify(withVoice), JSON.stringify({ ...s, sessionId: undefined }), JSON.stringify({ ...s, elapsedHighWaterMs: 99e9 }),
      JSON.stringify({ ...s, answers: { ok: "x", "bad id!": "y", n: 3 } }), "{", "null", "", JSON.stringify({ ...s, version: 2 }), JSON.stringify({ ...s, index: 101 })])
      both(m => m.loadSession(raw, ids));
  });
  it("timer: remaining, expiry, monotonic watermark, deadline refusal of commands", () => {
    const s = d.createSession(blueprints[0].id, 15, T0, "sess-2");
    for (const ms of [0, 1, 59_999, 899_999, 900_000, 2e6, -60_000]) {
      both(m => m.remainingSeconds(s, at(ms)));
      both(m => m.isPracticeExpired(s, at(ms)));
      both(m => m.writeAnswer(s, "q1", "x".repeat(13000), at(ms)));
      both(m => m.goToIndex(s, 2, 5, at(ms)));
    }
    for (const w of [0, 10, 5, 2e6, -1, Number.NaN]) both(m => m.withElapsedHighWater(m.withElapsedHighWater(s, 100), w));
    both(m => m.remainingSeconds(m.withElapsedHighWater(s, 600_000), at(-3_600_000)));   // clock moved back
    both(m => m.goToIndex(s, 9, 5, T0));
    both(m => m.writeAnswer(m.finishSession(s, T0), "q1", "x", T0));
  });
  it("voice: consent, receipts, removal, evidence; E06 receipt inspection", () => {
    const s = d.createSession(blueprints[0].id, 0, T0, "sess-3");
    both(m => m.attachVoiceReceipt(s, "d-s1", receipt("sess-3", "d-s1"), T0));                       // no consent
    const c = d.setVoiceConsent(s, true);
    for (const over of [{}, { sha256: "x" }, { bytes: 0 }, { mimeType: "audio/mp3" }, { sessionId: "zzz" }, { firstAttemptSealed: false }, { committedAt: "nope" }])
      both(m => m.attachVoiceReceipt(c, "d-s1", receipt("sess-3", "d-s1", over), T0));
    const v = d.attachVoiceReceipt(c, "d-s1", receipt("sess-3", "d-s1"), T0);
    both(m => [m.voiceEvidenceOf(v, "d-s1"), m.voiceEvidenceOf(m.recordVoiceEvidence(s, "x", true, T0), "x"), m.voiceEvidenceOf(s, "x")]);
    both(m => m.removeVoiceReceipt(v, "d-s1"));
    for (const r of [null, [], {}, receipt("sess-3", "d-s1"), receipt("sess-3", "d-s1", { revision: 0, durationMs: -1 })])
      expect(d.inspectSpeakingReceipt(r, { sessionId: "sess-3", taskId: "d-s1" })).toEqual(e06.inspectSpeakingReceipt(r, { sessionId: "sess-3", taskId: "d-s1" }));
  });
  it("scoreSession: refused before finish; same objective/ungraded/unanswered counts after; never a grade", () => {
    for (const b of blueprints) {
      const items = d.buildItems(b, content);
      let s = d.createSession(b.id, 0, T0, "sess-4");
      both(m => m.scoreSession(items, s));
      items.forEach((it, i) => { if (i % 3 !== 2) s = d.writeAnswer(s, it.id, it.kind === "text" ? "Vastaus." : String(i % 2 ? it.correct : "0"), T0); });
      s = d.finishSession(s, at(1000));
      both(m => m.scoreSession(items, s));
      const r = d.scoreSession(items, s);
      expect([r.officialGrade, r.ykiPassPrediction]).toEqual([null, null]);
    }
  });
});
