import { describe, expect, it } from "vitest";
import { blankState, coverageMap, PLACE_IDS } from "@hospodar/domain";
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
  it("YKI preparation map: 9 themes × 4 skills is checked; content gaps are an explicit register that may only shrink", () => {
    const m = coverageMap(blankState(), placeIndex);
    expect(m.cells).toHaveLength(36);
    // Each gap needs new LEARN material authored or reviewed by an S2 teacher (no AI-authored Finnish keys/models).
    expect(m.contentGaps.map(c => `${c.place}:${c.skill}`)).toEqual([
      "identity:listening", "identity:writing", "culture:listening", "culture:writing", "health:writing", "environment:writing", "society:listening",
    ]);
    for (const p of PLACE_IDS) {
      const row = m.cells.filter(c => c.place === p && c.itemsTotal > 0).map(c => c.skill);
      expect(row.some(s => s === "reading" || s === "listening"), `${p}: receptive`).toBe(true);
      expect(row.some(s => s === "writing" || s === "speaking"), `${p}: productive`).toBe(true);
    }
  });
  it("every long listening lesson with a life topic belongs to a place (no orphan LEARN material)", () => {
    const listening = places.flatMap(p => p.quests.filter(q => q.view === "listening"));
    expect(listening.length).toBe(6);
    for (const q of listening) expect(placeIndex.items.some(i => i.itemId === q.taskPrefix && i.skill === "listening"), q.itemId).toBe(true);
  });
});
