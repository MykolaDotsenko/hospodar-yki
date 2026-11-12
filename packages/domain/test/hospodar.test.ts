import { describe, expect, it } from "vitest";
import { blankState, HOSPODAR_HOME, hospodarAtPlace, hospodarMoment, type LearnerState } from "../src/index.ts";

const at = (iso: string): LearnerState => ({ ...blankState(), diagnostics: [{ skill: "reading", taskId: "x-q1", status: "scored", correct: true, response: "", completedAt: iso }] });

describe("Господар persona: guides outside the task, never praises, never shames (DEC-06 revised, IV-14, MOT-04)", () => {
  it("a new learner is greeted; three or more calendar days without practice → a guilt-free welcome back", () => {
    expect(hospodarMoment(blankState(), new Date("2026-11-12T10:00:00"))).toBe("first_visit");
    expect(hospodarMoment(at("2026-11-10T22:00:00"), new Date("2026-11-12T08:00:00"))).toBe("regular");
    expect(hospodarMoment(at("2026-11-09T22:00:00"), new Date("2026-11-12T08:00:00"))).toBe("welcome_back");
    expect(hospodarMoment(at("2026-12-01T10:00:00"), new Date("2026-11-12T08:00:00"))).toBe("regular");   // future-dated record
  });
  it("his words never praise or rate, never pressure, and contain no streak, XP, level or score", () => {
    const all = [...Object.values(HOSPODAR_HOME), hospodarAtPlace(true), hospodarAtPlace(false)].join(" ");
    expect(all).not.toMatch(/молодець|чудово|супер|відмінно|стрік|\bXP\b|рівень|бал|рейтинг|не втрать|ти пропустив|шкода/i);
    expect(HOSPODAR_HOME.welcome_back).toMatch(/нічого не зникло/);
  });
});
