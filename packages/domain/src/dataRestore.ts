/**
 * Validate a NEW Web v1 "My data" export before a LEARN-only restore.
 *
 * The existing export is an access/portability file, not a signed backup. Counts
 * alone are insufficient for ingestion: typed, lossless validation is mandatory.
 * Never mix EXAM history/recording receipts into LEARN. No browser or storage APIs.
 */
import { readState, HISTORY_LIMIT, ERROR_LIMIT, INTERVAL_DAYS, type LearnerState } from "./learner.ts";
import { verifyDataExport, type DataExport, type DataExportCounts } from "./dataExport.ts";

export const MAX_WEB_BACKUP_CHARS = 8_000_000;
export type WebRestoreImport = {
  id: string; source: "legacy_v1_file" | "legacy_v1_this_device";
  originalSha256: string; originalBytes: number;
  counts: { attempts: number; diagnostics: number; errors: number; retention: number; cards: number };
  importedAt: string; revision: number;
};
export type WebLearnRestoreCheck =
  | { ok: true; state: LearnerState; imports: WebRestoreImport[]; counts: DataExportCounts; hasExamData: boolean }
  | { ok: false; reason: "TOO_LARGE" | "NOT_JSON" | "WRONG_FORMAT" | "UNSUPPORTED_VERSION" | "MALFORMED" | "COUNT_MISMATCH" | "UNSAFE_LEARN_DATA" | "UNSAFE_IMPORT_RECEIPTS" };

type Rec = Record<string, unknown>;
const obj = (v: unknown): v is Rec => v !== null && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown, max = 1600): v is string => typeof v === "string" && v.length <= max;
const nonempty = (v: unknown): v is string => str(v) && v.trim().length > 0;
const id = (v: unknown) => typeof v === "string" && /^[a-z\d_-]{1,100}$/i.test(v);
const integer = (v: unknown, min = 0) => Number.isSafeInteger(v) && (v as number) >= min;
const utc = (v: unknown) => {
  if (typeof v !== "string" || !Number.isFinite(Date.parse(v))) return false;
  try { return new Date(v).toISOString() === v; } catch { return false; }
};
const date = (v: unknown) => {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + "T00:00:00.000Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};
const exactKeys = (v: Rec, keys: string[]) => Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k));
const stable = (v: unknown): string => JSON.stringify(v, (_key, item: unknown) =>
  obj(item) ? Object.fromEntries(Object.keys(item).sort().map(k => [k, item[k]])) : item);

