import { useEffect, useState } from "react";
import { clearDeedNote, deedDoneOn, deedNote, hospodarAtPlace, localDate, markDeed, placeProgress, scenarioCheckOf, scenarioProgress, scriptedScenario, setDeedNote, setScenarioCheck, unmarkDeed, type ScriptedStep, DEED_NOTE_MAX_CHARS, DEED_WENT, type DeedLog, type DeedWent, type LearnerState, type PlaceId, type YkiSkill } from "@hospodar/domain";
import { onDeedsChanged, readDeeds, updateDeeds } from "../storage/deeds.ts";
import { readScenarioChecks, updateScenarioChecks } from "../storage/scenarioChecks.ts";
import { scenarioScriptFor } from "../content/scenarioScripts.ts";
import { placeIndex, places, practiceIdsOf, viewOfSkill, type Quest, type QuestView } from "../content/places.ts";
import { Icon } from "../ui/icons.tsx";
import { PlaceGlyph } from "../ui/PlaceGlyph.tsx";
import { Hospodar } from "../ui/Hospodar.tsx";
import { TrustNote } from "../ui/TrustNote.tsx";

/**
 * One place of «Моє господарство»: what being "господар" here means in real life, the real missions
 * of this place, the honest keys and the open door. Never locked; nothing decays (R08-MOT, GAM-01).
 */
