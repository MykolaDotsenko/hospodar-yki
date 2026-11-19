import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { chunkCard, opinionCard, paraphraseCard, practiceDraft, practiceReducer, restorePracticeDraft, startPractice, type PracticeCard } from "../src/index.ts";

const root = new URL("../../../", import.meta.url);
const read = (p: string) => JSON.parse(readFileSync(new URL(p, root), "utf8"));
const chunk = read("knowledge/dictionaries/b1/contextual-chunks-v1.json").items.map(chunkCard)[0] as PracticeCard;
const para = read("learning/exercises/b1/high-yield/paraphrase-drills.json").items.map(paraphraseCard)[0] as PracticeCard;
const opinion = read("learning/exercises/b1/high-yield/opinion-argumentation-v1.json").items.map(opinionCard)[0] as PracticeCard;
const T = new Date("2026-11-19T10:00:00Z");
const roundTrip = (d: unknown) => JSON.parse(JSON.stringify(d));

describe("pause and resume a practice card (COG-11; first answer frozen)", () => {
  it("keeps the typed text and every later step; a reload restores the same step and the frozen first answer", () => {
    let s = startPractice(chunk);
    expect(practiceDraft(s, "", T)).toBeNull();                                               // nothing typed yet: nothing to keep
    expect(restorePracticeDraft(roundTrip(practiceDraft(s, "tehdä rekl", T)), chunk)).toMatchObject({ value: "tehdä rekl", session: { phase: "attempt", first: "" } });
    s = practiceReducer(s, chunk, { type: "ANSWER", value: "tehdä valitus" });
    const back = restorePracticeDraft(roundTrip(practiceDraft(s, "", T)), chunk)!;
    expect(back.session).toMatchObject({ phase: "reveal", first: "tehdä valitus" });            // the model is shown again, the answer stays
    expect(() => practiceReducer(back.session, chunk, { type: "ANSWER", value: "toinen" })).toThrow(/not allowed/);
    s = practiceReducer(practiceReducer(s, chunk, { type: "JUDGE", judgement: "partly" }), chunk, { type: "CONTINUE" });
    expect(restorePracticeDraft(roundTrip(practiceDraft(s, "Tein reklamaation.", T)), chunk)).toMatchObject({ session: { phase: "transfer", judged: "partly" }, value: "Tein reklamaation." });
  });
  it("never keeps an own plan, a finished card or a damaged/foreign record", () => {
    let o = practiceReducer(startPractice(opinion), opinion, { type: "START_PLAN" });
    expect(practiceDraft(o, "", T)).toBeNull();                                               // planning: session only
    o = practiceReducer(o, opinion, { type: "SUBMIT_PLAN", text: "pääajatus" });
    expect(practiceDraft(o, "Minusta…", T)).toBeNull();                                        // an own plan is never stored
    const noPlan = practiceReducer(practiceReducer(startPractice(opinion), opinion, { type: "START_PLAN" }), opinion, { type: "SUBMIT_PLAN", text: "" });
    expect(practiceDraft(noPlan, "Minusta…", T)).not.toBeNull();                              // "without a plan" is fine
    const good = roundTrip(practiceDraft(practiceReducer(startPractice(chunk), chunk, { type: "ANSWER", value: "x y" }), "", T));
    expect(restorePracticeDraft(good, para)).toBeNull();                                      // another card
    expect(restorePracticeDraft({ ...good, session: { ...good.session, first: "" } }, chunk)).toBeNull();     // a later step without a first answer
    expect(restorePracticeDraft({ ...good, session: { ...good.session, phase: "done" } }, chunk)).toBeNull();
    expect(restorePracticeDraft({ ...good, session: { ...good.session, plan: "x" } }, chunk)).toBeNull();
    expect(restorePracticeDraft({ ...good, session: { ...good.session, judged: "maybe" } }, chunk)).toBeNull();
    expect(restorePracticeDraft({ ...good, value: "x".repeat(5000) }, chunk)).toBeNull();
    expect(restorePracticeDraft("nonsense", chunk)).toBeNull();
    const choice = roundTrip(practiceDraft(practiceReducer(startPractice(para), para, { type: "ANSWER", value: "1" }), "", T));
    expect(restorePracticeDraft(choice, para)?.session.phase).toBe("reveal");
    expect(restorePracticeDraft({ ...choice, session: { ...choice.session, first: "9" } }, para)).toBeNull();   // an option that does not exist
  });
});
