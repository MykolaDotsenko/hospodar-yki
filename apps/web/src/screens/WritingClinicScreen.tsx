import { useEffect, useRef, useState, type FormEvent } from "react";
import { addDiagnostic, clinicEvidence, clinicReducer, clinicView, startClinic, ClinicError, CLINIC_MAX_CHARS,
  type ClinicEvent, type ClinicItem, type ClinicSession, type LearnerState } from "@hospodar/domain";
import { clinicItems } from "../content/writingClinic.ts";
import { clinicPayload, validClinicDraft } from "../storage/clinicDraft.ts";
import type { ClinicDraftRow, LearnerRepository } from "../storage/learnerRepository.ts";
import { writeFailureAdvice } from "../storage/browserStorageHealth.ts";
import { Eyebrow, ThresholdRoute } from "../ui/MissionChrome.tsx";
import { TrustNote } from "../ui/TrustNote.tsx";

type Snap = { state: LearnerState; revision: number };
type Loaded = { kind: "loading" } | { kind: "ready"; draft: ClinicDraftRow | null; blocked: string | null };
const FOCUS_UK: Record<string, string> = { clarity: "зрозумілість", grammar: "граматика", register: "стиль", vocabulary: "лексика", content: "зміст", coherence: "зв'язність" };
const code = (e: unknown) => String((e as { code?: string })?.code ?? "SAVE_FAILED");

export function WritingClinicScreen({ repository, snapshot, onSaved, onHome, initialId }: {
  repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void; onHome: () => void; initialId?: string | null;
}) {
  const [selected, setSelected] = useState<ClinicItem | null>(() => clinicItems.find(i => i.id === initialId) ?? null);
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [discarding, setDiscarding] = useState(false);
  useEffect(() => {
    let alive = true;
    void repository.readClinicDraft().then(row => {
      if (!alive) return;
      const item = clinicItems.find(i => i.id === row?.session?.itemId);
      const blocked = row && (!item || !validClinicDraft({
        session: row.session, input: row.input, contentFingerprint: row.contentFingerprint,
      }, item) || row.learnerRevision !== snapshot.revision)
        ? "Незавершений текст або навчальний прогрес змінився. Чернетку не відкрито, щоб не показати зразок завчасно й не втратити твої відповіді." : null;
      if (row && !blocked && item) setSelected(item); // Keep the active screen mounted after the final checkpoint is atomically removed.
      setLoaded({ kind: "ready", draft: row, blocked });
    }).catch(e => { if (alive) { setLoadError(code(e)); setLoaded({ kind: "ready", draft: null, blocked: "Не вдалося прочитати чернетку. Нічого не перезаписано." }); } });
    return () => { alive = false; };
  }, [repository, snapshot.revision]);

  async function discardBlocked() {
    if (loaded.kind !== "ready" || !loaded.draft || discarding) return;
    setDiscarding(true); setLoadError(null);
    try {
      await repository.discardClinicDraft(snapshot.revision, loaded.draft.revision);
      setLoaded({ kind: "ready", draft: null, blocked: null });
      setSelected(null);
    } catch (e) { setLoadError(code(e)); }
    finally { setDiscarding(false); }
  }

  if (loaded.kind === "loading") return <section className="panel" role="status">Перевіряю незавершену майстерню письма…</section>;
  if (loaded.blocked) return (
    <section className="panel" aria-labelledby="wc-blocked">
      <h1 id="wc-blocked">Чернетка потребує уваги</h1>
      <p className="feedback warn" role="alert">{loaded.blocked}</p>
      {loadError && <p className="feedback error" role="alert">Помилка читання або відкидання ({loadError}). Нічого не перезаписано.</p>}
      <div className="actions">
        {loaded.draft && <button type="button" className="btn danger" disabled={discarding || loaded.draft.learnerRevision !== snapshot.revision}
          onClick={() => void discardBlocked()}>Відкинути несумісну чернетку</button>}
        <button type="button" className="btn secondary" onClick={onHome}>На головну</button>
      </div>
      {loaded.draft?.learnerRevision !== snapshot.revision && <p className="muted">Онови сторінку перед діями: прогрес іншої вкладки не можна перезаписувати.</p>}
    </section>
  );

  const resume = loaded.draft ? clinicItems.find(i => i.id === loaded.draft?.session.itemId) ?? null : null;
  const item = resume ?? selected;
  const clear = () => { setSelected(null); setLoaded({ kind: "ready", draft: null, blocked: null }); };
  if (item) return <Clinic key={item.id} item={item} repository={repository} snapshot={snapshot} onSaved={onSaved}
    initialDraft={resume ? loaded.draft : null} onExit={clear} onHome={onHome} />;
  const done = new Set(snapshot.state.diagnostics.map(d => d.taskId));
  return (
    <section className="panel" data-accent="writing" aria-labelledby="wc-title">
      <Eyebrow accent="writing">Навчання · письмо</Eyebrow>
      <h1 id="wc-title">Майстерня письма</h1>
      <p>Спершу пишеш сам(а), потім шукаєш проблеми в слабкій чернетці, бачиш зразок, переписуєш свій текст і пишеш новий — уже без зразка.</p>
      <TrustNote many>Письмо автоматично не оцінюється.</TrustNote>
      <ul className="choices" aria-label="Завдання з письма">
        {clinicItems.map(i => (
          <li key={i.id}><button type="button" className="choice" onClick={() => setSelected(i)}>
            <span lang="fi">{i.title_fi}</span>
            <small>{done.has(i.id + "-transfer") ? "уже пройдено" : String(i.required.length) + " пункти завдання"}</small>
          </button></li>
        ))}
      </ul>
      <div className="actions"><button type="button" className="btn secondary" onClick={onHome}>На головну</button></div>
    </section>
  );
}

