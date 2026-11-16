/**
 * Interlocutor change in speech acts (method pragmatic-speech-acts, P0). After a saved reaction card or a finished dialogue
 * role-play the learner MAY perform the same act — the card's or the role-play's own situation — for three listeners in turn: a friend, a neighbour they barely know,
 * and an official or employer. Each reply gets a separate appropriateness self-check (register, not content), and at
 * the end the three own replies are shown side by side, so the learner notices what changed.
 *
 *  - cues and checks are Ukrainian instructions over the existing situation: no Finnish model, no key (editorial draft,
 *    S2 review pending — e.g. how often Finns use «sinä» with officials);
 *  - replies are the learner's own Finnish, saved ungraded; the self-check is a report, never a score;
 *  - optional and stoppable after any listener; nothing locks or counts as a level.
 */
import type { Skill } from "./learner.ts";

export type Interlocutor = "friend" | "neighbour" | "official";
export interface InterlocutorStep { id: Interlocutor; who_uk: string; cue_uk: string; checks_uk: readonly string[] }

export const INTERLOCUTOR_LADDER: readonly InterlocutorStep[] = Object.freeze([
  { id: "friend", who_uk: "Друг або подруга", cue_uk: "Скажи це другові: можна на «sinä», коротко й невимушено.",
    checks_uk: Object.freeze(["Звертаєшся на «sinä»?", "Коротко, без офіційних формул?", "Головне сказано так, як сказав(ла) б другові?"]) },
  { id: "neighbour", who_uk: "Сусід, якого ти знаєш лише трохи", cue_uk: "Скажи це сусідові: ввічливо, але не офіційно — привітайся й поясни, у чому справа.",
    checks_uk: Object.freeze(["Є привітання?", "Звучить м'якше, ніж другові (наприклад, умовний спосіб, «anteeksi», «valitettavasti»)?", "Ясно, у чому справа?"]) },
  { id: "official", who_uk: "Службовець в установі або роботодавець", cue_uk: "Скажи це службовцю: найввічливіше — повні речення, ввічливі форми (наприклад, умовний спосіб), без розмовних скорочень.",
    checks_uk: Object.freeze(["Ввічлива форма: умовний спосіб, звертання на «te» або безособово?", "Без розмовних форм (mä, sä, mut)?", "Ввічливий початок і кінець (привітання, подяка), а головне сказано чітко?"]) },
]);
/** The checks are about how the learner sounds, never about the goal: an apology stays an apology, an explanation an explanation. */
export const SAME_ACT_UK = "Дія та сама, що в картці (подяка, вибачення, відмова, пояснення чи питання) — змінюється лише те, як ти звучиш для цієї людини.";

/** Shown with the ladder: register in Finland is not a fixed rule, and this is practice for when a situation asks for it. */
export const REGISTER_NOTE_UK = "У Фінляндії багато хто й в установах звертається на «sinä». Тут ти тренуєш, як звучати ввічливіше, коли ситуація цього вимагає. Підказки — редакційна чернетка, їх ще перевірить викладач S2.";

export const REGISTER_MAX_CHARS = 800;

/** Reaction cards (requests, refusals, clarifications in a situation) and dialogue role-plays have the interlocutor ladder. */
export type LadderKind = "reaction" | "dialogue";
export interface LadderTarget { id: string; kind: string; attemptSkill: Skill }
export const hasInterlocutorLadder = (card: { kind: string }): card is { kind: LadderKind } => card.kind === "reaction" || card.kind === "dialogue";

/** Ungraded evidence for one listener; the appropriateness self-check is counted, never scored. */
export function interlocutorEvidence(card: LadderTarget, who: Interlocutor, text: string, checked: readonly number[]) {
  if (!hasInterlocutorLadder(card)) throw new Error("NO_LADDER");
  const step = INTERLOCUTOR_LADDER.find(s => s.id === who);
  if (!step) throw new Error("UNKNOWN_INTERLOCUTOR");
  const t = String(text ?? "").trim();
  if (!t) throw new Error("EMPTY");
  const marks = [...new Set(checked)];
  if (marks.length !== checked.length || !marks.every(i => Number.isInteger(i) && i >= 0 && i < step.checks_uk.length)) throw new Error("BAD_CHECK");
  return {
    skill: card.attemptSkill, taskId: `${card.id}-register-${who}`, status: "ungraded" as const,
    response: `[register: ${who}; appropriateness self-check ${marks.length}/${step.checks_uk.length}] ${t.slice(0, REGISTER_MAX_CHARS)}`,
  };
}
