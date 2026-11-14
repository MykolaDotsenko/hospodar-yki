import { describe, expect, it } from "vitest";
import { hasInterlocutorLadder, interlocutorEvidence, INTERLOCUTOR_LADDER, REGISTER_NOTE_UK } from "../src/index.ts";

const reaction = { id: "react-01", kind: "reaction" as const, attemptSkill: "speaking" as const };

describe("interlocutor change in speech acts (pragmatic-speech-acts)", () => {
  it("the same act for three listeners in order, each with its own appropriateness self-check in Ukrainian", () => {
    expect(INTERLOCUTOR_LADDER.map(s => s.id)).toEqual(["friend", "neighbour", "official"]);
    for (const s of INTERLOCUTOR_LADDER) {
      expect(s.checks_uk.length).toBe(3);
      expect(s.cue_uk).toMatch(/[а-яіїєґ]/i);
    }
    expect(REGISTER_NOTE_UK).toMatch(/«sinä»/);                     // no fake rule: sinä is common with officials too
  });
  it("only reaction cards have the ladder", () => {
    expect(hasInterlocutorLadder({ kind: "reaction" })).toBe(true);
    for (const kind of ["opinion", "chunk", "rektio", "paraphrase"] as const) expect(hasInterlocutorLadder({ kind })).toBe(false);
  });
  it("evidence is ungraded, per listener, and carries the self-check as a count — never a score", () => {
    const e = interlocutorEvidence(reaction, "official", "  Voisitteko auttaa minua?  ", [0, 2]);
    expect(e).toEqual({ skill: "speaking", taskId: "react-01-register-official", status: "ungraded",
      response: "[register: official; appropriateness self-check 2/3] Voisitteko auttaa minua?" });
    expect(interlocutorEvidence(reaction, "friend", "Autatko?", []).response).toMatch(/self-check 0\/3/);
  });
  it("refuses empty replies, bad self-check marks, unknown listeners and non-reaction cards", () => {
    expect(() => interlocutorEvidence(reaction, "friend", " ", [])).toThrow("EMPTY");
    expect(() => interlocutorEvidence(reaction, "friend", "Moi", [3])).toThrow("BAD_CHECK");
    expect(() => interlocutorEvidence(reaction, "friend", "Moi", [1, 1])).toThrow("BAD_CHECK");
    expect(() => interlocutorEvidence(reaction, "boss" as never, "Moi", [])).toThrow("UNKNOWN_INTERLOCUTOR");
    expect(() => interlocutorEvidence({ ...reaction, kind: "opinion" as never }, "friend", "Moi", [])).toThrow("NOT_A_REACTION");
  });
});
