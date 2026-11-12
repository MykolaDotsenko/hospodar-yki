import { useRef, useState, type FormEvent } from "react";
import { completePractice, isSpacedKind, practiceDue, practiceReducer, practiceView, startPractice, PRACTICE_MAX_CHARS,
  type LearnerState, type PracticeCard, type PracticeEvent, type PracticeJudgement, type PracticeKind, type PracticeLine, type PracticeSession } from "@hospodar/domain";
import { PRACTICE_KINDS, groupLabel, practiceCards } from "../content/practice.ts";
import type { LearnerRepository } from "../storage/learnerRepository.ts";
import { writeFailureAdvice } from "../storage/browserStorageHealth.ts";
import { Eyebrow, ThresholdRoute } from "../ui/MissionChrome.tsx";
import { Icon } from "../ui/icons.tsx";
import { TrustNote } from "../ui/TrustNote.tsx";

type Snap = { state: LearnerState; revision: number };
const JUDGE_UK: Record<PracticeJudgement, string> = { same: "Те саме за змістом", partly: "Частково", different: "Інакше" };
const code = (e: unknown) => String((e as { code?: string })?.code ?? "SAVE_FAILED");

/**
 * Practice without a hint (packages/domain/src/practice.ts). Own answer first, then the model,
 * then a new situation. Only the finished card is saved (verified readback); an unfinished card is
 * short and is NOT kept across reloads — the screen says so.
 */
