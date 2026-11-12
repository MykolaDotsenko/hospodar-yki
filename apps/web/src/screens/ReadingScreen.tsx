import { useEffect, useRef, useState, type FormEvent } from "react";
import { addDiagnostic, readingEvidence, readingReducer, readingView, startReading, ReadingError,
  type LearnerState, type ReadingEvent, type ReadingItem, type ReadingJudgement, type ReadingSession } from "@hospodar/domain";
import { readingItems } from "../content/reading.ts";
import { readingPayload, validReadingDraft } from "../storage/readingDraft.ts";
import type { LearnerRepository, ReadingDraftRow } from "../storage/learnerRepository.ts";
import { writeFailureAdvice } from "../storage/browserStorageHealth.ts";
import { Eyebrow, ThresholdRoute } from "../ui/MissionChrome.tsx";
import { Icon } from "../ui/icons.tsx";
import { TrustNote } from "../ui/TrustNote.tsx";

type Snap = { state: LearnerState; revision: number };
type Loaded = { kind: "loading" } | { kind: "ready"; draft: ReadingDraftRow | null; blocked: string | null };
const JUDGE_UK: Record<ReadingJudgement, string> = { same: "Те саме за змістом", partly: "Частково", different: "Інше" };
const code = (e: unknown) => String((e as { code?: string })?.code ?? "SAVE_FAILED");

export function ReadingScreen({ repository, snapshot, onSaved, onHome }: {
  repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void; onHome: () => void;
}) {
  const [selected, setSelected] = useState<ReadingItem | null>(null);
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [discarding, setDiscarding] = useState(false);
  useEffect(() => {
    let alive = true;
    void repository.readReadingDraft().then(row => {
      if (!alive) return;
      const item = readingItems.find(i => i.id === row?.session?.itemId);
      const blocked = row && (!item || !validReadingDraft({
        session: row.session, input: row.input, contentFingerprint: row.contentFingerprint,
      }, item) || row.learnerRevision !== snapshot.revision)
        ? "Незавершене читання несумісне з поточним матеріалом або прогресом. Чернетку не відкрито, щоб не показати відповіді завчасно й не втратити роботу." : null;
      if (row && !blocked && item) setSelected(item); // Keep the completed stage mounted after atomic checkpoint removal.
      setLoaded({ kind: "ready", draft: row, blocked });
    }).catch(e => {
      if (alive) {
        setLoadError(code(e));
        setLoaded({ kind: "ready", draft: null, blocked: "Не вдалося прочитати незавершене читання. Нічого не перезаписано." });
      }
    });
    return () => { alive = false; };
  }, [repository, snapshot.revision]);

  async function discardBlocked() {
    if (loaded.kind !== "ready" || !loaded.draft || discarding) return;
    setDiscarding(true); setLoadError(null);
    try {
      await repository.discardReadingDraft(snapshot.revision, loaded.draft.revision);
      setLoaded({ kind: "ready", draft: null, blocked: null }); setSelected(null);
    } catch (e) { setLoadError(code(e)); }
    finally { setDiscarding(false); }
  }

  if (loaded.kind === "loading") return <section className="panel" role="status">Перевіряю незавершене читання…</section>;
  if (loaded.blocked) return (
    <section className="panel" aria-labelledby="rd-blocked">
      <h1 id="rd-blocked">Чернетка читання потребує уваги</h1>
      <p className="feedback warn" role="alert">{loaded.blocked}</p>
      {loadError && <p className="feedback error" role="alert">Помилка читання або відкидання ({loadError}). Нічого не перезаписано.</p>}
      <div className="actions">
        {loaded.draft && <button type="button" className="btn danger" disabled={discarding || loaded.draft.learnerRevision !== snapshot.revision}
          onClick={() => void discardBlocked()}>Відкинути несумісну чернетку</button>}
        <button type="button" className="btn secondary" onClick={onHome}>На головну</button>
      </div>
      {loaded.draft?.learnerRevision !== snapshot.revision && <p className="muted">Онови сторінку: прогрес іншої вкладки не можна перезаписувати.</p>}
    </section>
  );
  const resume = loaded.draft ? readingItems.find(i => i.id === loaded.draft?.session.itemId) ?? null : null;
  const item = resume ?? selected;
  const clear = () => { setSelected(null); setLoaded({ kind: "ready", draft: null, blocked: null }); };
  if (item) return <Reading key={item.id} item={item} repository={repository} snapshot={snapshot}
    initialDraft={resume ? loaded.draft : null} onSaved={onSaved} onExit={clear} onHome={onHome} />;
  const done = new Set(snapshot.state.diagnostics.map(d => d.taskId));
  return (
    <section className="panel" data-accent="reading" aria-labelledby="rd-title">
      <Eyebrow accent="reading">Навчання · читання</Eyebrow>
      <h1 id="rd-title">Читання з доказами</h1>
      <p>Спершу відповідаєш сам(а). Потім бачиш відповіді й підсвічене місце в тексті, де це сказано.</p>
      <TrustNote many>Тексти, що є в симуляції YKI, тут не показуються.</TrustNote>
      <ul className="choices" aria-label="Тексти">
        {readingItems.map(i => (
          <li key={i.id}><button type="button" className="choice" onClick={() => setSelected(i)}>
            <span lang="fi">{i.title_fi}</span>
            <small>{i.questions.length} питання{done.has(`${i.id}-transfer`) ? " · уже прочитано" : ""}</small>
          </button></li>
        ))}
      </ul>
      <div className="actions"><button type="button" className="btn secondary" onClick={onHome}>На головну</button></div>
    </section>
  );
}

