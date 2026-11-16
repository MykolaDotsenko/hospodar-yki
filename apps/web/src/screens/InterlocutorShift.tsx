import { useState, type FormEvent } from "react";
import { addDiagnostic, interlocutorEvidence, INTERLOCUTOR_LADDER, REGISTER_MAX_CHARS, REGISTER_NOTE_UK, SAME_ACT_UK,
  type LadderTarget, type LearnerState, type PracticeLine } from "@hospodar/domain";
import type { LearnerRepository } from "../storage/learnerRepository.ts";
import { writeFailureAdvice } from "../storage/browserStorageHealth.ts";

type Snap = { state: LearnerState; revision: number };
const code = (e: unknown) => String((e as { code?: string })?.code ?? "SAVE_FAILED");

/**
 * pragmatic-speech-acts: after a saved reaction card or a finished dialogue role-play, the same situation for a friend, a neighbour and an official.
 * Own Finnish reply first, then a separate appropriateness self-check; each reply is saved ungraded before the next
 * listener; at the end the learner's own three replies are shown side by side. Optional and stoppable.
 */
export function InterlocutorShift({ card, situation, repository, snapshot, onSaved }: {
  card: LadderTarget; situation: PracticeLine; repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void;
}) {
  const [index, setIndex] = useState<number | null>(null);          // null = not started
  const [text, setText] = useState("");
  const [checked, setChecked] = useState<number[]>([]);
  const [replies, setReplies] = useState<string[]>([]);
  const [stopped, setStopped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (replies.length === INTERLOCUTOR_LADDER.length || (stopped && replies.length > 0)) return (
    <section className="stepup" aria-labelledby="register-compare-title" data-testid="register-compare">
      <h2 id="register-compare-title">Порівняй, як змінювалася твоя мова</h2>
      <p className="muted">Твої власні відповіді для різних людей — без зразка й без оцінки. Що ти змінив(ла): звертання, довжину, ввічливі форми?</p>
      <dl className="place-status">
        {replies.map((r, i) => <div key={INTERLOCUTOR_LADDER[i]!.id}><dt>{INTERLOCUTOR_LADDER[i]!.who_uk}</dt><dd lang="fi">{r}</dd></div>)}
      </dl>
      <p className="voice-status" role="status">Збережено без оцінки: {replies.length} з {INTERLOCUTOR_LADDER.length}. Доречність перевіряв(ла) ти сам(а).</p>
    </section>
  );
  if (stopped) return null;
  if (index === null) return (
    <section className="stepup" aria-labelledby="register-title">
      <h2 id="register-title">Скажи те саме різним людям</h2>
      <p>За бажанням: та сама ситуація для друга, сусіда й службовця — і щоразу окремо перевір, чи доречно звучить.</p>
      <div className="actions"><button type="button" className="btn secondary" onClick={() => setIndex(0)}>Різні співрозмовники (за бажанням)</button></div>
    </section>
  );
  const step = INTERLOCUTOR_LADDER[index]!;
  async function save(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!text.trim()) { setError("Спершу напиши відповідь."); return; }
    setSaving(true); setError(null);
    try {
      const next = addDiagnostic(snapshot.state, interlocutorEvidence(card, step.id, text, checked));
      const committed = await repository.commit(next, snapshot.revision);
      const verified = await repository.read();
      if (verified.revision !== committed.revision || JSON.stringify(verified.state) !== JSON.stringify(next))
        throw Object.assign(new Error("Stored progress differs"), { code: "READBACK_MISMATCH" });
      onSaved(verified);
      setReplies(r => [...r, text.trim()]); setText(""); setChecked([]);
      if (index! + 1 < INTERLOCUTOR_LADDER.length) setIndex(index! + 1);
    } catch (err) {
      setError(`Не збережено (${code(err)}). Твій текст залишився в полі. ${writeFailureAdvice(err)}`);
    } finally { setSaving(false); }
  }
  const toggle = (i: number) => setChecked(c => (c.includes(i) ? c.filter(x => x !== i) : [...c, i]));
  return (
    <section className="stepup" aria-labelledby="register-title">
      <h2 id="register-title">Співрозмовник {index + 1} з {INTERLOCUTOR_LADDER.length}: {step.who_uk}</h2>
      {index === 0 && <p className="muted">{SAME_ACT_UK} {REGISTER_NOTE_UK}</p>}
      <p className={situation.lang === "fi" ? "prompt" : undefined} lang={situation.lang}>{situation.text}</p>
      <p data-testid="register-cue"><strong>{step.cue_uk}</strong></p>
      <form onSubmit={e => void save(e)} noValidate>
        <label className="field" htmlFor="register-text">Твоя відповідь фінською для цієї людини (без оцінки)</label>
        <textarea id="register-text" className="answer" lang="fi" rows={3} maxLength={REGISTER_MAX_CHARS} disabled={saving} value={text} onChange={e => setText(e.target.value)} />
        <fieldset className="choices-set">
          <legend>Чи доречно це звучить для цієї людини? <span className="muted">(самоперевірка — не оцінка; познач, що вдалося)</span></legend>
          {step.checks_uk.map((c, i) => <label key={c} className="radio"><input type="checkbox" checked={checked.includes(i)} onChange={() => toggle(i)} /> {c}</label>)}
        </fieldset>
        {error && <p className="feedback error" role="alert">{error}</p>}
        <div className="actions">
          <button type="submit" className="btn" disabled={saving}>{saving ? "Зберігаю…" : "Зберегти й далі"}</button>
          <button type="button" className="btn secondary" disabled={saving} onClick={() => setStopped(true)}>Досить на сьогодні</button>
        </div>
      </form>
    </section>
  );
}