function Clinic({ item, repository, snapshot, initialDraft, onSaved, onExit, onHome }: {
  item: ClinicItem; repository: LearnerRepository; snapshot: Snap; initialDraft: ClinicDraftRow | null;
  onSaved: (s: Snap) => void; onExit: () => void; onHome: () => void;
}) {
  const [s, setS] = useState<ClinicSession>(() => initialDraft?.session ?? startClinic(item));
  const latest = useRef(s); latest.current = s;
  const snap = useRef(snapshot); snap.current = snapshot;
  const [text, setText] = useState(initialDraft?.input ?? "");
  const inputRef = useRef(initialDraft?.input ?? "");
  const draftRevision = useRef(initialDraft?.revision ?? 0);
  const lastWritten = useRef(initialDraft ? JSON.stringify(clinicPayload(initialDraft.session, initialDraft.input, item)) : "");
  const queue = useRef<Promise<void>>(Promise.resolve());
  const generation = useRef(0);
  const busy = useRef(false);
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState<"idle" | "dirty" | "saving" | "saved" | "error">(initialDraft ? "saved" : "idle");
  const [error, setError] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const v = clinicView(s, item);
  useEffect(() => { heading.current?.focus(); }, [s.phase]);

  function currentText() {
    // onInput captures the exact value synchronously even before React commits a fast final change.
    return inputRef.current;
  }
  /** A slow keystroke never overwrites a newer step; a successful write is verified by the repository. */
  function checkpoint(state: ClinicSession, input: string) {
    const payload = clinicPayload(state, input, item);
    if (!validClinicDraft(payload, item)) return Promise.reject(new Error("INVALID_DRAFT"));
    const fingerprint = JSON.stringify(payload);
    const next = queue.current.then(async () => {
      if (fingerprint === lastWritten.current) return;
      setStatus("saving");
      const row = await repository.saveClinicDraft(payload, snap.current.revision, draftRevision.current);
      draftRevision.current = row.revision;
      lastWritten.current = fingerprint;
      setStatus("saved");
    });
    queue.current = next.catch(() => {});
    return next;
  }
  useEffect(() => {
    if (busy.current || s.phase === "done" || (s.phase === "write" && !text && draftRevision.current === 0)) return;
    const id = generation.current;
    const timer = setTimeout(() => {
      if (id !== generation.current) return;
      void checkpoint(latest.current, inputRef.current).catch(e => {
        setStatus("error"); setError("Автозбереження не підтверджене (" + code(e) + "). " + writeFailureAdvice(e));
      });
    }, 650);
    return () => clearTimeout(timer);
  }, [s, text, item]);

  function changeText(value: string) {
    inputRef.current = value; generation.current++;
    setText(value); setStatus("dirty"); setError(null);
  }
  function mark(e: ClinicEvent) {
    if (busy.current) return;
    try {
      const next = clinicReducer(latest.current, item, e);
      latest.current = next; setS(next); generation.current++; setStatus("dirty"); setError(null);
    } catch { setError("Цей крок зараз недоступний."); }
  }
  function handleError(e: unknown) {
    setStatus("error");
    setError("Збереження не підтверджене (" + code(e) + "). " + writeFailureAdvice(e));
  }
  async function advance(event: ClinicEvent, initialText = "") {
    if (busy.current) return;
    let next: ClinicSession;
    try { next = clinicReducer(latest.current, item, event); }
    catch (e) { setError(e instanceof ClinicError && e.code === "TOO_SHORT" ? "Напиши щонайменше 20 символів." : "Цей крок зараз недоступний."); return; }
    busy.current = true; setWorking(true); generation.current++; setError(null);
    try {
      await queue.current;
      await checkpoint(next, initialText);
      latest.current = next; setS(next); inputRef.current = initialText; setText(initialText);
    } catch (e) { handleError(e); }
    finally { busy.current = false; setWorking(false); }
  }
  async function persistFirst() {
    if (busy.current) return;
    let next: ClinicSession;
    let newState: LearnerState;
    try {
      const current = latest.current;
      next = clinicReducer(clinicReducer(current, item, { type: "DRAFT_SAVED" }), item, { type: "CONTINUE" });
      newState = snap.current.state;
      for (const ev of clinicEvidence(current, item, "draft")) newState = addDiagnostic(newState, ev);
    } catch (e) { setError("Не вдалося підготувати запис (" + code(e) + ")."); return; }
    busy.current = true; setWorking(true); generation.current++; setError(null); setStatus("saving");
    try {
      await queue.current;
      const payload = clinicPayload(next, "", item);
      const saved = await repository.commitClinicDraftEvidence(newState, payload, snap.current.revision, draftRevision.current);
      snap.current = saved.snapshot; draftRevision.current = saved.draft.revision;
      lastWritten.current = JSON.stringify(payload);
      onSaved(saved.snapshot);
      latest.current = next; setS(next); inputRef.current = ""; setText("");
      setStatus("saved");
    } catch (e) { handleError(e); }
    finally { busy.current = false; setWorking(false); }
  }
  async function finish() {
    if (busy.current) return;
    const exact = currentText();
    let next: ClinicSession;
    try { next = clinicReducer(latest.current, item, { type: "SUBMIT_TRANSFER", text: exact }); }
    catch { setError("Напиши щонайменше 20 символів."); return; }
    busy.current = true; setWorking(true); generation.current++; setError(null); setStatus("saving");
    try {
      await queue.current;
      await checkpoint(latest.current, exact);
      let state = snap.current.state;
      for (const ev of clinicEvidence(next, item, "final")) state = addDiagnostic(state, ev);
      const saved = await repository.finishClinicDraft(state, snap.current.revision, draftRevision.current, item.id, exact);
      snap.current = saved; onSaved(saved);
      draftRevision.current = 0; lastWritten.current = "";
      latest.current = next; setS(next); inputRef.current = ""; setText("");
      setStatus("saved");
    } catch (e) { handleError(e); }
    finally { busy.current = false; setWorking(false); }
  }
  async function pause() {
    if (busy.current) return;
    const exact = s.phase === "write" || s.phase === "rewrite" || s.phase === "transfer" ? currentText() : "";
    busy.current = true; setWorking(true); generation.current++; setError(null);
    try {
      await queue.current;
      if (!(s.phase === "write" && !exact && draftRevision.current === 0)) {
        await checkpoint(latest.current, exact);
        const saved = await repository.readClinicDraft();
        if (!saved || saved.revision !== draftRevision.current ||
            JSON.stringify(clinicPayload(saved.session, saved.input, item)) !== JSON.stringify(clinicPayload(latest.current, exact, item)))
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
      if (draftRevision.current > 0) await repository.discardClinicDraft(snap.current.revision, draftRevision.current);
      onExit();
    } catch (e) { handleError(e); }
    finally { busy.current = false; setWorking(false); }
  }

  const titles = { write: "Твій текст", selfcheck: "Перевір себе", spot: "Знайди проблеми в чужій чернетці", issues: "Що варто змінити",
    model: "Зразок", rewrite: "Перепиши свій текст", transfer: "Нова ситуація — без зразка", done: "Готово" };
  const textarea = (id: string, label: string) => (
    <>
      <label className="field" htmlFor={id}>{label}</label>
      <textarea id={id} className="answer" lang="fi" rows={7} maxLength={CLINIC_MAX_CHARS} disabled={working}
        value={text} onInput={e => { inputRef.current = e.currentTarget.value; }} onChange={e => changeText(e.target.value)} />
    </>
  );

  return (
    <section className="panel" data-accent="writing" aria-labelledby="cl-title">
      <Eyebrow accent="writing">Навчання · майстерня письма · <span lang="fi">{item.title_fi}</span></Eyebrow>
      <h1 id="cl-title" ref={heading} tabIndex={-1}>{titles[s.phase]}</h1>
      <ThresholdRoute steps={["Твій текст", "Розбір", "Переписування", "Нова ситуація"]}
        current={{ write: 0, selfcheck: 0, spot: 1, issues: 1, model: 1, rewrite: 2, transfer: 3, done: 4 }[s.phase]} accent="writing" />
      <TrustNote>Без автоматичної оцінки.</TrustNote>
      {initialDraft && s.phase !== "done" && <p className="feedback" role="status">Незавершену майстерню відновлено з перевіреної чернетки на цьому пристрої.</p>}
      {s.phase !== "done" && <p className="muted" role="status">
        {status === "saving" ? "Зберігаю…" : status === "saved" ? "Чернетку збережено на цьому пристрої." :
          status === "error" ? "Останнє збереження не підтверджено." : "Зміни зберігаються після короткої паузи. Для негайного запису натисни «Зберегти та вийти»."}
        Незавершена майстерня не входить до JSON-копії прогресу.
      </p>}
      {error && <p className="feedback error" role="alert">{error}</p>}

      {(s.phase === "write" || s.phase === "transfer") && (
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); if (s.phase === "write")
          void advance({ type: "SUBMIT_DRAFT", text: currentText() });
          else void finish(); }} noValidate>
          <div className="prompt" lang="fi">{v.prompt_fi}</div>
          {s.phase === "write" && <p>Що має бути в тексті: <span lang="fi">{v.required.join(" · ")}</span>.</p>}
          {textarea(s.phase === "write" ? "cl-draft" : "cl-transfer",
            s.phase === "write" ? "Твій текст фінською (зразок з'явиться пізніше)" : "Твій новий текст фінською (зразка й чернетки тут немає)")}
          <div className="actions"><button type="submit" className="btn" disabled={working}>{s.phase === "write" ? "Готово — перевірити себе" : working ? "Зберігаю…" : "Зберегти й завершити"}</button></div>
        </form>
      )}

      {s.phase === "selfcheck" && (
        <>
          <p>Твій текст (зафіксований):</p>
          <div className="prompt transcript" lang="fi">{v.ownDraft}</div>
          <fieldset className="choices-set" disabled={working}>
            <legend>Що з цього є у твоєму тексті? <span className="muted">(самоперевірка — не оцінка)</span></legend>
            {v.required.map((p, i) => (
              <label key={p} className="radio"><input type="checkbox" checked={v.checked.includes(i)}
                onChange={e => mark({ type: "SELF_CHECK", points: e.target.checked ? [...v.checked, i] : v.checked.filter(x => x !== i) })} /> <span lang="fi">{p}</span></label>
            ))}
          </fieldset>
          <div className="actions"><button type="button" className="btn" disabled={working} onClick={() => void persistFirst()}>
            {working ? "Зберігаю…" : "Зберегти чернетку й далі"}</button></div>
        </>
      )}

      {(s.phase === "spot" || s.phase === "issues") && (
        <>
          <p>{s.phase === "spot" ? "Це навмисно слабка чернетка іншої людини на те саме завдання. Познач речення, які ти б змінив(ла)." : item.feedback_uk}</p>
          <fieldset className="choices-set" disabled={working || s.phase === "issues"}>
            <legend>Чернетка</legend>
            {v.sentences.map((t, i) => {
              const issue = v.issues?.find(q => q.sentence === i);
              return (
                <div key={i}>
                  <label className="radio"><input type="checkbox" checked={v.marked.includes(i)}
                    onChange={e => mark({ type: "MARK", sentences: e.target.checked ? [...v.marked, i] : v.marked.filter(x => x !== i) })} /> <span lang="fi">{t}</span></label>
                  {issue && (
                    <p className="feedback warn">
                      <strong>{issue.found ? "Ти це помітив(ла)." : "Це варто змінити."}</strong> <span className="muted">({FOCUS_UK[issue.focus] ?? issue.focus})</span>{" "}
                      <span lang="fi"><span className="learning-cue">{issue.fragment_fi}</span></span> — {issue.why_uk}
                    </p>
                  )}
                </div>
              );
            })}
          </fieldset>
          {s.phase === "issues" && v.extraMarked.length > 0 && <p className="muted">Інші позначені речення редактор не виділяв — можливо, їх теж можна покращити; це не помилка.</p>}
          <div className="actions"><button type="button" className="btn" disabled={working} onClick={() => void advance({ type: "CONTINUE" })}>
            {s.phase === "spot" ? "Показати, що варто змінити" : "Далі: зразок"}</button></div>
        </>
      )}

      {s.phase === "model" && v.model && (
        <>
          <div className="prompt transcript" lang="fi">{v.model.text_fi}</div>
          <p className="muted">{v.model.note_uk}</p>
          <h2>Твій текст</h2>
          <div className="prompt transcript" lang="fi">{v.ownDraft}</div>
          <div className="actions"><button type="button" className="btn" disabled={working}
            onClick={() => void advance({ type: "CONTINUE" }, v.ownDraft ?? "")}>Переписати свій текст</button></div>
        </>
      )}

      {s.phase === "rewrite" && (
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); void advance({ type: "SUBMIT_REWRITE", text: currentText() }); }} noValidate>
          <details className="why"><summary>Показати зразок ще раз</summary><div className="transcript" lang="fi">{v.model?.text_fi}</div></details>
          <ul>{v.selfCheck_uk.map(q => <li key={q}>{q}</li>)}</ul>
          {textarea("cl-rewrite", "Твій переписаний текст (не копіюй зразок — покращ свій)")}
          <div className="actions"><button type="submit" className="btn" disabled={working}>Далі: нова ситуація</button></div>
        </form>
      )}

      {s.phase !== "done" && (
        <div className="actions">
          <button type="button" className="btn secondary" disabled={working} onClick={() => void pause()}>Зберегти та вийти</button>
          <button type="button" className="btn secondary" disabled={working} onClick={() => void discard()}>Відкинути незавершену чернетку</button>
        </div>
      )}

      {s.phase === "done" && v.diff && (
        <div role="status">
          <h2>Що ти змінив(ла)</h2>
          <p className="prompt transcript diff" lang="fi">
            {v.diff.map((p, i) => p.kind === "same" ? <span key={i}>{p.text} </span>
              : p.kind === "added" ? <ins key={i}>{p.text}</ins> : <del key={i}>{p.text}</del>)}
          </p>
          <p className="muted">{v.diff.some(p => p.kind !== "same") ? "Підкреслене — додано, закреслене — прибрано." : "Ти не змінив(ла) текст."} Переписаний текст — керована спроба (після зразка); новий текст — самостійний. Усе збережено без оцінки.</p>
          <div className="actions"><button type="button" className="btn" onClick={onExit}>До списку завдань</button></div>
        </div>
      )}
    </section>
  );
}
