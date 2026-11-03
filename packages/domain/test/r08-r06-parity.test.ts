/** R08 / R06 TS ports must behave exactly like the unit-tested reference modules. */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
// @ts-expect-error legacy JS reference module
import * as refR08 from "../../../app/r08-grammar-core.mjs";
// @ts-expect-error legacy JS reference module
import * as refR06 from "../../../app/adaptation-core.mjs";
import * as d from "../src/index.ts";

const drafts: d.R08Task[] = JSON.parse(readFileSync(new URL("../../../learning/exercises/b1/grammar/r08-meaning-stems-original-drafts.json", import.meta.url), "utf8")).exercises;
const approve = (t: d.R08Task): d.R08Task => ({ ...t, review_status: "approved_S2", answerKeyReviewed: true });

describe("R08 meaning → form parity", () => {
  it("validation matches on all 14 drafts, approved copies and malformed variants", () => {
    expect(drafts).toHaveLength(14);
    for (const t of drafts) {
      for (const v of [t, approve(t), { ...t, mode: "EXAM" }, { ...t, heldOut: true }, { ...t, prompt_fi: "no gap" },
        { ...approve(t), answerKeyReviewed: false }, { ...t, semantic_options: [t.semantic_relation] }]) {
        for (const opts of [{}, { requireApproved: true }])
          expect(d.validateR08Task(v, opts)).toBe(refR08.validateR08Task(v, opts));
      }
    }
  });
  it("learner trials refuse drafts (S2 gate); reviewer preview is explicit and marked", () => {
    for (const t of drafts) {
      expect(() => refR08.createR08Trial(t)).toThrow();
      expect(() => d.createR08Trial(t)).toThrow(/S2-approved/);
      expect(d.createR08Trial(t, { reviewerPreview: true }).preview).toBe(true);
    }
  });
  it("first-attempt evidence (meaning, form, error family) is identical to the reference", () => {
    for (const raw of drafts) {
      const t = approve(raw);
      const wrongMeaning = t.semantic_options.find(o => o !== t.semantic_relation)!;
      for (const [meaning, form, help] of [[t.semantic_relation, t.answer_fi, false], [wrongMeaning, t.known_wrong_forms?.[0]?.form ?? "väärä", false],
        [t.semantic_relation, "jotain", true]] as const) {
        let a = refR08.createR08Trial(t), b = d.createR08Trial(t);
        if (help) { a = refR08.advanceR08(a, t, { type: "REQUEST_HELP", kind: "form" }); b = d.advanceR08(b, t, { type: "REQUEST_HELP", kind: "form" }); }
        a = refR08.advanceR08(refR08.advanceR08(a, t, { type: "CHOOSE_MEANING", choice: meaning }), t, { type: "SUBMIT_FORM", answer: form });
        b = d.advanceR08(d.advanceR08(b, t, { type: "CHOOSE_MEANING", choice: meaning }), t, { type: "SUBMIT_FORM", answer: form });
        expect([b.firstMeaning, b.firstForm, b.formEvidence, b.feedback]).toEqual([a.firstMeaning, a.firstForm, a.formEvidence, a.feedback]);
      }
    }
  });
  it("DEC-02: a non-matching form goes to repair with the cause but WITHOUT the key; key only in feedback", () => {
    const t = approve(drafts[0]!);
    let s = d.advanceR08(d.advanceR08(d.createR08Trial(t), t, { type: "CHOOSE_MEANING", choice: "toward" }), t, { type: "SUBMIT_FORM", answer: "kaupasta" });
    expect(s.phase).toBe("repair");
    const rv = d.r08View(s, t);
    expect(rv).toMatchObject({ phase: "repair", errorFamily: "case_selection", noKey: true });
    expect(JSON.stringify(rv)).not.toContain(t.answer_fi);
    s = d.advanceR08(s, t, { type: "SUBMIT_REPAIR", answer: "kaupassa" });
    expect(s.repair).toMatchObject({ matchesKey: true, status: "guided_ungraded" });
    expect(s.firstForm).toMatchObject({ answer: "kaupasta", correct: false });   // repair never rewrites the first attempt
    expect(d.r08View(s, t)).toMatchObject({ phase: "feedback", answerFi: t.answer_fi });
    expect(() => d.advanceR08(s, t, { type: "SUBMIT_REPAIR", answer: "x" })).toThrow();
    s = d.advanceR08(d.advanceR08(s, t, { type: "CONTINUE" }), t, { type: "SUBMIT_TRANSFER", answer: "Odotan asemalla." });
    expect(s.phase).toBe("done");
  });
  it("DEC-02: a correct form skips repair; skipping repair is recorded, never as success", () => {
    const t = approve(drafts[0]!);
    const ok = d.advanceR08(d.advanceR08(d.createR08Trial(t), t, { type: "CHOOSE_MEANING", choice: t.semantic_relation }), t, { type: "SUBMIT_FORM", answer: t.answer_fi });
    expect(ok.phase).toBe("feedback");
    const wrong = d.advanceR08(d.advanceR08(d.createR08Trial(t), t, { type: "CHOOSE_MEANING", choice: t.semantic_relation }), t, { type: "SUBMIT_FORM", answer: "x" });
    expect(d.advanceR08(wrong, t, { type: "SKIP_REPAIR" }).repair).toEqual({ skipped: true, status: "guided_ungraded" });
  });
  it("keys stay hidden before feedback; unknown wrong forms are 'unclassified', never regex-guessed", () => {
    const t = approve(drafts[0]!);
    let s = d.createR08Trial(t);
    expect(JSON.stringify(d.r08View(s, t))).not.toContain(t.answer_fi);
    s = d.advanceR08(s, t, { type: "CHOOSE_MEANING", choice: t.semantic_relation });
    expect(JSON.stringify(d.r08View(s, t))).not.toContain(t.answer_fi);
    s = d.advanceR08(s, t, { type: "SUBMIT_FORM", answer: t.answer_fi + "x" });
    expect(d.r08View(s, t)).toMatchObject({ phase: "repair", errorFamily: "unclassified", noKey: true });
  });
});

