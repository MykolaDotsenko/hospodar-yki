import { useEffect, useRef, useState, type FormEvent } from "react";
import { addDiagnostic, pictureEvidence, pictureReducer, pictureView, startPicture, PICTURE_MAX_CHARS,
  type LearnerState, type PictureSession, type PictureEvent } from "@hospodar/domain";
import { pictureMissions } from "../content/pictureMissions.ts";
import { picturePayload, validPictureDraft } from "../storage/pictureDraft.ts";
import type { LearnerRepository, PictureDraftRow } from "../storage/learnerRepository.ts";

type Snap = { state: LearnerState; revision: number };
type Mission = (typeof pictureMissions)[number];
type Loaded = { kind: "loading" } | { kind: "ready"; draft: PictureDraftRow | null; blocked: string | null };
const code = (e: unknown) => String((e as { code?: string })?.code ?? "SAVE_FAILED");

export function PictureMissionScreen({ repository, snapshot, onSaved, onHome }: { repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void; onHome: () => void }) {
  const [selected, setSelected] = useState<Mission | null>(null);
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [discarding, setDiscarding] = useState(false);
  useEffect(() => {
    let active = true;
    void repository.readPictureDraft().then(row => {
      if (!active) return;
      const mission = pictureMissions.find(x => x.lesson.lesson_id === row?.session?.lessonId);
      const blocked = row && (!mission || !validPictureDraft({
        session: row.session, input: row.input, contentFingerprint: row.contentFingerprint,
      }, mission) || row.learnerRevision !== snapshot.revision)
        ? "Незавершена фото-місія несумісна з поточним матеріалом або прогресом. Зразки й переклад приховано; чернетку не перезаписано." : null;
      if (row && !blocked && mission) setSelected(mission);
      setLoaded({ kind: "ready", draft: row, blocked });
    }).catch(e => {
      if (active) {
        setLoadError(code(e));
        setLoaded({ kind: "ready", draft: null, blocked: "Не вдалося прочитати чернетку фото-місії. Нічого не перезаписано." });
      }
    });
    return () => { active = false; };
  }, [repository, snapshot.revision]);

  async function discardBlocked() {
    if (loaded.kind !== "ready" || !loaded.draft || discarding) return;
    setDiscarding(true); setLoadError(null);
    try {
      await repository.discardPictureDraft(snapshot.revision, loaded.draft.revision);
      setLoaded({ kind: "ready", draft: null, blocked: null }); setSelected(null);
    } catch (e) { setLoadError(code(e)); }
    finally { setDiscarding(false); }
  }

  if (loaded.kind === "loading") return <section className="panel" role="status">Перевіряю незавершену фото-місію…</section>;
  if (loaded.blocked) return (
    <section className="panel" aria-labelledby="pm-blocked">
      <h1 id="pm-blocked">Чернетка фото-місії потребує уваги</h1>
      <p className="feedback warn" role="alert">{loaded.blocked}</p>
      {loadError && <p className="feedback error" role="alert">Не вдалося відкинути чернетку ({loadError}). Нічого не перезаписано.</p>}
      <div className="actions">
        {loaded.draft && <button type="button" className="btn danger" disabled={discarding || loaded.draft.learnerRevision !== snapshot.revision}
          onClick={() => void discardBlocked()}>Відкинути несумісну чернетку</button>}
        <button type="button" className="btn secondary" onClick={onHome}>На головну</button>
      </div>
      {loaded.draft?.learnerRevision !== snapshot.revision && <p className="muted">Онови сторінку: зміни іншої вкладки не можна перезаписувати.</p>}
    </section>
  );

  const resume = loaded.draft ? pictureMissions.find(x => x.lesson.lesson_id === loaded.draft?.session.lessonId) ?? null : null;
  const m = resume ?? selected;
  const clear = () => { setSelected(null); setLoaded({ kind: "ready", draft: null, blocked: null }); };
  if (m) return <PictureMission key={m.lesson.lesson_id} m={m} repository={repository} snapshot={snapshot}
    initialDraft={resume ? loaded.draft : null} onSaved={onSaved} onExit={clear} onHome={onHome} />;
  const done = new Set(snapshot.state.diagnostics.map(d => d.taskId));
  return (
    <section className="panel" aria-labelledby="pm-title">
      <p className="eyebrow">Навчання · фото-місії</p>
      <h1 id="pm-title">Фото-місії</h1>
      <p>Спершу сам(а) описуєш фото фінською. Потім бачиш приклади й український переклад. Наостанок — нова ситуація без фото й перекладу.</p>
      <p className="draft-note">Чернетки: ще не перевірено S2-викладачем. Відповіді не оцінюються автоматично.</p>
      <ul className="choices" aria-label="Фото-місії">
        {pictureMissions.map(x => (
          <li key={x.lesson.lesson_id}><button type="button" className="choice" onClick={() => setSelected(x)}>
            <span>{x.picture.alt_uk}</span>
            <small>{x.lesson.level} · {done.has(`${x.lesson.lesson_id}-transfer`) ? "уже пройдено" : "фото → нова ситуація"}</small>
          </button></li>
        ))}
      </ul>
      <div className="actions"><button type="button" className="btn secondary" onClick={onHome}>На головну</button></div>
    </section>
  );
}

