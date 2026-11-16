/**
 * Mediation after reading, listening or a dialogue (method cefr-mediation-paraphrase, P0; CEFR mediation: relaying a text to
 * someone who needs it). After a LEARN reading text, listening lesson or dialogue is finished, the learner may explain it to a person in a
 * realistic situation:
 *  - in Ukrainian to a friend who reads no Finnish (cross-language mediation; shows understanding of the Finnish text), or
 *  - in simpler Finnish to a neighbour (intra-language mediation; Finnish production).
 * Optional and ungraded: no model answer, no key; the learner checks their own text against three questions.
 */
export type MediationMode = "uk" | "fi";
/** What was relayed: a text the learner read, a recording the learner heard, or a conversation the learner took part in. */
export type MediationSource = "reading" | "listening" | "dialogue";
export const MEDIATION_MODES: Readonly<Record<MediationMode, { label_uk: string; field_uk: string; lang: "uk" | "fi" }>> = Object.freeze({
  uk: { label_uk: "Українською — другові, який не читає фінською", field_uk: "Твоє пояснення українською", lang: "uk" },
  fi: { label_uk: "Простішою фінською — сусідові", field_uk: "Твоє пояснення фінською (простіше, ніж у тексті)", lang: "fi" },
});
/** The same two listeners after a recording: the friend cannot understand spoken Finnish; "simpler than the recording". */
export const MEDIATION_MODES_LISTENING: Readonly<Record<MediationMode, { label_uk: string; field_uk: string; lang: "uk" | "fi" }>> = Object.freeze({
  uk: { label_uk: "Українською — другові, який не розуміє фінської", field_uk: "Твоє пояснення українською", lang: "uk" },
  fi: { label_uk: "Простішою фінською — сусідові", field_uk: "Твоє пояснення фінською (простіше, ніж у записі)", lang: "fi" },
});
/** After a dialogue: the friend was not there; the neighbour hears a simpler account of what was agreed. */
export const MEDIATION_MODES_DIALOGUE: Readonly<Record<MediationMode, { label_uk: string; field_uk: string; lang: "uk" | "fi" }>> = Object.freeze({
  uk: { label_uk: "Українською — другові, якого там не було", field_uk: "Твоя розповідь українською", lang: "uk" },
  fi: { label_uk: "Простішою фінською — сусідові", field_uk: "Твоя розповідь фінською (простіше, ніж у розмові)", lang: "fi" },
});
export const mediationModes = (source: MediationSource = "reading") =>
  source === "listening" ? MEDIATION_MODES_LISTENING : source === "dialogue" ? MEDIATION_MODES_DIALOGUE : MEDIATION_MODES;
export const MEDIATION_CHECK_UK: readonly string[] = Object.freeze(["Хто або що?", "Коли й де?", "Що людині треба зробити?"]);
/** A conversation is relayed by who talked and why, what they agreed, and what happens next. */
export const MEDIATION_CHECK_DIALOGUE_UK: readonly string[] = Object.freeze(["Хто з ким говорив і навіщо?", "Про що домовилися?", "Що буде далі?"]);
export const mediationChecks = (source: MediationSource = "reading") => source === "dialogue" ? MEDIATION_CHECK_DIALOGUE_UK : MEDIATION_CHECK_UK;
export const MEDIATION_MAX_CHARS = 1000;

/**
 * A Ukrainian relay shows comprehension of what was read or heard (reading or listening; a dialogue is a written script,
 * so reading); simpler Finnish is Finnish writing. Both ungraded.
 */
export function mediationEvidence(itemId: string, mode: MediationMode, text: string, checked: readonly number[], source: MediationSource = "reading") {
  const t = String(text ?? "").trim();
  if (!t) throw new Error("EMPTY");
  if (mode !== "uk" && mode !== "fi") throw new Error("MODE");
  if (source !== "reading" && source !== "listening" && source !== "dialogue") throw new Error("SOURCE");
  const checks = mediationChecks(source);
  const k = new Set(checked.filter(i => Number.isInteger(i) && i >= 0 && i < checks.length)).size;
  const from = source === "listening" ? "from listening " : source === "dialogue" ? "of a dialogue " : "";
  const skill = mode === "uk" ? (source === "listening" ? "listening" as const : "reading" as const) : "writing" as const;
  return { skill, taskId: `${itemId}-mediation`, status: "ungraded" as const,
    response: `[mediation ${from}to ${mode === "uk" ? "Ukrainian (friend without Finnish)" : "simpler Finnish (neighbour)"}; self-check ${k}/${checks.length}] ${t.slice(0, MEDIATION_MAX_CHARS)}` };
}
