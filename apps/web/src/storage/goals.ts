/**
 * The learner's goals and the first-run mark, on this device only (MOT-11: written only when the learner presses a
 * button on the first-run screen or saves «Моя мета»; editable at any time; erased with LEARN data; not part of the
 * data export, like the private deed marks). Every write is read back; a failed write is reported, never faked.
 */
import { parseGoalRecord, type GoalRecord } from "@hospodar/domain";

export const GOALS_KEY = "hospodar-yki:web:goals:v1";

export function readGoals(): GoalRecord | null {
  try { const raw = localStorage.getItem(GOALS_KEY); return raw ? parseGoalRecord(JSON.parse(raw)) : null; }
  catch { return null; }
}

/** Throws when the browser refused the write or read back something else. */
export function writeGoals(record: GoalRecord): void {
  const text = JSON.stringify(record);
  localStorage.setItem(GOALS_KEY, text);
  if (localStorage.getItem(GOALS_KEY) !== text) throw new Error("READBACK_MISMATCH");
}

export const hasGoals = () => readGoals() !== null;

/** Throws when the record is still there afterwards. */
export function clearGoals(): void {
  localStorage.removeItem(GOALS_KEY);
  if (localStorage.getItem(GOALS_KEY) !== null) throw new Error("DELETE_NOT_VERIFIED");
}

/** Calls back when another tab changes or clears the goals (the `storage` event fires only in other tabs). */
export function onGoalsChanged(cb: () => void): () => void {
  const f = (e: StorageEvent) => { if (e.key === GOALS_KEY || e.key === null) cb(); };
  addEventListener("storage", f);
  return () => removeEventListener("storage", f);
}
