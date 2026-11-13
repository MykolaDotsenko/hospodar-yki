import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { addDiagnostic, blankState, clinicEvidence, CLINIC_PLAN_FRAME_UK, CLINIC_PLAN_MAX_CHARS, clinicReducer, clinicView, draftSentences, startClinic, validateClinicItem, wordDiff,
  ClinicError, type ClinicEvent, type ClinicItem, type ClinicSession } from "../src/index.ts";

const items: ClinicItem[] = JSON.parse(readFileSync(new URL("../../../learning/exercises/b1/high-yield/writing-repair-clinic.json", import.meta.url), "utf8")).items;
const I = items[0]!;
const run = (events: ClinicEvent[], s: ClinicSession = startClinic(I)) => events.reduce((x, e) => clinicReducer(x, I, e), s);
const DRAFT = "Hei! Kylpyhuoneen seinässä on tumma läikkä. Voitteko tulla katsomaan?";
const toModel: ClinicEvent[] = [{ type: "SUBMIT_DRAFT", text: DRAFT }, { type: "SELF_CHECK", points: [0, 2] }, { type: "DRAFT_SAVED" },
  { type: "CONTINUE" }, { type: "MARK", sentences: [1, 3] }, { type: "CONTINUE" }];

describe("writing clinic: draft → feedback → rewrite → new task (IV-REQ-07)", () => {
  it("all 6 real items are valid; every issue lies in exactly one weak-draft sentence; model only after attempt", () => {
    expect(items).toHaveLength(6);
    for (const i of items) expect(validateClinicItem(i)).toBe(true);
    expect(validateClinicItem({ ...I, model_visibility: "always" })).toBe(false);
    expect(validateClinicItem({ ...I, issues: [{ fragment_fi: "ei ole tekstissä", why_uk: "", focus: "x" }] })).toBe(false);
  });
  it("own draft first: no weak draft, issues or model visible while writing; short text refused", () => {
    const v = clinicView(startClinic(I), I);
    expect([v.showWeakDraft, v.issues, v.model, v.ownDraft]).toEqual([false, null, null, null]);
    expect(JSON.stringify(v)).not.toContain(I.model_fi.slice(0, 20));
    expect(() => run([{ type: "SUBMIT_DRAFT", text: "Hei" }])).toThrow(ClinicError);
  });
  it("cannot leave the self-check before the draft is persisted (fail closed)", () => {
    const s = run([{ type: "SUBMIT_DRAFT", text: DRAFT }]);
    expect(() => clinicReducer(s, I, { type: "CONTINUE" })).toThrow(/Persist/);
  });
  it("spot → issues reports found/missed by sentence, then the model; model hidden again in transfer", () => {
    const issues = run(toModel);
    const v = clinicView(issues, I);
    const where = I.issues.map(q => draftSentences(I).findIndex(x => x.includes(q.fragment_fi)));
    expect(v.issues!.map(q => q.found)).toEqual(where.map(w => [1, 3].includes(w)));
    expect(v.model).toBeNull();
    const model = clinicReducer(issues, I, { type: "CONTINUE" });
    expect(clinicView(model, I).model!.text_fi).toBe(I.model_fi);
    const transfer = run([{ type: "CONTINUE" }, { type: "SUBMIT_REWRITE", text: DRAFT + " Olen kotona arkisin klo 17 jälkeen." }], model);
    const tv = clinicView(transfer, I);
    expect([tv.model, tv.ownDraft, tv.issues, tv.prompt_fi]).toEqual([null, null, null, I.transfer_fi]);
  });
  it("word diff shows what the learner changed; evidence is ungraded and labelled by independence", () => {
    expect(wordDiff("a b c", "a x c d")).toEqual([{ kind: "same", text: "a" }, { kind: "removed", text: "b" }, { kind: "added", text: "x" },
      { kind: "same", text: "c" }, { kind: "added", text: "d" }]);
    const done = run([...toModel, { type: "CONTINUE" }, { type: "CONTINUE" }, { type: "SUBMIT_REWRITE", text: DRAFT + " Kiitos!" },
      { type: "SUBMIT_TRANSFER", text: "Hei! Keittiön ikkunasta vetää kylmää. Sopiiko huolto tiistaina?" }]);
    expect(clinicView(done, I).diff!.filter(p => p.kind !== "same")).toEqual([{ kind: "added", text: "Kiitos!" }]);
    const evs = [...clinicEvidence(done, I, "draft"), ...clinicEvidence(done, I, "final")];
    expect(evs.map(e => [e.taskId, e.status])).toEqual([["b1-clinic-001", "ungraded"], ["b1-clinic-001-rewrite", "ungraded"], ["b1-clinic-001-transfer", "ungraded"]]);
    expect(evs[0]!.response.startsWith("[independent draft; self-check 2/4]")).toBe(true);
    expect(evs[1]!.response.startsWith("[guided rewrite after model]")).toBe(true);
    let st = blankState();
    for (const e of evs) st = addDiagnostic(st, e);
    expect(st.diagnostics.every(d => d.status === "ungraded" && !("correct" in d))).toBe(true);
  });
});

describe("writing clinic: optional own plan before writing (pre-task-planning)", () => {
  it("offers a short Ukrainian frame (addressee/purpose, task points, opening/closing), not a Finnish model", () => {
    expect(CLINIC_PLAN_FRAME_UK).toHaveLength(3);
    for (const line of CLINIC_PLAN_FRAME_UK) expect(line).not.toMatch(/[äö]/i);
    expect(CLINIC_PLAN_MAX_CHARS).toBeGreaterThan(100);
  });
  it("a draft written after an own plan is labelled so; still ungraded, and the plan text is never stored as evidence", () => {
    const I = items[0]!;
    let s = startClinic(I);
    s = clinicReducer(s, I, { type: "SUBMIT_DRAFT", text: "Hyvä vastaanottaja, kirjoitan teille ongelmasta." });
    const [planned] = clinicEvidence(s, I, "draft", { planned: true });
    expect(planned).toMatchObject({ status: "ungraded" });
    expect(planned!.response).toMatch(/^\[independent draft after an own plan; self-check 0\//);
    expect(clinicEvidence(s, I, "draft")[0]!.response).toMatch(/^\[independent draft; self-check/);
  });
});