describe("R06 ranking parity", () => {
  const tasks: d.R06Task[] = [
    { id: "r1", skill: "reading", reviewStatus: "s2_approved", redistributionCleared: true, offlineAvailable: true, estimatedMinutes: 5, topic: "home" },
    { id: "l1", skill: "listening", reviewStatus: "s2_approved", redistributionCleared: true, offlineAvailable: true, estimatedMinutes: 8 },
    { id: "w1", skill: "writing", reviewStatus: "s2_approved", redistributionCleared: true, offlineAvailable: true, estimatedMinutes: 12, prerequisiteIds: ["r1"] },
    { id: "s1", skill: "speaking", reviewStatus: "pending", redistributionCleared: true, offlineAvailable: true, estimatedMinutes: 5 },
    { id: "x1", skill: "reading", reviewStatus: "s2_approved", redistributionCleared: true, offlineAvailable: true, estimatedMinutes: 5, heldOut: true },
    { id: "r1", skill: "reading", reviewStatus: "s2_approved", redistributionCleared: true, offlineAvailable: true, estimatedMinutes: 5 },
  ];
  const states = [
    {},
    { attempts: [{ taskId: "r1", skill: "reading", evidenceKind: "objective_scored", independent: true, firstAttempt: true, correct: false, completedAt: "2026-11-01T10:00:00Z" }],
      cards: { r1: { due: "2026-10-30" }, l1: { due: "2026-11-09" } } },
    { attempts: [{ taskId: "r1", skill: "reading", evidenceKind: "objective_scored", independent: true, firstAttempt: true, correct: true, completedAt: "2026-11-02T10:00:00Z" }],
      diagnostics: [{ taskId: "l1", skill: "listening", status: "ungraded" }] },
  ];
  it("identical rankings, scores and reasons for the reference inputs", () => {
    for (const state of states) for (const availableMinutes of [6, 30]) for (const preferredSkills of [[], ["listening"]]) {
      const p = { tasks, state, today: "2026-11-03", availableMinutes, preferredSkills, preferredTopics: ["home"] };
      expect(d.rankR06Tasks(p as d.R06Params)).toEqual(refR06.rankR06Tasks(p));
    }
    expect(d.rankR06Tasks({ tasks, today: "2026-11-03", availableMinutes: 30, mode: "EXAM" })).toEqual([]);
    for (const bad of [{ tasks, today: "2026-02-30", availableMinutes: 10 }, { tasks, today: "2026-11-03", availableMinutes: 0 }]) {
      expect(() => refR06.rankR06Tasks(bad)).toThrow();
      expect(() => d.rankR06Tasks(bad as d.R06Params)).toThrow();
    }
  });
  it("extensions are off by default: labelled drafts excluded unless explicitly allowed", () => {
    const draft: d.R06Task = { id: "b1-g-001", skill: "grammar", reviewStatus: "labelled_draft", redistributionCleared: true, offlineAvailable: true, estimatedMinutes: 3 };
    expect(d.rankR06Tasks({ tasks: [draft], today: "2026-11-03", availableMinutes: 10 })).toEqual([]);
    expect(d.rankR06Tasks({ tasks: [draft], today: "2026-11-03", availableMinutes: 10, skills: ["grammar"] })).toEqual([]);
    const r = d.rankR06Tasks({ tasks: [draft], today: "2026-11-03", availableMinutes: 10, skills: ["grammar"], allowLabelledDrafts: true });
    expect(r[0]!.reasons).toContain("NEW_APPROVED_TASK");
    expect(Object.keys(r[0]!).some(k => /mastery|yki|cefr|probability/i.test(k))).toBe(false);
  });
  it("explanations describe observed signals only", () => {
    const [top] = d.rankR06Tasks({ tasks, state: states[1], today: "2026-11-03", availableMinutes: 30 } as d.R06Params);
    const text = d.explainR06(top!, states[1]!.cards, "2026-11-03");
    expect(text.join(" ")).toMatch(/прострочене на 4 дн\.|неправильною/);
    expect(text.join(" ")).not.toMatch(/B1|YKI|рівень|%/);
  });
});