function Reading({ item, repository, snapshot, initialDraft, onSaved, onExit, onHome }: {
  item: ReadingItem; repository: LearnerRepository; snapshot: Snap; initialDraft: ReadingDraftRow | null;
  onSaved: (s: Snap) => void; onExit: () => void; onHome: () => void;
}) {
  const [s, setS] = useState<ReadingSession>(() => initialDraft?.session ?? startReading(item));
  const latest = useRef(s); latest.current = s;
  const snap = useRef(snapshot); snap.current = snapshot;
  const [value, setValue] = useState(initialDraft?.input ?? "");
  const inputRef = useRef(initialDraft?.input ?? "");
  const draftRevision = useRef(initialDraft?.revision ?? 0);
  const lastWritten = useRef(initialDraft ? JSON.stringify(readingPayload(initialDraft.session, initialDraft.input, item)) : "");
  const queue = useRef<Promise<void>>(Promise.resolve());
  const generation = useRef(0);
  const busy = useRef(false);
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState<"idle" | "dirty" | "saving" | "saved" | "error">(initialDraft ? "saved" : "idle");
  const [error, setError] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const v = readingView(s, item);
  useEffect(() => { heading.current?.focus(); }, [s.phase, s.index]);

  function checkpoint(state: ReadingSession, input: string) {
    const payload = readingPayload(state, input, item);
    if (!validReadingDraft(payload, item)) return Promise.reject(new Error("INVALID_DRAFT"));
    const fingerprint = JSON.stringify(payload);
    const next = queue.current.then(async () => {
      if (fingerprint === lastWritten.current) return;
      setStatus("saving");
      const row = await repository.saveReadingDraft(payload, snap.current.revision, draftRevision.current);
      draftRevision.current = row.revision;
      lastWritten.current = fingerprint;
      setStatus("saved");
    });
    queue.current = next.catch(() => {});
    return next;
  }
  useEffect(() => {
    if (busy.current || s.phase === "done" || (s.phase === "questions" && !value && draftRevision.current === 0)) return;
    const id = generation.current;
    const timer = setTimeout(() => {
      if (id !== generation.current) return;
      void checkpoint(latest.current, inputRef.current).catch(e => {
        setStatus("error");
        setError("Автозбереження не підтверджене (" + code(e) + "). " + writeFailureAdvice(e));
      });
    }, 650);
    return () => clearTimeout(timer);
  }, [s, value, item]);

  function changeValue(next: string) {
    inputRef.current = next; generation.current++;
    setValue(next); setError(null); setStatus("dirty");
  }
  function handleError(e: unknown) {
    setStatus("error");
    setError("Збереження не підтверджене (" + code(e) + "). " + writeFailureAdvice(e));
  }
  async function transition(event: ReadingEvent) {
    if (busy.current) return;
    let next: ReadingSession;
    try { next = readingReducer(latest.current, item, event); }
    catch (e) {
      setError(e instanceof ReadingError && e.code === "NOT_JUDGED"
        ? "Спершу порівняй свої відкриті відповіді з прикладом." : "Спершу дай відповідь.");
      return;
    }
    busy.current = true; setWorking(true); generation.current++; setError(null);
    try {
      await queue.current;
      // Do not advance an answer, evidence key or transfer task before the checkpoint ACK.
      await checkpoint(next, "");
      latest.current = next; setS(next); inputRef.current = ""; setValue("");
    } catch (e) { handleError(e); }
    finally { busy.current = false; setWorking(false); }
  }
  async function finish(e: FormEvent) {
    e.preventDefault();
    if (busy.current) return;
    const exact = inputRef.current;
    let next: ReadingSession;
    try { next = readingReducer(latest.current, item, { type: "SUBMIT_TRANSFER", text: exact }); }
    catch { setError("Напиши свою відповідь фінською."); return; }
    busy.current = true; setWorking(true); generation.current++; setError(null); setStatus("saving");
    try {
      await queue.current;
      await checkpoint(latest.current, exact);
      let state = snap.current.state;
      for (const ev of readingEvidence(next, item)) state = addDiagnostic(state, ev);
      const saved = await repository.finishReadingDraft(state, snap.current.revision, draftRevision.current, item.id, exact);
      snap.current = saved; onSaved(saved);
      draftRevision.current = 0; lastWritten.current = "";
      latest.current = next; setS(next); inputRef.current = ""; setValue(""); setStatus("saved");
    } catch (err) { handleError(err); }
    finally { busy.current = false; setWorking(false); }
  }
  async function pause() {
    if (busy.current) return;
    const exact = s.phase === "questions" || s.phase === "transfer" ? inputRef.current : "";
    busy.current = true; setWorking(true); generation.current++; setError(null);
    try {
      await queue.current;
      if (!(s.phase === "questions" && !exact && draftRevision.current === 0)) {
        await checkpoint(latest.current, exact);
        const saved = await repository.readReadingDraft();
        if (!saved || saved.revision !== draftRevision.current ||
            JSON.stringify(readingPayload(saved.session, saved.input, item)) !== JSON.stringify(readingPayload(latest.current, exact, item)))
          throw new Error("READBACK_MISMATCH");
      }
      onHome();
    } catch (e) { handleError(e); }
    finally { busy.current = false; setWorking(false); }
  }
  async function discard() {
    if (busy.current) return;
    busy.current = true; setWorking(true); generation.current++; setError(null);
    try {
      await queue.current;
      if (draftRevision.current > 0) await repository.discardReadingDraft(snap.current.revision, draftRevision.current);
      onExit();
    } catch (e) { handleError(e); }
    finally { busy.current = false; setWorking(false); }
  }
  const title = { questions: "Прочитай і відповідай", feedback: "Що вийшло і де це в тексті",
    transfer: "Нове завдання — без тексту", done: "Готово" }[s.phase];
  return (
    <section className="panel" data-accent="reading" aria-labelledby="rdm-title">
      <Eyebrow accent="reading">Навчання · читання · <span lang="fi">{item.title_fi}</span></Eyebrow>
      <h1 id="rdm-title" ref={heading} tabIndex={-1}>{title}</h1>
      <ThresholdRoute steps={["Питання", "Перевірка", "Нова ситуація"]} current={{ questions: 0, feedback: 1, transfer: 2, done: 3 }[s.phase]} accent="reading" />
      <TrustNote />
      {initialDraft && s.phase !== "done" && <p className="feedback" role="status">Незавершене читання відновлено з цього пристрою.</p>}
      {v.showText && (
        <div className="prompt reading-text" lang="fi">
          {v.segments.map((seg, i) => seg.questionNumber === null ? <span key={i}>{seg.text}</span> : (
            <mark key={i} className="learning-cue evidence-span">{seg.text}<span className="cue-label" lang="uk"> ← питання {seg.questionNumber}</span></mark>
          ))}
        </div>
      )}
      {s.phase === "questions" && v.question && (
        <form onSubmit={e => { e.preventDefault(); void transition({ type: "ANSWER", questionId: v.question!.id, value: inputRef.current }); }} noValidate>
          {v.question.options_fi ? (
            <fieldset className="choices-set" disabled={working}>
              <legend><span className="muted">Питання {v.question.n} з {v.question.of} · </span><span lang="fi">{v.question.prompt_fi}</span></legend>
              {v.question.options_fi.map((o, i) => {
                const val = v.question!.type === "true_false" ? (i === 0 ? "true" : "false") : String(i);
                return <label key={`${v.question!.id}-${i}`} className="radio">
                  <input type="radio" name="rq" checked={value === val} onChange={() => changeValue(val)} /> <span lang="fi">{o}</span>
                </label>;
              })}
            </fieldset>
          ) : (
            <>
              <label className="field" htmlFor="rq-open"><span className="muted">Питання {v.question.n} з {v.question.of} · </span><span lang="fi">{v.question.prompt_fi}</span></label>
              <input id="rq-open" className="answer" lang="fi" autoComplete="off" maxLength={600} disabled={working}
                value={value} onInput={e => { inputRef.current = e.currentTarget.value; }}
                onChange={e => changeValue(e.target.value)} />
            </>
          )}
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions"><button type="submit" className="btn" disabled={working}>{working ? "Зберігаю…" : "Відповісти"}</button></div>
          <p className="muted">Перша відповідь фіксується; ключі й місце в тексті — після всіх питань.</p>
        </form>
      )}
      {s.phase === "feedback" && v.results && (
        <>
          <ol className="skill-lines">
            {v.results.map(r => (
              <li key={r.id}><span className="muted">Питання {r.n}: </span><span lang="fi">{r.prompt_fi}</span><br />
                {r.type === "open" ? (
                  <>
                    <strong>Твоя відповідь:</strong> <span lang="fi">{r.answer}</span><br /><strong>Приклад:</strong> <span lang="fi">{r.key_fi}</span>
                    <div className="actions" role="group" aria-label={`Порівняння, питання ${r.n}`}>
                      {(Object.keys(JUDGE_UK) as ReadingJudgement[]).map(j => (
                        <button key={j} type="button" className="btn secondary" disabled={working}
                          aria-pressed={r.judged === j} onClick={() => void transition({ type: "JUDGE", questionId: r.id, judgement: j })}>{JUDGE_UK[j]}</button>
                      ))}
                    </div>
                  </>
                ) : (
                  <><strong>{r.correct ? "Правильно з першої спроби" : "Ще не так"}</strong> · <span lang="fi">{r.key_fi}</span></>
                )}
              </li>
            ))}
          </ol>
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions">
            <button type="button" className="btn" disabled={working}
              onClick={() => void transition({ type: "TO_TRANSFER", kind: "writing" })}>Далі: написати</button>
            <button type="button" className="btn secondary" disabled={working}
              onClick={() => void transition({ type: "TO_TRANSFER", kind: "speaking" })}>Далі: сказати (план)</button>
          </div>
        </>
      )}
      {s.phase === "transfer" && (
        <form onSubmit={e => void finish(e)} noValidate>
          <p className="prompt" lang="fi">{v.transfer_fi}</p>
          <label className="field" htmlFor="rd-transfer">{v.transferKind === "speaking" ? "Твій план/репліки фінською (можна сказати вголос; без оцінки)" : "Твій текст фінською (без оцінки)"}</label>
          <textarea id="rd-transfer" className="answer" lang="fi" rows={4} maxLength={1600} disabled={working} value={value}
            onInput={e => { inputRef.current = e.currentTarget.value; }}
            onChange={e => changeValue(e.target.value)} />
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions"><button type="submit" className="btn" disabled={working}>{working ? "Зберігаю…" : "Зберегти й завершити"}</button></div>
        </form>
      )}
      {s.phase !== "done" && (
        <>
          <p className="muted" role="status">{
            status === "dirty" ? "Є зміни, які ще не підтверджено в сховищі." :
            status === "saving" ? "Зберігаю на пристрої…" :
            status === "saved" ? "Чернетку підтверджено в сховищі пристрою." :
            status === "error" ? "Чернетку не підтверджено — не закривай вкладку." : "Чернетка ще не збережена."
          }</p>
          <div className="actions">
            <button type="button" className="btn secondary" disabled={working} onClick={() => void pause()}>Зберегти та вийти</button>
            <button type="button" className="btn danger" disabled={working} onClick={() => void discard()}>Відкинути чернетку</button>
          </div>
        </>
      )}
      {s.phase === "done" && (
        <div className="feedback" role="status">
          <p><Icon name="ok" /> Збережено на цьому пристрої: відповіді з вибором — з першої спроби; відкриті відповіді й нове завдання — без оцінки.</p>
          <div className="actions"><button type="button" className="btn" onClick={onExit}>До списку текстів</button></div>
        </div>
      )}
    </section>
  );
}
