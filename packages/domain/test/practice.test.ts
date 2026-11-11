import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { addDiagnostic, blankState, completePractice, dueCards, practiceDue, chunkCard, opinionCard, paraphraseCard, practiceEvidence, practiceReducer, practiceView,
  reactionCard, rektioCard, startPractice, validatePracticeCard, PracticeError, type PracticeCard } from "../src/index.ts";

const root = new URL("../../../", import.meta.url);
const read = (p: string) => JSON.parse(readFileSync(new URL(p, root), "utf8"));
const paraphrase = read("learning/exercises/b1/high-yield/paraphrase-drills.json").items.map(paraphraseCard) as PracticeCard[];
const reactions = read("learning/exercises/b1/high-yield/speaking-reaction-bank.json").items.map(reactionCard) as PracticeCard[];
const opinions = read("learning/exercises/b1/high-yield/opinion-argumentation-v1.json").items.map(opinionCard) as PracticeCard[];
const chunks = read("knowledge/dictionaries/b1/contextual-chunks-v1.json").items.map(chunkCard) as PracticeCard[];
const rektio = read("knowledge/dictionaries/b1/rektio-v1.json").items.map(rektioCard) as PracticeCard[];
const all = [...paraphrase, ...reactions, ...opinions, ...chunks, ...rektio];

