import { useEffect, useRef, useState, type FormEvent } from "react";
import { addDiagnostic, pictureEvidence, pictureReducer, pictureView, startPicture, PICTURE_MAX_CHARS,
  type LearnerState, type PictureSession } from "@hospodar/domain";
import { pictureMissions } from "../content/pictureMissions.ts";
import type { LearnerRepository } from "../storage/learnerRepository.ts";

type Snap = { state: LearnerState; revision: number };
type Mission = (typeof pictureMissions)[number];

export function PictureMissionScreen({ repository, snapshot, onSaved, onHome }: { repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void; onHome: () => void }) {
  const [m, setM] = useState<Mission | null>(null);
  if (m) return <PictureMission key={m.lesson.lesson_id} m={m} repository={repository} snapshot={snapshot} onSaved={onSaved} onExit={() => setM(null)} />;
  const done = new Set(snapshot.state.diagnostics.map(d => d.taskId));
  return (
    <section className="panel" aria-labelledby="pm-title">
      <p className="eyebrow">Навчання · фото-місії</p>
      <h1 id="pm-title">Фото-місії</h1>
      <p>Спершу сам(а) описуєш фото фінською. Потім бачиш приклади й український переклад. Наостанок — нова ситуація без фото й перекладу.</p>
      <p className="draft-note">Чернетки: ще не перевірено S2-викладачем. Відповіді не оцінюються автоматично.</p>
      <ul className="choices" aria-label="Фото-місії">
        {pictureMissions.map(x => (
          <li key={x.lesson.lesson_id}><button type="button" className="choice" onClick={() => setM(x)}>
            <span>{x.picture.alt_uk}</span>
            <small>{x.lesson.level} · {done.has(`${x.lesson.lesson_id}-transfer`) ? "уже пройдено" : "фото → нова ситуація"}</small>
          </button></li>
        ))}
      </ul>
      <div className="actions"><button type="button" className="btn secondary" onClick={onHome}>На головну</button></div>
    </section>
  );
}

function PictureMission({ m, repository, snapshot, onSaved, onExit }: { m: Mission; repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void; onExit: () => void }) {
  const { lesson, picture } = m;
  const [s, setS] = useState<PictureSession>(() => startPicture(lesson));
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"idle" | "saving" | { error: string }>("idle");
  const heading = useRef<HTMLHeadingElement>(null);
  const v = pictureView(s, lesson);
  useEffect(() => { heading.current?.focus(); }, [s.phase]);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    let next: PictureSession;
    try { next = pictureReducer(s, lesson, s.phase === "look" ? { type: "SUBMIT_FIRST", text } : { type: "SUBMIT_TRANSFER", text }); setError(null); }
    catch { setError("Спершу напиши відповідь фінською."); return; }
    if (next.phase !== "done") { setS(next); setText(""); return; }
    setSaving("saving");
    try {
      let st = snapshot.state;
      for (const ev of pictureEvidence(next, lesson)) st = addDiagnostic(st, ev);
      onSaved(await repository.commit(st, snapshot.revision));
      setS(next); setText(""); setSaving("idle");                       // done only after the commit
    } catch (err) { setSaving({ error: String((err as { code?: string })?.code ?? "SAVE_FAILED") }); }
  };
  const title = { look: "Що на фото?", support: "Приклади й переклад", transfer: "Нова ситуація — без фото", done: "Готово" }[s.phase];
  return (
    <section className="panel" aria-labelledby="pmm-title">
      <p className="eyebrow">Навчання · фото-місія · {lesson.level}</p>
      <h1 id="pmm-title" ref={heading} tabIndex={-1}>{title}</h1>
      <p className="draft-note">Чернетка: ще не перевірено S2-викладачем.</p>
      {v.showPicture && (
        <figure className="media-card picture-figure">
          <img src={picture.url} alt={picture.alt_fi} lang="fi" width={picture.width} height={picture.height} className="media-img" />
          <figcaption className="credit">{picture.credit.credit} · {picture.credit.licenceUrl
            ? <a href={picture.credit.licenceUrl} target="_blank" rel="noopener noreferrer">{picture.credit.licence}</a> : picture.credit.licence}
            {picture.credit.source && <> · <a href={picture.credit.source} target="_blank" rel="noopener noreferrer">джерело</a></>}</figcaption>
        </figure>
      )}
      {(s.phase === "look" || s.phase === "transfer") && (
        <form onSubmit={e => void submit(e)} noValidate>
          <p className="prompt" lang="fi">{v.prompt_fi}</p>
          <label className="field" htmlFor="pm-text">{s.phase === "look" ? "Твоя відповідь фінською (без підказок)" : "Твоя відповідь фінською (без фото й перекладу; без оцінки)"}</label>
          <textarea id="pm-text" className="answer" lang="fi" rows={3} maxLength={PICTURE_MAX_CHARS} value={text} onChange={e => setText(e.target.value)} />
          {error && <p className="feedback error" role="alert">{error}</p>}
          {typeof saving === "object" && <p className="feedback error" role="alert">НЕ збережено ({saving.error}). Текст лишився тут — спробуй ще раз.</p>}
          <div className="actions"><button type="submit" className="btn" disabled={saving === "saving"}>{s.phase === "look" ? "Готово" : saving === "saving" ? "Зберігаю…" : "Зберегти й завершити"}</button></div>
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
          <div className="actions"><button type="button" className="btn" onClick={() => setS(pictureReducer(s, lesson, { type: "CONTINUE" }))}>Далі: нова ситуація</button></div>
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
