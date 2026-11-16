/**
 * Private "I did this in real life" marks for each place's optional real-life deed (method real-world-interaction, P0).
 *
 *  - private: kept only on this device, separate from learner progress, never exported or sent;
 *  - never graded: a mark is a date the learner chose to record — no count, score, streak, level or reward reads it;
 *  - reversible: the learner can remove a mark; erasing LEARN data removes all marks.
 *
 * After a mark the learner may add a short private reflection (self-regulated learning: plan → do → reflect → plan): how
 * it went in their own words of choice, and what they want to say differently next time. It exists only next to a mark,
 * is shown back on the next visit to that place, is removed with the mark, and is never a score, count or evidence of
 * Finnish ability — the app cannot know what happened outside it.
 */
import { PLACE_IDS, type PlaceId } from "./places.ts";

export type DeedWent = "well" | "partly" | "hard";
export interface DeedNote { went: DeedWent; next_uk: string }
export interface DeedLog { version: 1; done: Partial<Record<PlaceId, string>>; notes?: Partial<Record<PlaceId, DeedNote>> }
export const DEED_NOTE_MAX_CHARS = 300;
export const DEED_WENT: readonly DeedWent[] = Object.freeze(["well", "partly", "hard"]);
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const isPlace = (p: unknown): p is PlaceId => typeof p === "string" && (PLACE_IDS as readonly string[]).includes(p);
const isWent = (w: unknown): w is DeedWent => typeof w === "string" && (DEED_WENT as readonly string[]).includes(w);

export const emptyDeedLog = (): DeedLog => ({ version: 1, done: {} });

/** Tolerant reader: anything unexpected is dropped, never turned into a mark; a note without its mark is dropped too. */
export function parseDeedLog(raw: unknown): DeedLog {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return emptyDeedLog();
  const r = raw as { version?: unknown; done?: unknown; notes?: unknown };
  if (r.version !== 1 || !r.done || typeof r.done !== "object" || Array.isArray(r.done)) return emptyDeedLog();
  const done: DeedLog["done"] = {};
  for (const [p, d] of Object.entries(r.done as Record<string, unknown>)) if (isPlace(p) && typeof d === "string" && DAY.test(d)) done[p] = d;
  const notes: NonNullable<DeedLog["notes"]> = {};
  if (r.notes && typeof r.notes === "object" && !Array.isArray(r.notes)) {
    for (const [p, n] of Object.entries(r.notes as Record<string, unknown>)) {
      const x = n as { went?: unknown; next_uk?: unknown } | null;
      if (isPlace(p) && done[p] && x && isWent(x.went) && typeof x.next_uk === "string" && x.next_uk.length <= DEED_NOTE_MAX_CHARS)
        notes[p] = { went: x.went, next_uk: x.next_uk };
    }
  }
  return Object.keys(notes).length ? { version: 1, done, notes } : { version: 1, done };
}

export function markDeed(log: DeedLog, place: PlaceId, day: string): DeedLog {
  if (!isPlace(place)) throw new Error("UNKNOWN_PLACE");
  if (!DAY.test(day)) throw new Error("BAD_DAY");
  return { ...log, version: 1, done: { ...log.done, [place]: day } };
}

export function unmarkDeed(log: DeedLog, place: PlaceId): DeedLog {
  const done = { ...log.done };
  delete done[place];
  const notes = { ...(log.notes ?? {}) };
  delete notes[place];                                                     // a reflection never outlives its mark
  return Object.keys(notes).length ? { version: 1, done, notes } : { version: 1, done };
}

/** Saves (or replaces) the private reflection for a marked deed; "how it went" is required, the note may be empty. */
export function setDeedNote(log: DeedLog, place: PlaceId, went: DeedWent, next_uk: string): DeedLog {
  if (!isPlace(place)) throw new Error("UNKNOWN_PLACE");
  if (!log.done[place]) throw new Error("NOT_MARKED");
  if (!isWent(went)) throw new Error("BAD_WENT");
  const text = String(next_uk ?? "").trim().replace(/\s+/g, " ");
  if (text.length > DEED_NOTE_MAX_CHARS) throw new Error("TOO_LONG");
  return { ...log, notes: { ...(log.notes ?? {}), [place]: { went, next_uk: text } } };
}

export function clearDeedNote(log: DeedLog, place: PlaceId): DeedLog {
  const notes = { ...(log.notes ?? {}) };
  delete notes[place];
  return Object.keys(notes).length ? { version: 1, done: log.done, notes } : { version: 1, done: log.done };
}

export const deedDoneOn = (log: DeedLog, place: PlaceId): string | null => log.done[place] ?? null;
export const deedNote = (log: DeedLog, place: PlaceId): DeedNote | null => log.notes?.[place] ?? null;
