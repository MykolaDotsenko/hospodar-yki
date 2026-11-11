/**
 * EXAM profile as data (docs/21 §10: TZ-EXAM-02 profile, TZ-EXAM-03 three profiles, TZ-EXAM-04 fidelity panel).
 *
 * Every critical exam parameter is a record with its source. An unknown value stays `null` and is shown as practice —
 * never guessed. Three profiles:
 *   PRACTICE            learner-chosen practice settings; makes no claim about the real exam
 *   OPH_DEMO_OBSERVED   values a person observed in the four OPH digital demos (TZ-EXAM-01); selectable only when at
 *                       least one observation exists, and marked stale when the last check is older than 30 days
 *   LIVE_2027_VERIFIED  disabled until EVERY critical parameter has a first-party OPH/JYU source, a reviewer and an E2E test
 * The fidelity panel reports F1–F6 separately with the verified count and the gaps — never one percentage.
 */

export type FidelityDimension = "F1" | "F2" | "F3" | "F4" | "F5" | "F6";
export type ExamProfileKind = "PRACTICE" | "OPH_DEMO_OBSERVED" | "LIVE_2027_VERIFIED";
export type AppliesTo = "legacy_paper" | "oph_digital_demo" | "live_2027";
export type ParameterValue = string | number | boolean | null;

/** The critical parameters of docs/21 §9 and the §10.3 observation form. F4 = timing, F5 = interaction/UI. */
export const CRITICAL_PARAMETERS: ReadonlyArray<{ id: string; dimension: "F4" | "F5"; label_uk: string }> = Object.freeze([
  { id: "structure.subtest_order", dimension: "F5", label_uk: "Порядок субтестів" },
  { id: "timing.reading_minutes", dimension: "F4", label_uk: "Час на читання" },
  { id: "timing.listening_minutes", dimension: "F4", label_uk: "Час на аудіювання" },
  { id: "timing.writing_minutes", dimension: "F4", label_uk: "Час на письмо" },
  { id: "timing.speaking_minutes", dimension: "F4", label_uk: "Час на говоріння" },
  { id: "timing.on_expiry", dimension: "F4", label_uk: "Що відбувається, коли час сплив" },
  { id: "navigation.back_allowed", dimension: "F5", label_uk: "Повернення до попереднього питання" },
  { id: "navigation.review_screen", dimension: "F5", label_uk: "Огляд відповідей перед завершенням" },
  { id: "listening.plays_allowed", dimension: "F5", label_uk: "Скільки разів можна слухати запис" },
  { id: "listening.pause_seek", dimension: "F5", label_uk: "Пауза й перемотування аудіо" },
  { id: "speaking.prep_seconds", dimension: "F4", label_uk: "Час підготовки до усної відповіді" },
  { id: "speaking.response_seconds", dimension: "F4", label_uk: "Час на усну відповідь" },
  { id: "speaking.recording_start", dimension: "F5", label_uk: "Як починається запис" },
  { id: "speaking.rerecord_allowed", dimension: "F5", label_uk: "Чи можна перезаписати відповідь" },
  { id: "writing.spellcheck", dimension: "F5", label_uk: "Перевірка орфографії в редакторі" },
  { id: "writing.paste_allowed", dimension: "F5", label_uk: "Вставка тексту" },
  { id: "writing.counter", dimension: "F5", label_uk: "Лічильник слів або символів" },
  { id: "instructions.language", dimension: "F5", label_uk: "Мова інструкцій під час іспиту" },
]);

