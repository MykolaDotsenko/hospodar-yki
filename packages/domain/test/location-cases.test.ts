import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { INNER_LOCATION_CASES, locationSchemeFor } from "../src/index.ts";

const root = new URL("../../../", import.meta.url);
const cloze = JSON.parse(readFileSync(new URL("learning/exercises/b1/grammar/contextual-cloze.json", root), "utf8")).exercises as
  { id: string; grammar_tag: string; answer_fi: string; semantic_relation_uk?: string }[];

describe("UIO-06 inner location cases as one picture of a place", () => {
  it("location scheme: only for an inner location case with a spatial meaning; the form shown is the task's own key", () => {
    expect(INNER_LOCATION_CASES.map(c => [c.id, c.tag, c.question_fi])).toEqual([
      ["in", "inessiivi", "missä?"], ["from", "elatiivi", "mistä?"], ["into", "illatiivi", "mihin?"]]);
    const byId = Object.fromEntries(cloze.map(e => [e.id, locationSchemeFor(e)]));
    expect(byId["b1-g-001"]).toEqual({ current: "into", form_fi: "kirjastoon" });
    expect(byId["b1-g-002"]).toEqual({ current: "from", form_fi: "kaupasta" });
    expect(byId["b1-g-003"]).toEqual({ current: "in", form_fi: "koulussa" });
    expect(byId["b1-g-014"]).toBeNull();                                  // "bussilla": adessive of means, not a place
    expect(byId["b1-g-004"]).toBeNull();                                  // allative to a person: outer case, not this picture
    expect(byId["b1-g-021"]).toBeNull();                                  // elative without an editor's spatial meaning
    for (const e of cloze.filter(x => byId[x.id])) expect(e.semantic_relation_uk).toMatch(/де\?|звідки\?|куди\?/);
    expect(locationSchemeFor({ grammar_tag: "illatiivi", semantic_relation_uk: " ", answer_fi: "x" })).toBeNull();
    expect(locationSchemeFor({ grammar_tag: "partitiivi", semantic_relation_uk: "що?", answer_fi: "x" })).toBeNull();
  });
});
