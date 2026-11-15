import { describe, expect, it } from "vitest";
import { addDiagnostic, blankState, planSession, YKI_SKILLS, SESSION_MINUTES } from "@hospodar/domain";
import { EXAM_ITEM_IDS } from "./reviewBanks.ts";
import { PLAN_DRAFTS, sessionCandidates, sessionTasks, TASK_MINUTES } from "./session.ts";

describe("«План заняття» candidates (docs/29 stage 3; R6-10; EXAM-11)", () => {
  it("no skill is left without a proposal: for each of the four skills a 20-minute plan with that skill chosen offers a new task", () => {
    for (const skill of YKI_SKILLS) {
      const p = planSession(blankState(), sessionCandidates(blankState()), { minutes: 20, skill }, { allowDrafts: PLAN_DRAFTS });
      expect(p.blocks[0], skill).toMatchObject({ kind: "new_task", skill });
    }
  });
  it("every plan from real content fits its length, and a fresh learner's 30 minutes spread over different skills", () => {
    for (const minutes of SESSION_MINUTES) {
      const p = planSession(blankState(), sessionCandidates(blankState()), { minutes }, { allowDrafts: PLAN_DRAFTS });
      expect(p.total).toBeLessThanOrEqual(minutes);
      expect(p.blocks.length).toBeGreaterThan(0);
    }
    const thirty = planSession(blankState(), sessionCandidates(blankState()), { minutes: 30 }, { allowDrafts: PLAN_DRAFTS }).blocks;
    expect(new Set(thirty.map(b => b.skill)).size).toBe(thirty.length);
  });
  it("tasks come only from LEARN pools: no EXAM item, unique ids, editorial minutes per skill", () => {
    expect(sessionTasks.length).toBeGreaterThan(20);
    for (const t of sessionTasks) {
      expect(EXAM_ITEM_IDS.has(t.id), t.id).toBe(false);
      expect(t.minutes).toBe(TASK_MINUTES[t.skill]);
    }
    expect(new Set(sessionTasks.map(t => t.id)).size).toBe(sessionTasks.length);
  });
  it("a listening lesson counts as tried once one of its questions is saved (evidence is keyed by the question prefix)", () => {
    const lesson = sessionTasks.find(t => t.skill === "listening" && t.prefix !== t.id)!;
    expect(lesson).toBeTruthy();
    const tried = addDiagnostic(blankState(), { skill: "listening", taskId: `${lesson.prefix}-q1`, status: "scored", correct: true });
    const ids = planSession(tried, sessionCandidates(tried), { minutes: 30, skill: "listening" }, { allowDrafts: PLAN_DRAFTS }).blocks.map(b => b.items[0]!.id);
    expect(ids).not.toContain(lesson.id);
  });
});
