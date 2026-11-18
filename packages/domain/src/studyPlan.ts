/**
 * A voluntary if-then study plan (method micro-missions; R08-MOT research №02, MOT-E11 / MOT-E12; MOT-02, MOT-03, MOT-11).
 * The learner writes their own cue in their own words — «Коли я сідаю в автобус до роботи» — and picks a skill and 5, 10
 * or 20 minutes. Home shows the sentence and a button to start that skill now.
 *
 * Evidence is mixed: if-then plans with a specific, salient, own cue went with more next-day practice in a 42-day
 * micro-randomized study of children (MOT-E11), but did not increase distributed practice among university students
 * (MOT-E12). So the plan is optional, has no reminder, alarm or notification, never counts days, never shames a pause,
 * and is never a measure of learning. Stored only on this device after the learner saves it; editable and erasable.
 * Port of the R08-MOT reference `createR08StudyPlan` (app/r08-motivation-core.mjs): same minutes and limits.
 */
import type { Skill } from "./learner.ts";

export const STUDY_PLAN_MINUTES = Object.freeze([5, 10, 20] as const);
export type StudyPlanMinutes = typeof STUDY_PLAN_MINUTES[number];
export const STUDY_PLAN_CUE_MAX = 150;
export interface StudyPlan { version: 1; cue_uk: string; skill: Skill; minutes: StudyPlanMinutes; created: string }

const SKILLS: readonly Skill[] = ["reading", "listening", "writing", "speaking"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const clean = (t: unknown) => (typeof t === "string" ? t.trim().replace(/\s+/gu, " ") : "");
export const SKILL_ACTION_UK: Readonly<Record<Skill, string>> = Object.freeze({
  reading: "читатиму фінською", listening: "слухатиму фінську", writing: "писатиму фінською", speaking: "говоритиму фінською",
});

/** Refuses an empty or too long cue, an unknown skill, other minutes or a bad date: nothing is guessed for the learner. */
export function studyPlan(cue: string, skill: Skill, minutes: number, today: string): StudyPlan {
  const c = clean(cue);
  if (!c) throw new Error("EMPTY_CUE");
  if (c.length > STUDY_PLAN_CUE_MAX) throw new Error("CUE_TOO_LONG");
  if (!SKILLS.includes(skill)) throw new Error("BAD_SKILL");
  if (!(STUDY_PLAN_MINUTES as readonly number[]).includes(minutes)) throw new Error("BAD_MINUTES");
  if (!DATE.test(today)) throw new Error("BAD_DATE");
  return { version: 1, cue_uk: c, skill, minutes: minutes as StudyPlanMinutes, created: today };
}

/** Tolerant reader: anything unexpected reads as "no plan" — never a made-up one. */
export function parseStudyPlan(raw: unknown): StudyPlan | null {
  const r = raw as Partial<StudyPlan> | null;
  if (!r || typeof r !== "object" || r.version !== 1) return null;
  try { return studyPlan(String(r.cue_uk ?? ""), r.skill as Skill, Number(r.minutes), String(r.created ?? "")); } catch { return null; }
}

/** «Коли …, я N хв …» — the cue as written (a leading «коли» is not doubled). */
export function studyPlanSentence(p: StudyPlan): string {
  const rest = p.cue_uk.replace(/^коли\s+/iu, "").replace(/[.,;:!?\s]+$/u, "");
  const cue = rest.charAt(0).toLocaleLowerCase("uk") + rest.slice(1);       // the cue continues the sentence
  return `Коли ${cue}, я ${p.minutes} хв ${SKILL_ACTION_UK[p.skill]}.`;
}
