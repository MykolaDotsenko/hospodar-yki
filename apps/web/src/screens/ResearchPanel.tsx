import { useEffect, useState } from "react";
import { buildResearchExport, CONSENT_ITEMS, enroll, normaliseStudyCode, ResearchError, studyTimeTotals, STUDY_AREAS, type LearnerState, type ResearchEnrollment, type ResearchExport, type StudyArea } from "@hospodar/domain";
import { clearResearch, onResearchChanged, readEnrollment, readStudyTime, writeEnrollment } from "../storage/research.ts";
import { Icon } from "../ui/icons.tsx";

/**
 * «Участь у дослідженні» (R01 readiness, docs/29 stage 6): opt-in, with a researcher's study code and three consent
 * ticks; shows what was counted; the learner downloads the de-identified file themselves; withdrawal deletes the
 * enrolment and the time log (learning progress stays). Nothing is sent anywhere.
 */
const AREA_UK: Record<StudyArea, string> = {
  grammar: "Граматика в контексті", practice: "Практика без підказки", reading: "Читання", listening: "Аудіювання", writing: "Письмо",
  dialogue: "Діалоги", pictures: "Фото-ситуації", masterclass: "Майстер-класи", external: "Завдання із зовнішніх джерел", media: "Медіатека",
  diagnostic: "Діагностика", checks: "Відкладені перевірки", exam: "Пробний іспит",
};
const minutes = (s: number) => (s < 60 ? "менше хвилини" : `${Math.round(s / 60)} хв`);

export function ResearchPanel({ readState }: { readState: () => Promise<LearnerState> }) {
  const [enrollment, setEnrollment] = useState<ResearchEnrollment | null>(readEnrollment);
  const [time, setTime] = useState(readStudyTime);
  const [code, setCode] = useState("");
  const [ticked, setTicked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [made, setMade] = useState<ResearchExport | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [left, setLeft] = useState(false);
  const reload = () => { setEnrollment(readEnrollment()); setTime(readStudyTime()); };
  useEffect(() => onResearchChanged(reload), []);

  function start() {
    setError(null);
    try { const e = enroll(code, ticked); writeEnrollment(e); setLeft(false); reload(); }
    catch (e) {
      setError(e instanceof ResearchError ? (e.code === "BAD_CODE" ? "Це не схоже на код учасника. Введи код, який дав дослідник: латинські літери A–Z і цифри, можна один дефіс."
        : "Щоб почати, познач усі три пункти згоди.") : `Браузер не зберіг участь (${String((e as Error)?.message ?? e)}). Облік не ввімкнено.`);
    }
  }
  async function download() {
    setError(null); setMade(null);
    const e = readEnrollment();
    if (!e) { reload(); return; }
    try {
      const data = buildResearchExport(await readState(), e, readStudyTime());
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url; a.download = `hospodar-research-${e.studyCode}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMade(data);
    } catch (err) { setError(`Файл не створено (${String((err as Error)?.message ?? err)}). Нічого не змінено.`); }
  }
  function withdraw() {
    setError(null);
    try { clearResearch(); setLeaving(false); setMade(null); setLeft(true); reload(); }
    catch { setError("Не вдалося підтвердити видалення обліку. Спробуй ще раз; прогрес навчання не змінено."); reload(); }
  }

  const totals = studyTimeTotals(time);
  const counted = STUDY_AREAS.filter(a => (totals[a] ?? 0) > 0);
  const codeOk = normaliseStudyCode(code) !== null;
  return (
    <section aria-labelledby="research-title" data-testid="research-panel">
      <h2 id="research-title">Участь у дослідженні (за бажанням)</h2>
      {!enrollment ? (
        <>
          <p>Якщо дослідник запросив тебе перевірити, чи допомагає Hospodar вчити фінську, тут можна ввімкнути облік для дослідження. Без запрошення нічого вмикати не потрібно.</p>
          <p className="muted">Протокол дослідження — чернетка, ще не затверджена. Участь не змінює навчання і не дає оцінки чи рівня.</p>
          {left && <p className="feedback" role="status"><Icon name="ok" /> Ти вийшов(ла) з дослідження: облік часу й позначку участі видалено з пристрою. Прогрес навчання лишився.</p>}
          <label className="field" htmlFor="research-code">Код учасника від дослідника</label>
          <input id="research-code" className="answer" autoComplete="off" spellCheck={false} maxLength={21} aria-describedby="research-code-help"
            value={code} onChange={e => setCode(e.target.value)} />
          <p className="muted" id="research-code-help">Лише код, який дав дослідник: латинські літери A–Z і цифри, можна один дефіс. Не пиши ім'я чи e-mail.</p>
          <fieldset className="choices-set">
            <legend>Згода</legend>
            {CONSENT_ITEMS.map(c => (
              <label key={c.id} className="radio"><input type="checkbox" checked={ticked.includes(c.id)}
                onChange={e => setTicked(t => (e.target.checked ? [...t, c.id] : t.filter(x => x !== c.id)))} /> <span>{c.text_uk}</span></label>
            ))}
          </fieldset>
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions"><button type="button" className="btn secondary" disabled={!codeOk || ticked.length < CONSENT_ITEMS.length} onClick={start}>Почати участь</button></div>
        </>
      ) : (
        <>
          <p className="feedback" role="status">Ти береш участь у дослідженні з кодом <strong>{enrollment.studyCode}</strong> від {enrollment.enrolledDay.split("-").reverse().join(".")}.
            Облік ведеться лише на цьому пристрої.</p>
          <h3>Що облічено</h3>
          {counted.length === 0
            ? <p className="muted">Час ще не облічено. Він рахується на екранах навчання й пробного іспиту, поки ти працюєш (або звучить запис), і не рахується, коли екран схований чи ти понад 2 хвилини нічого не робиш.</p>
            : <ul className="skill-lines" aria-label="Облічений час за розділами">{counted.map(a => <li key={a}>{AREA_UK[a]}: <strong>{minutes(totals[a]!)}</strong></li>)}</ul>}
          <p className="muted">Це приблизний час роботи на екрані, а не міра уваги чи успіху.</p>
          <h3>Файл для дослідника</h3>
          <p>У файлі: код учасника, номери завдань і навичка, чи правильна перша відповідь (лише там, де є ключ), відкладені перевірки, дні від початку участі й хвилини за розділами.
            Немає: твоїх текстів, нотаток і зачіпок, голосу, імені, дат календаря, відповідей пробних іспитів.</p>
          <div className="actions"><button type="button" className="btn" onClick={() => void download()}>Завантажити файл для дослідника (JSON)</button></div>
          {made && <p className="feedback" role="status" data-testid="research-made"><Icon name="ok" /> Файл створено: перших відповідей {made.first_attempts.length}, місій граматики {made.grammar_missions.length},
            відкладених перевірок {made.delayed_checks.length}, записів часу {made.study_time.length}. Передай його досліднику сам(а), якщо захочеш.</p>}
          {error && <p className="feedback error" role="alert">{error}</p>}
          {!leaving
            ? <div className="actions"><button type="button" className="btn secondary" onClick={() => setLeaving(true)}>Вийти з дослідження</button></div>
            : <div className="actions" role="group" aria-label="Підтвердження виходу">
                <p>Облік часу й позначку участі буде видалено з пристрою. Прогрес навчання лишиться. Уже переданий досліднику файл застосунок забрати не може.</p>
                <button type="button" className="btn danger" onClick={withdraw}>Так, вийти й видалити облік</button>
                <button type="button" className="btn secondary" onClick={() => setLeaving(false)}>Скасувати</button>
              </div>}
        </>
      )}
    </section>
  );
}
