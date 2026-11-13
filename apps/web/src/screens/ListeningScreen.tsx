import { useEffect, useRef, useState, type FormEvent } from "react";
import { addDiagnostic, listeningEvidence, listeningReducer, listeningView, startListening,
  type LearnerState, type ListeningLesson, type ListeningSession, type ListeningEvent, ListeningError } from "@hospodar/domain";
import { listeningLessons, mediaFor, type LessonCredit } from "../content/listening.ts";
import { listeningPayload, validListeningDraft } from "../storage/listeningDraft.ts";
import type { LearnerRepository, ListeningDraftRow } from "../storage/learnerRepository.ts";
import { writeFailureAdvice } from "../storage/browserStorageHealth.ts";
import { Eyebrow, ThresholdRoute } from "../ui/MissionChrome.tsx";
import { Icon } from "../ui/icons.tsx";
import { TrustNote } from "../ui/TrustNote.tsx";

type Snap = { state: LearnerState; revision: number };
type Loaded = { kind: "loading" } | { kind: "ready"; draft: ListeningDraftRow | null; blocked: string | null };
const code = (e: unknown) => String((e as { code?: string })?.code ?? "SAVE_FAILED");

export function ListeningScreen({ repository, snapshot, onSaved, onHome, initialId }: {
  repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void; onHome: () => void;
  /** Opened from a place: start this lesson (an unfinished draft still wins and is resumed first). */
  initialId?: string | null;
}) {
  const [selected, setSelected] = useState<ListeningLesson | null>(() => listeningLessons.find(l => l.id === initialId) ?? null);
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [discarding, setDiscarding] = useState(false);
  useEffect(() => {
    let alive = true;
    void repository.readListeningDraft().then(row => {
      if (!alive) return;
      const lesson = listeningLessons.find(l => l.id === row?.session?.lessonId);
      const blocked = row && (!lesson || !validListeningDraft({
        session: row.session, input: row.input, contentFingerprint: row.contentFingerprint,
      }, lesson) || row.learnerRevision !== snapshot.revision)
        ? "Незавершене аудіювання несумісне з поточним матеріалом або прогресом. Підказки й результати приховано; чернетку не перезаписано." : null;
      if (row && !blocked && lesson) setSelected(lesson); // Preserve the done stage after atomic draft deletion.
      setLoaded({ kind: "ready", draft: row, blocked });
    }).catch(e => {
      if (alive) {
        setLoadError(code(e));
        setLoaded({ kind: "ready", draft: null, blocked: "Не вдалося прочитати чернетку аудіювання. Нічого не змінено." });
      }
    });
    return () => { alive = false; };
  }, [repository, snapshot.revision]);

  async function discardBlocked() {
    if (loaded.kind !== "ready" || !loaded.draft || discarding) return;
    setDiscarding(true); setLoadError(null);
    try {
      await repository.discardListeningDraft(snapshot.revision, loaded.draft.revision);
      setLoaded({ kind: "ready", draft: null, blocked: null }); setSelected(null);
    } catch (e) { setLoadError(code(e)); }
    finally { setDiscarding(false); }
  }

  if (loaded.kind === "loading") return <section className="panel" role="status">Перевіряю незавершене аудіювання…</section>;
  if (loaded.blocked) return (
    <section className="panel" aria-labelledby="ls-blocked">
      <h1 id="ls-blocked">Чернетка аудіювання потребує уваги</h1>
      <p className="feedback warn" role="alert">{loaded.blocked}</p>
      {loadError && <p className="feedback error" role="alert">Помилка читання або відкидання ({loadError}). Нічого не перезаписано.</p>}
      <div className="actions">
        {loaded.draft && <button type="button" className="btn danger"
          disabled={discarding || loaded.draft.learnerRevision !== snapshot.revision}
          onClick={() => void discardBlocked()}>Відкинути несумісну чернетку</button>}
        <button type="button" className="btn secondary" onClick={onHome}>На головну</button>
      </div>
      {loaded.draft?.learnerRevision !== snapshot.revision && <p className="muted">Онови сторінку: прогрес з іншої вкладки не можна перезаписувати.</p>}
    </section>
  );
  const resume = loaded.draft ? listeningLessons.find(l => l.id === loaded.draft?.session.lessonId) ?? null : null;
  const lesson = resume ?? selected;
  const clear = () => { setSelected(null); setLoaded({ kind: "ready", draft: null, blocked: null }); };
  if (lesson) return <ListeningMission key={lesson.id} lesson={lesson} repository={repository} snapshot={snapshot}
    initialDraft={resume ? loaded.draft : null} onSaved={onSaved} onExit={clear} onHome={onHome} />;
  const done = new Set(snapshot.state.diagnostics.filter(d => d.skill === "listening").map(d => d.taskId));
  return (
    <section className="panel" data-accent="listening" aria-labelledby="lst-title">
      <Eyebrow accent="listening">Навчання · аудіювання</Eyebrow>
      <h1 id="lst-title">Обери запис</h1>
      <p className="muted">Більшість записів синтезовано одним голосом (Piper TTS); «живий голос» — читання людиною (LibriVox, суспільне надбання). Ніщо ще не перевірено S2-викладачем і не є автентичним мовленням YKI.</p>
      <ul className="choices" aria-label="Аудіозаписи">
        {listeningLessons.map(l => (
          <li key={l.id}><button type="button" className="choice" onClick={() => setSelected(l)}>
            <span lang="fi">{l.title_fi}</span>
            <small>{/tts/i.test(l.narrators_type) ? "синтетичний голос" : "живий голос"} · {Math.round(l.duration_seconds / 60 * 10) / 10} хв · {l.questions.length} питання{l.questions.every(q => done.has(q.id)) ? " · уже прослухано" : ""}</small>
          </button></li>
        ))}
      </ul>
      <div className="actions"><button type="button" className="btn secondary" onClick={onHome}>На головну</button></div>
    </section>
  );
}

