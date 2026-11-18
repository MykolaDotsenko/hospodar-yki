import { useState } from "react";
import { localDate, studyPlan, studyPlanSentence, STUDY_PLAN_CUE_MAX, STUDY_PLAN_MINUTES, type Skill, type StudyPlan } from "@hospodar/domain";
import { clearStudyPlan, readStudyPlan, writeStudyPlan } from "../storage/studyPlan.ts";

const SKILL_UK: Record<Skill, string> = { reading: "Читання", listening: "Аудіювання", writing: "Письмо", speaking: "Говоріння" };

/**
 * micro-missions: a voluntary if-then plan in the learner's own words (R08-MOT MOT-E11/E12). No reminder, no streak, no
 * count; a pause is fine. «Почати зараз» opens the chosen skill. Saved only on «Зберегти план»; editable and erasable.
 */
export function StudyPlanBox({ onStart }: { onStart: (skill: Skill) => void }) {
  const [plan, setPlan] = useState<StudyPlan | null>(readStudyPlan);
  const [editing, setEditing] = useState(false);
  const [cue, setCue] = useState(plan?.cue_uk ?? "");
  const [skill, setSkill] = useState<Skill | null>(plan?.skill ?? null);
  const [minutes, setMinutes] = useState<number>(plan?.minutes ?? 10);
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (!cue.trim()) { setError("Напиши, коли саме — своїми словами."); return; }
    if (!skill) { setError("Обери, що тренуватимеш."); return; }
    try { const p = studyPlan(cue, skill, minutes, localDate()); writeStudyPlan(p); setPlan(p); setEditing(false); setError(null); }
    catch (e) { setError((e as Error).message === "CUE_TOO_LONG" ? "Коротше, будь ласка: до 150 знаків." : "Не вдалося зберегти на цьому пристрої. Нічого не змінено."); }
  }
  function remove() {
    try { clearStudyPlan(); setPlan(null); setCue(""); setSkill(null); setMinutes(10); setEditing(false); setError(null); }
    catch { setError("Не вдалося видалити на цьому пристрої."); }
  }

  if (plan && !editing) return (
    <div className="study-plan" data-testid="study-plan">
      <p><strong>Мій план:</strong> {studyPlanSentence(plan)}</p>
      <div className="actions">
        <button type="button" className="btn secondary" onClick={() => onStart(plan.skill)}>Почати зараз</button>
        <button type="button" className="link-btn" onClick={() => setEditing(true)}>Змінити</button>
        <button type="button" className="link-btn" onClick={remove}>Видалити план</button>
      </div>
      {error && <p className="feedback error" role="alert">{error}</p>}
    </div>
  );
  return (
    <details className="study-plan" data-testid="study-plan" open={editing}>
      <summary>{plan ? "Змінити план «коли …, я …»" : "Скласти план «коли …, я …» (за бажанням)"}</summary>
      <p className="muted">Обери звичну мить свого дня, після якої займешся фінською. Комусь такий план допомагає, комусь ні. Нагадувань не буде, пропустити день — нормально, нічого не згорає.</p>
      <label className="field" htmlFor="plan-cue">Коли? Своїми словами — наприклад, «коли сідаю в автобус до роботи»</label>
      <input id="plan-cue" className="plan-notes" autoComplete="off" maxLength={STUDY_PLAN_CUE_MAX} value={cue} onChange={e => setCue(e.target.value)} />
      <fieldset className="choices-set">
        <legend>Що тренуватимеш?</legend>
        {(Object.keys(SKILL_UK) as Skill[]).map(k => (
          <label key={k} className="radio"><input type="radio" name="plan-skill" checked={skill === k} onChange={() => setSkill(k)} /> {SKILL_UK[k]}</label>
        ))}
      </fieldset>
      <fieldset className="choices-set">
        <legend>Скільки хвилин?</legend>
        {STUDY_PLAN_MINUTES.map(m => (
          <label key={m} className="radio"><input type="radio" name="plan-minutes" checked={minutes === m} onChange={() => setMinutes(m)} /> {m} хв</label>
        ))}
      </fieldset>
      {error && <p className="feedback error" role="alert">{error}</p>}
      <div className="actions">
        <button type="button" className="btn secondary" onClick={save}>Зберегти план</button>
        {plan && <button type="button" className="btn secondary" onClick={() => { setEditing(false); setCue(plan.cue_uk); setSkill(plan.skill); setMinutes(plan.minutes); setError(null); }}>Скасувати</button>}
      </div>
      <p className="muted">План зберігається лише на цьому пристрої, не входить у копію даних і видаляється разом із даними навчання.</p>
    </details>
  );
}
