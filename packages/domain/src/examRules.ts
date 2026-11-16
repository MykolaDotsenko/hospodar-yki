/**
 * The rules an EXAM attempt runs by, taken from its pinned profile (docs/29 stage 4; TZ-EXAM-07, 08, 12, 13, 17;
 * EXAM-06, YKI-FID-01). For every critical parameter:
 *
 *   verified   the profile has a verified record (source, date, reviewer, scope; see isVerifiedRecord) with a value of
 *              the right type → that value is used, and shown with its source date;
 *   practice   otherwise → the simulator's own practice behaviour below is used, and shown as practice. An unknown rule
 *              is never guessed and never presented as the real exam's.
 *
 * `applied` says whether the simulator actually reproduces a verified value yet. A verified parameter the engine does
 * not apply is shown as such ("confirmed, not reproduced yet"), never as reproduced.
 * Pure and framework-free; the web exam screen reads it, a future Android exam reads the same.
 */
import { CRITICAL_PARAMETERS, isValidParameterValue, isVerifiedRecord, type ExamProfile, type ParameterValue } from "./examProfile.ts";
import { PRACTICE_SPEAKING_WINDOWS } from "./examSpeaking.ts";


/**
 * What the simulator does today, as data. `null` timing = no fixed time per subtest: the learner chooses one overall
 * practice timer (or none). None of these is an OPH figure.
 */
export const PRACTICE_RULES: Readonly<Record<string, ParameterValue>> = Object.freeze({
  "structure.subtest_order": "reading,listening,writing,speaking",
  "timing.reading_minutes": null, "timing.listening_minutes": null, "timing.writing_minutes": null, "timing.speaking_minutes": null,
  "timing.on_expiry": "lock",
  "navigation.back_allowed": true, "navigation.review_screen": false,
  "listening.plays_allowed": "unlimited", "listening.pause_seek": true,
  "speaking.prep_seconds": PRACTICE_SPEAKING_WINDOWS.prepSeconds, "speaking.response_seconds": PRACTICE_SPEAKING_WINDOWS.responseSeconds,
  "speaking.recording_start": "after_prep", "speaking.rerecord_allowed": true,
  "writing.spellcheck": false, "writing.paste_allowed": true, "writing.counter": "none",
  "instructions.language": "fi",
});

/** Parameters whose VERIFIED value the engine applies today (a practice value is always what the engine does). */
export const ENGINE_APPLIES: ReadonlySet<string> = Object.freeze(new Set([
  "navigation.back_allowed", "writing.spellcheck", "writing.paste_allowed", "writing.counter",
  "speaking.prep_seconds", "speaking.response_seconds",
])) as ReadonlySet<string>;

export interface ExamRule {
  parameter: string; label_uk: string; value: ParameterValue;
  status: "verified" | "practice";
  /** Verified only: is the value actually reproduced by the simulator? Practice values always are. */
  applied: boolean;
  observed_on: string | null; source_url: string | null;
}
export interface ExamRules {
  rules: ExamRule[];
  verified: number; practice: number; notApplied: number;
  /** Typed accessors for the engine; each falls back to the practice value when the verified one is not applied. */
  backAllowed: boolean; spellcheck: boolean; pasteAllowed: boolean; counter: "none" | "words" | "characters";
}

export function resolveExamRules(profile: ExamProfile | null | undefined): ExamRules {
  const rules: ExamRule[] = CRITICAL_PARAMETERS.map(c => {
    const r = profile?.records.find(x => x.parameter === c.id);
    if (profile && r && isVerifiedRecord(profile, r) && isValidParameterValue(c.id, r.value))
      return { parameter: c.id, label_uk: c.label_uk, value: r.value, status: "verified", applied: ENGINE_APPLIES.has(c.id),
        observed_on: r.observed_on, source_url: r.source_url };
    return { parameter: c.id, label_uk: c.label_uk, value: PRACTICE_RULES[c.id] ?? null, status: "practice", applied: true, observed_on: null, source_url: null };
  });
  const used = (id: string) => {
    const r = rules.find(x => x.parameter === id)!;
    return r.applied ? r.value : PRACTICE_RULES[id] ?? null;
  };
  return {
    rules,
    verified: rules.filter(r => r.status === "verified").length,
    practice: rules.filter(r => r.status === "practice").length,
    notApplied: rules.filter(r => !r.applied).length,
    backAllowed: used("navigation.back_allowed") === true,
    spellcheck: used("writing.spellcheck") === true,
    pasteAllowed: used("writing.paste_allowed") === true,
    counter: used("writing.counter") as ExamRules["counter"],
  };
}

/** Learner-facing value, Ukrainian (the rules list is a system notice, not exam content). */
export function ruleValueUk(rule: Pick<ExamRule, "parameter" | "value">): string {
  const v = rule.value;
  if (v === null) return rule.parameter.startsWith("timing.") ? "окремого часу немає — загальний тренувальний таймер обираєш ти" : "невідомо";
  if (typeof v === "boolean") return v ? "так" : "ні";
  const words: Record<string, string> = {
    unlimited: "без обмеження", lock: "відповіді блокуються", next_subtest: "перехід до наступної частини", submit: "спроба завершується",
    learner: "учень починає сам", after_prep: "сам після часу на підготовку", none: "немає", words: "слова", characters: "символи",
    fi: "фінська", "fi+sv": "фінська й шведська", "fi+en": "фінська й англійська",
  };
  if (rule.parameter === "structure.subtest_order")
    return String(v).split(",").map(s => ({ reading: "читання", listening: "аудіювання", writing: "письмо", speaking: "говоріння" }[s] ?? s)).join(" → ");
  if (typeof v === "number") return rule.parameter.endsWith("_seconds") ? `${v} с` : rule.parameter.endsWith("_minutes") ? `${v} хв` : `${v}`;
  return words[v] ?? v;
}
