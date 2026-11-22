/**
 * Research mode on this device (R01 readiness, docs/29 stage 6): the enrolment record and the study-time log, kept
 * apart from learner progress (no V1 schema change). Written only after the learner's own enrolment; every write is
 * read back; withdrawing or erasing LEARN data removes both, verified. Nothing here is ever sent anywhere.
 */
import { parseEnrollment, parseStudyTime, type ResearchEnrollment, type StudyTimeLog } from "@hospodar/domain";

export const ENROLLMENT_KEY = "hospodar-yki:web:research:enrollment:v1";
export const STUDY_TIME_KEY = "hospodar-yki:web:research:time:v1";

function writeChecked(key: string, value: unknown) {
  const text = JSON.stringify(value);
  localStorage.setItem(key, text);
  if (localStorage.getItem(key) !== text) throw new Error("READBACK_MISMATCH");
}
function readJson(key: string): unknown {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export const readEnrollment = (): ResearchEnrollment | null => parseEnrollment(readJson(ENROLLMENT_KEY));
export const readStudyTime = (): StudyTimeLog => parseStudyTime(readJson(STUDY_TIME_KEY));

/** Throws when the browser refused the write or read back something else. */
export function writeEnrollment(e: ResearchEnrollment): void { writeChecked(ENROLLMENT_KEY, e); }

/**
 * Applies one change to the time log stored NOW — only while enrolled, so a withdrawal or an erase in another tab is
 * never undone by a late tick. `enrolledAt`: the enrolment the time was counted under; after a withdrawal and a new
 * enrolment (another tab) old time is dropped, never added to the new participation. Returns false when nothing was written.
 */
export function updateStudyTime(change: (log: StudyTimeLog) => StudyTimeLog, enrolledAt?: string): boolean {
  const e = readEnrollment();
  if (!e || (enrolledAt !== undefined && e.enrolledAt !== enrolledAt)) return false;
  writeChecked(STUDY_TIME_KEY, change(readStudyTime()));
  return true;
}

export const hasResearchData = () => localStorage.getItem(ENROLLMENT_KEY) !== null || localStorage.getItem(STUDY_TIME_KEY) !== null;

/** Withdrawal / LEARN erase: removes the enrolment and the time log; throws when either is still there afterwards. */
export function clearResearch(): void {
  localStorage.removeItem(STUDY_TIME_KEY);
  localStorage.removeItem(ENROLLMENT_KEY);
  if (hasResearchData()) throw new Error("DELETE_NOT_VERIFIED");
}

/** Calls back when another tab enrols, withdraws or erases. */
export function onResearchChanged(cb: () => void): () => void {
  const f = (e: StorageEvent) => { if (e.key === ENROLLMENT_KEY || e.key === STUDY_TIME_KEY || e.key === null) cb(); };
  addEventListener("storage", f);
  return () => removeEventListener("storage", f);
}
