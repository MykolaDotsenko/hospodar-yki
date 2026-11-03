import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { addDiagnostic, blankState, evidenceSpans, learnReadingPool, readingEvidence, readingReducer, readingView, startReading, validateReadingItem,
  ReadingError, type ReadingEvent, type ReadingItem, type ReadingSession } from "../src/index.ts";

const root = new URL("../../../", import.meta.url);
const items: ReadingItem[] = JSON.parse(readFileSync(new URL("learning/exercises/b1/contextual/reading-pack-v1.json", root), "utf8")).items;
const blueprints = JSON.parse(readFileSync(new URL("learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json", root), "utf8")).blueprints;
const pool = learnReadingPool(items, blueprints);
const I = pool[0]!;
const run = (events: ReadingEvent[], s: ReadingSession = startReading(I)) => events.reduce((x, e) => readingReducer(x, I, e), s);
const answers = (): ReadingEvent[] => I.questions.map(q => ({ type: "ANSWER", questionId: q.id,
  value: q.type === "single_choice" ? String(q.correct_index) : q.type === "true_false" ? String(!q.answer) : "Lyhyt harjoitus." }));

describe("interactive reading: evidence span only after answering (IV-REQ-05, IV-AC-05)", () => {
  it("all 9 real texts are valid with exactly-once, non-overlapping evidence spans", () => {
    expect(items).toHaveLength(9);
    for (const i of items) { expect(validateReadingItem(i)).toBe(true); expect(evidenceSpans(i)).toHaveLength(i.questions.length); }
    expect(validateReadingItem({ ...I, questions: [{ ...I.questions[0]!, evidence_fi: "ei ole tekstissä" }] })).toBe(false);
  });
  it("EXAM-11: texts used by an EXAM blueprint never enter the LEARN pool", () => {
    const examIds = blueprints.flatMap((b: { skill_blocks: { skill: string; item_id: string }[] }) => b.skill_blocks.filter(x => x.skill === "reading").map(x => x.item_id));
    expect(examIds.length).toBeGreaterThan(0);
    expect(pool.some(i => examIds.includes(i.id))).toBe(false);
    expect(pool).toHaveLength(items.length - new Set(examIds).size);
  });
  it("while answering: no key, no model answer, no highlight; first answer frozen; invalid/empty refused", () => {
    const s = startReading(I);
    const v = readingView(s, I);
    expect([v.results, v.segments.length, v.segments[0]!.questionNumber]).toEqual([null, 1, null]);
    expect(JSON.stringify(v.question)).not.toMatch(/correct_index|model_answer|evidence/);
    expect(() => readingReducer(s, I, { type: "ANSWER", questionId: I.questions[0]!.id, value: " " })).toThrow(ReadingError);
    const a = readingReducer(s, I, answers()[0]!);
    expect(() => readingReducer(a, I, answers()[0]!)).toThrow(ReadingError);
  });
  it("feedback reveals keys and highlights exactly each evidence span with its question number", () => {
    const fb = run(answers());
    const v = readingView(fb, I);
    expect(v.segments.map(x => x.text).join("")).toBe(I.text_fi);
    const marked = v.segments.filter(x => x.questionNumber !== null);
    expect(marked.map(x => x.text).sort()).toEqual(I.questions.map(q => q.evidence_fi).sort());
    expect(v.results!.map(r => r.correct)).toEqual(I.questions.map(q => q.type === "open" ? null : q.type === "single_choice"));
  });
  it("transfer needs the open answer judged first, hides the text, and evidence is honest", () => {
    const fb = run(answers());
    expect(() => readingReducer(fb, I, { type: "TO_TRANSFER", kind: "writing" })).toThrow(/Compare/);
    const open = I.questions.find(q => q.type === "open")!;
    const tr = run([{ type: "JUDGE", questionId: open.id, judgement: "partly" }, { type: "TO_TRANSFER", kind: "speaking" }], fb);
    expect(readingView(tr, I)).toMatchObject({ showText: false, transfer_fi: I.speaking_transfer_fi });
    const done = readingReducer(tr, I, { type: "SUBMIT_TRANSFER", text: "Tuletko kanssani kielikahvilaan?" });
    const ev = readingEvidence(done, I);
    expect(ev.filter(e => e.status === "scored").map(e => [e.taskId, (e as { correct: boolean }).correct]))
      .toEqual(I.questions.filter(q => q.type !== "open").map(q => [q.id, q.type === "single_choice"]));
    expect(ev.find(e => e.taskId === open.id)).toMatchObject({ status: "ungraded", response: expect.stringContaining("self-judged partly") });
    expect(ev.at(-1)).toMatchObject({ skill: "speaking", status: "ungraded" });
    let st = blankState();
    for (const e of ev) st = addDiagnostic(st, e);
    expect(st.diagnostics).toHaveLength(I.questions.length + 1);
  });
});
