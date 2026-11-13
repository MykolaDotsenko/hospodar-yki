import { describe, expect, it } from "vitest";
import { blankState, coverageMap, PLACE_IDS } from "@hospodar/domain";
import exam from "../../../../learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json";
import { placeIndex, places } from "./places.ts";
import { allListeningLessons, listeningLessons } from "./listening.ts";

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
  it("no EXAM item ever appears in a place (exam integrity) — checked on index keys AND on the items quests open", () => {
    for (const i of placeIndex.items) expect(examIds.has(i.itemId), i.itemId).toBe(false);
    for (const p of places) for (const q of p.quests) expect(examIds.has(q.itemId), `${p.id}:${q.itemId}`).toBe(false);
  });
  it("the LEARN listening pool never contains a lesson an EXAM blueprint uses (EXAM-11)", () => {
    for (const l of listeningLessons) expect(examIds.has(l.id), l.id).toBe(false);
    expect(allListeningLessons.some(l => examIds.has(l.id))).toBe(true);                       // the filter is doing real work
  });
  it("YKI preparation map: 9 themes × 4 skills is checked; content gaps are an explicit register that may only shrink", () => {
    const m = coverageMap(blankState(), placeIndex);
    expect(m.cells).toHaveLength(36);
    // Each gap needs new LEARN material authored or reviewed by an S2 teacher (no AI-authored Finnish keys/models).
    expect(m.contentGaps.map(c => `${c.place}:${c.skill}`)).toEqual([
      "identity:listening", "identity:writing", "housing:listening", "culture:listening", "culture:writing", "health:writing",
      "work:listening", "environment:writing", "society:listening",
    ]);
    for (const p of PLACE_IDS) {
      const row = m.cells.filter(c => c.place === p && c.itemsTotal > 0).map(c => c.skill);
      expect(row.some(s => s === "reading" || s === "listening"), `${p}: receptive`).toBe(true);
      expect(row.some(s => s === "writing" || s === "speaking"), `${p}: productive`).toBe(true);
    }
  });
  it("every long listening lesson with a life topic belongs to a place (no orphan LEARN material)", () => {
    const listening = places.flatMap(p => p.quests.filter(q => q.view === "listening"));
    expect(listening.length).toBe(4);                                                          // 2 of 6 are EXAM items, held out
    for (const q of listening) expect(placeIndex.items.some(i => i.itemId === q.taskPrefix && i.skill === "listening"), q.itemId).toBe(true);
  });
  it("«Ціла справа» (task-based): understand → say → write from the place's own LEARN items, never exam items", () => {
    const withScenario = places.filter(p => p.scenario).map(p => p.id);
    expect(withScenario).toEqual(["services", "travel", "work", "society"]);
    for (const p of places) for (const st of p.scenario ?? []) {
      expect(examIds.has(st.itemId), st.itemId).toBe(false);
      expect(p.quests.some(q => q.itemId === st.itemId && q.skill === st.skill), `${p.id}:${st.itemId}`).toBe(true);
    }
    expect(places.find(p => p.id === "travel")!.scenario!.map(s => s.skill)).toEqual(["reading", "listening", "speaking", "writing"]);
  });
});
