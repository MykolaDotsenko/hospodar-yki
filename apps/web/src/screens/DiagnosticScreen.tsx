import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { addDiagnostic, diagnosticEvidence, diagnosticReducer, diagnosticSummary, diagnosticView, startDiagnostic,
  DiagnosticError, PRODUCTION_MAX_CHARS, type DiagnosticEvent, type DiagnosticSession, type LearnerState } from "@hospodar/domain";
import { baseline as B } from "../content/diagnostic.ts";
import type { LearnerRepository } from "../storage/learnerRepository.ts";

type Snap = { state: LearnerState; revision: number };
const NEXT_UK = {
  reading_detail: "Читання: перечитай речення з ключовими словами часу й заперечення (ei, eikä, mutta).",
  writing_points: "Письмо: у наступному тексті признач кожному пункту завдання окреме речення.",
  speaking_points: "Говоріння: перед відповіддю склади короткий план із пунктів завдання.",
  listening_missions: "Аудіювання тут не перевірялося (запису ще немає) — спробуй місії «Аудіювання».",
  grammar_in_context: "Граматика в контексті: щоденна місія «Навчання».",
} as const;
const ERR_UK: Record<string, string> = {
  TOO_SHORT: "Напиши щонайменше 20 символів — хоч кілька речень.",
  EMPTY_RESPONSE: "Запиши голос або напиши свій усний план.",
  INVALID_ANSWER: "Обери відповідь.",
};

