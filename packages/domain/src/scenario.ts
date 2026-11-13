/**
 * «Ціла справа» — a whole communicative task in one life place (task-based, P0): understand → say → write.
 * Built only from existing LEARN items of that place; pure and deterministic.
 *
 *  - order: reading → listening → speaking → writing (from understanding to producing; one item per skill);
 *  - a scenario exists only when the place has something to understand AND both a speaking and a writing task;
 *  - a step is done when the learner has made their own first attempt; listening done only with text support is
 *    shown as "with support", never as independent understanding (IV-REQ-04);
 *  - task success = every step attempted. Finnish speaking/writing stays ungraded: success means "done yourself",
 *    never a grade, level or YKI prediction. Exam items are never part of LEARN pools.
 */
import type { LearnerState } from "./learner.ts";
import type { YkiSkill } from "./places.ts";

export interface ScenarioCandidate { skill: YkiSkill; itemId: string; taskPrefix: string }
export type ScenarioStep = ScenarioCandidate;
export type StepStatus = "todo" | "done" | "supported";
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
    const ev = (state.diagnostics ?? []).filter(d => matches(d.taskId, step.taskPrefix));
    const status: StepStatus = ev.length === 0 ? "todo"
      : ev.every(d => d.status !== "scored" && String((d as { response?: unknown }).response ?? "").startsWith("supported:")) ? "supported" : "done";
    return { ...step, status };
  });
  const next = out.findIndex(s => s.status === "todo");
  return { steps: out, next: next === -1 ? null : next, complete: next === -1, independent: out.every(s => s.status === "done") };
}
