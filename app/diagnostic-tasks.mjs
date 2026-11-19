/**
 * EXAM-11 in the legacy app: the baseline file's own production tasks (d-w1/d-w2, d-s1/d-s2) are the writing and speaking
 * parts of the EXAM mini rehearsals, so the LEARN diagnostic must never show them — a learner would meet the exam prompt
 * before the exam. Like apps/web (src/content/diagnostic.ts), the diagnostic uses the closest theme tasks instead.
 * Pure: the caller fetches the files.
 */
export const DIAGNOSTIC_PRODUCTION_IDS = Object.freeze({ writing: "09-yhteiskunta-writing-01", speaking: "06-terveys-ja-hyvinvointi-speaking-01" });
export const DIAGNOSTIC_THEME_FILES = Object.freeze({
  writing: "learning/exercises/b1/themes/09-yhteiskunta.json",
  speaking: "learning/exercises/b1/themes/06-terveys-ja-hyvinvointi.json",
});

/** The baseline with its writing/speaking replaced by the theme tasks; throws when a task is missing or malformed. */
export function learnDiagnosticBaseline(baseline, themes) {
  const pick = part => {
    const t = (themes?.[part]?.[part] ?? []).find(x => x && x.id === DIAGNOSTIC_PRODUCTION_IDS[part]);
    if (!t || typeof t.prompt_fi !== "string" || !Array.isArray(t.required_points_fi)) throw new Error(`diagnostic ${part} task ${DIAGNOSTIC_PRODUCTION_IDS[part]} is missing`);
    return t;
  };
  return { ...baseline, writing: [pick("writing")], speaking: [pick("speaking")] };
}
