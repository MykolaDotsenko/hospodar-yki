import { describe, expect, it, vi } from "vitest";
import {
  LOW_HEADROOM_BYTES, formatStorageMiB, inspectBrowserStorage, isQuotaFailure,
  requestPersistentStorage, writeFailureAdvice, type StorageHost,
} from "./browserStorageHealth.ts";

const mib = 1024 * 1024;
describe("read-only browser storage inspection", () => {
  it("is graceful with unsupported private-mode APIs; never invents persistence or quota", async () => {
    expect(await inspectBrowserStorage(null)).toMatchObject({
      supported: false, persistence: "unknown", usageBytes: null, quotaBytes: null,
      lowHeadroom: false, canRequestPersistence: false,
    });
    expect(await inspectBrowserStorage({ storage: {} })).toMatchObject({
      supported: true, persistence: "unknown", usageBytes: null, inspectionFailed: false,
      canRequestPersistence: false,
    });
    expect(await requestPersistentStorage(null)).toBe("unsupported");
    expect(await requestPersistentStorage({ storage: {} })).toBe("unsupported");
  });
  it("checks existing persistence without prompting and labels quotas as rough origin estimates", async () => {
    const persist = vi.fn(async () => true);
    const persisted = vi.fn(async () => false);
    const host: StorageHost = { storage: { persist, persisted, estimate: async () =>
      ({ usage: 128 * mib, quota: 256 * mib }) } };
    const report = await inspectBrowserStorage(host);
    expect(report).toMatchObject({ supported: true, canRequestPersistence: true,
      persistence: "best-effort", usageBytes: 128 * mib, quotaBytes: 256 * mib,
      headroomBytes: 128 * mib, lowHeadroom: false });
    expect(persist).not.toHaveBeenCalled();
    expect(persisted).toHaveBeenCalledTimes(1);
    expect(formatStorageMiB(report.usageBytes)).toContain("128");
    expect(formatStorageMiB(null)).toBeNull();
    expect(LOW_HEADROOM_BYTES).toBe(64 * mib);
  });
  it("flags only a known low-headroom estimate, not unknown, impossible or negative numbers", async () => {
    const scarce = await inspectBrowserStorage({ storage: {
      persisted: async () => true, estimate: async () => ({ usage: 100 * mib, quota: 140 * mib }),
    } });
    expect(scarce).toMatchObject({ persistence: "persistent", headroomBytes: 40 * mib, lowHeadroom: true });
    const corrupt = await inspectBrowserStorage({ storage: {
      estimate: async () => ({ usage: 5000, quota: 3 }),
    } });
    expect(corrupt.headroomBytes).toBeNull();
    expect(corrupt.lowHeadroom).toBe(false);
    const invalid = await inspectBrowserStorage({ storage: {
      estimate: async () => ({ usage: Number.NaN, quota: -1 }),
    } });
    expect(invalid).toMatchObject({ usageBytes: null, quotaBytes: null, lowHeadroom: false });
  });
  it("keeps independently valid observations when one browser API throws", async () => {
    const r1 = await inspectBrowserStorage({ storage: {
      persisted: async () => { throw new Error("private tab"); },
      estimate: async () => ({ usage: 4 * mib, quota: 100 * mib }),
    } });
    expect(r1).toMatchObject({ persistence: "unknown", inspectionFailed: true,
      usageBytes: 4 * mib, lowHeadroom: false });
    const r2 = await inspectBrowserStorage({ storage: {
      persisted: async () => true,
      estimate: async () => { throw new Error("permission error"); },
    } });
    expect(r2).toMatchObject({ persistence: "persistent", inspectionFailed: true,
      quotaBytes: null, lowHeadroom: false });
  });
});

describe("explicit persisted-storage request", () => {
  it("never confuses persist() returning true with confirmed persisted()=false", async () => {
    const persist = vi.fn(async () => true);
    expect(await requestPersistentStorage({ storage: { persist, persisted: async () => false } })).toBe("denied");
    expect(persist).toHaveBeenCalledOnce();
  });
  it("reports grant only when persisted() confirms it; never trusts unverified requests", async () => {
    expect(await requestPersistentStorage({ storage: { persist: async () => true,
      persisted: async () => true } })).toBe("granted");
    expect(await requestPersistentStorage({ storage: { persist: async () => true } })).toBe("unverified");
    expect(await requestPersistentStorage({ storage: { persist: async () => { throw new Error("blocked"); },
      persisted: async () => false } })).toBe("error");
    expect(await requestPersistentStorage({ storage: { persist: async () => true,
      persisted: async () => { throw new Error("unknown"); } } })).toBe("error");
  });
});

describe("browser quota failures and actionable error UX", () => {
  it("recognises real and Dexie-wrapped browser quota errors, including Firefox", () => {
    const quota = new DOMException("Quota", "QuotaExceededError");
    expect(isQuotaFailure(quota)).toBe(true);
    expect(isQuotaFailure({ name: "ModifyError", inner: { name: "AbortError" }, cause: quota })).toBe(true);
    expect(isQuotaFailure({ inner: { cause: { name: "NS_ERROR_DOM_QUOTA_REACHED" } } })).toBe(true);
    expect(isQuotaFailure({ name: "UnknownError", code: 22 })).toBe(true);
  });
  it("does not mislabel generic AbortError or cyclic nested failures as disk full", () => {
    const cycle: { name: string; cause?: unknown } = { name: "AbortError" }; cycle.cause = cycle;
    expect(isQuotaFailure(cycle)).toBe(false);
    expect(isQuotaFailure({ inner: { name: "AbortError" } })).toBe(false);
    expect(isQuotaFailure(null)).toBe(false);
  });
  it("never advises that incomplete drafts are in the JSON backup", () => {
    expect(writeFailureAdvice({ code: "QUOTA_OR_DISK_FULL" })).toContain("не входять у JSON-копію");
    expect(writeFailureAdvice({ code: "REVISION_CONFLICT" })).toContain("іншій вкладці");
    expect(writeFailureAdvice({ code: "READBACK_MISMATCH" })).toContain("міг відбутися");
    expect(writeFailureAdvice({ code: "SAVE_FAILED" })).toContain("не підтверджене");
  });
});
