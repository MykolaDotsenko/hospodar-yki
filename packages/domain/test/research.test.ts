/**
 * Research mode (R01 readiness, docs/29 stage 6): opt-in enrolment, active study time, de-identified export.
 */
import { describe, expect, it } from "vitest";
import { activeMs, addDiagnostic, addStudyTime, blankState, buildResearchExport, completeMission, CONSENT_ITEMS, emptyStudyTime, enroll,
  MAX_SECONDS_PER_DAY_AREA, normaliseStudyCode, parseEnrollment, parseStudyTime, ResearchError, studyTimeTotals, type LearnerState } from "../src/index.ts";

const ALL = CONSENT_ITEMS.map(c => c.id);
const at = (iso: string) => new Date(iso);
const ENROL = at("2026-11-10T10:00:00+02:00");

describe("enrolment: opt-in with a researcher's study code and every consent ticked", () => {
  it("accepts only a study code — never a name, an e-mail or free text", () => {
    expect(normaliseStudyCode(" r01-a17 ")).toBe("R01-A17");
    expect(normaliseStudyCode("HY24")).toBe("HY24");
    for (const bad of ["", "ab", "Олена", "maria@example.fi", "Maria Virtanen", "A B C", "R01--A", "ABCDEFGHIJKLM", "R01-A17-X"])
      expect(normaliseStudyCode(bad), bad).toBeNull();
  });
  it("refuses without every consent item; records protocol, time and local day", () => {
    expect(() => enroll("HY24", ALL.slice(1), ENROL)).toThrow(ResearchError);
    expect(() => enroll("maria@example.fi", ALL, ENROL)).toThrow(ResearchError);
    const e = enroll("hy24", ALL, ENROL);
    expect(e).toMatchObject({ version: 1, studyCode: "HY24", protocol: "R01-pilot-draft", enrolledDay: "2026-11-10" });
    expect(parseEnrollment(JSON.parse(JSON.stringify(e)))).toEqual(e);
  });
  it("a damaged or foreign record means «not enrolled», never a guessed enrolment", () => {
    const e = enroll("HY24", ALL, ENROL);
    for (const bad of [null, "x", [], { ...e, version: 2 }, { ...e, studyCode: "maria@example.fi" }, { ...e, enrolledDay: "10.11.2026" }, { ...e, enrolledAt: "nope" }])
      expect(parseEnrollment(bad)).toBeNull();
  });
});

describe("study time: only visible, active use is counted", () => {
  const base = { previousTickMs: 1_000_000, nowMs: 1_005_000, visible: true, lastInputMs: 1_000_000, mediaPlaying: false };
  it("counts a tick while visible and active within 2 minutes", () => {
    expect(activeMs(base)).toBe(5000);
    expect(activeMs({ ...base, lastInputMs: base.nowMs - 120_000 })).toBe(5000);
  });
  it("does not count a hidden screen, an idle learner, a clock going back or a long gap (sleep, background tab)", () => {
    expect(activeMs({ ...base, visible: false })).toBe(0);
    expect(activeMs({ ...base, lastInputMs: base.nowMs - 120_001 })).toBe(0);
    expect(activeMs({ ...base, nowMs: base.previousTickMs - 1 })).toBe(0);
    expect(activeMs({ ...base, nowMs: base.previousTickMs + 15_001 })).toBe(0);
  });
  it("counts listening without input while media plays", () => {
    expect(activeMs({ ...base, lastInputMs: 0, mediaPlaying: true })).toBe(5000);
  });
  it("adds whole seconds per day and area, caps a corrupt total, and the reader drops anything unexpected", () => {
    let log = addStudyTime(emptyStudyTime(), "2026-11-10", "reading", 61.9);
    log = addStudyTime(log, "2026-11-10", "reading", 30);
    log = addStudyTime(log, "2026-11-11", "exam", 0);
    expect(log.days).toEqual({ "2026-11-10": { reading: 91 } });
    expect(addStudyTime(log, "2026-11-10", "reading", 10 * MAX_SECONDS_PER_DAY_AREA).days["2026-11-10"]!.reading).toBe(MAX_SECONDS_PER_DAY_AREA);
    expect(() => addStudyTime(log, "10.11.2026", "reading", 5)).toThrow();
    expect(parseStudyTime({ version: 1, days: { "2026-11-10": { reading: 91, chat: 5, writing: -3, listening: 1.5 }, bad: { reading: 1 } } }))
      .toEqual({ version: 1, days: { "2026-11-10": { reading: 91 } } });
    expect(parseStudyTime("garbage")).toEqual(emptyStudyTime());
    expect(studyTimeTotals(addStudyTime(log, "2026-11-12", "reading", 9), "2026-11-11")).toEqual({ reading: 9 });
  });
});

