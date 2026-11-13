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
    for (const k of ["reaction", "opinion"] as const) for (const c of stepUpFor({ kind: k })!) {
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
});
