import { useRef, useState, type FormEvent } from "react";
import { addDiagnostic, externalEvidence, externalReducer, externalView, startExternal, EXTERNAL_MAX_CHARS,
  type ExternalEvent, type ExternalMission, type ExternalSession, type LearnerState } from "@hospodar/domain";
import { externalMissionGroups, externalMissions } from "../content/externalMissions.ts";
import type { LearnerRepository } from "../storage/learnerRepository.ts";
import { writeFailureAdvice } from "../storage/browserStorageHealth.ts";
import { Eyebrow, ThresholdRoute } from "../ui/MissionChrome.tsx";
import { Icon } from "../ui/icons.tsx";
import { TrustNote } from "../ui/TrustNote.tsx";

type Snap = { state: LearnerState; revision: number };
const STEPS = ["Джерело і твоя відповідь", "Перевір себе", "Нова ситуація"];
const STEP_INDEX = { open: 0, not_found: 0, reflect: 1, transfer: 2, done: 3 } as const;
const SKILL_UK = { listening: "Аудіювання", reading: "Читання" } as const;
const code = (e: unknown) => String((e as { code?: string })?.code ?? "SAVE_FAILED");

/**
 * Missions with an external source (packages/domain/src/externalMission.ts; CURATED-09). The recording or text opens on the
 * publisher's site; the app gives an original task, then how to check yourself, then a new situation. Nothing is scored.
 */
export function ExternalMissionScreen({ repository, snapshot, onSaved, onHome }: { repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void; onHome: () => void }) {
  const [open, setOpen] = useState<ExternalMission | null>(null);
  const done = new Set(snapshot.state.diagnostics.map(d => d.taskId));
  if (open) return <ExternalRun key={open.id} m={open} repository={repository} snapshot={snapshot} onSaved={onSaved}
    onNext={() => setOpen(externalMissions.find(x => x.id !== open.id && !done.has(`${x.id}-transfer`)) ?? null)} onList={() => setOpen(null)} />;
  return (
    <section className="panel" data-accent="listening" aria-labelledby="ext-title">
      <Eyebrow accent="listening">Навчання · місії із зовнішніми джерелами</Eyebrow>
      <h1 id="ext-title">Місії із зовнішніми джерелами</h1>
      <p>Запис чи текст відкривається на сайті видавця: OPH, Kielibuusti, aoe.fi. Застосунок нічого не копіює. Він дає завдання, підказує, як перевірити себе, і пропонує нову ситуацію.</p>
      <TrustNote many>Застосунок не чує запису, який ти обрав(ла), тому нічого не оцінює.</TrustNote>
      {externalMissionGroups.map(g => g.missions.length > 0 && (
        <section key={g.id} aria-labelledby={`ext-${g.id}`}>
          <h2 id={`ext-${g.id}`}>{g.title_uk}</h2>
          <ul className="choices" aria-label={g.title_uk}>
            {g.missions.map(m => (
              <li key={m.id}><button type="button" className="choice" onClick={() => setOpen(m)}>
                <span lang="fi">{m.title_fi}</span>
                <small>{SKILL_UK[m.skill]}{m.level ? ` · ${m.level}` : ""} · {m.publisher} · {done.has(`${m.id}-transfer`) ? "уже пройдено" : "ще не пройдено"}</small>
              </button></li>
            ))}
          </ul>
        </section>
      ))}
      <div className="actions"><button type="button" className="btn secondary" onClick={onHome}>На головну</button></div>
    </section>
  );
}

