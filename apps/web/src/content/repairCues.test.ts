import { describe, expect, it } from "vitest";
import { exercises } from "./cloze.ts";
import { coveredRepairTags, repairQuestionFor } from "./repairCues.ts";

/** Productive Finnish content remains S2_PENDING. Tests validate the release
 * boundary and content-type routing, not linguistic correctness or efficacy. */
describe("R03 / COG-05 contextual repair prompts", () => {
  it("provides a non-empty grammar-appropriate prompt for every currently bundled cloze tag", () => {
    const tags = new Set(exercises.map(x => x.grammar_tag));
    expect(exercises).toHaveLength(28); // review bank changes explicitly
    expect(tags.has(undefined)).toBe(false);
    expect(new Set(coveredRepairTags())).toEqual(tags);
    for (const task of exercises) {
      const hint = repairQuestionFor(task.grammar_tag);
      expect(hint.length).toBeGreaterThan(45);
      expect(hint.length).toBeLessThan(220);
      expect(hint).not.toContain(task.answer_fi); // no word-form answer disclosure in repair
      expect(hint).not.toMatch(/правильна відповідь:\s/i);
    }
  });
  it("does not misdirect tense, negative, verb or numeral errors into location-case cues", () => {
    for (const tag of ["imperfekti", "perfekti", "past_negation", "negation", "konditionaali",
      "politeness", "numerals", "verb_type_4", "verb_type_1", "kpt", "plural_verb", "perfect_plural"]) {
      const hint = repairQuestionFor(tag);
      expect(hint).not.toMatch(/куди|звідки|перебування в місці|де саме/iu);
    }
    expect(repairQuestionFor("imperfekti")).toContain("минулий час");
    expect(repairQuestionFor("rektio_partitiivi")).toContain("керування");
    expect(repairQuestionFor("numerals")).toContain("числівник");
    expect(repairQuestionFor("illatiivi")).toContain("куди");
  });
  it("never guesses an error type for an unknown, empty or inherited tag", () => {
    const base = repairQuestionFor("unknown-new-tag");
    expect(base).toContain("Перечитай зміст");
    expect(repairQuestionFor(null)).toBe(base);
    expect(repairQuestionFor("__proto__")).toBe(base);
    expect(repairQuestionFor("constructor")).toBe(base);
  });
});
