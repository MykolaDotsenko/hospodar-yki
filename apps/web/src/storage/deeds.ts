/**
 * Private real-life deed marks on this device (real-world-interaction). Separate from learner progress: never exported,
 * never counted; erased together with LEARN data. Every write is read back; a failed write is reported, never faked.
 */
import { emptyDeedLog, parseDeedLog, type DeedLog } from "@hospodar/domain";

export const DEEDS_KEY = "hospodar-yki:web:deeds:v1";

export function readDeeds(): DeedLog {
  try { const raw = localStorage.getItem(DEEDS_KEY); return raw ? parseDeedLog(JSON.parse(raw)) : emptyDeedLog(); }
  catch { return emptyDeedLog(); }
}

/** Throws when the browser refused the write or read back something else. */
export function writeDeeds(log: DeedLog): void {
  const text = JSON.stringify(log);
  localStorage.setItem(DEEDS_KEY, text);
  if (localStorage.getItem(DEEDS_KEY) !== text) throw new Error("READBACK_MISMATCH");
}

/**
 * Apply one change to what is stored NOW (never to a copy a screen read earlier), so a second tab or an erase in
 * another tab is never overwritten or resurrected. localStorage calls are synchronous; read-change-write runs in one task.
 */
export function updateDeeds(change: (current: DeedLog) => DeedLog): DeedLog {
  const next = change(readDeeds());
  writeDeeds(next);
  return next;
}

/** Calls back when another tab changes or clears the marks (the `storage` event fires only in other tabs). */
export function onDeedsChanged(cb: () => void): () => void {
  const f = (e: StorageEvent) => { if (e.key === DEEDS_KEY || e.key === null) cb(); };
  addEventListener("storage", f);
  return () => removeEventListener("storage", f);
}

export const hasDeeds = () => Object.keys(readDeeds().done).length > 0;

/** Throws when the marks are still there afterwards. */
export function clearDeeds(): void {
  localStorage.removeItem(DEEDS_KEY);
  if (localStorage.getItem(DEEDS_KEY) !== null) throw new Error("DELETE_NOT_VERIFIED");
}
