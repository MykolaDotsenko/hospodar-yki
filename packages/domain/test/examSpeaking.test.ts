import { describe, expect, it } from "vitest";
import { PRACTICE_SPEAKING_WINDOWS, speakingPhase, speakingWindows, type ExamProfile } from "../src/index.ts";

const record = (parameter: string, value: number, verified: boolean) => ({
  parameter, value, source_url: verified ? "https://www.oph.fi/fi/example" : null, observed_on: verified ? "2026-11-01" : null,
  applies_to: "oph_digital_demo" as const, confidence: verified ? "high" as const : null, reviewed_by: verified ? "reviewer" : null, e2e_test: null,
});
const demo = (verified: boolean): ExamProfile => ({ id: "oph-demo-observed", kind: "OPH_DEMO_OBSERVED", version: "1", title_uk: "", title_fi: "", last_checked: "2026-11-01",
  records: [record("speaking.prep_seconds", 45, verified), record("speaking.response_seconds", 90, verified)] });

describe("speaking as in the exam: preparation → signal → recording → response window (TZ-EXAM-11, MOCK-VID-07)", () => {
  it("without verified profile values the windows are the labelled practice ones — never invented OPH figures", () => {
    expect(speakingWindows(null)).toEqual({ ...PRACTICE_SPEAKING_WINDOWS, source: "practice" });
    expect(speakingWindows(demo(false))).toMatchObject({ source: "practice" });                   // unsourced values are ignored
  });
  it("a profile whose prep/response records are verified drives the windows", () => {
    expect(speakingWindows(demo(true))).toEqual({ prepSeconds: 45, responseSeconds: 90, source: "profile" });
  });
  it("phases follow the clock: preparation, then response, then over; seconds count down", () => {
    const w = { prepSeconds: 30, responseSeconds: 60 };
    expect(speakingPhase(w, 0, 0)).toEqual({ phase: "prep", secondsLeft: 30 });
    expect(speakingPhase(w, 0, 29_200)).toEqual({ phase: "prep", secondsLeft: 1 });
    expect(speakingPhase(w, 0, 30_000)).toEqual({ phase: "respond", secondsLeft: 60 });
    expect(speakingPhase(w, 0, 89_500)).toEqual({ phase: "respond", secondsLeft: 1 });
    expect(speakingPhase(w, 0, 90_000)).toEqual({ phase: "over", secondsLeft: 0 });
    expect(speakingPhase(w, 1_000, 0)).toEqual({ phase: "prep", secondsLeft: 30 });              // clock skew never goes negative
  });
});
