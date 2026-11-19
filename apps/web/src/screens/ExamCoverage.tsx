import { coverageOf, coverageTaxonomy, FAMILY_UK } from "../content/examCoverage.ts";

/**
 * TZ-EXAM-06/15: what the chosen set covers of the exam construct — task families from the form's own items, topics and
 * communicative functions only when the form declares them. A set that does not cover everything is a practice subset and
 * says so; it is never called a full exam. Structural only: not S2 quality, not 2027 fidelity.
 */
export function ExamCoverage({ blueprintId }: { blueprintId: string }) {
  const c = coverageOf(blueprintId);
  if (!c) return null;
  const t = coverageTaxonomy;
  return (
    <details className="exam-coverage" data-testid="exam-coverage">
      <summary>Що охоплює цей набір: {c.families.present.length} з {t.families.length} типів завдань{c.complete ? "" : " — тренувальна міні-форма, не повний іспит"}</summary>
      <p className="muted">Повний іспит має охоплювати всі {t.families.length} типів завдань, {t.topics.length} тем і {t.functions.length} комунікативних функцій. Тут лише структура: якість завдань перевіряє викладач S2, відповідність цифровому іспиту 2027 не підтверджено.</p>
      <p><strong>Є:</strong> {c.families.present.map(f => FAMILY_UK[f] ?? f).join("; ")}.</p>
      {c.families.missing.length > 0 && <p><strong>Немає:</strong> {c.families.missing.map(f => FAMILY_UK[f] ?? f).join("; ")}.</p>}
      <p>{c.topics.declared ? `Теми: ${c.topics.present.length} з ${t.topics.length}.` : "Теми й комунікативні функції у формі ще не позначені — їх позначить і перевірить викладач S2."}</p>
    </details>
  );
}
