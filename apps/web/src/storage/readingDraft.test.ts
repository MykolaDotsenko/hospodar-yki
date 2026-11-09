import { describe, expect, it } from "vitest";
import { readingReducer, startReading, type ReadingItem, type ReadingSession } from "@hospodar/domain";
import { readingItems } from "../content/reading.ts";
import { readingFingerprint, readingPayload, validReadingDraft } from "./readingDraft.ts";

const item = readingItems[0]!;
const shortText = "Tulen tapaamiseen ensi viikolla. Haluan harjoitella puhumista suomeksi.";
function answerAll(i: ReadingItem): ReadingSession {
  let state = startReading(i);
  for (const q of i.questions) {
    const value = q.type === "single_choice" ? String(q.correct_index) : q.type === "true_false" ? "true" : shortText;
    state = readingReducer(state, i, { type: "ANSWER", questionId: q.id, value });
  }
  return state;
}
function transfer(): ReadingSession {
  let s = answerAll(item);
  for (const q of item.questions) if (q.type === "open")
    s = readingReducer(s, item, { type: "JUDGE", questionId: q.id, judgement: "partly" });
  return readingReducer(s, item, { type: "TO_TRANSFER", kind: "writing" });
}
describe("LEARN Reading checkpoint replay / safe reveal", () => {
  it("accepts unfinished first choice, open answer, feedback judgement and independent transfer", () => {
    const fresh = startReading(item);
    expect(validReadingDraft(readingPayload(fresh, "1", item), item)).toBe(true);
    let s = readingReducer(fresh, item, { type: "ANSWER", questionId: item.questions[0]!.id, value: "0" });
    expect(validReadingDraft(readingPayload(s, "", item), item)).toBe(true);
    expect(validReadingDraft(readingPayload(answerAll(item), "", item), item)).toBe(true);
    const t = transfer();
    expect(validReadingDraft(readingPayload(t, shortText, item), item)).toBe(true);
    expect(validReadingDraft(readingPayload(t, "", item), item)).toBe(true);
    expect(validReadingDraft(readingPayload(readingReducer(t, item, { type: "SUBMIT_TRANSFER", text: shortText }), "", item), item)).toBe(false);
  });
  it("refuses forged feedback, skipped questions, forged judgement and answer-key changes", () => {
    const s = startReading(item);
    const p = readingPayload(s, "", item);
    expect(validReadingDraft({ ...p, session: { ...s, phase: "feedback" } }, item)).toBe(false);
    expect(validReadingDraft({ ...p, session: { ...s, index: item.questions.length } }, item)).toBe(false);
    expect(validReadingDraft({ ...p, session: { ...s, judged: { [item.questions[0]!.id]: "same" } } }, item)).toBe(false);
    expect(validReadingDraft({ ...p, session: { ...s, answers: { fake: "0" } } }, item)).toBe(false);
    expect(validReadingDraft({ ...p, input: "x".repeat(1601) }, item)).toBe(false);
    expect(validReadingDraft({ ...p, contentFingerprint: "outdated" }, item)).toBe(false);
    expect(validReadingDraft({ ...p, session: { ...s, secret: "answer" } }, item)).toBe(false);
    expect(validReadingDraft({ ...p, extra: true }, item)).toBe(false);
    expect(readingFingerprint({ ...item, text_fi: item.text_fi + " päivitetty" })).not.toBe(readingFingerprint(item));
    expect(readingFingerprint({ ...item, questions: item.questions.map((q, n) =>
      n === 0 ? { ...q, evidence_fi: q.evidence_fi + "!" } : q) })).not.toBe(readingFingerprint(item));
  });
  it("feedback is reachable only with every frozen answer; transfer only after open-answer judgement", () => {
    const f = answerAll(item);
    expect(validReadingDraft(readingPayload(f, "", item), item)).toBe(true);
    expect(validReadingDraft(readingPayload(f, "forged draft", item), item)).toBe(false);
    const t = transfer();
    expect(validReadingDraft(readingPayload(t, "Oma uusi vastaus.", item), item)).toBe(true);
    expect(validReadingDraft({ ...readingPayload(t, "", item), session: { ...t, judged: {} } }, item)).toBe(false);
    expect(validReadingDraft({ ...readingPayload(t, "", item), session: { ...t, answers: {} } }, item)).toBe(false);
  });
});
