import { describe, expect, it } from "vitest";
import { mediationEvidence, MEDIATION_CHECK_UK, MEDIATION_MODES } from "../src/index.ts";

describe("mediation after reading (cefr-mediation-paraphrase)", () => {
  it("two realistic audiences: Ukrainian for a friend without Finnish, simpler Finnish for a neighbour", () => {
    expect(Object.keys(MEDIATION_MODES)).toEqual(["uk", "fi"]);
    expect(MEDIATION_MODES.fi.lang).toBe("fi");
    expect(MEDIATION_CHECK_UK).toHaveLength(3);
  });
  it("ungraded evidence: a Ukrainian relay counts as reading comprehension, simpler Finnish as writing; the self-check is counted, never scored", () => {
    const uk = mediationEvidence("ctx-reading-01-identity", "uk", "У бібліотеці відкривається мовне кафе.", [0, 2, 2, 9]);
    expect(uk).toMatchObject({ skill: "reading", taskId: "ctx-reading-01-identity-mediation", status: "ungraded" });
    expect(uk.response).toMatch(/^\[mediation to Ukrainian \(friend without Finnish\); self-check 2\/3\] У бібліотеці/);
    expect(mediationEvidence("x", "fi", "Kirjastossa on kahvila.", []).skill).toBe("writing");
    expect(() => mediationEvidence("x", "uk", " ", [])).toThrow();
  });
});
