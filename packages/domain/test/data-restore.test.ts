import { describe, expect, it } from "vitest";
import { addDiagnostic, blankState, buildDataExport, completeMission, inspectWebLearnBackup,
  recordDelayedTransfer, serialiseDataExport, type TransferBank, type LearnerState } from "../src/index.ts";

const T = new Date("2026-11-04T10:00:00.000Z");
const saved = () => completeMission(blankState(), {
  taskId: "b1-g-001", firstAnswer: "kirjasto", firstCorrect: false,
  secondAnswer: "kirjastoon", repairCorrect: true, transferText: "Menen kirjastoon."
}, T);
const file = (state = saved(), imports: unknown[] = []) => serialiseDataExport(buildDataExport({
  learn: { state, revision: 2, imports },
  exam: { current: { session: { sessionId: "exam-1" } }, history: [{ sessionId: "exam-0" }] },
  exportedAt: T, contentVersion: "mini-rehearsals v1",
}));

describe("Web v1 LEARN restore inspection (fail closed)", () => {
  it("accepts its own full export, preserving independent attempts; explicitly identifies excluded EXAM", () => {
    const text = file(addDiagnostic(saved(), { skill: "speaking", taskId: "s1", status: "ungraded", response: "Hei." }, T));
    const r = inspectWebLearnBackup(text);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.attempts[0]!.firstAnswer).toBe("kirjasto");
    expect(r.state.attempts[0]!.repairCorrect).toBe(true);
    expect(r.state.diagnostics[0]!.status).toBe("ungraded");
    expect(r.counts.examHistory).toBe(1);
    expect(r.hasExamData).toBe(true);
  });
  it("preserves archived diagnostic identities in Web backup and rejects malformed archives", () => {
    const state = { ...saved(), archivedDiagnosticIds: ["old-choice", "old-choice-transfer"] };
    const r = inspectWebLearnBackup(file(state));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state).toEqual(state);
    for (const bad of [["duplicate", "duplicate"], ["bad id!"], [42], "old-choice", null]) {
      const raw = JSON.parse(file(state));
      raw.learn.state.archivedDiagnosticIds = bad;
      expect(inspectWebLearnBackup(JSON.stringify(raw))).toMatchObject({ ok: false, reason: "UNSAFE_LEARN_DATA" });
    }
    expect(inspectWebLearnBackup(file(saved()))).toMatchObject({ ok: true }); // older Web V1 exports remain valid
  });
  it("restores compact skill start dates with or without archived IDs and rejects invalid dates", () => {
    const state = { ...saved(), archivedSkillStartDates: { reading: "2024-02-29", writing: "2026-11-01" } };
    for (const candidate of [state, { ...state, archivedDiagnosticIds: ["old-id"] }]) {
      const r = inspectWebLearnBackup(file(candidate));
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.state).toEqual(candidate);
    }
    for (const bad of [{ reading: "2026-02-29" }, { reading: "2026-13-01" }, { writing: "2026-11-1" },
      { grammar: "2026-11-01" }, { speaking: null }, ["2026-11-01"], null]) {
      const raw = JSON.parse(file(state));
      raw.learn.state.archivedSkillStartDates = bad;
      expect(inspectWebLearnBackup(JSON.stringify(raw))).toMatchObject({ ok: false, reason: "UNSAFE_LEARN_DATA" });
    }
  });
  it("restores known archived first outcomes and rejects duplicate orphan or graded productive records", () => {
    const state: LearnerState = { ...saved(), archivedDiagnosticIds: ["r1", "w1", "unknown"],
      archivedFirstDiagnostics: [{ taskId: "r1", skill: "reading", outcome: "correct" }, { taskId: "w1", skill: "writing", outcome: "ungraded" }] };
    const r = inspectWebLearnBackup(file(state));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.state).toEqual(state);
    const good = state.archivedFirstDiagnostics![0]!;
    for (const bad of [null, {}, [good, good], [{ ...good, taskId: "orphan" }],
      [{ ...good, skill: "writing" }], [{ ...good, outcome: "perfect" }], [{ ...good, response: "private" }]]) {
      const raw = JSON.parse(file(state));
      raw.learn.state.archivedFirstDiagnostics = bad;
      expect(inspectWebLearnBackup(JSON.stringify(raw))).toMatchObject({ ok: false, reason: "UNSAFE_LEARN_DATA" });
    }
    const orphan = JSON.parse(file(state)); delete orphan.learn.state.archivedDiagnosticIds;
    expect(inspectWebLearnBackup(JSON.stringify(orphan))).toMatchObject({ ok: false, reason: "UNSAFE_LEARN_DATA" });
  });
  it("accepts an empty history without EXAM data", () => {
    const text = serialiseDataExport(buildDataExport({
      learn: { state: blankState(), revision: 0, imports: [] }, exam: { current: null, history: [] }, exportedAt: T,
    }));
    expect(inspectWebLearnBackup(text)).toMatchObject({ ok: true, hasExamData: false });
  });
  it("rejects corrupted, foreign, count-tampered and oversized files", () => {
    expect(inspectWebLearnBackup("{oops")).toMatchObject({ ok: false, reason: "NOT_JSON" });
    expect(inspectWebLearnBackup(JSON.stringify({ format: "foreign" }))).toMatchObject({ ok: false, reason: "WRONG_FORMAT" });
    const raw = JSON.parse(file());
    raw.counts.attempts = 99;
    expect(inspectWebLearnBackup(JSON.stringify(raw))).toMatchObject({ ok: false, reason: "COUNT_MISMATCH" });
    expect(inspectWebLearnBackup("x".repeat(8_000_001))).toMatchObject({ ok: false, reason: "TOO_LARGE" });
  });
  it("rejects malformed first answers, non-ISO dates and an invented graded speaking answer", () => {
    const raw = JSON.parse(file());
    raw.learn.state.attempts[0].firstCorrect = "yes";
    expect(inspectWebLearnBackup(JSON.stringify(raw))).toMatchObject({ ok: false, reason: "UNSAFE_LEARN_DATA" });
    raw.learn.state.attempts[0].firstCorrect = false;
    raw.learn.state.attempts[0].completedAt = "yesterday";
    expect(inspectWebLearnBackup(JSON.stringify(raw))).toMatchObject({ ok: false, reason: "UNSAFE_LEARN_DATA" });
    raw.learn.state.attempts[0].completedAt = T.toISOString();
    raw.learn.state.diagnostics = [{ skill: "speaking", taskId: "s1", status: "scored", correct: true, response: "", completedAt: T.toISOString() }];
    raw.counts.diagnostics = 1;
    expect(inspectWebLearnBackup(JSON.stringify(raw))).toMatchObject({ ok: false, reason: "UNSAFE_LEARN_DATA" });
  });
  it("rejects records that the tolerant V1 reader would silently lose", () => {
    const raw = JSON.parse(file());
    raw.learn.state.cards["b1-g-001"].stage = 99;
    expect(inspectWebLearnBackup(JSON.stringify(raw))).toMatchObject({ ok: false, reason: "UNSAFE_LEARN_DATA" });
    raw.learn.state.cards["b1-g-001"].stage = 0;
    raw.learn.state.attempts[0].unverified_extension = true;
    expect(inspectWebLearnBackup(JSON.stringify(raw))).toMatchObject({ ok: false, reason: "UNSAFE_LEARN_DATA" });
  });
  it("accepts complete legacy import receipts, rejects spoofed or duplicate IDs", () => {
    const receipt = { id: "import-aabb", source: "legacy_v1_file", originalSha256: "a".repeat(64),
      originalBytes: 230, counts: { attempts: 1, diagnostics: 0, errors: 1, retention: 0, cards: 1 },
      importedAt: T.toISOString(), revision: 1 };
    expect(inspectWebLearnBackup(file(saved(), [receipt]))).toMatchObject({ ok: true });
    expect(inspectWebLearnBackup(file(saved(), [receipt, receipt]))).toMatchObject({ ok: false, reason: "UNSAFE_IMPORT_RECEIPTS" });
    expect(inspectWebLearnBackup(file(saved(), [{ ...receipt, originalSha256: "bad" }]))).toMatchObject({ ok: false, reason: "UNSAFE_IMPORT_RECEIPTS" });
  });
});

