import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  completeMission, missionReducer, missionResult, missionView, startMission,
  type LearnerState, type MissionPhase, type MissionState, MissionError,
} from "@hospodar/domain";
import { exercises, isDraft, type ClozeExercise } from "../content/cloze.ts";
import { repairQuestionFor } from "../content/repairCues.ts";
import { recommend, type Recommendation } from "../content/selection.ts";
import type { LearnerRepository } from "../storage/learnerRepository.ts";
import { clozeFingerprint, validMissionDraft, type MissionDraftPayload } from "../storage/missionDraft.ts";
import { writeFailureAdvice } from "../storage/browserStorageHealth.ts";
import { Eyebrow, ThresholdRoute } from "../ui/MissionChrome.tsx";
import { Icon } from "../ui/icons.tsx";
import { TrustNote } from "../ui/TrustNote.tsx";

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

export function MissionScreen({ repository, snapshot, onSaved, onHome, initialTaskId, workshop }: {
  repository: LearnerRepository;
  snapshot: { state: LearnerState; revision: number };
  onSaved: (s: { state: LearnerState; revision: number }) => void;
  onHome: () => void;
  /** Opened from «Майстерня слабких місць»: this exact new task; an unfinished draft still wins below. */
  initialTaskId?: string | null;
  workshop?: { label: string; onBack: () => void };
}) {
  const [initial] = useState(() => {
    const ranked = selectExercise(snapshot.state);
    const forced = initialTaskId ? exercises.find(e => e.id === initialTaskId) : undefined;
    return forced ? { exercise: forced, options: ranked.options } : ranked;
  });
  const [task, setTask] = useState(initial.exercise);
  const [options, setOptions] = useState(initial.options);
  const [choosing, setChoosing] = useState(false);
  const why = options.find(o => o.exercise.id === task.id)?.why ?? [];
  const [mission, setMission] = useState<MissionState>(() => startMission(task.id));
  const [input, setInput] = useState("");
  // Updated synchronously in the DOM input event, so rapid Save & Exit cannot use a stale React render.
  const inputRef = useRef("");
  const [error, setError] = useState<string | null>(null);
  const [save, setSave] = useState<SaveStatus>({ kind: "idle" });
  const [ready, setReady] = useState(false);
  const [working, setWorking] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [recovered, setRecovered] = useState(false);
  const [draftStatus, setDraftStatus] = useState<"idle" | "dirty" | "saving" | "saved" | "error">("idle");
  const draftRevision = useRef(0);
  const lastWritten = useRef("");
  const writeQueue = useRef<Promise<void>>(Promise.resolve());
  const editGeneration = useRef(0);
  const busy = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const view = missionView(mission);
  const reachedRepair = mission.firstCorrect === false;
  const steps = useMemo(() => STEPS.filter(s => s.phase !== "repair" || reachedRepair || mission.phase === "answer"), [reachedRepair, mission.phase]);
  const current = steps.findIndex(s => s.phase === mission.phase);

  useEffect(() => { if (ready && !blocked) heading.current?.focus(); }, [ready, blocked, mission.phase, task.id]);

  useEffect(() => {
    let alive = true;
    void repository.readMissionDraft().then(draft => {
      if (!alive) return;
      if (draft) {
        draftRevision.current = draft.revision;
        const found = exercises.find(e => e.id === draft.mission?.taskId);
        if (draft.learnerRevision !== snapshot.revision || !found || !validMissionDraft({
          mission: draft.mission, input: draft.input, contentFingerprint: draft.contentFingerprint,
        }, found)) {
          setBlocked("Незавершена місія змінилася або має стару версію матеріалів. Її не відкрито: можна явно відкинути цю чернетку й почати заново.");
        } else {
          const current = selectExercise(snapshot.state);
          setOptions(current.options);
          setTask(found); setMission(draft.mission); inputRef.current = draft.input; setInput(draft.input);
          lastWritten.current = JSON.stringify({
            mission: draft.mission, input: draft.input, contentFingerprint: draft.contentFingerprint,
          });
          setRecovered(true);
          setDraftStatus("saved");
        }
      }
      setReady(true);
    }).catch(e => { if (alive) { setBlocked("Не вдалося прочитати чернетку (" +
      String((e as { code?: string })?.code ?? "READ_FAILED") + "). Перезавантаж сторінку; нічого не перезаписано."); setReady(true); } });
    return () => { alive = false; };
  }, [repository]); // one initial storage read; don't overwrite a draft on rerender

  function payload(state: MissionState, writtenInput: string, exercise: ClozeExercise = task): MissionDraftPayload {
    return { mission: state, input: writtenInput, contentFingerprint: clozeFingerprint(exercise) };
  }
  /** Serialize all local writes: a slow old keystroke must never overwrite a newer step. */
  function enqueueCheckpoint(next: MissionState, value: string, exercise: ClozeExercise = task) {
    const d = payload(next, value, exercise), fingerprint = JSON.stringify(d);
    const queued = writeQueue.current.then(async () => {
      if (lastWritten.current === fingerprint) return;
      setDraftStatus("saving");
      const saved = await repository.saveMissionDraft(d, snapshot.revision, draftRevision.current);
      draftRevision.current = saved.revision;
      lastWritten.current = fingerprint; // only after a fresh repository readback
      setDraftStatus("saved");
    });
    writeQueue.current = queued.catch(() => {});
    return queued;
  }
  useEffect(() => {
    if (!ready || blocked || mission.phase === "done" || busy.current) return;
    if (mission.phase === "answer" && !input && draftRevision.current === 0) return;
    const generation = editGeneration.current;
    const timeout = setTimeout(() => {
      if (generation !== editGeneration.current) return;
      void enqueueCheckpoint(mission, input).catch(e => {
        setDraftStatus("error");
        setError("Автозбереження не підтверджено (" +
          String((e as { code?: string })?.code ?? "SAVE_FAILED") + "). " + writeFailureAdvice(e));
      });
    }, 650);
    return () => clearTimeout(timeout);
  }, [mission, input, task, ready, blocked]);

  // Read the actual control synchronously before any state update can rerender it.
  // Some browsers can dispatch a very fast click before React commits the final input event.
  function latestFieldText(): string {
    const field = document.getElementById("mission-input") as HTMLInputElement | HTMLTextAreaElement | null;
    return field?.value ?? inputRef.current;
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    if (busy.current || !ready || blocked) return;
    setError(null);
    let next: MissionState;
    try {
      const latest = latestFieldText();
      inputRef.current = latest;
      const event = mission.phase === "answer" ? { type: "SUBMIT_FIRST" as const, answer: latest }
        : mission.phase === "repair" ? { type: "SUBMIT_REPAIR" as const, answer: latest }
        : mission.phase === "feedback" ? { type: "CONTINUE" as const }
        : { type: "SUBMIT_TRANSFER" as const, text: latest };
      next = missionReducer(mission, task, event);
    } catch (e) {
      setError(e instanceof MissionError && e.code === "EMPTY_ANSWER" ? "Спершу напиши відповідь." : "Цю дію зараз виконати не можна.");
      return;
    }
    busy.current = true; setWorking(true);
    editGeneration.current++;
    setDraftStatus("saving");
    try {
      await writeQueue.current;
      if (next.phase === "done") {
        const history = completeMission(snapshot.state, missionResult(next, task.grammar_tag));
        const saved = await repository.finishMissionDraft(history, snapshot.revision, draftRevision.current, task.id);
        onSaved(saved);
        draftRevision.current = 0;
        lastWritten.current = "";
        setMission(next); inputRef.current = ""; setInput("");
        setSave({ kind: "saved" });
      } else {
        await enqueueCheckpoint(next, "");
        setMission(next); inputRef.current = ""; setInput("");
      }
      setError(null);
    } catch (e) {
      const code = String((e as { code?: string })?.code ?? "SAVE_FAILED");
      setDraftStatus("error");
      setError("Збереження не підтверджене (" + code + "). " + writeFailureAdvice(e));
    } finally { busy.current = false; setWorking(false); }
  }

  async function pause() {
    if (busy.current || blocked || !ready || mission.phase === "done") return;
    const exactInput = latestFieldText(); // before setState or awaits
    inputRef.current = exactInput;
    busy.current = true; setWorking(true); editGeneration.current++;
    setDraftStatus("saving");
    try {
      await writeQueue.current;
      await enqueueCheckpoint(mission, exactInput);
      const verified = await repository.readMissionDraft();
      if (!verified || verified.input !== exactInput ||
          verified.mission.taskId !== task.id || verified.mission.phase !== mission.phase)
        throw Object.assign(new Error("Paused response did not reread identically"), { code: "READBACK_MISMATCH" });
      onHome();
    } catch (e) {
      setDraftStatus("error");
      setError("Не вдалося зберегти чернетку (" +
        String((e as { code?: string })?.code ?? "SAVE_FAILED") + "). " + writeFailureAdvice(e));
    } finally { busy.current = false; setWorking(false); }
  }

  async function discard() {
    if (busy.current || !ready) return;
    busy.current = true; setWorking(true); editGeneration.current++;
    try {
      await writeQueue.current;
      if (draftRevision.current > 0) {
        await repository.discardMissionDraft(snapshot.revision, draftRevision.current);
        draftRevision.current = 0;
      }
      lastWritten.current = "";
      setBlocked(null); setRecovered(false);
      setMission(startMission(task.id)); inputRef.current = ""; setInput(""); setDraftStatus("idle");
      setError(null); setChoosing(false);
    } catch (e) {
      setError("Не вдалося відкинути чернетку (" + String((e as { code?: string })?.code ?? "SAVE_FAILED") + ").");
    } finally { busy.current = false; setWorking(false); }
  }

  function open(t: ClozeExercise) {
    if (draftRevision.current > 0 || input.trim()) {
      setError("Для зміни завдання спочатку явно відкинь поточну чернетку."); return;
    }
    editGeneration.current++;
    setTask(t); setMission(startMission(t.id)); setSave({ kind: "idle" });
    inputRef.current = ""; setInput(""); setError(null); setChoosing(false); setRecovered(false);
  }
  function nextMission() {
    const next = selectExercise(snapshot.state);
    setOptions(next.options); open(next.exercise);
  }

  const cta = { answer: "Перевірити", repair: "Перевірити ще раз", feedback: "Далі: нова ситуація", transfer: "Зберегти місію", done: "" }[mission.phase];

  if (!ready) return <section className="panel" role="status">Перевіряю незавершену місію на цьому пристрої…</section>;
  if (blocked) return (
    <section className="panel" aria-labelledby="draft-blocked">
      <h1 id="draft-blocked">Чернетка потребує уваги</h1>
      <p className="feedback warn" role="alert">{blocked}</p>
      {error && <p className="feedback error" role="alert">{error}</p>}
      <div className="actions">
        {draftRevision.current > 0 && <button className="btn danger" type="button" disabled={working} onClick={() => void discard()}>Відкинути несумісну чернетку</button>}
        <button className="btn secondary" type="button" onClick={onHome}>На головну</button>
      </div>
    </section>
  );

  return (
    <section className="panel" data-accent="grammar" aria-labelledby="mission-title">
      <Eyebrow accent="grammar">{workshop ? "Майстерня слабких місць · граматика" : "Навчання · граматика в контексті"}</Eyebrow>
      <h1 id="mission-title" ref={heading} tabIndex={-1}>
        {{ answer: "Твоя відповідь", repair: "Спробуй виправити сам(а)", feedback: "Що вийшло", transfer: "Скажи це про себе", done: "Місію завершено" }[mission.phase]}
      </h1>
      <ThresholdRoute steps={steps.map(x => x.label)} current={current < 0 ? steps.length : current} accent="grammar" label="Кроки місії" />
      {isDraft(task) && <TrustNote />}
      {recovered && mission.phase !== "done" && <p className="feedback" role="status">Продовжуємо незавершену місію з останньої підтвердженої чернетки.</p>}
      {mission.phase !== "done" && <p className="muted" role="status">
        {draftStatus === "saving" ? "Зберігаю чернетку…" :
          draftStatus === "saved" ? "Чернетку збережено на цьому пристрої." :
          draftStatus === "error" ? "Останні зміни не підтверджено. Використай «Зберегти та вийти»." :
          "Зміни в полі автоматично зберігаються після короткої паузи. Для негайного збереження — «Зберегти та вийти»."}
        Чернетка не вважається завершеною місією.
      </p>}

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
        <form onSubmit={e => void submit(e)} noValidate>
          {mission.phase !== "feedback" && (
            <>
              <label className="field" htmlFor="mission-input">
                {mission.phase === "transfer" ? "Твоє власне речення фінською (без зразка, не оцінюється автоматично)" : "Впиши пропущену форму фінською"}
              </label>
              {mission.phase === "transfer"
                ? <textarea id="mission-input" className="answer" lang="fi" rows={3} maxLength={1600} disabled={working} value={input} onChange={e => { inputRef.current = e.target.value; editGeneration.current++; setInput(e.target.value); setDraftStatus("dirty"); }} aria-describedby={error ? "mission-error" : undefined} />
                : <input id="mission-input" className="answer" lang="fi" autoComplete="off" autoCapitalize="none" spellCheck={false} disabled={working} value={input} onChange={e => { inputRef.current = e.target.value; editGeneration.current++; setInput(e.target.value); setDraftStatus("dirty"); }} aria-describedby={error ? "mission-error" : undefined} />}
            </>
          )}
          {error && <p id="mission-error" className="feedback error" role="alert">{error}</p>}
          <div className="actions">
            <button type="submit" className="btn" disabled={working}>{cta}</button>
            <button type="button" className="btn secondary" disabled={working} onClick={() => void pause()}>Зберегти та вийти</button>
          </div>
        </form>
      )}

      {mission.phase === "answer" && (
        <details className="why">
          <summary>Чому це завдання зараз?</summary>
          {why.length ? <ul>{why.map(w => <li key={w}>{w}</li>)}</ul> : <p>Немає особливих сигналів — це наступне доступне завдання.</p>}
          <p className="muted">Рекомендація лише з твоїх відповідей на цьому пристрої, без оцінки рівня.</p>
          {draftRevision.current > 0 && <p className="muted">Щоб обрати інше завдання, відкинь поточну чернетку кнопкою нижче.</p>}
          <button type="button" className="btn secondary" disabled={working} aria-expanded={choosing} onClick={() => setChoosing(c => !c)}>Обрати інше завдання</button>
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

      {mission.phase !== "done" && (
        <div className="actions">
          <button className="btn secondary" type="button" disabled={working} onClick={() => void discard()}>
            Відкинути чернетку та почати заново
          </button>
        </div>
      )}

      {mission.phase === "done" && (
        <div aria-live="polite">
          {save.kind === "saving" && <p className="feedback" role="status">Зберігаю на пристрої…</p>}
          {save.kind === "saved" && <p className="feedback" role="status"><Icon name="ok" /> Збережено на цьому пристрої. Перша спроба записана окремо від самовиправлення.</p>}
          {save.kind === "saved" && (
            <div className="actions">
              {workshop
                ? <button type="button" className="btn" onClick={workshop.onBack}>{workshop.label}</button>
                : <button type="button" className="btn" onClick={nextMission}>Наступна місія</button>}
              <button type="button" className="btn secondary" onClick={onHome}>На головну</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
