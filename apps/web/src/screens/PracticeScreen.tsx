import { useRef, useState, type FormEvent } from "react";
import { addDiagnostic, practiceEvidence, practiceReducer, practiceView, startPractice, PRACTICE_MAX_CHARS,
  type LearnerState, type PracticeCard, type PracticeEvent, type PracticeJudgement, type PracticeKind, type PracticeLine, type PracticeSession } from "@hospodar/domain";
import { PRACTICE_KINDS, practiceCards } from "../content/practice.ts";
import type { LearnerRepository } from "../storage/learnerRepository.ts";
import { writeFailureAdvice } from "../storage/browserStorageHealth.ts";

type Snap = { state: LearnerState; revision: number };
const JUDGE_UK: Record<PracticeJudgement, string> = { same: "Те саме за змістом", partly: "Частково", different: "Інакше" };
const code = (e: unknown) => String((e as { code?: string })?.code ?? "SAVE_FAILED");

/**
 * Practice without a hint (packages/domain/src/practice.ts). Own answer first, then the model,
 * then a new situation. Only the finished card is saved (verified readback); an unfinished card is
 * short and is NOT kept across reloads — the screen says so.
 */
export function PracticeScreen({ repository, snapshot, onSaved, onHome }: { repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void; onHome: () => void }) {
  const [kind, setKind] = useState<PracticeKind | null>(null);
  const [card, setCard] = useState<PracticeCard | null>(null);
  const done = new Set(snapshot.state.diagnostics.map(d => d.taskId));

  if (card) return <PracticeRun key={card.id} card={card} repository={repository} snapshot={snapshot} onSaved={onSaved}
    onNext={() => { const pool = practiceCards.filter(c => c.kind === card.kind && c.id !== card.id && !done.has(`${c.id}-transfer`)); setCard(pool[0] ?? null); }}
    onList={() => setCard(null)} />;

  const meta = PRACTICE_KINDS.find(k => k.kind === kind);
  return (
    <section className="panel" aria-labelledby="pr-title">
      <p className="eyebrow">Навчання · практика без підказки</p>
      <h1 id="pr-title">{meta ? meta.title : "Практика без підказки"}</h1>
      <p>Спершу твоя власна відповідь. Лише потім — зразок і пояснення. Наостанок — нова ситуація без зразка.</p>
      <p className="draft-note">Чернетки: ще не перевірено S2-викладачем. Тексти не оцінюються автоматично.</p>
      {!meta ? (
        <ul className="choices" aria-label="Види практики">
          {PRACTICE_KINDS.map(k => {
            const pool = practiceCards.filter(c => c.kind === k.kind);
            const finished = pool.filter(c => done.has(`${c.id}-transfer`)).length;
            return <li key={k.kind}><button type="button" className="choice" onClick={() => setKind(k.kind)}>
              <span>{k.title}</span><small>{k.about} · пройдено {finished} з {pool.length}</small>
            </button></li>;
          })}
        </ul>
      ) : (
        <>
          <p className="muted">{meta.about}</p>
          <ul className="choices" aria-label={meta.title}>
            {practiceCards.filter(c => c.kind === kind).map((c, i) => (
              <li key={c.id}><button type="button" className="choice" onClick={() => setCard(c)}>
                <span>Картка {i + 1}</span>
                <small>{c.group} · {done.has(`${c.id}-transfer`) ? "уже пройдено" : "ще не пройдено"}</small>
              </button></li>
            ))}
          </ul>
        </>
      )}
      <div className="actions">
        {meta && <button type="button" className="btn secondary" onClick={() => setKind(null)}>Інші види практики</button>}
        <button type="button" className="btn secondary" onClick={onHome}>На головну</button>
      </div>
    </section>
  );
}

function Lines({ lines }: { lines: PracticeLine[] }) {
  return <dl className="skill-lines">{lines.map((l, i) => (
    <div key={i}><dt className="muted">{l.label_uk}</dt><dd className={l.lang === "fi" ? "prompt" : undefined} lang={l.lang}>{l.text}</dd></div>
  ))}</dl>;
}

