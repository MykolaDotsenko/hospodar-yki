import { describe, expect, it } from "vitest";
import { activeConstraints, stepUpEvidence, stepUpFor, type PracticeCard } from "../src/index.ts";

const card = { id: "reaction-01", kind: "reaction", transferSkill: "speaking" } as PracticeCard;

describe("graduated task sequencing: same situation, constraints added one at a time", () => {
  it("only reaction and opinion cards have a sequence; it grows by one constraint per step and keeps the earlier ones", () => {
    expect(stepUpFor({ kind: "chunk" })).toBeNull();
    expect(stepUpFor({ kind: "paraphrase" })).toBeNull();
    expect(stepUpFor({ kind: "opinion" })!.length).toBe(3);
    expect(activeConstraints(card, 0).map(c => c.id)).toEqual(["brief"]);
    expect(activeConstraints(card, 2).map(c => c.id)).toEqual(["brief", "polite", "specific"]);
    expect(() => activeConstraints(card, 3)).toThrow();
  });
  it("constraints are Ukrainian instructions, never a Finnish model answer", () => {
    for (const k of ["reaction", "opinion", "clinic", "dialogue"] as const) for (const c of stepUpFor({ kind: k })!) {
      expect(c.uk + c.check_uk).not.toMatch(/[äöå]/i);
    }
  });
  it("each step is ungraded evidence with the learner's self-check; empty text or a missing check is refused", () => {
    const ev = stepUpEvidence(card, 1, "Voisitteko auttaa minua?", "partly");
    expect(ev).toMatchObject({ skill: "speaking", taskId: "reaction-01-step-polite", status: "ungraded" });
    expect(ev.response).toMatch(/^\[graduated step 2\/3: brief\+polite; self-check partly\] Voisitteko/);
    expect(() => stepUpEvidence(card, 0, "  ", "yes")).toThrow();
    expect(() => stepUpEvidence(card, 0, "Hei", "maybe" as never)).toThrow();
  });
  it("the writing clinic and dialogue role-plays have their own sequences (own text grows; no model, no key)", () => {
    expect(stepUpFor({ kind: "clinic" })!.map(c => c.id)).toEqual(["detail", "linked", "close"]);
    expect(stepUpFor({ kind: "dialogue" })!.map(c => c.id)).toEqual(["reason", "question", "next-step"]);
    for (const k of ["clinic", "dialogue"] as const) for (const c of stepUpFor({ kind: k })!) expect(c.uk).toMatch(/[а-яіїєґ]/i);
    const w = stepUpEvidence({ id: "clinic-01", kind: "clinic", transferSkill: "writing" }, 0, "Olen kotona tiistaina kello 17.", "yes");
    expect(w).toMatchObject({ skill: "writing", taskId: "clinic-01-step-detail", status: "ungraded" });
    const d = stepUpEvidence({ id: "ctx-dialog-01", kind: "dialogue", transferSkill: "speaking" }, 2, "Voisimmeko jatkaa huomenna?", "partly");
    expect(d).toMatchObject({ skill: "speaking", taskId: "ctx-dialog-01-step-next-step", status: "ungraded" });
    expect(d.response).toMatch(/^\[graduated step 3\/3: reason\+question\+next-step; self-check partly\]/);
  });
});
