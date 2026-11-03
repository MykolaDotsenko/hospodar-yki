/**
 * G2-b legacy LEARN V1 import check (TS port of app/r11-legacy-migration-preflight.mjs
 * + the extra history checks of app/learn-backup.mjs inspectLearnBackup; parity-tested).
 * Read-only: blocks any input the V1 reader would silently filter or truncate, unknown
 * fields/versions, and history the UI could not render. Returns counts only — no answers.
 */
import { INTERVAL_DAYS, readState, VERSION, type LearnerState } from "./learner.ts";

export const MAX_LEGACY_CHARS = 8_000_000;
const ALLOWED_ROOT = new Set(["version", "attempts", "cards", "diagnostics", "errors", "retention"]);
const ALLOWED_CARD = new Set(["stage", "due", "reviews", "failures", "lastCorrect", "lastReviewed"]);
const ENTRY_ID = /^[a-z\d_-]{1,100}$/i;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_COUNTS = { attempts: 120, diagnostics: 120, errors: 160, retention: 120 } as const;

export type LegacyCounts = { attempts: number; diagnostics: number; errors: number; retention: number; cards: number };
export type LegacyReason =
  | "NO_OLD_STATE" | "NOT_STRING_OR_TOO_LARGE" | "INVALID_JSON" | "INVALID_ROOT" | "UNSUPPORTED_VERSION"
  | "UNKNOWN_ROOT_FIELDS" | "INVALID_LEGACY_SHAPE" | "HISTORY_WOULD_BE_TRUNCATED" | "INVALID_LEGACY_ENTRY"
  | "INVALID_OR_UNRECOGNIZED_CARD" | "LEGACY_READER_FAILED" | "LEGACY_READER_WOULD_DROP_DATA"
  | "INVALID_HISTORY_FOR_ACTIVE_UI" | "READY";
export interface LegacyInspection {
  status: "empty" | "blocked" | "ready";
  reason: LegacyReason;
  counts: LegacyCounts | null;
  /** Present only when ready: the exact state the V1 app itself would load. */
  state?: LearnerState;
}

type Loose = Record<string, unknown>;
const plain = (x: unknown): x is Loose => x !== null && typeof x === "object" && !Array.isArray(x) &&
  (Object.getPrototypeOf(x) === Object.prototype || Object.getPrototypeOf(x) === null);
function validDay(s: unknown) {
  if (typeof s !== "string" || !DAY.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number) as [number, number, number];
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() + 1 === m && t.getUTCDate() === d;
}
const count = (s: { attempts: unknown[]; diagnostics: unknown[]; errors: unknown[]; retention?: unknown[]; cards: object }): LegacyCounts => ({
  attempts: s.attempts.length, diagnostics: s.diagnostics.length, errors: s.errors.length,
  retention: (s.retention || []).length, cards: Object.keys(s.cards).length,
});
const r = (status: LegacyInspection["status"], reason: LegacyReason, counts: LegacyCounts | null = null): LegacyInspection =>
  ({ status, reason, counts: counts ? { ...counts } : null });
const validDate = (x: unknown) => typeof x === "string" && !Number.isNaN(Date.parse(x));

