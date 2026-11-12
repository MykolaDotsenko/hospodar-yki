/**
 * Майстерня слабких місць — deliberate practice on a recurring grammar error with interleaving and a delayed
 * re-test (methods error-bottleneck-deliberate, interleaving-grammar; PSY-06, COG-10, GL-03). Pure, deterministic.
 *
 * Rules (evidence only from the learner's own FIRST attempts — MOT-07/09):
 *  - a family of confusable forms (e.g. location cases) is a bottleneck when the first attempt was wrong on
 *    at least two different tasks of that family; a later correct retry or a guided repair never clears it;
 *  - the practice set is 3–5 tasks the learner has NEVER seen (a new situation, not memorised keys), mixed
 *    across the family's forms — most-missed form first, then round-robin (interleaving, not blocked drill);
 *  - seven calendar days after the last practice in the family, the next new task is a delayed check; its first
 *    answer is reported as delayed independent evidence — never as "mastered", a level or a YKI estimate;
 *  - when fewer than three new tasks remain the set is marked thin; no task is invented or repeated to fill it.
 */
import type { LearnerState, LocalDate } from "./learner.ts";

export const BOTTLENECK_MIN_WRONG = 2;
export const WORKSHOP_SET_MAX = 5;
export const WORKSHOP_SET_MIN = 3;
export const RETEST_AFTER_DAYS = 7;

export interface GrammarFamily { id: string; tags: readonly string[] }
export interface WorkshopItem { id: string; tag: string }
export interface DelayedResult { taskId: string; gapDays: number; correct: boolean }
export interface FamilyStatus {
  family: string;
  attempted: number;        // distinct tasks of the family the learner has answered
  wrongFirst: number;       // of those, how many had a wrong FIRST answer
  wrongByTag: Record<string, number>;
  isBottleneck: boolean;
  set: string[];            // up to 5 never-seen tasks, interleaved
  thin: boolean;            // fewer than 3 new tasks left
  lastPracticeOn: LocalDate | null;
  retestOn: LocalDate | null;
  retestDue: boolean;
  delayed: DelayedResult[]; // first answers given ≥ 7 days after the previous practice in the family
}

const dayNumber = (d: string) => { const [y, m, dd] = d.split("-").map(Number); return Math.round(Date.UTC(y!, m! - 1, dd!) / 86_400_000); };
const localOf = (iso: string) => {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return null;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`;
};
const addDays = (d: LocalDate, n: number): LocalDate => {
  const [y, m, dd] = d.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, dd! + n)).toISOString().slice(0, 10);
};

/** Validates that every item belongs to exactly one family. */
export function familyOfTag(families: readonly GrammarFamily[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const f of families) for (const t of f.tags) {
    if (map.has(t)) throw new Error(`tag ${t} is in two families`);
    map.set(t, f.id);
  }
  return map;
}

export function workshopStatus(state: LearnerState, families: readonly GrammarFamily[], items: readonly WorkshopItem[], today: LocalDate): FamilyStatus[] {
  const tagFamily = familyOfTag(families);
  const itemTag = new Map(items.map(i => [i.id, i.tag]));
  // First attempt per task (attempts are append-only and chronological).
  const first = new Map<string, { correct: boolean; on: LocalDate; at: string }>();
  const practiceDays = new Map<string, LocalDate[]>();                  // family → local days with any attempt
  for (const a of state.attempts ?? []) {
    const tag = itemTag.get(a.taskId);
    const fam = tag ? tagFamily.get(tag) : undefined;
    const on = typeof a.completedAt === "string" ? localOf(a.completedAt) : null;
    if (!fam || !on) continue;
    if (!first.has(a.taskId)) first.set(a.taskId, { correct: a.firstCorrect === true, on, at: a.completedAt });
    (practiceDays.get(fam) ?? practiceDays.set(fam, []).get(fam)!).push(on);
  }

  return families.map(f => {
    const famItems = items.filter(i => f.tags.includes(i.tag));
    const seen = famItems.filter(i => first.has(i.id));
    const wrongByTag: Record<string, number> = {};
    for (const i of seen) if (!first.get(i.id)!.correct) wrongByTag[i.tag] = (wrongByTag[i.tag] ?? 0) + 1;
    const wrongFirst = Object.values(wrongByTag).reduce((n, x) => n + x, 0);

    // Interleaved set of never-seen tasks: most-missed form first, then round-robin across forms.
    const unseenByTag = new Map<string, string[]>();
    for (const i of famItems) if (!first.has(i.id)) (unseenByTag.get(i.tag) ?? unseenByTag.set(i.tag, []).get(i.tag)!).push(i.id);
    const tagOrder = [...unseenByTag.keys()].sort((a, b) => (wrongByTag[b] ?? 0) - (wrongByTag[a] ?? 0) || f.tags.indexOf(a) - f.tags.indexOf(b));
    const set: string[] = [];
    for (let round = 0; set.length < WORKSHOP_SET_MAX; round++) {
      let added = false;
      for (const t of tagOrder) { const id = unseenByTag.get(t)![round]; if (id && set.length < WORKSHOP_SET_MAX) { set.push(id); added = true; } }
      if (!added) break;
    }

    const days = (practiceDays.get(f.id) ?? []).slice().sort();
    const lastPracticeOn = days.length ? days[days.length - 1]! : null;
    const isBottleneck = wrongFirst >= BOTTLENECK_MIN_WRONG;
    const retestOn = isBottleneck && lastPracticeOn ? addDays(lastPracticeOn, RETEST_AFTER_DAYS) : null;
    const retestDue = Boolean(retestOn && set.length > 0 && dayNumber(today) >= dayNumber(retestOn));

    // Delayed evidence: a task's first answer given ≥ 7 days after the previous practice day in the family.
    const delayed: DelayedResult[] = [];
    for (const i of seen) {
      const fa = first.get(i.id)!;
      const before = days.filter(d => d < fa.on);
      const prev = before.length ? before[before.length - 1]! : null;
      if (prev) {
        const gap = dayNumber(fa.on) - dayNumber(prev);
        if (gap >= RETEST_AFTER_DAYS) delayed.push({ taskId: i.id, gapDays: gap, correct: fa.correct });
      }
    }
    return { family: f.id, attempted: seen.length, wrongFirst, wrongByTag, isBottleneck, set, thin: set.length < WORKSHOP_SET_MIN,
      lastPracticeOn, retestOn, retestDue, delayed };
  }).sort((a, b) => Number(b.isBottleneck) - Number(a.isBottleneck) || b.wrongFirst - a.wrongFirst);
}
