/**
 * Shared mission chrome — the brand's own screen grammar instead of a generic card (DESIGN-02, DESIGN-03, DESIGN-08):
 *   Eyebrow         skill icon + name in the skill's constant colour (colour is never the only carrier: icon + text)
 *   ThresholdRoute  the "threshold line": the REAL steps of this task with a text state for screen readers —
 *                   never a score, percentage or readiness bar.
 */
import type { ReactNode } from "react";
import type { Skill } from "@hospodar/domain";
import { Icon, type Accent } from "./icons.tsx";

export const SKILL_UK: Record<Skill, string> = { reading: "Читання", listening: "Аудіювання", writing: "Письмо", speaking: "Говоріння" };
export const SKILL_FI: Record<Skill, string> = { reading: "Tekstin ymmärtäminen", listening: "Puheen ymmärtäminen", writing: "Kirjoittaminen", speaking: "Puhuminen" };

export function Eyebrow({ accent, children }: { accent: Accent; children: ReactNode }) {
  return <p className="eyebrow" data-accent={accent}><Icon name={accent} size={18} /> <span>{children}</span></p>;
}

/** `current` ≥ steps.length means every step is done (no current step is announced). */
/** In EXAM the same form shows the subtests of the session, never learning steps (brand §3.2); accent "exam" = neutral navy. */
export function ThresholdRoute({ steps, current, accent, label = "Кроки завдання" }: { steps: string[]; current: number; accent: Accent | "exam"; label?: string }) {
  return (
    <ol className="threshold-route" data-accent={accent} aria-label={label}>
      {steps.map((text, i) => {
        const status = i < current ? "completed" : i === current ? "current" : "upcoming";
        return (
          <li key={text} className={`threshold-segment ${status}`} aria-current={status === "current" ? "step" : undefined}>
            <span className="threshold-index" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            <span className="threshold-label">{text}<span className="visually-hidden">{status === "completed" ? " — пройдено" : status === "current" ? " — зараз" : " — попереду"}</span></span>
          </li>
        );
      })}
    </ol>
  );
}
