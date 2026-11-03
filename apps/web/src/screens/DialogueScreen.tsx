import { useEffect, useRef, useState, type FormEvent } from "react";
import { addDiagnostic, dialogueEvidence, dialogueReducer, dialogueView, startDialogue, DialogueError, DIALOGUE_MAX_CHARS,
  type DialogueEvent, type DialogueItem, type DialogueSession, type LearnerState, type SelfJudgement } from "@hospodar/domain";
import { dialogues } from "../content/dialogues.ts";
import type { LearnerRepository } from "../storage/learnerRepository.ts";

type Snap = { state: LearnerState; revision: number };
const JUDGE_UK: Record<SelfJudgement, string> = { same: "Те саме за змістом", partly: "Частково", different: "Інше" };

export function DialogueScreen({ repository, snapshot, onSaved, onHome }: { repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void; onHome: () => void }) {
  const [item, setItem] = useState<DialogueItem | null>(null);
  if (item) return <Dialogue key={item.id} item={item} repository={repository} snapshot={snapshot} onSaved={onSaved} onExit={() => setItem(null)} />;
  const done = new Set(snapshot.state.diagnostics.map(d => d.taskId));
  return (
    <section className="panel" aria-labelledby="dl-title">
      <p className="eyebrow">Навчання · розмова</p>
      <h1 id="dl-title">Діалоги: твоя репліка</h1>
      <p>Ти — один зі співрозмовників. Спершу пишеш свою репліку, потім бачиш, як сказано в сценарії — це один із можливих варіантів, не «правильна відповідь».</p>
      <p className="draft-note">Лише текст (запису ще немає) і чернетки, не перевірені S2-викладачем. Без автоматичної оцінки.</p>
      <ul className="choices" aria-label="Діалоги">
        {dialogues.map(d => (
          <li key={d.id}><button type="button" className="choice" onClick={() => setItem(d)}>
            <span lang="fi">{d.title_fi}</span><small>{done.has(`${d.id}-roleplay`) ? "уже пройдено" : `${d.turns.length} реплік · ${d.questions.length} питання`}</small>
          </button></li>
        ))}
      </ul>
      <div className="actions"><button type="button" className="btn secondary" onClick={onHome}>На головну</button></div>
    </section>
  );
}

