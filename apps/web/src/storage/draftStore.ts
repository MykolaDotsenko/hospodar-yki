/**
 * Unfinished LEARN lessons kept on this device (COG-11 pause/resume). One record per item, at most `limit` (the oldest
 * is dropped). Never exported, never evidence, erased with LEARN data. Every write is read back; a refused write throws
 * and the caller says so — it is never shown as kept.
 */
export interface DraftStore<T extends { savedAt: string }> {
  read(): Record<string, T>;
  write(id: string, d: T): void;
  clear(id: string): void;
  has(): boolean;
  clearAll(): void;
}
export function createDraftStore<T extends { savedAt: string }>(key: string, limit = 20): DraftStore<T> {
  const read = (): Record<string, T> => {
    try { const raw = localStorage.getItem(key); const v = raw ? JSON.parse(raw) : {}; return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
    catch { return {}; }
  };
  const put = (all: Record<string, T>) => {
    const text = JSON.stringify(all);
    if (text === "{}") localStorage.removeItem(key); else localStorage.setItem(key, text);
    if ((localStorage.getItem(key) ?? "{}") !== text) throw new Error("READBACK_MISMATCH");
  };
  return {
    read,
    write(id, d) {
      const kept = Object.entries({ ...read(), [id]: d }).sort(([, a], [, b]) => String(b.savedAt).localeCompare(String(a.savedAt))).slice(0, limit);
      put(Object.fromEntries(kept));
    },
    clear(id) { const all = read(); if (id in all) { delete all[id]; put(all); } },
    has: () => localStorage.getItem(key) !== null,
    clearAll() { localStorage.removeItem(key); if (localStorage.getItem(key) !== null) throw new Error("DELETE_NOT_VERIFIED"); },
  };
}
