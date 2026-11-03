/**
 * Behaviour parity: the TypeScript domain must produce exactly what the running
 * legacy app/core.mjs produces for the same inputs (ADR-022 phase 1, G2 parity gate).
 * Runs under TZ=Europe/Helsinki (see package.json) to cover Finnish DST transitions.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
// @ts-expect-error legacy JS module without types
import * as legacy from "../../../app/core.mjs";
import * as domain from "../src/index.ts";

const cloze = JSON.parse(readFileSync(new URL("../../../learning/exercises/b1/grammar/contextual-cloze.json", import.meta.url), "utf8"));
const tasks: domain.ClozeTask[] = cloze.exercises;

const days = ["2026-03-28T22:30:00Z", "2026-03-29T00:30:00Z", "2026-10-24T21:30:00Z", "2026-10-25T00:59:00Z",
  "2026-12-31T22:30:00Z", "2027-02-28T21:59:00Z", "2026-11-03T10:00:00Z"].map(d => new Date(d));

describe("constants and normalisation", () => {
  it("same storage key, intervals and version", () => {
    expect(domain.STORAGE_KEY).toBe(legacy.STORAGE_KEY);
    expect([...domain.INTERVAL_DAYS]).toEqual([...legacy.INTERVAL_DAYS]);
    expect(domain.VERSION).toBe(legacy.VERSION);
  });
  it("normalizeFinnish matches on tricky Finnish input", () => {
    for (const s of ["  Helsingissä. ", "HELSINGISSÄ!", "Äiti", "äiti", "  kahvista   ja\tteestä?? ", "", null, undefined, 12])
      expect(domain.normalizeFinnish(s)).toBe(legacy.normalizeFinnish(s));
  });
});

describe("checkCloze parity on every real exercise", () => {
  it(`all ${tasks.length} exercises × key, alternatives, wrong, empty, case/space variants`, () => {
    expect(tasks.length).toBeGreaterThanOrEqual(28);
    for (const t of tasks) {
      const inputs = [t.answer_fi, ...(t.accepted_alternatives_fi ?? []), ` ${t.answer_fi.toUpperCase()}. `,
        t.answer_fi.slice(0, -1), "", "   ", "väärä"];
      for (const a of inputs) expect(domain.checkCloze(t, a)).toEqual(legacy.checkCloze(t, a));
    }
  });
});

describe("SRS parity across DST and year boundaries", () => {
  it("updateCard sequences match legacy for success/failure patterns", () => {
    const patterns = [[true, true, true, true, true, true], [false, true, true], [true, false, true, true], [false, false]];
    for (const now of days) for (const p of patterns) {
      let a: unknown = null, b: domain.Card | null = null;
      for (const ok of p) { a = legacy.updateCard(a, ok, now); b = domain.updateCard(b, ok, now); expect(b).toEqual(a); }
    }
  });
  it("localDate / plusLocalDays match", () => {
    for (const now of days) {
      expect(domain.localDate(now)).toBe(legacy.localDate(now));
      for (const n of [1, 3, 7, 14, 30]) expect(domain.plusLocalDays(now, n)).toBe(legacy.plusLocalDays(now, n));
    }
  });
});

describe("mission completion, readState and summaries", () => {
  const now = new Date("2026-11-03T10:00:00Z");
  const missions: domain.MissionResult[] = [
    { taskId: tasks[0]!.id!, grammarTag: "inessiivi", firstAnswer: "x", firstCorrect: false, secondAnswer: "y", repairCorrect: true, transferText: "Asun Espoossa." },
    { taskId: tasks[1]!.id!, firstAnswer: tasks[1]!.answer_fi, firstCorrect: true, transferText: "Oma lause." },
    { taskId: tasks[0]!.id!, firstAnswer: "z", firstCorrect: false, transferText: "Toinen." },
  ];
  it("completeMission produces identical state, including error log and first-attempt record", () => {
    let a = legacy.blankState(), b = domain.blankState();
    for (const m of missions) { a = legacy.completeMission(a, m, now); b = domain.completeMission(b, m, now); }
    expect(b).toEqual(a);
    expect(domain.dueCards(b, "2026-11-04")).toEqual(legacy.dueCards(a, "2026-11-04"));
  });
  it("rejects the same invalid missions", () => {
    for (const bad of [{ taskId: "", firstAnswer: "a", firstCorrect: true, transferText: "t" },
      { taskId: "x", firstAnswer: "a", firstCorrect: true, transferText: " " },
      { taskId: "x", firstAnswer: "a", transferText: "t" }]) {
      expect(() => legacy.completeMission(legacy.blankState(), bad, now)).toThrow();
      expect(() => domain.completeMission(domain.blankState(), bad as domain.MissionResult, now)).toThrow();
    }
  });
  it("readState accepts/filters/recovers identically (valid, legacy-without-retention, corrupt, caps)", () => {
    let full = domain.blankState();
    for (const m of missions) full = domain.completeMission(full, m, now);
    full = domain.addDiagnostic(full, { skill: "reading", taskId: "r1", status: "scored", correct: true }, now);
    const noRetention: Record<string, unknown> = { ...full }; delete noRetention.retention;
    const many = { ...full, attempts: Array.from({ length: 150 }, (_, i) => ({ taskId: "t" + i })),
      cards: { ...full.cards, "bad id!": { stage: 1, due: "2026-11-04" }, ok2: { stage: 9, due: "2026-11-04" } } };
    for (const raw of [JSON.stringify(full), JSON.stringify(noRetention), JSON.stringify(many), "{broken", '{"version":2}', "", null])
      expect(domain.readState(raw)).toEqual(legacy.readState(raw));
  });
  it("diagnostics and skill summary match; productive skills cannot be scored", () => {
    let a = legacy.blankState(), b = domain.blankState();
    const ds = [{ skill: "reading", taskId: "r1", status: "scored", correct: true }, { skill: "listening", taskId: "l1", status: "scored", correct: false },
      { skill: "writing", taskId: "w1", status: "ungraded", response: "Hei" }] as const;
    for (const d of ds) { a = legacy.addDiagnostic(a, d, now); b = domain.addDiagnostic(b, d, now); }
    expect(b).toEqual(a);
    expect(domain.skillSummary(b)).toEqual(legacy.skillSummary(a));
    expect(() => domain.addDiagnostic(b, { skill: "writing", taskId: "w2", status: "scored", correct: true }, now)).toThrow();
  });
});
