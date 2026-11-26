/**
 * «Ціла справа» — a whole communicative task in one life place (task-based, P0): understand → say → write.
 * Built only from existing LEARN items of that place; pure and deterministic.
 *
 *  - order: reading → listening → speaking → writing (from understanding to producing; one item per skill);
 *  - a scenario exists only when the place has something to understand AND both a speaking and a writing task;
 *  - a step is done when the learner has made their own first attempt; listening done only with text support is
 *    shown as "with support", never as independent understanding (IV-REQ-04); archived IDs prove a saved
 *    attempt existed, not how independently it was made;
 *  - task success = every step attempted. Finnish speaking/writing stays ungraded: success means "done yourself",
 *    never a grade, level or YKI prediction. Exam items are never part of LEARN pools.
 */
import type { LearnerState } from "./learner.ts";
import type { YkiSkill } from "./places.ts";

export interface ScenarioCandidate { skill: YkiSkill; itemId: string; taskPrefix: string }
export type ScenarioStep = ScenarioCandidate;
export type StepStatus = "todo" | "done" | "supported" | "archived";
export interface ScenarioProgress { steps: (ScenarioStep & { status: StepStatus })[]; next: number | null; complete: boolean; independent: boolean }

const ORDER: YkiSkill[] = ["reading", "listening", "speaking", "writing"];

export function buildScenario(candidates: readonly ScenarioCandidate[]): ScenarioStep[] | null {
  const steps = ORDER.map(s => candidates.find(c => c.skill === s)).filter((c): c is ScenarioCandidate => Boolean(c));
  const has = (s: YkiSkill) => steps.some(x => x.skill === s);
  return (has("reading") || has("listening")) && has("speaking") && has("writing") ? steps : null;
}

const matches = (taskId: string, prefix: string) => taskId === prefix || taskId.startsWith(`${prefix}-`);

export function scenarioProgress(state: LearnerState, steps: readonly ScenarioStep[]): ScenarioProgress {
  const out = steps.map(step => {
    const ev = (state.diagnostics ?? []).filter(d => d.skill === step.skill && matches(d.taskId, step.taskPrefix));
    const archived = (state.archivedDiagnosticIds ?? []).some(id => matches(id, step.taskPrefix));
    // The archive has no support or correctness metadata. Never reconstruct independent evidence from IDs.
    const status: StepStatus = ev.length === 0 ? (archived ? "archived" : "todo")
      : ev.every(d => d.status !== "scored" && String((d as { response?: unknown }).response ?? "").startsWith("supported:")) ? "supported" : "done";
    return { ...step, status };
  });
  const next = out.findIndex(s => s.status === "todo");
  return { steps: out, next: next === -1 ? null : next, complete: next === -1, independent: out.every(s => s.status === "done") };
}

/* ---------- the 20-minute run: a role, a condition that changes at every step, task-success criteria per step ----------
 * learning/exercises/b1/scenarios/whole-task-v1.json gives each place a role, a goal and, per step, a condition (what to
 * listen/read for, or what changed since the last step) and 2–3 task-success criteria. All Ukrainian, no Finnish key.
 * The learner checks the criteria themselves after the step: a self-report of task success, never a grade. */
export interface ScenarioScriptStep { skill: YkiSkill; condition_uk: string; success_uk: string[] }
export interface ScenarioScript { place: string; minutes: number; role_uk: string; goal_uk: string; steps: ScenarioScriptStep[] }
export type ScriptedStep = ScenarioStep & { condition_uk: string; success_uk: string[] };

const str = (x: unknown): x is string => typeof x === "string" && x.trim().length > 0;

/** The place's steps with their condition and criteria, or null when the script does not match the steps skill by skill. */
export function scriptedScenario(steps: readonly ScenarioStep[], script: ScenarioScript | null | undefined): ScriptedStep[] | null {
  if (!script || !Array.isArray(script.steps) || script.steps.length !== steps.length || !str(script.role_uk) || !str(script.goal_uk)) return null;
  const out: ScriptedStep[] = [];
  for (let i = 0; i < steps.length; i++) {
    const s = script.steps[i]!;
    if (s.skill !== steps[i]!.skill || !str(s.condition_uk) || !Array.isArray(s.success_uk) || s.success_uk.length < 2 || s.success_uk.length > 4 || !s.success_uk.every(str)) return null;
    out.push({ ...steps[i]!, condition_uk: s.condition_uk, success_uk: s.success_uk });
  }
  return out;
}

/** The learner's own task-success checks, per place and step skill: only on this device, never a grade or a count. */
export interface ScenarioCheckLog { version: 1; checks: Record<string, number[]> }
export const emptyScenarioChecks = (): ScenarioCheckLog => ({ version: 1, checks: {} });
const CHECK_KEY = /^[a-z]+:(reading|listening|speaking|writing)$/;
export const scenarioCheckKey = (place: string, skill: YkiSkill) => `${place}:${skill}`;

export function parseScenarioChecks(raw: unknown): ScenarioCheckLog {
  const r = raw as { version?: unknown; checks?: unknown } | null;
  if (!r || typeof r !== "object" || Array.isArray(r) || r.version !== 1 || !r.checks || typeof r.checks !== "object" || Array.isArray(r.checks)) return emptyScenarioChecks();
  const checks: Record<string, number[]> = {};
  for (const [k, v] of Object.entries(r.checks as Record<string, unknown>)) {
    if (CHECK_KEY.test(k) && Array.isArray(v) && v.length <= 4 && v.every(i => Number.isInteger(i) && i >= 0 && i < 4) && new Set(v).size === v.length) checks[k] = [...v].sort();
  }
  return { version: 1, checks };
}

export function setScenarioCheck(log: ScenarioCheckLog, place: string, step: Pick<ScriptedStep, "skill" | "success_uk">, met: readonly number[]): ScenarioCheckLog {
  const marks = [...new Set(met)];
  if (marks.length !== met.length || !marks.every(i => Number.isInteger(i) && i >= 0 && i < step.success_uk.length)) throw new Error("BAD_CHECK");
  return { version: 1, checks: { ...log.checks, [scenarioCheckKey(place, step.skill)]: marks.sort() } };
}

export const scenarioCheckOf = (log: ScenarioCheckLog, place: string, skill: YkiSkill): number[] | null => log.checks[scenarioCheckKey(place, skill)] ?? null;
