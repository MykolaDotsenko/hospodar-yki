import { describe, expect, it } from "vitest";
import { blankState, buildScenario, scenarioProgress, type LearnerState } from "../src/index.ts";

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
