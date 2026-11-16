/** «Ціла справа» scripts (task-based): a role, a goal, a condition per step and task-success criteria — Ukrainian editorial drafts. */
import type { ScenarioScript } from "@hospodar/domain";
import data from "../../../../learning/exercises/b1/scenarios/whole-task-v1.json";

const scripts = (data as unknown as { scenarios: ScenarioScript[] }).scenarios;
export const scenarioScriptFor = (place: string): ScenarioScript | null => scripts.find(s => s.place === place) ?? null;
