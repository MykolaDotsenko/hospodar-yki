import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dictoglossEvidence, dictoglossReducer, dictoglossView, markShared, nextDictoglossCue, parseVttCues, startDictogloss,
  DICTOGLOSS_MAX_LISTENS, type DictoglossSession } from "../src/index.ts";

const vtt = readFileSync(new URL("../../../assets/audio/long/b1/b1long-03-verkkokaupan-palautus.vtt", import.meta.url), "utf8");

describe("dictogloss: listen to a segment (max twice) → reconstruct → compare", () => {
  it("parses the lesson's own subtitle cues as segments", () => {
    const cues = parseVttCues(vtt);
    expect(cues.length).toBe(12);
    expect(cues[0]).toMatchObject({ start: 0, text: expect.stringMatching(/^Sofia oli tilannut verkkokaupasta/) });
    expect(cues[1]!.start).toBeCloseTo(11.238, 3);
    expect(parseVttCues("WEBVTT\n\nNOTE x\n\nbroken --> line\ntext")).toEqual([]);
  });
  it("the transcript stays hidden until the own reconstruction; at most two listens; writing needs a listen first", () => {
    const cue = parseVttCues(vtt)[0]!;
    let s: DictoglossSession = startDictogloss("b1long-03", 0);
    expect(() => dictoglossReducer(s, { type: "START_WRITING" })).toThrow(/Listen first/);
    for (let i = 0; i < DICTOGLOSS_MAX_LISTENS; i++) s = dictoglossReducer(s, { type: "PLAYED" });
    expect(() => dictoglossReducer(s, { type: "PLAYED" })).toThrow();
    expect(dictoglossView(s, cue).original).toBeNull();
    s = dictoglossReducer(s, { type: "START_WRITING" });
    expect(dictoglossView(s, cue).original).toBeNull();
    expect(() => dictoglossReducer(s, { type: "SUBMIT", text: "  " })).toThrow();
    s = dictoglossReducer(s, { type: "SUBMIT", text: "Sofia tilasi uuden takin verkkokaupasta." });
    expect(dictoglossView(s, cue).original).toBe(cue.text);
    expect(() => dictoglossReducer(s, { type: "FINISH" })).toThrow(/Judge/);
    s = dictoglossReducer(dictoglossReducer(s, { type: "JUDGE", judgement: "main" }), { type: "FINISH" });
    expect(dictoglossEvidence(s)).toMatchObject({ skill: "listening", taskId: "dictogloss-b1long-03-1", status: "ungraded" });
    expect(dictoglossEvidence(s).response).toMatch(/^\[dictogloss after 2 listen\(s\); self-judged main\] Sofia tilasi/);
  });
  it("marks only identical word forms (case and punctuation ignored); a different form is not marked — never a score", () => {
    const m = markShared("Sofia oli tilannut uuden takin.", "sofia tilasi uuden takki");
    expect(m.map(w => w.shared)).toEqual([true, false, false, true, false]);
  });
  it("offers the next segment not yet reconstructed", () => {
    expect(nextDictoglossCue(new Set(), "x", 3)).toBe(0);
    expect(nextDictoglossCue(new Set(["dictogloss-x-1"]), "x", 3)).toBe(1);
    expect(nextDictoglossCue(new Set(["dictogloss-x-1", "dictogloss-x-2", "dictogloss-x-3"]), "x", 3)).toBeNull();
  });
});