export function inspectLegacyProgress(raw: unknown): LegacyInspection {
  if (raw === null || raw === undefined || raw === "") return r("empty", "NO_OLD_STATE");
  if (typeof raw !== "string" || raw.length > MAX_LEGACY_CHARS) return r("blocked", "NOT_STRING_OR_TOO_LARGE");
  let o: unknown;
  try { o = JSON.parse(raw); } catch { return r("blocked", "INVALID_JSON"); }
  if (!plain(o)) return r("blocked", "INVALID_ROOT");
  if (o.version !== VERSION) return r("blocked", "UNSUPPORTED_VERSION");
  if (Object.keys(o).some(k => !ALLOWED_ROOT.has(k))) return r("blocked", "UNKNOWN_ROOT_FIELDS");
  if (!Array.isArray(o.attempts) || !Array.isArray(o.diagnostics) || !Array.isArray(o.errors) || !plain(o.cards) ||
    (Object.hasOwn(o, "retention") && !Array.isArray(o.retention))) return r("blocked", "INVALID_LEGACY_SHAPE");
  const shape = o as { attempts: unknown[]; diagnostics: unknown[]; errors: unknown[]; retention?: unknown[]; cards: Loose };
  const counts = count(shape);
  for (const [name, max] of Object.entries(MAX_COUNTS))
    if (counts[name as keyof typeof MAX_COUNTS] > max) return r("blocked", "HISTORY_WOULD_BE_TRUNCATED", counts);
  if (shape.attempts.some(x => !plain(x) || typeof x.taskId !== "string") ||
    shape.diagnostics.some(x => !plain(x) || typeof x.skill !== "string") ||
    shape.errors.some(x => !plain(x) || typeof x.taskId !== "string")) return r("blocked", "INVALID_LEGACY_ENTRY", counts);
  if (Object.entries(shape.cards).some(([id, c]) => !ENTRY_ID.test(id) || !plain(c) ||
    Object.keys(c).some(k => !ALLOWED_CARD.has(k)) || !Number.isInteger(c.stage) || (c.stage as number) < 0 ||
    (c.stage as number) > INTERVAL_DAYS.length || !validDay(c.due) ||
    (c.reviews !== undefined && (!Number.isInteger(c.reviews) || (c.reviews as number) < 0)) ||
    (c.failures !== undefined && (!Number.isInteger(c.failures) || (c.failures as number) < 0)) ||
    (c.lastCorrect !== undefined && typeof c.lastCorrect !== "boolean") ||
    (c.lastReviewed !== undefined && typeof c.lastReviewed !== "string")))
    return r("blocked", "INVALID_OR_UNRECOGNIZED_CARD", counts);
  const parsed = readState(raw);
  if (parsed.recovered || !parsed.state) return r("blocked", "LEGACY_READER_FAILED", counts);
  const actual = count(parsed.state);
  for (const k of Object.keys(counts) as Array<keyof LegacyCounts>)
    if (counts[k] !== actual[k]) return r("blocked", "LEGACY_READER_WOULD_DROP_DATA", counts);
  // learn-backup.mjs: history must be renderable by the active UI.
  const p = o as { errors: Loose[]; attempts: Loose[]; diagnostics: Loose[] };
  if (p.errors.some(e => !validDate(e.at)) ||
    p.attempts.some(e => typeof e.firstAnswer !== "string" || typeof e.firstCorrect !== "boolean" ||
      typeof e.transferText !== "string" || !validDate(e.completedAt)) ||
    p.diagnostics.some(e => !["reading", "listening", "writing", "speaking"].includes(e.skill as string) ||
      !["scored", "ungraded"].includes(e.status as string) || !validDate(e.completedAt) ||
      (e.status === "scored" && (!["reading", "listening"].includes(e.skill as string) || typeof e.correct !== "boolean")) ||
      (e.status === "ungraded" && e.correct !== undefined)))
    return r("blocked", "INVALID_HISTORY_FOR_ACTIVE_UI", counts);
  return { ...r("ready", "READY", counts), state: parsed.state };
}

/** Learner-facing explanation of each verdict (Ukrainian). */
export const LEGACY_REASON_UK: Record<LegacyReason, string> = {
  NO_OLD_STATE: "Прогресу попередньої версії не знайдено.",
  NOT_STRING_OR_TOO_LARGE: "Файл завеликий або не текстовий.",
  INVALID_JSON: "Файл пошкоджений: це не коректний JSON.",
  INVALID_ROOT: "Це не файл прогресу Hospodar YKI.",
  UNSUPPORTED_VERSION: "Невідома версія файлу прогресу — перенесення заблоковано, щоб нічого не втратити.",
  UNKNOWN_ROOT_FIELDS: "У файлі є невідомі дані — перенесення заблоковано, щоб нічого не втратити.",
  INVALID_LEGACY_SHAPE: "Структура файлу не відповідає прогресу попередньої версії.",
  HISTORY_WOULD_BE_TRUNCATED: "Історія довша, ніж може зберегти перенесення, — частину було б обрізано. Перенесення заблоковано.",
  INVALID_LEGACY_ENTRY: "Деякі записи історії пошкоджені.",
  INVALID_OR_UNRECOGNIZED_CARD: "Деякі картки повторення пошкоджені або невідомого формату.",
  LEGACY_READER_FAILED: "Попередня версія сама не змогла б прочитати ці дані.",
  LEGACY_READER_WOULD_DROP_DATA: "Частину записів було б тихо відкинуто — перенесення заблоковано.",
  INVALID_HISTORY_FOR_ACTIVE_UI: "Деякі записи історії неповні (немає дати чи відповіді).",
  READY: "Дані можна перенести без втрат.",
};
