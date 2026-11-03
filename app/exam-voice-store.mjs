/** E06-C1 local speaking evidence for the practice EXAM (Web).
 *
 * Stores the learner's recorded answer bytes ONLY after explicit consent, in a separate
 * IndexedDB database on this device (never uploaded, never in the exam event store),
 * then reads the bytes back and verifies size + SHA-256 before issuing a receipt.
 * A receipt is metadata; `verifyVoiceClip` must re-check the stored bytes on resume.
 * This is NOT an official YKI recording system and produces no grade.
 */
export const VOICE_DB_NAME = "hospodar-yki:exam-voice:v1";
export const VOICE_MIME_TYPES = Object.freeze(["audio/webm", "audio/ogg", "audio/mp4", "audio/wav"]);
export const MAX_VOICE_BYTES = 25 * 1024 * 1024; // ~25 MB per answer; far above a few minutes of Opus
const STORE = "clips";
const ID = /^[a-zA-Z0-9_-]{3,60}$/;

export class VoiceStoreError extends Error {
  constructor(code, message) { super(message); this.name = "VoiceStoreError"; this.code = code; }
}

/** "audio/webm;codecs=opus" → "audio/webm"; unknown containers are refused, not guessed. */
export function normalizeVoiceMime(mime) {
  const base = String(mime || "").split(";")[0].trim().toLowerCase();
  if (!VOICE_MIME_TYPES.includes(base))
    throw new VoiceStoreError("UNSUPPORTED_AUDIO_FORMAT", "Unsupported recording format");
  return base;
}
export function voiceKey(sessionId, taskId) {
  if (!ID.test(sessionId || "") || !ID.test(taskId || ""))
    throw new VoiceStoreError("INVALID_KEY", "Invalid session or task identifier");
  return `${sessionId}_${taskId}`;
}
export async function sha256Hex(bytes) {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}
async function toArrayBuffer(data) {
  if (data instanceof ArrayBuffer) return data.slice(0);
  if (ArrayBuffer.isView(data)) return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  if (data && typeof data.arrayBuffer === "function") return data.arrayBuffer();
  throw new VoiceStoreError("NO_AUDIO_BYTES", "Recording has no readable bytes");
}

/** Deterministic in-memory store for Node tests; same contract as IndexedDB. */
export function createMemoryVoiceStore({ failPut = () => false } = {}) {
  const rows = new Map();
  return {
    async put(row) {
      if (failPut(row)) throw new VoiceStoreError("QUOTA_OR_DISK_FULL", "Simulated write failure");
      rows.set(row.key, { ...row, bytes: row.bytes.slice(0) });
    },
    async get(key) { const r = rows.get(key); return r ? { ...r, bytes: r.bytes.slice(0) } : null; },
    async delete(key) { rows.delete(key); },
    async deleteSession(sessionId) { for (const k of [...rows.keys()]) if (k.startsWith(sessionId + "_")) rows.delete(k); },
    _rows: rows,
  };
}

function request(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function mapIdbError(error) {
  if (error instanceof VoiceStoreError) return error;
  const quota = error?.name === "QuotaExceededError";
  return new VoiceStoreError(quota ? "QUOTA_OR_DISK_FULL" : "SAVE_FAILED", error?.message || "IndexedDB failure");
}

export function createIndexedDbVoiceStore({ dbName = VOICE_DB_NAME, indexedDB = globalThis.indexedDB } = {}) {
  if (!indexedDB) throw new VoiceStoreError("STORAGE_UNAVAILABLE", "IndexedDB is not available");
  let dbPromise = null;
  const open = () => dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName, 1);
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: "key" }); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => { dbPromise = null; reject(mapIdbError(req.error)); };
    req.onblocked = () => { dbPromise = null; reject(new VoiceStoreError("STORAGE_BLOCKED", "Voice database is blocked by another tab")); };
  });
  const tx = async (mode, work) => {
    const db = await open();
    return new Promise((resolve, reject) => {
      let result;
      const t = db.transaction(STORE, mode);
      t.oncomplete = () => resolve(result);          // durable only after complete
      t.onerror = () => reject(mapIdbError(t.error));
      t.onabort = () => reject(mapIdbError(t.error));
      Promise.resolve(work(t.objectStore(STORE))).then(v => { result = v; }, e => { t.abort(); reject(mapIdbError(e)); });
    });
  };
  return {
    put: row => tx("readwrite", s => request(s.put(row))),
    get: key => tx("readonly", s => request(s.get(key))).then(r => r || null),
    delete: key => tx("readwrite", s => request(s.delete(key))),
    deleteSession: sessionId => tx("readwrite", s => request(s.delete(
      globalThis.IDBKeyRange.bound(sessionId + "_", sessionId + "_￿")))),
  };
}

/** Persist, read back, verify bytes + hash, then return a receipt for the exam session. */
export async function saveVoiceClip(store, { sessionId, taskId, data, mimeType, durationMs, revision, now = new Date() }) {
  const key = voiceKey(sessionId, taskId);
  const mime = normalizeVoiceMime(mimeType);
  const bytes = await toArrayBuffer(data);
  if (bytes.byteLength <= 0) throw new VoiceStoreError("NO_AUDIO_BYTES", "Recording is empty (0 bytes)");
  if (bytes.byteLength > MAX_VOICE_BYTES) throw new VoiceStoreError("TOO_LARGE", "Recording is too large to keep locally");
  if (!Number.isFinite(durationMs) || durationMs <= 0) throw new VoiceStoreError("NO_DURATION", "Recording has no duration");
  if (!Number.isSafeInteger(revision) || revision < 1) throw new VoiceStoreError("NO_REVISION", "Missing commit revision");
  const sha256 = await sha256Hex(bytes);
  const savedAt = now.toISOString();
  await store.put({ key, sessionId, taskId, bytes, mimeType: mime, size: bytes.byteLength, sha256, durationMs: Math.round(durationMs), savedAt });
  const back = await store.get(key);
  if (!back || back.bytes.byteLength !== bytes.byteLength || (await sha256Hex(back.bytes)) !== sha256)
    throw new VoiceStoreError("READBACK_FAILED", "Stored recording could not be verified");
  return Object.freeze({
    sessionId, taskId, storageKey: "local-audio:" + key, sha256, bytes: bytes.byteLength,
    durationMs: Math.round(durationMs), mimeType: mime, revision,
    consentToLocalStorage: true, firstAttemptSealed: true, committedAt: savedAt,
  });
}

/** Re-check that the bytes behind a receipt still exist and match. Never throws on mismatch. */
export async function verifyVoiceClip(store, receipt) {
  const none = { storedBytesVerified: false, storedHashVerified: false, data: null, mimeType: null };
  if (!receipt || typeof receipt.storageKey !== "string" || !receipt.storageKey.startsWith("local-audio:")) return none;
  let row;
  try { row = await store.get(receipt.storageKey.slice("local-audio:".length)); } catch { return none; }
  if (!row || !row.bytes) return none;
  const storedBytesVerified = row.bytes.byteLength === receipt.bytes && row.bytes.byteLength > 0;
  const storedHashVerified = storedBytesVerified && (await sha256Hex(row.bytes)) === receipt.sha256;
  return { storedBytesVerified, storedHashVerified, data: storedHashVerified ? row.bytes : null, mimeType: row.mimeType };
}
