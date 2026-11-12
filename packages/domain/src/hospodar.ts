/**
 * «Господар»: the brand persona — a Ukrainian householder who handles his own affairs in Finland
 * (and YKI) well. Owner decision 12.11.2026 (DEC-06 revised). Pure, deterministic.
 *
 * Research bounds (IV-14, COG-07, MOT-04/05/06, MOT-E06/E09, UIO-10):
 *  - he guides OUTSIDE the task: home, «Моє господарство», place screens; never while the learner
 *    answers, never in feedback, never in EXAM;
 *  - he never praises or rates an answer, gives no rewards and never hands out keys himself;
 *  - after a break he welcomes back without guilt; nothing was lost (MOT-04);
 *  - static, no sound; the learner can hide him; calm mode hides him.
 */
import type { LearnerState } from "./learner.ts";

export type HospodarMoment = "first_visit" | "welcome_back" | "regular";
export const WELCOME_BACK_AFTER_DAYS = 3;

/** Day difference between two local calendar dates (YYYY-MM-DD), DST-safe. */
const dayIndex = (d: string) => { const [y, m, dd] = d.split("-").map(Number); return Math.round(Date.UTC(y!, m! - 1, dd!) / 86_400_000); };
const toLocal = (iso: string) => { const t = new Date(iso); return Number.isNaN(t.getTime()) ? null : t; };

export function lastActivity(state: LearnerState): Date | null {
  let last: Date | null = null;
  for (const at of [...state.attempts.map(a => a.completedAt), ...state.diagnostics.map(d => d.completedAt), ...state.retention.map(r => r.submittedAt)]) {
    const t = typeof at === "string" ? toLocal(at) : null;
    if (t && (!last || t > last)) last = t;
  }
  return last;
}

export function hospodarMoment(state: LearnerState, now: Date): HospodarMoment {
  const last = lastActivity(state);
  if (!last) return "first_visit";
  const p = (n: number) => String(n).padStart(2, "0");
  const local = (t: Date) => `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`;
  const gap = dayIndex(local(now)) - dayIndex(local(last));
  return gap >= WELCOME_BACK_AFTER_DAYS ? "welcome_back" : "regular";   // a future-dated record never shames: gap < 0 → regular
}

/** His words on the home screen. Ukrainian brand copy, no Finnish answer content, no praise, no pressure. */
export const HOSPODAR_HOME: Record<HospodarMoment, string> = {
  first_visit: "Добрий день! Я Господар. У Фінляндії я сам даю раду своїм справам — і з YKI теж. Обери місце, з якого почнемо: усі двері для тебе відкриті.",
  welcome_back: "З поверненням! Господарство на місці — нічого не зникло й нічого не згоріло. Почнімо з того, що потрібно саме тобі сьогодні.",
  regular: "Доброго дня! Справ багато, але без поспіху: одне місце, одна справа — і вже крок уперед.",
};

/** His words on a place screen: how the door and keys work here. Never a judgement of the learner. */
export function hospodarAtPlace(doorOpen: boolean): string {
  return doorOpen
    ? "Двері вже відчинені. Ключ тут дають лише за правильну першу відповідь без підказки — так чесно, і так видно, що справді вмієш."
    : "Двері поки зачинені. Спробуй будь-яку справу сам(а) — і вони відчиняться. Помилитися тут не страшно.";
}
