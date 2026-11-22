/**
 * Research mode (R01 pilot readiness; docs/29 stage 6 «Режим дослідження»). Pure, framework-free.
 *
 *   enrolment   opt-in only: a study code given by the researcher (never a name or an e-mail) and three explicit consent
 *               ticks. Before enrolment nothing is counted and nothing can be exported.
 *   study time  seconds of ACTIVE use per local day and screen area — counted only while the screen is visible and the
 *               learner was active within ACTIVE_WINDOW_MS, or audio/video is playing; a gap longer than MAX_STEP_MS
 *               (sleep, a throttled background tab) is never counted. An approximation of time on task, not attention.
 *   export      a de-identified JSON the learner downloads themselves: content ids, skills, scored/ungraded status, the
 *               FIRST answer's correctness, days relative to enrolment and seconds per area. Never: any learner text
 *               (answers, notes, cues, plans, reflections), voice, calendar dates, names. Evidence from before
 *               enrolment is kept and flagged (prior exposure). Nothing is sent anywhere by this module or the app.
 *
 * This prepares a study; it is not a study. The R01 protocol is a draft that has not been approved, and no learning
 * effect may be claimed from anything recorded here.
 */
import { localDate, type LearnerState, type LocalDate, type Skill } from "./learner.ts";

export const RESEARCH_PROTOCOL = "R01-pilot-draft";
export const STUDY_AREAS = Object.freeze(["grammar", "practice", "reading", "listening", "writing", "dialogue", "pictures",
  "masterclass", "external", "media", "diagnostic", "checks", "exam"] as const);
export type StudyArea = typeof STUDY_AREAS[number];
export const isStudyArea = (v: unknown): v is StudyArea => typeof v === "string" && (STUDY_AREAS as readonly string[]).includes(v);

/** Upper-case letters and digits, 3–12, optionally one dash and a short suffix: «HY24», «R01-A17». */
const STUDY_CODE = /^[A-Z0-9]{3,12}(?:-[A-Z0-9]{1,8})?$/;
export const CONSENT_ITEMS = Object.freeze([
  { id: "what", text_uk: "Я прочитав(ла), що входить у файл для дослідника: номери завдань, навичка, чи правильна моя перша відповідь, дні від початку участі й хвилини навчання. Моїх текстів, голосу, імені та дат календаря у файлі немає." },
  { id: "local", text_uk: "Облік ведеться лише на цьому пристрої. Нічого не надсилається: файл для дослідника я завантажую й передаю сам(а), коли захочу." },
  { id: "withdraw", text_uk: "Я можу будь-коли вийти з дослідження — тоді облік часу й позначка участі видаляються з пристрою, а мій прогрес навчання лишається." },
] as const);
export type ConsentId = typeof CONSENT_ITEMS[number]["id"];

export class ResearchError extends Error {
  constructor(public readonly code: "BAD_CODE" | "NO_CONSENT" | "NOT_ENROLLED", m: string) { super(m); this.name = "ResearchError"; }
}

export interface ResearchEnrollment { version: 1; studyCode: string; protocol: string; enrolledAt: string; enrolledDay: LocalDate }
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The code as stored, or null when it is not a valid study code (spaces, «@», letters outside A–Z … are refused). */
export function normaliseStudyCode(input: unknown): string | null {
  const v = String(input ?? "").trim().toUpperCase();
  return STUDY_CODE.test(v) ? v : null;
}

export function enroll(code: unknown, ticked: readonly string[], now: Date = new Date()): ResearchEnrollment {
  const studyCode = normaliseStudyCode(code);
  if (!studyCode) throw new ResearchError("BAD_CODE", "Use the study code from the researcher");
  if (!CONSENT_ITEMS.every(c => ticked.includes(c.id))) throw new ResearchError("NO_CONSENT", "Every consent item must be ticked");
  return { version: 1, studyCode, protocol: RESEARCH_PROTOCOL, enrolledAt: now.toISOString(), enrolledDay: localDate(now) };
}

/** Tolerant reader: anything unexpected means «not enrolled», never a guessed enrolment. */
export function parseEnrollment(raw: unknown): ResearchEnrollment | null {
  const r = raw as Partial<ResearchEnrollment> | null;
  if (!r || typeof r !== "object" || r.version !== 1 || typeof r.studyCode !== "string" || normaliseStudyCode(r.studyCode) !== r.studyCode ||
      typeof r.protocol !== "string" || !r.protocol || typeof r.enrolledAt !== "string" || !Number.isFinite(Date.parse(r.enrolledAt)) ||
      typeof r.enrolledDay !== "string" || !DAY.test(r.enrolledDay)) return null;
  return { version: 1, studyCode: r.studyCode, protocol: r.protocol, enrolledAt: r.enrolledAt, enrolledDay: r.enrolledDay };
}