/** One short probe per skill. Writing/speaking are never scored; the voice stays in this tab only. */
export function DiagnosticScreen({ repository, snapshot, onSaved, onHome, onListening }: {
  repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void; onHome: () => void; onListening: () => void;
}) {
  const [s, setS] = useState<DiagnosticSession>(() => startDiagnostic(B));
  const latest = useRef(s); latest.current = s;
  const snap = useRef(snapshot); snap.current = snapshot;
  const [text, setText] = useState("");
  const [pick, setPick] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"idle" | "saving" | { error: string }>("idle");
  const heading = useRef<HTMLHeadingElement>(null);
  const v = diagnosticView(s, B);
  useEffect(() => { heading.current?.focus(); }, [s.step, s.readingIndex]);

  const act = (e: DiagnosticEvent) => {
    setError(null);
    try { const n = diagnosticReducer(latest.current, B, e); latest.current = n; setS(n); return true; }
    catch (err) { setError(err instanceof DiagnosticError ? ERR_UK[err.code] ?? "Цей крок зараз недоступний." : "Помилка."); return false; }
  };
  /** Persist this step's evidence BEFORE moving on; failure keeps the learner on the step with their text. */
  async function saveAndContinue(skill: "reading" | "writing" | "speaking") {
    setSaving("saving");
    try {
      let st = snap.current.state;
      for (const ev of diagnosticEvidence(latest.current, B, skill)) st = addDiagnostic(st, ev);
      const saved = await repository.commit(st, snap.current.revision);
      snap.current = saved; onSaved(saved);
      act({ type: "MARK_SAVED", skill }); act({ type: "CONTINUE" });
      setText(""); setSaving("idle");
    } catch (err) { setSaving({ error: String((err as { code?: string })?.code ?? "SAVE_FAILED") }); }
  }
  const saveError = typeof saving === "object" && <p className="feedback error" role="alert">НЕ збережено ({saving.error}). Твоя відповідь лишилася тут — спробуй ще раз.</p>;
  const titles = { reading: "Читання", reading_feedback: "Читання: що вийшло", writing: "Письмо", writing_check: "Письмо: перевір себе",
    speaking: "Говоріння", speaking_check: "Говоріння: перевір себе", summary: "Що далі" };

  return (
    <section className="panel" aria-labelledby="dg-title">
      <p className="eyebrow">Навчання · стартова діагностика · крок {v.stepNumber} з 4</p>
      <h1 id="dg-title" ref={heading} tabIndex={-1}>{titles[s.step]}</h1>
      <p className="draft-note">Чернетка: завдання ще не перевірено S2-викладачем. Це не рівень CEFR чи YKI.</p>

      {s.step === "reading" && v.question && (
        <>
          <h2 lang="fi">{v.text.title_fi}</h2>
          <div className="prompt" lang="fi">{v.text.text_fi}</div>
          <form onSubmit={(e: FormEvent) => { e.preventDefault(); if (pick === null) { setError(ERR_UK.INVALID_ANSWER!); return; }
            if (act({ type: "ANSWER_READING", questionId: v.question!.id, optionIndex: pick })) setPick(null); }}>
            <fieldset className="choices-set">
              <legend><span className="muted">Питання {v.question.n} з {v.question.of} · </span><span lang="fi">{v.question.prompt_fi}</span></legend>
              {v.question.options.map((o, i) => (
                <label key={`${v.question!.id}-${i}`} className="radio"><input type="radio" name="dq" checked={pick === i} onChange={() => setPick(i)} /> <span lang="fi">{o}</span></label>
              ))}
            </fieldset>
            {error && <p className="feedback error" role="alert">{error}</p>}
            <div className="actions"><button type="submit" className="btn">Відповісти</button></div>
          </form>
          <p className="muted">Перша відповідь фіксується; пояснення — після всіх питань.</p>
        </>
      )}

      {s.step === "reading_feedback" && v.reading && (
        <>
          <ol className="skill-lines">
            {v.reading.map(r => (
              <li key={r.id}><span lang="fi">{r.prompt_fi}</span><br />
                <strong>{r.isCorrect ? "Правильно з першої спроби" : "Ще не так"}</strong> · <span lang="fi"><span className="learning-cue">{r.key_fi}</span></span>
                {r.explanation_uk && <><br /><span className="muted">{r.explanation_uk}</span></>}
              </li>
            ))}
          </ol>
          {saveError}
          <div className="actions"><button type="button" className="btn" disabled={saving === "saving"} onClick={() => void saveAndContinue("reading")}>{saving === "saving" ? "Зберігаю…" : "Зберегти й далі: письмо"}</button></div>
        </>
      )}

      {s.step === "writing" && (
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); act({ type: "SUBMIT_WRITING", text }); }} noValidate>
          <div className="prompt" lang="fi">{v.writingTask.prompt_fi}</div>
          <p>Що має бути в тексті: <span lang="fi">{v.writingTask.points_fi.join(" · ")}</span>.</p>
          <label className="field" htmlFor="dg-writing">Твій текст фінською (без зразка; автоматично не оцінюється)</label>
          <textarea id="dg-writing" className="answer" lang="fi" rows={6} maxLength={PRODUCTION_MAX_CHARS} value={text} onChange={e => setText(e.target.value)} />
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions"><button type="submit" className="btn">Готово — перевірити себе</button></div>
        </form>
      )}

      {s.step === "writing_check" && (
        <SelfCheck points={v.writingTask.points_fi} checked={v.writingChecked} onChange={p => act({ type: "SELF_CHECK", points: p })}
          own={<div className="prompt transcript" lang="fi">{v.writing}</div>} legend="Що з цього є у твоєму тексті?">
          {saveError}
          <div className="actions"><button type="button" className="btn" disabled={saving === "saving"} onClick={() => void saveAndContinue("writing")}>{saving === "saving" ? "Зберігаю…" : "Зберегти без оцінки й далі: говоріння"}</button></div>
        </SelfCheck>
      )}

      {s.step === "speaking" && <Speaking task={v.speakingTask} text={text} setText={setText} error={error}
        onSubmit={voiceRecorded => act({ type: "SUBMIT_SPEAKING", text, voiceRecorded })} />}

      {s.step === "speaking_check" && (
        <SelfCheck points={v.speakingTask.points_fi} checked={v.speakingChecked} onChange={p => act({ type: "SELF_CHECK", points: p })}
          own={v.speaking.text ? <div className="prompt transcript" lang="fi">{v.speaking.text}</div> : <p className="muted">Голосовий запис зроблено (лише в цій вкладці, не зберігається).</p>}
          legend="Що з цього ти сказав(ла)?">
          {saveError}
          <div className="actions"><button type="button" className="btn" disabled={saving === "saving"} onClick={() => void saveAndContinue("speaking")}>{saving === "saving" ? "Зберігаю…" : "Зберегти без оцінки й завершити"}</button></div>
        </SelfCheck>
      )}

      {s.step === "summary" && <Summary s={s} onHome={onHome} onListening={onListening} />}
    </section>
  );
}

function SelfCheck({ points, checked, onChange, own, legend, children }: {
  points: string[]; checked: number[]; onChange: (p: number[]) => void; own: ReactNode; legend: string; children: ReactNode;
}) {
  return (
    <>
      <p>Твоя відповідь (зафіксована):</p>
      {own}
      <fieldset className="choices-set">
        <legend>{legend} <span className="muted">(самоперевірка — не оцінка)</span></legend>
        {points.map((p, i) => (
          <label key={p} className="radio"><input type="checkbox" checked={checked.includes(i)}
            onChange={e => onChange(e.target.checked ? [...checked, i] : checked.filter(x => x !== i))} /> <span lang="fi">{p}</span></label>
        ))}
      </fieldset>
      {children}
    </>
  );
}

