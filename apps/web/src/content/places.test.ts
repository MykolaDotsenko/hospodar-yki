import { describe, expect, it } from "vitest";
import { PLACE_IDS } from "@hospodar/domain";
import exam from "../../../../learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json";
import { placeIndex, places } from "./places.ts";

const examIds = new Set((exam as unknown as { blueprints: { skill_blocks: { item_id: string }[] }[] }).blueprints.flatMap(b => b.skill_blocks.map(s => s.item_id)));

describe("«Моє господарство» content (GAM-01, UIO-09, EXAM-11)", () => {
  it("nine places in YKI theme order, each with a Finnish and a Ukrainian name, a life goal and an optional deed", () => {
    expect(places.map(p => p.id)).toEqual([...PLACE_IDS]);
    for (const p of places) {
      expect(p.title_fi && p.title_uk && p.goal_uk && p.deed_uk).toBeTruthy();
    }
  });
  it("every place offers at least two real communicative missions (a game element is always a real task)", () => {
    for (const p of places) expect(p.quests.length, p.id).toBeGreaterThanOrEqual(2);
  });
  it("no EXAM item ever appears in a place (exam integrity)", () => {
    for (const i of placeIndex.items) expect(examIds.has(i.itemId), i.itemId).toBe(false);
  });
});
