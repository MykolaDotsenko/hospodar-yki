import { describe, expect, it } from "vitest";
import { byteRms, devicesNeeded, devicesPending, micResult, MIC_SILENCE_RMS } from "../src/deviceCheck.ts";

describe("device check before the rehearsal (TZ-EXAM-17)", () => {
  it("asks only for the devices the chosen skills need", () => {
    expect(devicesNeeded(null)).toEqual(["headphones", "microphone"]);
    expect(devicesNeeded(["reading", "writing"])).toEqual([]);
    expect(devicesNeeded(["listening"])).toEqual(["headphones"]);
    expect(devicesNeeded(["speaking"])).toEqual(["microphone"]);
  });
  it("measures loudness only: silence is a problem, a voice-like signal is ok", () => {
    expect(byteRms([])).toBe(0);
    expect(byteRms(new Array(512).fill(128))).toBe(0);
    const tone = Array.from({ length: 512 }, (_, i) => 128 + Math.round(40 * Math.sin(i / 5)));
    expect(byteRms(tone)).toBeGreaterThan(0.2);
    expect(micResult(0)).toBe("problem");
    expect(micResult(NaN)).toBe("problem");
    expect(micResult(MIC_SILENCE_RMS)).toBe("ok");
  });
  it("lists what is still unconfirmed; a problem is not hidden as done", () => {
    expect(devicesPending(null, { headphones: "ok", microphone: "problem" })).toEqual(["microphone"]);
    expect(devicesPending(["listening"], { headphones: "unchecked", microphone: "problem" })).toEqual(["headphones"]);
    expect(devicesPending(["reading"], { headphones: "unchecked", microphone: "unchecked" })).toEqual([]);
  });
});