function Speaking({ task, text, setText, error, onSubmit }: {
  task: { prompt_fi: string; points_fi: string[] }; text: string; setText: (t: string) => void; error: string | null; onSubmit: (voice: boolean) => void;
}) {
  const supported = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";
  const [consent, setConsent] = useState(false);
  const [rec, setRec] = useState<"idle" | "recording" | "done" | { error: string }>("idle");
  const [url, setUrl] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  useEffect(() => () => { recorder.current?.stream.getTracks().forEach(t => t.stop()); }, []);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream); const chunks: Blob[] = [];
      r.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      r.onstop = () => { stream.getTracks().forEach(t => t.stop()); setUrl(URL.createObjectURL(new Blob(chunks, { type: r.mimeType || "audio/webm" }))); setRec("done"); };
      recorder.current = r; r.start(); setRec("recording");
    } catch { setRec({ error: "Мікрофон недоступний або доступ не дозволено. Напиши усний план нижче." }); }
  }
  return (
    <form onSubmit={(e: FormEvent) => { e.preventDefault(); onSubmit(rec === "done"); }} noValidate>
      <div className="prompt" lang="fi">{task.prompt_fi}</div>
      <p>Що сказати: <span lang="fi">{task.points_fi.join(" · ")}</span>. Вимова й мовлення автоматично не оцінюються.</p>
      {supported && (
        <div className="audio-box">
          <label className="radio"><input type="checkbox" checked={consent} disabled={rec === "recording"} onChange={e => setConsent(e.target.checked)} />
            Дозволяю записати мій голос лише в цій вкладці. Запис ніде не зберігається і нікуди не надсилається.</label>
          <div className="actions">
            {rec !== "recording"
              ? <button type="button" className="btn secondary" disabled={!consent} onClick={() => void start()}>{rec === "done" ? "Записати ще раз" : "🎙 Почати запис"}</button>
              : <button type="button" className="btn secondary" onClick={() => recorder.current?.stop()}>⏹ Зупинити</button>}
          </div>
          {rec === "recording" && <p role="status">Іде запис…</p>}
          {url && <><p className="muted">Послухай себе. Після виходу з цього кроку запис зникне.</p><audio controls src={url} /></>}
          {typeof rec === "object" && <p className="feedback warn" role="alert">{rec.error}</p>}
        </div>
      )}
      <label className="field" htmlFor="dg-speaking">{supported ? "Або (чи також) напиши свій усний план чи відповідь" : "Мікрофон недоступний — напиши свій усний план чи відповідь"}</label>
      <textarea id="dg-speaking" className="answer" lang="fi" rows={4} maxLength={PRODUCTION_MAX_CHARS} value={text} onChange={e => setText(e.target.value)} />
      {error && <p className="feedback error" role="alert">{error}</p>}
      <div className="actions"><button type="submit" className="btn" disabled={rec === "recording"}>Готово — перевірити себе</button></div>
    </form>
  );
}

function Summary({ s, onHome, onListening }: { s: DiagnosticSession; onHome: () => void; onListening: () => void }) {
  const sum = diagnosticSummary(s, B);
  return (
    <div role="status">
      <ul className="skill-lines">
        <li><strong>Читання:</strong> {sum.reading.correct} з {sum.reading.total} з першої спроби{sum.reading.tooFewForConclusion ? " — замало питань для висновку" : ""}.</li>
        <li><strong>Письмо:</strong> збережено без оцінки.{sum.writingMissing_fi.length ? <> Ти не позначив(ла): <span lang="fi">{sum.writingMissing_fi.join(", ")}</span>.</> : " Ти позначив(ла) всі пункти завдання."}</li>
        <li><strong>Говоріння:</strong> {sum.speakingMode === "voice" ? "голосом (запис не збережено)" : "текстовий план"}, без оцінки.{sum.speakingMissing_fi.length ? <> Не позначено: <span lang="fi">{sum.speakingMissing_fi.join(", ")}</span>.</> : ""}</li>
        <li><strong>Аудіювання:</strong> не перевірялося — для цієї діагностики ще немає запису.</li>
      </ul>
      <h2>Наступні кроки</h2>
      <ul>{sum.next.map(n => <li key={n}>{NEXT_UK[n]}</li>)}</ul>
      <p className="qualification">Це не рівень CEFR, не бал і не прогноз YKI. Письмо та говоріння не оцінюються автоматично — їх може переглянути викладач.</p>
      <div className="actions">
        <button type="button" className="btn" onClick={onHome}>На головну</button>
        <button type="button" className="btn secondary" onClick={onListening}>🎧 До аудіювання</button>
      </div>
    </div>
  );
}
