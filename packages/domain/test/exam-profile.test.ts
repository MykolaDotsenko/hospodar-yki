import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CRITICAL_PARAMETERS, createSession, examProfileHash, fidelityPanel, isVerifiedRecord, profileAvailability, validateExamProfile,
  validateExamProfileFile, type ExamProfile, type ExamProfileFile, type ExamParameterRecord } from "../src/index.ts";

const file: ExamProfileFile = JSON.parse(readFileSync(new URL("../../../learning/exercises/b1/exam-patterns/exam-profiles-v1.json", import.meta.url), "utf8"));
const byKind = (k: ExamProfile["kind"]) => structuredClone(file.profiles.find(p => p.kind === k)!);
const NOW = new Date("2026-11-11T12:00:00Z");
const observed = (parameter: string, extra: Partial<ExamParameterRecord> = {}): ExamParameterRecord => ({ parameter, value: false,
  source_url: "https://www.oph.fi/fi/koulutus-ja-tutkinnot/ennen-yki-testia", observed_on: "2026-11-10", applies_to: "oph_digital_demo",
  confidence: "high", reviewed_by: "tester A", e2e_test: null, ...extra });
const put = (p: ExamProfile, r: ExamParameterRecord) => ({ ...p, records: p.records.map(x => x.parameter === r.parameter ? r : x) });

describe("TZ-EXAM-02: every critical exam parameter is a record with its source; unknown stays null", () => {
  it("the repository file is valid: three profiles, every critical parameter listed, today all unknown (null)", () => {
    expect(validateExamProfileFile(file)).toEqual([]);
    expect(file.profiles.map(p => p.kind).sort()).toEqual(["LIVE_2027_VERIFIED", "OPH_DEMO_OBSERVED", "PRACTICE"]);
    for (const p of file.profiles) {
      expect(p.records.map(r => r.parameter).sort()).toEqual(CRITICAL_PARAMETERS.map(c => c.id).sort());
      expect(p.records.every(r => r.value === null)).toBe(true);
    }
  });
  it("a value without a source, date, reviewer or the right scope is refused; a missing parameter must be written as null", () => {
    const o = byKind("OPH_DEMO_OBSERVED");
    expect(validateExamProfile(put(o, observed("navigation.back_allowed", { source_url: null })))).toContain("VALUE_WITHOUT_SOURCE:navigation.back_allowed");
    expect(validateExamProfile(put(o, observed("navigation.back_allowed", { reviewed_by: " " })))).toContain("VALUE_WITHOUT_SOURCE:navigation.back_allowed");
    expect(validateExamProfile(put(o, observed("navigation.back_allowed", { applies_to: "legacy_paper" })))).toContain("VALUE_WITHOUT_SOURCE:navigation.back_allowed");
    expect(validateExamProfile(put(o, observed("navigation.back_allowed")))).toEqual([]);
    expect(validateExamProfile({ ...o, records: o.records.slice(1) })).toContain(`MISSING_PARAMETER:${CRITICAL_PARAMETERS[0]!.id}`);
    expect(validateExamProfile({ ...o, records: [...o.records, observed("timing.invented")] })).toContain("UNKNOWN_PARAMETER:timing.invented");
    expect(validateExamProfile(put(byKind("PRACTICE"), observed("navigation.back_allowed")))).toContain("PRACTICE_CANNOT_CLAIM:navigation.back_allowed");
  });
  it("the profile hash changes when any sourced value changes, so a started attempt keeps the version it began with", () => {
    const o = byKind("OPH_DEMO_OBSERVED");
    expect(examProfileHash(o)).toBe(examProfileHash(structuredClone(o)));
    expect(examProfileHash(put(o, observed("navigation.back_allowed")))).not.toBe(examProfileHash(o));
    const s = createSession("yki-mini-a", 0, NOW, "sess-1", { id: "practice", hash: examProfileHash(byKind("PRACTICE")) });
    expect(s).toMatchObject({ profileId: "practice", profileHash: examProfileHash(byKind("PRACTICE")) });
    expect(createSession("yki-mini-a", 0, NOW, "sess-1")).not.toHaveProperty("profileId");      // legacy parity unchanged
  });
});

