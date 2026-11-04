/**
 * E06 speaking evidence for the apps/web practice EXAM — TS/Dexie port of app/exam-voice-store.mjs (parity-tested).
 *
 * The learner's recorded answer is kept ONLY after explicit consent, in a SEPARATE IndexedDB database on this device
 * (never uploaded, never inside the exam checkpoint or LEARN data). Bytes are written, read back and verified
 * (size + SHA-256) BEFORE a receipt exists; the checkpoint then stores only the receipt (metadata).
 * On resume `verifyClip` re-checks the bytes — a missing or changed clip never keeps counting as a spoken answer.
 * No grade is produced: audio is reviewable by a human only (E06 REVIEWABLE_AUDIO_UNGRADED).
 */
import Dexie, { type Table } from "dexie";
import { inspectSpeakingReceipt, type SpeakingReceipt } from "@hospodar/domain";

export const VOICE_DB_NAME = "hospodar-yki:web-exam-voice:v1";
export const VOICE_MIME_TYPES = ["audio/webm", "audio/ogg", "audio/mp4", "audio/wav"] as const;
export const MAX_VOICE_BYTES = 25 * 1024 * 1024;
const ID = /^[a-zA-Z0-9_-]{3,60}$/;

export type VoiceErrorCode = "UNSUPPORTED_AUDIO_FORMAT" | "INVALID_KEY" | "NO_AUDIO_BYTES" | "TOO_LARGE" | "NO_DURATION" | "NO_REVISION" |
  "QUOTA_OR_DISK_FULL" | "SAVE_FAILED" | "READBACK_FAILED" | "INVALID_RECEIPT" | "DELETE_NOT_VERIFIED";
export class VoiceStoreError extends Error {
  constructor(public readonly code: VoiceErrorCode, message: string) { super(message); this.name = "VoiceStoreError"; }
}

/** "audio/webm;codecs=opus" → "audio/webm"; unknown containers are refused, not guessed. */
export function normaliseVoiceMime(mime: string): string {
  const base = String(mime || "").split(";")[0]!.trim().toLowerCase();
  if (!(VOICE_MIME_TYPES as readonly string[]).includes(base)) throw new VoiceStoreError("UNSUPPORTED_AUDIO_FORMAT", "Unsupported recording format");
  return base;
}
export function voiceKey(sessionId: string, taskId: string): string {
  if (!ID.test(sessionId || "") || !ID.test(taskId || "")) throw new VoiceStoreError("INVALID_KEY", "Invalid session or task identifier");
  return `${sessionId}_${taskId}`;
}
export async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, "0")).join("");
}
async function toArrayBuffer(data: Blob | ArrayBuffer | ArrayBufferView): Promise<ArrayBuffer> {
  if (data instanceof ArrayBuffer) return data.slice(0);
  if (ArrayBuffer.isView(data)) return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  if (data && typeof (data as Blob).arrayBuffer === "function") return (data as Blob).arrayBuffer();
  throw new VoiceStoreError("NO_AUDIO_BYTES", "Recording has no readable bytes");
}

interface ClipRow { key: string; sessionId: string; taskId: string; bytes: ArrayBuffer; mimeType: string; size: number; sha256: string; durationMs: number; savedAt: string }
class VoiceDb extends Dexie {
  clips!: Table<ClipRow, string>;
  constructor(name: string) { super(name); this.version(1).stores({ clips: "key, sessionId" }); }
}
const mapError = (e: unknown) => e instanceof VoiceStoreError ? e :
  new VoiceStoreError(((e as { inner?: { name?: string }; name?: string })?.inner?.name ?? (e as { name?: string })?.name) === "QuotaExceededError"
    ? "QUOTA_OR_DISK_FULL" : "SAVE_FAILED", String((e as Error)?.message ?? e));
const keyOf = (r: Pick<SpeakingReceipt, "storageKey">) => r.storageKey.slice("local-audio:".length);