function ExternalRun({ m, repository, snapshot, onSaved, onNext, onList }: { m: ExternalMission; repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void; onNext: () => void; onList: () => void }) {
  const [s, setS] = useState<ExternalSession>(() => startExternal(m));
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const busy = useRef(false);
  const v = externalView(s, m);

  function step(e: ExternalEvent) {
    setError(null);
    try { setS(externalReducer(s, m, e)); setValue(""); }
    catch (err) { setError(code(err) === "EMPTY" ? "Спершу напиши відповідь." : "Цей крок зараз недоступний."); }
  }
  async function finish(e: FormEvent) {
    e.preventDefault();
    if (busy.current || saved) return;
    let finished: ExternalSession;
    try { finished = externalReducer(s, m, { type: "SUBMIT_TRANSFER", text: value }); }
    catch { setError("Спершу напиши відповідь."); return; }
    busy.current = true; setSaving(true); setError(null);
    try {
      let next = snapshot.state;
      for (const ev of externalEvidence(finished, m)) next = addDiagnostic(next, ev);
      const committed = await repository.commit(next, snapshot.revision);
      const verified = await repository.read();                          // success only after a fresh, exact readback
      if (verified.revision !== committed.revision || JSON.stringify(verified.state) !== JSON.stringify(next))
        throw Object.assign(new Error("Stored progress differs"), { code: "READBACK_MISMATCH" });
      onSaved(verified); setS(finished); setSaved(true); setValue("");
    } catch (err) {
      setError(`Не збережено (${code(err)}). Твій текст залишився в полі. ${writeFailureAdvice(err)}`);
    } finally { busy.current = false; setSaving(false); }
  }

  return (
    <section className="panel" data-accent={m.skill} aria-labelledby="ext-run">
      <Eyebrow accent={m.skill}>Місія із зовнішнім джерелом · {SKILL_UK[m.skill]}{m.level ? ` · ${m.level}` : ""}</Eyebrow>
      <h1 id="ext-run" lang="fi">{m.title_fi}</h1>
      {m.title_uk && <p className="muted">{m.title_uk}</p>}
      <ThresholdRoute steps={STEPS} current={STEP_INDEX[s.phase]} accent={m.skill} />
      <TrustNote />

      {s.phase === "open" && (
        <form onSubmit={e => { e.preventDefault(); step({ type: "ANSWER", text: value }); }} noValidate>
          {m.note_uk && <p>{m.note_uk}</p>}
          <p><a className="btn secondary" href={v.firstUrl!} target="_blank" rel="noopener noreferrer" data-testid="ext-source">
            {m.skill === "listening" ? "Відкрити запис" : "Відкрити матеріал"} на {m.firstHost} ↗</a></p>
          <p className="prompt" lang="fi">{v.prompt_fi}</p>
          <label className="field" htmlFor="ext-answer">Твоя відповідь фінською, своїми словами (без оцінки)</label>
          <textarea id="ext-answer" className="answer" lang="fi" rows={4} maxLength={EXTERNAL_MAX_CHARS} value={value} onChange={e => setValue(e.target.value)} />
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions">
            <button type="submit" className="btn">Відповісти</button>
            <button type="button" className="btn secondary" onClick={() => step({ type: "NOT_FOUND" })}>Не знайшов(ла) запису чи матеріалу</button>
          </div>
          <p className="muted">Відповідай лише про те, що справді почув(ла) чи прочитав(ла). Незавершена місія не зберігається після перезавантаження.</p>
        </form>
      )}
      {s.phase === "not_found" && (
        <p className="feedback" role="status" data-testid="ext-not-found">Гаразд, нічого не збережено й нічого не вигадано. Сторінки видавців іноді змінюються: спробуй іншу місію.</p>
      )}

      {s.phase === "reflect" && (
        <>
          <p><strong>Твоя відповідь:</strong> <span lang="fi">{v.ownAnswer}</span></p>
          <p className="feedback" role="status" data-testid="ext-reflection">{v.reflection_uk}</p>
          {v.afterUrl && <p data-testid="ext-teacher-page">Тепер можна звірити з матеріалами вчителя на сайті видавця:{" "}
            <a href={v.afterUrl} target="_blank" rel="noopener noreferrer">сторінка з відповідями ↗</a></p>}
          <div className="actions"><button type="button" className="btn" onClick={() => step({ type: "CONTINUE" })}>Далі: нова ситуація</button></div>
        </>
      )}

      {s.phase === "transfer" && v.transfer_fi && (
        <form onSubmit={e => void finish(e)} noValidate>
          <p className="muted">Нова ситуація, без джерела</p>
          <p className="prompt" lang="fi">{v.transfer_fi}</p>
          <label className="field" htmlFor="ext-transfer">Скажи вголос і запиши свої репліки фінською (без оцінки)</label>
          <textarea id="ext-transfer" className="answer" lang="fi" rows={4} maxLength={EXTERNAL_MAX_CHARS} disabled={saving} value={value} onChange={e => setValue(e.target.value)} />
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions"><button type="submit" className="btn" disabled={saving}>{saving ? "Зберігаю…" : "Зберегти й завершити"}</button></div>
        </form>
      )}

      {saved && <>
        <p className="feedback" role="status"><Icon name="ok" /> Місію збережено на цьому пристрої — без оцінки.</p>
        {v.later_fi && <p data-testid="ext-later">Через кілька днів, без зразка (за бажанням): <span lang="fi">{v.later_fi}</span></p>}
      </>}
      <div className="actions">
        {saved && <button type="button" className="btn" onClick={onNext}>Наступна місія</button>}
        <button type="button" className="btn secondary" disabled={saving} onClick={onList}>До списку місій</button>
      </div>
    </section>
  );
}
