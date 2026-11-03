import { useEffect, useRef, useState, type FormEvent } from "react";
import { addDiagnostic, readingEvidence, readingReducer, readingView, startReading, ReadingError,
  type LearnerState, type ReadingEvent, type ReadingItem, type ReadingJudgement, type ReadingSession } from "@hospodar/domain";
import { readingItems } from "../content/reading.ts";
import type { LearnerRepository } from "../storage/learnerRepository.ts";

type Snap = { state: LearnerState; revision: number };
const JUDGE_UK: Record<ReadingJudgement, string> = { same: "Те саме за змістом", partly: "Частково", different: "Інше" };

export function ReadingScreen({ repository, snapshot, onSaved, onHome }: { repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void; onHome: () => void }) {
  const [item, setItem] = useState<ReadingItem | null>(null);
  if (item) return <Reading key={item.id} item={item} repository={repository} snapshot={snapshot} onSaved={onSaved} onExit={() => setItem(null)} />;
  const done = new Set(snapshot.state.diagnostics.map(d => d.taskId));
  return (
    <section className="panel" aria-labelledby="rd-title">
      <p className="eyebrow">Навчання · читання</p>
      <h1 id="rd-title">Читання з доказами</h1>
      <p>Спершу відповідаєш сам(а). Потім бачиш відповіді й підсвічене місце в тексті, де це сказано.</p>
      <p className="draft-note">Чернетки: ще не перевірено S2-викладачем. Тексти, що є в симуляції YKI, тут не показуються.</p>
      <ul className="choices" aria-label="Тексти">
        {readingItems.map(i => (
          <li key={i.id}><button type="button" className="choice" onClick={() => setItem(i)}>
            <span lang="fi">{i.title_fi}</span>
            <small>{i.questions.length} питання{done.has(`${i.id}-transfer`) ? " · уже прочитано" : ""}</small>
          </button></li>
        ))}
      </ul>
      <div className="actions"><button type="button" className="btn secondary" onClick={onHome}>На головну</button></div>
    </section>
  );
}

function Reading({ item, repository, snapshot, onSaved, onExit }: { item: ReadingItem; repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void; onExit: () => void }) {
  const [s, setS] = useState<ReadingSession>(() => startReading(item));
  const latest = useRef(s); latest.current = s;
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"idle" | "saving" | { error: string }>("idle");
  const heading = useRef<HTMLHeadingElement>(null);
  const v = readingView(s, item);
  useEffect(() => { heading.current?.focus(); }, [s.phase, s.index]);
  const act = (e: ReadingEvent) => {
    setError(null);
    try { const n = readingReducer(latest.current, item, e); latest.current = n; setS(n); return true; }
    catch (err) { setError(err instanceof ReadingError && err.code === "NOT_JUDGED" ? "Спершу порівняй свої відкриті відповіді з прикладом." : "Спершу дай відповідь."); return false; }
  };
  async function finish(e: FormEvent) {
    e.preventDefault();
    let next: ReadingSession;
    try { next = readingReducer(latest.current, item, { type: "SUBMIT_TRANSFER", text: value }); setError(null); }
    catch { setError("Напиши свою відповідь фінською."); return; }
    setSaving("saving");
    try {
      let st = snapshot.state;
      for (const ev of readingEvidence(next, item)) st = addDiagnostic(st, ev);
      onSaved(await repository.commit(st, snapshot.revision));
      latest.current = next; setS(next); setValue(""); setSaving("idle");      // done only after the commit
    } catch (err) { setSaving({ error: String((err as { code?: string })?.code ?? "SAVE_FAILED") }); }
  }
  const title = { questions: "Прочитай і відповідай", feedback: "Що вийшло і де це в тексті", transfer: "Нове завдання — без тексту", done: "Готово" }[s.phase];
  return (
    <section className="panel" aria-labelledby="rdm-title">
      <p className="eyebrow">Навчання · читання · <span lang="fi">{item.title_fi}</span></p>
      <h1 id="rdm-title" ref={heading} tabIndex={-1}>{title}</h1>
      <p className="draft-note">Чернетка: ще не перевірено S2-викладачем.</p>
      {v.showText && (
        <div className="prompt reading-text" lang="fi">
          {v.segments.map((seg, i) => seg.questionNumber === null ? <span key={i}>{seg.text}</span> : (
            <mark key={i} className="learning-cue evidence-span">{seg.text}<span className="cue-label" lang="uk"> ← питання {seg.questionNumber}</span></mark>
          ))}
        </div>
      )}
      {s.phase === "questions" && v.question && (
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); if (act({ type: "ANSWER", questionId: v.question!.id, value })) setValue(""); }} noValidate>
          {v.question.options_fi ? (
            <fieldset className="choices-set">
              <legend><span className="muted">Питання {v.question.n} з {v.question.of} · </span><span lang="fi">{v.question.prompt_fi}</span></legend>
              {v.question.options_fi.map((o, i) => {
                const val = v.question!.type === "true_false" ? (i === 0 ? "true" : "false") : String(i);
                return <label key={`${v.question!.id}-${i}`} className="radio"><input type="radio" name="rq" checked={value === val} onChange={() => setValue(val)} /> <span lang="fi">{o}</span></label>;
              })}
            </fieldset>
          ) : (
            <>
              <label className="field" htmlFor="rq-open"><span className="muted">Питання {v.question.n} з {v.question.of} · </span><span lang="fi">{v.question.prompt_fi}</span></label>
              <input id="rq-open" className="answer" lang="fi" autoComplete="off" maxLength={600} value={value} onChange={e => setValue(e.target.value)} />
            </>
          )}
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions"><button type="submit" className="btn">Відповісти</button></div>
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
                        <button key={j} type="button" className="btn secondary" aria-pressed={r.judged === j} onClick={() => act({ type: "JUDGE", questionId: r.id, judgement: j })}>{JUDGE_UK[j]}</button>
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
            <button type="button" className="btn" onClick={() => act({ type: "TO_TRANSFER", kind: "writing" })}>Далі: написати</button>
            <button type="button" className="btn secondary" onClick={() => act({ type: "TO_TRANSFER", kind: "speaking" })}>Далі: сказати (план)</button>
          </div>
        </>
      )}
      {s.phase === "transfer" && (
        <form onSubmit={e => void finish(e)} noValidate>
          <p className="prompt" lang="fi">{v.transfer_fi}</p>
          <label className="field" htmlFor="rd-transfer">{v.transferKind === "speaking" ? "Твій план/репліки фінською (можна сказати вголос; без оцінки)" : "Твій текст фінською (без оцінки)"}</label>
          <textarea id="rd-transfer" className="answer" lang="fi" rows={4} maxLength={1600} value={value} onChange={e => setValue(e.target.value)} />
          {error && <p className="feedback error" role="alert">{error}</p>}
          {typeof saving === "object" && <p className="feedback error" role="alert">НЕ збережено ({saving.error}). Текст лишився тут — спробуй ще раз.</p>}
          <div className="actions"><button type="submit" className="btn" disabled={saving === "saving"}>{saving === "saving" ? "Зберігаю…" : "Зберегти й завершити"}</button></div>
        </form>
      )}
      {s.phase === "done" && (
        <div className="feedback" role="status">
          <p>✅ Збережено на цьому пристрої: відповіді з вибором — з першої спроби; відкриті відповіді й нове завдання — без оцінки.</p>
          <div className="actions"><button type="button" className="btn" onClick={onExit}>До списку текстів</button></div>
        </div>
      )}
    </section>
  );
}