function ListeningMission({ lesson, repository, snapshot, initialDraft, onSaved, onExit, onHome }: {
  lesson: ListeningLesson; repository: LearnerRepository; snapshot: Snap; initialDraft: ListeningDraftRow | null;
  onSaved: (s: Snap) => void; onExit: () => void; onHome: () => void;
}) {
  const [s, setS] = useState<ListeningSession>(() => initialDraft?.session ?? startListening(lesson));
  const latest = useRef(s); latest.current = s;
  const snap = useRef(snapshot); snap.current = snapshot;
  const [value, setValue] = useState(initialDraft?.input ?? "");
  const inputRef = useRef(initialDraft?.input ?? "");
  const draftRevision = useRef(initialDraft?.revision ?? 0);
  const lastWritten = useRef(initialDraft ? JSON.stringify(listeningPayload(initialDraft.session, initialDraft.input, lesson)) : "");
  const queue = useRef<Promise<void>>(Promise.resolve());
  const generation = useRef(0);
  const busy = useRef(false);
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState<"idle" | "dirty" | "saving" | "saved" | "error">(initialDraft ? "saved" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [rate, setRate] = useState(initialDraft?.session.support.includes("slow") ? 0.75 : 1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const v = listeningView(s, lesson);
  const media = mediaFor(lesson);
  const credit = (lesson as { credit?: LessonCredit }).credit;
  useEffect(() => { heading.current?.focus(); }, [s.phase, s.index]);
  useEffect(() => {
    // Restored supported listening must not silently revert to standard speed.
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
      audioRef.current.preservesPitch = true;
    }
  }, [s.phase, rate]);

  function checkpoint(state: ListeningSession, input: string) {
    const payload = listeningPayload(state, input, lesson);
    if (!validListeningDraft(payload, lesson)) return Promise.reject(new Error("INVALID_DRAFT"));
    const fingerprint = JSON.stringify(payload);
    const next = queue.current.then(async () => {
      if (fingerprint === lastWritten.current) return;
      setStatus("saving");
      const row = await repository.saveListeningDraft(payload, snap.current.revision, draftRevision.current);
      draftRevision.current = row.revision; lastWritten.current = fingerprint;
      setStatus("saved");
    });
    queue.current = next.catch(() => {});
    return next;
  }
  useEffect(() => {
    if (busy.current || s.phase === "done" || (s.phase === "predict" && !value && draftRevision.current === 0)) return;
    const id = generation.current;
    const timer = setTimeout(() => {
      if (id !== generation.current) return;
      void checkpoint(latest.current, inputRef.current).catch(e => {
        setStatus("error"); setError("Автозбереження не підтверджене (" + code(e) + "). " + writeFailureAdvice(e));
      });
    }, 650);
    return () => clearTimeout(timer);
  }, [s, value, lesson]);

  function changeValue(next: string) {
    inputRef.current = next; generation.current++; setValue(next); setStatus("dirty"); setError(null);
  }
  function handleError(e: unknown) {
    setStatus("error"); setError("Збереження не підтверджене (" + code(e) + "). " + writeFailureAdvice(e));
  }
  async function transition(event: ListeningEvent, afterSaved?: () => void) {
    if (busy.current) return;
    let next: ListeningSession;
    try { next = listeningReducer(latest.current, lesson, event); }
    catch (e) {
      setError(e instanceof ListeningError && e.code === "AUDIO_NOT_STARTED"
        ? "Спершу прослухай запис (кнопка ▶ у плеєрі)." : "Цей крок зараз недоступний або відповідь не обрана.");
      return;
    }
    busy.current = true; setWorking(true); generation.current++; setError(null);
    try {
      await queue.current;
      // No question, key, feedback or transcript becomes visible before a verified IndexedDB receipt.
      await checkpoint(next, "");
      latest.current = next; setS(next); inputRef.current = ""; setValue("");
      afterSaved?.();
    } catch (e) { handleError(e); }
    finally { busy.current = false; setWorking(false); }
  }
  function setSpeed(speed: 1 | 0.75) {
    if (busy.current) return;
    if (speed === 1) {
      setRate(1);
      if (audioRef.current) { audioRef.current.playbackRate = 1; audioRef.current.preservesPitch = true; }
      return;
    }
    // Attribute supported listening DURABLY before the player slows down.
    void transition({ type: "REQUEST_SUPPORT", kind: "slow" }, () => {
      setRate(0.75);
      if (audioRef.current) { audioRef.current.playbackRate = 0.75; audioRef.current.preservesPitch = true; }
    });
  }
  async function finish() {
    if (busy.current) return;
    let done: ListeningSession;
    try { done = listeningReducer(latest.current, lesson, { type: "FINISH" }); }
    catch { setError("Заверши всі питання перед збереженням."); return; }
    busy.current = true; setWorking(true); generation.current++; setError(null); setStatus("saving");
    try {
      await queue.current;
      await checkpoint(latest.current, "");
      let state = snap.current.state;
      for (const ev of listeningEvidence(done, lesson)) state = addDiagnostic(state, ev);
      const saved = await repository.finishListeningDraft(state, snap.current.revision, draftRevision.current, lesson.id);
      snap.current = saved; onSaved(saved);
      draftRevision.current = 0; lastWritten.current = "";
      latest.current = done; setS(done); inputRef.current = ""; setValue(""); setStatus("saved");
    } catch (e) { handleError(e); }
    finally { busy.current = false; setWorking(false); }
  }
  async function pause() {
    if (busy.current) return;
    const exact = s.phase === "predict" || s.phase === "questions" ? inputRef.current : "";
    busy.current = true; setWorking(true); generation.current++; setError(null);
    try {
      await queue.current;
      if (!(s.phase === "predict" && !exact && draftRevision.current === 0)) {
        await checkpoint(latest.current, exact);
        const back = await repository.readListeningDraft();
        if (!back || back.revision !== draftRevision.current ||
            JSON.stringify(listeningPayload(back.session, back.input, lesson)) !== JSON.stringify(listeningPayload(latest.current, exact, lesson)))
          throw new Error("READBACK_MISMATCH");
      }
      onHome();
    } catch (e) { handleError(e); }
    finally { busy.current = false; setWorking(false); }
  }
  async function discard() {
    if (busy.current) return;
    busy.current = true; setWorking(true); generation.current++; setError(null);
    try {
      await queue.current;
      if (draftRevision.current > 0) await repository.discardListeningDraft(snap.current.revision, draftRevision.current);
      onExit();
    } catch (e) { handleError(e); }
    finally { busy.current = false; setWorking(false); }
  }

  const titles = { predict: "Про що, на твою думку, буде запис?", listen: "Слухай", questions: v.question?.kind === "gist" ? "Головне: про що це?" : "Деталі",
    feedback: "Що вийшло", review: "Послухай ще раз із текстом", done: "Готово" };
  const player = v.showPlayer && media.audio && (
    <div className="audio-box">
      <p className="audio-label"><Icon name="listening" /> <span lang="fi">{lesson.title_fi}</span> · {v.synthetic ? "синтетичний голос, один диктор" : "живий голос, один читець (літературний текст, не розмовна B1)"}</p>
      {credit && <p className="muted">Читає {credit.credit} · {credit.licence}{credit.source && <> · <a href={credit.source} target="_blank" rel="noopener noreferrer">джерело</a></>}</p>}
      <audio ref={audioRef} controls preload="none" src={media.audio}
        onPlay={() => { if (["listen", "questions", "review"].includes(latest.current.phase)) void transition({ type: "AUDIO_STARTED" }); }}>
        {v.allowSubtitles && media.subtitles && <track kind="subtitles" srcLang="fi" label="Suomi" src={media.subtitles} default />}
      </audio>
      {(s.phase === "listen" || s.phase === "questions" || s.phase === "review") && (
        <div className="actions" role="group" aria-label="Швидкість">
          <button type="button" className="btn secondary" disabled={working} aria-pressed={rate === 1} onClick={() => setSpeed(1)}>1×</button>
          <button type="button" className="btn secondary" disabled={working} aria-pressed={rate === 0.75} onClick={() => setSpeed(0.75)}>0,75× (підтримка)</button>
          {(s.phase === "listen" || s.phase === "questions") && !s.support.includes("transcript") && (
            <button type="button" className="btn secondary" disabled={working}
              onClick={() => void transition({ type: "REQUEST_SUPPORT", kind: "transcript" })}>Показати текст (підтримка)</button>
          )}
        </div>
      )}
      {!v.independent && s.phase !== "review" && s.phase !== "done" && <p className="muted">З підтримкою відповіді зберігаються без оцінки — це не помилка.</p>}
    </div>
  );
  return (
    <section className="panel" data-accent="listening" aria-labelledby="lm-title">
      <Eyebrow accent="listening">Навчання · аудіювання</Eyebrow>
      <h1 id="lm-title" ref={heading} tabIndex={-1}>{titles[s.phase]}</h1>
      <ThresholdRoute steps={["Прогноз", "Слухання", "Питання", "Перевірка", "З текстом"]} current={{ predict: 0, listen: 1, questions: 2, feedback: 3, review: 4, done: 5 }[s.phase]} accent="listening" />
      {lesson.teacher_review !== "approved" && <TrustNote />}
      {initialDraft && s.phase !== "done" && <p className="feedback" role="status">Незавершене аудіювання відновлено з цього пристрою.</p>}
      {s.phase === "predict" && (
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); void transition(inputRef.current.trim()
          ? { type: "SUBMIT_PREDICTION", text: inputRef.current } : { type: "SKIP_PREDICTION" }); }}>
          <p>Назва: <strong lang="fi">{lesson.title_fi}</strong>. Що ти очікуєш почути? (необов'язково)</p>
          <label className="field" htmlFor="pred">Твій прогноз (будь-якою мовою)</label>
          <input id="pred" className="answer" value={value} maxLength={400} disabled={working}
            onInput={e => { inputRef.current = e.currentTarget.value; }}
            onChange={e => changeValue(e.target.value)} />
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions"><button type="submit" className="btn" disabled={working}>
            {working ? "Зберігаю…" : value.trim() ? "Далі: слухати" : "Пропустити й слухати"}</button></div>
        </form>
      )}
      {player}
      {v.showTranscript && media.transcript && <div className="prompt transcript" lang="fi">{media.transcript}</div>}
      {s.phase === "listen" && (
        <>
          <p>Прослухай запис повністю, не поспішай. Питання з'являться після цього.</p>
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions"><button type="button" className="btn" disabled={working}
            onClick={() => void transition({ type: "BEGIN_QUESTIONS" })}>{working ? "Зберігаю…" : "До питань"}</button></div>
        </>
      )}
      {s.phase === "questions" && v.question && (
        <form onSubmit={e => {
          e.preventDefault();
          if (!inputRef.current) { setError("Обери відповідь."); return; }
          void transition({ type: "ANSWER", questionId: v.question!.id, optionIndex: Number(inputRef.current) });
        }}>
          <fieldset className="choices-set" disabled={working}>
            <legend><span className="muted">Питання {v.question.n} з {v.question.of} · </span><span lang="fi">{v.question.prompt_fi}</span></legend>
            {v.question.options_fi.map((o, i) => (
              <label key={i} className="radio"><input type="radio" name="lq" checked={value === String(i)} onChange={() => changeValue(String(i))} /> <span lang="fi">{o}</span></label>
            ))}
          </fieldset>
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions"><button type="submit" className="btn" disabled={working}>{working ? "Зберігаю…" : "Відповісти"}</button></div>
        </form>
      )}
      {v.results && s.phase !== "done" && (
        <>
          <ol className="skill-lines">
            {v.results.map(r => (
              <li key={r.id}><span lang="fi">{r.prompt_fi}</span><br />
                <strong>{r.isCorrect ? "Правильно" : "Ще не так"}</strong> · <span lang="fi"><span className="learning-cue">{r.key_fi}</span></span>
                {r.why_uk && <><br /><span className="muted">{r.why_uk}</span></>}
              </li>
            ))}
          </ol>
          {s.phase === "feedback" && <div className="actions"><button type="button" className="btn secondary" disabled={working}
            onClick={() => void transition({ type: "OPEN_REVIEW" })}>Послухати ще раз із текстом і субтитрами</button></div>}
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions"><button type="button" className="btn" disabled={working}
            onClick={() => void finish()}>{working ? "Зберігаю…" : "Зберегти результат"}</button></div>
        </>
      )}
      {s.phase !== "done" && (
        <>
          <p className="muted" role="status">{
            status === "dirty" ? "Є зміни, які ще не підтверджено в сховищі." :
            status === "saving" ? "Зберігаю на пристрої…" :
            status === "saved" ? "Чернетку підтверджено в сховищі пристрою." :
            status === "error" ? "Чернетку не підтверджено — не закривай вкладку." : "Чернетка ще не збережена."
          }</p>
          <div className="actions">
            <button type="button" className="btn secondary" disabled={working} onClick={() => void pause()}>Зберегти та вийти</button>
            <button type="button" className="btn danger" disabled={working} onClick={() => void discard()}>Відкинути чернетку</button>
          </div>
        </>
      )}
      {s.phase === "done" && (
        <div className="feedback" role="status">
          <p><Icon name="ok" /> Збережено на цьому пристрої. {v.independent ? "Самостійні відповіді записано окремо для аудіювання." : "Відповіді з підтримкою збережено без оцінки."}</p>
          <div className="actions"><button type="button" className="btn" onClick={onExit}>До списку записів</button></div>
        </div>
      )}
    </section>
  );
}
