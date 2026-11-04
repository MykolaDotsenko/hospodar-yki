import { useEffect, useRef, useState, type FormEvent } from "react";
import { addDiagnostic, listeningEvidence, listeningReducer, listeningView, startListening,
  type LearnerState, type ListeningLesson, type ListeningSession, ListeningError } from "@hospodar/domain";
import { listeningLessons, mediaFor, type LessonCredit } from "../content/listening.ts";
import type { LearnerRepository } from "../storage/learnerRepository.ts";

export function ListeningScreen({ repository, snapshot, onSaved, onHome }: {
  repository: LearnerRepository; snapshot: { state: LearnerState; revision: number };
  onSaved: (s: { state: LearnerState; revision: number }) => void; onHome: () => void;
}) {
  const [lesson, setLesson] = useState<ListeningLesson | null>(null);
  if (!lesson) {
    const done = new Set(snapshot.state.diagnostics.filter(d => d.skill === "listening").map(d => d.taskId));
    return (
      <section className="panel" aria-labelledby="lst-title">
        <p className="eyebrow">Навчання · аудіювання</p>
        <h1 id="lst-title">Обери запис</h1>
        <p className="muted">Більшість записів синтезовано одним голосом (Piper TTS); «живий голос» — читання людиною (LibriVox, суспільне надбання). Ніщо ще не перевірено S2-викладачем і не є автентичним мовленням YKI.</p>
        <ul className="choices" aria-label="Аудіозаписи">
          {listeningLessons.map(l => (
            <li key={l.id}><button type="button" className="choice" onClick={() => setLesson(l)}>
              <span lang="fi">{l.title_fi}</span>
              <small>{/tts/i.test(l.narrators_type) ? "синтетичний голос" : "живий голос"} · {Math.round(l.duration_seconds / 60 * 10) / 10} хв · {l.questions.length} питання{l.questions.every(q => done.has(q.id)) ? " · уже прослухано" : ""}</small>
            </button></li>
          ))}
        </ul>
        <div className="actions"><button type="button" className="btn secondary" onClick={onHome}>На головну</button></div>
      </section>
    );
  }
  return <ListeningMission key={lesson.id} lesson={lesson} repository={repository} snapshot={snapshot} onSaved={onSaved} onExit={() => setLesson(null)} />;
}

