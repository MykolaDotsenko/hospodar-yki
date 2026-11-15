/**
 * Mediation after reading or listening (method cefr-mediation-paraphrase, P0; CEFR mediation: relaying a text to someone
 * who needs it). After a LEARN reading text or listening lesson is finished, the learner may explain it to a person in a
 * realistic situation:
 *  - in Ukrainian to a friend who reads no Finnish (cross-language mediation; shows understanding of the Finnish text), or
 *  - in simpler Finnish to a neighbour (intra-language mediation; Finnish production).
 * Optional and ungraded: no model answer, no key; the learner checks their own text against three questions.
 */
export type MediationMode = "uk" | "fi";
/** What was relayed: a text the learner read, or a recording the learner heard. */
export type MediationSource = "reading" | "listening";
export const MEDIATION_MODES: Readonly<Record<MediationMode, { label_uk: string; field_uk: string; lang: "uk" | "fi" }>> = Object.freeze({
  uk: { label_uk: "Українською — другові, який не читає фінською", field_uk: "Твоє пояснення українською", lang: "uk" },
  fi: { label_uk: "Простішою фінською — сусідові", field_uk: "Твоє пояснення фінською (простіше, ніж у тексті)", lang: "fi" },
});
/** The same two listeners after a recording: the friend cannot understand spoken Finnish; "simpler than the recording". */
export const MEDIATION_MODES_LISTENING: Readonly<Record<MediationMode, { label_uk: string; field_uk: string; lang: "uk" | "fi" }>> = Object.freeze({
  uk: { label_uk: "Українською — другові, який не розуміє фінської", field_uk: "Твоє пояснення українською", lang: "uk" },
  fi: { label_uk: "Простішою фінською — сусідові", field_uk: "Твоє пояснення фінською (простіше, ніж у записі)", lang: "fi" },
});
export const mediationModes = (source: MediationSource = "reading") => source === "listening" ? MEDIATION_MODES_LISTENING : MEDIATION_MODES;
export const MEDIATION_CHECK_UK: readonly string[] = Object.freeze(["Хто або що?", "Коли й де?", "Що людині треба зробити?"]);
export const MEDIATION_MAX_CHARS = 1000;

/**
 * A Ukrainian relay shows comprehension of what was read or heard (reading or listening); simpler Finnish is Finnish
 * writing. Both ungraded.
 */
export function mediationEvidence(itemId: string, mode: MediationMode, text: string, checked: readonly number[], source: MediationSource = "reading") {
  const t = String(text ?? "").trim();
  if (!t) throw new Error("EMPTY");
  if (mode !== "uk" && mode !== "fi") throw new Error("MODE");
  if (source !== "reading" && source !== "listening") throw new Error("SOURCE");
  const k = new Set(checked.filter(i => Number.isInteger(i) && i >= 0 && i < MEDIATION_CHECK_UK.length)).size;
  const from = source === "listening" ? "from listening " : "";
  return { skill: mode === "uk" ? source : "writing" as const, taskId: `${itemId}-mediation`, status: "ungraded" as const,
    response: `[mediation ${from}to ${mode === "uk" ? "Ukrainian (friend without Finnish)" : "simpler Finnish (neighbour)"}; self-check ${k}/${MEDIATION_CHECK_UK.length}] ${t.slice(0, MEDIATION_MAX_CHARS)}` };
}
