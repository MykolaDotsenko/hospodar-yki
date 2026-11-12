import { useEffect, useRef, useState, type FormEvent } from "react";
import { addDiagnostic, dialogueEvidence, dialogueReducer, dialogueView, startDialogue, DialogueError, DIALOGUE_MAX_CHARS,
  type DialogueEvent, type DialogueItem, type DialogueSession, type LearnerState, type SelfJudgement } from "@hospodar/domain";
import { dialogues } from "../content/dialogues.ts";
import { dialoguePayload, validDialogueDraft } from "../storage/dialogueDraft.ts";
import type { LearnerRepository, DialogueDraftRow } from "../storage/learnerRepository.ts";
import { writeFailureAdvice } from "../storage/browserStorageHealth.ts";
import { Eyebrow, ThresholdRoute } from "../ui/MissionChrome.tsx";
import { Icon } from "../ui/icons.tsx";
import { TrustNote } from "../ui/TrustNote.tsx";

type Snap = { state: LearnerState; revision: number };
const JUDGE_UK: Record<SelfJudgement, string> = { same: "Те саме за змістом", partly: "Частково", different: "Інше" };
type Loaded = { kind: "loading" } | { kind: "ready"; draft: DialogueDraftRow | null; blocked: string | null };
const code = (e: unknown) => String((e as { code?: string })?.code ?? "SAVE_FAILED");

export function DialogueScreen({ repository, snapshot, onSaved, onHome }: { repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void; onHome: () => void }) {
  const [selected, setSelected] = useState<DialogueItem | null>(null);
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [discarding, setDiscarding] = useState(false);
  useEffect(() => {
    let alive = true;
    void repository.readDialogueDraft().then(row => {
      if (!alive) return;
      const item = dialogues.find(d => d.id === row?.session?.itemId);
      const blocked = row && (!item || !validDialogueDraft({
        session: row.session, input: row.input, contentFingerprint: row.contentFingerprint,
      }, item) || row.learnerRevision !== snapshot.revision)
        ? "Незавершений діалог несумісний із матеріалом або прогресом. Відповіді приховано; чернетку не перезаписано." : null;
      if (row && !blocked && item) setSelected(item);
      setLoaded({ kind: "ready", draft: row, blocked });
    }).catch(e => {
      if (alive) {
        setLoadError(code(e));
        setLoaded({ kind: "ready", draft: null, blocked: "Не вдалося прочитати незавершений діалог. Нічого не перезаписано." });
      }
    });
    return () => { alive = false; };
  }, [repository, snapshot.revision]);

  async function discardBlocked() {
    if (loaded.kind !== "ready" || !loaded.draft || discarding) return;
    setDiscarding(true); setLoadError(null);
    try {
      await repository.discardDialogueDraft(snapshot.revision, loaded.draft.revision);
      setLoaded({ kind: "ready", draft: null, blocked: null }); setSelected(null);
    } catch (e) { setLoadError(code(e)); }
    finally { setDiscarding(false); }
  }
  if (loaded.kind === "loading") return <section className="panel" role="status">Перевіряю незавершений діалог…</section>;
  if (loaded.blocked) return (
    <section className="panel" aria-labelledby="dlg-blocked">
      <h1 id="dlg-blocked">Чернетка діалогу потребує уваги</h1>
      <p className="feedback warn" role="alert">{loaded.blocked}</p>
      {loadError && <p className="feedback error" role="alert">Помилка ({loadError}). Нічого не перезаписано.</p>}
      <div className="actions">
        {loaded.draft && <button type="button" className="btn danger" disabled={discarding || loaded.draft.learnerRevision !== snapshot.revision}
          onClick={() => void discardBlocked()}>Відкинути несумісну чернетку</button>}
        <button type="button" className="btn secondary" onClick={onHome}>На головну</button>
      </div>
    </section>
  );
  const resume = loaded.draft ? dialogues.find(d => d.id === loaded.draft?.session.itemId) ?? null : null;
  const item = resume ?? selected;
  const clear = () => { setSelected(null); setLoaded({ kind: "ready", draft: null, blocked: null }); };
  if (item) return <Dialogue key={item.id} item={item} repository={repository} snapshot={snapshot}
    initialDraft={resume ? loaded.draft : null} onSaved={onSaved} onExit={clear} onHome={onHome} />;
  const done = new Set(snapshot.state.diagnostics.map(d => d.taskId));
  return (
    <section className="panel" data-accent="speaking" aria-labelledby="dl-title">
      <Eyebrow accent="speaking">Навчання · розмова</Eyebrow>
      <h1 id="dl-title">Діалоги: твоя репліка</h1>
      <p>Ти — один зі співрозмовників. Спершу пишеш свою репліку, потім бачиш, як сказано в сценарії — це один із можливих варіантів, не «правильна відповідь». Одного разу співрозмовник тебе не зрозуміє й попросить сказати інакше, а наприкінці умова ситуації зміниться.</p>
      <TrustNote many>Лише текст, запису ще немає. Без автоматичної оцінки.</TrustNote>
      <ul className="choices" aria-label="Діалоги">
        {dialogues.map(d => (
          <li key={d.id}><button type="button" className="choice" onClick={() => setSelected(d)}>
            <span lang="fi">{d.title_fi}</span><small>{done.has(`${d.id}-roleplay`) ? "уже пройдено" : `${d.turns.length} реплік · ${d.questions.length} питання`}</small>
          </button></li>
        ))}
      </ul>
      <div className="actions"><button type="button" className="btn secondary" onClick={onHome}>На головну</button></div>
    </section>
  );
}

