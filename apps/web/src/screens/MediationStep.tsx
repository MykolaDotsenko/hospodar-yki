import { useState, type FormEvent } from "react";
import { addDiagnostic, mediationEvidence, MEDIATION_CHECK_UK, MEDIATION_MAX_CHARS, MEDIATION_MODES, type LearnerState, type MediationMode } from "@hospodar/domain";
import type { LearnerRepository } from "../storage/learnerRepository.ts";
import { writeFailureAdvice } from "../storage/browserStorageHealth.ts";

type Snap = { state: LearnerState; revision: number };
const code = (e: unknown) => String((e as { code?: string })?.code ?? "SAVE_FAILED");

/**
 * Mediation after a finished reading text (cefr-mediation-paraphrase): explain it to someone who needs it — in Ukrainian
 * to a friend without Finnish, or in simpler Finnish to a neighbour. Optional, no model, ungraded; own self-check only.
 */
export function MediationStep({ itemId, title_fi, text_fi, repository, snapshot, onSaved }: {
  itemId: string; title_fi: string; text_fi: string; repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void;
}) {
  const [mode, setMode] = useState<MediationMode | null>(null);
  const [text, setText] = useState("");
  const [checked, setChecked] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!mode || saving) return;
    if (!text.trim()) { setError("Спершу напиши пояснення."); return; }
    setSaving(true); setError(null);
    try {
      const next = addDiagnostic(snapshot.state, mediationEvidence(itemId, mode, text, checked));
      const committed = await repository.commit(next, snapshot.revision);
      const verified = await repository.read();
      if (verified.revision !== committed.revision || JSON.stringify(verified.state) !== JSON.stringify(next))
        throw Object.assign(new Error("Stored progress differs"), { code: "READBACK_MISMATCH" });
      onSaved(verified); setSaved(true);
    } catch (err) { setError(`Не збережено (${code(err)}). Твій текст залишився в полі. ${writeFailureAdvice(err)}`); }
    finally { setSaving(false); }
  }

  if (saved) return <p className="voice-status" role="status" data-testid="mediation-done">Пояснення збережено без оцінки.</p>;
  return (
    <section className="stepup" aria-labelledby="med-title">
      <h2 id="med-title">Поясни комусь, що тут написано</h2>
      <p>За бажанням: так буває в житті — людині поруч треба знати, що в оголошенні. Без зразка й без оцінки.</p>
      {mode === null ? (
        <div className="actions">
          {(Object.keys(MEDIATION_MODES) as MediationMode[]).map(m => (
            <button key={m} type="button" className="btn secondary" onClick={() => setMode(m)}>{MEDIATION_MODES[m].label_uk}</button>
          ))}
        </div>
      ) : (
        <form onSubmit={e => void save(e)} noValidate>
          <details className="why"><summary>Текст ще раз: <span lang="fi">{title_fi}</span></summary><p className="transcript" lang="fi">{text_fi}</p></details>
          <label className="field" htmlFor="med-text">{MEDIATION_MODES[mode].field_uk}</label>
          <textarea id="med-text" className={MEDIATION_MODES[mode].lang === "fi" ? "answer" : "plan-notes"} lang={MEDIATION_MODES[mode].lang} rows={4}
            maxLength={MEDIATION_MAX_CHARS} disabled={saving} value={text} onChange={e => setText(e.target.value)} />
          <fieldset className="choices-set">
            <legend>Чи є це у твоєму поясненні? <span className="muted">(самоперевірка — не оцінка)</span></legend>
            {MEDIATION_CHECK_UK.map((q, i) => (
              <label key={q} className="radio"><input type="checkbox" checked={checked.includes(i)}
                onChange={e => setChecked(c => e.target.checked ? [...c, i] : c.filter(x => x !== i))} /> {q}</label>
            ))}
          </fieldset>
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions">
            <button type="submit" className="btn" disabled={saving}>{saving ? "Зберігаю…" : "Зберегти пояснення"}</button>
            <button type="button" className="btn secondary" disabled={saving} onClick={() => { setMode(null); setText(""); setChecked([]); }}>Інший співрозмовник</button>
          </div>
        </form>
      )}
    </section>
  );
}
