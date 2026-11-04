import { describe, expect, it } from "vitest";
import { addDiagnostic, blankState, buildDataExport, completeMission, isDeleteConfirmed, serialiseDataExport, verifyDataExport } from "../src/index.ts";

const T = new Date("2026-11-03T10:00:00Z");
const learned = () => addDiagnostic(
  completeMission(blankState(), { taskId: "b1-g-001", firstAnswer: "x", firstCorrect: false, transferText: "Oma lause." }, T),
  { skill: "writing", taskId: "w1", status: "ungraded", response: "Hei!" }, T);
const input = () => ({
  learn: { state: learned(), revision: 4, imports: [{ id: "import-abc", originalSha256: "a".repeat(64) }] },
  exam: { current: { session: { sessionId: "s1", finishedAt: null } }, history: [{ sessionId: "s0", bySkill: {} }] },
  exportedAt: T, contentVersion: "web-v1",
});

describe("My data export (LEARN-16 / WEB-07)", () => {
  it("contains every stored record in separate LEARN and EXAM sections, with counts that read back identically", () => {
    const d = buildDataExport(input());
    expect(d.counts).toEqual({ attempts: 1, diagnostics: 1, errors: 1, retention: 0, cards: 1, imports: 1, examCurrent: 1, examHistory: 1 });
    expect(d.learn.state.diagnostics[0]!.response).toBe("Hei!");
    expect(d.exam.history).toHaveLength(1);
    expect(verifyDataExport(serialiseDataExport(d))).toEqual({ ok: true, counts: d.counts });
  });
  it("adds no grade, level or YKI prediction to the raw records", () => {
    const text = serialiseDataExport(buildDataExport(input()));
    expect(text).not.toMatch(/officialGrade|ykiPass|predict|"level"|cefr|percent/i);
  });
  it("an empty profile exports cleanly (nothing stored is still a verifiable file)", () => {
    const d = buildDataExport({ learn: { state: blankState(), revision: 0, imports: [] }, exam: { current: null, history: [] }, exportedAt: T });
    expect(verifyDataExport(serialiseDataExport(d))).toMatchObject({ ok: true, counts: { attempts: 0, examCurrent: 0 } });
  });
  it("verification fails closed on damaged, foreign or tampered files", () => {
    const good = buildDataExport(input());
    expect(verifyDataExport("{not json")).toEqual({ ok: false, reason: "NOT_JSON" });
    expect(verifyDataExport(JSON.stringify({ ...good, format: "other" }))).toEqual({ ok: false, reason: "WRONG_FORMAT" });
    expect(verifyDataExport(JSON.stringify({ ...good, version: 2 }))).toEqual({ ok: false, reason: "UNSUPPORTED_VERSION" });
    expect(verifyDataExport(JSON.stringify({ ...good, learn: { ...good.learn, state: null } }))).toEqual({ ok: false, reason: "MALFORMED" });
    const dropped = { ...good, exam: { ...good.exam, history: [] } };
    expect(verifyDataExport(JSON.stringify(dropped))).toEqual({ ok: false, reason: "COUNT_MISMATCH" });
    expect(verifyDataExport(JSON.stringify({ ...good, counts: { ...good.counts, extra: 1 } }))).toEqual({ ok: false, reason: "COUNT_MISMATCH" });
  });
  it("rejects invalid input instead of writing a misleading file", () => {
    expect(() => buildDataExport({ ...input(), exportedAt: new Date("x") })).toThrow(TypeError);
    expect(() => buildDataExport({ ...input(), learn: { ...input().learn, revision: -1 } })).toThrow(TypeError);
  });
  it("deletion requires the exact typed phrase", () => {
    expect(isDeleteConfirmed("видалити ")).toBe(true);
    expect(isDeleteConfirmed("ВИДАЛИТИ")).toBe(true);
    for (const t of ["", "так", "delete", "ВИДАЛ"]) expect(isDeleteConfirmed(t)).toBe(false);
  });
});
