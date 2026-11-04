import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { inspectSpeakingReceipt } from "@hospodar/domain";
// @ts-expect-error legacy JS module without types
import * as legacy from "../../../../app/exam-voice-store.mjs";
import { createVoiceStore, normaliseVoiceMime, voiceKey } from "./voiceStore.ts";

const name = () => "voice-" + Math.random().toString(16).slice(2);
const T = new Date("2026-11-04T10:00:00Z");
const clip = (n = 64) => new Uint8Array(Array.from({ length: n }, (_, i) => (i * 7) % 256)).buffer;
const input = (over = {}) => ({ sessionId: "sess-v1", taskId: "speak-1", data: clip(), mimeType: "audio/webm;codecs=opus", durationMs: 4321.4, revision: 3, now: T, ...over });

describe("E06 voice store (apps/web) — parity with app/exam-voice-store.mjs", () => {
  it("issues exactly the legacy receipt for the same bytes, and it passes the E06 contract", async () => {
    const ours = await createVoiceStore(name()).saveClip(input());
    const theirs = await legacy.saveVoiceClip(legacy.createMemoryVoiceStore(), input());
    expect(ours).toEqual({ ...theirs });
    expect(inspectSpeakingReceipt(ours, { sessionId: "sess-v1", taskId: "speak-1" }).valid).toBe(true);
  });
  it("mime normalisation and keys match legacy; unknown formats and bad ids are refused, not guessed", () => {
    for (const m of ["audio/webm;codecs=opus", "AUDIO/OGG", "audio/mp4", "audio/wav"]) expect(normaliseVoiceMime(m)).toBe(legacy.normalizeVoiceMime(m));
    for (const m of ["video/webm", "", "audio/mpeg"]) expect(() => normaliseVoiceMime(m)).toThrow(/Unsupported/);
    expect(voiceKey("sess-v1", "speak-1")).toBe(legacy.voiceKey("sess-v1", "speak-1"));
    expect(() => voiceKey("a", "speak-1")).toThrow();
  });
  it("refuses empty, durationless or revisionless recordings — no receipt, nothing claimed", async () => {
    const store = createVoiceStore(name());
    await expect(store.saveClip(input({ data: new ArrayBuffer(0) }))).rejects.toMatchObject({ code: "NO_AUDIO_BYTES" });
    await expect(store.saveClip(input({ durationMs: 0 }))).rejects.toMatchObject({ code: "NO_DURATION" });
    await expect(store.saveClip(input({ revision: 0 }))).rejects.toMatchObject({ code: "NO_REVISION" });
    expect(await store.count()).toBe(0);
  });
  it("verifyClip re-checks bytes after reopen; a missing clip is not verified", async () => {
    const db = name();
    const r = await createVoiceStore(db).saveClip(input());
    const again = createVoiceStore(db);
    const ok = await again.verifyClip(r);
    expect([ok.verified, ok.mimeType, ok.data!.byteLength]).toEqual([true, "audio/webm", 64]);
    expect((await again.verifyClip({ ...r, sha256: "0".repeat(64) })).verified).toBe(false);
    await again.deleteClip(r);
    expect((await again.verifyClip(r)).verified).toBe(false);
  });
  it("pruneSession removes orphans of one session only; eraseAll empties the store", async () => {
    const store = createVoiceStore(name());
    const keep = await store.saveClip(input());
    await store.saveClip(input({ taskId: "speak-2" }));
    await store.saveClip(input({ sessionId: "sess-other" }));
    expect(await store.pruneSession("sess-v1", [keep.storageKey])).toBe(1);
    expect(await store.count()).toBe(2);
    await store.eraseAll();
    expect(await store.count()).toBe(0);
  });
});
