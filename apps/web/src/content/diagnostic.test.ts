import { describe, expect, it } from "vitest";
import { validateBaseline } from "@hospodar/domain";
import raw from "../../../../learning/exercises/b1/diagnostics/baseline-v1.json";
import { baseline, DIAGNOSTIC_PRODUCTION_IDS } from "./diagnostic.ts";
import { EXAM_ITEM_IDS } from "./reviewBanks.ts";
import { skillRetentionBank } from "./skillRetention.ts";

describe("starting diagnostic never shows an EXAM task (EXAM-11)", () => {
  it("no task the LEARN diagnostic shows is used by an EXAM blueprint — not even the baseline file's own production tasks", () => {
    const shown = [...baseline.reading.questions.map(q => q.id), ...baseline.writing.map(t => t.id), ...baseline.speaking.map(t => t.id)];
    for (const id of shown) expect(EXAM_ITEM_IDS.has(id), id).toBe(false);
    const fileTasks = [...(raw as { writing: { id: string }[] }).writing, ...(raw as { speaking: { id: string }[] }).speaking].map(t => t.id);
    expect(fileTasks.some(id => EXAM_ITEM_IDS.has(id))).toBe(true);                      // the overlap this guards against is real
  });
  it("its writing and speaking tasks are not withheld delayed checks either, and the diagnostic stays valid", () => {
    const withheld = new Set([...skillRetentionBank.writing, ...skillRetentionBank.speaking].map(i => i.id));
    expect(withheld.has(DIAGNOSTIC_PRODUCTION_IDS.writing)).toBe(false);
    expect(withheld.has(DIAGNOSTIC_PRODUCTION_IDS.speaking)).toBe(false);
    expect([baseline.writing[0]!.id, baseline.speaking[0]!.id]).toEqual([DIAGNOSTIC_PRODUCTION_IDS.writing, DIAGNOSTIC_PRODUCTION_IDS.speaking]);
    expect(validateBaseline(baseline)).toBe(true);
  });
});
