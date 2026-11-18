/**
 * The learner's voluntary if-then plan (micro-missions; MOT-11): saved only when the learner presses «Зберегти план», on
 * this device only, never exported or counted, erased with LEARN data. Every write is read back; a failure is reported.
 */
import { parseStudyPlan, type StudyPlan } from "@hospodar/domain";

export const STUDY_PLAN_KEY = "hospodar-yki:web:study-plan:v1";

export function readStudyPlan(): StudyPlan | null {
  try { const raw = localStorage.getItem(STUDY_PLAN_KEY); return raw ? parseStudyPlan(JSON.parse(raw)) : null; }
  catch { return null; }
}
/** Throws when the browser refused the write or read back something else. */
export function writeStudyPlan(plan: StudyPlan): void {
  const text = JSON.stringify(plan);
  localStorage.setItem(STUDY_PLAN_KEY, text);
  if (localStorage.getItem(STUDY_PLAN_KEY) !== text) throw new Error("READBACK_MISMATCH");
}
export const hasStudyPlan = () => localStorage.getItem(STUDY_PLAN_KEY) !== null;
/** Throws when the plan is still there afterwards. */
export function clearStudyPlan(): void {
  localStorage.removeItem(STUDY_PLAN_KEY);
  if (localStorage.getItem(STUDY_PLAN_KEY) !== null) throw new Error("DELETE_NOT_VERIFIED");
}
