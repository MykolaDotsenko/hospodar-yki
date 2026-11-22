/**
 * Study-time meter (research mode only). While the open screen belongs to a study area and the learner is enrolled,
 * a 5-second tick adds ACTIVE time (domain `activeMs`: a visible page and either media playing, or this window focused
 * with input within 2 minutes; a missed tick — sleep, background tab — adds nothing). Time is flushed to this device
 * every 30 seconds, when the page is hidden or closed, when the screen changes and at local midnight (so each day keeps
 * its own time). Not enrolled = no tick, no listener, nothing stored. Enrolling or withdrawing in another tab restarts it.
 */
import { useEffect, useState } from "react";
import { activeMs, addStudyTime, localDate, type StudyArea } from "@hospodar/domain";
import { onResearchChanged, readEnrollment, updateStudyTime } from "../storage/research.ts";

export const TICK_MS = 5000;
const FLUSH_MS = 30_000;
const INPUTS = ["pointerdown", "keydown", "input", "wheel", "touchstart"] as const;

const mediaPlaying = () => Array.from(document.querySelectorAll<HTMLMediaElement>("audio, video")).some(m => !m.paused && !m.ended);
const isVisible = () => document.visibilityState === "visible";

export function useStudyMeter(area: StudyArea | null): void {
  // Another tab enrolled, withdrew or erased: re-read the enrolment (the `storage` event never fires in this tab).
  const [researchVersion, setResearchVersion] = useState(0);
  useEffect(() => onResearchChanged(() => setResearchVersion(v => v + 1)), []);
  useEffect(() => {
    const enrolledAt = readEnrollment()?.enrolledAt;
    if (!area || !enrolledAt) return;
    let last = Date.now(), lastInput = Date.now(), pending = 0, pendingDay = localDate();
    let visibleSinceLastTick = isVisible();               // the state the page had during the interval being counted
    const onInput = () => { lastInput = Date.now(); };
    const flush = () => {
      const seconds = Math.floor(pending / 1000);
      if (seconds <= 0) return;
      try {
        // Not enrolled any more, or enrolled anew (another tab): drop the time instead of moving it to another participation.
        if (!updateStudyTime(log => addStudyTime(log, pendingDay, area, seconds), enrolledAt)) { pending = 0; return; }
        pending -= seconds * 1000;
      } catch { /* the browser refused the write: keep the time and try again on the next flush */ }
    };
    const tick = () => {
      const now = Date.now(), today = localDate(new Date(now));
      // Midnight: the old day keeps its time; a remainder the browser refused to write is dropped, never moved to the new day.
      if (today !== pendingDay) { flush(); pending = 0; pendingDay = today; }
      pending += activeMs({ previousTickMs: last, nowMs: now, visible: visibleSinceLastTick, focused: document.hasFocus(),
        lastInputMs: lastInput, mediaPlaying: mediaPlaying() });
      last = now;
      if (pending >= FLUSH_MS) flush();
    };
    const onVisibility = () => {
      tick();                                             // closes the interval with the visibility it HAD
      visibleSinceLastTick = isVisible();
      if (!visibleSinceLastTick) flush();
    };
    const onPageHide = () => { tick(); flush(); };
    for (const t of INPUTS) addEventListener(t, onInput, { capture: true, passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    addEventListener("pagehide", onPageHide);
    const id = setInterval(tick, TICK_MS);
    return () => {
      clearInterval(id);
      for (const t of INPUTS) removeEventListener(t, onInput, { capture: true });
      document.removeEventListener("visibilitychange", onVisibility);
      removeEventListener("pagehide", onPageHide);
      tick(); flush();
    };
  }, [area, researchVersion]);
}
