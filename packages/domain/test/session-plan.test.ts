import { describe, expect, it } from "vitest";
import { addDiagnostic, blankState, blockProgress, completeMission, planSession, skillExposure, SESSION_MINUTES,
  type LearnerState, type SessionCandidates, type SessionTask } from "../src/index.ts";

const NOW = new Date("2026-11-16T09:00:00+02:00");
const task = (id: string, skill: SessionTask["skill"], minutes: number, place: SessionTask["place"] = null, extra: Partial<SessionTask> = {}): SessionTask =>
  ({ id, skill, minutes, place, prefix: id, published: false, ...extra });
const TASKS: SessionTask[] = [
  task("read-a", "reading", 8, "services"), task("read-b", "reading", 8, "health"),
  task("listen-a", "listening", 8, "travel"), task("listen-b", "listening", 8, null, { prefix: "b1long-2" }),
  task("write-a", "writing", 15, "services"), task("write-b", "writing", 15, "work"),
  task("talk-a", "speaking", 10, "services"), task("talk-b", "speaking", 10, "health"),
];
const none: SessionCandidates["review"] = { delayed: [], phrases: [], grammar: [] };
const cands = (over: Partial<SessionCandidates> = {}): SessionCandidates => ({ review: none, weakSpot: null, tasks: TASKS, ...over });
const plan = (state: LearnerState, c: SessionCandidates, choice: Parameters<typeof planSession>[2], allowDrafts = true) =>
  planSession(state, c, choice, { now: NOW, allowDrafts });
const said = (s: LearnerState, skill: "reading" | "listening" | "writing" | "speaking", taskId: string, at = NOW) =>
  addDiagnostic(s, skill === "reading" || skill === "listening" ? { skill, taskId, status: "scored", correct: true } : { skill, taskId, status: "ungraded", response: "Hei" }, at);

