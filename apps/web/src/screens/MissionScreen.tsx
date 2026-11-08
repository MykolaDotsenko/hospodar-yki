import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  completeMission, missionReducer, missionResult, missionView, startMission,
  type LearnerState, type MissionPhase, type MissionState, MissionError,
} from "@hospodar/domain";
import { exercises, isDraft, type ClozeExercise } from "../content/cloze.ts";
import { repairQuestionFor } from "../content/repairCues.ts";
import { recommend, type Recommendation } from "../content/selection.ts";
import type { LearnerRepository } from "../storage/learnerRepository.ts";

const STEPS: Array<{ phase: MissionPhase; label: string }> = [
  { phase: "answer", label: "Спроба" },
  { phase: "repair", label: "Самовиправлення" },
  { phase: "feedback", label: "Зворотний зв'язок" },
  { phase: "transfer", label: "Нова ситуація" },
  { phase: "done", label: "Збережено" },
];

/** R06: transparent deterministic ranking; falls back to the first item only if nothing ranks. */
export function selectExercise(state: LearnerState): { exercise: ClozeExercise; options: Recommendation[] } {
  const options = recommend(state);
  return { exercise: options[0]?.exercise ?? exercises[0]!, options };
}

type SaveStatus = { kind: "idle" } | { kind: "saving" } | { kind: "saved" } | { kind: "error"; code: string };

