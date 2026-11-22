/**
 * Study-time meter (research mode only). While the open screen belongs to a study area and the learner is enrolled,
 * a 5-second tick adds ACTIVE time (domain `activeMs`: visible screen and input within 2 minutes, or media playing;
 * a missed tick — sleep, background tab — adds nothing). Time is flushed to this device every 30 seconds, when the page
 * is hidden or closed, and when the screen changes. Not enrolled = no tick, no listener, nothing stored.
 */
import { useEffect } from "react";
import { activeMs, addStudyTime, localDate, type StudyArea } from "@hospodar/domain";
import { readEnrollment, updateStudyTime } from "../storage/research.ts";

export const TICK_MS = 5000;
const FLUSH_MS = 30_000;
const INPUTS = ["pointerdown", "keydown", "input", "wheel", "touchstart"] as const;

const mediaPlaying = () => Array.from(document.querySelectorAll<HTMLMediaElement>("audio, video")).some(m => !m.paused && !m.ended);

export function useStudyMeter(area: StudyArea | null): void {
  useEffect(() => {
    if (!area || !readEnrollment()) return;
    let last = Date.now(), lastInput = Date.now(), pending = 0;
    const onInput = () => { lastInput = Date.now(); };
    const tick = () => {
      const now = Date.now();
      pending += activeMs({ previousTickMs: last, nowMs: now, visible: document.visibilityState === "visible", lastInputMs: lastInput, mediaPlaying: mediaPlaying() });
      last = now;
      if (pending >= FLUSH_MS) flush();
    };
    const flush = () => {
      const seconds = Math.floor(pending / 1000);
      if (seconds <= 0) return;
      try {
        // Not enrolled any more (withdrawn or erased in another tab): drop the time, never resurrect the log.
        updateStudyTime(log => addStudyTime(log, localDate(), area, seconds));
        pending -= seconds * 1000;
      } catch { /* the browser refused the write: keep the time and try again on the next flush */ }
    };
    const onHidden = () => { tick(); if (document.visibilityState === "hidden") flush(); };
    const onPageHide = () => { tick(); flush(); };
    for (const t of INPUTS) addEventListener(t, onInput, { capture: true, passive: true });
    document.addEventListener("visibilitychange", onHidden);
    addEventListener("pagehide", onPageHide);
    const id = setInterval(tick, TICK_MS);
    return () => {
      clearInterval(id);
      for (const t of INPUTS) removeEventListener(t, onInput, { capture: true });
      document.removeEventListener("visibilitychange", onHidden);
      removeEventListener("pagehide", onPageHide);
      tick(); flush();
    };
  }, [area]);
}
