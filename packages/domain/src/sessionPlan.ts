/**
 * «План заняття» on 10, 20 or 30 minutes (docs/29 stage 3; DEC-01 10/20/30; UIO-07 agency over skill and length; R09 and
 * QL-06 topic choice; R6-04 time limit enforced; R6-10 four-skill coverage; MOT-02 the learner chooses skill and time).
 *
 * One deterministic, explainable plan from what is already saved on this device, in the order docs/29 sets:
 *   1. Повторення — what is due today: delayed 7/14/30 checks, then phrases not recalled last time, then scheduled
 *      grammar (the same evidence order as «Сьогодні»). At most 10 minutes; what does not fit waits for another day —
 *      never a catch-up quota (MOT-04).
 *   2. Слабке місце — the «Майстерня» set of a grammar family with repeated first-answer errors (re-test first).
 *   3. Нова справа — a task the learner has never tried, ranked by the parity-tested R06 ranker over the four YKI skills
 *      (least-practised skill first; exposure, never mastery). Every session of 20 minutes or more keeps 10 minutes for
 *      something new. Several new tasks go to different skills unless the learner chose one skill.
 * Minutes are editorial estimates shown as «≈»: no timer, no streak, no notification, nothing stored (MOT-03/11).
 * Writing and speaking stay ungraded: the plan never produces a level, score or readiness estimate (R6-06/08).
 */
import type { LearnerState } from "./learner.ts";
import { YKI_SKILLS, type PlaceId, type YkiSkill } from "./places.ts";
import { rankR06Tasks, type R06Task } from "./r06.ts";

export const SESSION_MINUTES = Object.freeze([10, 20, 30] as const);
export type SessionMinutes = typeof SESSION_MINUTES[number];
/** Editorial estimates in minutes (not measured): one delayed check, one phrase card, one grammar task. */
export const REVIEW_COST = Object.freeze({ delayed: 5, phrase: 2, grammar: 3 } as const);
export const REVIEW_BLOCK_MAX = 10;
export const WEAK_SPOT_MINUTES = 10;
/** From 20 minutes on, this much stays free for a new task. */
export const NEW_TASK_RESERVE = 10;
export const MAX_NEW_TASKS = 3;

export type EvidenceStore = "attempts" | "diagnostics" | "retention";
/** One thing to do; it counts as done once the learner saves evidence for `prefix` in `store` after the plan was made. */
export interface PlanItem { kind: "delayed" | "phrase" | "grammar" | "weak" | "task"; id: string; store: EvidenceStore; prefix: string }
export interface SessionTask {
  id: string; skill: YkiSkill; place: PlaceId | null; minutes: number;
  /** Evidence task ids of this task start with this (listening questions share one prefix). */
  prefix: string;
  /** "published" in a release build; drafts are planned only where the build already shows labelled drafts. */
  published: boolean;
  examOnly?: boolean;
}
export interface SessionCandidates {
  review: { delayed: { id: string; prefix: string }[]; phrases: string[]; grammar: string[] };
  /** The «Майстерня» family to work on, if any: its never-seen interleaved set. */
  weakSpot: { family: string; retestDue: boolean; set: string[] } | null;
  tasks: SessionTask[];
}
export interface SessionChoice { minutes: SessionMinutes; skill?: YkiSkill | null; place?: PlaceId | null }
export type SessionReason =
  | "DELAYED_CHECK_DUE" | "PHRASES_DUE" | "GRAMMAR_DUE" | "WEAK_SPOT_RETEST_DUE" | "WEAK_SPOT"
  | "NEW_TASK" | "NEVER_PRACTISED_SKILL" | "LEAST_PRACTISED_SKILL" | "CHOSEN_SKILL" | "CHOSEN_PLACE";
export interface SessionBlock {
  kind: "review" | "weak_spot" | "new_task";
  minutes: number;
  items: PlanItem[];
  skill: YkiSkill | null;
  place: PlaceId | null;
  /** Weak spot only: the «Майстерня» family. */
  family: string | null;
  reasons: SessionReason[];
  /** Review only: due items left for another day (shown, never demanded). */
  later: number;
  /** New task only: saved answers in this skill so far (exposure, not mastery). */
  exposure: number | null;
}
export interface SessionPlan {
  minutes: SessionMinutes; total: number; blocks: SessionBlock[]; createdAt: string;
  /** Why a chosen skill/place produced no new task: none left to try, or none fits the time that remains. */
  missing: "NO_TASK_FOR_CHOICE" | "CHOSEN_TASKS_TOO_LONG" | null;
  status: "FORMATIVE_PLAN_ONLY";
}

