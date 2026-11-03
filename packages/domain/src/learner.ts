/**
 * Pure LEARN model (TypeScript port of app/core.mjs, behaviour-parity tested).
 * No browser, storage, framework or network APIs (MODULE-BOUNDARIES).
 * SRS 1/3/7/14/30 is the documented interim heuristic, not an optimal schedule (LE-02).
 */
export const STORAGE_KEY = "hospodar-yki:mvp:v1";
export const INTERVAL_DAYS = Object.freeze([1, 3, 7, 14, 30] as const);
export const VERSION = 1;
export const HISTORY_LIMIT = 120;
export const ERROR_LIMIT = 160;
const MAX_TEXT = 1600;
const ID = /^[a-z\d_-]{1,100}$/i;
const DAY = /^\d{4}-\d\d-\d\d$/;

export type Skill = "reading" | "listening" | "writing" | "speaking";
export type LocalDate = string; // YYYY-MM-DD in the learner's local calendar

export interface Card {
  stage: number;
  due: LocalDate;
  reviews: number;
  failures: number;
  lastCorrect: boolean;
  lastReviewed: string;
}
/** The learner's FIRST independent answer is recorded here and never rewritten (LE-01). */
export interface MissionAttempt {
  taskId: string;
  grammarTag: string;
  firstAnswer: string;
  firstCorrect: boolean;
  secondAnswer: string;
  repairCorrect: boolean | null;
  transferText: string;
  transferScoring: "ungraded";
  skill: "grammar";
  completedAt: string;
}
export interface ErrorEntry { taskId: string; grammarTag: string; at: string; resolution: "guided_repair" | "not_yet_demonstrated" }
export interface Diagnostic { skill: Skill; taskId: string; status: "scored" | "ungraded"; correct?: boolean; response: string; completedAt: string }
export interface RetentionEntry {
  taskId: string; day: 7 | 14 | 30; status: "ungraded"; independent: true;
  actualAgeDays?: number; lateByDays?: number; response: string; submittedAt: string;
}
export interface LearnerState {
  version: 1;
  attempts: MissionAttempt[];
  cards: Record<string, Card>;
  diagnostics: Diagnostic[];
  errors: ErrorEntry[];
  retention: RetentionEntry[];
}
export interface ClozeTask { id?: string; answer_fi: string; accepted_alternatives_fi?: string[] }

export function blankState(): LearnerState {
  return { version: VERSION, attempts: [], cards: {}, diagnostics: [], errors: [], retention: [] };
}

type Loose = Record<string, unknown>;
const isObj = (v: unknown): v is Loose => typeof v === "object" && v !== null && !Array.isArray(v);
const isInt = (v: unknown): v is number => Number.isInteger(v);

/** Same tolerant V1 reader as the legacy app (filters + caps are audited by R11 preflight). */
export function readState(raw: string | null | undefined): { state: LearnerState; recovered: boolean } {
  if (!raw) return { state: blankState(), recovered: false };
  try {
    const s: unknown = JSON.parse(raw);
    if (!isObj(s) || s.version !== VERSION || !Array.isArray(s.attempts) ||
        !Array.isArray(s.diagnostics) || !Array.isArray(s.errors) || !isObj(s.cards)) {
      throw new Error("Invalid state schema");
    }
    const cards: Record<string, Card> = {};
    for (const [id, card] of Object.entries(s.cards)) {
      if (!ID.test(id) || !isObj(card)) continue;
      if (!isInt(card.stage) || card.stage < 0 || card.stage > INTERVAL_DAYS.length ||
          !DAY.test(typeof card.due === "string" ? card.due : "")) continue;
      cards[id] = {
        stage: card.stage, due: card.due as string,
        reviews: isInt(card.reviews) ? Math.max(0, card.reviews) : 0,
        failures: isInt(card.failures) ? Math.max(0, card.failures) : 0,
        lastCorrect: card.lastCorrect === true,
        lastReviewed: typeof card.lastReviewed === "string" ? card.lastReviewed : "",
      };
    }
    const retention = (Array.isArray(s.retention) ? s.retention : []).filter((x: unknown): x is RetentionEntry =>
      isObj(x) && ID.test(typeof x.taskId === "string" ? x.taskId : "") &&
      [7, 14, 30].includes(x.day as number) && x.status === "ungraded" && x.independent === true &&
      (x.actualAgeDays === undefined || (isInt(x.actualAgeDays) && x.actualAgeDays >= (x.day as number))) &&
      (x.lateByDays === undefined || (isInt(x.lateByDays) && x.lateByDays >= 0)) &&
      typeof x.response === "string" && x.response.trim().length > 0 && x.response.length <= MAX_TEXT &&
      typeof x.submittedAt === "string" && !Number.isNaN(Date.parse(x.submittedAt)));
    return {
      state: {
        version: VERSION,
        attempts: (s.attempts as unknown[]).filter((x): x is MissionAttempt => isObj(x) && typeof x.taskId === "string").slice(-HISTORY_LIMIT),
        cards,
        retention: retention.slice(-HISTORY_LIMIT),
        diagnostics: (s.diagnostics as unknown[]).filter((x): x is Diagnostic => isObj(x) && typeof x.skill === "string").slice(-HISTORY_LIMIT),
        errors: (s.errors as unknown[]).filter((x): x is ErrorEntry => isObj(x) && typeof x.taskId === "string").slice(-ERROR_LIMIT),
      },
      recovered: false,
    };
  } catch {
    return { state: blankState(), recovered: true };
  }
}

