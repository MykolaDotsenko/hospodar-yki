/**
 * «Господарство»: the learner's life in Finland as nine everyday places (the nine YKI keskitaso
 * themes). Hospodar = self-reliance in your own daily life (brand platform). Pure, deterministic,
 * framework-free (MODULE-BOUNDARIES).
 *
 * Game elements are allowed ONLY where research supports them (R08-MOT, MOT-E03/E09, GAM-01, UIO-09):
 *  - places are never locked: free choice of where to go (MOT-02, MOT-04);
 *  - a KEY is a verified independent success — the FIRST scored answer to a task, correct (MOT-07);
 *    a later correct retry or guided repair never adds a key (MOT-09);
 *  - an OPEN DOOR (the brand threshold) means "you have tried something here yourself"; ungraded
 *    Finnish writing/speaking counts as practice that is shown and valued, never as a score (MOT-08);
 *  - nothing decays, resets or is lost after a pause; no streak, XP, level, rank or comparison
 *    (MOT-04/05/06); never a CEFR or YKI estimate; never used in EXAM (MOT-01, MOT-15).
 */
import type { LearnerState } from "./learner.ts";

export const PLACE_IDS = ["identity", "housing", "services", "culture", "travel", "health", "work", "environment", "society"] as const;
export type PlaceId = typeof PLACE_IDS[number];

/** Theme keys used across the content banks → one of the nine places. Unknown keys map to null. */
const ALIASES: Record<string, PlaceId> = {
  identity: "identity", me: "identity",
  housing: "housing", home: "housing",
  services: "services", shopping: "services", online_shopping: "services",
  culture: "culture", leisure: "culture",
  travel: "travel", transport: "travel",
  health: "health",
  work: "work",
  environment: "environment",
  society: "society", official: "society", authorities: "society", courses: "society", education: "society",
  // Combined topic keys of the long listening lessons → the place their situation belongs to (editorial).
  education_work: "work", shopping_services: "services", community_environment: "environment", health_leisure: "health",
};
export function placeOfTheme(key: string | null | undefined): PlaceId | null {
  return key ? ALIASES[key] ?? null : null;
}

/** One LEARN content item that belongs to a place. Every evidence taskId of the item starts with `itemId`. */
export interface PlaceItem { itemId: string; place: PlaceId; /** The YKI skill it trains; none for vocabulary/grammar-only cards. */ skill?: YkiSkill }
export const YKI_SKILLS = ["reading", "listening", "writing", "speaking"] as const;
export type YkiSkill = typeof YKI_SKILLS[number];
export interface PlaceIndex { readonly items: readonly PlaceItem[] }

export function buildPlaceIndex(items: PlaceItem[]): PlaceIndex {
  const seen = new Map<string, PlaceItem>();
  for (const i of items) {
    const prev = seen.get(i.itemId);
    if (prev && (prev.place !== i.place || prev.skill !== i.skill)) throw new Error(`item ${i.itemId} is assigned to two places or skills`);
    seen.set(i.itemId, { itemId: i.itemId, place: i.place, ...(i.skill ? { skill: i.skill } : {}) });
  }
  // Longest id first, so "x-10" is never swallowed by "x-1".
  return Object.freeze({ items: Object.freeze([...seen.values()].sort((a, b) => b.itemId.length - a.itemId.length)) });
}

/** The item a piece of evidence belongs to: exact id or id followed by "-". */
export function placeOfTask(index: PlaceIndex, taskId: string): PlaceItem | null {
  for (const i of index.items) if (taskId === i.itemId || taskId.startsWith(`${i.itemId}-`)) return i;
  return null;
}

export interface PlaceProgress {
  place: PlaceId;
  /** Verified independent successes: first scored answer to a task, and it was correct. */
  keys: number;
  /** Own attempts that are not scored (Finnish writing/speaking, open answers, supported listening). */
  practice: number;
  /** Items of this place the learner has started at least once. */
  itemsTried: number;
  itemsTotal: number;
  /** The threshold is crossed: at least one own attempt here. */
  doorOpen: boolean;
}

export function placeProgress(state: LearnerState, index: PlaceIndex): PlaceProgress[] {
  const firstByTask = new Map<string, { status: string; correct?: boolean }>();
  for (const d of state.diagnostics ?? []) {                // diagnostics are append-only; the first record is the first attempt
    if (!firstByTask.has(d.taskId)) firstByTask.set(d.taskId, d);
  }
  const out = new Map<PlaceId, PlaceProgress>(PLACE_IDS.map(p => [p, { place: p, keys: 0, practice: 0, itemsTried: 0, itemsTotal: 0, doorOpen: false }]));
  for (const i of index.items) out.get(i.place)!.itemsTotal++;
  const tried = new Set<string>();
  for (const [taskId, d] of firstByTask) {
    const item = placeOfTask(index, taskId);
    if (!item) continue;
    const p = out.get(item.place)!;
    if (d.status === "scored") { if (d.correct === true) p.keys++; }
    else p.practice++;
    p.doorOpen = true;
    if (!tried.has(item.itemId)) { tried.add(item.itemId); p.itemsTried++; }
  }
  return PLACE_IDS.map(p => out.get(p)!);
}