describe("Regression: WEB-07 backup restore preserves real 7/14/30 retention entries", () => {
  const bank: TransferBank = { schema_version: "1.0.0", items: [{
    task_id: "b1-g-001", grammar_tag: "illatiivi", checkpoints: [
      { day: 7, prompt_fi: "Minne menet?" }, { day: 14, prompt_fi: "Miksi?" },
      { day: 30, prompt_fi: "Miten?" },
    ],
  }] };
  it("accepts the existing promptVersion field actually emitted by recordDelayedTransfer", () => {
    const first = completeMission(blankState(), {
      taskId: "b1-g-001", firstAnswer: "kirjasto", firstCorrect: false,
      secondAnswer: "kirjastoon", repairCorrect: true, transferText: "Menen kirjastoon."
    }, new Date("2026-10-01T10:00:00.000Z"));
    const delayed = recordDelayedTransfer(first, bank,
      { taskId: "b1-g-001", day: 7, response: "Huomenna menen töihin." },
      new Date("2026-10-09T10:00:00.000Z"));
    const r = inspectWebLearnBackup(file(delayed));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.retention[0]).toMatchObject({
      taskId: "b1-g-001", day: 7, response: "Huomenna menen töihin.",
      promptVersion: "1.0.0", status: "ungraded", independent: true
    });
    const raw = JSON.parse(file(delayed));
    raw.learn.state.retention[0].promptVersion = { fake: true };
    expect(inspectWebLearnBackup(JSON.stringify(raw))).toMatchObject({ ok: false, reason: "UNSAFE_LEARN_DATA" });
    raw.learn.state.retention[0].promptVersion = "1.0.0";
    raw.learn.state.retention[0].officialGrade = "YKI-4";
    expect(inspectWebLearnBackup(JSON.stringify(raw))).toMatchObject({ ok: false, reason: "UNSAFE_LEARN_DATA" });
  });
});
