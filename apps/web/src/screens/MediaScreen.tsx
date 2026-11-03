import { useState, type FormEvent, type ReactNode } from "react";
import { addDiagnostic, type LearnerState, type Skill } from "@hospodar/domain";
import { externalLinks, illustrations, librivoxWorks, openRecordings, pictures, segmentsOf, sourceTitle, videos, type Credit } from "../content/media.ts";
import type { LearnerRepository } from "../storage/learnerRepository.ts";

type Snap = { state: LearnerState; revision: number };
type Tab = "voices" | "video" | "pictures" | "illustrations" | "links";
const TABS: [Tab, string][] = [["voices", "Живі голоси"], ["video", "Відео"], ["pictures", "Фото-ситуації"], ["illustrations", "Ілюстрації"], ["links", "Зовнішні джерела"]];
const TOPIC_UK: Record<string, string> = { dialects: "діалект", travel_social: "розмова в місті", services_travel_time: "числа й час", culture_society: "суспільство й культура",
  interaction: "взаємодія", speaking_repair: "перепитування", communication: "спілкування" };
const PICTURE_PROMPT_FI = "Kuvaile kuvaa: Missä paikka on? Mitä siellä voi tehdä? Mitä sinä tekisit siellä?";

/** Licensed repo media. Every item: learner-started playback, visible credit + licence + source; notes saved ungraded. */
export function MediaScreen({ repository, snapshot, onSaved, onHome }: { repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void; onHome: () => void }) {
  const [tab, setTab] = useState<Tab>("voices");
  const note = (taskId: string, skill: Skill, label: string, prompt?: string) =>
    <NoteForm key={taskId} taskId={taskId} skill={skill} label={label} prompt={prompt} repository={repository} snapshot={snapshot} onSaved={onSaved} />;
  return (
    <section className="panel" aria-labelledby="md-title">
      <p className="eyebrow">Навчання · медіатека</p>
      <h1 id="md-title">Медіатека</h1>
      <p>Лише матеріали з перевіреними правами: автор і ліцензія вказані біля кожного. Нічого не вмикається само — ти запускаєш відтворення.</p>
      <p className="draft-note">Ще не перевірено S2-викладачем. Нотатки зберігаються без оцінки.</p>
      <div className="tabs media-tabs" role="tablist" aria-label="Тип матеріалу">
        {TABS.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} className="tab" onClick={() => setTab(id)}>{label}</button>)}
      </div>
      <div role="tabpanel">
        {tab === "voices" && (
          <>
            <h2>Один текст — різні голоси</h2>
            <p className="muted">Читання художніх текстів людьми (LibriVox, суспільне надбання). Літературна мова — не розмовна B1. Частини розрізано на паузах читця; після кожної частини можна зупинитися.</p>
            {librivoxWorks.map(w => (
              <article key={w.work} className="media-card">
                <h3 lang="fi">{w.work} <span className="muted">· {w.writer}</span></h3>
                {w.narrators.length > 1 && <p>Той самий текст читають {w.narrators.length} різні голоси — порівняй, як звучать ті самі слова.</p>}
                {w.narrators.map(n => (
                  <details key={n.narrator} className="why">
                    <summary>Читає {n.narrator} · {n.parts.length} частин</summary>
                    <ol className="parts">{n.parts.map(p => (
                      <li key={p.id}><Player kind="audio" src={p.url} label={`Частина ${p.path.match(/part-(\d+)/)?.[1] ?? ""}`} /></li>
                    ))}</ol>
                    <CreditLine c={n.parts[0]!.credit} />
                  </details>
                ))}
                {note(`media-${w.narrators[0]!.parts[0]!.id}`, "listening", "Про що текст? Своїми словами (фінською, без оцінки)", w.questions.find(q => q.kind === "gist")?.prompt_fi)}
              </article>
            ))}
            <h2>Відкриті записи</h2>
            <ul className="media-grid">
              {openRecordings.map(r => {
                const parts = segmentsOf(r.path);
                return (
                  <li key={r.id} className="media-card">
                    <h3 lang="fi">{sourceTitle(r.credit.source, r.id)}</h3>
                    <p className="muted">{TOPIC_UK[r.topic ?? ""] ?? r.topic}{r.level ? ` · орієнтовно ${r.level}` : ""}</p>
                    <Player kind="audio" src={r.url} label="Увесь запис" />
                    {parts.length > 0 && (
                      <details className="why"><summary>Слухати частинами ({parts.length})</summary>
                        <p className="muted">Межі частин нарізано за часом і ще не перевірено за змістом.</p>
                        <ol className="parts">{parts.map((p, i) => <li key={p.id}><Player kind="audio" src={p.url} label={`Частина ${i + 1}`} /></li>)}</ol>
                      </details>
                    )}
                    <CreditLine c={r.credit} />
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {tab === "video" && (
          <ul className="media-grid">
            {videos.map(v => (
              <li key={v.id} className="media-card">
                <h3 lang="fi">{sourceTitle(v.credit.source, v.id)}</h3>
                <p className="muted">{Math.round(v.duration_seconds / 6) / 10} хв · без субтитрів (не заявлено джерелом)</p>
                <Player kind="video" src={v.url} label={`Відео: ${sourceTitle(v.credit.source, v.id)}`} />
                <CreditLine c={v.credit} />
                {note(`media-${v.id}`, "listening", "Що ти зрозумів(ла)? (фінською, без оцінки)")}
              </li>
            ))}
          </ul>
        )}

        {tab === "pictures" && (
          <ul className="media-grid">
            {pictures.map(p => (
              <li key={p.id} className="media-card">
                <img src={p.url} alt={p.alt_fi} lang="fi" width={p.width} height={p.height} loading="lazy" className="media-img" />
                <p className="prompt" lang="fi">{PICTURE_PROMPT_FI}</p>
                <CreditLine c={p.credit} />
                {note(`media-${p.id}`, "writing", "Твій опис (3–5 речень фінською, без оцінки)")}
              </li>
            ))}
          </ul>
        )}

        {tab === "illustrations" && (
          <ul className="media-grid">
            {illustrations.map(i => (
              <li key={i.id} className="media-card">
                <img src={i.url} alt={i.alt_uk} width={240} height={240} className="media-img media-svg" />
                <p lang="fi">{i.alt_fi}</p>
                <CreditLine c={i.credit} />
              </li>
            ))}
          </ul>
        )}

        {tab === "links" && (
          <>
            <p>Відео на YouTube відкриваються на сайті автора. Застосунок їх не завантажує, не копіює й не вбудовує.</p>
            <ul className="media-grid">
              {externalLinks.map(l => (
                <li key={l.id} className="media-card">
                  <h3 lang="fi">{l.title}</h3>
                  <p className="muted">{l.creator}{l.cefr_estimate ? ` · орієнтовно ${l.cefr_estimate} (оцінка редакції)` : ""}</p>
                  {l.original_question_seeds?.length ? (
                    <><p>Питання до перегляду (чернетки):</p><ul lang="fi">{l.original_question_seeds.map(q => <li key={q.id}>{q.prompt_fi}</li>)}</ul></>
                  ) : null}
                  <p><a className="btn secondary" href={l.url} target="_blank" rel="noopener noreferrer">Відкрити на {l.host} ↗</a></p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <div className="actions"><button type="button" className="btn secondary" onClick={onHome}>На головну</button></div>
    </section>
  );
}

function Player({ kind, src, label }: { kind: "audio" | "video"; src: string; label: string }) {
  return kind === "audio"
    ? <figure className="player"><figcaption>{label}</figcaption><audio controls preload="none" src={src} aria-label={label} /></figure>
    : <video className="media-video" controls preload="none" src={src} aria-label={label} />;
}

function CreditLine({ c }: { c: Credit }): ReactNode {
  return (
    <p className="credit">
      {c.credit} · {c.licenceUrl ? <a href={c.licenceUrl} target="_blank" rel="noopener noreferrer">{c.licence}</a> : c.licence}
      {c.source && <> · <a href={c.source} target="_blank" rel="noopener noreferrer">джерело</a></>}
    </p>
  );
}

function NoteForm({ taskId, skill, label, prompt, repository, snapshot, onSaved }: {
  taskId: string; skill: Skill; label: string; prompt?: string; repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void;
}) {
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | { error: string }>("idle");
  const id = `note-${taskId}`;
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) { setState({ error: "EMPTY" }); return; }
    setState("saving");
    try {
      onSaved(await repository.commit(addDiagnostic(snapshot.state, { skill, taskId, status: "ungraded", response: `[media note] ${text.trim()}` }), snapshot.revision));
      setState("saved"); setText("");
    } catch (err) { setState({ error: String((err as { code?: string })?.code ?? "SAVE_FAILED") }); }
  }
  return (
    <form onSubmit={e => void submit(e)} noValidate className="note-form">
      {prompt && <p lang="fi" className="muted">{prompt}</p>}
      <label className="field" htmlFor={id}>{label}</label>
      <textarea id={id} className="answer" lang="fi" rows={3} maxLength={1200} value={text} onChange={e => { setText(e.target.value); if (state !== "saving") setState("idle"); }} />
      {typeof state === "object" && <p className="feedback error" role="alert">{state.error === "EMPTY" ? "Спершу напиши нотатку." : `НЕ збережено (${state.error}). Текст лишився тут.`}</p>}
      {state === "saved" && <p className="feedback" role="status">Збережено без оцінки.</p>}
      <div className="actions"><button type="submit" className="btn secondary" disabled={state === "saving"}>{state === "saving" ? "Зберігаю…" : "Зберегти нотатку"}</button></div>
    </form>
  );
}