function ListeningMission({ lesson, repository, snapshot, onSaved, onExit }: {
  lesson: ListeningLesson; repository: LearnerRepository; snapshot: { state: LearnerState; revision: number };
  onSaved: (s: { state: LearnerState; revision: number }) => void; onExit: () => void;
}) {
  const [s, setS] = useState<ListeningSession>(() => startListening(lesson));
  const [text, setText] = useState("");
  const [pick, setPick] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [save, setSave] = useState<"idle" | "saving" | "saved" | { error: string }>("idle");
  const audioRef = useRef<HTMLAudioElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const v = listeningView(s, lesson);
  const media = mediaFor(lesson);
  const credit = (lesson as { credit?: LessonCredit }).credit;
  useEffect(() => { heading.current?.focus(); }, [s.phase, s.index]);
  const latest = useRef(s);
  latest.current = s;
  const act = (e: Parameters<typeof listeningReducer>[2]) => {
    setError(null);
    // Compute synchronously so refusals surface as messages (not inside a React updater).
    try { const next = listeningReducer(latest.current, lesson, e); latest.current = next; setS(next); }
    catch (err) { setError(err instanceof ListeningError && err.code === "AUDIO_NOT_STARTED" ? "Спершу прослухай запис (кнопка ▶ у плеєрі)." : "Обери відповідь."); }
  };
  const slow = s.support.includes("slow");
  function setSpeed(rate: number) {
    const a = audioRef.current;
    if (a) { a.playbackRate = rate; a.preservesPitch = true; }
    if (rate < 1) act({ type: "REQUEST_SUPPORT", kind: "slow" });
  }
  async function finish() {
    const done = listeningReducer(latest.current, lesson, { type: "FINISH" });
    setSave("saving");
    try {
      let st = snapshot.state;
      for (const ev of listeningEvidence(done, lesson)) st = addDiagnostic(st, ev);
      onSaved(await repository.commit(st, snapshot.revision));
      setS(done); setSave("saved");
    } catch (err) { setSave({ error: String((err as { code?: string })?.code ?? "SAVE_FAILED") }); }
  }
  const titles = { predict: "Про що, на твою думку, буде запис?", listen: "Слухай", questions: v.question?.kind === "gist" ? "Головне: про що це?" : "Деталі", feedback: "Що вийшло", review: "Послухай ще раз із текстом", done: "Готово" };
  const player = v.showPlayer && media.audio && (
    <div className="audio-box">
      <p className="audio-label">🎧 <span lang="fi">{lesson.title_fi}</span> · {v.synthetic ? "синтетичний голос, один диктор" : "живий голос, один читець (літературний текст, не розмовна B1)"}</p>
      {credit && <p className="muted">Читає {credit.credit} · {credit.licence}{credit.source && <> · <a href={credit.source} target="_blank" rel="noopener noreferrer">джерело</a></>}</p>}
      <audio ref={audioRef} controls preload="none" src={media.audio} onPlay={() => act({ type: "AUDIO_STARTED" })}>
        {v.allowSubtitles && media.subtitles && <track kind="subtitles" srcLang="fi" label="Suomi" src={media.subtitles} default />}
      </audio>
      {(s.phase === "listen" || s.phase === "questions" || s.phase === "review") && (
        <div className="actions" role="group" aria-label="Швидкість">
          <button type="button" className="btn secondary" aria-pressed={!slow || audioRef.current?.playbackRate === 1} onClick={() => setSpeed(1)}>1×</button>
          <button type="button" className="btn secondary" aria-pressed={slow && audioRef.current?.playbackRate !== 1} onClick={() => setSpeed(0.75)}>0,75× (підтримка)</button>
          {(s.phase === "listen" || s.phase === "questions") && !s.support.includes("transcript") && (
            <button type="button" className="btn secondary" onClick={() => act({ type: "REQUEST_SUPPORT", kind: "transcript" })}>Показати текст (підтримка)</button>
          )}
        </div>
      )}
      {!v.independent && s.phase !== "review" && s.phase !== "done" && <p className="muted">З підтримкою відповіді зберігаються без оцінки — це не помилка.</p>}
    </div>
  );
  return (
    <section className="panel" aria-labelledby="lm-title">
      <p className="eyebrow">Навчання · аудіювання</p>
      <h1 id="lm-title" ref={heading} tabIndex={-1}>{titles[s.phase]}</h1>
      {lesson.teacher_review !== "approved" && <p className="draft-note">Чернетка: ще не перевірено S2-викладачем.</p>}

      {s.phase === "predict" && (
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); act(text.trim() ? { type: "SUBMIT_PREDICTION", text } : { type: "SKIP_PREDICTION" }); }}>
          <p>Назва: <strong lang="fi">{lesson.title_fi}</strong>. Що ти очікуєш почути? (необов'язково)</p>
          <label className="field" htmlFor="pred">Твій прогноз (будь-якою мовою)</label>
          <input id="pred" className="answer" value={text} onChange={e => setText(e.target.value)} />
          <div className="actions"><button type="submit" className="btn">{text.trim() ? "Далі: слухати" : "Пропустити й слухати"}</button></div>
        </form>
      )}

      {player}
      {v.showTranscript && media.transcript && <div className="prompt transcript" lang="fi">{media.transcript}</div>}

      {s.phase === "listen" && (
        <>
          <p>Прослухай запис повністю, не поспішай. Питання з'являться після цього.</p>
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions"><button type="button" className="btn" onClick={() => act({ type: "BEGIN_QUESTIONS" })}>До питань</button></div>
        </>
      )}

      {s.phase === "questions" && v.question && (
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); if (pick === null) { setError("Обери відповідь."); return; } act({ type: "ANSWER", questionId: v.question!.id, optionIndex: pick }); setPick(null); }}>
          <fieldset className="choices-set">
            <legend><span className="muted">Питання {v.question.n} з {v.question.of} · </span><span lang="fi">{v.question.prompt_fi}</span></legend>
            {v.question.options_fi.map((o, i) => (
              <label key={i} className="radio"><input type="radio" name="lq" checked={pick === i} onChange={() => setPick(i)} /> <span lang="fi">{o}</span></label>
            ))}
          </fieldset>
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions"><button type="submit" className="btn">Відповісти</button></div>
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
          {s.phase === "feedback" && <div className="actions"><button type="button" className="btn secondary" onClick={() => act({ type: "OPEN_REVIEW" })}>Послухати ще раз із текстом і субтитрами</button></div>}
          {typeof save === "object" && <p className="feedback error" role="alert">НЕ збережено ({save.error}). Спробуй ще раз.</p>}
          <div className="actions"><button type="button" className="btn" onClick={() => void finish()}>{save === "saving" ? "Зберігаю…" : "Зберегти результат"}</button></div>
        </>
      )}

      {s.phase === "done" && (
        <div className="feedback" role="status">
          <p>✅ Збережено на цьому пристрої. {v.independent ? "Самостійні відповіді записано окремо для аудіювання." : "Відповіді з підтримкою збережено без оцінки."}</p>
          <div className="actions"><button type="button" className="btn" onClick={onExit}>До списку записів</button></div>
        </div>
      )}
    </section>
  );
}