export function MissionScreen({ repository, snapshot, onSaved, onHome }: {
  repository: LearnerRepository;
  snapshot: { state: LearnerState; revision: number };
  onSaved: (s: { state: LearnerState; revision: number }) => void;
  onHome: () => void;
}) {
  const [initial] = useState(() => selectExercise(snapshot.state));
  const [task, setTask] = useState(initial.exercise);
  const [options, setOptions] = useState(initial.options);
  const [choosing, setChoosing] = useState(false);
  const why = options.find(o => o.exercise.id === task.id)?.why ?? [];
  const [mission, setMission] = useState<MissionState>(() => startMission(task.id));
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [save, setSave] = useState<SaveStatus>({ kind: "idle" });
  const heading = useRef<HTMLHeadingElement>(null);
  const view = missionView(mission);
  const reachedRepair = mission.firstCorrect === false;
  const steps = useMemo(() => STEPS.filter(s => s.phase !== "repair" || reachedRepair || mission.phase === "answer"), [reachedRepair, mission.phase]);
  const current = steps.findIndex(s => s.phase === mission.phase);

  useEffect(() => { heading.current?.focus(); }, [mission.phase, task.id]);

  async function persist(finished: MissionState) {
    setSave({ kind: "saving" });
    try {
      const next = completeMission(snapshot.state, missionResult(finished, task.grammar_tag));
      const saved = await repository.commit(next, snapshot.revision);
      onSaved(saved);
      setSave({ kind: "saved" }); // success only after the IndexedDB transaction completed
    } catch (e) {
      setSave({ kind: "error", code: String((e as { code?: string })?.code ?? "SAVE_FAILED") });
    }
  }

  function submit(ev: FormEvent) {
    ev.preventDefault();
    setError(null);
    try {
      const event = mission.phase === "answer" ? { type: "SUBMIT_FIRST" as const, answer: input }
        : mission.phase === "repair" ? { type: "SUBMIT_REPAIR" as const, answer: input }
        : mission.phase === "feedback" ? { type: "CONTINUE" as const }
        : { type: "SUBMIT_TRANSFER" as const, text: input };
      const next = missionReducer(mission, task, event);
      setMission(next);
      setInput("");
      if (next.phase === "done") void persist(next);
    } catch (e) {
      setError(e instanceof MissionError && e.code === "EMPTY_ANSWER" ? "Спершу напиши відповідь." : "Цю дію зараз виконати не можна.");
    }
  }

  function open(t: ClozeExercise) {
    setTask(t); setMission(startMission(t.id)); setSave({ kind: "idle" }); setInput(""); setError(null); setChoosing(false);
  }
  function nextMission() {
    const next = selectExercise(snapshot.state);
    setOptions(next.options); open(next.exercise);
  }

  const cta = { answer: "Перевірити", repair: "Перевірити ще раз", feedback: "Далі: нова ситуація", transfer: "Зберегти місію", done: "" }[mission.phase];

  return (
    <section className="panel" aria-labelledby="mission-title">
      <p className="eyebrow">Навчання · граматика в контексті</p>
      <h1 id="mission-title" ref={heading} tabIndex={-1}>
        {{ answer: "Твоя відповідь", repair: "Спробуй виправити сам(а)", feedback: "Що вийшло", transfer: "Скажи це про себе", done: "Місію завершено" }[mission.phase]}
      </h1>
      <ol className="threshold-route" aria-label="Кроки місії">
        {steps.map((s, i) => {
          const status = i < current ? "completed" : i === current ? "current" : "upcoming";
          return (
            <li key={s.phase} className={`threshold-segment ${status}`} aria-current={status === "current" ? "step" : undefined}>
              <span className="threshold-index" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <span className="threshold-label">{s.label}<span className="visually-hidden">{status === "completed" ? " — пройдено" : status === "current" ? " — зараз" : " — попереду"}</span></span>
            </li>
          );
        })}
      </ol>
      {isDraft(task) && <p className="draft-note">Чернетка: ще не перевірено S2-викладачем.</p>}

      {view.showPrompt && <p className="prompt" lang="fi">{task.prompt_fi}</p>}
      {view.showRepairHint && (
        <p className="feedback warn" role="status">Поки не так. {repairQuestionFor(task.grammar_tag)} Правильну форму покажемо після другої спроби.</p>
      )}
      {view.showKey && (
        <div className="feedback" role="status">
          <p>{mission.firstCorrect ? "Правильно з першої спроби." : mission.repairCorrect ? "Друга спроба правильна — це керована підказка, тому повторимо завтра." : "Ось правильна форма. Повторимо завтра."}</p>
          {task.meaning_uk && <p className="meaning-first"><span className="meaning-label">Зміст</span><span className="meaning-text">{task.meaning_uk}</span></p>}
          {task.semantic_relation_uk && <p className="meaning-first"><span className="meaning-label">Значення форми</span><span className="meaning-text">{task.semantic_relation_uk}</span></p>}
          <p lang="fi"><span className="learning-cue">{task.answer_fi}</span></p>
          {task.explanation_uk && <p>{task.explanation_uk}</p>}
        </div>
      )}
      {view.showTransfer && <p className="prompt" lang="fi">{task.transfer_task_fi ?? "Kirjoita oma lause."}</p>}

      {mission.phase !== "done" && (
        <form onSubmit={submit} noValidate>
          {mission.phase !== "feedback" && (
            <>
              <label className="field" htmlFor="mission-input">
                {mission.phase === "transfer" ? "Твоє власне речення фінською (без зразка, не оцінюється автоматично)" : "Впиши пропущену форму фінською"}
              </label>
              {mission.phase === "transfer"
                ? <textarea id="mission-input" className="answer" lang="fi" rows={3} maxLength={1600} value={input} onChange={e => setInput(e.target.value)} aria-describedby={error ? "mission-error" : undefined} />
                : <input id="mission-input" className="answer" lang="fi" autoComplete="off" autoCapitalize="none" spellCheck={false} value={input} onChange={e => setInput(e.target.value)} aria-describedby={error ? "mission-error" : undefined} />}
            </>
          )}
          {error && <p id="mission-error" className="feedback error" role="alert">{error}</p>}
          <div className="actions"><button type="submit" className="btn">{cta}</button></div>
        </form>
      )}

      {mission.phase === "answer" && (
        <details className="why">
          <summary>Чому це завдання зараз?</summary>
          {why.length ? <ul>{why.map(w => <li key={w}>{w}</li>)}</ul> : <p>Немає особливих сигналів — це наступне доступне завдання.</p>}
          <p className="muted">Рекомендація лише з твоїх відповідей на цьому пристрої, без оцінки рівня.</p>
          <button type="button" className="btn secondary" aria-expanded={choosing} onClick={() => setChoosing(c => !c)}>Обрати інше завдання</button>
          {choosing && (
            <ul className="choices" aria-label="Інші завдання">
              {options.filter(o => o.exercise.id !== task.id).slice(0, 4).map(o => (
                <li key={o.exercise.id}><button type="button" className="choice" onClick={() => open(o.exercise)}>
                  <span lang="fi">{o.exercise.prompt_fi}</span><small>{o.why[0] ?? "Наступне доступне"}</small>
                </button></li>
              ))}
            </ul>
          )}
        </details>
      )}

      {mission.phase === "done" && (
        <div aria-live="polite">
          {save.kind === "saving" && <p className="feedback" role="status">Зберігаю на пристрої…</p>}
          {save.kind === "saved" && <p className="feedback" role="status">✅ Збережено на цьому пристрої. Перша спроба записана окремо від самовиправлення.</p>}
          {save.kind === "error" && (
            <div className="feedback error" role="alert">
              <p>⚠️ Місію НЕ збережено ({save.code}). Нічого не втрачено з екрана — спробуй ще раз{save.code === "REVISION_CONFLICT" ? " після перезавантаження сторінки (прогрес змінено в іншій вкладці)" : ""}.</p>
              <div className="actions"><button type="button" className="btn secondary" onClick={() => void persist(mission)}>Спробувати зберегти ще раз</button></div>
            </div>
          )}
          {save.kind === "saved" && (
            <div className="actions">
              <button type="button" className="btn" onClick={nextMission}>Наступна місія</button>
              <button type="button" className="btn secondary" onClick={onHome}>На головну</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
