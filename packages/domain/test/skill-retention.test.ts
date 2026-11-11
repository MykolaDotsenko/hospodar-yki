import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { addDiagnostic, blankState, buildSkillRetentionBank, recordSkillCheck, skillCheckReducer, skillCheckReveal, skillCheckView,
  skillRetentionQueue, startSkillCheck, validateSkillRetentionBank, skillSummary, delayedTransferQueue, readState, SkillCheckError,
  type LearnerState, type SkillCheckItem, type SkillRetentionBank } from "../src/index.ts";

const root = new URL("../../../", import.meta.url);
const read = (p: string) => JSON.parse(readFileSync(new URL(p, root), "utf8"));
const themes = readdirSync(new URL("learning/exercises/b1/themes/", root)).filter(f => f.endsWith(".json")).map(f => read(`learning/exercises/b1/themes/${f}`));
const exam = read("learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json").blueprints.flatMap((b: { skill_blocks: { item_id: string }[] }) => b.skill_blocks.map(s => s.item_id));
export const bankFromRepo = (): SkillRetentionBank => buildSkillRetentionBank({
  version: "test", inference: read("learning/exercises/b1/high-yield/reading-inference-bank.json").items,
  themeTasks: themes.flatMap(t => [...t.writing, ...t.speaking]),
  writingIds: ["02-koti-ja-asuminen-writing-02", "03-kaupat-ja-palvelut-writing-01", "06-terveys-ja-hyvinvointi-writing-02"],
  speakingIds: ["02-koti-ja-asuminen-speaking-01", "05-matkustaminen-speaking-01", "08-ymparisto-speaking-02"],
  listening: read("learning/exercises/b1/audio-long/lessons.json").lessons, examItemIds: exam,
});
const bank = bankFromRepo();
const at = (iso: string) => new Date(iso);
const D0 = "2026-11-01T10:00:00+02:00";
const learned = (skills: ("reading" | "listening" | "writing" | "speaking")[], when = D0, taskId = "x-1"): LearnerState => {
  let s = blankState();
  for (const skill of skills) s = addDiagnostic(s, ["reading", "listening"].includes(skill)
    ? { skill, taskId, status: "scored", correct: true } : { skill, taskId, status: "ungraded", response: "t" }, at(when));
  return s;
};
const due = (s: LearnerState, skill: string, when: string) => skillRetentionQueue(s, bank, at(when)).find(x => x.skill === skill)!;
function finish(s: LearnerState, skill: "reading" | "listening" | "writing" | "speaking", when: string, opts: { wrong?: boolean; supported?: boolean } = {}) {
  const st = due(s, skill, when); const check = st.due!.check as SkillCheckItem;
  let ss = startSkillCheck(skill, st.due!.day, check);
  if (check.kind === "production") ss = skillCheckReducer(ss, check, { type: "SUBMIT_TEXT", text: "Oma vastaus." });
  else {
    if (skill === "listening") ss = skillCheckReducer(ss, check, { type: opts.supported ? "SHOW_TEXT" : "AUDIO_STARTED" });
    for (const q of check.item.questions) {
      const v = q.type === "single_choice" ? String(opts.wrong ? (q.correct_index! + 1) % q.options_fi!.length : q.correct_index) : q.type === "true_false" ? String(opts.wrong ? !q.answer : q.answer) : "Vastaus";
      ss = skillCheckReducer(ss, check, { type: "ANSWER", questionId: q.id, value: v });
    }
  }
  return { next: recordSkillCheck(s, bank, ss, at(when)), session: ss, check };
}