function PictureMission({ m, repository, snapshot, initialDraft, onSaved, onExit, onHome }: {
  m: Mission; repository: LearnerRepository; snapshot: Snap; initialDraft: PictureDraftRow | null;
  onSaved: (s: Snap) => void; onExit: () => void; onHome: () => void;
}) {
  const { lesson, picture } = m;
  const [s, setS] = useState<PictureSession>(() => initialDraft?.session ?? startPicture(lesson));
  const latest = useRef(s); latest.current = s;
  const snap = useRef(snapshot); snap.current = snapshot;
  const [text, setText] = useState(initialDraft?.input ?? "");
  const inputRef = useRef(initialDraft?.input ?? "");
  const draftRevision = useRef(initialDraft?.revision ?? 0);
  const lastWritten = useRef(initialDraft ? JSON.stringify(picturePayload(initialDraft.session, initialDraft.input, m)) : "");
  const queue = useRef<Promise<void>>(Promise.resolve());
  const generation = useRef(0);
  const busy = useRef(false);
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState<"idle" | "dirty" | "saving" | "saved" | "error">(initialDraft ? "saved" : "idle");
  const [error, setError] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const v = pictureView(s, lesson);
  useEffect(() => { heading.current?.focus(); }, [s.phase]);

  function checkpoint(state: PictureSession, input: string): Promise<void> {
    const payload = picturePayload(state, input, m);
    if (!validPictureDraft(payload, m)) return Promise.reject(new Error("INVALID_DRAFT"));
    const signature = JSON.stringify(payload);
    const next = queue.current.then(async () => {
      if (signature === lastWritten.current) return;
      setStatus("saving");
      const row = await repository.savePictureDraft(payload, snap.current.revision, draftRevision.current);
      draftRevision.current = row.revision;
      lastWritten.current = signature;
      setStatus("saved");
    });
    queue.current = next.catch(() => {});
    return next;
  }
  useEffect(() => {
    if (busy.current || s.phase === "done" || (s.phase === "look" && !text && draftRevision.current === 0)) return;
    const current = generation.current;
    const timer = setTimeout(() => {
      if (current !== generation.current) return;
      void checkpoint(latest.current, inputRef.current).catch(e => {
        setStatus("error");
        setError("Автозбереження не вдалося (" + code(e) + "). Відповідь лишилася на екрані.");
      });
    }, 650);
    return () => clearTimeout(timer);
  }, [s, text, m]);

  function changeText(value: string) {
    inputRef.current = value; generation.current++;
    setText(value); setStatus("dirty"); setError(null);
  }
  function failed(e: unknown) {
    setStatus("error");
    setError("НЕ збережено (" + code(e) + "). Відповідь лишилася тут. Перевір іншу вкладку або повтори.");
  }
  async function nextStage(event: PictureEvent) {
    if (busy.current) return;
    let next: PictureSession;
    try { next = pictureReducer(latest.current, lesson, event); }
    catch { setError("Спершу напиши відповідь фінською."); return; }
    busy.current = true; setWorking(true); generation.current++; setError(null);
    try {
      await queue.current;
      // The support/model cannot become visible before first attempt is durable.
      await checkpoint(next, "");
      latest.current = next; setS(next); inputRef.current = ""; setText("");
    } catch (e) { failed(e); }
    finally { busy.current = false; setWorking(false); }
  }
  async function finish() {
    if (busy.current) return;
    const exact = inputRef.current;
    let completed: PictureSession;
    try { completed = pictureReducer(latest.current, lesson, { type: "SUBMIT_TRANSFER", text: exact }); }
    catch { setError("Спершу напиши відповідь фінською."); return; }
    busy.current = true; setWorking(true); generation.current++; setError(null);
    try {
      await queue.current;
      await checkpoint(latest.current, exact);
      let nextState = snap.current.state;
      for (const ev of pictureEvidence(completed, lesson)) nextState = addDiagnostic(nextState, ev);
      const saved = await repository.finishPictureDraft(nextState, snap.current.revision, draftRevision.current, lesson.lesson_id, exact);
      snap.current = saved; onSaved(saved);
      draftRevision.current = 0; lastWritten.current = "";
      latest.current = completed; setS(completed); inputRef.current = ""; setText(""); setStatus("saved");
    } catch (e) { failed(e); }
    finally { busy.current = false; setWorking(false); }
  }
  async function pause() {
    if (busy.current) return;
    const exact = s.phase === "look" || s.phase === "transfer" ? inputRef.current : "";
    busy.current = true; setWorking(true); generation.current++; setError(null);
    try {
      await queue.current;
      if (exact || draftRevision.current > 0) {
        await checkpoint(latest.current, exact);
        const back = await repository.readPictureDraft();
        if (!back || back.revision !== draftRevision.current ||
            JSON.stringify(picturePayload(back.session, back.input, m)) !== JSON.stringify(picturePayload(latest.current, exact, m)))
          throw new Error("READBACK_MISMATCH");
      }
      onHome();
    } catch (e) { failed(e); }
    finally { busy.current = false; setWorking(false); }
  }
  async function discard() {
    if (busy.current) return;
    busy.current = true; setWorking(true); generation.current++; setError(null);
    try {
      await queue.current;
      if (draftRevision.current > 0) await repository.discardPictureDraft(snap.current.revision, draftRevision.current);
      onExit();
    } catch (e) { failed(e); }
    finally { busy.current = false; setWorking(false); }
  }
  const title = { look: "Що на фото?", support: "Приклади й переклад", transfer: "Нова ситуація — без фото", done: "Готово" }[s.phase];
  return (
    <section className="panel" aria-labelledby="pmm-title">
      <p className="eyebrow">Навчання · фото-місія · {lesson.level}</p>
      <h1 id="pmm-title" ref={heading} tabIndex={-1}>{title}</h1>
      <p className="draft-note">Чернетка: ще не перевірено S2-викладачем.</p>
      {initialDraft && s.phase !== "done" && <p className="feedback" role="status">Незавершену фото-місію відновлено з цього пристрою.</p>}
      {v.showPicture && (
        <figure className="media-card picture-figure">
          <img src={picture.url} alt={picture.alt_fi} lang="fi" width={picture.width} height={picture.height} className="media-img" />
          <figcaption className="credit">{picture.credit.credit} · {picture.credit.licenceUrl
            ? <a href={picture.credit.licenceUrl} target="_blank" rel="noopener noreferrer">{picture.credit.licence}</a> : picture.credit.licence}
            {picture.credit.source && <> · <a href={picture.credit.source} target="_blank" rel="noopener noreferrer">джерело</a></>}</figcaption>
        </figure>
      )}
      {(s.phase === "look" || s.phase === "transfer") && (
        <form onSubmit={e => { e.preventDefault(); if (s.phase === "look") void nextStage({ type: "SUBMIT_FIRST", text: inputRef.current }); else void finish(); }} noValidate>
          <p className="prompt" lang="fi">{v.prompt_fi}</p>
          <label className="field" htmlFor="pm-text">{s.phase === "look" ? "Твоя відповідь фінською (без підказок)" : "Твоя відповідь фінською (без фото й перекладу; без оцінки)"}</label>
          <textarea id="pm-text" className="answer" lang="fi" rows={3} maxLength={PICTURE_MAX_CHARS} disabled={working}
            value={text} onChange={e => changeText(e.target.value)} />
          <div className="actions"><button type="submit" className="btn" disabled={working}>{working ? "Зберігаю…" : s.phase === "look" ? "Готово" : "Зберегти й завершити"}</button></div>
        </form>
      )}
      {s.phase === "support" && v.models_fi && (
        <>
          <p><strong>Твоя відповідь:</strong> <span lang="fi">{v.first}</span></p>
          <div className="feedback">
            <p><strong>Як можна сказати:</strong></p>
            <ul lang="fi">{v.models_fi.map(x => <li key={x}>{x}</li>)}</ul>
            <p><strong>Переклад (лише на цьому кроці):</strong> {picture.alt_uk}</p>
          </div>
          <p className="muted">Це приклади, не єдина правильна відповідь. Далі буде нова ситуація — без фото й перекладу.</p>
          <div className="actions"><button type="button" className="btn" disabled={working}
            onClick={() => void nextStage({ type: "CONTINUE" })}>Далі: нова ситуація</button></div>
        </>
      )}
      {s.phase !== "done" && (
        <>
          {error && <p className="feedback error" role="alert">{error}</p>}
          <p className="muted" role="status">{status === "dirty" ? "Є незбережені зміни." : status === "saving" ? "Зберігаю локально…" :
            status === "saved" ? "Чернетка збережена на цьому пристрої." : status === "error" ? "Чернетку не підтверджено." :
            "Збереження почнеться після першої відповіді."}</p>
          <div className="actions">
            <button type="button" className="btn secondary" disabled={working} onClick={() => void pause()}>Зберегти та вийти</button>
            <button type="button" className="btn danger" disabled={working} onClick={() => void discard()}>Відкинути чернетку</button>
          </div>
        </>
      )}
      {s.phase === "done" && (
        <div className="feedback" role="status">
          <p>✅ Збережено на цьому пристрої без оцінки: перша спроба й відповідь у новій ситуації.</p>
          <div className="actions"><button type="button" className="btn" onClick={onExit}>До списку фото-місій</button></div>
        </div>
      )}
    </section>
  );
}
