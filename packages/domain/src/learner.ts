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
  /**
   * Optional: the learner's OWN memory cue for a problem phrase (method keyword-mnemonic-retrieval). Their words, any
   * language; shown again only when they ask for it during a review; never a key, never scored, never changes the
   * schedule. Web-only field added 15.11.2026 without a version bump: older states simply have no cue; the legacy
   * app/core.mjs never writes one and its reader drops it (documented in the parity test).
   */
  ownCue?: string;
}
export const OWN_CUE_MAX_CHARS = 200;
/** A stored cue is already normalised: 1–200 characters, one line, no surrounding spaces. */
export const isOwnCue = (v: unknown): v is string =>
  typeof v === "string" && v.length > 0 && v.length <= OWN_CUE_MAX_CHARS && v.trim() === v && !/\p{Cc}/u.test(v);
/** The learner's text as a stored cue: control characters and runs of spaces become one space; empty = no cue. */
export function normaliseOwnCue(text: unknown): string | null {
  const v = String(text ?? "").replace(/[\p{Cc}\s]+/gu, " ").trim().slice(0, OWN_CUE_MAX_CHARS).trim();
  return v ? v : null;
}
/** Set, replace or (empty text) remove the own cue of a card; the schedule is untouched. */
export function withOwnCue(card: Card, text: unknown): Card {
  const { ownCue: _old, ...rest } = card;
  const cue = normaliseOwnCue(text);
  return cue ? { ...rest, ownCue: cue } : rest;
}
/**
 * LE-11 / AC-57: the learner's OPTIONAL own judgement of the answer they just wrote, given before feedback and frozen
 * with it. A metacognitive signal for the learner and the review schedule — never a score, a level or a YKI result.
 */