const matches = (taskId: unknown, prefix: string) => typeof taskId === "string" && (taskId === prefix || taskId.startsWith(`${prefix}-`));
const iso = (d: Date) => { if (!(d instanceof Date) || Number.isNaN(d.getTime())) throw new TypeError("Invalid date"); return d.toISOString(); };
const localDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Saved answers per YKI skill — exactly what the R06 ranker balances (exposure, never a judgement of quality). */
export function skillExposure(state: Pick<LearnerState, "attempts" | "diagnostics">): Record<YkiSkill, number> {
  const out: Record<YkiSkill, number> = { reading: 0, listening: 0, writing: 0, speaking: 0 };
  for (const e of [...(state.attempts ?? []), ...(state.diagnostics ?? [])] as { skill?: string }[])
    if (e && (YKI_SKILLS as readonly string[]).includes(e.skill as string)) out[e.skill as YkiSkill] += 1;
  return out;
}
/** Has the learner ever saved anything for this task? (A first attempt is never re-planned as "new".) */
export const everTried = (state: Pick<LearnerState, "diagnostics">, prefix: string) => (state.diagnostics ?? []).some(d => matches(d.taskId, prefix));

export function planSession(state: LearnerState, candidates: SessionCandidates, choice: SessionChoice,
  opts: { now?: Date; allowDrafts: boolean }): SessionPlan {
  const now = opts.now ?? new Date();
  if (!(SESSION_MINUTES as readonly number[]).includes(choice?.minutes)) throw new TypeError("Session length must be 10, 20 or 30 minutes");
  if (choice.skill != null && !(YKI_SKILLS as readonly string[]).includes(choice.skill)) throw new TypeError("Unknown skill");
  const blocks: SessionBlock[] = [];
  let remaining: number = choice.minutes;
  const reserve = choice.minutes >= 20 ? NEW_TASK_RESERVE : 0;

  // 1. Повторення: delayed checks → phrases → grammar, within the review budget.
  const queue: PlanItem[] = [
    ...candidates.review.delayed.map(d => ({ kind: "delayed" as const, id: d.id, store: "retention" as const, prefix: d.prefix })),
    ...candidates.review.phrases.map(id => ({ kind: "phrase" as const, id, store: "diagnostics" as const, prefix: id })),
    ...candidates.review.grammar.map(id => ({ kind: "grammar" as const, id, store: "attempts" as const, prefix: id })),
  ];
  const seenReview = new Set<string>();
  const reviewQueue = queue.filter(i => !seenReview.has(`${i.kind}:${i.id}`) && seenReview.add(`${i.kind}:${i.id}`));
  if (reviewQueue.length) {
    let budget = Math.min(REVIEW_BLOCK_MAX, remaining - reserve);
    const taken: PlanItem[] = [];
    for (const item of reviewQueue) {
      const cost = REVIEW_COST[item.kind as keyof typeof REVIEW_COST];
      if (cost <= budget) { taken.push(item); budget -= cost; }
    }
    if (taken.length) {
      const minutes = taken.reduce((n, i) => n + REVIEW_COST[i.kind as keyof typeof REVIEW_COST], 0);
      const kinds = new Set(taken.map(i => i.kind));
      blocks.push({ kind: "review", minutes, items: taken, skill: null, place: null, family: null, later: reviewQueue.length - taken.length, exposure: null,
        reasons: [...(kinds.has("delayed") ? ["DELAYED_CHECK_DUE" as const] : []), ...(kinds.has("phrase") ? ["PHRASES_DUE" as const] : []),
          ...(kinds.has("grammar") ? ["GRAMMAR_DUE" as const] : [])] });
      remaining -= minutes;
    }
  }

  // 2. Слабке місце.
  const weak = candidates.weakSpot;
  if (weak && weak.set.length > 0 && remaining - reserve >= WEAK_SPOT_MINUTES) {
    blocks.push({ kind: "weak_spot", minutes: WEAK_SPOT_MINUTES, skill: null, place: null, family: weak.family, later: 0, exposure: null,
      items: weak.set.map(id => ({ kind: "weak" as const, id, store: "attempts" as const, prefix: id })),
      reasons: [weak.retestDue ? "WEAK_SPOT_RETEST_DUE" : "WEAK_SPOT"] });
    remaining -= WEAK_SPOT_MINUTES;
  }

  // 3. Нова справа: never-tried LEARN tasks, R06-ranked over four skills, each fitting the time left.
  const exposure = skillExposure(state);
  const least = Math.min(...YKI_SKILLS.map(s => exposure[s]));
  const usable = candidates.tasks.filter(t => t && !t.examOnly && (t.published || opts.allowDrafts) && !everTried(state, t.prefix) &&
    (choice.skill == null || t.skill === choice.skill) && (choice.place == null || t.place === choice.place) &&
    Number.isInteger(t.minutes) && t.minutes >= 1);
  const byId = new Map(usable.map(t => [t.id, t]));
  const usedSkills = new Set<YkiSkill>();
  const planned = new Set<string>();
  let newCount = 0;
  while (newCount < MAX_NEW_TASKS && remaining >= 1) {
    const pool = usable.filter(t => !planned.has(t.id) && (choice.skill != null || !usedSkills.has(t.skill)) && t.minutes <= remaining);
    if (!pool.length) break;
    const r06: R06Task[] = pool.map(t => ({ id: t.id, skill: t.skill, reviewStatus: t.published ? "s2_approved" : "labelled_draft",
      redistributionCleared: true, offlineAvailable: true, estimatedMinutes: t.minutes, ...(t.place ? { topic: t.place } : {}) }));
    const ranked = rankR06Tasks({ tasks: r06, state: state as never, today: localDay(now),
      availableMinutes: Math.min(remaining, 180), skills: YKI_SKILLS, allowLabelledDrafts: opts.allowDrafts,
      preferredSkills: choice.skill ? [choice.skill] : [], preferredTopics: choice.place ? [choice.place] : [] });
    // Equal scores: the same skill order as «Сьогодні» (reading → listening → writing → speaking), then R06's own order.
    const [top] = ranked.filter(r => r.score === ranked[0]?.score)
      .sort((a, b) => YKI_SKILLS.indexOf(a.skill as YkiSkill) - YKI_SKILLS.indexOf(b.skill as YkiSkill));
    const task = top ? byId.get(top.taskId) : undefined;
    if (!task) break;
    const reasons: SessionReason[] = ["NEW_TASK"];
    if (exposure[task.skill] === 0) reasons.push("NEVER_PRACTISED_SKILL");
    else if (exposure[task.skill] === least && choice.skill == null) reasons.push("LEAST_PRACTISED_SKILL");
    if (choice.skill) reasons.push("CHOSEN_SKILL");
    if (choice.place) reasons.push("CHOSEN_PLACE");
    blocks.push({ kind: "new_task", minutes: task.minutes, skill: task.skill, place: task.place, family: null, later: 0, exposure: exposure[task.skill], reasons,
      items: [{ kind: "task", id: task.id, store: "diagnostics", prefix: task.prefix }] });
    planned.add(task.id); usedSkills.add(task.skill); remaining -= task.minutes; newCount += 1;
  }

  const chose = choice.skill != null || choice.place != null;
  const missing = !chose || newCount > 0 ? null : usable.length === 0 ? "NO_TASK_FOR_CHOICE" : "CHOSEN_TASKS_TOO_LONG";
  return { minutes: choice.minutes, total: blocks.reduce((n, b) => n + b.minutes, 0), blocks, createdAt: iso(now), missing, status: "FORMATIVE_PLAN_ONLY" };
}

/** How many items of a block the learner has saved since the plan was made (older evidence never counts). */
export function blockProgress(block: SessionBlock, state: Pick<LearnerState, "attempts" | "diagnostics" | "retention">, since: string) {
  const t0 = Date.parse(since);
  if (!Number.isFinite(t0)) throw new TypeError("Invalid plan time");
  const after = (at: unknown) => typeof at === "string" && Date.parse(at) >= t0;
  const doneItem = (i: PlanItem) =>
    i.store === "attempts" ? (state.attempts ?? []).some(a => a.taskId === i.prefix && after(a.completedAt))
      : i.store === "diagnostics" ? (state.diagnostics ?? []).some(d => matches(d.taskId, i.prefix) && after(d.completedAt))
        : (state.retention ?? []).some(r => r.taskId === i.prefix && after(r.submittedAt));
  const pending = block.items.filter(i => !doneItem(i));
  const done = block.items.length - pending.length;
  return { done, of: block.items.length, complete: block.items.length > 0 && pending.length === 0, pending };
}
