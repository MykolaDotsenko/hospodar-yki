import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { admitExamForm, formCoverage, type CoverageForm, type CoverageTaxonomy, type FamilyMappingRow } from "../src/index.ts";

const root = new URL("../../../", import.meta.url);
const read = (p: string) => JSON.parse(readFileSync(new URL(p, root), "utf8"));
const patterns = read("research/yki/yki-official-patterns-v2.json");
const audit = read("research/yki/e03-construct-task-coverage-audit-2026-10.json");
const taxonomy: CoverageTaxonomy = {
  families: patterns.patterns.map((p: { id: string }) => p.id),
  topics: patterns.topic_taxonomy.map((t: { id: string }) => t.id),
  functions: patterns.communication_functions.map((f: { id: string }) => f.id),
};
const mapping = audit.family_mapping as FamilyMappingRow[];
const minis = read("learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json").blueprints as (Omit<CoverageForm, "claim">)[];

describe("construct coverage of exam forms (TZ-EXAM-15, TZ-EXAM-06)", () => {
  it("exam coverage: 13 families, 9 topics and 6 functions from the canonical taxonomy; families come from the form's own ids via the E03 mapping", () => {
    expect([taxonomy.families.length, taxonomy.topics.length, taxonomy.functions.length]).toEqual([13, 9, 6]);
    const a = formCoverage({ ...minis[0]!, claim: "practice_subset" }, taxonomy, mapping);
    expect(a.families.present).toEqual(["READING_MCQ", "READING_TF", "READING_OPEN", "LISTENING_MCQ", "WRITING_FORMAL", "SPEAKING_SITUATIONS"]);
    expect(a.families.missing).toHaveLength(7);
    expect(a.topics.declared).toBe(false);                                 // the minis do not tag topics or functions yet
    expect(a.functions.declared).toBe(false);
    expect(a.complete).toBe(false);
  });

  it("exam coverage: a form that claims to be a full exam is refused with every missing family, topic or function; a practice subset is admitted and stays a subset", () => {
    const full = admitExamForm({ ...minis[0]!, claim: "full" }, taxonomy, mapping);
    expect(full.ok).toBe(false);
    if (!full.ok) expect(full.reason).toMatch(/not a full exam: missing .*LISTENING_TF.*T01.*F01/);
    expect(admitExamForm({ ...minis[1]!, claim: "practice_subset" }, taxonomy, mapping).ok).toBe(true);
    // a form whose items represent every family and that declares every topic and function is admitted as full
    const m2 = mapping.map(r => ({ ...r, example_internal_ids: r.example_internal_ids.length ? r.example_internal_ids : [`fake-${r.pattern_id}`] }));
    const every: CoverageForm = { id: "x", claim: "full", skill_blocks: m2.flatMap(r => r.example_internal_ids.map(i => ({ item_id: i }))),
      topic_ids: taxonomy.topics, function_ids: taxonomy.functions };
    expect(admitExamForm(every, taxonomy, m2).ok).toBe(true);
    expect(admitExamForm({ ...every, function_ids: taxonomy.functions.slice(1) }, taxonomy, m2)).toMatchObject({ ok: false, reason: expect.stringMatching(/F01/) });
  });
});
