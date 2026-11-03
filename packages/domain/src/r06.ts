/**
 * R06 transparent next-task ranking (TS port of app/adaptation-core.mjs, parity-tested).
 * research/pedagogy/33: deterministic, explainable reasons, manual override in the UI,
 * exposure ≠ competence, never a CEFR/YKI estimate. Weights are provisional, not fitted.
 *
 * Two explicit, default-off extensions (parity holds when unused):
 *  - `skills`: the skill set used for exposure balance (default: the four YKI skills);
 *  - `allowLabelledDrafts`: accept items with reviewStatus "labelled_draft" — content that the
 *    product already shows to learners clearly marked as not S2-reviewed (legacy cloze).
 */
export const R06_SKILLS = ["reading", "listening", "writing", "speaking"] as const;
const MAX_OVERDUE_DAYS = 365;
const MAX_TASK_MINUTES = 180;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export interface R06Task {
  id: string; skill: string; reviewStatus: string; redistributionCleared: boolean;
  examOnly?: boolean; heldOut?: boolean; offlineAvailable: boolean; estimatedMinutes: number;
  level?: string; topic?: string; prerequisiteIds?: string[];
}
export type R06Reason = "REVIEW_DUE" | "CONFIRMED_FIRST_ERROR" | "SKILL_EXPOSURE_BALANCE" | "NEW_APPROVED_TASK" | "USER_CHOSEN_SKILL" | "USER_CHOSEN_TOPIC";
export interface R06Ranked {
  taskId: string; skill: string; score: number; reasons: R06Reason[];
  breakdown: { overdue: number; confirmedError: number; skillExposureBalance: number; newTask: number; chosenSkill: number; chosenTopic: number };
  status: "FORMATIVE_RECOMMENDATION_ONLY";
}
type Ev = Record<string, unknown>;
interface R06State { attempts?: Ev[]; diagnostics?: Ev[]; cards?: Record<string, { due?: string }> }

function dayIndex(date: unknown): number | null {
  if (typeof date !== "string" || !DATE.test(date)) return null;
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const ms = Date.UTC(y, m - 1, d);
  const c = new Date(ms);
  if (c.getUTCFullYear() !== y || c.getUTCMonth() !== m - 1 || c.getUTCDate() !== d) return null;
  return Math.floor(ms / 86400000);
}
const clamped = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const nonEmpty = (v: unknown) => typeof v === "string" && v.trim() !== "";
function firstFailure(e: Ev | undefined): boolean {
  if (!e || typeof e !== "object") return false;
  if (e.skill === "grammar" && nonEmpty(e.firstAnswer) && e.firstCorrect === false) return true;
  return ["reading", "listening"].includes(e.skill as string) && e.evidenceKind === "objective_scored" &&
    e.independent === true && e.firstAttempt === true && e.correct === false;
}
function firstSuccess(e: Ev | undefined): boolean {
  return Boolean(e && ((e.skill === "grammar" && nonEmpty(e.firstAnswer) && e.firstCorrect === true) ||
    (["reading", "listening"].includes(e.skill as string) && e.evidenceKind === "objective_scored" &&
      e.independent === true && e.firstAttempt === true && e.correct === true)));
}

export interface R06Params {
  tasks: R06Task[]; state?: R06State; today: string; availableMinutes: number; level?: string;
  preferredSkills?: string[]; preferredTopics?: string[]; offlineIds?: string[]; mode?: string;
  skills?: readonly string[]; allowLabelledDrafts?: boolean;
}

