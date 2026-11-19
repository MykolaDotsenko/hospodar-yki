/**
 * Construct coverage of an exam form (TZ-EXAM-15, TZ-EXAM-06; E03 audit research/yki/e03-construct-task-coverage-audit-
 * 2026-10.json; canonical taxonomy research/yki/yki-official-patterns-v2.json: 13 task families, T01–T09 topics,
 * F01–F06 communicative functions).
 *
 *  - families are derived from the form's own item and question ids through the E03 family mapping (never guessed);
 *  - topics and functions count only when the form declares them (`topic_ids`, `function_ids`); undeclared = not covered;
 *  - a form may be called a FULL exam only when every family, topic and function is covered — anything else is a
 *    practice subset and must be labelled so. Coverage is structural: it says nothing about S2 quality or 2027 fidelity.
 */
export interface CoverageTaxonomy { families: string[]; topics: string[]; functions: string[] }
export interface FamilyMappingRow { pattern_id: string; example_internal_ids: string[] }
export interface CoverageForm {
  id: string; claim: "full" | "practice_subset";
  skill_blocks: { item_id: string; question_ids?: string[] }[];
  topic_ids?: string[]; function_ids?: string[];
}
export interface FormCoverage {
  formId: string;
  families: { present: string[]; missing: string[] };
  topics: { present: string[]; missing: string[]; declared: boolean };
  functions: { present: string[]; missing: string[]; declared: boolean };
  complete: boolean;
}

export function formCoverage(form: CoverageForm, taxonomy: CoverageTaxonomy, mapping: readonly FamilyMappingRow[]): FormCoverage {
  const ids = new Set(form.skill_blocks.flatMap(b => [b.item_id, ...(b.question_ids ?? [])]));
  const fam = new Set(mapping.filter(r => r.example_internal_ids.some(i => ids.has(i))).map(r => r.pattern_id));
  const split = (all: string[], have: Set<string>) => ({ present: all.filter(x => have.has(x)), missing: all.filter(x => !have.has(x)) });
  const topics = new Set((form.topic_ids ?? []).filter(t => taxonomy.topics.includes(t)));
  const functions = new Set((form.function_ids ?? []).filter(f => taxonomy.functions.includes(f)));
  const families = split(taxonomy.families, fam);
  const t = { ...split(taxonomy.topics, topics), declared: Array.isArray(form.topic_ids) && form.topic_ids.length > 0 };
  const f = { ...split(taxonomy.functions, functions), declared: Array.isArray(form.function_ids) && form.function_ids.length > 0 };
  return { formId: form.id, families, topics: t, functions: f, complete: !families.missing.length && !t.missing.length && !f.missing.length };
}

/** A form that claims to be a full exam is refused unless it covers every family, topic and function. */
export function admitExamForm(form: CoverageForm, taxonomy: CoverageTaxonomy, mapping: readonly FamilyMappingRow[]): { ok: true; coverage: FormCoverage } | { ok: false; reason: string; coverage: FormCoverage } {
  const coverage = formCoverage(form, taxonomy, mapping);
  if (form.claim === "full" && !coverage.complete) {
    const gaps = [...coverage.families.missing, ...coverage.topics.missing, ...coverage.functions.missing];
    return { ok: false, reason: `not a full exam: missing ${gaps.join(", ")}`, coverage };
  }
  return { ok: true, coverage };
}