export function PlaceScreen({ id, state, open, onHome, guide = false }: {
  id: PlaceId; state: LearnerState; open: (view: QuestView, itemId: string, scenarioNote?: string) => void; onHome: () => void; guide?: boolean;
}) {
  const place = places.find(p => p.id === id)!;
  // Private real-life marks and reflections: one copy for the whole screen, so a saved reflection shows at the top at once.
  const [deeds, setDeeds] = useState(readDeeds);
  const [deedError, setDeedError] = useState<string | null>(null);
  useEffect(() => onDeedsChanged(() => setDeeds(readDeeds())), []);   // another tab marked, removed or erased
  const saveDeeds = (change: (current: DeedLog) => DeedLog): boolean => {
    try { setDeeds(updateDeeds(change)); setDeedError(null); return true; }
    catch { setDeeds(readDeeds()); setDeedError("Браузер не зберіг зміну. Нічого не змінено."); return false; }
  };
  const lastTime = deedNote(deeds, id);
  const progress = placeProgress(state, placeIndex).find(p => p.place === id)!;
  const tried = (prefix: string) => state.diagnostics.some(d => d.taskId === prefix || d.taskId.startsWith(`${prefix}-`));
  const status = (q: Quest) => {
    if (q.view !== "practice") return tried(q.taskPrefix ?? q.itemId) ? "ти вже пробував(ла)" : "ще не пробував(ла)";
    const ids = practiceIdsOf(id, q.practiceKind!);
    return `карток: ${ids.length} · пройдено ${ids.filter(tried).length}`;
  };
  const go = (q: Quest) => {
    if (q.view !== "practice") return open(q.view, q.itemId);
    const ids = practiceIdsOf(id, q.practiceKind!);
    open("practice", ids.find(c => !tried(c)) ?? ids[0]!);
  };

  const scenario = place.scenario ? scenarioProgress(state, place.scenario) : null;
  // task-based: the 20-minute run — role, a condition that changes at every step, the learner's own task-success checks.
  const script = place.scenario ? scenarioScriptFor(id) : null;
  const run = place.scenario ? scriptedScenario(place.scenario, script) : null;
  const [checks, setChecks] = useState(readScenarioChecks);
  const verb: Record<YkiSkill, string> = { reading: "Зрозумій текст", listening: "Зрозумій на слух", speaking: "Скажи", writing: "Напиши" };
  const titleOfStep = (itemId: string) => place.quests.find(q => q.itemId === itemId)?.title ?? itemId;
  const stepStatus = { todo: "ще не пробував(ла)", done: "зроблено самостійно", supported: "зроблено з підтримкою тексту" } as const;

  return (
    <section className="panel place" aria-labelledby="place-title">
      <p className="eyebrow"><Icon name="home" size={18} /> <span>Моє господарство</span></p>
      <div className="place-head">
        <PlaceGlyph open={progress.doorOpen} size={72} />
        <div>
          <h1 id="place-title">{place.title_uk}</h1>
          <p className="place-fi" lang="fi">{place.title_fi}</p>
        </div>
      </div>
      <p className="place-goal"><strong>Бути тут господарем:</strong> {place.goal_uk}</p>
      <TrustNote many>Письмо й говоріння не оцінюються автоматично.</TrustNote>
      {lastTime && (lastTime.next_uk || lastTime.went !== "well") && (
        <p className="plan-back" data-testid="deed-last-time"><strong>Минулого разу в житті — {WENT_UK[lastTime.went].toLowerCase()}.</strong>
          {lastTime.next_uk && <> Твоя нотатка на наступний раз: «{lastTime.next_uk}»</>}
          {lastTime.went !== "well" && <> Можеш спершу потренувати цю ситуацію нижче.</>}</p>
      )}

      <dl className="place-status">
        <div><dt>Двері</dt><dd data-testid="place-door">{progress.doorOpen ? "відчинені — ти вже пробував(ла) тут сам(а)" : "ще зачинені — відчиняться після твоєї першої спроби"}</dd></div>
        <div><dt><Icon name="key" size={18} /> Ключі</dt><dd data-testid="place-keys">{progress.keys} <span className="muted">— правильні перші відповіді без підказки</span></dd></div>
        <div><dt>Спроби фінською</dt><dd>{progress.practice} <span className="muted">— твої тексти й відповіді без оцінки; це теж практика</span></dd></div>
      </dl>

      {guide && <Hospodar size={80} says={hospodarAtPlace(progress.doorOpen)} />}

      {scenario && (
        <section className="scenario" aria-labelledby="scenario-title" data-complete={scenario.complete ? "yes" : "no"}>
          <h2 id="scenario-title">Ціла справа: від розуміння до дії</h2>
          <p>Одна життєва ситуація цього місця по кроках: спершу зрозуміти, потім сказати, потім написати.</p>
          {run && script && (
            <div className="scenario-role" data-testid="scenario-role">
              <p><strong>Твоя роль:</strong> {script.role_uk}</p>
              <p><strong>Мета:</strong> {script.goal_uk}</p>
              <p className="muted">Орієнтовно {script.minutes} хвилин, без таймера. Перед кожним кроком умова трохи змінюється — як у житті. Після кроку перевір себе за критеріями: це твоя самооцінка, не оцінка.</p>
            </div>
          )}
          <ol className="scenario-steps">
            {scenario.steps.map((st, i) => (
              <li key={st.itemId} data-status={st.status}>
                <span>{verb[st.skill]} · <span lang="fi">{titleOfStep(st.itemId)}</span></span>
                <small className="muted"> — {stepStatus[st.status]}{scenario.next === i ? " · наступний крок" : ""}</small>
                {run && scenario.next === i && <p className="scenario-condition" data-testid="scenario-condition">{run[i]!.condition_uk}</p>}
                {run && st.status !== "todo" && (
                  <StepCheck place={id} step={run[i]!} met={scenarioCheckOf(checks, id, st.skill)}
                    save={met => { try { setChecks(updateScenarioChecks(c => setScenarioCheck(c, id, run[i]!, met))); return true; } catch { setChecks(readScenarioChecks()); return false; } }} />
                )}
              </li>
            ))}
          </ol>
          {scenario.next !== null
            ? <button type="button" className="btn secondary" onClick={() => { const st = scenario.steps[scenario.next!]!; open(viewOfSkill(st.skill), st.itemId, run?.[scenario.next!]?.condition_uk); }}>
                {scenario.next === 0 ? "Почати справу" : `Продовжити: крок ${scenario.next + 1} з ${scenario.steps.length}`}</button>
            : <p className="voice-status" role="status" data-testid="scenario-done">
                Справу пройдено від початку до кінця{scenario.independent ? "" : " (аудіювання — з підтримкою тексту; спробуй ще раз без неї)"}. Письмо й говоріння не оцінюються автоматично — це твоя самостійна спроба, не оцінка.</p>}
        </section>
      )}

      <h2>Справи тут</h2>
      <ul className="choices" aria-label={`Справи: ${place.title_uk}`}>
        {place.quests.map(q => (
          <li key={`${q.view}-${q.itemId}`}><button type="button" className="choice" onClick={() => go(q)}>
            <span>{q.kindUk} · <span lang={q.titleLang}>{q.title}</span></span>
            <small>{status(q)}</small>
          </button></li>
        ))}
      </ul>

      <h2>Справа в реальному житті</h2>
      <p>{place.deed_uk}</p>
      <DeedMark place={place.id} log={deeds} save={saveDeeds} error={deedError} />

      <div className="actions"><button type="button" className="btn secondary" onClick={onHome}>На головну</button></div>
    </section>
  );
}

/**
 * task-based: after a step, the learner checks the step's task-success criteria themselves (what the task asked for, not
 * Finnish correctness). Saved on this device; a self-report, never a grade; "nothing met" is a valid honest answer.
 */
