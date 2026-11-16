import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CRITICAL_PARAMETERS, ENGINE_APPLIES, PRACTICE_RULES, createSession, isValidParameterValue, loadSession, playsUsed, recordPlay,
  resolveExamRules, ruleValueUk, validateExamProfile, validPracticeChoices,
  type ExamParameterRecord, type ExamProfile, type ExamProfileFile } from "../src/index.ts";

const file: ExamProfileFile = JSON.parse(readFileSync(new URL("../../../learning/exercises/b1/exam-patterns/exam-profiles-v1.json", import.meta.url), "utf8"));
const byKind = (k: ExamProfile["kind"]) => structuredClone(file.profiles.find(p => p.kind === k)!);
const seen = (parameter: string, value: ExamParameterRecord["value"]): ExamParameterRecord => ({ parameter, value,
  source_url: "https://www.oph.fi/fi/koulutus-ja-tutkinnot/ennen-yki-testia", observed_on: "2026-11-10", applies_to: "oph_digital_demo",
  confidence: "high", reviewed_by: "tester A", e2e_test: null });
const withRecords = (p: ExamProfile, ...rs: ExamParameterRecord[]) => ({ ...p, records: p.records.map(x => rs.find(r => r.parameter === x.parameter) ?? x) });

describe("exam rules from the pinned profile (docs/29 stage 4; TZ-EXAM-07/08/12/17, EXAM-06, YKI-FID-01)", () => {
  it("exam rules today: every profile runs on practice rules for all 18 parameters, each one labelled practice", () => {
    for (const p of file.profiles) {
      const r = resolveExamRules(p);
      expect(r.rules.map(x => x.parameter)).toEqual(CRITICAL_PARAMETERS.map(c => c.id));
      expect(r).toMatchObject({ verified: 0, practice: CRITICAL_PARAMETERS.length, notApplied: 0,
        backAllowed: true, spellcheck: false, pasteAllowed: true, counter: "none" });
      expect(r.rules.every(x => x.status === "practice" && x.applied && x.observed_on === null)).toBe(true);
    }
    expect(resolveExamRules(null).practice).toBe(CRITICAL_PARAMETERS.length);
    // the practice table describes every parameter, with a value of the right type (or no fixed time)
    for (const c of CRITICAL_PARAMETERS) {
      expect(c.id in PRACTICE_RULES).toBe(true);
      const v = PRACTICE_RULES[c.id]!;
      expect(v === null ? c.id.startsWith("timing.") && c.id.endsWith("_minutes") : isValidParameterValue(c.id, v)).toBe(true);
    }
  });

  it("exam rules: a verified observation the engine reproduces replaces the practice rule and keeps its date", () => {
    const p = withRecords(byKind("OPH_DEMO_OBSERVED"), seen("navigation.back_allowed", false), seen("writing.counter", "words"), seen("writing.paste_allowed", false));
    expect(validateExamProfile(p)).toEqual([]);
    const r = resolveExamRules(p);
    expect(r).toMatchObject({ verified: 3, notApplied: 0, backAllowed: false, counter: "words", pasteAllowed: false, spellcheck: false });
    expect(r.rules.find(x => x.parameter === "navigation.back_allowed")).toMatchObject({ status: "verified", applied: true, observed_on: "2026-11-10" });
  });

  it("exam rules: a verified rule the engine does not reproduce yet is said so, and the attempt keeps the practice behaviour", () => {
    const p = withRecords(byKind("OPH_DEMO_OBSERVED"), seen("timing.reading_minutes", 60));
    expect(ENGINE_APPLIES.has("timing.reading_minutes")).toBe(false);
    const r = resolveExamRules(p);
    expect(r.rules.find(x => x.parameter === "timing.reading_minutes")).toMatchObject({ status: "verified", applied: false, value: 60 });
    expect(r).toMatchObject({ verified: 1, notApplied: 1 });
  });

  it("exam rules: a value of the wrong type is refused by the profile check and never applied; practice profiles never claim", () => {
    const bad = withRecords(byKind("OPH_DEMO_OBSERVED"), seen("navigation.back_allowed", "maybe"), seen("timing.reading_minutes", -5));
    expect(validateExamProfile(bad)).toEqual(expect.arrayContaining(["INVALID_VALUE:navigation.back_allowed", "INVALID_VALUE:timing.reading_minutes"]));
    expect(resolveExamRules(bad)).toMatchObject({ verified: 0, backAllowed: true });
    const practice = withRecords(byKind("PRACTICE"), seen("navigation.back_allowed", false));
    expect(resolveExamRules(practice)).toMatchObject({ verified: 0, backAllowed: true });                        // no source of truth
    const live = withRecords(byKind("LIVE_2027_VERIFIED"), { ...seen("navigation.back_allowed", false), applies_to: "live_2027" });
    expect(resolveExamRules(live).verified).toBe(0);                                                             // live needs an E2E test too
  });

  it("exam rules: values are written for the learner in plain Ukrainian, unknown time is said honestly", () => {
    const r = resolveExamRules(null).rules;
    const text = (id: string) => ruleValueUk(r.find(x => x.parameter === id)!);
    expect(text("timing.reading_minutes")).toMatch(/окремого часу немає/);
    expect(text("listening.plays_allowed")).toBe("без обмеження");
    expect(text("navigation.back_allowed")).toBe("так");
    expect(text("structure.subtest_order")).toBe("читання → аудіювання → письмо → говоріння");
    expect(text("speaking.prep_seconds")).toBe("30 с");
    expect(ruleValueUk({ parameter: "timing.reading_minutes", value: 60 })).toBe("60 хв");
  });

  it("practice choices: the learner may set plays, going back and a review screen for a practice attempt; a verified rule wins", () => {
    const choices = { plays: 2 as const, backAllowed: false, reviewScreen: true };
    const r = resolveExamRules(byKind("PRACTICE"), choices);
    expect(r).toMatchObject({ playsAllowed: 2, backAllowed: false, reviewScreen: true, pauseSeek: true, verified: 0 });
    expect(r.rules.find(x => x.parameter === "listening.plays_allowed")).toMatchObject({ status: "practice", chosen: true, value: 2 });
    expect(r.rules.find(x => x.parameter === "writing.counter")!.chosen).toBeUndefined();
    const demo = withRecords(byKind("OPH_DEMO_OBSERVED"), seen("navigation.back_allowed", true));
    expect(resolveExamRules(demo, choices)).toMatchObject({ backAllowed: true, playsAllowed: 2 });           // observed value wins
    expect(validPracticeChoices(choices)).toBe(true);
    for (const bad of [{ ...choices, plays: 3 }, { ...choices, extra: 1 }, { plays: "unlimited", backAllowed: "yes", reviewScreen: true }, null])
      expect(validPracticeChoices(bad)).toBe(false);
  });

  it("listening plays: counted per recording, refused when used up, kept across a reload; a damaged count fails closed", () => {
    const T = new Date("2026-11-16T10:00:00Z");
    let s = createSession("yki-mini-arki", 0, T, "sess-p", null, { plays: 2, backAllowed: true, reviewScreen: false });
    s = recordPlay(recordPlay(s, "lesson-a", 2, T), "lesson-a", 2, T);
    expect(playsUsed(s, "lesson-a")).toBe(2);
    expect(() => recordPlay(s, "lesson-a", 2, T)).toThrow(/No plays left/);
    expect(playsUsed(recordPlay(s, "lesson-b", 2, T), "lesson-b")).toBe(1);                                  // per recording
    expect(playsUsed(recordPlay(s, "lesson-a", "unlimited", T), "lesson-a")).toBe(3);
    const back = loadSession(JSON.stringify(s), ["yki-mini-arki"]).session!;
    expect(back.plays).toEqual({ "lesson-a": 2 });
    expect(back.practiceChoices).toEqual({ plays: 2, backAllowed: true, reviewScreen: false });
    const damaged = loadSession(JSON.stringify({ ...s, plays: { "lesson-a": -4, "bad id!": 1 }, practiceChoices: { plays: 9 } }), ["yki-mini-arki"]).session!;
    expect(damaged.plays).toEqual({ "lesson-a": 99 });                                                       // no plays given back
    expect(damaged.practiceChoices).toBeUndefined();
    const legacy = loadSession(JSON.stringify(createSession("yki-mini-arki", 0, T, "sess-q")), ["yki-mini-arki"]).session!;
    expect("plays" in legacy || "practiceChoices" in legacy).toBe(false);                                   // old states unchanged
  });
});
