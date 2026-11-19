/**
 * The learner's marks that they watched a practice video's model answers (MOCK-VID-08). On this device only; erased with
 * the exam rehearsal data; never exported or counted. Every write is read back; a failed write is reported.
 */
import { emptyVideoExposure, parseVideoExposure, type VideoExposureLog } from "@hospodar/domain";

export const VIDEO_EXPOSURE_KEY = "hospodar-yki:web:video-exposure:v1";

export function readVideoExposure(): VideoExposureLog {
  try { const raw = localStorage.getItem(VIDEO_EXPOSURE_KEY); return raw ? parseVideoExposure(JSON.parse(raw)) : emptyVideoExposure(); }
  catch { return emptyVideoExposure(); }
}
export function updateVideoExposure(change: (current: VideoExposureLog) => VideoExposureLog): VideoExposureLog {
  const next = change(readVideoExposure());
  const text = JSON.stringify(next);
  localStorage.setItem(VIDEO_EXPOSURE_KEY, text);
  if (localStorage.getItem(VIDEO_EXPOSURE_KEY) !== text) throw new Error("READBACK_MISMATCH");
  return next;
}
export const hasVideoExposure = () => Object.keys(readVideoExposure().seen).length > 0;
export function clearVideoExposure(): void {
  localStorage.removeItem(VIDEO_EXPOSURE_KEY);
  if (localStorage.getItem(VIDEO_EXPOSURE_KEY) !== null) throw new Error("DELETE_NOT_VERIFIED");
}