describe("practice without a hint: existing content now playable (research #26 GL-02)", () => {
  it("every real item of the five banks becomes a valid, unpublished card with a unique id", () => {
    expect([paraphrase.length, reactions.length, opinions.length, chunks.length, rektio.length]).toEqual([24, 18, 18, 132, 40]);
    for (const c of all) expect(validatePracticeCard(c), c.id).toBe(true);
    expect(new Set(all.map(c => c.id)).size).toBe(all.length);
    expect(all.some(c => c.reviewStatus === "published")).toBe(false);
    expect(validatePracticeCard({ ...chunks[0]!, reviewStatus: "published" })).toBe(false);
  });
  it("refuses a card whose first screen already prints the expected Finnish answer", () => {
    const c = chunks[0]!;
    expect(validatePracticeCard({ ...c, prompt: [...c.prompt, { label_uk: "x", text: c.reveal[0]!.text, lang: "fi" }] })).toBe(false);
  });
  it("paraphrase: frozen choice → key only in reveal → recall without options → transfer; only the choice is scored", () => {
    const c = paraphrase[0]!, wrong = String(1 - c.choice!.correct_index);
    let s = startPractice(c);
    expect(practiceView(s, c)).toMatchObject({ key_fi: null, reveal: null, correct: null });
    expect(practiceView(s, c).options_fi).toEqual(c.choice!.options_fi);
    expect(() => practiceReducer(s, c, { type: "ANSWER", value: "7" })).toThrow(PracticeError);
    s = practiceReducer(s, c, { type: "ANSWER", value: wrong });
    expect(() => practiceReducer(s, c, { type: "ANSWER", value: String(c.choice!.correct_index) })).toThrow(PracticeError);
    expect(practiceView(s, c)).toMatchObject({ correct: false, key_fi: c.choice!.options_fi[c.choice!.correct_index], options_fi: null });
    s = practiceReducer(s, c, { type: "CONTINUE" });
    expect(practiceView(s, c)).toMatchObject({ phase: "recall", reveal: null, key_fi: null, options_fi: null, recall_uk: c.recall_uk });
    s = practiceReducer(practiceReducer(s, c, { type: "SUBMIT_RECALL", text: "Kauppa on auki eri aikaan." }), c, { type: "SUBMIT_TRANSFER", text: "Oma lause." });
    const ev = practiceEvidence(s, c);
    expect(ev.map(e => [e.taskId, e.status, "correct" in e ? e.correct : null])).toEqual([
      [c.id, "scored", false], [`${c.id}-recall`, "ungraded", null], [`${c.id}-transfer`, "ungraded", null]]);
    let st = blankState(); for (const e of ev) st = addDiagnostic(st, e);
    expect(st.diagnostics).toHaveLength(3);
  });
  it("free text kinds: model hidden until own answer, self-comparison required, transfer without model, never scored", () => {
    for (const c of [reactions[0]!, opinions[0]!, chunks[0]!, rektio[0]!]) {
      let s = startPractice(c);
      expect(practiceView(s, c)).toMatchObject({ reveal: null, options_fi: null });
      expect(() => practiceReducer(s, c, { type: "ANSWER", value: "  " })).toThrow(PracticeError);
      s = practiceReducer(s, c, { type: "ANSWER", value: "Minun vastaukseni" });
      expect(practiceView(s, c).reveal).toEqual(c.reveal);
      expect(() => practiceReducer(s, c, { type: "CONTINUE" })).toThrow(PracticeError);
      s = practiceReducer(practiceReducer(s, c, { type: "JUDGE", judgement: "partly" }), c, { type: "CONTINUE" });
      expect(practiceView(s, c)).toMatchObject({ phase: "transfer", reveal: null, prompt: [], transfer: c.transfer });
      s = practiceReducer(s, c, { type: "SUBMIT_TRANSFER", text: "Uusi tilanne." });
      const ev = practiceEvidence(s, c);
      expect(ev.every(e => e.status === "ungraded" && !("correct" in e))).toBe(true);
      expect(ev[0]!.response).toContain("self-compared partly");
      let st = blankState(); for (const e of ev) st = addDiagnostic(st, e);
      expect(st.diagnostics.some(d => "correct" in d)).toBe(false);
    }
  });
  it("evidence is unavailable before the card is finished", () => {
    expect(() => practiceEvidence(startPractice(chunks[1]!), chunks[1]!)).toThrow(PracticeError);
  });
  it("spaced retrieval: only a phrase the learner did NOT recall is scheduled; review 'same' climbs 1→3 days, a miss returns to day 1", () => {
    const run = (c: PracticeCard, j: "same" | "partly" | "different") => {
      let s = practiceReducer(startPractice(c), c, { type: "ANSWER", value: "vastaus" });
      s = practiceReducer(practiceReducer(s, c, { type: "JUDGE", judgement: j }), c, { type: "CONTINUE" });
      return practiceReducer(s, c, { type: "SUBMIT_TRANSFER", text: "Uusi lause." });
    };
    const c = chunks[0]!, day = (n: number) => new Date(2026, 10, 11 + n, 12);
    let st = completePractice(blankState(), run(c, "same"), c, day(0));
    expect(st.cards).toEqual({});                                             // right at first sight: never floods the SRS
    expect(st.diagnostics).toHaveLength(2);
    st = completePractice(st, run(rektio[0]!, "different"), rektio[0]!, day(0));
    st = completePractice(st, run(c, "partly"), c, day(0));
    expect(Object.keys(st.cards).sort()).toEqual([c.id, rektio[0]!.id].sort());
    expect(st.cards[c.id]).toMatchObject({ stage: 0, due: "2026-11-12", failures: 1, lastCorrect: false });
    expect(practiceDue(st, all, "2026-11-11")).toEqual([]);
    expect(practiceDue(st, all, "2026-11-20").map(x => x.id).sort()).toEqual([c.id, rektio[0]!.id].sort());   // late return is just due
    st = completePractice(st, run(c, "same"), c, day(1));
    expect(st.cards[c.id]).toMatchObject({ stage: 1, due: "2026-11-13" });
    st = completePractice(st, run(c, "same"), c, day(2));
    expect(st.cards[c.id]).toMatchObject({ stage: 2, due: "2026-11-16" });
    st = completePractice(st, run(c, "different"), c, day(5));
    expect(st.cards[c.id]).toMatchObject({ stage: 0, due: "2026-11-17", failures: 2 });
    expect(st.diagnostics.some(d => "correct" in d)).toBe(false);              // self-report schedules, never scores
  });
  it("paraphrase, reaction and opinion cards are never put on the SRS schedule", () => {
    const c = reactions[0]!;
    let s = practiceReducer(startPractice(c), c, { type: "ANSWER", value: "Kiitos." });
    s = practiceReducer(practiceReducer(practiceReducer(s, c, { type: "JUDGE", judgement: "different" }), c, { type: "CONTINUE" }), c, { type: "SUBMIT_TRANSFER", text: "x" });
    const st = completePractice(blankState(), s, c);
    expect(dueCards(st, "2099-01-01")).toEqual([]);
  });
});
