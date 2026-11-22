import { beforeEach, describe, expect, it } from "vitest";
import { addStudyTime, CONSENT_ITEMS, enroll } from "@hospodar/domain";
import { clearResearch, ENROLLMENT_KEY, hasResearchData, readEnrollment, readStudyTime, STUDY_TIME_KEY, updateStudyTime, writeEnrollment } from "./research.ts";

/** A Map-backed localStorage; `refuse` makes writes silently fail (quota, private mode). */
function fakeStorage() {
  const m = new Map<string, string>();
  const s = { refuse: false, getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { if (!s.refuse) m.set(k, v); },
    removeItem: (k: string) => { if (!s.refuse) m.delete(k); } };
  (globalThis as unknown as { localStorage: typeof s }).localStorage = s;
  return s;
}
const enrolment = () => enroll("HY24", CONSENT_ITEMS.map(c => c.id), new Date("2026-11-10T10:00:00+02:00"));

describe("research storage (opt-in, verified writes, verified deletion)", () => {
  let store: ReturnType<typeof fakeStorage>;
  beforeEach(() => { store = fakeStorage(); });

  it("never stores study time before enrolment", () => {
    expect(updateStudyTime(log => addStudyTime(log, "2026-11-10", "reading", 60))).toBe(false);
    expect(store.getItem(STUDY_TIME_KEY)).toBeNull();
    expect(hasResearchData()).toBe(false);
  });
  it("after enrolment adds to what is stored now and reads it back", () => {
    writeEnrollment(enrolment());
    expect(readEnrollment()?.studyCode).toBe("HY24");
    updateStudyTime(log => addStudyTime(log, "2026-11-10", "reading", 60));
    updateStudyTime(log => addStudyTime(log, "2026-11-10", "reading", 30));
    expect(readStudyTime().days).toEqual({ "2026-11-10": { reading: 90 } });
  });
  it("time counted under one enrolment is never added to a later one (withdraw and re-enrol in another tab)", () => {
    const first = enrolment();
    writeEnrollment(first);
    clearResearch();
    writeEnrollment(enroll("HY24", CONSENT_ITEMS.map(c => c.id), new Date("2026-11-11T10:00:00+02:00")));
    expect(updateStudyTime(log => addStudyTime(log, "2026-11-10", "reading", 60), first.enrolledAt)).toBe(false);
    expect(readStudyTime().days).toEqual({});
    expect(updateStudyTime(log => addStudyTime(log, "2026-11-11", "reading", 60), readEnrollment()!.enrolledAt)).toBe(true);
  });
  it("a refused write is reported, never faked", () => {
    store.refuse = true;
    expect(() => writeEnrollment(enrolment())).toThrow("READBACK_MISMATCH");
    expect(readEnrollment()).toBeNull();
  });
  it("withdrawal removes the enrolment and the time log and verifies it; a damaged record reads as not enrolled", () => {
    writeEnrollment(enrolment());
    updateStudyTime(log => addStudyTime(log, "2026-11-10", "exam", 5));
    clearResearch();
    expect(hasResearchData()).toBe(false);
    expect(updateStudyTime(log => addStudyTime(log, "2026-11-10", "exam", 5))).toBe(false);     // a late tick cannot resurrect it
    store.setItem(ENROLLMENT_KEY, "{not json");
    expect(readEnrollment()).toBeNull();
    store.refuse = true;
    expect(() => clearResearch()).toThrow("DELETE_NOT_VERIFIED");
  });
});
