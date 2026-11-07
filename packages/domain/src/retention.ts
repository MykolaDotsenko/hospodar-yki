/**
 * Delayed independent transfer 7/14/30 (TS port of app/retention-core.mjs, parity-tested).
 * IV-REQ-03 / LE-10 / R01: a NEW prompt on the same skill at real elapsed days; missed windows
 * are reported as missed, never passed retroactively; answers stay ungraded.
 */
import type { LearnerState, RetentionEntry } from "./learner.ts";

export const TRANSFER_DAYS = Object.freeze([7, 14, 30] as const);
export type TransferDay = typeof TRANSFER_DAYS[number];
export interface TransferBank { schema_version: string; items: Array<{ task_id: string; grammar_tag: string; checkpoints: Array<{ day: number; prompt_fi: string }> }> }
export interface TransferDue { taskId: string; day: TransferDay; prompt_fi: string; grammarTag: string }
export interface TransferStatus {
  taskId: string; grammarTag: string; ageDays: number; firstMissionDate: string;
  due: TransferDue | null; completed: TransferDay[]; missed: TransferDay[]; nextDay: TransferDay | null;
}

const idValid = (v: unknown) => typeof v === "string" && /^[a-z\d_-]{1,100}$/i.test(v);
const calendarDay = (date: Date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) throw new Error("Invalid date");
  const p = (v: number) => String(v).padStart(2, "0");
  return date.getFullYear() + "-" + p(date.getMonth() + 1) + "-" + p(date.getDate());
};
const ordinalDay = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number) as [number, number, number];
  const t = Date.UTC(y, m - 1, d), c = new Date(t);
  if (c.getUTCFullYear() !== y || c.getUTCMonth() !== m - 1 || c.getUTCDate() !== d) return null;
  return Math.floor(t / 86400000);
};
const completedDate = (e: { completedAt?: unknown }) => {
  if (typeof e?.completedAt !== "string") return null;
  const date = new Date(e.completedAt);
  return Number.isNaN(date.getTime()) ? null : calendarDay(date);
};

export function delayedTransferQueue(state: Pick<LearnerState, "attempts" | "retention">, bank: TransferBank, now: Date = new Date()): TransferStatus[] {
  const today = ordinalDay(calendarDay(now))!;
  if (!bank || !Array.isArray(bank.items)) throw new Error("Invalid transfer bank");
  return bank.items.flatMap(item => {
    if (!idValid(item.task_id) || !Array.isArray(item.checkpoints) || item.checkpoints.length !== TRANSFER_DAYS.length ||
      !item.checkpoints.every((c, i) => c.day === TRANSFER_DAYS[i] && typeof c.prompt_fi === "string" && c.prompt_fi.trim()))
      throw new Error("Invalid transfer item");
    const attempts = (state.attempts || []).filter(a => a.taskId === item.task_id && a.skill === "grammar")
      .map(a => completedDate(a)).filter((x): x is string => Boolean(x)).sort();
    if (!attempts.length) return [];
    const start = ordinalDay(attempts[0]!);
    if (start === null || today < start) return [];
    const age = today - start;
    const reached = item.checkpoints.filter(c => c.day <= age);
    const last = reached[reached.length - 1];
    const records = (state.retention || []).filter(x => x.taskId === item.task_id && x.status === "ungraded" &&
      x.independent === true && (TRANSFER_DAYS as readonly number[]).includes(x.day));
    const completed = records.map(x => x.day as number);
    return [{
      taskId: item.task_id, grammarTag: item.grammar_tag, ageDays: age, firstMissionDate: attempts[0]!,
      due: last && !completed.includes(last.day) && !completed.some(day => day > last.day)
        ? { taskId: item.task_id, day: last.day as TransferDay, prompt_fi: last.prompt_fi, grammarTag: item.grammar_tag } : null,
      completed: TRANSFER_DAYS.filter(day => completed.includes(day)),
      missed: TRANSFER_DAYS.filter(day => day <= (last?.day || 0) && day !== last?.day && !completed.includes(day)),
      nextDay: TRANSFER_DAYS.find(day => day > age) ?? null,
    }];
  });
}

export function recordDelayedTransfer(state: LearnerState, bank: TransferBank,
  { taskId, day, response }: { taskId: string; day: number; response: string }, now: Date = new Date()): LearnerState {
  if (!idValid(taskId) || !(TRANSFER_DAYS as readonly number[]).includes(day) || typeof response !== "string" ||
    !response.trim() || response.trim().length > 1600) throw new Error("Invalid independent response");
  const checkpoint = delayedTransferQueue(state, bank, now).find(x => x.taskId === taskId);
  const eligible = checkpoint?.due;
  if (!eligible || eligible.day !== day) throw new Error("Transfer not due or already submitted");
  const next: LearnerState = JSON.parse(JSON.stringify(state)); // plain data; no DOM API in the domain
  const entry = { taskId, day, response: response.trim(), status: "ungraded", independent: true,
    promptVersion: bank.schema_version, actualAgeDays: checkpoint!.ageDays, lateByDays: checkpoint!.ageDays - day,
    submittedAt: now.toISOString() } as RetentionEntry & { promptVersion: string };
  next.retention = [...(next.retention || []), entry].slice(-120);
  return next;
}

/** After a *persisted* 7/14/30 attempt, compare two of the learner's OWN
 * independently written sentences. This is reflective feedback, never a
 * teacher key, correctness signal, CEFR level or official YKI evaluation.
 *
 * No response exists before a delayed check is committed; UI callers must
 * obtain the state from a fresh storage readback, not the draft in memory.
 */
export interface DelayedTransferReflection {
  taskId: string;
  day: TransferDay;
  earlierResponse: string;
  delayedResponse: string;
  earlierAt: string;
  submittedAt: string;
}
export function completedTransferReflection(
  state: Pick<LearnerState, "attempts" | "retention">,
  taskId: string, day: number,
): DelayedTransferReflection | null {
  if (!idValid(taskId) || !(TRANSFER_DAYS as readonly number[]).includes(day)) return null;
  const saved = (state.retention || []).filter(x => x.taskId === taskId && x.day === day &&
    x.status === "ungraded" && x.independent === true &&
    typeof x.response === "string" && x.response.trim().length > 0 &&
    typeof x.submittedAt === "string" && Number.isFinite(Date.parse(x.submittedAt)))
    .sort((a, b) => Date.parse(a.submittedAt) - Date.parse(b.submittedAt)).at(-1);
  if (!saved) return null;
  const earlier = (state.attempts || []).filter(a => a.taskId === taskId && a.skill === "grammar" &&
    typeof a.transferText === "string" && a.transferText.trim().length > 0 &&
    typeof a.completedAt === "string" && Number.isFinite(Date.parse(a.completedAt)) &&
    Date.parse(a.completedAt) <= Date.parse(saved.submittedAt))
    .sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt))[0];
  if (!earlier) return null;
  return {
    taskId, day: day as TransferDay, earlierResponse: earlier.transferText,
    delayedResponse: saved.response, earlierAt: earlier.completedAt, submittedAt: saved.submittedAt,
  };
}
