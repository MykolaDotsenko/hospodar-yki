import { describe, expect, it } from "vitest";
import { PLACE_IDS } from "@hospodar/domain";
import { externalMissions } from "./externalMissions.ts";
import { EXTERNAL_MISSION_PLACE } from "./externalMissionPlaces.ts";
import { places } from "./places.ts";

describe("external-source missions in their life places (docs/29 queue 10)", () => {
  it("every mission the app loads has an explicit place (or null for a general one), and no listed id is unknown", () => {
    const ids = externalMissions.map(m => m.id);
    expect(ids.filter(id => !(id in EXTERNAL_MISSION_PLACE))).toEqual([]);
    expect(Object.keys(EXTERNAL_MISSION_PLACE).filter(id => !ids.includes(id))).toEqual([]);
    expect(Object.values(EXTERNAL_MISSION_PLACE).every(p => p === null || (PLACE_IDS as readonly string[]).includes(p))).toBe(true);
  });
  it("a place lists its missions as «Місія з джерелом» quests; they never become a whole-task scenario step", () => {
    const health = places.find(p => p.id === "health")!;
    const ext = health.quests.filter(q => q.view === "external");
    expect(ext.map(q => q.itemId)).toEqual(Object.entries(EXTERNAL_MISSION_PLACE).filter(([, p]) => p === "health").map(([id]) => id));
    expect(ext.every(q => q.kindUk === "Місія з джерелом" && q.skill === undefined)).toBe(true);
    for (const p of places) expect((p.scenario ?? []).some(s => ext.some(q => q.itemId === s.itemId))).toBe(false);
  });
});