export function rankR06Tasks(params: R06Params): R06Ranked[] {
  const { tasks, state = {}, today, availableMinutes, level, preferredSkills = [], preferredTopics = [], offlineIds,
    mode = "LEARN", skills = R06_SKILLS, allowLabelledDrafts = false } = params ?? ({} as R06Params);
  if (mode !== "LEARN") return [];
  const todayIndex = dayIndex(today);
  if (todayIndex === null) throw new TypeError("R06 requires a valid explicit local date");
  if (!Number.isInteger(availableMinutes) || availableMinutes < 1 || availableMinutes > MAX_TASK_MINUTES)
    throw new TypeError("Invalid session time");
  if (!Array.isArray(tasks) || !Array.isArray(preferredSkills) || !Array.isArray(preferredTopics) ||
    (offlineIds !== undefined && !Array.isArray(offlineIds))) throw new TypeError("Invalid R06 input");
  const attempts: Ev[] = Array.isArray(state.attempts) ? state.attempts : [];
  const diagnostics: Ev[] = Array.isArray(state.diagnostics) ? state.diagnostics : [];
  const cards = state.cards && !Array.isArray(state.cards) && typeof state.cards === "object" ? state.cards : {};
  const completedIds = new Set(attempts.filter(firstSuccess).map(a => a.taskId as string));
  const counts: Record<string, number> = Object.fromEntries(skills.map(s => [s, 0]));
  for (const e of [...attempts, ...diagnostics]) if (e && skills.includes(e.skill as string)) counts[e.skill as string]! += 1;
  const least = Math.min(...Object.values(counts));
  const approved = (t: R06Task) => t.reviewStatus === "s2_approved" || (allowLabelledDrafts && t.reviewStatus === "labelled_draft");
  const valid = (t: R06Task) => {
    if (!t || typeof t.id !== "string" || !/^[a-z0-9_-]{1,100}$/i.test(t.id)) return false;
    if (!skills.includes(t.skill) || !approved(t) || t.redistributionCleared !== true || t.examOnly === true ||
      t.heldOut === true || t.offlineAvailable !== true) return false;
    if (!Number.isInteger(t.estimatedMinutes) || t.estimatedMinutes < 1 || t.estimatedMinutes > MAX_TASK_MINUTES ||
      t.estimatedMinutes > availableMinutes) return false;
    if (level && t.level !== level) return false;
    if (offlineIds && !offlineIds.includes(t.id)) return false;
    if (Array.isArray(t.prerequisiteIds) && !t.prerequisiteIds.every(id => completedIds.has(id))) return false;
    return true;
  };
  const out: R06Ranked[] = [];
  const seen = new Set<string>();
  for (const task of tasks) {
    if (!valid(task) || seen.has(task.id)) continue;
    seen.add(task.id);
    const related = attempts.filter(a => a && a.taskId === task.id);
    const diag = diagnostics.filter(a => a && a.taskId === task.id);
    const evidence = [...related, ...diag].filter(a => firstFailure(a) || firstSuccess(a));
    evidence.sort((a, b) => {
      const ai = Date.parse(String(a.completedAt || a.at || "")), bi = Date.parse(String(b.completedAt || b.at || ""));
      return (Number.isFinite(ai) ? ai : 0) - (Number.isFinite(bi) ? bi : 0);
    });
    const confirmedFailure = firstFailure(evidence.at(-1));
    const wasSeen = [...related, ...diag].length > 0;
    const dueDay = dayIndex(cards[task.id]?.due);
    const daysLate = dueDay === null ? null : todayIndex - dueDay;
    const overdue = daysLate !== null && daysLate >= 0 ? 20 + Math.min(15, clamped(daysLate, 0, MAX_OVERDUE_DAYS) * 3) : 0;
    const confirmedError = confirmedFailure ? 22 : 0;
    const skillExposureBalance = clamped(15 - ((counts[task.skill] ?? 0) - least) * 5, 0, 15);
    const newTask = wasSeen ? 0 : 6;
    const chosenSkill = preferredSkills.includes(task.skill) ? 6 : 0;
    const chosenTopic = typeof task.topic === "string" && preferredTopics.includes(task.topic) ? 2 : 0;
    const breakdown = { overdue, confirmedError, skillExposureBalance, newTask, chosenSkill, chosenTopic };
    const reasons: R06Reason[] = [];
    if (overdue) reasons.push("REVIEW_DUE");
    if (confirmedError) reasons.push("CONFIRMED_FIRST_ERROR");
    if (skillExposureBalance > 0) reasons.push("SKILL_EXPOSURE_BALANCE");
    if (newTask) reasons.push("NEW_APPROVED_TASK");
    if (chosenSkill) reasons.push("USER_CHOSEN_SKILL");
    if (chosenTopic) reasons.push("USER_CHOSEN_TOPIC");
    out.push({ taskId: task.id, skill: task.skill, score: Object.values(breakdown).reduce((a, b) => a + b, 0), breakdown, reasons, status: "FORMATIVE_RECOMMENDATION_ONLY" });
  }
  return out.sort((a, b) => b.score - a.score || a.taskId.localeCompare(b.taskId, "en"));
}

/** Learner-facing "why this task now" copy — observed local signals only, never a level. */
export function explainR06(r: R06Ranked, cards: Record<string, { due?: string }> = {}, today?: string): string[] {
  const late = (() => {
    const d = dayIndex(cards[r.taskId]?.due), t = dayIndex(today);
    return d === null || t === null ? null : t - d;
  })();
  const text: Partial<Record<R06Reason, string>> = {
    REVIEW_DUE: late && late > 0 ? `Планове повторення прострочене на ${late} дн.` : "Сьогодні час повторити це завдання.",
    CONFIRMED_FIRST_ERROR: "Минулого разу перша самостійна відповідь була неправильною.",
    NEW_APPROVED_TASK: "Ти ще не пробував(-ла) це завдання.",
    USER_CHOSEN_SKILL: "Ти обрав(-ла) цю навичку.",
    USER_CHOSEN_TOPIC: "Ти обрав(-ла) цю тему.",
  };
  return r.reasons.map(x => text[x]).filter((x): x is string => Boolean(x));
}
