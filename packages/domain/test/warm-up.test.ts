import { describe, expect, it } from "vitest";
import { blankState, startWarmUp, warmUpCards, warmUpReducer, warmUpView, WarmUpError, WARM_UP_SIZE, type LearnerState } from "../src/index.ts";

const c = (id: string, group = "services", kind = "chunk") => ({ id, kind, group });
const bank = [c("a"), c("b"), c("c"), c("d"), c("e"), c("x", "housing"), c("r", "services", "rektio")];
const card = (due: string) => ({ stage: 1, due, reviews: 1, failures: 1, lastCorrect: false, lastReviewed: "2026-11-01T10:00:00Z" });

describe("«Перед справою» warm-up (mobile-contextual-micropractice)", () => {
  it("picks phrase cards of this place only: due reviews first (oldest first), then phrases not met yet, then the rest", () => {
    const s: LearnerState = { ...blankState(), cards: { d: card("2026-11-18"), e: card("2026-11-10"), b: card("2026-12-01") },
      diagnostics: [{ skill: "writing", taskId: "a-transfer", status: "ungraded", response: "x", completedAt: "2026-11-01T10:00:00Z" }] };
    expect(warmUpCards(bank, "services", s, "2026-11-19").map(x => x.id)).toEqual(["e", "d", "c"]);
    expect(warmUpCards(bank, "services", blankState(), "2026-11-19").map(x => x.id)).toEqual(["a", "b", "c"]);
    expect(warmUpCards(bank, "housing", blankState(), "2026-11-19").map(x => x.id)).toEqual(["x"]);   // fewer than three: what there is
    expect(warmUpCards(bank, "work", blankState(), "2026-11-19")).toEqual([]);
    expect(WARM_UP_SIZE).toBe(3);
  });

  it("warm-up prefers genuinely fresh phrases over archived ones", () => {
    const s = { ...blankState(), archivedDiagnosticIds: ["a-transfer", "b"] };
    expect(warmUpCards(bank, "services", s, "2026-11-19").map(x => x.id)).toEqual(["c", "d", "e"]);
    const scheduled = { ...s, cards: { a: card("2026-11-18") } };
    expect(warmUpCards(bank, "services", scheduled, "2026-11-19").map(x => x.id)).toEqual(["a", "c", "d"]);
  });

  it("the phrase is shown only after the own try, the try is frozen, an honest 'not recalled' is not a wrong answer; nothing is scored", () => {
    let s = startWarmUp("services", ["a", "b"]);
    expect(warmUpView(s)).toMatchObject({ phase: "try", cardId: "a", revealed: false, ownTry: null, step: 1, of: 2 });
    expect(() => warmUpReducer(s, { type: "TRY", text: "  " })).toThrow(WarmUpError);
    expect(() => warmUpReducer(s, { type: "NEXT" })).toThrow(/not allowed/);                       // no peeking past a card
    s = warmUpReducer(s, { type: "TRY", text: "Saisinko kuitin?" });
    expect(warmUpView(s)).toMatchObject({ phase: "shown", revealed: true, ownTry: "Saisinko kuitin?" });
    expect(() => warmUpReducer(s, { type: "TRY", text: "toinen" })).toThrow(/not allowed/);         // the own try is frozen
    s = warmUpReducer(warmUpReducer(s, { type: "NEXT" }), { type: "NOT_RECALLED" });
    expect(warmUpView(s)).toMatchObject({ cardId: "b", revealed: true, ownTry: null });
    s = warmUpReducer(s, { type: "NEXT" });
    expect(warmUpView(s)).toMatchObject({ phase: "first_line", cardId: null });
    expect(() => warmUpReducer(s, { type: "FIRST_LINE", text: "" })).toThrow(WarmUpError);
    s = warmUpReducer(s, { type: "FIRST_LINE", text: "Hei, haluaisin palauttaa tämän." });
    expect(warmUpView(s)).toMatchObject({ phase: "done", firstLine: "Hei, haluaisin palauttaa tämän." });
    expect(JSON.stringify(s)).not.toMatch(/score|correct|grade/i);
    expect(() => startWarmUp("work", [])).toThrow(/No phrase cards/);
  });
});