/* ---------- study time ---------- */

export interface StudyTimeLog { version: 1; days: Record<LocalDate, Partial<Record<StudyArea, number>>> }
export const emptyStudyTime = (): StudyTimeLog => ({ version: 1, days: {} });
/** A day has 86 400 seconds; anything above this per area is refused as corrupt, never trimmed into data. */
export const MAX_SECONDS_PER_DAY_AREA = 16 * 3600;
export const ACTIVE_WINDOW_MS = 120_000;
export const MAX_STEP_MS = 15_000;

/**
 * Milliseconds to count for one meter tick. Zero unless the screen is visible and (the learner acted within
 * ACTIVE_WINDOW_MS or media is playing); zero for a gap longer than MAX_STEP_MS (the tick did not run: sleep, background).
 */
export function activeMs(t: { previousTickMs: number; nowMs: number; visible: boolean; lastInputMs: number; mediaPlaying: boolean }): number {
  const gap = t.nowMs - t.previousTickMs;
  if (!t.visible || !Number.isFinite(gap) || gap <= 0 || gap > MAX_STEP_MS) return 0;
  return t.mediaPlaying || t.nowMs - t.lastInputMs <= ACTIVE_WINDOW_MS ? gap : 0;
}

export function addStudyTime(log: StudyTimeLog, day: LocalDate, area: StudyArea, seconds: number): StudyTimeLog {
  if (!DAY.test(day) || !isStudyArea(area)) throw new TypeError("Invalid day or area");
  const s = Math.floor(seconds);
  if (!Number.isFinite(s) || s <= 0) return log;
  const today = { ...(log.days[day] ?? {}) };
  today[area] = Math.min(MAX_SECONDS_PER_DAY_AREA, (today[area] ?? 0) + s);
  return { version: 1, days: { ...log.days, [day]: today } };
}

export function parseStudyTime(raw: unknown): StudyTimeLog {
  const r = raw as { version?: unknown; days?: unknown } | null;
  if (!r || typeof r !== "object" || r.version !== 1 || !r.days || typeof r.days !== "object" || Array.isArray(r.days)) return emptyStudyTime();
  const days: StudyTimeLog["days"] = {};
  for (const [day, areas] of Object.entries(r.days as Record<string, unknown>)) {
    if (!DAY.test(day) || !areas || typeof areas !== "object" || Array.isArray(areas)) continue;
    const kept: Partial<Record<StudyArea, number>> = {};
    for (const [a, s] of Object.entries(areas as Record<string, unknown>))
      if (isStudyArea(a) && Number.isInteger(s) && (s as number) > 0 && (s as number) <= MAX_SECONDS_PER_DAY_AREA) kept[a] = s as number;
    if (Object.keys(kept).length) days[day] = kept;
  }
  return { version: 1, days };
}

/** Seconds per area since a local day (inclusive) — for showing the learner what was counted. */
export function studyTimeTotals(log: StudyTimeLog, since?: LocalDate): Partial<Record<StudyArea, number>> {
  const out: Partial<Record<StudyArea, number>> = {};
  for (const [day, areas] of Object.entries(log.days)) {
    if (since && day < since) continue;
    for (const [a, s] of Object.entries(areas) as [StudyArea, number][]) out[a] = (out[a] ?? 0) + s;
  }
  return out;
}

/* ---------- de-identified export ---------- */

export interface ResearchExport {
  format: "hospodar-research-export"; schema_version: 1; protocol: string; protocol_status: "draft, not approved";
  study_code: string; export_day_index: number;
  time_rule: string; never_includes: string[];
  first_attempts: Array<{ task_id: string; skill: Skill; scored: boolean; first_correct: boolean | null; day_index: number; before_enrollment: boolean }>;
  grammar_missions: Array<{ task_id: string; grammar_tag: string; first_correct: boolean; guided_repair_correct: boolean | null; day_index: number; before_enrollment: boolean }>;
  delayed_checks: Array<{ task_id: string; check_day: 7 | 14 | 30; actual_age_days: number | null; late_by_days: number | null; day_index: number;
    scored_answers: number | null; correct_answers: number | null }>;
  study_time: Array<{ day_index: number; area: StudyArea; seconds: number }>;
}
export const NEVER_EXPORTED = Object.freeze(["тексти учня (відповіді, нотатки, зачіпки, плани, роздуми)", "голос", "дати календаря", "ім'я, e-mail чи інші дані особи", "відповіді пробних іспитів"]);