describe("delayed 7/14/30 checks for all four skills (GL-03)", () => {
  it("bank from real repo content is valid, withheld from EXAM and from every LEARN pool", () => {
    expect(validateSkillRetentionBank(bank)).toBe(true);
    expect([bank.reading.length, bank.writing.length, bank.speaking.length]).toEqual([3, 3, 3]);
    const learnReading = read("learning/exercises/b1/contextual/reading-pack-v1.json").items.map((i: { id: string }) => i.id);
    for (const id of [...bank.reading, ...bank.writing, ...bank.speaking, ...bank.listening].map(i => i.id)) expect(exam).not.toContain(id);
    for (const i of bank.reading) expect(learnReading).not.toContain(i.id);
    expect(bank.listening.map(l => l.id)).not.toContain("b1long-01-vesikatko-ja-huoltokaynti");
  });
  it("nothing is due before day 7; each skill counts from its own first LEARN evidence", () => {
    const s = learned(["reading", "writing"]);
    expect(due(s, "reading", "2026-11-07T12:00:00+02:00").due).toBeNull();
    expect(due(s, "reading", "2026-11-08T12:00:00+02:00").due?.day).toBe(7);
    expect(due(s, "writing", "2026-11-08T12:00:00+02:00").due?.check.item.id).toBe(bank.writing[0]!.id);
    expect(due(s, "listening", "2026-11-08T12:00:00+02:00")).toMatchObject({ anchorDate: null, due: null });
  });
  it("reading: one question at a time, first answer frozen; scored diagnostics + one retention marker; keys only in reveal", () => {
    const s = learned(["reading"]), when = "2026-11-08T12:00:00+02:00";
    const check = due(s, "reading", when).due!.check;
    let ss = startSkillCheck("reading", 7, check);
    expect(skillCheckView(ss, check)).toMatchObject({ showReadingText: true, ready: false });
    expect(JSON.stringify(skillCheckView(ss, check))).not.toContain("correct_index");
    expect(() => recordSkillCheck(s, bank, ss, at(when))).toThrow(SkillCheckError);
    const q0 = check.kind === "objective" ? check.item.questions[0]! : null;
    ss = skillCheckReducer(ss, check, { type: "ANSWER", questionId: q0!.id, value: "0" });
    expect(() => skillCheckReducer(ss, check, { type: "ANSWER", questionId: q0!.id, value: "1" })).toThrow(SkillCheckError);
    const { next, session } = finish(s, "reading", when, { wrong: true });
    expect(next.retention.at(-1)).toMatchObject({ taskId: "skill-reading", day: 7, status: "ungraded", independent: true, actualAgeDays: 7, lateByDays: 0 });
    expect(next.diagnostics.filter(d => d.taskId.startsWith("d7-")).map(d => d.status)).toEqual(["scored", "scored", "ungraded", "scored"]);
    expect(skillCheckReveal(session, check)).toMatchObject({ kind: "objective" });
    expect(due(next, "reading", when).due).toBeNull();
    expect(() => recordSkillCheck(next, bank, session, at(when))).toThrow();          // not repeatable
    expect(readState(JSON.stringify(next)).state.retention).toHaveLength(1);           // V1 reader keeps it
  });
  it("missed windows are reported missed, never passed retroactively; late check is recorded as late", () => {
    const s = learned(["writing"]);
    const st = due(s, "writing", "2026-11-16T12:00:00+02:00");
    expect(st).toMatchObject({ missed: [7] });
    expect(st.due?.day).toBe(14);
    const { next } = finish(s, "writing", "2026-11-18T12:00:00+02:00");
    expect(next.retention.at(-1)).toMatchObject({ day: 14, lateByDays: 3, response: expect.stringContaining(bank.writing[1]!.id) });
    expect(due(next, "writing", "2026-12-01T12:00:00+02:00")).toMatchObject({ completed: [14], missed: [7] });
    expect(due(next, "writing", "2026-12-01T12:00:00+02:00").due?.day).toBe(30);
  });
  it("writing/speaking stay ungraded; task points appear only in the reveal as self-check", () => {
    const s = learned(["speaking"]), when = "2026-11-08T12:00:00+02:00";
    const { next, session, check } = finish(s, "speaking", when);
    expect(skillCheckView(session, check)).not.toHaveProperty("points_fi");
    expect(skillCheckReveal(session, check)).toMatchObject({ kind: "production", points_fi: bank.speaking[0]!.required_points_fi });
    expect(next.diagnostics.some(d => d.taskId.startsWith("d7-"))).toBe(false);
    expect(skillSummary(next).speaking.scored).toBe(0);
  });
  it("listening: audio first; only a lesson this learner never met; text support makes it ungraded; honest when none left", () => {
    let s = learned(["listening"], D0, "b1long-3-q1");                                // met lesson 03 in LEARN
    const when = "2026-11-08T12:00:00+02:00";
    const st = due(s, "listening", when);
    expect(st.due?.check.item.id).not.toBe("b1long-03-verkkokaupan-palautus");
    const check = st.due!.check, q = check.kind === "objective" ? check.item.questions[0]! : null;
    const ss = startSkillCheck("listening", 7, check);
    expect(() => skillCheckReducer(ss, check, { type: "ANSWER", questionId: q!.id, value: "0" })).toThrow(SkillCheckError);
    const sup = finish(s, "listening", when, { supported: true });
    expect(sup.next.diagnostics.filter(d => d.taskId.startsWith("d7-")).every(d => d.status === "ungraded")).toBe(true);
    // every remaining lesson already met → unavailable, never a re-run of a known lesson
    for (const l of bank.listening) s = addDiagnostic(s, { skill: "listening", taskId: l.questions[0]!.id, status: "scored", correct: true }, at(D0));
    expect(due(s, "listening", when)).toMatchObject({ due: null, unavailable: 7 });
  });
  it("delayed checks never anchor a skill and do not disturb the grammar 7/14/30 queue", () => {
    const s = learned(["reading"]), { next } = finish(s, "reading", "2026-11-08T12:00:00+02:00");
    expect(due(next, "reading", "2026-11-08T12:00:00+02:00").anchorDate).toBe("2026-11-01");
    expect(delayedTransferQueue(next, read("learning/exercises/b1/grammar/delayed-transfer-v1.json"), at("2026-11-08T12:00:00+02:00"))).toEqual([]);
  });
});