export function normalizeFinnish(text: unknown): string {
  return String(text ?? "").normalize("NFC").trim()
    .replace(/\s+/gu, " ").replace(/[.!?]+$/u, "")
    .toLocaleLowerCase("fi-FI");
}
/** Accepts only the reviewed key and explicitly listed alternatives — no fuzzy matching. */
export function checkCloze(task: ClozeTask, answer: unknown): { valid: boolean; correct: boolean } {
  if (!task || !task.answer_fi) throw new Error("Missing answer key");
  const typed = normalizeFinnish(answer);
  if (!typed) return { valid: false, correct: false };
  const accepted = [task.answer_fi, ...(task.accepted_alternatives_fi ?? [])];
  return { valid: true, correct: accepted.some(x => normalizeFinnish(x) === typed) };
}

export function localDate(now: Date = new Date()): LocalDate {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) throw new Error("Invalid date");
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}
export function plusLocalDays(now: Date, days: number): LocalDate {
  const next = new Date(now);
  next.setHours(12, 0, 0, 0); // no DST drift across a Finnish midnight
  next.setDate(next.getDate() + days);
  return localDate(next);
}
const clipped = (value: unknown) => String(value ?? "").trim().slice(0, MAX_TEXT);

/** A failed FIRST independent answer resets to stage 0 even if guided repair later succeeds. */
export function updateCard(previous: Partial<Card> | null | undefined, firstCorrect: boolean, now: Date = new Date()): Card {
  const prior = previous && typeof previous === "object" ? previous : { stage: 0, reviews: 0, failures: 0 };
  const priorStage = prior.stage ?? 0;
  const stage = firstCorrect ? Math.min(priorStage + 1, INTERVAL_DAYS.length) : 0;
  const interval = firstCorrect ? INTERVAL_DAYS[stage - 1]! : INTERVAL_DAYS[0];
  return {
    stage,
    due: plusLocalDays(now, interval),
    reviews: (prior.reviews || 0) + 1,
    failures: (prior.failures || 0) + (firstCorrect ? 0 : 1),
    lastCorrect: Boolean(firstCorrect),
    lastReviewed: localDate(now),
  };
}
export function dueCards(state: LearnerState, today: LocalDate = localDate()): Array<Card & { id: string }> {
  return Object.entries(state.cards)
    .filter(([, c]) => c && typeof c.due === "string" && c.due <= today)
    .sort((a, b) => a[1].due.localeCompare(b[1].due))
    .map(([id, card]) => ({ id, ...card }));
}

export interface MissionResult {
  taskId: string; grammarTag?: string; firstAnswer: string; firstCorrect: boolean;
  secondAnswer?: string; repairCorrect?: boolean | null; transferText: string;
}
export function completeMission(state: LearnerState, data: MissionResult, now: Date = new Date()): LearnerState {
  const { taskId, grammarTag, firstAnswer, firstCorrect, secondAnswer, repairCorrect, transferText } = data ?? ({} as MissionResult);
  if (!ID.test(taskId || "") || !clipped(firstAnswer) || !clipped(transferText)) {
    throw new Error("Mission needs a task ID, first answer and nonempty transfer");
  }
  if (typeof firstCorrect !== "boolean") throw new Error("First-answer score required");
  const next: LearnerState = JSON.parse(JSON.stringify(state));
  const completion: MissionAttempt = {
    taskId, grammarTag: clipped(grammarTag).slice(0, 50),
    firstAnswer: clipped(firstAnswer), firstCorrect,
    secondAnswer: clipped(secondAnswer), repairCorrect: typeof repairCorrect === "boolean" ? repairCorrect : null,
    transferText: clipped(transferText), transferScoring: "ungraded",
    skill: "grammar", completedAt: now.toISOString(),
  };
  next.attempts = [...next.attempts, completion].slice(-HISTORY_LIMIT);
  next.cards[taskId] = updateCard(next.cards[taskId], firstCorrect, now);
  if (!firstCorrect) {
    next.errors = [...next.errors, {
      taskId, grammarTag: completion.grammarTag, at: completion.completedAt,
      resolution: repairCorrect ? "guided_repair" as const : "not_yet_demonstrated" as const,
    }].slice(-ERROR_LIMIT);
  }
  return next;
}

export function addDiagnostic(state: LearnerState,
  data: { skill: Skill; taskId: string; correct?: boolean; status: "scored" | "ungraded"; response?: string },
  now: Date = new Date()): LearnerState {
  const { skill, taskId, correct, status, response } = data ?? ({} as typeof data);
  if (!["reading", "listening", "writing", "speaking"].includes(skill) ||
      !["scored", "ungraded"].includes(status) || !ID.test(taskId || "")) {
    throw new Error("Invalid diagnostic");
  }
  if ((status === "scored" && (!["reading", "listening"].includes(skill) || typeof correct !== "boolean")) ||
      (status === "ungraded" && correct !== undefined)) {
    throw new Error("Only objective answers can be scored");
  }
  const next: LearnerState = JSON.parse(JSON.stringify(state));
  next.diagnostics = [...next.diagnostics, {
    skill, taskId, status,
    ...(status === "scored" ? { correct: correct as boolean } : {}),
    response: clipped(response),
    completedAt: now.toISOString(),
  }].slice(-HISTORY_LIMIT);
  return next;
}
export function skillSummary(state: LearnerState) {
  const skills: Skill[] = ["reading", "listening", "writing", "speaking"];
  return Object.fromEntries(skills.map(skill => {
    const xs = state.diagnostics.filter(e => e.skill === skill);
    const scored = xs.filter(e => e.status === "scored");
    return [skill, {
      completed: xs.length, scored: scored.length,
      correct: scored.filter(e => e.correct).length,
      ungraded: xs.filter(e => e.status === "ungraded").length,
    }];
  })) as Record<Skill, { completed: number; scored: number; correct: number; ungraded: number }>;
}
