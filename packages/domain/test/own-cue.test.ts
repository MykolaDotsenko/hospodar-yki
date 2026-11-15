/**
 * Own memory cue for a problem phrase (method keyword-mnemonic-retrieval; docs/29 stage 2: "a safe change of the card
 * schema — old data, export and restore pass tests"). The cue is the learner's own words, kept with a scheduled
 * chunk/rektio card, shown on a review only on request, never a key, never scored, never changes the schedule.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
// @ts-expect-error legacy JS module without types
import * as legacy from "../../../app/core.mjs";
import {
  blankState, buildDataExport, chunkCard, completeMission, completePractice, inspectWebLearnBackup, isOwnCue, normaliseOwnCue,
  OWN_CUE_MAX_CHARS, opinionCard, practiceEvidence, practiceReducer, readState, serialiseDataExport, startPractice, updateCard, withOwnCue,
  type LearnerState, type PracticeCard, type PracticeSession,
} from "../src/index.ts";

const root = new URL("../../../", import.meta.url);
const read = (p: string) => JSON.parse(readFileSync(new URL(p, root), "utf8"));
const chunk = chunkCard(read("knowledge/dictionaries/b1/contextual-chunks-v1.json").items[0]) as PracticeCard;
const opinion = opinionCard(read("learning/exercises/b1/high-yield/opinion-argumentation-v1.json").items[0]) as PracticeCard;
const DAY1 = new Date("2026-11-11T09:00:00+02:00"), DAY2 = new Date("2026-11-12T09:00:00+02:00");

function run(card: PracticeCard, judged: "same" | "partly" | "different", opts: { cue?: string; showCue?: boolean } = {}): PracticeSession {
  let s = startPractice(card);
  if (opts.showCue) s = practiceReducer(s, card, { type: "SHOW_CUE" });
  s = practiceReducer(s, card, { type: "ANSWER", value: "mennä Suomeen" });
  s = practiceReducer(s, card, { type: "JUDGE", judgement: judged });
  if (opts.cue !== undefined) s = practiceReducer(s, card, { type: "SET_CUE", text: opts.cue });
  s = practiceReducer(s, card, { type: "CONTINUE" });
  return practiceReducer(s, card, { type: "SUBMIT_TRANSFER", text: "Ystäväni muutti Suomeen." });
}
const exportOf = (state: LearnerState) => serialiseDataExport(buildDataExport({
  learn: { state, revision: 3, imports: [] }, exam: { current: null, history: [] }, exportedAt: DAY2 }));

describe("own memory cue on a problem phrase (keyword-mnemonic-retrieval)", () => {
  it("is kept only with a phrase that enters the schedule; a phrase known at first sight gets none", () => {
    const failed = completePractice(blankState(), run(chunk, "partly", { cue: "  муттаа — «мітла» мете  мене до Суомі " }), chunk, DAY1);
    expect(failed.cards[chunk.id]).toMatchObject({ stage: 0, due: "2026-11-12", ownCue: "муттаа — «мітла» мете мене до Суомі" });
    const known = completePractice(blankState(), run(chunk, "same", { cue: "не потрібна" }), chunk, DAY1);
    expect(known.cards[chunk.id]).toBeUndefined();
  });
  it("never changes the schedule; survives every later review; can be replaced or removed", () => {
    const withCue = completePractice(blankState(), run(chunk, "different", { cue: "мітла" }), chunk, DAY1);
    const noCue = completePractice(blankState(), run(chunk, "different"), chunk, DAY1);
    const { ownCue, ...schedule } = withCue.cards[chunk.id]!;
    expect(ownCue).toBe("мітла");
    expect(schedule).toEqual(noCue.cards[chunk.id]);
    const reviewed = completePractice(withCue, run(chunk, "same"), chunk, DAY2);            // untouched field = keep
    expect(reviewed.cards[chunk.id]).toMatchObject({ stage: 1, ownCue: "мітла" });
    expect(completePractice(withCue, run(chunk, "same", { cue: "нова зачіпка" }), chunk, DAY2).cards[chunk.id]!.ownCue).toBe("нова зачіпка");
    expect("ownCue" in completePractice(withCue, run(chunk, "same", { cue: "   " }), chunk, DAY2).cards[chunk.id]!).toBe(false);
    expect(updateCard({ ...withCue.cards[chunk.id]!, ownCue: "x" }, false, DAY2).ownCue).toBe("x");
  });
  it("is offered only on problem phrases: shown before the answer only on request, written only after seeing the phrase", () => {
    let s = startPractice(chunk);
    expect(() => practiceReducer(s, chunk, { type: "SET_CUE", text: "x" })).toThrow();                // not before the answer
    s = practiceReducer(s, chunk, { type: "SHOW_CUE" });
    expect(s.cueShown).toBe(true);
    s = practiceReducer(s, chunk, { type: "ANSWER", value: "muuttaa Suomeen" });
    expect(() => practiceReducer(s, chunk, { type: "SHOW_CUE" })).toThrow();                          // answer already frozen
    expect(() => practiceReducer(startPractice(opinion), opinion, { type: "SHOW_CUE" })).toThrow();    // not a problem-phrase card
  });
  it("an answer after opening the own cue is labelled so; the first answer stays ungraded and self-compared", () => {
    const [first] = practiceEvidence(run(chunk, "same", { showCue: true }), chunk);
    expect(first).toMatchObject({ status: "ungraded" });
    expect(first!.response).toMatch(/^\[own first answer, after opening own memory cue; self-compared same\]/);
    expect(practiceEvidence(run(chunk, "same"), chunk)[0]!.response).not.toMatch(/memory cue/);
  });
  it("normalisation: one line, at most 200 characters, empty means no cue", () => {
    expect(normaliseOwnCue("a\n\tb\u0007 c")).toBe("a b c");
    expect(normaliseOwnCue("   ")).toBeNull();
    expect(normaliseOwnCue("я".repeat(500))).toHaveLength(OWN_CUE_MAX_CHARS);
    expect([isOwnCue("ok"), isOwnCue(" ok"), isOwnCue("a\nb"), isOwnCue(""), isOwnCue("я".repeat(201)), isOwnCue(3)]).toEqual([true, false, false, false, false, false]);
    expect(withOwnCue({ stage: 0, due: "2026-11-12", reviews: 1, failures: 1, lastCorrect: false, lastReviewed: "2026-11-11", ownCue: "x" }, "")).not.toHaveProperty("ownCue");
  });
});

describe("safe card schema change: old data, export and restore", () => {
  const old = completeMission(blankState(), { taskId: "b1-g-001", firstAnswer: "kirjasto", firstCorrect: false, transferText: "Menen kirjastoon." }, DAY1);
  const withCue = completePractice(old, run(chunk, "partly", { cue: "мітла" }), chunk, DAY1);

  it("a stored state from before the change reads back unchanged, its cards byte for byte (no cue field invented)", () => {
    const raw = JSON.stringify(old);
    expect(readState(raw).state).toEqual(old);
    expect(JSON.stringify(readState(raw).state.cards)).toBe(JSON.stringify(old.cards));
    expect(Object.values(readState(raw).state.cards).some(c => "ownCue" in c)).toBe(false);
  });
  it("a state with a cue reads back unchanged; a malformed cue is dropped but the card and its schedule are kept", () => {
    expect(readState(JSON.stringify(withCue)).state).toEqual(withCue);
    const broken = JSON.parse(JSON.stringify(withCue));
    broken.cards[chunk.id].ownCue = " x\n".repeat(100);
    const back = readState(JSON.stringify(broken));
    expect(back.recovered).toBe(false);
    const { ownCue: _c, ...schedule } = withCue.cards[chunk.id]!;
    expect(back.state.cards[chunk.id]).toEqual(schedule);
  });
  it("export → restore keeps the cue losslessly; an export from before the change still restores", () => {
    const r = inspectWebLearnBackup(exportOf(withCue));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.state.cards[chunk.id]!.ownCue).toBe("мітла");
    expect(inspectWebLearnBackup(exportOf(old))).toMatchObject({ ok: true });
  });
  it("restore fails closed on a tampered card: a non-normalised cue or any other extra card field", () => {
    for (const tamper of [(c: Record<string, unknown>) => { c.ownCue = " мітла"; }, (c: Record<string, unknown>) => { c.ownCue = ""; },
      (c: Record<string, unknown>) => { c.ownCue = 7; }, (c: Record<string, unknown>) => { c.hint = "x"; }]) {
      const doc = JSON.parse(exportOf(withCue));
      tamper(doc.learn.state.cards[chunk.id]);
      expect(inspectWebLearnBackup(JSON.stringify(doc))).toMatchObject({ ok: false, reason: "UNSAFE_LEARN_DATA" });
    }
  });
  it("legacy app/core.mjs (V1 localStorage) never writes a cue and its reader drops one; everything else stays identical", () => {
    const fromLegacy = legacy.readState(JSON.stringify(withCue)).state;
    const { ownCue: _c, ...schedule } = withCue.cards[chunk.id]!;
    expect(fromLegacy.cards[chunk.id]).toEqual(schedule);
    expect({ ...readState(JSON.stringify(withCue)).state, cards: fromLegacy.cards }).toEqual(fromLegacy);
  });
});
