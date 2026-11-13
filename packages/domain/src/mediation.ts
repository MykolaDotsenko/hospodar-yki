/**
 * Mediation after reading (method cefr-mediation-paraphrase, P0; CEFR mediation: relaying a text to someone who needs it).
 * After a LEARN reading text is finished, the learner may explain it to a person in a realistic situation:
 *  - in Ukrainian to a friend who reads no Finnish (cross-language mediation; shows understanding of the Finnish text), or
 *  - in simpler Finnish to a neighbour (intra-language mediation; Finnish production).
 * Optional and ungraded: no model answer, no key; the learner checks their own text against three questions.
 */
export type MediationMode = "uk" | "fi";
export const MEDIATION_MODES: Readonly<Record<MediationMode, { label_uk: string; field_uk: string; lang: "uk" | "fi" }>> = Object.freeze({
  uk: { label_uk: "Українською — другові, який не читає фінською", field_uk: "Твоє пояснення українською", lang: "uk" },
  fi: { label_uk: "Простішою фінською — сусідові", field_uk: "Твоє пояснення фінською (простіше, ніж у тексті)", lang: "fi" },
});
export const MEDIATION_CHECK_UK: readonly string[] = Object.freeze(["Хто або що?", "Коли й де?", "Що людині треба зробити?"]);
export const MEDIATION_MAX_CHARS = 1000;

/** Ukrainian relay shows reading comprehension; simpler Finnish is Finnish writing. Both ungraded. */
export function mediationEvidence(itemId: string, mode: MediationMode, text: string, checked: readonly number[]) {
  const t = String(text ?? "").trim();
  if (!t) throw new Error("EMPTY");
  if (mode !== "uk" && mode !== "fi") throw new Error("MODE");
  const k = new Set(checked.filter(i => Number.isInteger(i) && i >= 0 && i < MEDIATION_CHECK_UK.length)).size;
  return { skill: mode === "uk" ? "reading" as const : "writing" as const, taskId: `${itemId}-mediation`, status: "ungraded" as const,
    response: `[mediation to ${mode === "uk" ? "Ukrainian (friend without Finnish)" : "simpler Finnish (neighbour)"}; self-check ${k}/${MEDIATION_CHECK_UK.length}] ${t.slice(0, MEDIATION_MAX_CHARS)}` };
}
