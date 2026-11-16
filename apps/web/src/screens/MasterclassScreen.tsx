import { useRef, useState, type FormEvent } from "react";
import { addDiagnostic, masterclassEvidence, masterclassReducer, masterclassView, startMasterclass, MASTERCLASS_MAX_CHARS,
  type LearnerState, type Masterclass, type MasterclassEvent, type MasterclassJudgement, type MasterclassSession } from "@hospodar/domain";
import { MASTERCLASS_SKILL_UK, masterclasses, recordingLessonFor } from "../content/masterclasses.ts";
import type { LearnerRepository } from "../storage/learnerRepository.ts";
import { writeFailureAdvice } from "../storage/browserStorageHealth.ts";
import { Eyebrow, ThresholdRoute } from "../ui/MissionChrome.tsx";
import { Icon } from "../ui/icons.tsx";
import { TrustNote } from "../ui/TrustNote.tsx";

type Snap = { state: LearnerState; revision: number };
const JUDGE_UK: Record<MasterclassJudgement, string> = { same: "Те саме за змістом", partly: "Частково", different: "Інакше" };
const STEPS = ["Текст і питання", "Виправ відповідь", "Твоя відповідь", "Нова ситуація"];
const STEP_INDEX = { check: 0, checked: 0, repair: 1, repaired: 1, respond: 2, model: 2, transfer: 3, done: 4 } as const;
const code = (e: unknown) => String((e as { code?: string })?.code ?? "SAVE_FAILED");
const accent = (m: Masterclass) => (m.skill === "integrated" ? "reading" : m.skill);

/**
 * Masterclasses (packages/domain/src/masterclass.ts; CURATED-09): the saved lessons, each one short and in the same order —
 * own answers first, key, better version and model only after, then a new situation without them. Only the finished
 * lesson is saved (verified readback); an unfinished one is not kept across reloads, and the screen says so.
 */
export function MasterclassScreen({ repository, snapshot, onSaved, onHome, onListening }: {
  repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void; onHome: () => void; onListening: (lessonId: string) => void;
}) {
  const [open, setOpen] = useState<Masterclass | null>(null);
  const done = new Set(snapshot.state.diagnostics.map(d => d.taskId));
  if (open) return <MasterclassRun key={open.id} m={open} repository={repository} snapshot={snapshot} onSaved={onSaved} onListening={onListening}
    onNext={() => setOpen(masterclasses.find(x => x.id !== open.id && !done.has(`${x.id}-transfer`)) ?? null)} onList={() => setOpen(null)} />;
  return (
    <section className="panel" data-accent="reading" aria-labelledby="mc-title">
      <Eyebrow accent="reading">Навчання · майстер-класи</Eyebrow>
      <h1 id="mc-title">Майстер-класи</h1>
      <p>Короткі уроки на 25 хвилин, кожен про одну навичку. Спершу твої відповіді. Потім ключ, краща версія і зразок. Наостанок нова ситуація без зразка.</p>
      <TrustNote many>Підготовка до YKI keskitaso, не офіційні завдання. Тексти не оцінюються автоматично.</TrustNote>
      <ul className="choices" aria-label="Майстер-класи">
        {masterclasses.map((m, i) => (
          <li key={m.id}><button type="button" className="choice" onClick={() => setOpen(m)}>
            <span lang="fi">{i + 1}. {m.title_fi}</span>
            <small>{MASTERCLASS_SKILL_UK[m.skill]} · {m.goal_uk} · {done.has(`${m.id}-transfer`) ? "уже пройдено" : "ще не пройдено"}</small>
          </button></li>
        ))}
      </ul>
      <div className="actions"><button type="button" className="btn secondary" onClick={onHome}>На головну</button></div>
    </section>
  );
}