function Dialogue({ item, repository, snapshot, onSaved, onExit }: { item: DialogueItem; repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void; onExit: () => void }) {
  const [s, setS] = useState<DialogueSession>(() => startDialogue(item));
  const latest = useRef(s); latest.current = s;
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"idle" | "saving" | { error: string }>("idle");
  const heading = useRef<HTMLHeadingElement>(null);
  const v = dialogueView(s, item);
  useEffect(() => { heading.current?.focus(); }, [s.phase, s.qIndex]);
  const act = (e: DialogueEvent) => {
    setError(null);
    try { const n = dialogueReducer(latest.current, item, e); latest.current = n; setS(n); return true; }
    catch (err) { setError(err instanceof DialogueError && err.code === "EMPTY" ? "Спершу напиши щось (або пропусти репліку)." : "Цей крок зараз недоступний."); return false; }
  };
  async function finish(e: FormEvent) {
    e.preventDefault();
    let next: DialogueSession;
    try { next = dialogueReducer(latest.current, item, { type: "SUBMIT_TRANSFER", text }); setError(null); }
    catch { setError("Напиши свій план чи репліки."); return; }
    setSaving("saving");
    try {
      let st = snapshot.state;
      for (const ev of dialogueEvidence(next, item)) st = addDiagnostic(st, ev);
      onSaved(await repository.commit(st, snapshot.revision));
      latest.current = next; setS(next); setText(""); setSaving("idle");     // advance only after the commit
    } catch (err) { setSaving({ error: String((err as { code?: string })?.code ?? "SAVE_FAILED") }); }
  }
  const title = { turns: "Розмова", questions: "Що ти зрозумів(ла)?", transfer: "Твоя ситуація", done: "Готово" }[s.phase];

  return (
    <section className="panel" aria-labelledby="dlg-title">
      <p className="eyebrow">Навчання · розмова · <span lang="fi">{item.title_fi}</span></p>
      <h1 id="dlg-title" ref={heading} tabIndex={-1}>{title}</h1>
      {!v.reviewed && <p className="draft-note">Чернетка: ще не перевірено S2-викладачем.</p>}

      {s.phase !== "transfer" && s.phase !== "done" && (
        <ol className="dialogue" aria-label="Репліки">
          {v.lines.map(l => (
            <li key={l.index} className={`line ${l.mine ? "mine" : "npc"}${l.evidence ? " evidence" : ""}`}>
              <span className="who">{l.mine ? "Ти" : "Співрозмовник"}</span>
              {l.mine && l.reply !== null && <p lang="fi">{l.reply || <span className="muted">(пропущено)</span>}</p>}
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
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); if (act({ type: "REPLY", text })) setText(""); }} noValidate>
          <label className="field" htmlFor="dlg-reply">Твоя репліка фінською — що ти скажеш?</label>
          <input id="dlg-reply" className="answer" lang="fi" autoComplete="off" maxLength={DIALOGUE_MAX_CHARS} value={text} onChange={e => setText(e.target.value)} />
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions">
            <button type="submit" className="btn">Сказати</button>
            <button type="button" className="btn secondary" onClick={() => { act({ type: "SKIP_REPLY" }); setText(""); }}>Пропустити й подивитися сценарій</button>
          </div>
        </form>
      ) : (
        <div className="actions"><button type="button" className="btn" onClick={() => act({ type: "NEXT_TURN" })}>Далі</button></div>
      ))}

      {s.phase === "questions" && v.question && (v.question.model_fi === null ? (
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); if (act({ type: "ANSWER", questionId: v.question!.id, text })) setText(""); }} noValidate>
          <label className="field" htmlFor="dlg-q"><span className="muted">Питання {v.question.n} з {v.question.of} · </span><span lang="fi">{v.question.prompt_fi}</span></label>
          <input id="dlg-q" className="answer" lang="fi" autoComplete="off" maxLength={DIALOGUE_MAX_CHARS} value={text} onChange={e => setText(e.target.value)} />
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions"><button type="submit" className="btn">Відповісти</button></div>
        </form>
      ) : (
        <div className="feedback" role="status">
          <p><strong>Твоя відповідь:</strong> <span lang="fi">{v.question.answer}</span></p>
          <p><strong>Приклад відповіді:</strong> <span lang="fi">{v.question.model_fi}</span></p>
          <fieldset className="choices-set">
            <legend>Твоя відповідь означає те саме? <span className="muted">(оцінюєш ти — це не бал)</span></legend>
            <div className="actions">
              {(Object.keys(JUDGE_UK) as SelfJudgement[]).map(j => (
                <button key={j} type="button" className="btn secondary" onClick={() => act({ type: "JUDGE", questionId: v.question!.id, judgement: j })}>{JUDGE_UK[j]}</button>
              ))}
            </div>
          </fieldset>
        </div>
      ))}

      {s.phase === "transfer" && (
        <form onSubmit={e => void finish(e)} noValidate>
          <div className="prompt" lang="fi">{v.transfer_fi}</div>
          <label className="field" htmlFor="dlg-transfer">Твої репліки фінською (можна потім сказати вголос; без оцінки)</label>
          <textarea id="dlg-transfer" className="answer" lang="fi" rows={4} maxLength={DIALOGUE_MAX_CHARS} value={text} onChange={e => setText(e.target.value)} />
          {error && <p className="feedback error" role="alert">{error}</p>}
          {typeof saving === "object" && <p className="feedback error" role="alert">НЕ збережено ({saving.error}). Текст лишився тут — спробуй ще раз.</p>}
          <div className="actions"><button type="submit" className="btn" disabled={saving === "saving"}>{saving === "saving" ? "Зберігаю…" : "Зберегти й завершити"}</button></div>
        </form>
      )}

      {s.phase === "done" && (
        <div className="feedback" role="status">
          <p>✅ Збережено на цьому пристрої без оцінки: відповіді на питання з твоєю самооцінкою і твій план розмови.</p>
          <div className="actions"><button type="button" className="btn" onClick={onExit}>До списку діалогів</button></div>
        </div>
      )}
    </section>
  );
}
