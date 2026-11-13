/**
 * YKI preparation map (yki-constructive-alignment): the nine YKI keskitaso themes × the four YKI skills.
 * Pure and deterministic; derived from the learner's FIRST attempts only (diagnostics are append-only).
 *
 *  - a cell counts the LEARN items of that theme and skill, how many the learner has tried, and how many first
 *    scored answers were correct ("keys") — counts only, never a percentage, level, grade or pass prediction;
 *  - ungraded Finnish writing/speaking is shown as own practice, never as success (MOT-08);
 *  - a cell with no items is a CONTENT gap of the app, stated honestly — not a learner weakness;
 *  - exam items are never part of LEARN pools, so they never appear here (EXAM-11).
 * The can-do lines are an editorial summary of public YKI task descriptions, not OPH assessment criteria.
 */
import type { LearnerState } from "./learner.ts";
import { PLACE_IDS, placeOfTask, YKI_SKILLS, type PlaceId, type PlaceIndex, type YkiSkill } from "./places.ts";

export interface CoverageCell { place: PlaceId; skill: YkiSkill; itemsTotal: number; itemsTried: number; keys: number; practice: number }
export interface CoverageSummary { cells: CoverageCell[]; contentGaps: CoverageCell[]; untried: CoverageCell[]; triedCells: number; availableCells: number }

export function coverageMap(state: LearnerState, index: PlaceIndex): CoverageSummary {
  const key = (p: PlaceId, s: YkiSkill) => `${p}:${s}`;
  const cells = new Map<string, CoverageCell>();
  for (const p of PLACE_IDS) for (const s of YKI_SKILLS) cells.set(key(p, s), { place: p, skill: s, itemsTotal: 0, itemsTried: 0, keys: 0, practice: 0 });
  for (const i of index.items) if (i.skill) cells.get(key(i.place, i.skill))!.itemsTotal++;

  const first = new Map<string, { status: string; correct?: boolean }>();
  for (const d of state.diagnostics ?? []) if (!first.has(d.taskId)) first.set(d.taskId, d);
  const triedItems = new Set<string>();
  for (const [taskId, d] of first) {
    const item = placeOfTask(index, taskId);
    if (!item?.skill) continue;
    const c = cells.get(key(item.place, item.skill))!;
    if (d.status === "scored") { if (d.correct === true) c.keys++; } else c.practice++;
    if (!triedItems.has(item.itemId)) { triedItems.add(item.itemId); c.itemsTried++; }
  }
  const all = [...cells.values()];
  const available = all.filter(c => c.itemsTotal > 0);
  return {
    cells: all,
    contentGaps: all.filter(c => c.itemsTotal === 0),
    untried: available.filter(c => c.itemsTried === 0),
    triedCells: available.filter(c => c.itemsTried > 0).length,
    availableCells: available.length,
  };
}

/** What each skill asks the learner to DO (editorial, from public YKI keskitaso task descriptions; not OPH criteria). */
export const SKILL_CAN_DO_UK: Record<YkiSkill, string> = {
  reading: "Розумію головне й потрібні деталі в побутовому тексті: оголошенні, листі, інструкції.",
  listening: "Розумію головне й потрібні деталі в розмові чи оголошенні на побутову тему.",
  writing: "Пишу зрозуміле повідомлення чи думку: хто, що, коли, чому — для конкретного адресата.",
  speaking: "Говорю в ситуації: прошу, пояснюю, домовляюся, висловлюю думку й обґрунтовую її.",
};
