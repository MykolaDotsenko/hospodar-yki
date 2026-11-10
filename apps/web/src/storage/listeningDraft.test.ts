import { describe, expect, it } from "vitest";
import { listeningReducer, startListening, type ListeningSession } from "@hospodar/domain";
import { listeningLessons } from "../content/listening.ts";
import { listeningFingerprint, listeningPayload, validListeningDraft } from "./listeningDraft.ts";

const lesson = listeningLessons[0]!;
const prediction = "Luulen, että puhutaan vesikatkosta.";
const start = () => startListening(lesson);
const audio = () => listeningReducer(listeningReducer(start(), lesson,
  { type: "SUBMIT_PREDICTION", text: prediction }), lesson, { type: "AUDIO_STARTED" });
function answerAll(s: ListeningSession = audio()) {
  if (s.phase === "listen") s = listeningReducer(s, lesson, { type: "BEGIN_QUESTIONS" });
  for (const q of lesson.questions) s = listeningReducer(s, lesson, { type: "ANSWER", questionId: q.id, optionIndex: q.correct_index });
  return s;
}
describe("LEARN Listening support-aware checkpoint reducer replay", () => {
  it("accepts editable prediction, real audio start, frozen answers and later transcript review", () => {
    expect(validListeningDraft(listeningPayload(start(), prediction, lesson), lesson)).toBe(true);
    let s = audio();
    expect(validListeningDraft(listeningPayload(s, "", lesson), lesson)).toBe(true);
    s = listeningReducer(s, lesson, { type: "BEGIN_QUESTIONS" });
    expect(validListeningDraft(listeningPayload(s, "0", lesson), lesson)).toBe(true);
    s = listeningReducer(s, lesson, { type: "ANSWER", questionId: lesson.questions[0]!.id, optionIndex: 0 });
    expect(validListeningDraft(listeningPayload(s, "", lesson), lesson)).toBe(true);
    const feedback = answerAll();
    expect(validListeningDraft(listeningPayload(feedback, "", lesson), lesson)).toBe(true);
    const review = listeningReducer(feedback, lesson, { type: "OPEN_REVIEW" });
    expect(validListeningDraft(listeningPayload(review, "", lesson), lesson)).toBe(true);
    const done = listeningReducer(review, lesson, { type: "FINISH" });
    expect(validListeningDraft(listeningPayload(done, "", lesson), lesson)).toBe(false);
  });
  it("persists supported, ungraded listening attribution and prevents forging independent work", () => {
    let supported = listeningReducer(start(), lesson, { type: "SKIP_PREDICTION" });
    supported = listeningReducer(supported, lesson, { type: "REQUEST_SUPPORT", kind: "slow" });
    supported = listeningReducer(supported, lesson, { type: "REQUEST_SUPPORT", kind: "transcript" });
    supported = listeningReducer(supported, lesson, { type: "BEGIN_QUESTIONS" });
    for (const q of lesson.questions)
      supported = listeningReducer(supported, lesson, { type: "ANSWER", questionId: q.id, optionIndex: 0 });
    expect(validListeningDraft(listeningPayload(supported, "", lesson), lesson)).toBe(true);
    expect(validListeningDraft({ ...listeningPayload(supported, "", lesson), session: { ...supported, support: [] } }, lesson)).toBe(false);
    expect(validListeningDraft({ ...listeningPayload(supported, "", lesson), session: { ...supported, audioStarts: -1 } }, lesson)).toBe(false);
  });
  it("refuses forged feedback, question skips, oversized answers, foreign or changed content", () => {
    const s = start(), p = listeningPayload(s, "", lesson);
    expect(validListeningDraft({ ...p, session: { ...s, phase: "feedback" } }, lesson)).toBe(false);
    expect(validListeningDraft({ ...p, session: { ...s, phase: "questions", index: lesson.questions.length } }, lesson)).toBe(false);
    expect(validListeningDraft({ ...p, session: { ...s, support: ["transcript"] } }, lesson)).toBe(false);
    expect(validListeningDraft({ ...p, session: { ...s, answers: { forged: 1 } } }, lesson)).toBe(false);
    expect(validListeningDraft({ ...p, session: { ...s, secret: true } }, lesson)).toBe(false);
    expect(validListeningDraft({ ...p, input: "x".repeat(401) }, lesson)).toBe(false);
    expect(validListeningDraft({ ...p, contentFingerprint: "old" }, lesson)).toBe(false);
    expect(validListeningDraft({ ...p, surprise: "x" }, lesson)).toBe(false);
    expect(listeningFingerprint({ ...lesson, questions: lesson.questions.map((q, i) =>
      i === 0 ? { ...q, correct_index: (q.correct_index + 1) % q.options_fi.length } : q) })).not.toBe(listeningFingerprint(lesson));
  });
  it("cannot restore invalid selected answers or skip audio without transcript support", () => {
    const s = listeningReducer(audio(), lesson, { type: "BEGIN_QUESTIONS" });
    expect(validListeningDraft(listeningPayload(s, "999", lesson), lesson)).toBe(false);
    expect(validListeningDraft(listeningPayload(s, "-1", lesson), lesson)).toBe(false);
    expect(validListeningDraft(listeningPayload(s, "1.1", lesson), lesson)).toBe(false);
    expect(validListeningDraft({ ...listeningPayload(s, "", lesson), session: { ...s, audioStarts: 0 } }, lesson)).toBe(false);
  });
});
