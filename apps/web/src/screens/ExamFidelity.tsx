import { FIDELITY_NAMES_UK, fidelityPanel, type ExamProfile } from "@hospodar/domain";
import { examProfileFile } from "../content/examProfiles.ts";

const STATUS_UK = { verified: "підтверджено", partial: "частково", unverified: "не підтверджено" } as const;

/**
 * TZ-EXAM-04: six separate statuses, verified critical parameters and the gaps — never one "accuracy" percentage.
 * Shown as a compact strip of six labelled cells (status in text, never colour alone); the basis of each status and
 * the list of unverified parameters are one click away, so the exam screen stays calm.
 */
export function ExamFidelity({ profile, compact = false }: { profile: ExamProfile; compact?: boolean }) {
  const panel = fidelityPanel(profile, examProfileFile);
  return (
    <section className="exam-fidelity" aria-labelledby={`fid-${profile.id}`}>
      <h2 id={`fid-${profile.id}`}>Наскільки ця репетиція схожа на справжній іспит</h2>
      <ul className="fidelity-strip">
        {panel.rows.map(r => (
          <li key={r.dimension} data-dimension={r.dimension} data-status={r.status}>
            <span className="fidelity-dim">{r.dimension}</span>
            <span className="fidelity-name">{FIDELITY_NAMES_UK[r.dimension]}</span>
            <strong className="fidelity-status">{STATUS_UK[r.status]}</strong>
          </li>
        ))}
      </ul>
      <p>Критичних параметрів іспиту підтверджено джерелом: <strong>{panel.verified} з {panel.total}</strong>.</p>
      {!compact && (
        <details>
          <summary>На чому ґрунтується кожен статус</summary>
          <dl className="fidelity-basis">{panel.rows.map(r => <div key={r.dimension}><dt>{r.dimension} · {FIDELITY_NAMES_UK[r.dimension]}</dt><dd>{r.basis_uk}</dd></div>)}</dl>
        </details>
      )}
      {panel.gaps.length > 0 && (
        <details>
          <summary>Що ще не підтверджено ({panel.gaps.length}) — у репетиції ці правила тренувальні</summary>
          <ul>{panel.gaps.map(g => <li key={g}>{g}</li>)}</ul>
        </details>
      )}
    </section>
  );
}