function Dialogue({ item, repository, snapshot, initialDraft, onSaved, onExit, onHome }: {
  item: DialogueItem; repository: LearnerRepository; snapshot: Snap; initialDraft: DialogueDraftRow | null;
  onSaved: (s: Snap) => void; onExit: () => void; onHome: () => void;
}) {
  const [s, setS] = useState<DialogueSession>(() => initialDraft?.session ?? startDialogue(item));
  const latest = useRef(s); latest.current = s;
  const snap = useRef(snapshot); snap.current = snapshot;
  const [text, setText] = useState(initialDraft?.input ?? "");
  const inputRef = useRef(initialDraft?.input ?? "");
  const draftRevision = useRef(initialDraft?.revision ?? 0);
  const lastWritten = useRef(initialDraft ? JSON.stringify(dialoguePayload(initialDraft.session, initialDraft.input, item)) : "");
  const queue = useRef<Promise<void>>(Promise.resolve());
  const generation = useRef(0);
  const busy = useRef(false);
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState<"idle" | "dirty" | "saving" | "saved" | "error">(initialDraft ? "saved" : "idle");
  const [error, setError] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const v = dialogueView(s, item);
  useEffect(() => { heading.current?.focus(); }, [s.phase, s.turn, s.qIndex, s.repair, s.repairJudged]);

  function checkpoint(state: DialogueSession, input: string) {
    const payload = dialoguePayload(state, input, item);
    if (!validDialogueDraft(payload, item)) return Promise.reject(new Error("INVALID_DRAFT"));
    const fingerprint = JSON.stringify(payload);
    const next = queue.current.then(async () => {
      if (fingerprint === lastWritten.current) return;
      setStatus("saving");
      const row = await repository.saveDialogueDraft(payload, snap.current.revision, draftRevision.current);
      draftRevision.current = row.revision; lastWritten.current = fingerprint; setStatus("saved");
    });
    queue.current = next.catch(() => {});
    return next;
  }
  useEffect(() => {
    if (busy.current || s.phase === "done" || (!text && draftRevision.current === 0)) return;
    const id = generation.current;
    const timer = setTimeout(() => {
      if (id !== generation.current) return;
      void checkpoint(latest.current, inputRef.current).catch(e => {
        setStatus("error"); setError("Автозбереження не підтверджене (" + code(e) + "). " + writeFailureAdvice(e));
      });
    }, 650);
    return () => clearTimeout(timer);
  }, [s, text, item]);
  function changeText(next: string) {
    inputRef.current = next; generation.current++;
    setText(next); setError(null); setStatus("dirty");
  }
  function failed(e: unknown) {
    setStatus("error");
    setError("Збереження не підтверджене (" + code(e) + "). " + writeFailureAdvice(e));
  }
  async function transition(event: DialogueEvent) {
    if (busy.current) return;
    let next: DialogueSession;
    try { next = dialogueReducer(latest.current, item, event); }
    catch (e) { setError(e instanceof DialogueError && e.code === "EMPTY"
      ? "Спершу напиши щось (або пропусти репліку)." : "Цей крок зараз недоступний."); return; }
    busy.current = true; setWorking(true); generation.current++; setError(null);
    try {
      await queue.current;
      await checkpoint(next, "");
      latest.current = next; setS(next); inputRef.current = ""; setText("");
    } catch (e) { failed(e); }
    finally { busy.current = false; setWorking(false); }
  }
  async function finish(e: FormEvent) {
    e.preventDefault();
    if (busy.current) return;
    const exact = inputRef.current;
    let next: DialogueSession;
    try { next = dialogueReducer(latest.current, item, { type: "SUBMIT_TRANSFER", text: exact }); }
    catch { setError("Напиши свій план чи репліки."); return; }
    busy.current = true; setWorking(true); generation.current++; setError(null);
    try {
      await queue.current;
      await checkpoint(latest.current, exact);
      let st = snap.current.state;
      for (const ev of dialogueEvidence(next, item)) st = addDiagnostic(st, ev);
      const saved = await repository.finishDialogueDraft(st, snap.current.revision, draftRevision.current, item.id, exact);
      snap.current = saved; onSaved(saved);
      draftRevision.current = 0; lastWritten.current = "";
      latest.current = next; setS(next); inputRef.current = ""; setText(""); setStatus("saved");
    } catch (e) { failed(e); }
    finally { busy.current = false; setWorking(false); }
  }
  async function pause() {
    if (busy.current) return;
    const exact = inputRef.current;
    busy.current = true; setWorking(true); generation.current++; setError(null);
    try {
      await queue.current;
      if (exact || draftRevision.current) {
        await checkpoint(latest.current, exact);
        const back = await repository.readDialogueDraft();
        if (!back || back.revision !== draftRevision.current ||
            JSON.stringify(dialoguePayload(back.session, back.input, item)) !== JSON.stringify(dialoguePayload(latest.current, exact, item)))
          throw new Error("READBACK_MISMATCH");
      }
      onHome();
    } catch (e) { failed(e); }
    finally { busy.current = false; setWorking(false); }
  }
  async function discard() {
    if (busy.current) return;
    busy.current = true; setWorking(true); generation.current++; setError(null);
    try {
      await queue.current;
      if (draftRevision.current) await repository.discardDialogueDraft(snap.current.revision, draftRevision.current);
      onExit();
    } catch (e) { failed(e); }
    finally { busy.current = false; setWorking(false); }
  }
  const title = { turns: "Розмова", questions: "Що ти зрозумів(ла)?", roleplay: "Твоя ситуація", transfer: item.negotiation ? "Умова змінилася" : "Твоя ситуація", done: "Готово" }[s.phase];

  return (
    <section className="panel" data-accent="speaking" aria-labelledby="dlg-title">
      <Eyebrow accent="speaking">Навчання · розмова · <span lang="fi">{item.title_fi}</span></Eyebrow>
      <h1 id="dlg-title" ref={heading} tabIndex={-1}>{title}</h1>
      <ThresholdRoute steps={item.negotiation ? ["Розмова", "Що ти зрозумів(ла)", "Твоя ситуація", "Зміна умови"] : ["Розмова", "Що ти зрозумів(ла)", "Твоя ситуація"]}
        current={item.negotiation ? { turns: 0, questions: 1, roleplay: 2, transfer: 3, done: 4 }[s.phase] : { turns: 0, questions: 1, roleplay: 2, transfer: 2, done: 3 }[s.phase]} accent="speaking" />
      {!v.reviewed && <TrustNote />}
      {initialDraft && s.phase !== "done" && <p className="feedback" role="status">Незавершений діалог відновлено з цього пристрою.</p>}

      {s.phase !== "roleplay" && s.phase !== "transfer" && s.phase !== "done" && (
        <ol className="dialogue" aria-label="Репліки">
          {v.lines.map(l => (
            <li key={l.index} className={`line ${l.mine ? "mine" : "npc"}${l.evidence ? " evidence" : ""}`}>
              <span className="who">{l.mine ? "Ти" : "Співрозмовник"}</span>
              {l.mine && l.reply !== null && <p lang="fi">{l.reply || <span className="muted">(пропущено)</span>}</p>}
              {l.clarification_fi && <p className="npc-aside"><span className="who">Співрозмовник не зрозумів: </span><span lang="fi">{l.clarification_fi}</span></p>}
              {l.repair && <p lang="fi"><span className="muted" lang="uk">Ти іншими словами: </span>{l.repair}</p>}
              {l.text_fi !== null && (
                <p lang="fi" className={l.mine ? "script" : undefined}>
                  {l.mine && <span className="muted">У сценарії: </span>}
                  {l.evidence ? <span className="learning-cue">{l.text_fi}</span> : l.text_fi}
                  {l.evidence && <span className="cue-label"> ← тут це сказано</span>}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}

      {s.phase === "turns" && (v.awaitingReply ? (
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); void transition({ type: "REPLY", text: inputRef.current }); }} noValidate>
          <label className="field" htmlFor="dlg-reply">Твоя репліка фінською — що ти скажеш?</label>
          <input id="dlg-reply" className="answer" lang="fi" autoComplete="off" disabled={working} maxLength={DIALOGUE_MAX_CHARS} value={text} onChange={e => changeText(e.target.value)} />
          <div className="actions">
            <button type="submit" className="btn" disabled={working}>Сказати</button>
            <button type="button" className="btn secondary" disabled={working} onClick={() => void transition({ type: "SKIP_REPLY" })}>Пропустити й подивитися сценарій</button>
          </div>
        </form>
      ) : v.awaitingRephrase ? (
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); void transition({ type: "REPHRASE", text: inputRef.current }); }} noValidate>
          <label className="field" htmlFor="dlg-rephrase">Скажи те саме фінською іншими словами або простіше (зразок побачиш після цього)</label>
          <input id="dlg-rephrase" className="answer" lang="fi" autoComplete="off" disabled={working} maxLength={DIALOGUE_MAX_CHARS} value={text} onChange={e => changeText(e.target.value)} />
          <div className="actions"><button type="submit" className="btn" disabled={working}>Сказати інакше</button></div>
        </form>
      ) : v.awaitingRepairConfirm ? (
        <fieldset className="choices-set">
          <legend>Твій другий варіант передає той самий зміст, що й репліка у сценарії? <span className="muted">(оцінюєш ти — це не бал)</span></legend>
          <div className="actions">
            {(Object.keys(JUDGE_UK) as SelfJudgement[]).map(j => (
              <button key={j} type="button" className="btn secondary" disabled={working} onClick={() => void transition({ type: "JUDGE_REPAIR", judgement: j })}>{JUDGE_UK[j]}</button>
            ))}
          </div>
        </fieldset>
      ) : (
        <div className="actions"><button type="button" className="btn" disabled={working} onClick={() => void transition({ type: "NEXT_TURN" })}>Далі</button></div>
      ))}

      {s.phase === "roleplay" && (
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); void transition({ type: "SUBMIT_ROLEPLAY", text: inputRef.current }); }} noValidate>
          <div className="prompt" lang="fi">{v.transfer_fi}</div>
          <label className="field" htmlFor="dlg-roleplay">Твої репліки фінською (без оцінки). Після цього умова зміниться.</label>
          <textarea id="dlg-roleplay" className="answer" lang="fi" rows={4} disabled={working} maxLength={DIALOGUE_MAX_CHARS} value={text} onChange={e => changeText(e.target.value)} />
          <div className="actions"><button type="submit" className="btn" disabled={working}>Далі</button></div>
        </form>
      )}

      {s.phase === "questions" && v.question && (v.question.model_fi === null ? (
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); void transition({ type: "ANSWER", questionId: v.question!.id, text: inputRef.current }); }} noValidate>
          <label className="field" htmlFor="dlg-q"><span className="muted">Питання {v.question.n} з {v.question.of} · </span><span lang="fi">{v.question.prompt_fi}</span></label>
          <input id="dlg-q" className="answer" lang="fi" autoComplete="off" disabled={working} maxLength={DIALOGUE_MAX_CHARS} value={text} onChange={e => changeText(e.target.value)} />
          <div className="actions"><button type="submit" className="btn" disabled={working}>Відповісти</button></div>
        </form>
      ) : (
        <div className="feedback" role="status">
          <p><strong>Твоя відповідь:</strong> <span lang="fi">{v.question.answer}</span></p>
          <p><strong>Приклад відповіді:</strong> <span lang="fi">{v.question.model_fi}</span></p>
          <fieldset className="choices-set">
            <legend>Твоя відповідь означає те саме? <span className="muted">(оцінюєш ти — це не бал)</span></legend>
            <div className="actions">
              {(Object.keys(JUDGE_UK) as SelfJudgement[]).map(j => (
                <button key={j} type="button" className="btn secondary" disabled={working} onClick={() => void transition({ type: "JUDGE", questionId: v.question!.id, judgement: j })}>{JUDGE_UK[j]}</button>
              ))}
            </div>
          </fieldset>
        </div>
      ))}

      {s.phase === "transfer" && (
        <form onSubmit={e => void finish(e)} noValidate>
          {v.change_fi ? (
            <>
              <p className="muted">Ситуація: <span lang="fi">{v.transfer_fi}</span></p>
              <p><strong>Ти сказав(ла):</strong> <span lang="fi">{v.roleplay}</span></p>
              <div className="prompt" lang="fi">{v.change_fi}</div>
            </>
          ) : <div className="prompt" lang="fi">{v.transfer_fi}</div>}
          <label className="field" htmlFor="dlg-transfer">{v.change_fi ? "Що ти скажеш тепер? Фінською, без оцінки" : "Твої репліки фінською (можна потім сказати вголос; без оцінки)"}</label>
          <textarea id="dlg-transfer" className="answer" lang="fi" rows={4} disabled={working} maxLength={DIALOGUE_MAX_CHARS} value={text} onChange={e => changeText(e.target.value)} />
          <div className="actions"><button type="submit" className="btn" disabled={working}>{working ? "Зберігаю…" : "Зберегти й завершити"}</button></div>
        </form>
      )}

      {s.phase !== "done" && (
        <>
          {error && <p className="feedback error" role="alert">{error}</p>}
          <p className="muted" role="status">{status === "dirty" ? "Є незбережені зміни." : status === "saving" ? "Зберігаю локально…" :
            status === "saved" ? "Чернетка збережена на цьому пристрої." : status === "error" ? "Чернетку не підтверджено." : "Збереження почнеться після першої відповіді."}</p>
          <div className="actions">
            <button type="button" className="btn secondary" disabled={working} onClick={() => void pause()}>Зберегти та вийти</button>
            <button type="button" className="btn danger" disabled={working} onClick={() => void discard()}>Відкинути чернетку</button>
          </div>
        </>
      )}
      {s.phase === "done" && (
        <div className="feedback" role="status">
          <p><Icon name="ok" /> Збережено на цьому пристрої без оцінки: відповіді на питання з твоєю самооцінкою{item.negotiation ? ", повторення іншими словами, твій план розмови і відповідь на змінену умову" : " і твій план розмови"}.</p>
          <div className="actions"><button type="button" className="btn" onClick={onExit}>До списку діалогів</button></div>
        </div>
      )}
    </section>
  );
}