describe("session plan on 10, 20 or 30 minutes (DEC-01; docs/29 stage 3)", () => {
  it("only 10, 20 or 30 minutes; deterministic; a formative plan with no level, score or readiness field", () => {
    expect([...SESSION_MINUTES]).toEqual([10, 20, 30]);
    for (const m of [0, 5, 15, 45, 30.5]) expect(() => plan(blankState(), cands(), { minutes: m as never })).toThrow();
    const a = plan(blankState(), cands(), { minutes: 30 }), b = plan(blankState(), cands(), { minutes: 30 });
    expect(a).toEqual(b);
    expect(a.status).toBe("FORMATIVE_PLAN_ONLY");
    expect(JSON.stringify(a)).not.toMatch(/level|score|cefr|ready|streak|percent/i);
  });
  it("time limit is enforced (R6-04): no plan exceeds its length; a task that does not fit is never offered", () => {
    for (const minutes of SESSION_MINUTES) for (const c of [cands(), cands({ review: { delayed: [{ id: "d", prefix: "d" }], phrases: ["p1", "p2", "p3"], grammar: ["g1"] } })]) {
      const p = plan(blankState(), c, { minutes });
      expect(p.total).toBeLessThanOrEqual(minutes);
      expect(p.total).toBe(p.blocks.reduce((n, b) => n + b.minutes, 0));
    }
    const ten = plan(blankState(), cands(), { minutes: 10, skill: "writing" });                   // writing ≈15 min
    expect(ten.blocks).toEqual([]);
    expect(ten.missing).toBe("CHOSEN_TASKS_TOO_LONG");
    expect(plan(blankState(), cands(), { minutes: 20, skill: "writing" }).blocks[0]).toMatchObject({ kind: "new_task", skill: "writing", reasons: ["NEW_TASK", "NEVER_PRACTISED_SKILL", "CHOSEN_SKILL"] });
  });
  it("order: review first (delayed → phrases → grammar, ≤10 min, the rest waits — no catch-up), then the weak spot, then something new", () => {
    const c = cands({ review: { delayed: [{ id: "d7-x", prefix: "d7-x" }], phrases: ["p1", "p2", "p3", "p4"], grammar: ["g1"] },
      weakSpot: { family: "location", retestDue: false, set: ["w1", "w2", "w3"] } });
    const p = plan(blankState(), c, { minutes: 30 });
    expect(p.blocks.map(b => b.kind)).toEqual(["review", "weak_spot", "new_task"]);
    expect(p.blocks[0]!.items.map(i => i.id)).toEqual(["d7-x", "p1", "p2"]);                     // 5 + 2 + 2 = 9 min
    expect(p.blocks[0]).toMatchObject({ minutes: 9, later: 3, reasons: ["DELAYED_CHECK_DUE", "PHRASES_DUE"] });
    expect(p.blocks[1]).toMatchObject({ minutes: 10, family: "location", reasons: ["WEAK_SPOT"] });
    expect(p.total).toBeLessThanOrEqual(30);
  });
  it("from 20 minutes on, ten minutes stay for something new; 10 minutes is one main thing", () => {
    const c = cands({ review: { delayed: [], phrases: ["p1", "p2", "p3", "p4", "p5", "p6"], grammar: [] }, weakSpot: { family: "f", retestDue: true, set: ["w1"] } });
    expect(plan(blankState(), c, { minutes: 10 }).blocks.map(b => b.kind)).toEqual(["review"]);
    expect(plan(blankState(), c, { minutes: 20 }).blocks.map(b => b.kind)).toEqual(["review", "new_task"]);
    expect(plan(blankState(), c, { minutes: 30 }).blocks.map(b => [b.kind, b.reasons[0]])).toEqual([["review", "PHRASES_DUE"], ["weak_spot", "WEAK_SPOT_RETEST_DUE"], ["new_task", "NEW_TASK"]]);
    expect(plan(blankState(), cands({ weakSpot: { family: "f", retestDue: false, set: ["w1"] } }), { minutes: 10 }).blocks.map(b => b.kind)).toEqual(["weak_spot"]);
  });
  it("four skills get equal opportunity (R6-10): a never-practised skill comes first, several new tasks go to different skills", () => {
    let s = blankState();
    s = said(s, "reading", "x-1"); s = said(s, "listening", "x-2"); s = said(s, "speaking", "x-3");
    const first = plan(s, cands(), { minutes: 20 }).blocks[0]!;
    expect(first).toMatchObject({ skill: "writing", reasons: ["NEW_TASK", "NEVER_PRACTISED_SKILL"], exposure: 0 });
    const fresh = plan(blankState(), cands(), { minutes: 30 }).blocks;
    expect(new Set(fresh.map(b => b.skill)).size).toBe(fresh.length);
    expect(fresh.map(b => [b.skill, b.minutes])).toEqual([["reading", 8], ["listening", 8], ["speaking", 10]]);   // ties: the «Сьогодні» skill order; writing (15) no longer fits
    expect(skillExposure(s)).toEqual({ reading: 1, listening: 1, writing: 0, speaking: 1 });
  });
  it("manual choice wins: a chosen skill or place restricts every new task; nothing left is said honestly", () => {
    const byPlace = plan(blankState(), cands(), { minutes: 30, place: "services" }).blocks;
    expect(byPlace.length).toBeGreaterThan(0);
    expect(byPlace.every(b => b.place === "services" && b.reasons.includes("CHOSEN_PLACE"))).toBe(true);
    const twoReading = plan(blankState(), cands(), { minutes: 20, skill: "reading" }).blocks;
    expect(twoReading.map(b => [b.items[0]!.id, b.minutes])).toEqual([["read-a", 8], ["read-b", 8]]);       // 8 + 8 ≤ 20, both reading
    expect(plan(blankState(), cands(), { minutes: 30, skill: "listening", place: "work" })).toMatchObject({ blocks: [], missing: "NO_TASK_FOR_CHOICE" });
  });
  it("never re-plans a task already tried as 'new'; EXAM-only tasks never; drafts only where the build shows labelled drafts", () => {
    const tried = said(blankState(), "listening", "b1long-2-q1");
    const ids = (s: LearnerState, c = cands(), allow = true) => plan(s, c, { minutes: 30, skill: "listening" }, allow).blocks.map(b => b.items[0]!.id);
    expect(ids(tried)).toEqual(["listen-a"]);
    expect(ids(blankState(), cands({ tasks: TASKS.map(t => t.id === "listen-a" ? { ...t, examOnly: true } : t) }))).toEqual(["listen-b"]);
    expect(ids(blankState(), cands(), false)).toEqual([]);                                        // release build: nothing published yet
    expect(ids(blankState(), cands({ tasks: TASKS.map(t => ({ ...t, published: true })) }), false).length).toBeGreaterThan(0);
  });
  it("block progress counts only what was saved after the plan was made; a review block is done when every item is", () => {
    const earlier = new Date("2026-11-15T09:00:00+02:00"), later = new Date("2026-11-16T09:05:00+02:00");
    let s = completeMission(blankState(), { taskId: "g1", firstAnswer: "x", firstCorrect: false, transferText: "Oma lause." }, earlier);
    s = said(s, "reading", "read-a-q1", earlier);
    const p = plan(s, cands({ review: { delayed: [], phrases: ["p1"], grammar: ["g1"] } }), { minutes: 20 });
    const [review, fresh] = p.blocks;
    expect(blockProgress(review!, s, p.createdAt)).toMatchObject({ done: 0, of: 2, complete: false });     // yesterday's work is not today's plan
    s = said(s, "writing", "p1", later);
    expect(blockProgress(review!, s, p.createdAt)).toMatchObject({ done: 1, of: 2, complete: false });
    expect(blockProgress(review!, s, p.createdAt).pending.map(i => i.id)).toEqual(["g1"]);                // what to open next
    s = completeMission(s, { taskId: "g1", firstAnswer: "y", firstCorrect: true, transferText: "Toinen." }, later);
    expect(blockProgress(review!, s, p.createdAt).complete).toBe(true);
    const target = fresh!.items[0]!;
    s = said(s, fresh!.skill!, `${target.prefix}-q1`, later);
    expect(blockProgress(fresh!, s, p.createdAt).complete).toBe(true);
    expect(() => blockProgress(review!, s, "not a date")).toThrow();
  });
  it("a new task is done only after its final step: a saved first writing draft is 'tried', not 'done' (repair and transfer still ahead)", () => {
    const writing = TASKS.map(t => t.skill === "writing" ? { ...t, donePrefix: `${t.id}-transfer` } : t);
    const p = plan(blankState(), cands({ tasks: writing }), { minutes: 20, skill: "writing" });
    const block = p.blocks[0]!, later = new Date("2026-11-16T09:05:00+02:00");
    let s = said(blankState(), "writing", block.items[0]!.id, later);                           // WritingClinicScreen.persistFirst: draft only
    expect(blockProgress(block, s, p.createdAt).complete).toBe(false);
    expect(plan(s, cands({ tasks: writing }), { minutes: 20, skill: "writing" }).blocks.map(b => b.items[0]!.id)).not.toContain(block.items[0]!.id);
    s = said(s, "writing", `${block.items[0]!.id}-rewrite`, later);
    expect(blockProgress(block, s, p.createdAt).complete).toBe(false);
    s = said(s, "writing", `${block.items[0]!.id}-transfer`, later);
    expect(blockProgress(block, s, p.createdAt).complete).toBe(true);
  });
  it("an empty build or an empty device gives an honest empty plan, never invented tasks", () => {
    expect(plan(blankState(), cands({ tasks: [] }), { minutes: 20 })).toMatchObject({ blocks: [], total: 0, missing: null });
  });
});
