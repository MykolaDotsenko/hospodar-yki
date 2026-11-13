import { useRef, useState, type FormEvent } from "react";
import { addDiagnostic, dictoglossEvidence, dictoglossReducer, dictoglossView, startDictogloss, DICTOGLOSS_MAX_CHARS,
  type DictoglossEvent, type DictoglossJudgement, type DictoglossSession, type LearnerState, type ListeningLesson, type VttCue } from "@hospodar/domain";
import type { LearnerRepository } from "../storage/learnerRepository.ts";
import { writeFailureAdvice } from "../storage/browserStorageHealth.ts";
import { Eyebrow } from "../ui/MissionChrome.tsx";
import { TrustNote } from "../ui/TrustNote.tsx";
import { Icon } from "../ui/icons.tsx";

type Snap = { state: LearnerState; revision: number };
const JUDGE_UK: Record<DictoglossJudgement, string> = { most: "Майже все", main: "Головне", little: "Небагато" };
const code = (e: unknown) => String((e as { code?: string })?.code ?? "SAVE_FAILED");

/**
 * Dictogloss (packages/domain/src/dictogloss.ts): one ~10 s segment of a lesson, heard at most twice, reconstructed in
 * Finnish from memory, then compared with its transcript. Short, so it is saved only when finished (verified readback).
 */
export function DictoglossRun({ lesson, cue, cueIndex, cueCount, audioUrl, repository, snapshot, onSaved, onExit }: {
  lesson: ListeningLesson; cue: VttCue; cueIndex: number; cueCount: number; audioUrl: string | null;
  repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void; onExit: () => void;
}) {
  const [s, setS] = useState<DictoglossSession>(() => startDictogloss(lesson.id, cueIndex));
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const v = dictoglossView(s, cue);

  function step(e: DictoglossEvent) {
    try { setS(dictoglossReducer(s, e)); setError(null); }        // reduce here, so a refused step is caught and explained
    catch (err) {
      const c = code(err);
      setError(c === "EMPTY" ? "Спершу напиши, що почув(ла)." : c === "NO_LISTEN" ? "Спершу прослухай уривок." : c === "NOT_JUDGED" ? "Спершу оціни сам(а), скільки вдалося відтворити." : "Цей крок зараз недоступний.");
    }
  }
  function play() {
    const a = audio.current;
    if (v.listensLeft === 0) return;
    step({ type: "PLAYED" });
    if (!a) return;
    a.currentTime = cue.start;
    const stop = () => { if (a.currentTime >= cue.end) { a.pause(); a.removeEventListener("timeupdate", stop); } };
    a.addEventListener("timeupdate", stop);
    void a.play().catch(() => a.removeEventListener("timeupdate", stop));
  }
  async function finish() {
    let done: DictoglossSession;
    try { done = dictoglossReducer(s, { type: "FINISH" }); } catch { setError("Спершу оціни сам(а), скільки вдалося відтворити."); return; }
    setSaving(true); setError(null);
    try {
      const next = addDiagnostic(snapshot.state, dictoglossEvidence(done));
      const committed = await repository.commit(next, snapshot.revision);
      const verified = await repository.read();
      if (verified.revision !== committed.revision || JSON.stringify(verified.state) !== JSON.stringify(next))
        throw Object.assign(new Error("Stored progress differs"), { code: "READBACK_MISMATCH" });
      onSaved(verified); setS(done);
    } catch (err) { setError(`Не збережено (${code(err)}). ${writeFailureAdvice(err)}`); }
    finally { setSaving(false); }
  }

  return (
    <section className="panel" data-accent="listening" aria-labelledby="dg-title">
      <Eyebrow accent="listening">Навчання · диктоглос · <span lang="fi">{lesson.title_fi}</span></Eyebrow>
      <h1 id="dg-title">{{ listen: "Послухай уривок", write: "Відтвори, що почув(ла)", compare: "Порівняй з оригіналом", done: "Готово" }[s.phase]}</h1>
      <TrustNote>Без автоматичної оцінки.</TrustNote>
      <p className="muted">Уривок {cueIndex + 1} з {cueCount}, близько {Math.round(cue.end - cue.start)} с. Синтетичний голос, один диктор.</p>
      {audioUrl && <audio ref={audio} preload="auto" src={audioUrl} />}

      {s.phase === "listen" && (
        <>
          <p>Послухай уважно — не більше двох разів. Можна робити короткі нотатки на папері. Тексту поки не буде.</p>
          <div className="actions">
            <button type="button" className="btn secondary" disabled={v.listensLeft === 0} onClick={play}>
              <Icon name="listening" /> {v.listensLeft === 2 ? "Прослухати уривок" : v.listensLeft === 1 ? "Прослухати ще раз (останній)" : "Прослухано двічі"}</button>
            <button type="button" className="btn" onClick={() => step({ type: "START_WRITING" })}>До письма</button>
          </div>
        </>
      )}

      {s.phase === "write" && (
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); step({ type: "SUBMIT", text }); }} noValidate>
          <p>Напиши уривок фінською так близько до почутого, як можеш. Не страшно, якщо не все — відтвори зміст своїми словами.</p>
          <label className="field" htmlFor="dg-text">Твій текст фінською (без оцінки)</label>
          <textarea id="dg-text" className="answer" lang="fi" rows={4} maxLength={DICTOGLOSS_MAX_CHARS} value={text} onChange={e => setText(e.target.value)} />
          <div className="actions"><button type="submit" className="btn">Показати оригінал</button></div>
        </form>
      )}

      {(s.phase === "compare" || s.phase === "done") && v.marked && (
        <>
          <h2>Оригінал</h2>
          <p className="prompt transcript" lang="fi" data-testid="dg-original">
            {v.marked.map((w, i) => <span key={i}>{i > 0 && " "}{w.shared ? <mark className="dg-shared">{w.word}</mark> : w.word}</span>)}
          </p>
          <p className="muted">Підсвічено слова, які є і у твоєму тексті в тій самій формі. Інша форма чи синонім теж можуть бути правильними — це не бал.</p>
          <h2>Твій текст</h2>
          <p className="prompt transcript" lang="fi">{v.own}</p>
          {s.phase === "compare" && (
            <>
              <fieldset className="choices-set">
                <legend>Скільки змісту вдалося відтворити? <span className="muted">(оцінюєш ти — це не бал)</span></legend>
                <div className="actions">
                  {(Object.keys(JUDGE_UK) as DictoglossJudgement[]).map(j => (
                    <button key={j} type="button" className="btn secondary" aria-pressed={s.judged === j} onClick={() => step({ type: "JUDGE", judgement: j })}>{JUDGE_UK[j]}</button>
                  ))}
                </div>
              </fieldset>
              <div className="actions"><button type="button" className="btn" disabled={saving} onClick={() => void finish()}>{saving ? "Зберігаю…" : "Зберегти"}</button></div>
            </>
          )}
        </>
      )}
      {error && <p className="feedback error" role="alert">{error}</p>}
      {s.phase === "done" && <p className="feedback" role="status"><Icon name="ok" /> Збережено на цьому пристрої без оцінки.</p>}
      <div className="actions"><button type="button" className="btn secondary" disabled={saving} onClick={onExit}>До списку записів</button></div>
    </section>
  );
}