describe("de-identified export: ids, status, first answers, relative days and seconds — never the learner's words", () => {
  const SECRET = ["Minun nimeni on Olena Petrenko", "asun Vantaalla", "мітла мете", "olena@example.fi"];
  function learner(): LearnerState {
    let s = blankState();
    s = addDiagnostic(s, { skill: "reading", taskId: "pre-r1", status: "scored", correct: true, response: "1" }, at("2026-11-08T10:00:00+02:00"));
    s = addDiagnostic(s, { skill: "reading", taskId: "inf-01-q1", status: "scored", correct: false, response: "0" }, at("2026-11-10T11:00:00+02:00"));
    s = addDiagnostic(s, { skill: "reading", taskId: "inf-01-q1", status: "ungraded", response: "[spaced review] 1" }, at("2026-11-11T11:00:00+02:00"));
    s = addDiagnostic(s, { skill: "writing", taskId: "clinic-01", status: "ungraded", response: SECRET[0]! }, at("2026-11-10T12:00:00+02:00"));
    s = addDiagnostic(s, { skill: "listening", taskId: "d7-q1", status: "scored", correct: true, response: "2" }, at("2026-11-17T12:00:00+02:00"));
    s = addDiagnostic(s, { skill: "listening", taskId: "d7-q2", status: "scored", correct: false, response: "0" }, at("2026-11-17T12:00:00+02:00"));
    s = completeMission(s, { taskId: "cloze-01", grammarTag: "partitiivi", firstAnswer: SECRET[1]!, firstCorrect: false, secondAnswer: "x", repairCorrect: true,
      transferText: SECRET[1]! }, at("2026-11-10T13:00:00+02:00"));
    s = completeMission(s, { taskId: "cloze-01", grammarTag: "partitiivi", firstAnswer: "y", firstCorrect: true, transferText: "z" }, at("2026-11-12T13:00:00+02:00"));
    s.retention.push({ taskId: "skill-listening", day: 7, status: "ungraded", independent: true, actualAgeDays: 7, lateByDays: 0,
      response: `[lesson] ${SECRET[3]}`, submittedAt: "2026-11-17T12:00:00+02:00" });
    s.cards["chunk-01"] = { stage: 0, due: "2026-11-11", reviews: 1, failures: 1, lastCorrect: false, lastReviewed: "2026-11-10", ownCue: SECRET[2]! };
    return s;
  }
  const time = addStudyTime(addStudyTime(addStudyTime(emptyStudyTime(), "2026-11-10", "reading", 600), "2026-11-12", "exam", 300), "2026-11-09", "reading", 50);
  const out = () => buildResearchExport(learner(), enroll("HY24", ALL, ENROL), time, at("2026-11-24T09:00:00+02:00"));

  it("contains no learner text, no calendar date and no ISO timestamp", () => {
    const json = JSON.stringify(out());
    for (const s of SECRET) expect(json).not.toContain(s);
    expect(json).not.toMatch(/\d{4}-\d{2}-\d{2}/);
    expect(json).not.toMatch(/"(response|firstAnswer|secondAnswer|transferText|ownCue|text|completedAt|submittedAt|enrolledAt)"/);
  });
  it("first attempts: only the first answer per task; prior exposure kept and flagged; delayed-check answers not mixed in", () => {
    const e = out();
    expect(e.first_attempts).toEqual([
      { task_id: "pre-r1", skill: "reading", scored: true, first_correct: true, day_index: -2, before_enrollment: true },
      { task_id: "inf-01-q1", skill: "reading", scored: true, first_correct: false, day_index: 0, before_enrollment: false },
      { task_id: "clinic-01", skill: "writing", scored: false, first_correct: null, day_index: 0, before_enrollment: false },
    ]);
    expect(e.grammar_missions).toEqual([{ task_id: "cloze-01", grammar_tag: "partitiivi", first_correct: false, guided_repair_correct: true, day_index: 0, before_enrollment: false }]);
  });
  it("delayed checks carry real elapsed days and, for listening/reading, counts of scored first answers", () => {
    expect(out().delayed_checks).toEqual([{ task_id: "skill-listening", check_day: 7, actual_age_days: 7, late_by_days: 0, day_index: 7, scored_answers: 2, correct_answers: 1 }]);
  });
  it("study time is per relative day and area; nothing before enrolment", () => {
    const e = out();
    expect(e.study_time).toEqual([{ day_index: 0, area: "reading", seconds: 600 }, { day_index: 2, area: "exam", seconds: 300 }]);
    expect(e).toMatchObject({ study_code: "HY24", protocol_status: "draft, not approved", export_day_index: 14 });
    expect(e.never_includes.length).toBeGreaterThan(0);
  });
  it("refuses to export without a valid enrolment", () => {
    expect(() => buildResearchExport(learner(), { ...enroll("HY24", ALL, ENROL), studyCode: "a b" }, time)).toThrow(ResearchError);
  });
});
