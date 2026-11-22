/**
 * unseen-diagnostics (registry method, P0 94), measurement «окрема динаміка listening/reading/speaking/writing»:
 * per skill the starting diagnostic and each 7/14/30 check on a NEW item stay separate points — never summed,
 * averaged, turned into a % or a level; supported listening and all production stay ungraded.
 */
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { addDiagnostic, blankState, buildSkillRetentionBank, independentCheckTimeline, recordSkillCheck, skillCheckReducer,
  skillRetentionQueue, startSkillCheck, type LearnerState, type Skill, type SkillCheckItem, type SkillRetentionBank } from "../src/index.ts";

const root = new URL("../../../", import.meta.url);
const read = (p: string) => JSON.parse(readFileSync(new URL(p, root), "utf8"));
const themes = readdirSync(new URL("learning/exercises/b1/themes/", root)).filter(f => f.endsWith(".json")).map(f => read(`learning/exercises/b1/themes/${f}`));
const exam = read("learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json").blueprints.flatMap((b: { skill_blocks: { item_id: string }[] }) => b.skill_blocks.map(s => s.item_id));
const bank: SkillRetentionBank = buildSkillRetentionBank({
  version: "test", inference: read("learning/exercises/b1/high-yield/reading-inference-bank.json").items,
  themeTasks: themes.flatMap(t => [...t.writing, ...t.speaking]),
  writingIds: ["02-koti-ja-asuminen-writing-02", "03-kaupat-ja-palvelut-writing-01", "06-terveys-ja-hyvinvointi-writing-02"],
  speakingIds: ["02-koti-ja-asuminen-speaking-01", "05-matkustaminen-speaking-01", "08-ymparisto-speaking-02"],
  listening: read("learning/exercises/b1/audio-long/lessons.json").lessons, examItemIds: exam,
});
const START = { reading: ["d-r1", "d-r2"], writing: ["dw"], speaking: ["ds"] } as const;
const D0 = new Date("2026-11-01T10:00:00+02:00");
const at = (days: number) => new Date(D0.getTime() + days * 86400000 + 3600000);

/** Starting diagnostic: reading 1 of 2 right, writing and speaking saved ungraded; listening practised in a mission. */
function started(): LearnerState {
  let s = blankState();
  s = addDiagnostic(s, { skill: "reading", taskId: "d-r1", status: "scored", correct: true, response: "1" }, D0);
  s = addDiagnostic(s, { skill: "reading", taskId: "d-r2", status: "scored", correct: false, response: "0" }, D0);
  s = addDiagnostic(s, { skill: "writing", taskId: "dw", status: "ungraded", response: "Hei!" }, D0);
  s = addDiagnostic(s, { skill: "speaking", taskId: "ds", status: "ungraded", response: "Hei!" }, D0);
  return addDiagnostic(s, { skill: "listening", taskId: "lesson-q1", status: "scored", correct: true, response: "0" }, D0);
}
function check(s: LearnerState, skill: Skill, when: Date, opts: { supported?: boolean } = {}) {
  const st = skillRetentionQueue(s, bank, when).find(x => x.skill === skill)!;
  const c = st.due!.check as SkillCheckItem;
  let ss = startSkillCheck(skill, st.due!.day, c);
  if (c.kind === "production") ss = skillCheckReducer(ss, c, { type: "SUBMIT_TEXT", text: "Oma vastaus." });
  else {
    if (skill === "listening") ss = skillCheckReducer(ss, c, { type: opts.supported ? "SHOW_TEXT" : "AUDIO_STARTED" });
    for (const q of c.item.questions)
      ss = skillCheckReducer(ss, c, { type: "ANSWER", questionId: q.id, value: q.type === "single_choice" ? String(q.correct_index) : q.type === "true_false" ? String(q.answer) : "Vastaus" });
  }
  return recordSkillCheck(s, bank, ss, when);
}
const line = (s: LearnerState, when: Date, skill: Skill) =>
  independentCheckTimeline(s, skillRetentionQueue(s, bank, when), START).find(x => x.skill === skill)!.points;

describe("independent check timeline per skill (unseen-diagnostics)", () => {
  it("before anything: the start is not taken, listening has no start probe, every day is still ahead", () => {
    const t = independentCheckTimeline(blankState(), skillRetentionQueue(blankState(), bank, D0), START);
    expect(t.map(x => x.skill)).toEqual(["reading", "listening", "writing", "speaking"]);
    expect(t.find(x => x.skill === "reading")!.points.map(p => p.state)).toEqual(["not_taken", "upcoming", "upcoming", "upcoming"]);
    expect(t.find(x => x.skill === "listening")!.points[0]).toEqual({ point: "start", state: "no_probe" });
  });

  it("the start point keeps its own first-answer counts; production is saved without counts", () => {
    const s = started();
    expect(line(s, at(1), "reading")[0]).toEqual({ point: "start", state: "done", date: "2026-11-01", scored: 2, correct: 1 });
    expect(line(s, at(1), "writing")[0]).toEqual({ point: "start", state: "done", date: "2026-11-01" });
    // a later answer to the same start question (e.g. a re-run) never replaces the first one
    const again = addDiagnostic(s, { skill: "reading", taskId: "d-r2", status: "scored", correct: true, response: "2" }, at(2));
    expect(line(again, at(2), "reading")[0]).toMatchObject({ scored: 2, correct: 1 });
  });

  it("each day is a separate point: done with its own counts, due, missed — never merged with the start", () => {
    let s = started();
    expect(line(s, at(7), "reading").map(p => p.state)).toEqual(["done", "due", "upcoming", "upcoming"]);
    s = check(s, "reading", at(7));
    const r = line(s, at(8), "reading");
    expect(r[1]).toMatchObject({ point: 7, state: "done", date: "2026-11-08" });
    expect(r[1]!.scored).toBe(bank.reading[0]!.questions.filter(q => q.type !== "open").length);
    expect(r[1]!.correct).toBe(r[1]!.scored);
    expect(r[0]).toMatchObject({ scored: 2, correct: 1 });                       // the start point is untouched
    // day 14 skipped and day 30 reached: 14 is missed (never passed retroactively), 30 is due
    expect(line(s, at(30), "reading").map(p => p.state)).toEqual(["done", "done", "missed", "due"]);
    s = check(s, "writing", at(7));
    expect(line(s, at(8), "writing")[1]).toEqual({ point: 7, state: "done", date: "2026-11-08" });   // ungraded: no counts
  });

  it("supported listening is shown as supported with no scored answers", () => {
    const s = check(started(), "listening", at(7), { supported: true });
    expect(line(s, at(8), "listening")[1]).toMatchObject({ point: 7, state: "done", scored: 0, correct: 0, supported: true });
  });

  it("returns points only — no total, average, percentage or level field exists", () => {
    const s = check(started(), "reading", at(7));
    const keys = new Set(independentCheckTimeline(s, skillRetentionQueue(s, bank, at(8)), START).flatMap(x => x.points.flatMap(p => Object.keys(p))));
    expect([...keys].sort()).toEqual(["correct", "date", "point", "scored", "state"]);
  });
});
