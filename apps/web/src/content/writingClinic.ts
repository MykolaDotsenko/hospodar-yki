/** Writing clinic items, read from their single physical owner (learning/exercises/b1/high-yield). */
import { validateClinicItem, type ClinicItem } from "@hospodar/domain";
import data from "../../../../learning/exercises/b1/high-yield/writing-repair-clinic.json";
import { learnerPool } from "./release.ts";
import rubrics from "../../../../learning/exercises/b1/feedback-rubrics.json";

const items = learnerPool((data as unknown as { items: ClinicItem[] }).items);
if (!items.every(validateClinicItem)) throw new Error("writing-repair-clinic.json has an invalid item");
export const clinicItems = items;

/**
 * Wider self-check criteria for an own text (learning/exercises/b1/feedback-rubrics.json, CURATED-09). Labels only:
 * the file's weights are internal heuristics, not OPH weights (R04), so no weight, score or level is ever shown.
 */
const rubricFile = rubrics as unknown as { writing: { key: string; label_uk: string; description_uk?: string }[]; feedback_steps: string[] };
export const writingCriteria = rubricFile.writing.map(c => ({ key: c.key, label_uk: c.label_uk, ...(c.description_uk ? { description_uk: c.description_uk } : {}) }));
export const contentFirstHint = rubricFile.feedback_steps[0] ?? "";
