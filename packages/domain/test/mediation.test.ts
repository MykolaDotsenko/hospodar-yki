import { describe, expect, it } from "vitest";
import { mediationEvidence, mediationModes, MEDIATION_CHECK_UK, MEDIATION_MODES } from "../src/index.ts";

describe("mediation after reading or listening (cefr-mediation-paraphrase)", () => {
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
  it("after listening, a Ukrainian relay counts as listening comprehension; simpler Finnish stays writing; both ungraded", () => {
    const uk = mediationEvidence("b1long-03", "uk", "Сусід каже, що повернення працює через пункт видачі.", [0, 2], "listening");
    expect(uk).toMatchObject({ skill: "listening", taskId: "b1long-03-mediation", status: "ungraded" });
    expect(uk.response).toMatch(/^\[mediation from listening to Ukrainian \(friend without Finnish\); self-check 2\/3\]/);
    expect(mediationEvidence("b1long-03", "fi", "Paketti palautetaan.", [], "listening").skill).toBe("writing");
    expect(() => mediationEvidence("x", "uk", "Текст", [], "video" as never)).toThrow("SOURCE");
    expect(mediationModes("listening").uk.label_uk).toMatch(/не розуміє фінської/);
    expect(mediationModes("listening").fi.field_uk).toMatch(/ніж у записі/);
    expect(mediationModes()).toBe(MEDIATION_MODES);
  });
});