function PracticeRun({ card, repository, snapshot, onSaved, onNext, onList }: { card: PracticeCard; repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void; onNext: () => void; onList: () => void }) {
  const [s, setS] = useState<PracticeSession>(() => startPractice(card));
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const busy = useRef(false);
  const v = practiceView(s, card);

  function step(e: PracticeEvent) {
    setError(null);
    try { setS(practiceReducer(s, card, e)); if (e.type !== "JUDGE") setValue(""); }
    catch (err) {
      const c = code(err);
      setError(c === "EMPTY" ? "Спершу напиши відповідь." : c === "INVALID" ? "Обери варіант." : c === "NOT_JUDGED" ? "Спершу порівняй свою відповідь зі зразком." : "Цей крок зараз недоступний.");
    }
  }
  async function finish(e: FormEvent) {
    e.preventDefault();
    if (busy.current || saved) return;
    let finished: PracticeSession;
    try { finished = practiceReducer(s, card, { type: "SUBMIT_TRANSFER", text: value }); }
    catch { setError("Спершу напиши відповідь."); return; }
    busy.current = true; setSaving(true); setError(null);
    try {
      let next = snapshot.state;
      for (const ev of practiceEvidence(finished, card)) next = addDiagnostic(next, ev);
      const committed = await repository.commit(next, snapshot.revision);
      const verified = await repository.read();                        // success only after a fresh, exact readback
      if (verified.revision !== committed.revision || JSON.stringify(verified.state) !== JSON.stringify(next))
        throw Object.assign(new Error("Stored progress differs"), { code: "READBACK_MISMATCH" });
      onSaved(verified); setS(finished); setSaved(true); setValue("");
    } catch (err) {
      setError(`Не збережено (${code(err)}). Твій текст залишився в полі. ${writeFailureAdvice(err)}`);
    } finally { busy.current = false; setSaving(false); }
  }
  const meta = PRACTICE_KINDS.find(k => k.kind === card.kind)!;
  const speaking = card.transferSkill === "speaking";

  return (
    <section className="panel" aria-labelledby="pr-run">
      <p className="eyebrow">Практика без підказки · {meta.title}</p>
      <h1 id="pr-run">{card.group}</h1>
      <p className="draft-note">Чернетка, ще не перевірена S2-викладачем</p>
      {v.prompt.length > 0 && <Lines lines={v.prompt} />}

      {s.phase === "attempt" && (
        <form onSubmit={e => { e.preventDefault(); step({ type: "ANSWER", value }); }} noValidate>
          {v.options_fi ? (
            <fieldset className="choices-set">
              <legend>Обери речення з тим самим значенням</legend>
              {v.options_fi.map((o, i) => (
                <label key={i} className="radio"><input type="radio" name="pr-choice" checked={value === String(i)} onChange={() => setValue(String(i))} /> <span lang="fi">{o}</span></label>
              ))}
            </fieldset>
          ) : (
            <>
              <label className="field" htmlFor="pr-first">{card.attemptSkill === "speaking" ? "Скажи вголос і запиши свої репліки фінською (без оцінки)" : "Твоя відповідь фінською (без зразка, без оцінки)"}</label>
              <textarea id="pr-first" className="answer" lang="fi" rows={3} maxLength={PRACTICE_MAX_CHARS} value={value} onChange={e => setValue(e.target.value)} />
            </>
          )}
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions"><button type="submit" className="btn">Відповісти</button></div>
          <p className="muted">Перша відповідь фіксується. Зразок з'явиться після неї. Незавершена картка не зберігається після перезавантаження.</p>
        </form>
      )}

      {s.phase === "reveal" && v.reveal && (
        <>
          <p><strong>Твоя відповідь:</strong> <span lang="fi">{v.first}</span></p>
          {v.key_fi !== null && <p className="feedback" role="status"><strong>{v.correct ? "Правильно з першої спроби" : "Ще не так"}</strong> · <span lang="fi">{v.key_fi}</span></p>}
          <Lines lines={v.reveal} />
          {v.needsJudgement && (
            <div className="actions" role="group" aria-label="Порівняй свою відповідь зі зразком">
              {(Object.keys(JUDGE_UK) as PracticeJudgement[]).map(j => (
                <button key={j} type="button" className="btn secondary" aria-pressed={v.judged === j} onClick={() => step({ type: "JUDGE", judgement: j })}>{JUDGE_UK[j]}</button>
              ))}
            </div>
          )}
          {v.needsJudgement && <p className="muted">Це самооцінка, не автоматична перевірка: правильних варіантів фінською буває кілька.</p>}
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions"><button type="button" className="btn" onClick={() => step({ type: "CONTINUE" })}>Далі</button></div>
        </>
      )}

      {s.phase === "recall" && (
        <form onSubmit={e => { e.preventDefault(); step({ type: "SUBMIT_RECALL", text: value }); }} noValidate>
          <label className="field" htmlFor="pr-recall">{v.recall_uk}</label>
          <textarea id="pr-recall" className="answer" lang="fi" rows={3} maxLength={PRACTICE_MAX_CHARS} value={value} onChange={e => setValue(e.target.value)} />
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions"><button type="submit" className="btn">Далі</button></div>
        </form>
      )}

      {s.phase === "transfer" && v.transfer && (
        <form onSubmit={e => void finish(e)} noValidate>
          <p className="muted">{v.transfer.label_uk}</p>
          <p className={v.transfer.lang === "fi" ? "prompt" : undefined} lang={v.transfer.lang}>{v.transfer.text}</p>
          <label className="field" htmlFor="pr-transfer">{speaking ? "Твої репліки фінською (можна сказати вголос; без оцінки)" : "Твій текст фінською (без оцінки)"}</label>
          <textarea id="pr-transfer" className="answer" lang="fi" rows={3} maxLength={PRACTICE_MAX_CHARS} disabled={saving} value={value} onChange={e => setValue(e.target.value)} />
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions"><button type="submit" className="btn" disabled={saving}>{saving ? "Зберігаю…" : "Зберегти й завершити"}</button></div>
        </form>
      )}

      {saved && <p className="feedback" role="status">✅ Картку збережено на цьому пристрої. Тексти — без оцінки.</p>}
      <div className="actions">
        {saved && <button type="button" className="btn" onClick={onNext}>Наступна картка</button>}
        <button type="button" className="btn secondary" disabled={saving} onClick={onList}>До списку карток</button>
      </div>
    </section>
  );
}
