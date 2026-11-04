import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { addDiagnostic, blankState, listeningEvidence, listeningReducer, listeningView, startListening, validateListeningLesson,
  ListeningError, type ListeningLesson } from "../src/index.ts";

const lessons: ListeningLesson[] = JSON.parse(readFileSync(new URL("../../../learning/exercises/b1/audio-long/lessons.json", import.meta.url), "utf8")).lessons;
const L = lessons[0]!;
const run = (events: Parameters<typeof listeningReducer>[2][]) => events.reduce((s, e) => listeningReducer(s, L, e), startListening(L));
const answerAll = (pick: (i: number) => number) => L.questions.map((q, i) => ({ type: "ANSWER" as const, questionId: q.id, optionIndex: pick(i) }));

describe("listening mission (IV-REQ-04)", () => {
  it("all 6 real lessons are valid and synthetic single-voice", () => {
    expect(lessons).toHaveLength(6);
    for (const l of lessons) { expect(validateListeningLesson(l)).toBe(true); expect(listeningView(startListening(l), l).synthetic).toBe(true); }
  });
  it("questions require starting the audio first; no transcript or key before answering", () => {
    const s = run([{ type: "SKIP_PREDICTION" }]);
    expect(() => listeningReducer(s, L, { type: "BEGIN_QUESTIONS" })).toThrow(ListeningError);
    const q = run([{ type: "SKIP_PREDICTION" }, { type: "AUDIO_STARTED" }, { type: "BEGIN_QUESTIONS" }]);
    const v = listeningView(q, L);
    expect(v.question!.kind).toBe("gist");
    expect([v.showTranscript, v.allowSubtitles, v.results]).toEqual([false, false, null]);
    expect(JSON.stringify(v)).not.toContain("why_uk");
  });
  it("independent run is scored per question; keys/why appear only in feedback; transcript only in review", () => {
    const s = run([{ type: "SUBMIT_PREDICTION", text: "Vesi" }, { type: "AUDIO_STARTED" }, { type: "BEGIN_QUESTIONS" },
      ...answerAll(i => L.questions[i]!.correct_index === 0 && i === 0 ? 0 : (L.questions[i]!.correct_index + 1) % L.questions[i]!.options_fi.length)]);
    const fb = listeningView(s, L);
    expect(fb.phase).toBe("feedback");
    expect(fb.results![0]).toMatchObject({ isCorrect: true, key_fi: L.questions[0]!.options_fi[0] });
    expect(fb.showTranscript).toBe(false);
    const review = listeningReducer(s, L, { type: "OPEN_REVIEW" });
    expect(listeningView(review, L)).toMatchObject({ showTranscript: true, allowSubtitles: true });
    const ev = listeningEvidence(listeningReducer(review, L, { type: "FINISH" }), L);
    expect(ev.every(x => x.status === "scored")).toBe(true);
    expect(ev.filter(x => x.status === "scored" && x.correct)).toHaveLength(1);
    let st = blankState(); for (const e of ev) st = addDiagnostic(st, e);
    expect(st.diagnostics).toHaveLength(L.questions.length);
  });
  it("transcript or slow-speed support before answering → recorded ungraded, never scored", () => {
    const s = run([{ type: "SKIP_PREDICTION" }, { type: "REQUEST_SUPPORT", kind: "transcript" }, { type: "BEGIN_QUESTIONS" }]);
    expect(listeningView(s, L)).toMatchObject({ showTranscript: true, independent: false });
    const done = [...answerAll(i => L.questions[i]!.correct_index), { type: "FINISH" as const }].reduce((x, e) => listeningReducer(x, L, e), s);
    expect(listeningEvidence(done, L).every(x => x.status === "ungraded")).toBe(true);
  });
  it("first answers are frozen; out-of-order or invalid events are refused", () => {
    const s = run([{ type: "SKIP_PREDICTION" }, { type: "AUDIO_STARTED" }, { type: "BEGIN_QUESTIONS" }, answerAll(() => 1)[0]!]);
    expect(() => listeningReducer(s, L, { type: "ANSWER", questionId: L.questions[0]!.id, optionIndex: 0 })).toThrow(/not allowed/);
    expect(() => listeningReducer(s, L, { type: "ANSWER", questionId: L.questions[1]!.id, optionIndex: 9 })).toThrow(ListeningError);
    expect(() => listeningReducer(s, L, { type: "OPEN_REVIEW" })).toThrow(/not allowed/);
    expect(() => listeningEvidence(s, L)).toThrow();
  });
});
