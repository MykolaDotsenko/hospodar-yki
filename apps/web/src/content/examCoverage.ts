/** Construct coverage of each EXAM set (TZ-EXAM-15/06): canonical taxonomy + E03 family mapping, structural only. */
import { formCoverage, type CoverageForm, type CoverageTaxonomy, type FamilyMappingRow, type FormCoverage } from "@hospodar/domain";
import patterns from "../../../../research/yki/yki-official-patterns-v2.json";
import audit from "../../../../research/yki/e03-construct-task-coverage-audit-2026-10.json";
import { examBlueprints } from "./exam.ts";

const p = patterns as unknown as { patterns: { id: string; skill: string }[]; topic_taxonomy: { id: string; name_fi: string }[]; communication_functions: { id: string; name_fi: string }[] };
export const coverageTaxonomy: CoverageTaxonomy = {
  families: p.patterns.map(x => x.id), topics: p.topic_taxonomy.map(t => t.id), functions: p.communication_functions.map(f => f.id),
};
const mapping = (audit as unknown as { family_mapping: FamilyMappingRow[] }).family_mapping;
/** Ukrainian names for the 13 families (labels only; the ids are canonical). */
export const FAMILY_UK: Record<string, string> = {
  READING_MCQ: "читання: вибір із трьох", READING_TF: "читання: так / ні", READING_OPEN: "читання: коротка відповідь",
  LISTENING_MCQ: "аудіювання: вибір із трьох", LISTENING_TF: "аудіювання: так / ні", LISTENING_OPEN: "аудіювання: коротка відповідь",
  WRITING_MESSAGE: "письмо: особисте повідомлення", WRITING_FORMAL: "письмо: офіційний лист чи запит", WRITING_OPINION: "письмо: думка з аргументами",
  SPEAKING_NARRATIVE: "говоріння: розповідь", SPEAKING_DIALOGUE: "говоріння: діалог", SPEAKING_SITUATIONS: "говоріння: ситуації", SPEAKING_OPINION: "говоріння: думка",
};
export const coverageOf = (blueprintId: string): FormCoverage | null => {
  const b = examBlueprints.find(x => x.id === blueprintId);
  return b ? formCoverage({ ...(b as unknown as CoverageForm), claim: "practice_subset" }, coverageTaxonomy, mapping) : null;
};
