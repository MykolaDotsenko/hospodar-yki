/**
 * Browser-origin storage health, never a guarantee against eviction or device loss.
 * Read-only probes may run on page load; persist() is ONLY invoked from a user click.
 * The usage/quota estimate is for the entire origin, not Hospodar's data alone.
 */
export interface StorageEstimateLike { usage?: number; quota?: number }
export interface StorageApiLike {
  persisted?: () => Promise<boolean>;
  persist?: () => Promise<boolean>;
  estimate?: () => Promise<StorageEstimateLike>;
}
export interface StorageHost { storage?: StorageApiLike }

export interface BrowserStorageReport {
  supported: boolean;
  canRequestPersistence: boolean;
  persistence: "persistent" | "best-effort" | "unknown";
  usageBytes: number | null;
  quotaBytes: number | null;
  headroomBytes: number | null;
  inspectionFailed: boolean;
  /** Approximate advisory only; browsers can reject a write regardless of this estimate. */
  lowHeadroom: boolean;
}
export type PersistenceRequest = "granted" | "denied" | "unsupported" | "unverified" | "error";
const MIB = 1024 * 1024;
export const LOW_HEADROOM_BYTES = 64 * MIB;

function validBytes(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}
function defaultHost(): StorageHost | null {
  return typeof navigator === "undefined" ? null : navigator;
}

/** A failed inspection must not be mistaken for either a grant or a denial. */
export async function inspectBrowserStorage(host: StorageHost | null = defaultHost()): Promise<BrowserStorageReport> {
  const api = host?.storage;
  if (!api) return { supported: false, canRequestPersistence: false, persistence: "unknown", usageBytes: null, quotaBytes: null,
    headroomBytes: null, inspectionFailed: false, lowHeadroom: false };
  let persistence: BrowserStorageReport["persistence"] = "unknown";
  let usageBytes: number | null = null;
  let quotaBytes: number | null = null;
  let inspectionFailed = false;
  // Do not discard valid quota information just because persisted() failed (or vice versa).
  if (typeof api.persisted === "function") {
    try { const verified = await api.persisted();
      persistence = verified === true ? "persistent" : verified === false ? "best-effort" : "unknown"; }
    catch { inspectionFailed = true; }
  }
  if (typeof api.estimate === "function") {
    try {
      const estimate = await api.estimate();
      usageBytes = validBytes(estimate?.usage);
      quotaBytes = validBytes(estimate?.quota);
    } catch { inspectionFailed = true; }
  }
  const headroomBytes = usageBytes !== null && quotaBytes !== null && quotaBytes >= usageBytes
    ? quotaBytes - usageBytes : null;
  return { supported: true, canRequestPersistence: typeof api.persist === "function", persistence, usageBytes, quotaBytes, headroomBytes, inspectionFailed,
    lowHeadroom: headroomBytes !== null && headroomBytes < LOW_HEADROOM_BYTES };
}

/**
 * Permissions may be denied silently; verify the actual persisted() state instead
 * of trusting the persist() return value. Never invoke automatically.
 */
export async function requestPersistentStorage(host: StorageHost | null = defaultHost()): Promise<PersistenceRequest> {
  const api = host?.storage;
  if (!api || typeof api.persist !== "function") return "unsupported";
  try {
    await api.persist();
    if (typeof api.persisted !== "function") return "unverified";
    const verified = await api.persisted();
    return verified === true ? "granted" : verified === false ? "denied" : "unverified";
  } catch { return "error"; }
}

export function formatStorageMiB(bytes: number | null): string | null {
  if (bytes === null || !Number.isFinite(bytes) || bytes < 0) return null;
  return (bytes / MIB).toLocaleString("uk-UA", { maximumFractionDigits: 1 }) + " МіБ";
}

/**
 * Quota errors can be wrapped by Dexie (inner/cause) or reported by Firefox with
 * a non-standard name. Do not misclassify generic AbortError as disk-full.
 */
export function isQuotaFailure(error: unknown): boolean {
  const pending: unknown[] = [error];
  const seen = new Set<object>();
  let inspected = 0;
  while (pending.length && inspected < 8) {
    const node = pending.shift();
    if (!node || typeof node !== "object" || seen.has(node)) continue;
    seen.add(node); inspected++;
    const value = node as { name?: unknown; code?: unknown; inner?: unknown; cause?: unknown };
    if (value.name === "QuotaExceededError" || value.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
        value.code === 22 || value.code === 1014) return true;
    pending.push(value.inner, value.cause);
  }
  return false;
}

/** Actionable and honest guidance; unfinished drafts are NOT in the JSON backup. */
export function writeFailureAdvice(error: unknown): string {
  const code = typeof error === "object" && error !== null
    ? (error as { code?: unknown }).code : null;
  if (code === "QUOTA_OR_DISK_FULL" || isQuotaFailure(error))
    return "Браузеру може бракувати місця. Не закривай сторінку: скопіюй свій незбережений текст, звільни місце й повтори збереження. Незавершені чернетки не входять у JSON-копію.";
  if (code === "REVISION_CONFLICT")
    return "Дані змінилися в іншій вкладці. Не перезаписуй їх: скопіюй незбережений текст і онови застосунок для відновлення підтвердженої версії.";
  if (code === "READ_FAILED" || code === "READBACK_MISMATCH")
    return "Не вдалося підтвердити запис. Він міг відбутися: не надсилай відповідь повторно навмання; перевір прогрес після оновлення сторінки.";
  return "Збереження не підтверджене. Залишайся на сторінці, скопіюй незбережений текст і спробуй знову.";
}
