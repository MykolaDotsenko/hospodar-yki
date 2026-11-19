import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CRITICAL_PARAMETERS, ENGINE_APPLIES, PRACTICE_RULES, createSession, endsPart, expirePart, isPartTimeUp, partRemainingSeconds, startPartClock, withPartHighWater, isPartClosed, isValidParameterValue, loadSession, navigateTo, PartClosedError, playsUsed, recordPlay,
  resolveExamRules, ruleValueUk, validateExamProfile, validPracticeChoices,
  type ExamParameterRecord, type ExamProfile, type ExamProfileFile } from "../src/index.ts";

const file: ExamProfileFile = JSON.parse(readFileSync(new URL("../../../learning/exercises/b1/exam-patterns/exam-profiles-v1.json", import.meta.url), "utf8"));
const byKind = (k: ExamProfile["kind"]) => structuredClone(file.profiles.find(p => p.kind === k)!);
const seen = (parameter: string, value: ExamParameterRecord["value"]): ExamParameterRecord => ({ parameter, value,
  source_url: "https://www.oph.fi/fi/koulutus-ja-tutkinnot/ennen-yki-testia", observed_on: "2026-11-10", applies_to: "oph_digital_demo",
  confidence: "high", reviewed_by: "tester A", e2e_test: null });
const withRecords = (p: ExamProfile, ...rs: ExamParameterRecord[]) => ({ ...p, records: p.records.map(x => rs.find(r => r.parameter === x.parameter) ?? x) });

