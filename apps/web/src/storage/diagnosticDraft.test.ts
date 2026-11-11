import { describe, expect, it } from "vitest";
import { diagnosticReducer, startDiagnostic } from "@hospodar/domain";
import { baseline as b } from "../content/diagnostic.ts";
import { diagnosticFingerprint, diagnosticPayload, validDiagnosticDraft } from "./diagnosticDraft.ts";

const written = "Hei! Haluan harjoitella suomea. Milloin kurssi alkaa?";
const spoken = "Valitettavasti en pääse tänään. Sopiiko huominen?";
const first = () => startDiagnostic(b);
const feedback = () => b.reading.questions.reduce((s, q) =>
  diagnosticReducer(s, b, { type: "ANSWER_READING", questionId: q.id, optionIndex: 0 }), first());
const writing = () => diagnosticReducer(diagnosticReducer(feedback(), b, { type: "MARK_SAVED", skill: "reading" }), b, { type: "CONTINUE" });
const writingCheck = () => diagnosticReducer(writing(), b, { type: "SUBMIT_WRITING", text: written });
const speaking = () => diagnosticReducer(diagnosticReducer(writingCheck(), b, { type: "MARK_SAVED", skill: "writing" }), b, { type: "CONTINUE" });
const speakingCheck = () => diagnosticReducer(speaking(), b, { type: "SUBMIT_SPEAKING", text: spoken, voiceRecorded: false });

describe("Diagnostic checkpoint replay and privacy", () => {
  it("accepts every legitimate phase and independent typed selections without leaking keys", () => {
    let s = first();
    expect(validDiagnosticDraft(diagnosticPayload(s, "", null, b), b)).toBe(true);
    expect(validDiagnosticDraft(diagnosticPayload(s, "", 0, b), b)).toBe(true);
    s = diagnosticReducer(s, b, { type: "ANSWER_READING", questionId: b.reading.questions[0]!.id, optionIndex: 0 });
    expect(validDiagnosticDraft(diagnosticPayload(s, "", 0, b), b)).toBe(true);
    for (const phase of [
      diagnosticPayload(feedback(), "", null, b),
      diagnosticPayload(writing(), written, null, b),
      diagnosticPayload(writingCheck(), "", null, b),
      diagnosticPayload(speaking(), spoken, null, b),
      diagnosticPayload(speakingCheck(), "", null, b),
    ]) expect(validDiagnosticDraft(phase, b)).toBe(true);
  });
  it("rejects impossible reading feedback, forged saved skills, malformed self-check, extra data and stale baseline", () => {
    const s = first(), p = diagnosticPayload(s, "", null, b);
    for (const fake of [
      { ...p, session: { ...s, step: "reading_feedback" } },
      { ...p, session: { ...s, saved: ["reading"] } },
      { ...p, session: { ...s, readingIndex: 1 } },
      { ...p, session: { ...s, readingAnswers: { other: 1 } } },
      { ...p, session: { ...s, speaking: { text: "", voiceRecorded: true } } },
      { ...p, input: "text on reading" },
      { ...p, pick: 100000 },
      { ...p, contentFingerprint: "stale" },
      { ...p, input: "x".repeat(1601) },
      { ...p, another: "secret" },
      { ...diagnosticPayload(writingCheck(), "", null, b), session: { ...writingCheck(), writingChecked: [10000] } },
    ]) expect(validDiagnosticDraft(fake, b)).toBe(false);
    expect(diagnosticFingerprint({ ...b, reading: { ...b.reading, text_fi: b.reading.text_fi + "!" } })).not.toBe(diagnosticFingerprint(b));
  });
  it("does not persist voice-only recording flags or recreate a completed summary as an unfinished draft", () => {
    const voice = diagnosticReducer(speaking(), b, { type: "SUBMIT_SPEAKING", text: "", voiceRecorded: true });
    expect(validDiagnosticDraft(diagnosticPayload(voice, "", null, b), b)).toBe(false);
    const saved = diagnosticReducer(diagnosticReducer(speakingCheck(), b, { type: "MARK_SAVED", skill: "speaking" }), b, { type: "CONTINUE" });
    expect(validDiagnosticDraft(diagnosticPayload(saved, "", null, b), b)).toBe(false);
  });
});