function MasterclassRun({ m, repository, snapshot, onSaved, onListening, onNext, onList }: {
  m: Masterclass; repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void; onListening: (id: string) => void; onNext: () => void; onList: () => void;
}) {
  const [s, setS] = useState<MasterclassSession>(() => startMasterclass(m));
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const busy = useRef(false);
  const v = masterclassView(s, m);
  const recording = recordingLessonFor(m);
  const speaking = m.produceSkill === "speaking";

  function step(e: MasterclassEvent) {
    setError(null);
    try { setS(masterclassReducer(s, m, e)); if (e.type !== "JUDGE") setValue(""); }
    catch (err) {
      const c = code(err);
      setError(c === "EMPTY" ? "Спершу напиши відповідь." : c === "INVALID" ? "Обери варіант." : c === "NOT_JUDGED" ? "Спершу порівняй свою відповідь зі зразком." : "Цей крок зараз недоступний.");
    }
  }
  async function finish(e: FormEvent) {
    e.preventDefault();
    if (busy.current || saved) return;
    let finished: MasterclassSession;
    try { finished = masterclassReducer(s, m, { type: "SUBMIT_TRANSFER", text: value }); }
    catch { setError("Спершу напиши відповідь."); return; }
    busy.current = true; setSaving(true); setError(null);
    try {
      let next = snapshot.state;
      for (const ev of masterclassEvidence(finished, m)) next = addDiagnostic(next, ev);
      const committed = await repository.commit(next, snapshot.revision);
      const verified = await repository.read();                          // success only after a fresh, exact readback
      if (verified.revision !== committed.revision || JSON.stringify(verified.state) !== JSON.stringify(next))
        throw Object.assign(new Error("Stored progress differs"), { code: "READBACK_MISMATCH" });
      onSaved(verified); setS(finished); setSaved(true); setValue("");
    } catch (err) {
      setError(`Не збережено (${code(err)}). Твій текст залишився в полі. ${writeFailureAdvice(err)}`);
    } finally { busy.current = false; setSaving(false); }
  }

  return (
    <section className="panel" data-accent={accent(m)} aria-labelledby="mc-run">
      <Eyebrow accent={accent(m)}>Майстер-клас · {MASTERCLASS_SKILL_UK[m.skill]} · {m.level}</Eyebrow>
      <h1 id="mc-run" lang="fi">{m.title_fi}</h1>
      <ThresholdRoute steps={STEPS} current={STEP_INDEX[s.phase]} accent={accent(m)} />
      <TrustNote />
      <p className="muted">{m.goal_uk}. Орієнтовно {m.minutes} хв, без таймера.</p>

      {s.phase === "check" && recording && (
        <p className="feedback" data-testid="mc-recording">Запис до цієї теми має власний урок аудіювання: його питання перевіряють слухання. Пройди його спершу, якщо хочеш.{" "}
          <button type="button" className="btn secondary" onClick={() => onListening(recording.id)}>Відкрити урок аудіювання</button></p>
      )}
      {v.input_fi && (
        <div className="mc-input">
          <p className="muted">{recording ? "Навчальний текст (не транскрипт запису)" : "Текст"}</p>
          <p className="prompt" lang="fi">{v.input_fi}</p>
        </div>
      )}

      {v.question && (
        <form onSubmit={e => { e.preventDefault(); step({ type: "ANSWER", index: value === "" ? -1 : Number(value) }); }} noValidate>
          <fieldset className="choices-set">
            <legend>Питання {v.question.n} з {v.question.of}: <span lang="fi">{v.question.question_fi}</span></legend>
            {v.question.options_fi.map((o, i) => (
              <label key={i} className="radio"><input type="radio" name="mc-q" checked={value === String(i)} onChange={() => setValue(String(i))} /> <span lang="fi">{o}</span></label>
            ))}
          </fieldset>
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions"><button type="submit" className="btn">Відповісти</button></div>
          <p className="muted">Відповідь фіксується. Ключі з'являться після обох питань. Незавершений урок не зберігається після перезавантаження.</p>
        </form>
      )}

      {v.results && (
        <>
          <ol className="skill-lines" aria-label="Твої відповіді й ключі">
            {v.results.map((r, i) => (
              <li key={i}><span lang="fi">{r.question_fi}</span>
                <p><strong>{r.correct ? "Правильно з першої спроби" : "Ще не так"}</strong> · твоя відповідь: <span lang="fi">{r.chosen_fi}</span>
                  {!r.correct && <> · ключ: <span lang="fi">{r.key_fi}</span></>}</p>
                <p className="muted">Де це в тексті: <span lang="fi">«{r.evidence_fi}»</span></p></li>
            ))}
          </ol>
          <div className="actions"><button type="button" className="btn" onClick={() => step({ type: "CONTINUE" })}>Далі</button></div>
        </>
      )}

      {s.phase === "repair" && v.bad_fi && (
        <form onSubmit={e => { e.preventDefault(); step({ type: "SUBMIT_REPAIR", text: value }); }} noValidate>
          <p className="muted">Невдала відповідь. Що в ній не так? Напиши краще сам(а).</p>
          <p className="prompt" lang="fi">{v.bad_fi}</p>
          <label className="field" htmlFor="mc-repair">Твоя краща версія фінською (без оцінки)</label>
          <textarea id="mc-repair" className="answer" lang="fi" rows={3} maxLength={MASTERCLASS_MAX_CHARS} value={value} onChange={e => setValue(e.target.value)} />
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions"><button type="submit" className="btn">Показати кращу версію</button></div>
        </form>
      )}
      {s.phase === "repaired" && (
        <>
          <p><strong>Твоя версія:</strong> <span lang="fi">{v.ownRepair}</span></p>
          <p className="feedback" role="status" data-testid="mc-corrected"><strong>Краща версія:</strong> <span lang="fi">{v.corrected_fi}</span></p>
          <p>{v.why_uk}</p>
          <div className="actions"><button type="button" className="btn" onClick={() => step({ type: "CONTINUE" })}>Далі</button></div>
        </>
      )}

      {s.phase === "respond" && v.prompt_fi && (
        <form onSubmit={e => { e.preventDefault(); step({ type: "SUBMIT_RESPONSE", text: value }); }} noValidate>
          <p className="prompt" lang="fi">{v.prompt_fi}</p>
          <label className="field" htmlFor="mc-response">{speaking ? "Скажи вголос і запиши свої репліки фінською (без оцінки)" : "Твоя відповідь фінською (без зразка, без оцінки)"}</label>
          <textarea id="mc-response" className="answer" lang="fi" rows={4} maxLength={MASTERCLASS_MAX_CHARS} value={value} onChange={e => setValue(e.target.value)} />
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions"><button type="submit" className="btn">Відповісти й побачити зразок</button></div>
        </form>
      )}
      {s.phase === "model" && (
        <>
          <p><strong>Твоя відповідь:</strong> <span lang="fi">{v.ownResponse}</span></p>
          <p className="feedback" role="status" data-testid="mc-model"><strong>Зразок:</strong> <span lang="fi">{v.model_fi}</span></p>
          {v.compare_uk && v.compare_uk.length > 0 && (
            <div data-testid="mc-compare"><p className="muted">Порівняй за цими ознаками (це не бал і не шкала YKI):</p>
              <ul>{v.compare_uk.map(c => <li key={c}>{c}</li>)}</ul></div>
          )}
          <div className="actions" role="group" aria-label="Порівняй свою відповідь зі зразком">
            {(Object.keys(JUDGE_UK) as MasterclassJudgement[]).map(j => (
              <button key={j} type="button" className="btn secondary" aria-pressed={v.judged === j} onClick={() => step({ type: "JUDGE", judgement: j })}>{JUDGE_UK[j]}</button>
            ))}
          </div>
          <p className="muted">Це самооцінка, не автоматична перевірка: правильних варіантів фінською буває кілька.</p>
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions"><button type="button" className="btn" onClick={() => step({ type: "CONTINUE" })}>Далі: нова ситуація</button></div>
        </>
      )}

      {s.phase === "transfer" && v.transfer_fi && (
        <form onSubmit={e => void finish(e)} noValidate>
          <p className="muted">Нова ситуація, без тексту й без зразка</p>
          <p className="prompt" lang="fi">{v.transfer_fi}</p>
          <label className="field" htmlFor="mc-transfer">{speaking ? "Твої репліки фінською (можна сказати вголос; без оцінки)" : "Твій текст фінською (без оцінки)"}</label>
          <textarea id="mc-transfer" className="answer" lang="fi" rows={4} maxLength={MASTERCLASS_MAX_CHARS} disabled={saving} value={value} onChange={e => setValue(e.target.value)} />
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions"><button type="submit" className="btn" disabled={saving}>{saving ? "Зберігаю…" : "Зберегти й завершити"}</button></div>
        </form>
      )}

      {saved && <p className="feedback" role="status"><Icon name="ok" /> Урок збережено на цьому пристрої. Два питання до тексту зараховано як читання; власні тексти — без оцінки.</p>}
      <div className="actions">
        {saved && <button type="button" className="btn" onClick={onNext}>Наступний майстер-клас</button>}
        <button type="button" className="btn secondary" disabled={saving} onClick={onList}>До списку майстер-класів</button>
      </div>
    </section>
  );
}