export type Confidence = "sure" | "unsure" | "guess";
export const CONFIDENCES: readonly Confidence[] = Object.freeze(["sure", "unsure", "guess"]);
export const isConfidence = (v: unknown): v is Confidence => typeof v === "string" && (CONFIDENCES as readonly string[]).includes(v);
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
  /** Optional (27.11.2026, web only): present only when the learner marked it; older records have none. */
  confidence?: Confidence;
}
export interface ErrorEntry { taskId: string; grammarTag: string; at: string; resolution: "guided_repair" | "not_yet_demonstrated" }
export interface Diagnostic { skill: Skill; taskId: string; status: "scored" | "ungraded"; correct?: boolean; response: string; completedAt: string }
/** Compact immutable first outcome, without learner text or timestamps. */
export interface ArchivedFirstDiagnostic { taskId: string; skill: Skill; outcome: "correct" | "incorrect" | "ungraded" }
export interface RetentionEntry {
  taskId: string; day: 7 | 14 | 30; status: "ungraded"; independent: true;
  actualAgeDays?: number; lateByDays?: number; promptVersion?: string; response: string; submittedAt: string;
}
export interface LearnerState {
  version: 1;
  attempts: MissionAttempt[];
  cards: Record<string, Card>;
  diagnostics: Diagnostic[];
  /** IDs of saved diagnostic evidence evicted from the bounded history. No answers or scores are retained here. */
  archivedDiagnosticIds?: string[];
  /** Known first outcomes of evicted tasks only; older ID-only archives remain unknown. */
  archivedFirstDiagnostics?: ArchivedFirstDiagnostic[];
  /** Earliest known ordinary LEARN day per skill among evicted diagnostics (at most four dates). */
  archivedSkillStartDates?: Partial<Record<Skill, LocalDate>>;
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
/** Optional Web V1 extension; older profiles and legacy imports have no archive. */
export function isArchivedDiagnosticIds(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(id => typeof id === "string" && ID.test(id)) && new Set(value).size === value.length;
}
/** A compact outcome must belong to an archived task; one entry per ID, no free text or graded productive skill. */
export function isArchivedFirstDiagnostics(value: unknown, ids: unknown): value is ArchivedFirstDiagnostic[] {
  if (!Array.isArray(value) || !isArchivedDiagnosticIds(ids)) return false;
  const archived = new Set(ids), seen = new Set<string>();
  return value.every(entry => {
    if (!isObj(entry) || Object.keys(entry).length !== 3 || !Object.hasOwn(entry, "taskId") ||
        !Object.hasOwn(entry, "skill") || !Object.hasOwn(entry, "outcome") ||
        typeof entry.taskId !== "string" || !archived.has(entry.taskId) || seen.has(entry.taskId) ||
        !["reading", "listening", "writing", "speaking"].includes(String(entry.skill)) ||
        !(entry.outcome === "ungraded" || (["reading", "listening"].includes(String(entry.skill)) &&
          (entry.outcome === "correct" || entry.outcome === "incorrect")))) return false;
    seen.add(entry.taskId);
    return true;
  });
}
/** Shared by the reader and strict Web restore: no arbitrary keys, scores, or invalid calendar dates. */
export function isArchivedSkillStartDates(value: unknown): value is Partial<Record<Skill, LocalDate>> {
  return isObj(value) && Object.entries(value).every(([skill, day]) => {
    if (!["reading", "listening", "writing", "speaking"].includes(skill) || typeof day !== "string" || !DAY.test(day)) return false;
    const date = new Date(day + "T00:00:00.000Z");
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === day;
  });
}
/** A saved answer remains known after its response leaves the recent-history window. */
export function hasDiagnosticEvidence(state: Pick<LearnerState, "diagnostics" | "archivedDiagnosticIds">, taskId: string): boolean {
  return (state.archivedDiagnosticIds ?? []).includes(taskId) || (state.diagnostics ?? []).some(d => d.taskId === taskId);
}

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
        // A malformed cue is dropped, never the card: the schedule matters more than a note.
        ...(isOwnCue(card.ownCue) ? { ownCue: card.ownCue } : {}),
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
        ...(isArchivedDiagnosticIds(s.archivedDiagnosticIds) ? { archivedDiagnosticIds: s.archivedDiagnosticIds } : {}),
        ...(isArchivedFirstDiagnostics(s.archivedFirstDiagnostics, s.archivedDiagnosticIds) ? { archivedFirstDiagnostics: s.archivedFirstDiagnostics } : {}),
        ...(isArchivedSkillStartDates(s.archivedSkillStartDates) ? { archivedSkillStartDates: s.archivedSkillStartDates } : {}),
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
  const prior: Partial<Card> = previous && typeof previous === "object" ? previous : { stage: 0, reviews: 0, failures: 0 };
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
    ...(isOwnCue(prior.ownCue) ? { ownCue: prior.ownCue } : {}),   // the learner's own cue survives every review
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
  secondAnswer?: string; repairCorrect?: boolean | null; transferText: string; confidence?: Confidence;
}
export function completeMission(state: LearnerState, data: MissionResult, now: Date = new Date()): LearnerState {
  const { taskId, grammarTag, firstAnswer, firstCorrect, secondAnswer, repairCorrect, transferText, confidence } = data ?? ({} as MissionResult);
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
    ...(isConfidence(confidence) ? { confidence } : {}),
  };
  next.attempts = [...next.attempts, completion].slice(-HISTORY_LIMIT);
  // LE-11: a right answer the learner marked as a guess is not a confident recall — it comes back the next day, without
  // being counted as a failure (the answer was right). Every other case keeps the documented 1/3/7/14/30 rule.
  const prior = next.cards[taskId];
  next.cards[taskId] = firstCorrect && confidence === "guess"
    ? { ...updateCard(prior, false, now), failures: prior?.failures ?? 0, lastCorrect: true }
    : updateCard(prior, firstCorrect, now);
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
  const history = [...next.diagnostics, {
    skill, taskId, status,
    ...(status === "scored" ? { correct: correct as boolean } : {}),
    response: clipped(response),
    completedAt: now.toISOString(),
  }];
  // Preserve identities and known first outcomes when detailed evidence leaves the recent-history window.
  // In particular, a correct unscheduled practice card must never become a fresh scored item again.
  const evicted = history.slice(0, Math.max(0, history.length - HISTORY_LIMIT));
  if (evicted.length) {
    const archived = new Set(next.archivedDiagnosticIds ?? []);
    const first = [...(next.archivedFirstDiagnostics ?? [])];
    for (const d of evicted) {
      // An ID already in the archive has an older first attempt (possibly unknown). Never infer it from a replay.
      if (archived.has(d.taskId) || typeof d.taskId !== "string" || !ID.test(d.taskId)) continue;
      archived.add(d.taskId);
      if (!["reading", "listening", "writing", "speaking"].includes(d.skill)) continue;
      if (d.status === "ungraded" && d.correct === undefined) first.push({ taskId: d.taskId, skill: d.skill, outcome: "ungraded" });
      else if (d.status === "scored" && ["reading", "listening"].includes(d.skill) && typeof d.correct === "boolean")
        first.push({ taskId: d.taskId, skill: d.skill, outcome: d.correct ? "correct" : "incorrect" });
    }
    next.archivedDiagnosticIds = [...archived];
    if (first.length) next.archivedFirstDiagnostics = first;
    // Keep the earliest known day, not the evicted responses. Delayed tests must never start a skill clock.
    const starts = { ...next.archivedSkillStartDates };
    for (const d of evicted) {
      if (!["reading", "listening", "writing", "speaking"].includes(d.skill) || /^d(?:7|14|30)-/.test(d.taskId)) continue;
      const date = new Date(d.completedAt);
      if (!Number.isFinite(date.getTime())) continue;
      const day = localDate(date), prior = starts[d.skill];
      if (!prior || day < prior) starts[d.skill] = day;
    }
    if (Object.keys(starts).length) next.archivedSkillStartDates = starts;
  }
  next.diagnostics = history.slice(-HISTORY_LIMIT);
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

/**
 * LE-11 calibration, for the learner only: per own mark, how many first answers were right. Counts, never a %, level or
 * YKI result (AC-57). Attempts without a mark are not counted here.
 */
export function calibrationSummary(state: Pick<LearnerState, "attempts">): Record<Confidence, { answers: number; right: number }> {
  const out = { sure: { answers: 0, right: 0 }, unsure: { answers: 0, right: 0 }, guess: { answers: 0, right: 0 } };
  for (const a of state.attempts ?? []) {
    if (!isConfidence(a.confidence)) continue;
    out[a.confidence].answers += 1;
    if (a.firstCorrect === true) out[a.confidence].right += 1;
  }
  return out;
}

/**
 * What the mark and the first answer say together, for one calm sentence after the feedback (never a judgement of the
 * person). "confident_miss": sure but wrong — the moment to compare carefully (hypercorrection); "lucky": right while
 * unsure or guessing — worth checking again; "sure_right" and "unsure_miss": the feeling matched the answer.
 */
export type ConfidenceNote = "confident_miss" | "lucky" | "sure_right" | "unsure_miss";
export function confidenceNote(confidence: Confidence | undefined, firstCorrect: boolean): ConfidenceNote | null {
  if (!isConfidence(confidence)) return null;
  if (confidence === "sure") return firstCorrect ? "sure_right" : "confident_miss";
  return firstCorrect ? "lucky" : "unsure_miss";
}
