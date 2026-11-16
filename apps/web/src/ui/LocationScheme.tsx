import { useState } from "react";
import { INNER_LOCATION_CASES, type InnerLocation, type LocationScheme as Scheme } from "@hospodar/domain";

/**
 * UIO-06 semantic visual (packages/domain/src/locationCases.ts): in, out of, into a place. Shown on request in the
 * mission feedback, after the first attempt, never while answering or in the new-situation step.
 * - one meaningful interaction: choose a relation, see it in the picture; the task's own relation is selected first;
 * - equivalent static table (all three relations, endings and questions) next to the picture;
 * - no animation at all (nothing to reduce), keyboard buttons, the picture has a text description.
 */
export function LocationScheme({ scheme }: { scheme: Scheme }) {
  const [shown, setShown] = useState<InnerLocation>(scheme.current);
  const selected = INNER_LOCATION_CASES.find(c => c.id === shown)!;
  return (
    <details className="location-scheme">
      <summary>Схема: де? звідки? куди?</summary>
      <div className="actions" role="group" aria-label="Обери значення">
        {INNER_LOCATION_CASES.map(c => (
          <button key={c.id} type="button" className="btn secondary" aria-pressed={shown === c.id} onClick={() => setShown(c.id)}>
            {c.question_uk.split(" — ")[0]} <span lang="fi">{c.question_fi}</span>
          </button>
        ))}
      </div>
      <figure>
        <svg viewBox="0 0 240 150" role="img" aria-labelledby="ls-caption" data-relation={shown} focusable="false">
          {/* the place: a square house under a roof */}
          <path d="M120 18 L170 52 L70 52 Z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="miter" />
          <rect x="78" y="52" width="84" height="76" fill="none" stroke="currentColor" strokeWidth="3" />
          {shown === "in" && <rect x="112" y="84" width="16" height="16" fill="currentColor" />}
          {shown === "from" && <path d="M120 96 H214 M200 84 L214 96 L200 108" fill="none" stroke="currentColor" strokeWidth="4" />}
          {shown === "into" && <path d="M18 96 H112 M98 84 L112 96 L98 108" fill="none" stroke="currentColor" strokeWidth="4" />}
        </svg>
        <figcaption id="ls-caption">
          <span lang="fi">{selected.question_fi}</span> {selected.question_uk}. {selected.picture_uk}
          {shown === scheme.current && <> У цьому реченні: <strong lang="fi">{scheme.form_fi}</strong>.</>}
        </figcaption>
      </figure>
      <table className="location-table">
        <caption>Те саме таблицею</caption>
        <thead><tr><th scope="col">Питання</th><th scope="col">Значення</th><th scope="col">Закінчення</th><th scope="col">У цьому реченні</th></tr></thead>
        <tbody>
          {INNER_LOCATION_CASES.map(c => (
            <tr key={c.id} aria-current={c.id === scheme.current ? "true" : undefined}>
              <th scope="row" lang="fi">{c.question_fi}</th>
              <td>{c.question_uk}</td>
              <td lang="fi">{c.endings_fi}</td>
              <td lang="fi">{c.id === scheme.current ? scheme.form_fi : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
