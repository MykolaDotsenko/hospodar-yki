/**
 * Device check before an EXAM rehearsal (TZ-EXAM-17 headphone/mic part). Pure and deterministic.
 *
 *  - which devices the chosen skills need: listening → headphones/speakers, speaking → microphone;
 *  - the microphone verdict comes from loudness only (RMS of 8-bit time-domain samples); nothing is recorded or kept;
 *  - the headphone result is the learner's own report after a test tone — the app cannot hear the room;
 *  - the check advises, it does not block: a learner without a microphone still has the typed plan.
 * No OPH procedure is claimed; the official device check of the 2027 digital exam is not verified.
 */
import type { PrepSkill } from "./examPrep.ts";

export type Device = "headphones" | "microphone";
export type DeviceResult = "unchecked" | "ok" | "problem";
export type DeviceResults = Record<Device, DeviceResult>;

/** Below this RMS (0…1) the microphone picked up nothing that looks like speech. */
export const MIC_SILENCE_RMS = 0.02;

export function devicesNeeded(skills: readonly PrepSkill[] | null): Device[] {
  const s = skills ?? ["reading", "listening", "writing", "speaking"];
  return [...(s.includes("listening") ? ["headphones" as const] : []), ...(s.includes("speaking") ? ["microphone" as const] : [])];
}

/** RMS of unsigned 8-bit time-domain samples centred on 128 (AnalyserNode.getByteTimeDomainData), 0…1. */
export function byteRms(samples: ArrayLike<number>): number {
  if (!samples.length) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) { const v = ((samples[i] ?? 128) - 128) / 128; sum += v * v; }
  return Math.sqrt(sum / samples.length);
}

export function micResult(peakRms: number): Exclude<DeviceResult, "unchecked"> {
  return Number.isFinite(peakRms) && peakRms >= MIC_SILENCE_RMS ? "ok" : "problem";
}

/** Devices the chosen skills need that are not confirmed working yet. */
export function devicesPending(skills: readonly PrepSkill[] | null, results: DeviceResults): Device[] {
  return devicesNeeded(skills).filter(d => results[d] !== "ok");
}
