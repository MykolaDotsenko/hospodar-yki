import { useEffect, useRef, useState } from "react";
import { goalRecord, localDate, LEARNER_GOAL_IDS, type GoalRecord, type LearnerGoal } from "@hospodar/domain";
import { places } from "../content/places.ts";
import { writeGoals } from "../storage/goals.ts";

const GOAL_LABEL = (g: LearnerGoal) => {
  if (g === "yki") return { uk: "Скласти іспит YKI", fi: "YKI-testi" };
  const p = places.find(x => x.id === g)!;
  return { uk: p.title_uk, fi: p.title_fi };
};
export const goalNames = (goals: readonly LearnerGoal[]) => goals.map(g => GOAL_LABEL(g).uk);

/** The goal checkboxes, shared by the first run and «Моя мета». Optional: nothing chosen is a valid answer. */
function GoalChoice({ value, onChange, legend }: { value: LearnerGoal[]; onChange: (v: LearnerGoal[]) => void; legend: string }) {
  return (
    <fieldset className="choices-set goal-choice">
      <legend>{legend}</legend>
      {LEARNER_GOAL_IDS.map(g => {
        const l = GOAL_LABEL(g);
        return (
          <label key={g} className="radio"><input type="checkbox" checked={value.includes(g)}
            onChange={e => onChange(e.target.checked ? [...value, g] : value.filter(x => x !== g))} /> {l.uk} <span lang="fi" className="muted">· {l.fi}</span></label>
        );
      })}
    </fieldset>
  );
}

/**
 * «Перший запуск» (docs/29 stage 3; MOT-02; R08-MOT §3): what the app is, the two modes in plain words, an optional
 * real-life goal, and an optional short diagnostic. No level is asked or invented; nothing is stored until a button
 * is pressed, and then only on this device.
 */
export function Welcome({ onDone }: { onDone: (record: GoalRecord, next: "diagnostic" | "home") => void }) {
  const [goals, setGoals] = useState<LearnerGoal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  function finish(next: "diagnostic" | "home") {
    const record = goalRecord(goals, localDate());
    try { writeGoals(record); }
    catch { setError("Браузер не дав зберегти вибір на цьому пристрої. Можна продовжити й так — вітання з'явиться ще раз."); }
    onDone(record, next);
  }
  return (
    <section className="today welcome" aria-labelledby="welcome-title">
      <h2 id="welcome-title" className="today-kicker" ref={heading} tabIndex={-1}>Перший раз тут</h2>
      <p className="today-title">Фінська для життя у Фінляндії. Пояснення — українською, практика — фінською.</p>
      <p className="today-why">Акаунта немає. Усе, що ти робиш, зберігається лише на цьому пристрої й нікуди не надсилається.</p>
      <h3 className="welcome-h">Два режими</h3>
      <dl className="welcome-modes">
        <div><dt>01 · Навчання</dt><dd>Спершу твоя власна відповідь, потім підказка, самовиправлення й нова ситуація. Те, що не вдалося, повернеться на повторення через 1, 3, 7, 14 і 30 днів.</dd></div>
        <div><dt>02 · Симуляція YKI</dt><dd>Тренувальна репетиція з чотирьох навичок без підказок, результати — лише після завершення. Це не офіційний YKI: правила цифрового іспиту 2027 року ще не підтверджено.</dd></div>
      </dl>
      <GoalChoice value={goals} onChange={setGoals} legend="Що тобі треба робити фінською? За бажанням, можна кілька" />
      <p className="muted">Вибір лише підкаже, з чого почати: усі місця й навички однаково доступні. Змінити його можна будь-коли («Моя мета» на головній), стерти — разом із прогресом у «Мої дані».</p>
      {error && <p className="feedback error" role="alert">{error}</p>}
      <div className="actions">
        <button type="button" className="btn" onClick={() => finish("diagnostic")}>Почати з короткого знайомства</button>
        <button type="button" className="btn secondary" onClick={() => finish("home")}>Без знайомства — одразу до справ</button>
      </div>
      <p className="muted">Знайомство — по одному завданню на читання, письмо й говоріння, кілька хвилин. Рівня чи оцінки воно не визначає.</p>
    </section>
  );
}

/** «Моя мета» on Home: see, change or clear the goals; stored only when «Зберегти» is pressed. */
export function MyGoals({ record, onSaved }: { record: GoalRecord | null; onSaved: (r: GoalRecord) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<LearnerGoal[]>(record?.goals ?? []);
  const [error, setError] = useState<string | null>(null);
  const names = goalNames(record?.goals ?? []);
  function save() {
    const next = goalRecord(draft, record?.seen ?? localDate());
    try { writeGoals(next); onSaved(next); setEditing(false); setError(null); }
    catch { setError("Не вдалося зберегти на цьому пристрої. Попередній вибір не змінено."); }
  }
  return (
    <div className="my-goals">
      <p><strong>Моя мета:</strong> {names.length ? names.join(", ") : "ще не обрано"}.{" "}
        {!editing && <button type="button" className="link-btn" onClick={() => { setDraft(record?.goals ?? []); setEditing(true); }}>Змінити мету</button>}</p>
      {editing && (
        <>
          <GoalChoice value={draft} onChange={setDraft} legend="Що тобі треба робити фінською? Можна кілька або жодного" />
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions">
            <button type="button" className="btn secondary" onClick={save}>Зберегти</button>
            <button type="button" className="btn secondary" onClick={() => setEditing(false)}>Скасувати</button>
          </div>
        </>
      )}
    </div>
  );
}