export interface VoiceClipInput { sessionId: string; taskId: string; data: Blob | ArrayBuffer | ArrayBufferView; mimeType: string; durationMs: number; revision: number; now?: Date }
export interface VoiceStore {
  /** Persist, read back, verify bytes + hash; only then return a receipt. */
  saveClip(input: VoiceClipInput): Promise<SpeakingReceipt>;
  /** Re-check the bytes behind a receipt. Never throws on mismatch. */
  verifyClip(receipt: SpeakingReceipt): Promise<{ verified: boolean; data: ArrayBuffer | null; mimeType: string | null }>;
  deleteClip(receipt: SpeakingReceipt): Promise<void>;
  /** Remove clips of a session, keeping only the listed storage keys (orphans after a failed checkpoint commit). */
  pruneSession(sessionId: string, keepStorageKeys?: string[]): Promise<number>;
  count(): Promise<number>;
  eraseAll(): Promise<void>;
}

export function createVoiceStore(dbName: string = VOICE_DB_NAME): VoiceStore {
  const db = new VoiceDb(dbName);
  return {
    async saveClip({ sessionId, taskId, data, mimeType, durationMs, revision, now = new Date() }) {
      const key = voiceKey(sessionId, taskId);
      const mime = normaliseVoiceMime(mimeType);
      const bytes = await toArrayBuffer(data);
      if (bytes.byteLength <= 0) throw new VoiceStoreError("NO_AUDIO_BYTES", "Recording is empty (0 bytes)");
      if (bytes.byteLength > MAX_VOICE_BYTES) throw new VoiceStoreError("TOO_LARGE", "Recording is too large to keep locally");
      if (!Number.isFinite(durationMs) || durationMs <= 0) throw new VoiceStoreError("NO_DURATION", "Recording has no duration");
      if (!Number.isSafeInteger(revision) || revision < 1) throw new VoiceStoreError("NO_REVISION", "Missing commit revision");
      const sha256 = await sha256Hex(bytes);
      const savedAt = now.toISOString();
      try {
        await db.transaction("rw", db.clips, () => db.clips.put({ key, sessionId, taskId, bytes, mimeType: mime, size: bytes.byteLength, sha256, durationMs: Math.round(durationMs), savedAt }));
      } catch (e) { throw mapError(e); }
      const back = await db.clips.get(key).catch(() => undefined);
      if (!back || back.bytes.byteLength !== bytes.byteLength || (await sha256Hex(back.bytes)) !== sha256)
        throw new VoiceStoreError("READBACK_FAILED", "Stored recording could not be verified");
      const receipt: SpeakingReceipt = { sessionId, taskId, storageKey: "local-audio:" + key, sha256, bytes: bytes.byteLength,
        durationMs: Math.round(durationMs), mimeType: mime, revision, consentToLocalStorage: true, firstAttemptSealed: true, committedAt: savedAt };
      if (!inspectSpeakingReceipt(receipt, { sessionId, taskId }).valid) throw new VoiceStoreError("INVALID_RECEIPT", "Receipt failed the E06 contract");
      return receipt;
    },
    async verifyClip(receipt) {
      const none = { verified: false, data: null, mimeType: null };
      if (!receipt || typeof receipt.storageKey !== "string" || !receipt.storageKey.startsWith("local-audio:")) return none;
      const row = await db.clips.get(keyOf(receipt)).catch(() => undefined);
      if (!row?.bytes || row.bytes.byteLength !== receipt.bytes || row.bytes.byteLength <= 0) return none;
      return (await sha256Hex(row.bytes)) === receipt.sha256 ? { verified: true, data: row.bytes, mimeType: row.mimeType } : none;
    },
    async deleteClip(receipt) {
      try { await db.clips.delete(keyOf(receipt)); } catch (e) { throw mapError(e); }
      if (await db.clips.get(keyOf(receipt))) throw new VoiceStoreError("DELETE_NOT_VERIFIED", "Recording is still stored");
    },
    async pruneSession(sessionId, keepStorageKeys = []) {
      const keep = new Set(keepStorageKeys.map(k => k.replace(/^local-audio:/, "")));
      try {
        return await db.transaction("rw", db.clips, async () => {
          const doomed = (await db.clips.where("sessionId").equals(sessionId).primaryKeys()).filter(k => !keep.has(k));
          await db.clips.bulkDelete(doomed);
          return doomed.length;
        });
      } catch (e) { throw mapError(e); }
    },
    async count() { return db.clips.count(); },
    async eraseAll() {
      try { await db.clips.clear(); } catch (e) { throw mapError(e); }
      if ((await db.clips.count()) !== 0) throw new VoiceStoreError("DELETE_NOT_VERIFIED", "Some recordings are still stored");
    },
  };
}