export function PracticeScreen({ repository, snapshot, onSaved, onHome, initialCardId }: { repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void; onHome: () => void; initialCardId?: string | null }) {
  const start = practiceCards.find(c => c.id === initialCardId) ?? null;   // opened from a place in «Моє господарство»
  const [kind, setKind] = useState<PracticeKind | null>(start?.kind ?? null);
  const [card, setCard] = useState<PracticeCard | null>(start);
  const done = new Set(snapshot.state.diagnostics.map(d => d.taskId));

  const due = practiceDue(snapshot.state, practiceCards);
  const [runId, setRunId] = useState(0);                                  // a due card may be the same card again
  const open = (c: PracticeCard | null) => { setCard(c); setRunId(n => n + 1); };

  if (card) return <PracticeRun key={`${card.id}-${runId}`} card={card} review={card.id in snapshot.state.cards} repository={repository} snapshot={snapshot} onSaved={onSaved}
    onNext={() => open(due.find(c => c.id !== card.id) ?? practiceCards.find(c => c.kind === card.kind && c.id !== card.id && !done.has(`${c.id}-transfer`)) ?? null)}
    onList={() => open(null)} />;

  const meta = PRACTICE_KINDS.find(k => k.kind === kind);
  return (
    <section className="panel" data-accent="grammar" aria-labelledby="pr-title">
      <Eyebrow accent="grammar">Навчання · практика без підказки</Eyebrow>
      <h1 id="pr-title">{meta ? meta.title : "Практика без підказки"}</h1>
      <p>Спершу твоя власна відповідь. Лише потім — зразок і пояснення. Наостанок — нова ситуація без зразка.</p>
      <TrustNote many>Тексти не оцінюються автоматично.</TrustNote>
      {!meta && due.length > 0 && (
        <p className="feedback" role="status">Сьогодні на повторення: <strong>{due.length}</strong> — фрази, які ти минулого разу не згадав(ла).{" "}
          <button type="button" className="btn" onClick={() => open(due[0]!)}>Повторити</button></p>
      )}
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
              <li key={c.id}><button type="button" className="choice" onClick={() => open(c)}>
                <span>Картка {i + 1}</span>
                <small>{groupLabel(c.group)} · {done.has(`${c.id}-transfer`) ? "уже пройдено" : "ще не пройдено"}</small>
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

function PracticeRun({ card, review, repository, snapshot, onSaved, onNext, onList }: { card: PracticeCard; review: boolean; repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void; onNext: () => void; onList: () => void }) {
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
      const next = completePractice(snapshot.state, finished, card);
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
  const planning = card.kind === "opinion";                                // pre-task planning only before a monologue
  const routeSteps = card.kind === "paraphrase" ? ["Твій вибір", "Пояснення", "Своїми словами", "Нова ситуація"]
    : planning ? ["План і відповідь", "Зразок", "Нова ситуація"] : ["Твоя відповідь", "Зразок", "Нова ситуація"];
  // The optional plan shares the first step with the answer, so a skipped plan is never announced as "done".
  const routeIndex = card.kind === "paraphrase" ? { plan: 0, attempt: 0, reveal: 1, recall: 2, transfer: 3, done: 4 }[s.phase]
    : { plan: 0, attempt: 0, reveal: 1, recall: 1, transfer: 2, done: 3 }[s.phase];
  const speaking = card.transferSkill === "speaking";

  return (
    <section className="panel" data-accent={card.attemptSkill} aria-labelledby="pr-run">
      <Eyebrow accent={card.attemptSkill}>Практика без підказки · {meta.title}</Eyebrow>
      <h1 id="pr-run"{...(card.kind === "rektio" ? { lang: "fi" } : {})}>{groupLabel(card.group)}</h1>
      <ThresholdRoute steps={routeSteps} current={routeIndex} accent={card.attemptSkill} />
      <TrustNote />
      {review && s.phase === "attempt" && <p className="muted">Повторення: згадай без зразка.</p>}
      {v.prompt.length > 0 && <Lines lines={v.prompt} />}

      {s.phase === "plan" && v.planFrame_uk && (
        <form className="plan-step" onSubmit={e => { e.preventDefault(); step({ type: "SUBMIT_PLAN", text: value }); }} noValidate>
          <p>Короткий план перед тим, як говорити. Без таймера й без оцінки. Коли почнеш відповідати, план сховається: говори з пам'яті, а не з нотаток.</p>
          <ol className="plan-frame">{v.planFrame_uk.map(q => <li key={q}>{q}</li>)}</ol>
          <label className="field" htmlFor="pr-plan">Твій план — ключові слова будь-якою мовою</label>
          <textarea id="pr-plan" className="plan-notes" rows={3} maxLength={PRACTICE_MAX_CHARS} value={value} onChange={e => setValue(e.target.value)} />
          <div className="actions">
            <button type="submit" className="btn">План готовий — відповідати</button>
            <button type="button" className="btn secondary" onClick={() => step({ type: "SUBMIT_PLAN", text: "" })}>Без плану</button>
          </div>
        </form>
      )}

      {s.phase === "attempt" && v.canPlan && (
        <div className="actions">
          <button type="button" className="btn secondary" onClick={() => step({ type: "START_PLAN" })}>Скласти план (за бажанням)</button>
        </div>
      )}
      {s.phase === "attempt" && v.planHidden && (
        <p className="muted" role="status">План сховано — говори з пам'яті. Після відповіді він повернеться поруч зі зразком.</p>
      )}

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
          {v.plan && <p className="plan-back"><strong>Твій план:</strong> {v.plan}<br /><span className="muted">Порівняй: що з плану ти встиг(ла) сказати, а що можна додати?</span></p>}
          {v.key_fi !== null && <p className="feedback" role="status"><strong>{v.correct ? "Правильно з першої спроби" : "Ще не так"}</strong> · <span lang="fi">{v.key_fi}</span></p>}
          <Lines lines={v.reveal} />
          {v.needsJudgement && (
            <div className="actions" role="group" aria-label="Порівняй свою відповідь зі зразком">
              {(Object.keys(JUDGE_UK) as PracticeJudgement[]).map(j => (
                <button key={j} type="button" className="btn secondary" aria-pressed={v.judged === j} onClick={() => step({ type: "JUDGE", judgement: j })}>{JUDGE_UK[j]}</button>
              ))}
            </div>
          )}
          {v.needsJudgement && <p className="muted">Це самооцінка, не автоматична перевірка: правильних варіантів фінською буває кілька.{isSpacedKind(card) && " Якщо «частково» чи «інакше» — фраза повернеться на повторення (1, 3, 7, 14, 30 днів)."}</p>}
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

      {saved && <p className="feedback" role="status"><Icon name="ok" /> Картку збережено на цьому пристрої. Тексти — без оцінки.
        {isSpacedKind(card) && s.judged !== "same" && " Цю фразу повторимо завтра: ти позначив(ла), що ще не згадуєш її точно."}
        {isSpacedKind(card) && s.judged === "same" && review && " Наступне повторення — через довший проміжок."}</p>}
      <div className="actions">
        {saved && <button type="button" className="btn" onClick={onNext}>Наступна картка</button>}
        <button type="button" className="btn secondary" disabled={saving} onClick={onList}>До списку карток</button>
      </div>
    </section>
  );
}
