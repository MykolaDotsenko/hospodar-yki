import { describe, expect, it } from "vitest";
import { answerPlaceSegments, answerPlaces, type ListeningQuestion } from "../src/index.ts";

const T = "Hissi on poissa käytöstä. Kulku tapahtuu sisäpihan ovesta kello 12–14. Ilmoita viimeistään perjantaina.";
const q = (id: string, evidence_fi?: string): ListeningQuestion => ({ id, prompt_fi: "?", options_fi: ["a", "b"], correct_index: 0, ...(evidence_fi ? { evidence_fi } : {}) });

describe("evidence-guided-listening: where each answer is said, only for the review after the answers", () => {
  it("finds evidence said exactly once, maps the start of its sentence approximately onto the recording; missing or ambiguous evidence is no claim", () => {
    const ev = answerPlaces(T, [q("q1", "sisäpihan ovesta"), q("q2"), q("q3", "ei ole tekstissä"), q("q4", "a"), q("q5", "perjantaina")], 100);
    expect(ev.map(e => e.questionId)).toEqual(["q1", "q5"]);
    const s1 = T.indexOf("Kulku");
    expect(ev[0]).toMatchObject({ questionNumber: 1, start: T.indexOf("sisäpihan"), seekSeconds: Math.floor((100 * s1) / T.length) - 1 });
    expect(ev[1]!.questionNumber).toBe(5);
    expect(ev[1]!.seekSeconds).toBeGreaterThan(ev[0]!.seekSeconds);
    expect(answerPlaces(T, [q("q1", "Hissi")], 100)[0]!.seekSeconds).toBe(0);              // never before the start
    expect(answerPlaces("", [q("q1", "x")], 100)).toEqual([]);
    expect(answerPlaces(T, [q("q1", "Hissi")], 0)).toEqual([]);
  });
  it("cuts the transcript into plain and marked segments that rebuild it exactly", () => {
    const ev = answerPlaces(T, [q("q1", "sisäpihan ovesta"), q("q2", "sisäpihan")], 60);
    const seg = answerPlaceSegments(T, ev);
    expect(seg.map(s => s.text).join("")).toBe(T);
    expect(seg.filter(s => s.questionNumber !== null)).toEqual([{ text: "sisäpihan ovesta", questionNumber: 1 }]);   // overlap: earlier span kept
  });
});
