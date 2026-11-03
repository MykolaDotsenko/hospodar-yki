import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { addDiagnostic, blankState, diagnosticEvidence, diagnosticReducer, diagnosticSummary, diagnosticView, skillSummary,
  startDiagnostic, validateBaseline, DiagnosticError, type DiagnosticBaseline, type DiagnosticEvent, type DiagnosticSession } from "../src/index.ts";

const B: DiagnosticBaseline = JSON.parse(readFileSync(new URL("../../../learning/exercises/b1/diagnostics/baseline-v1.json", import.meta.url), "utf8"));
const step = (s: DiagnosticSession, e: DiagnosticEvent) => diagnosticReducer(s, B, e);
const run = (events: DiagnosticEvent[], s = startDiagnostic(B)) => events.reduce(step, s);
const readAll = (pick: (i: number) => number): DiagnosticEvent[] =>
  B.reading.questions.map((q, i) => ({ type: "ANSWER_READING", questionId: q.id, optionIndex: pick(i) }));
const W = "Hei! Haluaisin tietää lisää kurssista. Puhun suomea vähän.";

describe("starting diagnostic (UX-01, R04: productive skills ungraded)", () => {
  it("real baseline is valid and not official exam content", () => {
    expect(validateBaseline(B)).toBe(true);
    expect(validateBaseline({ ...B, is_official_exam_content: true })).toBe(false);
  });
  it("reading: no key or explanation before every answer is frozen; first answer cannot change", () => {
    const s = startDiagnostic(B);
    const v = diagnosticView(s, B);
    expect(v.reading).toBeNull();
    expect(JSON.stringify(v)).not.toContain("explanation_uk");
    expect(JSON.stringify(v.question)).not.toContain("correct_index");
    const s1 = step(s, { type: "ANSWER_READING", questionId: B.reading.questions[0]!.id, optionIndex: 0 });
    expect(() => step(s1, { type: "ANSWER_READING", questionId: B.reading.questions[0]!.id, optionIndex: 1 })).toThrow(DiagnosticError);
    const fb = run(readAll(i => B.reading.questions[i]!.correct_index), s);
    expect(diagnosticView(fb, B).reading!.every(r => r.isCorrect && r.explanation_uk)).toBe(true);
  });
  it("cannot move on before the step's evidence is persisted (fail closed)", () => {
    const fb = run(readAll(() => 0));
    expect(diagnosticView(fb, B).mustSave).toBe("reading");
    expect(() => step(fb, { type: "CONTINUE" })).toThrow(/Persist/);
    expect(step(step(fb, { type: "MARK_SAVED", skill: "reading" }), { type: "CONTINUE" }).step).toBe("writing");
  });
  it("writing needs ≥20 chars; is stored ungraded with self-check as self-report, never `correct`", () => {
    const w = run([...readAll(() => 0), { type: "MARK_SAVED", skill: "reading" }, { type: "CONTINUE" }]);
    expect(() => step(w, { type: "SUBMIT_WRITING", text: "Hei" })).toThrow(/20/);
    const c = run([{ type: "SUBMIT_WRITING", text: W }, { type: "SELF_CHECK", points: [0, 0, 2, 9] }], w);
    expect(c.writingChecked).toEqual([0, 2]);
    const [ev] = diagnosticEvidence(c, B, "writing");
    expect(ev).toEqual({ skill: "writing", taskId: "d-w1", status: "ungraded", response: `[self-check 2/3] ${W}` });
    expect("correct" in ev!).toBe(false);
    expect(() => addDiagnostic(blankState(), { ...ev!, status: "scored", correct: true } as never)).toThrow();
  });
  it("speaking accepts a text plan or a session-only voice flag; empty is refused; audio is never in evidence", () => {
    const sp = run([...readAll(() => 0), { type: "MARK_SAVED", skill: "reading" }, { type: "CONTINUE" },
      { type: "SUBMIT_WRITING", text: W }, { type: "MARK_SAVED", skill: "writing" }, { type: "CONTINUE" }]);
    expect(sp.step).toBe("speaking");
    expect(() => step(sp, { type: "SUBMIT_SPEAKING", text: "  ", voiceRecorded: false })).toThrow(DiagnosticError);
    const voiced = step(sp, { type: "SUBMIT_SPEAKING", text: "", voiceRecorded: true });
    expect(diagnosticEvidence(voiced, B, "speaking")[0]).toMatchObject({ status: "ungraded", response: "[self-check 0/4] Voice recorded this session (not retained)." });
  });
  it("summary: counts and next steps, no percentage or level; skillSummary keeps productive skills ungraded", () => {
    const s = run([...readAll(i => i === 0 ? B.reading.questions[0]!.correct_index : (B.reading.questions[i]!.correct_index + 1) % 3),
      { type: "MARK_SAVED", skill: "reading" }, { type: "CONTINUE" },
      { type: "SUBMIT_WRITING", text: W }, { type: "SELF_CHECK", points: [0, 1, 2] }, { type: "MARK_SAVED", skill: "writing" }, { type: "CONTINUE" },
      { type: "SUBMIT_SPEAKING", text: "Valitettavasti en pääse torstaina.", voiceRecorded: false }, { type: "SELF_CHECK", points: [0] },
      { type: "MARK_SAVED", skill: "speaking" }, { type: "CONTINUE" }]);
    const sum = diagnosticSummary(s, B);
    expect(sum.reading).toEqual({ correct: 1, total: 2, tooFewForConclusion: true });
    expect(sum.writingMissing_fi).toEqual([]);
    expect(sum.speakingMissing_fi).toHaveLength(3);
    expect(sum.next).toEqual(["reading_detail", "speaking_points", "listening_missions", "grammar_in_context"]);
    expect(JSON.stringify(sum)).not.toMatch(/%|B1|YKI|level|cefr/i);
    let st = blankState();
    for (const k of ["reading", "writing", "speaking"] as const) for (const ev of diagnosticEvidence(s, B, k)) st = addDiagnostic(st, ev);
    expect(skillSummary(st)).toMatchObject({ reading: { scored: 2, correct: 1 }, writing: { scored: 0, ungraded: 1 }, speaking: { scored: 0, ungraded: 1 } });
  });
});