function StepCheck({ place, step, met, save }: { place: PlaceId; step: ScriptedStep; met: number[] | null; save: (met: number[]) => boolean }) {
  const [marks, setMarks] = useState<number[]>(met ?? []);
  const [editing, setEditing] = useState(met === null);
  const [error, setError] = useState<string | null>(null);
  if (!editing && met) return (
    <p className="muted" data-testid={`scenario-checked-${step.skill}`}>Твоя самоперевірка: {met.length} з {step.success_uk.length}.{" "}
      <button type="button" className="link-btn" onClick={() => { setMarks(met); setEditing(true); }}>Змінити</button></p>
  );
  return (
    <fieldset className="choices-set scenario-check" data-testid={`scenario-check-${step.skill}`}>
      <legend>Чи вдалося те, що просила ситуація? <span className="muted">(самоперевірка — не оцінка)</span></legend>
      {step.success_uk.map((c, i) => (
        <label key={c} className="radio"><input type="checkbox" name={`check-${place}-${step.skill}`} checked={marks.includes(i)}
          onChange={e => setMarks(m => e.target.checked ? [...m, i] : m.filter(x => x !== i))} /> {c}</label>
      ))}
      {error && <p className="feedback error" role="alert">{error}</p>}
      <div className="actions"><button type="button" className="btn secondary" onClick={() => {
        if (save(marks)) { setEditing(false); setError(null); } else setError("Браузер не зберіг самоперевірку. Нічого не змінено.");
      }}>Зберегти самоперевірку</button></div>
    </fieldset>
  );
}

const WENT_UK: Record<DeedWent, string> = { well: "Вдалося", partly: "Частково", hard: "Було важко" };

/**
 * real-world-interaction: an optional private mark that the learner did the deed in real life, and after it an optional
 * short reflection (how it went; what to say differently next time) that comes back at the top of this place next time.
 * Only on this device, never graded or counted, never part of progress or export; removable together with the mark.
 */
function DeedMark({ place, log, save, error }: { place: PlaceId; log: DeedLog; save: (change: (current: DeedLog) => DeedLog) => boolean; error: string | null }) {
  const done = deedDoneOn(log, place);
  const note = deedNote(log, place);
  const [editing, setEditing] = useState(false);
  const [went, setWent] = useState<DeedWent | null>(note?.went ?? null);
  const [text, setText] = useState(note?.next_uk ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const showForm = !!done && (!note || editing);
  const submit = () => {
    if (!went) { setFormError("Обери, як пройшло."); return; }
    setFormError(null);
    if (save(current => setDeedNote(current, place, went, text))) setEditing(false);
  };
  return (
    <div className="deed" data-testid="deed">
      {done
        ? <p className="voice-status" role="status">Ти позначив(ла): зроблено {new Date(`${done}T12:00:00`).toLocaleDateString("uk-UA")}.</p>
        : null}
      <p className="muted">Необов'язково. Застосунок цього не перевіряє. Позначка приватна: лише на цьому пристрої, без оцінки, не входить у прогрес, рівень чи копію даних.</p>
      {showForm && (
        <fieldset className="choices-set deed-reflection" data-testid="deed-reflection">
          <legend>Як пройшло? (за бажанням, лише для тебе)</legend>
          {DEED_WENT.map(w => (
            <label key={w} className="radio"><input type="radio" name={`went-${place}`} checked={went === w} onChange={() => setWent(w)} /> {WENT_UK[w]}</label>
          ))}
          <label className="field" htmlFor={`deed-next-${place}`}>Що наступного разу скажеш чи зробиш інакше? Будь-якою мовою.</label>
          <textarea id={`deed-next-${place}`} className="plan-notes" rows={2} maxLength={DEED_NOTE_MAX_CHARS} value={text} onChange={e => setText(e.target.value)} />
          <p className="muted">Нотатка з'явиться вгорі цього місця наступного разу. Вона не оцінюється й не потрапляє в копію даних.</p>
          {formError && <p className="feedback error" role="alert">{formError}</p>}
          <div className="actions">
            <button type="button" className="btn secondary" onClick={submit}>Зберегти нотатку</button>
            {editing && <button type="button" className="btn secondary" onClick={() => { setEditing(false); setWent(note?.went ?? null); setText(note?.next_uk ?? ""); }}>Скасувати</button>}
          </div>
        </fieldset>
      )}
      {done && note && !editing && (
        <div data-testid="deed-note">
          <p><strong>Як пройшло:</strong> {WENT_UK[note.went]}{note.next_uk && <> · <strong>Наступного разу:</strong> {note.next_uk}</>}</p>
          <div className="actions">
            <button type="button" className="btn secondary" onClick={() => setEditing(true)}>Змінити нотатку</button>
            <button type="button" className="btn secondary" onClick={() => { if (save(current => clearDeedNote(current, place))) { setWent(null); setText(""); } }}>Видалити нотатку</button>
          </div>
        </div>
      )}
      <div className="actions">
        {done
          ? <button type="button" className="btn secondary" onClick={() => { if (save(current => unmarkDeed(current, place))) { setWent(null); setText(""); setEditing(false); } }}>Зняти позначку</button>
          : <button type="button" className="btn secondary" onClick={() => save(current => markDeed(current, place, localDate()))}>Я зробив(ла) це в житті</button>}
      </div>
      {error && <p className="feedback error" role="alert">{error}</p>}
    </div>
  );
}