describe("exam rules from the pinned profile (docs/29 stage 4; TZ-EXAM-07/08/12/17, EXAM-06, YKI-FID-01)", () => {
  it("exam rules today: every profile runs on practice rules for all 19 parameters, each one labelled practice", () => {
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
    const p = withRecords(byKind("OPH_DEMO_OBSERVED"), seen("speaking.rerecord_allowed", false));
    expect(ENGINE_APPLIES.has("speaking.rerecord_allowed")).toBe(false);
    const r = resolveExamRules(p);
    expect(r.rules.find(x => x.parameter === "speaking.rerecord_allowed")).toMatchObject({ status: "verified", applied: false, value: false });
    expect(r).toMatchObject({ verified: 1, notApplied: 1 });
    // a verified part time IS reproduced now (TZ-EXAM-07)
    const timed = resolveExamRules(withRecords(byKind("OPH_DEMO_OBSERVED"), seen("timing.reading_minutes", 60)));
    expect(timed.rules.find(x => x.parameter === "timing.reading_minutes")).toMatchObject({ status: "verified", applied: true, value: 60 });
    expect(timed.partMinutes).toEqual({ reading: 60 });
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

  it("section lock (TZ-EXAM-08): moving on to the next part closes the finished one; it is never entered again, survives a reload, and is off by default", () => {
    const T = new Date("2026-11-19T10:00:00Z");
    const parts = ["reading", "reading", "listening", "writing", "speaking"];
    let s = createSession("yki-mini-arki", 0, T, "sess-l", null, { plays: "unlimited", backAllowed: true, reviewScreen: false, sectionLock: true });
    expect(resolveExamRules(null, s.practiceChoices).sectionLock).toBe(true);
    expect(resolveExamRules(null, null).sectionLock).toBe(false);                                     // practice default: no lock
    expect(resolveExamRules(null, null).rules.find(r => r.parameter === "navigation.section_lock")).toMatchObject({ status: "practice", value: false });
    expect(endsPart(parts, 1)).toBe(true); expect(endsPart(parts, 0)).toBe(false); expect(endsPart(parts, 4)).toBe(false);
    s = navigateTo(s, 1, parts, true, T);                                                             // inside the part: nothing closes
    expect(s.closedParts ?? []).toEqual([]);
    s = navigateTo(navigateTo(s, 0, parts, true, T), 1, parts, true, T);                              // back inside the part is fine
    s = navigateTo(s, 2, parts, true, T);
    expect(s.closedParts).toEqual(["reading"]);
    expect(isPartClosed(s, parts, 0)).toBe(true);
    expect(() => navigateTo(s, 1, parts, true, T)).toThrow(PartClosedError);
    s = navigateTo(s, 4, parts, true, T);                                                             // a jump closes every part passed
    expect(s.closedParts).toEqual(["reading", "listening", "writing"]);
    const back = loadSession(JSON.stringify(s), ["yki-mini-arki"]).session!;
    expect(back.closedParts).toEqual(["reading", "listening", "writing"]);
    expect(back.practiceChoices).toEqual({ plays: "unlimited", backAllowed: true, reviewScreen: false, sectionLock: true });
    const damaged = loadSession(JSON.stringify({ ...s, closedParts: ["reading", "bogus", "reading", 3] }), ["yki-mini-arki"]).session!;
    expect(damaged.closedParts).toEqual(["reading"]);
    let open = createSession("yki-mini-arki", 0, T, "sess-o");
    open = navigateTo(open, 2, parts, false, T);                                                      // lock off: nothing closes
    expect(navigateTo(open, 0, parts, false, T).index).toBe(0);
    expect(validPracticeChoices({ plays: 1, backAllowed: false, reviewScreen: true })).toBe(true);   // older attempts stay valid
    expect(validPracticeChoices({ plays: 1, backAllowed: false, reviewScreen: true, sectionLock: "yes" })).toBe(false);
    expect(validPracticeChoices({ plays: 1, backAllowed: false, reviewScreen: true, sectionLock: true, extra: 1 })).toBe(false);
  });

  it("part timers (TZ-EXAM-07): a part's own time starts when it is entered, never comes back when the clock moves back, and when it runs out the part closes and the attempt moves on", () => {
    const T = new Date("2026-11-19T10:00:00Z");
    const at = (min: number) => new Date(T.getTime() + min * 60_000);
    const parts = ["reading", "reading", "writing", "speaking"];
    const choices = { plays: "unlimited" as const, backAllowed: true, reviewScreen: false, partMinutes: { reading: 10, writing: 20 } };
    expect(validPracticeChoices(choices)).toBe(true);
    expect(validPracticeChoices({ ...choices, partMinutes: { reading: 7 } })).toBe(false);                       // not an offered value
    expect(validPracticeChoices({ ...choices, partMinutes: { cooking: 10 } })).toBe(false);
    const rules = resolveExamRules(null, choices);
    expect(rules.partMinutes).toEqual({ reading: 10, writing: 20 });
    expect(rules.onExpiry).toBe("lock");
    expect(rules.rules.find(r => r.parameter === "timing.reading_minutes")).toMatchObject({ status: "practice", chosen: true, value: 10 });
    expect(resolveExamRules(null, null).partMinutes).toEqual({});                                               // default: no own time

    let s = startPartClock(createSession("yki-mini-arki", 0, T, "sess-t", null, choices), "reading", T);
    expect(partRemainingSeconds(s, "reading", 10, at(4))).toBe(360);
    expect(partRemainingSeconds(s, "speaking", undefined, at(4))).toBeNull();
    expect(startPartClock(s, "reading", at(5))).toBe(s);                                                       // started once
    s = withPartHighWater(s, "reading", at(6));
    expect(partRemainingSeconds(s, "reading", 10, at(1))).toBe(240);                                            // clock moved back: no time back
    expect(isPartTimeUp(s, "reading", 10, at(10))).toBe(true);
    const back = loadSession(JSON.stringify(s), ["yki-mini-arki"]).session!;
    expect(back.partClock).toEqual(s.partClock);
    expect(back.practiceChoices).toEqual(choices);
    const damaged = loadSession(JSON.stringify({ ...s, partClock: { reading: { startedAt: "nonsense" } } }), ["yki-mini-arki"]).session!;
    expect(isPartTimeUp(damaged, "reading", 10, T)).toBe(true);                                                 // fails closed: no time

    const minutesOf = (p: string) => (choices.partMinutes as Record<string, number>)[p];
    const moved = expirePart(s, parts, minutesOf, at(10));
    expect(moved).toMatchObject({ next: true });
    expect(moved.session.index).toBe(2);                                                                        // first writing item
    expect(moved.session.closedParts).toEqual(["reading"]);
    expect(partRemainingSeconds(moved.session, "writing", 20, at(10))).toBe(1200);                              // its own clock starts
    const last = expirePart({ ...moved.session, index: 3 }, parts, minutesOf, at(40));
    expect(last).toMatchObject({ next: false });
    expect(last.session.closedParts).toEqual(["reading", "speaking"]);
  });
});
