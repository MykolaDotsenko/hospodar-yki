import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { blankState, buildScenario, emptyScenarioChecks, parseScenarioChecks, scenarioCheckOf, scenarioProgress, scriptedScenario, setScenarioCheck, type LearnerState, type ScenarioScript, type ScenarioStep } from "../src/index.ts";

const withDiag = (...d: LearnerState["diagnostics"]): LearnerState => ({ ...blankState(), diagnostics: d });
const housing = [
  { skill: "writing" as const, itemId: "clinic-1", taskPrefix: "clinic-1" },
  { skill: "speaking" as const, itemId: "dialog-2", taskPrefix: "dialog-2" },
  { skill: "listening" as const, itemId: "b1long-01-x", taskPrefix: "b1long-1" },
  { skill: "speaking" as const, itemId: "dialog-9", taskPrefix: "dialog-9" },
];

describe("«Ціла справа»: whole communicative task in one place (task-based)", () => {
  it("orders understand → say → write, one item per skill; no scenario without understanding, speaking AND writing", () => {
    expect(buildScenario(housing)!.map(s => s.itemId)).toEqual(["b1long-01-x", "dialog-2", "clinic-1"]);
    expect(buildScenario(housing.filter(s => s.skill !== "writing"))).toBeNull();
    expect(buildScenario(housing.filter(s => s.skill !== "listening"))).toBeNull();
  });
  it("a step is done after the learner's own attempt; the next step is the first not yet tried", () => {
    const steps = buildScenario(housing)!;
    expect(scenarioProgress(blankState(), steps)).toMatchObject({ next: 0, complete: false });
    const p = scenarioProgress(withDiag({ skill: "listening", taskId: "b1long-1-q1", status: "scored", correct: false }), steps);
    expect(p.steps.map(s => s.status)).toEqual(["done", "todo", "todo"]);              // a wrong answer is still an own attempt
    expect(p.next).toBe(1);
  });
  it("archived scenario evidence preserves attempted steps without claiming independence", () => {
    const steps = buildScenario(housing)!;
    const state = { ...blankState(), archivedDiagnosticIds: ["b1long-1-q1", "dialog-2-roleplay", "clinic-1"] };
    expect(scenarioProgress(state, steps)).toMatchObject({ next: null, complete: true, independent: false });
    expect(scenarioProgress(state, steps).steps.map(s => s.status)).toEqual(["archived", "archived", "archived"]);
    const withSupport = { ...state, diagnostics: [{ skill: "listening" as const, taskId: "b1long-1-q1", status: "ungraded" as const, response: "supported:slow" }] };
    expect(scenarioProgress(withSupport, steps).steps.map(s => s.status)).toEqual(["supported", "archived", "archived"]);
    const withIndependent = { ...state, diagnostics: [{ skill: "listening" as const, taskId: "b1long-1-q1", status: "scored" as const, correct: false }] };
    expect(scenarioProgress(withIndependent, steps).steps.map(s => s.status)).toEqual(["done", "archived", "archived"]);
  });
  it("a different skill with a matching prefix cannot complete a scenario step", () => {
    const state = withDiag({ skill: "reading", taskId: "dialog-2-q1", status: "ungraded", response: "Oma vastaus." });
    expect(scenarioProgress(state, buildScenario(housing)!).steps.map(s => s.status)).toEqual(["todo", "todo", "todo"]);
  });
  it("listening only with text support is 'supported', not independent; the task is complete but not independent", () => {
    const p = scenarioProgress(withDiag(
      { skill: "listening", taskId: "b1long-1-q1", status: "ungraded", response: "supported:transcript" },
      { skill: "speaking", taskId: "dialog-2-reply", status: "ungraded", response: "Hana vuotaa." },
      { skill: "writing", taskId: "clinic-1-final", status: "ungraded", response: "Hyvä huolto, …" },
    ), buildScenario(housing)!);
    expect(p.steps[0]!.status).toBe("supported");
    expect(p).toMatchObject({ complete: true, independent: false, next: null });
  });
});

describe("the 20-minute whole-task run (task-based): role, changing conditions, task-success criteria per step", () => {
  const script = JSON.parse(readFileSync(new URL("../../../learning/exercises/b1/scenarios/whole-task-v1.json", import.meta.url), "utf8")) as { scenarios: ScenarioScript[] };
  const steps: ScenarioStep[] = [
    { skill: "listening", itemId: "l1", taskPrefix: "l1" }, { skill: "speaking", itemId: "s1", taskPrefix: "s1" }, { skill: "writing", itemId: "w1", taskPrefix: "w1" }];

  it("whole task: every place script has a role, a goal, about 20 minutes, a condition and 2–4 success criteria per step, all in Ukrainian with no Finnish key", () => {
    expect(script.scenarios.map(s => s.place).sort()).toEqual(["housing", "services", "society", "travel", "work"]);
    for (const s of script.scenarios) {
      expect(s.minutes).toBe(20);
      expect(s.steps.filter(st => st.skill === "speaking" || st.skill === "writing").every(st => st.condition_uk.startsWith("Зміна:"))).toBe(true);   // the situation changes before each own production
      expect(s.steps.filter(st => st.skill === "reading" || st.skill === "listening").every(st => /із метою|порівняй/.test(st.condition_uk))).toBe(true);  // understanding with a purpose
      expect(JSON.stringify(s)).not.toMatch(/model_|answer_|key_/);
    }
    const housing = script.scenarios.find(s => s.place === "housing")!;
    const run = scriptedScenario(steps, housing)!;
    expect(run.map(s => s.skill)).toEqual(["listening", "speaking", "writing"]);
    expect(run[1]!.condition_uk).toMatch(/^Зміна:/);
    expect(scriptedScenario(steps.slice(0, 2), housing)).toBeNull();                     // a script that does not match the steps is not used
    expect(scriptedScenario([steps[1]!, steps[0]!, steps[2]!], housing)).toBeNull();
  });

  it("whole task: the learner's success checks are a self-report per step, validated, kept per place and skill, and dropped when malformed", () => {
    const step = { skill: "speaking" as const, success_uk: ["a", "b", "c"] };
    let log = setScenarioCheck(emptyScenarioChecks(), "housing", step, [2, 0]);
    expect(scenarioCheckOf(log, "housing", "speaking")).toEqual([0, 2]);
    expect(scenarioCheckOf(log, "housing", "writing")).toBeNull();
    expect(() => setScenarioCheck(log, "housing", step, [3])).toThrow("BAD_CHECK");
    expect(() => setScenarioCheck(log, "housing", step, [1, 1])).toThrow("BAD_CHECK");
    log = setScenarioCheck(log, "housing", step, []);                                   // "nothing met" is an honest answer too
    expect(scenarioCheckOf(log, "housing", "speaking")).toEqual([]);
    expect(parseScenarioChecks(JSON.parse(JSON.stringify(log)))).toEqual(log);
    expect(parseScenarioChecks({ version: 1, checks: { "housing:speaking": [0], "x:y": [0], "work:writing": [9], "work:reading": [1, 1] } }))
      .toEqual({ version: 1, checks: { "housing:speaking": [0] } });
    for (const bad of [null, [], { version: 2, checks: {} }]) expect(parseScenarioChecks(bad)).toEqual(emptyScenarioChecks());
  });
});
