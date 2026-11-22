/**
 * spaced-retrieval (registry method, P0 98): the 1/3/7/14/30 schedule now also covers the two grammar practice kinds that
 * the learner could fail and never meet again — «Час дієслова й годинник» (keyed choice) and «Форма слова в реченні»
 * (corpus form, self-compared). Only a failed retrieval schedules; a review of a seen keyed item is never a new scored
 * first attempt; own memory cues stay with phrases.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { blankState, chunkCard, completePractice, dueCards, formCard, hasOwnCue, isSpacedKind, practiceDue, practiceEvidence, practiceReducer,
  skillSummary, spacedOutcome, startPractice, tenseCard, validatePracticeCard, PracticeError,
  type FormItem, type PracticeCard, type TenseLesson, type TimeChoiceItem } from "../src/index.ts";

const root = new URL("../../../", import.meta.url);
const read = (p: string) => JSON.parse(readFileSync(new URL(p, root), "utf8"));
const tenses = read("learning/exercises/grammar/tenses/lessons.json") as { lessons: TenseLesson[]; exercises: TimeChoiceItem[] };
const ex = tenses.exercises[0]!;
const time = tenseCard(ex, tenses.lessons.find(l => l.tense === ex.tense)!, null)!;
const form = (read("learning/exercises/b1/grammar/ftb-frequency-cloze-v1.json").items as FormItem[]).map(formCard).find(c => validatePracticeCard(c))!;
const chunk = chunkCard(read("knowledge/dictionaries/b1/contextual-chunks-v1.json").items[0]);
const day = (n: number) => new Date(Date.UTC(2026, 10, 10 + n, 9));
const KEY = String(time.choice!.correct_index), WRONG = String((time.choice!.correct_index + 1) % time.choice!.options_fi.length);

const choose = (c: PracticeCard, v: string) => {
  let s = practiceReducer(startPractice(c), c, { type: "ANSWER", value: v });
  s = practiceReducer(s, c, { type: "CONTINUE" });
  return practiceReducer(s, c, { type: "SUBMIT_TRANSFER", text: "Opiskelin eilen." });
};
const judge = (c: PracticeCard, j: "same" | "partly" | "different") => {
  let s = practiceReducer(startPractice(c), c, { type: "ANSWER", value: "vastaus" });
  s = practiceReducer(practiceReducer(s, c, { type: "JUDGE", judgement: j }), c, { type: "CONTINUE" });
  return practiceReducer(s, c, { type: "SUBMIT_TRANSFER", text: "Oma lause." });
};

describe("spaced retrieval of grammar practice: tense/clock choices and corpus word forms", () => {
  it("both kinds are scheduled kinds; only phrases take an own memory cue", () => {
    expect([time.kind, form.kind]).toEqual(["time", "form"]);
    expect(isSpacedKind(time) && isSpacedKind(form) && isSpacedKind(chunk)).toBe(true);
    expect([hasOwnCue(time), hasOwnCue(form), hasOwnCue(chunk)]).toEqual([false, false, true]);
    const s = practiceReducer(startPractice(form), form, { type: "ANSWER", value: "mielensä" });
    expect(() => practiceReducer(s, form, { type: "SET_CUE", text: "x" })).toThrow(PracticeError);
    expect(() => practiceReducer(startPractice(time), time, { type: "SHOW_CUE" })).toThrow(PracticeError);
  });

  it("tense choice: a right first choice is never scheduled; a wrong one returns the next day, climbs 1→3 on recall and drops back on a miss", () => {
    expect(completePractice(blankState(), choose(time, KEY), time, day(0)).cards[time.id]).toBeUndefined();
    expect(spacedOutcome(blankState(), choose(time, KEY), time)).toBe("not_scheduled");

    expect(spacedOutcome(blankState(), choose(time, WRONG), time)).toBe("back_tomorrow");
    let st = completePractice(blankState(), choose(time, WRONG), time, day(0));
    expect(st.cards[time.id]).toMatchObject({ stage: 0, due: "2026-11-11", failures: 1 });
    expect(practiceDue(st, [time], "2026-11-10")).toEqual([]);                      // not massed on the same day
    expect(practiceDue(st, [time], "2026-11-11").map(c => c.id)).toEqual([time.id]);

    expect(spacedOutcome(st, choose(time, KEY), time)).toBe("longer_gap");
    st = completePractice(st, choose(time, KEY), time, day(1));
    expect(st.cards[time.id]).toMatchObject({ stage: 1, due: "2026-11-12" });
    st = completePractice(st, choose(time, KEY), time, day(2));
    expect(st.cards[time.id]).toMatchObject({ stage: 2, due: "2026-11-15" });
    st = completePractice(st, choose(time, WRONG), time, day(5));
    expect(st.cards[time.id]).toMatchObject({ stage: 0, due: "2026-11-16", failures: 2 });
  });

  it("a review of a seen keyed item is ungraded practice, never a second scored first attempt", () => {
    let st = completePractice(blankState(), choose(time, WRONG), time, day(0));
    st = completePractice(st, choose(time, KEY), time, day(1));
    const own = st.diagnostics.filter(d => d.taskId === time.id);
    expect(own.map(d => [d.status, d.correct])).toEqual([["scored", false], ["ungraded", undefined]]);
    expect(own[1]!.response).toMatch(/^\[spaced review of an item seen before with its key; choice matched the key: yes\]/);
    expect(skillSummary(st).reading).toMatchObject({ scored: 1, correct: 0 });       // the review does not lift the reading count
    expect(practiceEvidence(choose(time, KEY), time)[0]).toMatchObject({ status: "scored", correct: true });   // first exposure stays scored
  });

  it("corpus word form: self-judged 'partly'/'different' schedules, 'same' at first sight does not; the answer stays ungraded", () => {
    expect(completePractice(blankState(), judge(form, "same"), form, day(0)).cards[form.id]).toBeUndefined();
    for (const j of ["partly", "different"] as const) {
      const st = completePractice(blankState(), judge(form, j), form, day(0));
      expect(st.cards[form.id]).toMatchObject({ stage: 0, due: "2026-11-11" });
      expect(st.diagnostics.every(d => d.status === "ungraded" && !("correct" in d))).toBe(true);
      expect(dueCards(st, "2026-11-11").map(c => c.id)).toEqual([form.id]);
    }
    const st = completePractice(blankState(), judge(form, "different"), form, day(0));
    expect(completePractice(st, judge(form, "same"), form, day(1)).cards[form.id]).toMatchObject({ stage: 1, due: "2026-11-12" });
  });

  it("a scheduled id that is not in the learner pool (e.g. an EXAM item) is never served", () => {
    const st = completePractice(blankState(), choose(time, WRONG), time, day(0));
    expect(practiceDue(st, [form, chunk], "2026-11-11")).toEqual([]);
  });

  it("non-spaced kinds keep their old behaviour", () => {
    expect(spacedOutcome(blankState(), judge(chunk, "same"), { ...chunk, kind: "reaction", attemptSkill: "speaking", transferSkill: "speaking" })).toBe("not_spaced");
  });
});
