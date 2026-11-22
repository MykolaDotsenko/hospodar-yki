import { useEffect, useRef, useState, type FormEvent } from "react";
import { addDiagnostic, argumentMapPlan, readArgumentMap, ARGUMENT_MAP_SLOTS, ARGUMENT_NODE_MAX_CHARS, type ArgumentMap, fluencyEvidence, fluencySecondsLeft, FLUENCY_ROUNDS_SECONDS, type FluencyFeel, completePractice, hasOwnCue, spacedOutcome, type SpacedOutcome, practiceDraft, restorePracticeDraft, isSpacedKind, nextPracticeCard, practiceDue, practiceReducer, practiceView, startPractice, stepUpFor, hasInterlocutorLadder, PRACTICE_MAX_CHARS, OWN_CUE_MAX_CHARS,
  type LearnerState, type PracticeCard, type PracticeEvent, type PracticeJudgement, type PracticeKind, type PracticeLine, type PracticeSession } from "@hospodar/domain";
import { PRACTICE_KINDS, groupLabel, practiceCards } from "../content/practice.ts";
import { illustrations } from "../content/media.ts";
import type { LearnerRepository } from "../storage/learnerRepository.ts";
import { writeFailureAdvice } from "../storage/browserStorageHealth.ts";
import { clearPracticeDraft, readPracticeDrafts, writePracticeDraft } from "../storage/practiceDrafts.ts";
import { Eyebrow, ThresholdRoute } from "../ui/MissionChrome.tsx";
import { Icon } from "../ui/icons.tsx";
import { TrustNote } from "../ui/TrustNote.tsx";
import { InterlocutorShift } from "./InterlocutorShift.tsx";
import { StepUp } from "./StepUp.tsx";

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
  const drafts = readPracticeDrafts();                                     // COG-11: unfinished cards on this device
  const [runId, setRunId] = useState(0);                                  // a due card may be the same card again
  const open = (c: PracticeCard | null) => { setCard(c); setRunId(n => n + 1); };

  if (card) return <PracticeRun key={`${card.id}-${runId}`} card={card} review={card.id in snapshot.state.cards} repository={repository} snapshot={snapshot} onSaved={onSaved}
    onNext={() => open(due.find(c => c.id !== card.id) ?? nextPracticeCard(practiceCards, card, id => done.has(`${id}-transfer`)))}   // rektio: next case differs (interleaving-grammar)
    onList={() => open(null)} />;

  const meta = PRACTICE_KINDS.find(k => k.kind === kind);
  return (
    <section className="panel" data-accent="grammar" aria-labelledby="pr-title">
      <Eyebrow accent="grammar">Навчання · практика без підказки</Eyebrow>
      <h1 id="pr-title">{meta ? meta.title : "Практика без підказки"}</h1>
      <p>Спершу твоя власна відповідь. Лише потім — зразок і пояснення. Наостанок — нова ситуація без зразка.</p>
      <TrustNote many>Тексти не оцінюються автоматично.</TrustNote>
      {!meta && due.length > 0 && (
        <p className="feedback" role="status">Сьогодні на повторення: <strong>{due.length}</strong> — фрази й завдання, які ти минулого разу не згадав(ла).{" "}
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
                <small>{groupLabel(c.group)} · {c.id in drafts ? "незавершена — продовжиться з того самого місця" : done.has(`${c.id}-transfer`) ? "уже пройдено" : "ще не пройдено"}</small>
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

/** The own plan back next to the model: drawn as the argument map when it is one, else as the learner wrote it. */
function PlanBack({ plan }: { plan: string }) {
  const nodes = readArgumentMap(plan);
  return (
    <div className="plan-back">
      <p><strong>{nodes ? "Твоя мапа аргументів" : "Твій план"}:</strong>{nodes ? null : <> {plan}</>}</p>
      {nodes && (
        <ol className="argument-map" data-testid="argument-map">
          {nodes.map((n, i) => (
            <li key={n.key}>{i > 0 && <span aria-hidden="true" className="muted">↓ </span>}<span className="muted">{n.label_uk}:</span> {n.text}</li>
          ))}
        </ol>
      )}
      <p className="muted">Порівняй: що з плану ти встиг(ла) сказати, а що можна додати?</p>
    </div>
  );
}

function Lines({ lines }: { lines: PracticeLine[] }) {
  return <dl className="skill-lines">{lines.map((l, i) => (
    <div key={i}><dt className="muted">{l.label_uk}</dt><dd className={l.lang === "fi" ? "prompt" : undefined} lang={l.lang}>{l.text}</dd></div>
  ))}</dl>;
}

function PracticeRun({ card, review, repository, snapshot, onSaved, onNext, onList }: { card: PracticeCard; review: boolean; repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void; onNext: () => void; onList: () => void }) {
  // COG-11: an unfinished card continues where it was left (and a reload never gives a first answer back).
  const [kept] = useState(() => restorePracticeDraft(readPracticeDrafts()[card.id], card));
  const [s, setS] = useState<PracticeSession>(() => kept?.session ?? startPractice(card));
  const [value, setValue] = useState(kept?.value ?? "");
  const [draftError, setDraftError] = useState<string | null>(null);
  useEffect(() => {
    if (saved) return;
    const d = practiceDraft(s, value);
    try { if (d) writePracticeDraft(d); else if (s.phase !== "done") clearPracticeDraft(card.id); setDraftError(null); }
    catch { setDraftError("Браузер не зберіг незавершену картку: після перезавантаження вона почнеться заново."); }
  }, [s, value]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const busy = useRef(false);
  const v = practiceView(s, card);
  // keyword-mnemonic-retrieval: the learner's own cue stored with this problem phrase (if any).
  const storedCue = snapshot.state.cards[card.id]?.ownCue ?? null;
  const [cueNote, setCueNote] = useState<"saved" | "removed" | null>(null);
  const offerCue = hasOwnCue(card) && (review || s.judged === "partly" || s.judged === "different");
  const [outcome, setOutcome] = useState<SpacedOutcome | null>(null);     // what this save did to the 1/3/7/14/30 schedule
  const [map, setMap] = useState<ArgumentMap>({});                       // learner-concept-map: the own plan as an argument map

  function step(e: PracticeEvent) {
    setError(null);
    // Judging, opening or typing the own cue must not wipe the text the learner is writing.
    try { setS(practiceReducer(s, card, e)); if (e.type !== "JUDGE" && e.type !== "SHOW_CUE" && e.type !== "SET_CUE") setValue(""); }
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
      const scheduled = spacedOutcome(snapshot.state, finished, card);
      const committed = await repository.commit(next, snapshot.revision);
      const verified = await repository.read();                        // success only after a fresh, exact readback
      if (verified.revision !== committed.revision || JSON.stringify(verified.state) !== JSON.stringify(next))
        throw Object.assign(new Error("Stored progress differs"), { code: "READBACK_MISMATCH" });
      onSaved(verified); setS(finished); setSaved(true); setValue(""); setOutcome(scheduled);
      try { clearPracticeDraft(card.id); } catch { /* the card is saved; a leftover draft is refused on restore (phase check) */ }
      const after = verified.state.cards[card.id]?.ownCue ?? null;
      setCueNote(finished.cue === undefined ? null : after ? "saved" : storedCue ? "removed" : null);
    } catch (err) {
      setError(`Не збережено (${code(err)}). Твій текст залишився в полі. ${writeFailureAdvice(err)}`);
    } finally { busy.current = false; setSaving(false); }
  }
  const meta = PRACTICE_KINDS.find(k => k.kind === card.kind)!;
  const planning = card.kind === "opinion";                                // pre-task planning only before a monologue
  const routeSteps = card.kind === "paraphrase" ? ["Твій вибір", "Пояснення", "Своїми словами", "Нова ситуація"]
    : card.kind === "time" ? ["Твій вибір", "Пояснення", "Нова ситуація"]
    : planning ? ["План і відповідь", "Зразок", "Нова ситуація"] : ["Твоя відповідь", "Зразок", "Нова ситуація"];
  // The optional plan shares the first step with the answer, so a skipped plan is never announced as "done".
  const routeIndex = card.kind === "paraphrase" ? { plan: 0, attempt: 0, reveal: 1, recall: 2, transfer: 3, done: 4 }[s.phase]
    : { plan: 0, attempt: 0, reveal: 1, recall: 1, transfer: 2, done: 3 }[s.phase];
  const speaking = card.transferSkill === "speaking";
  const illustration = card.illustrationId ? illustrations.find(i => i.id === card.illustrationId) ?? null : null;

  return (
    <section className="panel" data-accent={card.attemptSkill} aria-labelledby="pr-run">
      <Eyebrow accent={card.attemptSkill}>Практика без підказки · {meta.title}</Eyebrow>
      <h1 id="pr-run"{...(card.kind === "rektio" ? { lang: "fi" } : {})}>{groupLabel(card.group)}</h1>
      <ThresholdRoute steps={routeSteps} current={routeIndex} accent={card.attemptSkill} />
      <TrustNote />
      {kept && !saved && <p className="feedback" role="status" data-testid="practice-restored">Незавершену картку відновлено з цього пристрою{kept.session.phase !== "attempt" ? " — твоя перша відповідь лишилася такою, як була" : ""}.</p>}
      {draftError && <p className="feedback warn" role="alert">{draftError}</p>}
      {review && s.phase === "attempt" && <p className="muted">Повторення: згадай без зразка.</p>}
      {v.prompt.length > 0 && <Lines lines={v.prompt} />}

      {s.phase === "plan" && v.planFrame_uk && (
        <form className="plan-step" onSubmit={e => { e.preventDefault(); step({ type: "SUBMIT_PLAN", text: argumentMapPlan(map) }); }} noValidate>
          <p>Короткий план перед тим, як говорити. Без таймера й без оцінки. Коли почнеш відповідати, план сховається: говори з пам'яті, а не з нотаток.</p>
          <ol className="plan-frame">{v.planFrame_uk.map(q => <li key={q}>{q}</li>)}</ol>
          <fieldset className="choices-set argument-map-form">
            <legend>Твоя мапа аргументів — ключові слова будь-якою мовою, кожен вузол за бажанням</legend>
            {ARGUMENT_MAP_SLOTS.map(slot => (
              <div key={slot.key}>
                <label className="field" htmlFor={`pr-map-${slot.key}`}>{slot.label_uk}</label>
                <input id={`pr-map-${slot.key}`} className="plan-notes" autoComplete="off" maxLength={ARGUMENT_NODE_MAX_CHARS}
                  value={map[slot.key] ?? ""} onChange={e => setMap(m => ({ ...m, [slot.key]: e.target.value }))} />
              </div>
            ))}
          </fieldset>
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
      {s.phase === "attempt" && review && storedCue && (s.cueShown
        ? <p className="plan-back" role="status" data-testid="own-cue"><strong>Твоя зачіпка:</strong> {storedCue}</p>
        : <div className="actions">
            <button type="button" className="btn secondary" onClick={() => step({ type: "SHOW_CUE" })}>Показати мою зачіпку (за бажанням)</button>
            <span className="muted">Спершу спробуй згадати сам(а).</span>
          </div>)}
      {s.phase === "attempt" && v.planHidden && (
        <p className="muted" role="status">План сховано — говори з пам'яті. Після відповіді він повернеться поруч зі зразком.</p>
      )}

      {s.phase === "attempt" && (
        <form onSubmit={e => { e.preventDefault(); step({ type: "ANSWER", value }); }} noValidate>
          {v.options_fi ? (
            <fieldset className="choices-set">
              <legend>{card.kind === "time" ? "Обери варіант" : "Обери речення з тим самим значенням"}</legend>
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
          <p className="muted">Перша відповідь фіксується. Зразок з'явиться після неї. Можна зробити перерву: незавершена картка збережеться на цьому пристрої й продовжиться з того самого місця{v.canPlan || s.plan !== undefined ? " (власний план не зберігається — картку з планом краще завершити за раз)" : ""}.</p>
        </form>
      )}

      {s.phase === "reveal" && v.reveal && (
        <>
          <p><strong>Твоя відповідь:</strong> <span lang="fi">{v.first}</span></p>
          {v.plan && <PlanBack plan={v.plan} />}
          {v.key_fi !== null && <p className="feedback" role="status"><strong>{v.correct ? (review ? "Згадано на повторенні" : "Правильно з першої спроби") : "Ще не так"}</strong> · <span lang="fi">{v.key_fi}</span></p>}
          <Lines lines={v.reveal} />
          {illustration && (                                               // shows the answer, so only after the first attempt
            <figure className="practice-figure">
              <img src={illustration.url} alt={illustration.alt_uk} width={240} height={240} />
              <figcaption className="muted">{illustration.credit.credit} · {illustration.credit.licence}</figcaption>
            </figure>
          )}
          {card.choice && isSpacedKind(card) && <p className="muted">{v.correct ? (review ? "Наступне повторення буде через довший проміжок." : "Це завдання не піде на повторення: ти обрав(ла) правильно з першої спроби.")
            : "Це завдання повернеться на повторення (1, 3, 7, 14, 30 днів), бо вибір не збігся з ключем."}</p>}
          {v.needsJudgement && (
            <div className="actions" role="group" aria-label="Порівняй свою відповідь зі зразком">
              {(Object.keys(JUDGE_UK) as PracticeJudgement[]).map(j => (
                <button key={j} type="button" className="btn secondary" aria-pressed={v.judged === j} onClick={() => step({ type: "JUDGE", judgement: j })}>{JUDGE_UK[j]}</button>
              ))}
            </div>
          )}
          {v.needsJudgement && <p className="muted">Це самооцінка, не автоматична перевірка: правильних варіантів фінською буває кілька.{isSpacedKind(card) && ` Якщо «частково» чи «інакше» — ${hasOwnCue(card) ? "фраза повернеться" : "завдання повернеться"} на повторення (1, 3, 7, 14, 30 днів).`}</p>}
          {offerCue && (
            <div className="own-cue-step">
              <label className="field" htmlFor="pr-cue">Своя зачіпка для пам'яті (за бажанням)</label>
              <p className="muted" id="pr-cue-help">Придумай власну асоціацію до цієї фрази: схоже за звучанням слово, образ чи ситуацію — будь-якою мовою.
                Вона збережеться разом із фразою і під час повторення з'явиться лише тоді, коли ти сам(а) попросиш. Не обов'язково й не для кожної фрази.</p>
              <input id="pr-cue" className="plan-notes" autoComplete="off" maxLength={OWN_CUE_MAX_CHARS} aria-describedby="pr-cue-help"
                value={s.cue ?? storedCue ?? ""} onChange={e => step({ type: "SET_CUE", text: e.target.value })} />
            </div>
          )}
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

      {saved && card.kind === "opinion" && s.phase === "done" && <RepeatedTelling card={card} repository={repository} snapshot={snapshot} onSaved={onSaved} />}
      {saved && stepUpFor(card) && s.phase === "done" && <StepUp card={card} situation={card.transfer} repository={repository} snapshot={snapshot} onSaved={onSaved} />}
      {saved && hasInterlocutorLadder(card) && s.phase === "done" && card.prompt[0] && <InterlocutorShift card={card} situation={card.prompt[0]} repository={repository} snapshot={snapshot} onSaved={onSaved} />}

      {saved && <p className="feedback" role="status"><Icon name="ok" /> Картку збережено на цьому пристрої. Тексти — без оцінки.
        {outcome === "back_tomorrow" && (card.choice ? " Це завдання повторимо завтра: перший вибір не збігся з ключем."
          : hasOwnCue(card) ? " Цю фразу повторимо завтра: ти позначив(ла), що ще не згадуєш її точно."
          : " Це завдання повторимо завтра: ти позначив(ла), що твоя відповідь відрізняється.")}
        {outcome === "longer_gap" && " Наступне повторення — через довший проміжок."}
        {cueNote === "saved" && " Твою зачіпку збережено разом із фразою."}
        {cueNote === "removed" && " Зачіпку прибрано."}</p>}
      <div className="actions">
        {saved && <button type="button" className="btn" onClick={onNext}>Наступна картка</button>}
        <button type="button" className="btn secondary" disabled={saving} onClick={onList}>До списку карток</button>
      </div>
    </section>
  );
}

const FEEL_UK: Record<FluencyFeel, string> = { easier: "Легше", same: "Так само", harder: "Важче" };

/**
 * Repeated telling 4/3/2 (fluency-432): optional, after a saved opinion card. Tell the same opinion aloud three times
 * with less time each round (practice 120/90/60 s). Nothing is recorded; only the learner's report is saved, ungraded.
 */
function RepeatedTelling({ card, repository, snapshot, onSaved }: { card: PracticeCard; repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void }) {
  const [round, setRound] = useState<number | null>(null);         // null = not started
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [, tick] = useState(0);
  const [finishedRounds, setFinishedRounds] = useState(0);
  const [feel, setFeel] = useState<FluencyFeel | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (startedAt === null) return;
    const t = setInterval(() => tick(x => x + 1), 250);
    return () => clearInterval(t);
  }, [startedAt]);
  const left = round !== null && startedAt !== null ? fluencySecondsLeft(round, startedAt, Date.now()) : null;
  useEffect(() => { if (left === 0) { setStartedAt(null); setFinishedRounds(n => Math.max(n, (round ?? 0) + 1)); } }, [left, round]);
  const total = FLUENCY_ROUNDS_SECONDS.length;
  const mmss = (x: number) => `${Math.floor(x / 60)}:${String(x % 60).padStart(2, "0")}`;

  async function save() {
    if (!feel) { setError("Познач, як було в останньому раунді."); return; }
    setError(null);
    try {
      const next = addDiagnostic(snapshot.state, fluencyEvidence(card.id, finishedRounds, feel, card.transferSkill === "writing" ? "writing" : "speaking"));
      const committed = await repository.commit(next, snapshot.revision);
      const verified = await repository.read();
      if (verified.revision !== committed.revision || JSON.stringify(verified.state) !== JSON.stringify(next))
        throw Object.assign(new Error("Stored progress differs"), { code: "READBACK_MISMATCH" });
      onSaved(verified); setSaved(true);
    } catch (err) { setError(`Не збережено (${code(err)}). ${writeFailureAdvice(err)}`); }
  }

  if (saved) return <p className="voice-status" role="status" data-testid="fluency-done">Збережено лише твою оцінку раундів. Мовлення не записувалося й не оцінювалося.</p>;
  if (round === null) return (
    <section className="stepup" aria-labelledby="fluency-title">
      <h2 id="fluency-title">Розповісти тричі, щоразу коротше (4/3/2)</h2>
      <p>За бажанням: скажи свою думку вголос ще раз — тричі, і щоразу часу менше ({FLUENCY_ROUNDS_SECONDS.join(" / ")} с; тренувальні значення). Без нотаток і без зразка. Нічого не записується.</p>
      <div className="actions"><button type="button" className="btn secondary" onClick={() => { setRound(0); setStartedAt(Date.now()); }}>Почати перший раунд</button></div>
    </section>
  );
  const running = startedAt !== null;
  return (
    <section className="stepup" aria-labelledby="fluency-title">
      <h2 id="fluency-title">Раунд {round + 1} з {total}</h2>
      {running && left !== null && <p className="voice-status" role="status" data-testid="fluency-timer">Говори вголос. Залишилось {mmss(left)}.</p>}
      {!running && finishedRounds === round + 1 && round + 1 < total && (
        <div className="actions"><button type="button" className="btn secondary" onClick={() => { setRound(round + 1); setStartedAt(Date.now()); }}>Наступний раунд ({FLUENCY_ROUNDS_SECONDS[round + 1]} с)</button></div>
      )}
      {running && <div className="actions"><button type="button" className="btn secondary" onClick={() => { setStartedAt(null); setFinishedRounds(round + 1); }}>Я закінчив(ла) раніше</button></div>}
      {!running && finishedRounds >= 1 && (
        <fieldset className="choices-set">
          <legend>Як тобі говорилося в останньому раунді порівняно з першим? <span className="muted">(самооцінка — не оцінка)</span></legend>
          {(Object.keys(FEEL_UK) as FluencyFeel[]).map(k => (
            <label key={k} className="radio"><input type="radio" name="fluency-feel" checked={feel === k} onChange={() => setFeel(k)} /> {FEEL_UK[k]}</label>
          ))}
          <div className="actions"><button type="button" className="btn" onClick={() => void save()}>{finishedRounds < total ? "Зберегти й зупинитися" : "Зберегти"}</button></div>
        </fieldset>
      )}
      {error && <p className="feedback error" role="alert">{error}</p>}
    </section>
  );
}
