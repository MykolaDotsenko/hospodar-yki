import { useRef, type ReactNode, type Ref } from "react";
import { mediaRules, NORMAL_RATE, rateVerdict, type MediaContext } from "@hospodar/domain";

/**
 * The one player for a task recording: the LEARN listening mission, the delayed listening check and the EXAM
 * rehearsal (media rules, packages/domain/src/mediaRules.ts; docs/29 stage 3).
 *
 * - The learner starts the sound: no autoplay, nothing loads ahead (`preload="none"`).
 * - The browser's own speed menu is hidden in tasks and the exam (`controlsList="noplaybackrate"`).
 * - A speed changed by any other route is checked:
 *   - in a LEARN task, a slower speed is put back to 1× and handed to `onSlower`, so the screen records the help
 *     durably before it slows down;
 *   - in the EXAM, any change goes back to 1×.
 *
 * `supportRecorded` is a function so the check reads the screen's latest state, not the state of the last render.
 */
export function TaskAudio({ context, src, label, audioRef, onPlay, onSlower, supportRecorded, children }: {
  context: MediaContext; src: string; label?: string; audioRef?: Ref<HTMLAudioElement>;
  onPlay?: () => void; onSlower?: () => void; supportRecorded?: () => boolean; children?: ReactNode;
}) {
  const rules = mediaRules(context);
  const own = useRef<HTMLAudioElement | null>(null);
  const setRef = (el: HTMLAudioElement | null) => {
    own.current = el;
    if (typeof audioRef === "function") audioRef(el);
    else if (audioRef) (audioRef as { current: HTMLAudioElement | null }).current = el;
  };
  return (
    <audio ref={setRef} controls preload="none" src={src} aria-label={label} data-media-context={context}
      controlsList={rules.nativeSpeedMenu ? "nodownload" : "nodownload noplaybackrate"}
      onPlay={onPlay}
      onRateChange={e => {
        const a = e.currentTarget;
        const verdict = rateVerdict(context, a.playbackRate, supportRecorded?.() ?? false);
        if (verdict === "ok") return;
        a.playbackRate = NORMAL_RATE;                                   // never slower before the help is on record
        if (verdict === "support") onSlower?.();
      }}>
      {children}
    </audio>
  );
}
