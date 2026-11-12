import { describe, expect, it } from "vitest";
import { familyOfTag } from "@hospodar/domain";
import { exercises } from "./cloze.ts";
import { FAMILIES, hasTagLabel, workshopItems } from "./workshop.ts";

describe("Майстерня слабких місць content (error-bottleneck-deliberate, interleaving-grammar)", () => {
  it("every grammar tag of the cloze bank belongs to exactly one family of confusable forms", () => {
    const map = familyOfTag(FAMILIES);
    const tags = [...new Set(exercises.map(e => e.grammar_tag).filter(Boolean))] as string[];
    expect(tags.filter(t => !map.has(t))).toEqual([]);
    expect(workshopItems).toHaveLength(exercises.filter(e => e.grammar_tag).length);
  });
  it("every family has real tasks, a Ukrainian title and an explanation why its forms are mixed", () => {
    for (const f of FAMILIES) {
      expect(workshopItems.filter(i => f.tags.includes(i.tag)).length, f.id).toBeGreaterThanOrEqual(3);
      expect(f.title_uk && f.why_uk).toBeTruthy();
    }
  });
  it("every tag has a learner-facing name; no internal key such as verb_type_1 reaches the screen", () => {
    expect(FAMILIES.flatMap(f => f.tags).filter(t => !hasTagLabel(t))).toEqual([]);
  });
});
