import { FIDELITY_NAMES_UK, fidelityPanel, type ExamProfile } from "@hospodar/domain";
import { examProfileFile } from "../content/examProfiles.ts";

const STATUS_UK = { verified: "підтверджено", partial: "частково", unverified: "не підтверджено" } as const;

/** TZ-EXAM-04: six separate statuses, verified critical parameters and the gaps — never one "accuracy" percentage. */
export function ExamFidelity({ profile, compact = false }: { profile: ExamProfile; compact?: boolean }) {
  const panel = fidelityPanel(profile, examProfileFile);
  return (
    <section className="exam-fidelity" aria-labelledby={`fid-${profile.id}`}>
      <h2 id={`fid-${profile.id}`}>Наскільки ця репетиція схожа на справжній іспит</h2>
      <ul className="skill-lines">
        {panel.rows.map(r => (
          <li key={r.dimension} data-dimension={r.dimension}><strong>{r.dimension} · {FIDELITY_NAMES_UK[r.dimension]}</strong>: {STATUS_UK[r.status]}
            {!compact && <><br /><span className="muted">{r.basis_uk}</span></>}</li>
        ))}
      </ul>
      <p>Критичних параметрів іспиту підтверджено джерелом: <strong>{panel.verified} з {panel.total}</strong>.</p>
      {panel.gaps.length > 0 && (
        <details>
          <summary>Що ще не підтверджено ({panel.gaps.length}) — у репетиції ці правила тренувальні</summary>
          <ul>{panel.gaps.map(g => <li key={g}>{g}</li>)}</ul>
        </details>
      )}
    </section>
  );
}
