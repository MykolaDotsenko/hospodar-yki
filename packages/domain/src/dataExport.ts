/**
 * "My data" export (LEARN-16, WEB-07; GDPR access/portability in spirit): one JSON document with EVERYTHING the
 * new web app keeps on this device — LEARN progress + import receipts, and EXAM rehearsal + attempt history, in
 * two clearly separated sections (ExamCheckpoint ≠ FirstAttemptEvent; exam data never becomes learning evidence).
 *
 * Pure and framework independent: the caller reads storage, this module only shapes, counts and verifies.
 * The document carries its own counts; `verifyDataExport` re-parses the exact text and recomputes them, so the
 * UI offers the download only for a file that reads back identically (fail closed, no fabricated success).
 * No grade, level or pass prediction is added — the export holds raw records only.
 */
import type { LearnerState } from "./learner.ts";

export const DATA_EXPORT_FORMAT = "hospodar-yki-web-export";
export const DATA_EXPORT_VERSION = 1;

export interface DataExportInput {
  learn: { state: LearnerState; revision: number; imports: unknown[] };
  exam: { current: unknown | null; history: unknown[] };
  exportedAt: Date;
  contentVersion?: string;
}
export interface DataExportCounts {
  attempts: number; diagnostics: number; errors: number; retention: number; cards: number; imports: number;
  examCurrent: number; examHistory: number;
}
export interface DataExport {
  format: typeof DATA_EXPORT_FORMAT; version: typeof DATA_EXPORT_VERSION; exportedAt: string; contentVersion: string;
  notice_uk: string;
  counts: DataExportCounts;
  learn: { revision: number; state: LearnerState; importReceipts: unknown[] };
  exam: { current: unknown | null; history: unknown[] };
}

const NOTICE_UK = "Копія твоїх даних з Hospodar YKI (нова вебверсія) на цьому пристрої. Навчання й пробні іспити — окремі розділи. " +
  "Тут немає оцінки рівня чи прогнозу YKI. Файл може містити твої власні тексти — зберігай його приватно.";

export function countsOf(learn: { state: LearnerState; imports: unknown[] }, exam: { current: unknown | null; history: unknown[] }): DataExportCounts {
  const s = learn.state;
  return { attempts: s.attempts.length, diagnostics: s.diagnostics.length, errors: s.errors.length, retention: s.retention.length,
    cards: Object.keys(s.cards).length, imports: learn.imports.length, examCurrent: exam.current ? 1 : 0, examHistory: exam.history.length };
}

export function buildDataExport(input: DataExportInput): DataExport {
  if (!(input.exportedAt instanceof Date) || Number.isNaN(input.exportedAt.getTime())) throw new TypeError("exportedAt must be a valid Date");
  if (!Number.isInteger(input.learn.revision) || input.learn.revision < 0) throw new TypeError("revision must be a non-negative integer");
  return {
    format: DATA_EXPORT_FORMAT, version: DATA_EXPORT_VERSION, exportedAt: input.exportedAt.toISOString(),
    contentVersion: input.contentVersion ?? "unversioned", notice_uk: NOTICE_UK,
    counts: countsOf(input.learn, input.exam),
    learn: { revision: input.learn.revision, state: input.learn.state, importReceipts: [...input.learn.imports] },
    exam: { current: input.exam.current, history: [...input.exam.history] },
  };
}

export const serialiseDataExport = (d: DataExport) => JSON.stringify(d, null, 2) + "\n";

export type DataExportCheck =
  | { ok: true; counts: DataExportCounts }
  | { ok: false; reason: "NOT_JSON" | "WRONG_FORMAT" | "UNSUPPORTED_VERSION" | "MALFORMED" | "COUNT_MISMATCH" };

/** Re-parse exported text and recompute every count; any difference blocks the download. */
export function verifyDataExport(text: string): DataExportCheck {
  let d: DataExport;
  try { d = JSON.parse(text) as DataExport; } catch { return { ok: false, reason: "NOT_JSON" }; }
  if (!d || typeof d !== "object" || d.format !== DATA_EXPORT_FORMAT) return { ok: false, reason: "WRONG_FORMAT" };
  if (d.version !== DATA_EXPORT_VERSION) return { ok: false, reason: "UNSUPPORTED_VERSION" };
  const s = d.learn?.state;
  if (!s || s.version !== 1 || !Array.isArray(s.attempts) || !Array.isArray(s.diagnostics) || !Array.isArray(s.errors) ||
      !Array.isArray(s.retention) || !s.cards || typeof s.cards !== "object" || !Array.isArray(d.learn.importReceipts) ||
      !d.exam || !Array.isArray(d.exam.history) || !d.counts) return { ok: false, reason: "MALFORMED" };
  const counts = countsOf({ state: s, imports: d.learn.importReceipts }, d.exam);
  const keys = Object.keys(counts) as (keyof DataExportCounts)[];
  if (keys.some(k => d.counts[k] !== counts[k]) || Object.keys(d.counts).length !== keys.length) return { ok: false, reason: "COUNT_MISMATCH" };
  return { ok: true, counts };
}

/** Deletion needs an exact typed phrase — a deliberate act, not a stray click (LEARN-16 control). */
export const DELETE_PHRASE_UK = "ВИДАЛИТИ";
export const isDeleteConfirmed = (typed: string) => typed.trim().toLocaleUpperCase("uk") === DELETE_PHRASE_UK;
