import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CRITICAL_PARAMETERS, ENGINE_APPLIES, PRACTICE_RULES, isValidParameterValue, resolveExamRules, ruleValueUk, validateExamProfile,
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
    const p = withRecords(byKind("OPH_DEMO_OBSERVED"), seen("listening.plays_allowed", 2));
    expect(ENGINE_APPLIES.has("listening.plays_allowed")).toBe(false);
    const r = resolveExamRules(p);
    expect(r.rules.find(x => x.parameter === "listening.plays_allowed")).toMatchObject({ status: "verified", applied: false, value: 2 });
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
});
