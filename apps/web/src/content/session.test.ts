import { describe, expect, it } from "vitest";
import { addDiagnostic, blankState, blockProgress, clinicEvidence, clinicReducer, planSession, startClinic, YKI_SKILLS, SESSION_MINUTES } from "@hospodar/domain";
import { clinicItems } from "./writingClinic.ts";
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
  it("a task is finished only by the evidence its screen writes at the very end (the writing clinic saves its first draft early)", () => {
    const suffix = { reading: "-transfer", listening: "", writing: "-transfer", speaking: "-roleplay" } as const;
    for (const t of sessionTasks) expect(t.donePrefix, t.id).toBe(`${t.prefix}${suffix[t.skill]}`);
    // The real clinic evidence: the early draft (WritingClinicScreen.persistFirst) never completes the block; the final step does.
    const item = clinicItems[0]!;
    const only = { ...sessionCandidates(blankState()), tasks: sessionTasks.filter(t => t.id === item.id) };
    const p = planSession(blankState(), only, { minutes: 20 }, { allowDrafts: PLAN_DRAFTS });
    const block = p.blocks[0]!;
    expect(block.items[0]).toMatchObject({ id: item.id, done: `${item.id}-transfer` });
    const s = clinicReducer(startClinic(item), item, { type: "SUBMIT_DRAFT", text: "Hei! Kirjoitan teille." });
    const later = new Date(Date.parse(p.createdAt) + 60_000);
    let state = blankState();
    for (const ev of clinicEvidence(s, item, "draft")) state = addDiagnostic(state, ev, later);
    expect(blockProgress(block, state, p.createdAt).complete).toBe(false);
    state = addDiagnostic(state, { skill: "writing", taskId: `${item.id}-transfer`, status: "ungraded", response: "[new task, no model shown] Hei." }, later);
    expect(blockProgress(block, state, p.createdAt).complete).toBe(true);
  });
  it("a listening lesson counts as tried once one of its questions is saved (evidence is keyed by the question prefix)", () => {
    const lesson = sessionTasks.find(t => t.skill === "listening" && t.prefix !== t.id)!;
    expect(lesson).toBeTruthy();
    const tried = addDiagnostic(blankState(), { skill: "listening", taskId: `${lesson.prefix}-q1`, status: "scored", correct: true });
    const ids = planSession(tried, sessionCandidates(tried), { minutes: 30, skill: "listening" }, { allowDrafts: PLAN_DRAFTS }).blocks.map(b => b.items[0]!.id);
    expect(ids).not.toContain(lesson.id);
  });
});