function validState(s: LearnerState): boolean {
  if (!obj(s) || !exactKeys(s, ["version", "attempts", "cards", "diagnostics", "errors", "retention"]) ||
      s.version !== 1 || !Array.isArray(s.attempts) || !Array.isArray(s.diagnostics) ||
      !Array.isArray(s.errors) || !Array.isArray(s.retention) || !obj(s.cards) ||
      s.attempts.length > HISTORY_LIMIT || s.diagnostics.length > HISTORY_LIMIT ||
      s.retention.length > HISTORY_LIMIT || s.errors.length > ERROR_LIMIT) return false;
  const attempts = s.attempts.every(a => obj(a) && exactKeys(a, ["taskId", "grammarTag", "firstAnswer", "firstCorrect", "secondAnswer", "repairCorrect", "transferText", "transferScoring", "skill", "completedAt"]) && id(a.taskId) && str(a.grammarTag, 50) &&
    nonempty(a.firstAnswer) && typeof a.firstCorrect === "boolean" &&
    str(a.secondAnswer) && (a.repairCorrect === null || typeof a.repairCorrect === "boolean") &&
    nonempty(a.transferText) && a.transferScoring === "ungraded" && a.skill === "grammar" && utc(a.completedAt));
  const diagnostics = s.diagnostics.every(d => obj(d) && exactKeys(d, d.status === "scored" ? ["skill", "taskId", "status", "correct", "response", "completedAt"] : ["skill", "taskId", "status", "response", "completedAt"]) && id(d.taskId) &&
    ["reading", "listening", "writing", "speaking"].includes(String(d.skill)) &&
    (d.status === "scored"
      ? ["reading", "listening"].includes(String(d.skill)) && typeof d.correct === "boolean"
      : d.status === "ungraded" && d.correct === undefined) &&
    str(d.response) && utc(d.completedAt));
  const errors = s.errors.every(e => obj(e) && exactKeys(e, ["taskId", "grammarTag", "at", "resolution"]) && id(e.taskId) && str(e.grammarTag, 50) &&
    utc(e.at) && ["guided_repair", "not_yet_demonstrated"].includes(String(e.resolution)));
  const retention = s.retention.every(r => obj(r) && Object.keys(r).every(k => ["taskId", "day", "status", "independent", "response", "submittedAt", "actualAgeDays", "lateByDays"].includes(k)) && id(r.taskId) &&
    [7, 14, 30].includes(r.day) && r.status === "ungraded" && r.independent === true &&
    nonempty(r.response) && utc(r.submittedAt) &&
    (r.actualAgeDays === undefined || integer(r.actualAgeDays, r.day)) &&
    (r.lateByDays === undefined || integer(r.lateByDays)));
  const cards = Object.entries(s.cards).every(([key, c]) => id(key) && obj(c) && exactKeys(c, ["stage", "due", "reviews", "failures", "lastCorrect", "lastReviewed"]) &&
    integer(c.stage) && c.stage <= INTERVAL_DAYS.length && date(c.due) &&
    integer(c.reviews) && integer(c.failures) && typeof c.lastCorrect === "boolean" &&
    (c.lastReviewed === "" || date(c.lastReviewed)));
  if (!attempts || !diagnostics || !errors || !retention || !cards) return false;

  // The legacy V1 tolerant reader silently truncates/filters invalid fields.
  // Reject any file that would be changed by it (including unknown top-level keys).
  const reloaded = readState(JSON.stringify(s));
  return !reloaded.recovered && stable(reloaded.state) === stable(s);
}

function validImports(xs: unknown[]): xs is WebRestoreImport[] {
  if (xs.length > 2000) return false;
  const seen = new Set<string>();
  return xs.every(x => {
    if (!obj(x) || !exactKeys(x, ["id", "source", "originalSha256", "originalBytes", "counts", "importedAt", "revision"]) ||
        typeof x.id !== "string" || !/^import-[a-z\d_-]{1,100}$/i.test(x.id) || seen.has(x.id) ||
        !["legacy_v1_file", "legacy_v1_this_device"].includes(String(x.source)) ||
        typeof x.originalSha256 !== "string" || !/^[a-f0-9]{64}$/.test(x.originalSha256) ||
        !integer(x.originalBytes) || !utc(x.importedAt) || !integer(x.revision, 1) || !obj(x.counts)) return false;
    seen.add(x.id);
    return exactKeys(x.counts, ["attempts", "diagnostics", "errors", "retention", "cards"]) &&
      Object.values(x.counts).every(n => integer(n));
  });
}

/** Inspect only; caller must still enforce empty destination and revision CAS transactionally. */
export function inspectWebLearnBackup(text: string): WebLearnRestoreCheck {
  if (typeof text !== "string" || text.length > MAX_WEB_BACKUP_CHARS)
    return { ok: false, reason: "TOO_LARGE" };
  const basic = verifyDataExport(text);
  if (!basic.ok) return basic;
  const data = JSON.parse(text) as DataExport;
  if (!validState(data.learn.state)) return { ok: false, reason: "UNSAFE_LEARN_DATA" };
  if (!validImports(data.learn.importReceipts)) return { ok: false, reason: "UNSAFE_IMPORT_RECEIPTS" };
  if (!integer(data.learn.revision) || !utc(data.exportedAt) || typeof data.contentVersion !== "string")
    return { ok: false, reason: "MALFORMED" };
  return { ok: true, state: data.learn.state, imports: data.learn.importReceipts,
    counts: basic.counts, hasExamData: basic.counts.examCurrent > 0 || basic.counts.examHistory > 0 };
}
