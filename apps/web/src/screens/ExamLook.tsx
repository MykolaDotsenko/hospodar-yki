import { examLook } from "../content/examLook.ts";
import type { ExamLookLink } from "@hospodar/domain";

const GROUPS: { id: ExamLookLink["group"]; title_uk: string }[] = [
  { id: "oph", title_uk: "Сторінки OPH" },
  { id: "organizer", title_uk: "Приклади організатора (SOLKI, Ювяскюля)" },
  { id: "practice", title_uk: "Тренувальні відео інших авторів" },
];

/**
 * «Як виглядає іспит» on the rehearsal set-up screen only (never inside an attempt, so no hint can reach a task).
 * Link-only; every link says what it is not: not past exam items, not the 2027 digital exam.
 */
export function ExamLook() {
  if (examLook.length === 0) return null;
  return (
    <details className="exam-look" data-testid="exam-look">
      <summary>Як виглядає іспит: сторінки OPH, приклади організатора й відео (зовнішні посилання)</summary>
      <p className="muted">Це підготовка перед репетицією. Усе відкривається на сайті автора. Приклади — не завдання минулих іспитів, а старі формати — не цифровий іспит 2027.</p>
      {GROUPS.map(g => {
        const rows = examLook.filter(l => l.group === g.id);
        return rows.length > 0 && (
          <section key={g.id} aria-labelledby={`look-${g.id}`}>
            <h3 id={`look-${g.id}`}>{g.title_uk}</h3>
            <ul className="learn-more-list">
              {rows.map(l => (
                <li key={l.id}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer">{l.title_uk} ↗</a>
                  <p className="muted">{[l.by, l.host].filter(Boolean).join(" · ")}</p>
                  <p>{l.note_uk}</p>
                  {l.answersFrom && <p data-testid="exam-look-answers"><strong>Зразки відповідей — з {l.answersFrom}.</strong> До цього місця відповідай сам(а).</p>}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </details>
  );
}