const ordinal = (day: LocalDate) => { const [y, m, d] = day.split("-").map(Number) as [number, number, number]; return Math.floor(Date.UTC(y, m - 1, d) / 86400000); };
const DELAYED = /^d(7|14|30)-/;

export function buildResearchExport(state: Pick<LearnerState, "attempts" | "diagnostics" | "retention">, enrollment: ResearchEnrollment,
  time: StudyTimeLog, now: Date = new Date()): ResearchExport {
  if (!parseEnrollment(enrollment)) throw new ResearchError("NOT_ENROLLED", "Not enrolled");
  const start = ordinal(enrollment.enrolledDay);
  const dayIndex = (iso: string) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? null : ordinal(localDate(d)) - start; };
  const byTime = <T,>(xs: readonly T[], at: (x: T) => string) => [...xs].sort((a, b) => Date.parse(at(a)) - Date.parse(at(b)));

  const seen = new Set<string>();
  const first_attempts: ResearchExport["first_attempts"] = [];
  for (const d of byTime(state.diagnostics ?? [], x => x.completedAt)) {
    if (DELAYED.test(d.taskId) || seen.has(d.taskId)) continue;
    const day = dayIndex(d.completedAt);
    if (day === null) continue;
    seen.add(d.taskId);
    const scored = d.status === "scored";
    first_attempts.push({ task_id: d.taskId, skill: d.skill, scored, first_correct: scored ? d.correct === true : null, day_index: day, before_enrollment: day < 0 });
  }

  const seenMission = new Set<string>();
  const grammar_missions: ResearchExport["grammar_missions"] = [];
  for (const a of byTime(state.attempts ?? [], x => x.completedAt)) {
    if (seenMission.has(a.taskId)) continue;
    const day = dayIndex(a.completedAt);
    if (day === null) continue;
    seenMission.add(a.taskId);
    grammar_missions.push({ task_id: a.taskId, grammar_tag: String(a.grammarTag ?? "").slice(0, 50), first_correct: a.firstCorrect === true,
      guided_repair_correct: typeof a.repairCorrect === "boolean" ? a.repairCorrect : null, day_index: day, before_enrollment: day < 0 });
  }

  const delayed_checks: ResearchExport["delayed_checks"] = [];
  for (const r of byTime(state.retention ?? [], x => x.submittedAt)) {
    const day = dayIndex(r.submittedAt);
    if (day === null || r.independent !== true) continue;
    const skill = /^skill-(reading|listening)$/.exec(r.taskId)?.[1];
    const answers = skill ? (state.diagnostics ?? []).filter(d => d.skill === skill && d.taskId.startsWith(`d${r.day}-`)) : [];
    const scored = answers.filter(d => d.status === "scored");
    delayed_checks.push({ task_id: r.taskId, check_day: r.day, actual_age_days: typeof r.actualAgeDays === "number" ? r.actualAgeDays : null,
      late_by_days: typeof r.lateByDays === "number" ? r.lateByDays : null, day_index: day,
      scored_answers: skill ? scored.length : null, correct_answers: skill ? scored.filter(d => d.correct === true).length : null });
  }

  const study_time: ResearchExport["study_time"] = Object.entries(parseStudyTime(time).days).flatMap(([day, areas]) =>
    (Object.entries(areas) as [StudyArea, number][]).map(([area, seconds]) => ({ day_index: ordinal(day) - start, area, seconds })))
    .filter(x => x.day_index >= 0)                                          // nothing is counted before enrolment
    .sort((a, b) => a.day_index - b.day_index || STUDY_AREAS.indexOf(a.area) - STUDY_AREAS.indexOf(b.area));

  return {
    format: "hospodar-research-export", schema_version: 1, protocol: enrollment.protocol, protocol_status: "draft, not approved",
    study_code: enrollment.studyCode, export_day_index: ordinal(localDate(now)) - start,
    time_rule: `seconds while a LEARN or EXAM screen was visible and the learner acted within ${ACTIVE_WINDOW_MS / 1000} s or media played; gaps over ${MAX_STEP_MS / 1000} s not counted; an approximation, not attention`,
    never_includes: [...NEVER_EXPORTED],
    first_attempts, grammar_missions, delayed_checks, study_time,
  };
}
