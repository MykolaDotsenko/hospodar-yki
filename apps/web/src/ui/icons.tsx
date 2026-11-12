/**
 * One hand-drawn icon family for the whole app (DESIGN-03, DESIGN-11): 24 px grid, 1.75 px round stroke, currentColor.
 * No emoji, no third-party icon font. Icons are decorative (aria-hidden): the text label always carries the meaning.
 */
import type { ReactNode } from "react";
import type { Skill } from "@hospodar/domain";

export type Accent = Skill | "grammar";
export type IconName = Accent | "practice" | "photo" | "media" | "start" | "steps" | "ok" | "mic" | "stop" | "key" | "home";

const PATHS: Record<IconName, ReactNode> = {
  reading: <><path d="M12 6.5c-2.6-1.6-5.4-1.8-8-.9v13c2.6-.9 5.4-.7 8 .9" /><path d="M12 6.5c2.6-1.6 5.4-1.8 8-.9v13c-2.6-.9-5.4-.7-8 .9z" /></>,
  listening: <><path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2" /><path d="M4.5 14h2.75v5.5H6A1.5 1.5 0 0 1 4.5 18z" /><path d="M19.5 14h-2.75v5.5H18a1.5 1.5 0 0 0 1.5-1.5z" /></>,
  writing: <><path d="M4.5 19.5l.9-3.9L16.6 4.4a2 2 0 0 1 2.9 2.9L8.4 18.6z" /><path d="M14.7 6.3l3 3" /></>,
  speaking: <><path d="M4.5 5.5h15v10.5H10.2L5.8 19.6V16H4.5z" /><path d="M8.3 9.3h7.4M8.3 12.3h4.6" /></>,
  grammar: <><path d="M3.5 7h17M3.5 17h11" /><path d="M3.5 12h3.5M17 12h3.5" /><rect x="9.2" y="9.8" width="5.6" height="4.4" rx="1" /></>,
  practice: <><rect x="4" y="7" width="16" height="12" rx="2" /><path d="M7 4h10" /><path d="M8 11.5h8M8 14.8h4.5" /></>,
  photo: <><path d="M4 8.5h3.2l1.5-2.2h6.6l1.5 2.2H20v10.5H4z" /><circle cx="12" cy="13.5" r="3.1" /></>,
  media: <><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="M10.2 9.4v5.2l4.6-2.6z" /></>,
  start: <><path d="M6.5 20.5V4" /><path d="M6.5 5h11l-2.4 3.4 2.4 3.4h-11" /></>,
  steps: <path d="M4 19.5h4v-5h4v-5h4v-5h4" />,
  ok: <path d="M5 12.6l4.4 4.4L19 7.4" />,
  mic: <><rect x="9" y="3.5" width="6" height="10.5" rx="3" /><path d="M5.8 11.2a6.2 6.2 0 0 0 12.4 0M12 17.4V20.5" /></>,
  stop: <rect x="6.5" y="6.5" width="11" height="11" rx="2" />,
  key: <><circle cx="8" cy="12" r="3.6" /><path d="M11.6 12h8.9M17.5 12v3M20.5 12v2.2" /></>,
  home: <><path d="M4 11.2L12 4.5l8 6.7" /><path d="M6.3 9.6V19.5h11.4V9.6" /><path d="M10.2 19.5v-5h3.6v5" /></>,
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{PATHS[name]}</svg>
  );
}
