import { useState } from "react";
import { examLook } from "../content/examLook.ts";
import { localDate, markModelAnswersSeen, unmarkModelAnswersSeen, videoCheckStatus, type ExamLookLink } from "@hospodar/domain";
import { readVideoExposure, updateVideoExposure } from "../storage/videoExposure.ts";

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
  // MOCK-VID-08: the learner's own mark that they watched a video's model answers — from then on an example, not a check.
  const [seen, setSeen] = useState(readVideoExposure);
  const [error, setError] = useState<string | null>(null);
  const change = (fn: Parameters<typeof updateVideoExposure>[0]) => {
    try { setSeen(updateVideoExposure(fn)); setError(null); } catch { setSeen(readVideoExposure()); setError("Браузер не зберіг позначку. Нічого не змінено."); }
  };
  if (examLook.length === 0) return null;
  return (
    <details className="exam-look" data-testid="exam-look">
      <summary>Як виглядає іспит: сторінки OPH, приклади організатора й відео (зовнішні посилання)</summary>
      {error && <p className="feedback error" role="alert">{error}</p>}
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
                  {l.answersFrom && (videoCheckStatus(seen, l.id) === "seen"
                    ? <p className="muted" data-testid={`exposure-${l.id}`}>Ти вже бачив(ла) зразки відповідей у цьому відео — тепер це приклад, а не нова перевірка.{" "}
                        <button type="button" className="link-btn" onClick={() => change(log => unmarkModelAnswersSeen(log, l.id))}>Зняти позначку</button></p>
                    : <p data-testid={`exposure-${l.id}`}><button type="button" className="link-btn" onClick={() => change(log => markModelAnswersSeen(log, l.id, localDate()))}>Я вже бачив(ла) зразки відповідей</button>{" "}
                        <span className="muted">— тоді відео стане прикладом, а не перевіркою.</span></p>)}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </details>
  );
}
