import { useState, type FormEvent } from "react";
import { activeConstraints, addDiagnostic, stepUpEvidence, stepUpFor, STEP_UP_MAX_CHARS,
  type LearnerState, type PracticeLine, type StepUpCheck, type StepUpTarget } from "@hospodar/domain";
import type { LearnerRepository } from "../storage/learnerRepository.ts";
import { writeFailureAdvice } from "../storage/browserStorageHealth.ts";

type Snap = { state: LearnerState; revision: number };
const code = (e: unknown) => String((e as { code?: string })?.code ?? "SAVE_FAILED");

const CHECK_UK: Record<StepUpCheck, string> = { yes: "Так", partly: "Частково", no: "Ще ні" };

/**
 * Graduated task sequencing: optional, after a saved card. Same situation; one more constraint per step, earlier ones
 * stay. Each step is saved ungraded with the learner's own check of the constraints (verified readback). Stop any time.
 */
export function StepUp({ card, situation, repository, snapshot, onSaved }: {
  card: StepUpTarget; situation: PracticeLine; repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void;
}) {
  const all = stepUpFor(card)!;
  const [index, setIndex] = useState<number | null>(null);          // null = not started
  const [text, setText] = useState("");
  const [check, setCheck] = useState<StepUpCheck | null>(null);
  const [savedSteps, setSavedSteps] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (stopped || savedSteps === all.length) return (
    <p className="voice-status" role="status" data-testid="stepup-done">
      {savedSteps === all.length ? "Усі ускладнення пройдено." : `Ускладнень пройдено: ${savedSteps} з ${all.length}.`} Тексти збережено без оцінки; перевіряв(ла) ти сам(а).
    </p>
  );
  if (index === null) return (
    <section className="stepup" aria-labelledby="stepup-title">
      <h2 id="stepup-title">Ускладнити ту саму ситуацію</h2>
      <p>За бажанням: ще раз та сама ситуація, але щоразу з однією новою умовою ({all.length} кроки). Можна зупинитися будь-коли.</p>
      <div className="actions"><button type="button" className="btn secondary" onClick={() => setIndex(0)}>Ускладнити (за бажанням)</button></div>
    </section>
  );
  const active = activeConstraints(card, index);
  async function save(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!text.trim()) { setError("Спершу напиши відповідь."); return; }
    if (!check) { setError("Познач, чи вдалося виконати умови."); return; }
    setSaving(true); setError(null);
    try {
      const next = addDiagnostic(snapshot.state, stepUpEvidence(card, index!, text, check));
      const committed = await repository.commit(next, snapshot.revision);
      const verified = await repository.read();
      if (verified.revision !== committed.revision || JSON.stringify(verified.state) !== JSON.stringify(next))
        throw Object.assign(new Error("Stored progress differs"), { code: "READBACK_MISMATCH" });
      onSaved(verified);
      setSavedSteps(n => n + 1); setText(""); setCheck(null);
      if (index! + 1 < all.length) setIndex(index! + 1);
    } catch (err) {
      setError(`Не збережено (${code(err)}). Твій текст залишився в полі. ${writeFailureAdvice(err)}`);
    } finally { setSaving(false); }
  }
  return (
    <section className="stepup" aria-labelledby="stepup-title">
      <h2 id="stepup-title">Ускладнення {index + 1} з {all.length}</h2>
      <p className={situation.lang === "fi" ? "prompt" : undefined} lang={situation.lang}>{situation.text}</p>
      <ol className="stepup-constraints" data-testid="stepup-constraints">
        {active.map((c, i) => <li key={c.id} data-new={i === index ? "yes" : "no"}>{c.uk}{i === index ? " — нова умова" : ""}</li>)}
      </ol>
      <form onSubmit={e => void save(e)} noValidate>
        <label className="field" htmlFor="stepup-text">Твоя відповідь фінською (без оцінки)</label>
        <textarea id="stepup-text" className="answer" lang="fi" rows={3} maxLength={STEP_UP_MAX_CHARS} disabled={saving} value={text} onChange={e => setText(e.target.value)} />
        <fieldset className="choices-set">
          <legend>{active.map(c => c.check_uk).join(" ")} <span className="muted">(самоперевірка — не оцінка)</span></legend>
          {(Object.keys(CHECK_UK) as StepUpCheck[]).map(k => (
            <label key={k} className="radio"><input type="radio" name="stepup-check" checked={check === k} onChange={() => setCheck(k)} /> {CHECK_UK[k]}</label>
          ))}
        </fieldset>
        {error && <p className="feedback error" role="alert">{error}</p>}
        <div className="actions">
          <button type="submit" className="btn" disabled={saving}>{saving ? "Зберігаю…" : "Зберегти крок"}</button>
          <button type="button" className="btn secondary" disabled={saving} onClick={() => setStopped(true)}>Досить на сьогодні</button>
        </div>
      </form>
    </section>
  );
}
