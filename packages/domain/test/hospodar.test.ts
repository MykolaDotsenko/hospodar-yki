import { describe, expect, it } from "vitest";
import { blankState, HOSPODAR_TEACHINGS, hospodarAtPlace, hospodarHome, hospodarMoment, hospodarTeaching, type LearnerState } from "../src/index.ts";

const at = (iso: string): LearnerState => ({ ...blankState(), diagnostics: [{ skill: "reading", taskId: "x-q1", status: "scored", correct: true, response: "", completedAt: iso }] });
const now = new Date("2026-11-12T08:00:00");

describe("Господар — master and mentor: guides outside the task, never praises, never shames (DEC-06 revised, IV-14, MOT-04)", () => {
  it("a new learner is greeted; three or more calendar days without practice → a guilt-free welcome back", () => {
    expect(hospodarMoment(blankState(), now)).toBe("first_visit");
    expect(hospodarMoment(at("2026-11-10T22:00:00"), now)).toBe("regular");
    expect(hospodarMoment(at("2026-11-09T22:00:00"), now)).toBe("welcome_back");
    expect(hospodarMoment(at("2026-12-01T10:00:00"), now)).toBe("regular");          // future-dated record
  });
  it("on ordinary days he gives one master's teaching, the same all day and a different one tomorrow", () => {
    expect(hospodarHome("regular", now)).toBe(hospodarTeaching(new Date("2026-11-12T23:30:00")));
    expect(hospodarTeaching(now)).not.toBe(hospodarTeaching(new Date("2026-11-13T08:00:00")));
    expect(HOSPODAR_TEACHINGS.every(t => t.startsWith("Наука майстра:"))).toBe(true);
  });
  it("his words never praise or rate, never pressure or promise a YKI pass, and contain no streak, XP, level or score", () => {
    const all = [hospodarHome("first_visit", now), hospodarHome("welcome_back", now), ...HOSPODAR_TEACHINGS, hospodarAtPlace(true), hospodarAtPlace(false)].join(" ");
    expect(all).not.toMatch(/молодець|чудово|супер|відмінно|стрік|\bXP\b|рівень|\bбал|рейтинг|не втрать|ти пропустив|шкода|складеш|гарантую/i);
    expect(hospodarHome("welcome_back", now)).toMatch(/не рахує пропущених днів/);
  });
});