export interface ExamParameterRecord {
  parameter: string; value: ParameterValue; source_url: string | null; observed_on: string | null;
  applies_to: AppliesTo | null; confidence: "high" | "medium" | "low" | null; reviewed_by: string | null;
  /** Exact title of the browser test that proves the simulator behaves like this (required for LIVE_2027_VERIFIED). */
  e2e_test: string | null;
}
export interface DeclaredDimension { dimension: "F1" | "F2" | "F3" | "F6"; status: DimensionStatus; basis_uk: string }
export type DimensionStatus = "verified" | "partial" | "unverified";
export interface ExamProfile {
  id: string; kind: ExamProfileKind; version: string; title_uk: string; title_fi: string;
  /** Last date a person rechecked the sources (TZ-EXAM-05); null = never. */
  last_checked: string | null;
  records: ExamParameterRecord[];
}
export interface ExamProfileFile {
  schema_version: string; stale_after_days: number;
  /** F1, F2, F3, F6 are declared with their basis; F4 and F5 are computed from the records and cannot be declared. */
  dimensions: DeclaredDimension[];
  profiles: ExamProfile[];
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const HTTPS = /^https:\/\/[^\s]+$/;
const KINDS: ExamProfileKind[] = ["PRACTICE", "OPH_DEMO_OBSERVED", "LIVE_2027_VERIFIED"];
const APPLIES: Record<Exclude<ExamProfileKind, "PRACTICE">, AppliesTo> = { OPH_DEMO_OBSERVED: "oph_digital_demo", LIVE_2027_VERIFIED: "live_2027" };
const sourced = (r: ExamParameterRecord) => r.value !== null && typeof r.source_url === "string" && HTTPS.test(r.source_url) &&
  typeof r.observed_on === "string" && ISO_DAY.test(r.observed_on) && r.confidence !== null &&
  typeof r.reviewed_by === "string" && r.reviewed_by.trim().length > 0;

/** A record counts as verified for its profile only if it has a value, a source, a date, a reviewer and the profile's scope. */
export function isVerifiedRecord(profile: ExamProfile, r: ExamParameterRecord): boolean {
  if (profile.kind === "PRACTICE" || !sourced(r) || r.applies_to !== APPLIES[profile.kind]) return false;
  return profile.kind === "OPH_DEMO_OBSERVED" || (typeof r.e2e_test === "string" && r.e2e_test.trim().length > 0);
}

/** Structural and honesty errors. An empty list means the profile may be loaded (not that it may be selected). */
export function validateExamProfile(p: ExamProfile): string[] {
  const errors: string[] = [];
  if (!p || !/^[a-z0-9-]{3,60}$/.test(String(p.id)) || !KINDS.includes(p.kind) || typeof p.version !== "string" || !p.version)
    return ["INVALID_PROFILE_HEADER"];
  if (!(p.last_checked === null || ISO_DAY.test(String(p.last_checked)))) errors.push("INVALID_LAST_CHECKED");
  const ids = CRITICAL_PARAMETERS.map(c => c.id);
  const seen = new Set<string>();
  for (const r of p.records ?? []) {
    if (!ids.includes(r.parameter)) errors.push(`UNKNOWN_PARAMETER:${r.parameter}`);
    if (seen.has(r.parameter)) errors.push(`DUPLICATE_PARAMETER:${r.parameter}`);
    seen.add(r.parameter);
    if (r.value === null) {
      if (r.applies_to !== null || r.confidence !== null) errors.push(`NULL_VALUE_WITH_CLAIM:${r.parameter}`);
      continue;
    }
    if (p.kind === "PRACTICE") errors.push(`PRACTICE_CANNOT_CLAIM:${r.parameter}`);      // practice values belong to the learner
    else if (!isVerifiedRecord(p, r)) errors.push(`VALUE_WITHOUT_SOURCE:${r.parameter}`); // never a value without its source
  }
  for (const id of ids) if (!seen.has(id)) errors.push(`MISSING_PARAMETER:${id}`);       // unknown must be written as null
  return errors;
}

/** Deterministic change detector for the history record (not a security hash). */
export function examProfileHash(p: ExamProfile): string {
  const text = JSON.stringify([p.id, p.kind, p.version, p.last_checked,
    [...p.records].sort((a, b) => a.parameter.localeCompare(b.parameter)).map(r => [r.parameter, r.value, r.source_url, r.observed_on, r.applies_to, r.e2e_test])]);
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0");
}

const dayNumber = (iso: string) => Math.floor(Date.parse(iso + "T00:00:00Z") / 86400000);
const today = (now: Date) => `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;

export interface ProfileAvailability { selectable: boolean; stale: boolean; verified: number; total: number; reason_uk: string | null }
export function profileAvailability(p: ExamProfile, file: Pick<ExamProfileFile, "stale_after_days">, now: Date = new Date()): ProfileAvailability {
  const total = CRITICAL_PARAMETERS.length;
  if (validateExamProfile(p).length) return { selectable: false, stale: false, verified: 0, total, reason_uk: "Профіль пошкоджений і не може бути використаний." };
  const verified = p.records.filter(r => isVerifiedRecord(p, r)).length;
  const stale = p.kind !== "PRACTICE" && (p.last_checked === null || dayNumber(today(now)) - dayNumber(p.last_checked) > file.stale_after_days);
  if (p.kind === "PRACTICE") return { selectable: true, stale: false, verified: 0, total, reason_uk: null };
  if (p.kind === "OPH_DEMO_OBSERVED")
    return verified > 0 ? { selectable: true, stale, verified, total, reason_uk: stale ? `Спостереження старші за ${file.stale_after_days} днів — потрібна повторна перевірка.` : null }
      : { selectable: false, stale, verified, total, reason_uk: "Ще немає жодного спостереження демо OPH (потрібен ручний перегляд, TZ-EXAM-01)." };
  return verified === total && !stale ? { selectable: true, stale, verified, total, reason_uk: null }
    : { selectable: false, stale, verified, total, reason_uk: `Підтверджено ${verified} з ${total} критичних параметрів першоджерелом OPH/JYU і тестом. Режим вимкнено, доки не підтверджено всі.` };
}

export interface FidelityRow { dimension: FidelityDimension; status: DimensionStatus; basis_uk: string }
export interface FidelityPanel { profileId: string; kind: ExamProfileKind; rows: FidelityRow[]; verified: number; total: number; gaps: string[] }
const NAMES: Record<FidelityDimension, string> = { F1: "Що перевіряється (конструкт)", F2: "Типи завдань", F3: "Реалістичність текстів і аудіо",
  F4: "Час", F5: "Інтерфейс і навігація", F6: "Оцінювання" };
export const FIDELITY_NAMES_UK = Object.freeze(NAMES);

/** Six separate statuses; F4/F5 computed from verified records of THIS profile; gaps list every unverified critical parameter. */
export function fidelityPanel(p: ExamProfile, file: Pick<ExamProfileFile, "dimensions">): FidelityPanel {
  const declared = new Map(file.dimensions.map(d => [d.dimension, d]));
  const computed = (dim: "F4" | "F5"): FidelityRow => {
    const params = CRITICAL_PARAMETERS.filter(c => c.dimension === dim);
    const ok = params.filter(c => { const r = p.records.find(x => x.parameter === c.id); return r ? isVerifiedRecord(p, r) : false; }).length;
    return { dimension: dim, status: ok === params.length ? "verified" : ok > 0 ? "partial" : "unverified",
      basis_uk: p.kind === "PRACTICE" ? "Тренувальні налаштування, які обираєш ти; про справжній іспит нічого не стверджують."
        : `Підтверджено ${ok} з ${params.length} параметрів цього виміру.` };
  };
  const row = (dim: "F1" | "F2" | "F3" | "F6"): FidelityRow => {
    const d = declared.get(dim);
    return d ? { dimension: dim, status: d.status, basis_uk: d.basis_uk } : { dimension: dim, status: "unverified", basis_uk: "Немає підстав." };
  };
  const rows = [row("F1"), row("F2"), row("F3"), computed("F4"), computed("F5"), row("F6")];
  const gaps = CRITICAL_PARAMETERS.filter(c => { const r = p.records.find(x => x.parameter === c.id); return !r || !isVerifiedRecord(p, r); }).map(c => c.label_uk);
  return { profileId: p.id, kind: p.kind, rows, verified: CRITICAL_PARAMETERS.length - gaps.length, total: CRITICAL_PARAMETERS.length, gaps };
}

/** File-level checks: F4/F5 are never declared, F3/F6 never "verified" without human review (none exists today). */
export function validateExamProfileFile(f: ExamProfileFile): string[] {
  const errors: string[] = [];
  if (!f || !Array.isArray(f.profiles) || !Array.isArray(f.dimensions) || !Number.isInteger(f.stale_after_days) || f.stale_after_days < 1) return ["INVALID_FILE"];
  for (const d of f.dimensions) {
    if (!["F1", "F2", "F3", "F6"].includes(d.dimension)) errors.push(`DIMENSION_NOT_DECLARABLE:${d.dimension}`);
    if (!["verified", "partial", "unverified"].includes(d.status) || !d.basis_uk?.trim()) errors.push(`INVALID_DIMENSION:${d.dimension}`);
    // Prompt realism and scoring are only verifiable by people (S2 review, calibrated raters); there is no such evidence field yet.
    if ((d.dimension === "F3" || d.dimension === "F6") && d.status === "verified") errors.push(`NEEDS_HUMAN_EVIDENCE:${d.dimension}`);
  }
  for (const k of KINDS) if (f.profiles.filter(p => p.kind === k).length !== 1) errors.push(`PROFILE_KIND_COUNT:${k}`);
  for (const p of f.profiles) errors.push(...validateExamProfile(p).map(e => `${p.id}:${e}`));
  return errors;
}
