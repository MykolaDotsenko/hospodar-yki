/**
 * Unfinished practice cards kept on this device (COG-11 pause/resume; first answer frozen). One record per card,
 * at most PRACTICE_DRAFT_LIMIT (the oldest is dropped). Never exported, never evidence, erased with LEARN data.
 * Every write is read back; a refused write is reported by the caller, never shown as kept.
 */
import type { PracticeDraft } from "@hospodar/domain";

export const PRACTICE_DRAFTS_KEY = "hospodar-yki:web:practice-drafts:v1";
export const PRACTICE_DRAFT_LIMIT = 20;
type Drafts = Record<string, PracticeDraft>;

export function readPracticeDrafts(): Drafts {
  try {
    const raw = localStorage.getItem(PRACTICE_DRAFTS_KEY);
    const v = raw ? JSON.parse(raw) : {};
    return v && typeof v === "object" && !Array.isArray(v) ? v as Drafts : {};
  } catch { return {}; }
}
const put = (drafts: Drafts) => {
  const text = JSON.stringify(drafts);
  if (text === "{}") localStorage.removeItem(PRACTICE_DRAFTS_KEY); else localStorage.setItem(PRACTICE_DRAFTS_KEY, text);
  if ((localStorage.getItem(PRACTICE_DRAFTS_KEY) ?? "{}") !== text) throw new Error("READBACK_MISMATCH");
};
/** Keeps (or replaces) one card's draft. Throws when the browser refused it. */
export function writePracticeDraft(d: PracticeDraft): void {
  const all = { ...readPracticeDrafts(), [d.cardId]: d };
  const kept = Object.values(all).sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt))).slice(0, PRACTICE_DRAFT_LIMIT);
  put(Object.fromEntries(kept.map(x => [x.cardId, x])));
}
export function clearPracticeDraft(cardId: string): void {
  const all = readPracticeDrafts();
  if (!(cardId in all)) return;
  delete all[cardId];
  put(all);
}
export const hasPracticeDrafts = () => localStorage.getItem(PRACTICE_DRAFTS_KEY) !== null;
/** Throws when anything is still there afterwards. */
export function clearPracticeDrafts(): void {
  localStorage.removeItem(PRACTICE_DRAFTS_KEY);
  if (localStorage.getItem(PRACTICE_DRAFTS_KEY) !== null) throw new Error("DELETE_NOT_VERIFIED");
}
