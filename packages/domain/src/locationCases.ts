/**
 * UIO-06 semantic visual: the three inner location cases as one picture of a place — in it (missä?), out of it
 * (mistä?), into it (mihin?) — shown on request after the first attempt (UIO-04), with an equivalent static table.
 *
 * Only for a task whose grammar tag is an inner location case AND whose editor wrote a spatial meaning
 * (`semantic_relation_uk`): an elative of a topic or an adessive of means ("bussilla") is not a place, and a picture
 * of a house would teach the wrong meaning. The Finnish form shown is the task's own key (S2 review status as the
 * task's); the question words and endings are grammar metadata, not new answer keys.
 */
export type InnerLocation = "in" | "from" | "into";

export interface InnerLocationCase {
  id: InnerLocation; tag: "inessiivi" | "elatiivi" | "illatiivi";
  question_fi: string; question_uk: string; endings_fi: string; picture_uk: string;
}

export const INNER_LOCATION_CASES: readonly InnerLocationCase[] = Object.freeze([
  { id: "in", tag: "inessiivi", question_fi: "missä?", question_uk: "де? — усередині", endings_fi: "-ssa / -ssä",
    picture_uk: "Крапка всередині будинку: хтось або щось перебуває в місці." },
  { id: "from", tag: "elatiivi", question_fi: "mistä?", question_uk: "звідки? — зсередини назовні", endings_fi: "-sta / -stä",
    picture_uk: "Стрілка виходить із будинку: рух із місця." },
  { id: "into", tag: "illatiivi", question_fi: "mihin?", question_uk: "куди? — ззовні всередину", endings_fi: "-Vn / -hVn / -seen",
    picture_uk: "Стрілка входить у будинок: рух у місце." },
]);

export interface LocationScheme { current: InnerLocation; form_fi: string }

export function locationSchemeFor(task: { grammar_tag?: string | null; semantic_relation_uk?: string | null; answer_fi: string }): LocationScheme | null {
  const c = INNER_LOCATION_CASES.find(x => x.tag === task.grammar_tag);
  if (!c || !task.semantic_relation_uk?.trim() || !task.answer_fi.trim()) return null;
  return { current: c.id, form_fi: task.answer_fi.trim() };
}
