/**
 * The learner's own task-success checks of «Ціла справа» steps (task-based), on this device only. Like the real-life deed
 * marks: never exported or counted, erased together with LEARN data; every write is read back, a failed write reported.
 */
import { emptyScenarioChecks, parseScenarioChecks, type ScenarioCheckLog } from "@hospodar/domain";

export const SCENARIO_CHECKS_KEY = "hospodar-yki:web:scenario-checks:v1";

export function readScenarioChecks(): ScenarioCheckLog {
  try { const raw = localStorage.getItem(SCENARIO_CHECKS_KEY); return raw ? parseScenarioChecks(JSON.parse(raw)) : emptyScenarioChecks(); }
  catch { return emptyScenarioChecks(); }
}

/** Applies one change to what is stored now and reads it back; throws when the browser refused or stored something else. */
export function updateScenarioChecks(change: (current: ScenarioCheckLog) => ScenarioCheckLog): ScenarioCheckLog {
  const next = change(readScenarioChecks());
  const text = JSON.stringify(next);
  localStorage.setItem(SCENARIO_CHECKS_KEY, text);
  if (localStorage.getItem(SCENARIO_CHECKS_KEY) !== text) throw new Error("READBACK_MISMATCH");
  return next;
}

export const hasScenarioChecks = () => Object.keys(readScenarioChecks().checks).length > 0;

/** Throws when the checks are still there afterwards. */
export function clearScenarioChecks(): void {
  localStorage.removeItem(SCENARIO_CHECKS_KEY);
  if (localStorage.getItem(SCENARIO_CHECKS_KEY) !== null) throw new Error("DELETE_NOT_VERIFIED");
}
