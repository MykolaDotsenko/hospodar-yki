import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { addDiagnostic, diagnosticEvidence, diagnosticReducer, diagnosticSummary, diagnosticView, startDiagnostic,
  DiagnosticError, PRODUCTION_MAX_CHARS, type DiagnosticEvent, type DiagnosticSession, type LearnerState } from "@hospodar/domain";
import { baseline as B } from "../content/diagnostic.ts";
import { diagnosticPayload, validDiagnosticDraft } from "../storage/diagnosticDraft.ts";
import type { DiagnosticDraftRow, LearnerRepository } from "../storage/learnerRepository.ts";

type Snap = { state: LearnerState; revision: number };
const NEXT_UK = {
  reading_detail: "Читання: перечитай речення з ключовими словами часу й заперечення (ei, eikä, mutta).",
  writing_points: "Письмо: у наступному тексті признач кожному пункту завдання окреме речення.",
  speaking_points: "Говоріння: перед відповіддю склади короткий план із пунктів завдання.",
  listening_missions: "Аудіювання тут не перевірялося (запису ще немає) — спробуй місії «Аудіювання».",
  grammar_in_context: "Граматика в контексті: щоденна місія «Навчання».",
} as const;
type Loaded = { kind: "loading" } | { kind: "ready"; draft: DiagnosticDraftRow | null; blocked: string | null };
const code = (e: unknown) => String((e as { code?: string })?.code ?? "SAVE_FAILED");
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
  const current = useRef(s); current.current = s;
  const snap = useRef(snapshot); snap.current = snapshot;
  const [text, setText] = useState(""), textRef = useRef("");
  const [pick, setPick] = useState<number | null>(null), pickRef = useRef<number | null>(null);
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });
  const [working, setWorking] = useState(false), busy = useRef(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [discarding, setDiscarding] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "dirty" | "saving" | "saved" | "error">("idle");
  const revision = useRef(0), savedPayload = useRef(""), generation = useRef(0);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const heading = useRef<HTMLHeadingElement>(null);
  const v = diagnosticView(s, B);
  useEffect(() => {
    let alive = true;
    void repository.readDiagnosticDraft().then(row => {
      if (!alive) return;
      const invalid = row && (!validDiagnosticDraft({
        session: row.session, input: row.input, pick: row.pick, contentFingerprint: row.contentFingerprint,
      }, B) || row.learnerRevision !== snap.current.revision);
      if (row && !invalid) {
        current.current = row.session; setS(row.session);
        textRef.current = row.input; setText(row.input);
        pickRef.current = row.pick; setPick(row.pick);
        revision.current = row.revision;
        savedPayload.current = JSON.stringify(diagnosticPayload(row.session, row.input, row.pick, B));
        setSaveStatus("saved");
      }
      setLoaded({ kind: "ready", draft: row, blocked: invalid ? "Несумісна або застаріла чернетка діагностики. Відповіді приховано; нічого не перезаписано." : null });
    }).catch(e => { if (alive) { setLoadError(code(e)); setLoaded({ kind: "ready", draft: null, blocked: "Не вдалося прочитати чернетку. Дані не змінено." }); } });
    return () => { alive = false; };
  }, [repository]);
  useEffect(() => { if (loaded.kind === "ready" && !loaded.blocked) heading.current?.focus(); }, [loaded.kind, s.step, s.readingIndex]);
  const setTyped = (t: string) => { textRef.current = t; setText(t); generation.current++; setMessage(null); setSaveStatus("dirty"); };
  const setChoice = (p: number) => { pickRef.current = p; setPick(p); generation.current++; setMessage(null); setSaveStatus("dirty"); };
  const failure = (e: unknown) => { setSaveStatus("error"); setMessage("НЕ збережено (" + code(e) + "). Спроба лишилася на екрані; перевір іншу вкладку."); };
  function checkpoint(session: DiagnosticSession, input: string, pick: number | null): Promise<void> {
    const payload = diagnosticPayload(session, input, pick, B);
    if (!validDiagnosticDraft(payload, B)) return Promise.reject(new Error("INVALID_DRAFT"));
    const signature = JSON.stringify(payload);
    const next = queue.current.then(async () => {
      if (signature === savedPayload.current) return;
      setSaveStatus("saving");
      const row = await repository.saveDiagnosticDraft(payload, snap.current.revision, revision.current);
      revision.current = row.revision; savedPayload.current = signature; setSaveStatus("saved");
    });
    queue.current = next.catch(() => {});
    return next;
  }
  useEffect(() => {
    if (loaded.kind !== "ready" || loaded.blocked || busy.current || s.step === "summary" ||
        (s.step === "speaking_check" && s.speaking.voiceRecorded) ||
        (s.step === "reading" && pick === null && revision.current === 0)) return;
    const id = generation.current;
    const timer = setTimeout(() => {
      if (id !== generation.current) return;
      void checkpoint(current.current, textRef.current, pickRef.current).catch(failure);
    }, 650);
    return () => clearTimeout(timer);
  }, [loaded.kind, s, text, pick]);
  async function advance(event: DiagnosticEvent) {
    if (busy.current || loaded.kind !== "ready" || loaded.blocked) return;
    let next: DiagnosticSession;
    try { next = diagnosticReducer(current.current, B, event); }
    catch (e) { setMessage(e instanceof DiagnosticError ? ERR_UK[e.code] ?? "Цей крок недоступний." : "Цей крок недоступний."); return; }
    busy.current = true; setWorking(true); generation.current++; setMessage(null);
    // Self-check is a private checkbox, not a correctness key or completed evidence.
    // Update the controlled input synchronously for keyboard/Playwright accessibility;
    // leave persistence status dirty until IndexedDB CAS + readback finishes.
    if (event.type === "SELF_CHECK") {
      current.current = next; setS(next); setSaveStatus("dirty");
    }
    try {
      await queue.current;
      const voice = next.step === "speaking_check" && next.speaking.voiceRecorded;
      const durable = voice ? (next.speaking.text ? { ...next, speaking: { ...next.speaking, voiceRecorded: false } }
        : { ...next, step: "speaking" as const, speaking: { text: "", voiceRecorded: false }, speakingChecked: [] }) : next;
      await checkpoint(durable, "", null);
      current.current = next; setS(next); textRef.current = ""; setText(""); pickRef.current = null; setPick(null);
    } catch (e) { failure(e); }
    finally { busy.current = false; setWorking(false); }
  }
  async function saveSkill(skill: "reading" | "writing" | "speaking") {
    if (busy.current || loaded.kind !== "ready" || loaded.blocked) return;
    const before = current.current;
    let after: DiagnosticSession;
    try { after = diagnosticReducer(diagnosticReducer(before, B, { type: "MARK_SAVED", skill }), B, { type: "CONTINUE" }); }
    catch { setMessage("Цей крок недоступний."); return; }
    busy.current = true; setWorking(true); generation.current++; setMessage(null);
    try {
      await queue.current;
      let history = snap.current.state;
      for (const ev of diagnosticEvidence(before, B, skill)) history = addDiagnostic(history, ev);
      if (skill === "reading" || skill === "writing") {
        await checkpoint(before, "", null);
        const result = await repository.commitDiagnosticDraftStep(history,
          diagnosticPayload(after, "", null, B), skill, snap.current.revision, revision.current);
        revision.current = result.draft.revision; savedPayload.current = JSON.stringify(diagnosticPayload(after, "", null, B));
        snap.current = result.snapshot; onSaved(result.snapshot);
      } else {
        const voiceOnly = before.speaking.voiceRecorded && !before.speaking.text;
        if (!voiceOnly) await checkpoint(before.speaking.voiceRecorded
          ? { ...before, speaking: { ...before.speaking, voiceRecorded: false } } : before, "", null);
        const result = await repository.finishDiagnosticDraft(history, snap.current.revision, revision.current, before.speaking.text, voiceOnly);
        snap.current = result; onSaved(result); revision.current = 0; savedPayload.current = "";
      }
      current.current = after; setS(after); textRef.current = ""; setText(""); pickRef.current = null; setPick(null); setSaveStatus("saved");
    } catch (e) { failure(e); }
    finally { busy.current = false; setWorking(false); }
  }
  async function pause() {
    if (busy.current || loaded.kind !== "ready" || loaded.blocked) return;
    busy.current = true; setWorking(true); generation.current++; setMessage(null);
    try {
      await queue.current;
      const before = current.current;
      const voice = before.step === "speaking_check" && before.speaking.voiceRecorded;
      const durable = voice ? (before.speaking.text
        ? { ...before, speaking: { ...before.speaking, voiceRecorded: false } }
        : { ...before, step: "speaking" as const, speaking: { text: "", voiceRecorded: false }, speakingChecked: [] }) : before;
      const input = voice ? "" : textRef.current, pick = voice ? null : pickRef.current;
      if (revision.current || input || pick !== null || durable.step !== "reading") {
        await checkpoint(durable, input, pick);
        const back = await repository.readDiagnosticDraft();
        if (!back || back.revision !== revision.current ||
            JSON.stringify(diagnosticPayload(back.session, back.input, back.pick, B)) !== JSON.stringify(diagnosticPayload(durable, input, pick, B)))
          throw new Error("READBACK_MISMATCH");
      }
      onHome();
    } catch (e) { failure(e); }
    finally { busy.current = false; setWorking(false); }
  }
  async function discard() {
    if (busy.current || loaded.kind !== "ready" || loaded.blocked) return;
    busy.current = true; setWorking(true); generation.current++; setMessage(null);
    try {
      await queue.current;
      if (revision.current) await repository.discardDiagnosticDraft(snap.current.revision, revision.current);
      onHome();
    } catch (e) { failure(e); }
    finally { busy.current = false; setWorking(false); }
  }
  async function discardBlocked() {
    if (loaded.kind !== "ready" || !loaded.draft || discarding) return;
    setDiscarding(true); setLoadError(null);
    try {
      await repository.discardDiagnosticDraft(snap.current.revision, loaded.draft.revision);
      setLoaded({ kind: "ready", draft: null, blocked: null });
      current.current = startDiagnostic(B); setS(current.current);
      revision.current = 0; savedPayload.current = ""; textRef.current = ""; setText(""); pickRef.current = null; setPick(null);
    } catch (e) { setLoadError(code(e)); }
    finally { setDiscarding(false); }
  }
  if (loaded.kind === "loading") return <section className="panel" role="status">Читаю незавершену діагностику…</section>;
  if (loaded.blocked) return <section className="panel" aria-labelledby="dg-blocked">
    <h1 id="dg-blocked">Чернетка діагностики потребує уваги</h1>
    <p className="feedback warn" role="alert">{loaded.blocked}</p>
    {loadError && <p className="feedback error" role="alert">Помилка ({loadError}). Нічого не перезаписано.</p>}
    <div className="actions">
      {loaded.draft && <button type="button" className="btn danger"
        disabled={discarding || loaded.draft.learnerRevision !== snap.current.revision}
        onClick={() => void discardBlocked()}>Відкинути несумісну чернетку</button>}
      <button type="button" className="btn secondary" onClick={onHome}>На головну</button>
    </div>
  </section>;
  const saveError = message && <p className="feedback error" role="alert">{message}</p>;
  const titles = { reading: "Читання", reading_feedback: "Читання: що вийшло", writing: "Письмо", writing_check: "Письмо: перевір себе",
    speaking: "Говоріння", speaking_check: "Говоріння: перевір себе", summary: "Що далі" };

  return (
    <section className="panel" aria-labelledby="dg-title">
      <p className="eyebrow">Навчання · стартова діагностика · крок {v.stepNumber} з 4</p>
      <h1 id="dg-title" ref={heading} tabIndex={-1}>{titles[s.step]}</h1>
      <p className="draft-note">Чернетка: завдання ще не перевірено S2-викладачем. Це не рівень CEFR чи YKI.</p>
      {loaded.draft && s.step !== "summary" && <p className="feedback" role="status">Відновлено незавершену діагностику з цього пристрою.</p>}

      {s.step === "reading" && v.question && (
        <>
          <h2 lang="fi">{v.text.title_fi}</h2>
          <div className="prompt" lang="fi">{v.text.text_fi}</div>
          <form onSubmit={(e: FormEvent) => { e.preventDefault(); if (pick === null) { setMessage(ERR_UK.INVALID_ANSWER!); return; }
            void advance({ type: "ANSWER_READING", questionId: v.question!.id, optionIndex: pick }); }}>
            <fieldset className="choices-set">
              <legend><span className="muted">Питання {v.question.n} з {v.question.of} · </span><span lang="fi">{v.question.prompt_fi}</span></legend>
              {v.question.options.map((o, i) => (
                <label key={`${v.question!.id}-${i}`} className="radio"><input type="radio" name="dq" checked={pick === i} onChange={() => setChoice(i)} /> <span lang="fi">{o}</span></label>
              ))}
            </fieldset>
            
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
          <div className="actions"><button type="button" className="btn" disabled={working} onClick={() => void saveSkill("reading")}>{working ? "Зберігаю…" : "Зберегти й далі: письмо"}</button></div>
        </>
      )}

      {s.step === "writing" && (
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); void advance({ type: "SUBMIT_WRITING", text: textRef.current }); }} noValidate>
          <div className="prompt" lang="fi">{v.writingTask.prompt_fi}</div>
          <p>Що має бути в тексті: <span lang="fi">{v.writingTask.points_fi.join(" · ")}</span>.</p>
          <label className="field" htmlFor="dg-writing">Твій текст фінською (без зразка; автоматично не оцінюється)</label>
          <textarea id="dg-writing" className="answer" lang="fi" rows={6} disabled={working} maxLength={PRODUCTION_MAX_CHARS} value={text} onChange={e => setTyped(e.target.value)} />
          
          <div className="actions"><button type="submit" className="btn">Готово — перевірити себе</button></div>
        </form>
      )}

      {s.step === "writing_check" && (
        <SelfCheck points={v.writingTask.points_fi} checked={v.writingChecked} onChange={p => void advance({ type: "SELF_CHECK", points: p })}
          own={<div className="prompt transcript" lang="fi">{v.writing}</div>} legend="Що з цього є у твоєму тексті?">
          <div className="actions"><button type="button" className="btn" disabled={working} onClick={() => void saveSkill("writing")}>{working ? "Зберігаю…" : "Зберегти без оцінки й далі: говоріння"}</button></div>
        </SelfCheck>
      )}

      {s.step === "speaking" && <Speaking task={v.speakingTask} text={text} setText={setTyped} error={message}
        onSubmit={voiceRecorded => void advance({ type: "SUBMIT_SPEAKING", text: textRef.current, voiceRecorded })} />}

      {s.step === "speaking_check" && (
        <SelfCheck points={v.speakingTask.points_fi} checked={v.speakingChecked} onChange={p => void advance({ type: "SELF_CHECK", points: p })}
          own={v.speaking.text ? <div className="prompt transcript" lang="fi">{v.speaking.text}</div> : <p className="muted">Голосовий запис зроблено (лише в цій вкладці, не зберігається).</p>}
          legend="Що з цього ти сказав(ла)?">
          <div className="actions"><button type="button" className="btn" disabled={working} onClick={() => void saveSkill("speaking")}>{working ? "Зберігаю…" : "Зберегти без оцінки й завершити"}</button></div>
        </SelfCheck>
      )}

      {s.step !== "summary" && <>
        {saveError}
        <p className="muted" role="status">{saveStatus === "dirty" ? "Є незбережені зміни." : saveStatus === "saving" ? "Зберігаю локально…" :
          saveStatus === "saved" ? "Чернетка збережена на пристрої." : saveStatus === "error" ? "Чернетку не підтверджено." :
          "Збереження почнеться після відповіді."}</p>
        {s.step === "speaking_check" && s.speaking.voiceRecorded &&
          <p className="muted">Аудіо тимчасове: якщо вийти, голосову відповідь доведеться повторити. Аудіофайли не зберігаються.</p>}
        <div className="actions">
          <button type="button" className="btn secondary" disabled={working} onClick={() => void pause()}>Зберегти та вийти</button>
          <button type="button" className="btn danger" disabled={working} onClick={() => void discard()}>Відкинути чернетку</button>
        </div>
        <p className="muted">Відкидання чернетки не видаляє вже записані результати попередніх кроків. Для повного видалення відкрий «Мої дані».</p>
      </>}
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