describe("TZ-EXAM-03: three profiles; LIVE_2027_VERIFIED cannot be switched on with an unknown critical field", () => {
  it("today: practice selectable; OPH demo profile not selectable (no observation yet); live 2027 disabled", () => {
    expect(profileAvailability(byKind("PRACTICE"), file, NOW)).toMatchObject({ selectable: true });
    expect(profileAvailability(byKind("OPH_DEMO_OBSERVED"), file, NOW)).toMatchObject({ selectable: false, verified: 0, reason_uk: expect.stringContaining("TZ-EXAM-01") });
    expect(profileAvailability(byKind("LIVE_2027_VERIFIED"), file, NOW)).toMatchObject({ selectable: false, verified: 0, total: CRITICAL_PARAMETERS.length });
  });
  it("one real observation makes the OPH demo profile selectable; it turns stale after 30 days without a recheck", () => {
    const o = { ...put(byKind("OPH_DEMO_OBSERVED"), observed("navigation.back_allowed")), last_checked: "2026-11-10" };
    expect(profileAvailability(o, file, NOW)).toMatchObject({ selectable: true, stale: false, verified: 1 });
    expect(profileAvailability(o, file, new Date("2026-12-20T12:00:00Z"))).toMatchObject({ selectable: true, stale: true, reason_uk: expect.stringContaining("30") });
  });
  it("live 2027: an OPH-demo observation does not count; every field needs a live-2027 source AND an E2E test", () => {
    const live = byKind("LIVE_2027_VERIFIED");
    const all = (extra: Partial<ExamParameterRecord>) => ({ ...live, last_checked: "2026-11-10",
      records: CRITICAL_PARAMETERS.map(c => observed(c.id, { applies_to: "live_2027", e2e_test: "exam e2e title", ...extra })) });
    expect(profileAvailability(all({ applies_to: "oph_digital_demo" }), file, NOW).selectable).toBe(false);
    expect(validateExamProfile(all({ e2e_test: null })).some(e => e.startsWith("VALUE_WITHOUT_SOURCE"))).toBe(true);
    const almost = all({}); almost.records[3] = { ...almost.records[3]!, value: null, source_url: null, observed_on: null, applies_to: null, confidence: null, reviewed_by: null, e2e_test: null };
    expect(profileAvailability(almost, file, NOW)).toMatchObject({ selectable: false, verified: CRITICAL_PARAMETERS.length - 1 });
    expect(profileAvailability(all({}), file, NOW)).toMatchObject({ selectable: true, verified: CRITICAL_PARAMETERS.length });
    expect(isVerifiedRecord(byKind("PRACTICE"), observed("navigation.back_allowed"))).toBe(false);
  });
});

describe("TZ-EXAM-04: fidelity panel — six separate statuses, verified count and gaps, never one percentage", () => {
  it("today: F4/F5 unverified for every profile, F3/F6 unverified, all 18 critical parameters listed as gaps", () => {
    for (const p of file.profiles) {
      const panel = fidelityPanel(p, file);
      expect(panel.rows.map(r => r.dimension)).toEqual(["F1", "F2", "F3", "F4", "F5", "F6"]);
      expect(panel.rows.find(r => r.dimension === "F4")!.status).toBe("unverified");
      expect(panel.rows.find(r => r.dimension === "F5")!.status).toBe("unverified");
      expect(panel.rows.find(r => r.dimension === "F3")!.status).toBe("unverified");
      expect(panel.rows.find(r => r.dimension === "F6")!.status).toBe("unverified");
      expect(panel).toMatchObject({ verified: 0, total: CRITICAL_PARAMETERS.length });
      expect(panel.gaps).toHaveLength(CRITICAL_PARAMETERS.length);
      expect(JSON.stringify(panel)).not.toMatch(/\d\s*%/);
    }
  });
  it("F4/F5 follow the verified records of the chosen profile; F4/F5 cannot be declared, F3/F6 cannot be declared verified", () => {
    const o = put(byKind("OPH_DEMO_OBSERVED"), observed("navigation.back_allowed"));
    const panel = fidelityPanel(o, file);
    expect(panel.rows.find(r => r.dimension === "F5")).toMatchObject({ status: "partial", basis_uk: expect.stringContaining("Підтверджено 1 з") });
    expect(panel.rows.find(r => r.dimension === "F4")!.status).toBe("unverified");
    expect(panel.gaps).not.toContain("Повернення до попереднього питання");
    expect(validateExamProfileFile({ ...file, dimensions: [...file.dimensions, { dimension: "F4" as never, status: "verified", basis_uk: "x" }] })).toContain("DIMENSION_NOT_DECLARABLE:F4");
    expect(validateExamProfileFile({ ...file, dimensions: file.dimensions.map(d => d.dimension === "F6" ? { ...d, status: "verified" as const } : d) })).toContain("NEEDS_HUMAN_EVIDENCE:F6");
  });
});
