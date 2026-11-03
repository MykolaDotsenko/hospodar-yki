/** Content is read from its single physical owner in learning/exercises (bundled at build). */
import type { ClozeTask } from "@hospodar/domain";
import cloze from "../../../../learning/exercises/b1/grammar/contextual-cloze.json";

export interface ClozeExercise extends ClozeTask {
  id: string;
  prompt_fi: string;
  answer_fi: string;
  meaning_uk?: string;
  explanation_uk?: string;
  grammar_tag?: string;
  transfer_task_fi?: string;
  semantic_relation_uk?: string;
  teacher_review?: string;
  review_card?: { status?: string };
}
export const exercises = (cloze as { exercises: ClozeExercise[] }).exercises;
/** No item in the repository is S2-published yet (validate_content_publication.py). */
export const isDraft = (e: ClozeExercise) => e.review_card?.status !== "published";
