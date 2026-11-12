/**
 * «Господар»: the brand persona — a MASTER and mentor (сенсей, владник): he has mastered his own life in
 * Finland and YKI, and shows the learner the way; the learner walks it alone. Owner decisions 12.11.2026
 * (DEC-06 revised). Pure, deterministic.
 *
 * His "науки" are short learning principles that the product's research supports and the app enforces
 * (retrieval before the model LEARN-07, spacing 1/3/7/14/30, self-repair, production aloud, delayed new-situation
 * checks GL-03) — a mentor's voice for real rules, not decoration and not an effect-size claim.
 *
 * Research bounds (IV-14, COG-07, MOT-04/05/06, MOT-E06/E09, UIO-10):
 *  - he speaks OUTSIDE the task: home, «Моє господарство», place screens; never while the learner answers,
 *    never in feedback, never in EXAM;
 *  - he never praises or rates an answer, gives no rewards, hands out no keys, ranks no one;
 *  - after a break he welcomes back without guilt; nothing was lost (MOT-04);
 *  - he never promises a YKI pass (brand promise);
 *  - static, silent; the learner can hide him; calm mode hides him.
 */
import type { LearnerState } from "./learner.ts";

export type HospodarMoment = "first_visit" | "welcome_back" | "regular";
export const WELCOME_BACK_AFTER_DAYS = 3;

/** Day number of a local calendar date, DST-safe. */
const dayNumber = (t: Date) => Math.round(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) / 86_400_000);
const parse = (iso: unknown) => { if (typeof iso !== "string") return null; const t = new Date(iso); return Number.isNaN(t.getTime()) ? null : t; };

export function lastActivity(state: LearnerState): Date | null {
  let last: Date | null = null;
  for (const at of [...state.attempts.map(a => a.completedAt), ...state.diagnostics.map(d => d.completedAt), ...state.retention.map(r => r.submittedAt)]) {
    const t = parse(at);
    if (t && (!last || t > last)) last = t;
  }
  return last;
}

export function hospodarMoment(state: LearnerState, now: Date): HospodarMoment {
  const last = lastActivity(state);
  if (!last) return "first_visit";
  const gap = dayNumber(now) - dayNumber(last);
  return gap >= WELCOME_BACK_AFTER_DAYS ? "welcome_back" : "regular";   // a future-dated record never shames: gap < 0 → regular
}

/** The master's teachings: each names a rule the app actually follows. */
export const HOSPODAR_TEACHINGS: readonly string[] = Object.freeze([
  "Наука майстра: спершу відповідай сам(а), а зразок дивись потім. Так пам'ять міцнішає.",
  "Наука майстра: краще десять хвилин щодня, ніж година раз на тиждень. Пам'ять любить повернення.",
  "Наука майстра: помилка — не вирок, а матеріал. Виправ її сам(а), і вона стане твоєю силою.",
  "Наука майстра: говори вголос, навіть коли ніхто не чує. Мова живе в устах, а не лише в голові.",
  "Наука майстра: справжня перевірка — нова ситуація без підказки. Тому я питаю знову через 7, 14 і 30 днів.",
]);

export function hospodarTeaching(now: Date): string {
  return HOSPODAR_TEACHINGS[((dayNumber(now) % HOSPODAR_TEACHINGS.length) + HOSPODAR_TEACHINGS.length) % HOSPODAR_TEACHINGS.length]!;
}

/** His words on the home screen. Ukrainian brand copy; no Finnish answer content, no praise, no pressure, no pass promise. */
export function hospodarHome(moment: HospodarMoment, now: Date): string {
  switch (moment) {
    case "first_visit": return "Вітаю. Я Господар — майстер своєї справи. Колись і я стояв на цьому порозі учнем, а тепер владаю своїм життям у Фінляндії. Шлях покажу, а пройдеш його ти сам(а). Обери, з якого місця почнемо.";
    case "welcome_back": return "Ти повернувся(лася) — це головне. Майстер не рахує пропущених днів: усе, що ти здобув(ла), на місці. Почнімо з того, що потрібно саме тобі.";
    case "regular": return hospodarTeaching(now);
  }
}

/** His words on a place screen: the way to become господар of this place. Never a judgement of the learner. */
export function hospodarAtPlace(doorOpen: boolean): string {
  return doorOpen
    ? "Двері відчинені. Ключі тут не дарують — їх здобувають правильною першою відповіддю без підказки. Так і стають господарем."
    : "Ці двері чекають на твою першу спробу. Майстер — не той, хто не помиляється, а той, хто пробує сам.";
}
