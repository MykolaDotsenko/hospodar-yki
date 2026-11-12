/**
 * The preparation cycle around the YKI practice rehearsal (TZ-EXAM-14 exposure part, TZ-EXAM-19, EXAM-09/11, EXV-03,
 * AC-20, AC-21). Pure, deterministic, derived only from the finished-attempt history (no schema change).
 *
 *  - exposure is tracked per set AND skill: a speaking-only subtest of set A exposes only A's speaking tasks;
 *  - the default set is one whose tasks for the chosen skills the learner has never seen; a repeat is allowed but is
 *    always labelled as a repeat of familiar material — never as a new, unseen check (EXV-03);
 *  - 14 calendar days after the latest rehearsal, a set that is still unseen for those skills is offered as a delayed
 *    re-check; when none is left the app says so instead of recycling tasks (TZ-EXAM-14, TZ-EXAM-19);
 *  - after a rehearsal the learner gets a LEARN focus per skill (wrong or unanswered keyed tasks, ungraded productions)
 *    — review happens in LEARN on other material; exam tasks are never shown there (AC-20). Never a level or a grade.
 */
export const EXAM_SKILLS = ["reading", "listening", "writing", "speaking"] as const;
export type PrepSkill = typeof EXAM_SKILLS[number];
export const EXAM_RETEST_AFTER_DAYS = 14;

export interface PrepAttempt {
  sessionId: string; blueprintId: string; skills: PrepSkill[] | null; finishedAt: string;
  bySkill: Record<PrepSkill, { correct: number; objective: number; ungraded: number; unanswered: number }>;
}
export interface SetStatus { blueprintId: string; seen: PrepSkill[]; unseenForChoice: boolean }
export interface RetestPlan { lastOn: string | null; retestOn: string | null; due: boolean; unseenBlueprint: string | null; noneLeft: boolean }
export interface LearnFocus { skill: PrepSkill; wrong: number; unanswered: number; ungraded: number }

const skillsOf = (a: { skills: PrepSkill[] | null }): PrepSkill[] => a.skills ?? [...EXAM_SKILLS];
const localDay = (iso: string) => {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return null;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`;
};
const dayNumber = (d: string) => { const [y, m, dd] = d.split("-").map(Number); return Math.round(Date.UTC(y!, m! - 1, dd!) / 86_400_000); };
const addDays = (d: string, n: number) => { const [y, m, dd] = d.split("-").map(Number); return new Date(Date.UTC(y!, m! - 1, dd! + n)).toISOString().slice(0, 10); };
const chronological = (h: readonly PrepAttempt[]) => [...h].sort((a, b) => a.finishedAt.localeCompare(b.finishedAt));

/** Skills of each set the learner has already seen in a finished attempt. */
export function exposure(history: readonly PrepAttempt[]): Map<string, Set<PrepSkill>> {
  const seen = new Map<string, Set<PrepSkill>>();
  for (const a of history) for (const s of skillsOf(a)) (seen.get(a.blueprintId) ?? seen.set(a.blueprintId, new Set()).get(a.blueprintId)!).add(s);
  return seen;
}

export function setStatuses(history: readonly PrepAttempt[], blueprintIds: readonly string[], chosen: readonly PrepSkill[]): SetStatus[] {
  const seen = exposure(history);
  return blueprintIds.map(id => {
    const s = seen.get(id) ?? new Set<PrepSkill>();
    return { blueprintId: id, seen: EXAM_SKILLS.filter(k => s.has(k)), unseenForChoice: chosen.every(k => !s.has(k)) };
  });
}

/** The first set whose tasks for the chosen skills were never seen; null when none is left. */
export function preferredBlueprint(history: readonly PrepAttempt[], blueprintIds: readonly string[], chosen: readonly PrepSkill[]): string | null {
  return setStatuses(history, blueprintIds, chosen).find(s => s.unseenForChoice)?.blueprintId ?? null;
}

/** For each attempt: the skills it repeated from an earlier attempt on the same set (familiar material, not unseen). */
export function repeatedSkills(history: readonly PrepAttempt[]): Map<string, PrepSkill[]> {
  const out = new Map<string, PrepSkill[]>();
  const sofar = new Map<string, Set<PrepSkill>>();
  for (const a of chronological(history)) {
    const before = sofar.get(a.blueprintId) ?? new Set<PrepSkill>();
    out.set(a.sessionId, skillsOf(a).filter(s => before.has(s)));
    for (const s of skillsOf(a)) before.add(s);
    sofar.set(a.blueprintId, before);
  }
  return out;
}

/** TZ-EXAM-19: 14 days after the latest rehearsal, an unseen set for the same skills is the delayed re-check. */
export function retestPlan(history: readonly PrepAttempt[], blueprintIds: readonly string[], today: string): RetestPlan {
  const last = chronological(history).at(-1);
  const lastOn = last ? localDay(last.finishedAt) : null;
  if (!last || !lastOn) return { lastOn: null, retestOn: null, due: false, unseenBlueprint: null, noneLeft: false };
  const unseen = preferredBlueprint(history, blueprintIds, skillsOf(last));
  const retestOn = addDays(lastOn, EXAM_RETEST_AFTER_DAYS);
  return { lastOn, retestOn, due: Boolean(unseen) && dayNumber(today) >= dayNumber(retestOn), unseenBlueprint: unseen, noneLeft: !unseen };
}

/** What to review in LEARN after a rehearsal, per skill — counts, never a level or a grade. */
export function learnFocus(bySkill: PrepAttempt["bySkill"]): LearnFocus[] {
  return EXAM_SKILLS.map(skill => {
    const b = bySkill[skill];
    return { skill, wrong: Math.max(0, b.objective - b.correct), unanswered: b.unanswered, ungraded: b.ungraded };   // unanswered is not part of objective
  }).filter(f => f.wrong + f.unanswered + f.ungraded > 0);
}
