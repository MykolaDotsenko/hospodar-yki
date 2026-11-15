/**
 * Private "I did this in real life" marks for each place's optional real-life deed (method real-world-interaction, P0).
 *
 *  - private: kept only on this device, separate from learner progress, never exported or sent;
 *  - never graded: a mark is a date the learner chose to record — no count, score, streak, level or reward reads it;
 *  - reversible: the learner can remove a mark; erasing LEARN data removes all marks.
 */
import { PLACE_IDS, type PlaceId } from "./places.ts";

export interface DeedLog { version: 1; done: Partial<Record<PlaceId, string>> }
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const isPlace = (p: unknown): p is PlaceId => typeof p === "string" && (PLACE_IDS as readonly string[]).includes(p);

export const emptyDeedLog = (): DeedLog => ({ version: 1, done: {} });

/** Tolerant reader: anything unexpected is dropped, never turned into a mark. */
export function parseDeedLog(raw: unknown): DeedLog {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return emptyDeedLog();
  const r = raw as { version?: unknown; done?: unknown };
  if (r.version !== 1 || !r.done || typeof r.done !== "object" || Array.isArray(r.done)) return emptyDeedLog();
  const done: DeedLog["done"] = {};
  for (const [p, d] of Object.entries(r.done as Record<string, unknown>)) if (isPlace(p) && typeof d === "string" && DAY.test(d)) done[p] = d;
  return { version: 1, done };
}

export function markDeed(log: DeedLog, place: PlaceId, day: string): DeedLog {
  if (!isPlace(place)) throw new Error("UNKNOWN_PLACE");
  if (!DAY.test(day)) throw new Error("BAD_DAY");
  return { version: 1, done: { ...log.done, [place]: day } };
}

export function unmarkDeed(log: DeedLog, place: PlaceId): DeedLog {
  const done = { ...log.done };
  delete done[place];
  return { version: 1, done };
}

export const deedDoneOn = (log: DeedLog, place: PlaceId): string | null => log.done[place] ?? null;
