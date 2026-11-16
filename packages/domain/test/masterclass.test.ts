import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { addDiagnostic, blankState, masterclassEvidence, masterclassReducer, masterclassView, startMasterclass, toMasterclass, MasterclassError,
  type Masterclass, type MasterclassLesson, type MasterclassSession } from "../src/index.ts";

const root = new URL("../../../", import.meta.url);
const lessons = JSON.parse(readFileSync(new URL("learning/exercises/b1/masterclasses/lessons.json", root), "utf8")).lessons as MasterclassLesson[];
const all = lessons.map(toMasterclass);

function walk(m: Masterclass, answers = [m.questions[0]!.correct_index, (m.questions[1]!.correct_index + 1) % m.questions[1]!.options_fi.length]) {
  let s: MasterclassSession = startMasterclass(m);
  const go = (e: Parameters<typeof masterclassReducer>[2]) => { s = masterclassReducer(s, m, e); return masterclassView(s, m); };
  return { get s() { return s; }, go, answers };
}

describe("masterclasses (CURATED-09): the saved lessons as a lesson type with the first-attempt rules", () => {
  it("masterclass: all 12 saved lessons load; two keyed questions, a repair, an own answer and a new situation each; no hidden answer printed in the text", () => {
    expect(all).toHaveLength(12);
    expect(all.every(m => m !== null)).toBe(true);
    const speaking = all.filter(m => m!.skill === "speaking");
    expect(speaking.length).toBe(3);
    expect(speaking.every(m => m!.produceSkill === "speaking")).toBe(true);
    expect(all.filter(m => m!.skill !== "speaking").every(m => m!.produceSkill === "writing")).toBe(true);
    // a lesson whose text already prints the better version is refused
    const leaky = structuredClone(lessons[0]!);
    const repair = leaky.activities.find(a => a.kind === "self_correction")! as { corrected_fi: string };
    leaky.teaching_input_fi += " " + repair.corrected_fi;
    expect(toMasterclass(leaky)).toBeNull();
    expect(toMasterclass({ ...lessons[0]!, teacher_review: "published" })).toBeNull();   // publication goes through the S2 card, never the file flag
  });

  it("masterclass: keys only after both own answers; the better version only after the own repair; the model only after the own answer; the new situation shows neither text nor model", () => {
    const m = all[0]!;
    const w = walk(m);
    let v = masterclassView(w.s, m);
    expect(v.question!.n).toBe(1);
    expect(v.input_fi).toBe(m.input_fi);
    expect(v.results).toBeNull();
    expect(JSON.stringify(v)).not.toContain(m.repair.corrected_fi);
    expect(JSON.stringify(v)).not.toContain(m.response.model_fi);
    v = w.go({ type: "ANSWER", index: w.answers[0]! });
    expect(v.question!.n).toBe(2);
    expect(v.results).toBeNull();                                         // nothing of question 1's key yet
    v = w.go({ type: "ANSWER", index: w.answers[1]! });
    expect(v.results!.map(r => r.correct)).toEqual([true, false]);
    expect(v.results![1]!.key_fi).toBe(m.questions[1]!.options_fi[m.questions[1]!.correct_index]);
    expect(() => w.go({ type: "ANSWER", index: 0 })).toThrow(MasterclassError);   // frozen
    v = w.go({ type: "CONTINUE" });
    expect(v.bad_fi).toBe(m.repair.bad_example_fi);
    expect(v.corrected_fi).toBeNull();
    expect(() => w.go({ type: "SUBMIT_REPAIR", text: "  " })).toThrow(/Write something/);
    v = w.go({ type: "SUBMIT_REPAIR", text: "Oma korjaus." });
    expect(v.corrected_fi).toBe(m.repair.corrected_fi);
    expect(v.ownRepair).toBe("Oma korjaus.");
    v = w.go({ type: "CONTINUE" });
    expect(v.prompt_fi).toBe(m.response.prompt_fi);
    expect(v.model_fi).toBeNull();
    v = w.go({ type: "SUBMIT_RESPONSE", text: "Oma vastaus." });
    expect(v.model_fi).toBe(m.response.model_fi);
    expect(v.compare_uk).toHaveLength(4);
    expect(v.compare_uk!.join(" ")).not.toMatch(/\d/);                     // labels, never weights or points
    expect(() => w.go({ type: "CONTINUE" })).toThrow(/Compare/);
    w.go({ type: "JUDGE", judgement: "partly" });
    v = w.go({ type: "CONTINUE" });
    expect(v.transfer_fi).toBe(m.transfer.prompt_fi);
    expect(v.input_fi).toBeNull();
    expect(v.model_fi).toBeNull();
    v = w.go({ type: "SUBMIT_TRANSFER", text: "Uusi tilanne." });
    expect(v.phase).toBe("done");
  });

  it("masterclass: only the two keyed questions are scored, as reading; repair, own answer and new situation are ungraded and say how they were made", () => {
    for (const m of [all[0]!, all[2]!, all[4]!]) {                       // reading, listening (text is not a transcript), speaking
      const w = walk(m);
      w.go({ type: "ANSWER", index: w.answers[0]! }); w.go({ type: "ANSWER", index: w.answers[1]! });
      w.go({ type: "CONTINUE" }); w.go({ type: "SUBMIT_REPAIR", text: "a" }); w.go({ type: "CONTINUE" });
      w.go({ type: "SUBMIT_RESPONSE", text: "b" }); w.go({ type: "JUDGE", judgement: "same" }); w.go({ type: "CONTINUE" });
      w.go({ type: "SUBMIT_TRANSFER", text: "c" });
      const ev = masterclassEvidence(w.s, m);
      expect(ev.filter(e => e.status === "scored").map(e => [e.skill, e.correct])).toEqual([["reading", true], ["reading", false]]);
      expect(ev.filter(e => e.status === "ungraded").map(e => e.skill)).toEqual(["writing", m.produceSkill, m.produceSkill]);
      expect(ev.some(e => e.skill === "listening")).toBe(false);
      let state = blankState();
      for (const e of ev) state = addDiagnostic(state, e);                 // every record is valid learner evidence
      expect(state.diagnostics).toHaveLength(5);
    }
    expect(() => masterclassEvidence(startMasterclass(all[0]!), all[0]!)).toThrow(/Not finished/);
  });
});
