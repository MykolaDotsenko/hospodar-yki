import { useEffect, useMemo, useRef, useState } from "react";
import { createActor, type SnapshotFrom } from "xstate";
import { remainingSeconds, scoreSession, PRACTICE_LIMITS_MINUTES, type ExamItem, type ExamSkill } from "@hospodar/domain";
import { createExamMachine } from "../exam/examMachine.ts";
import { audioUrlFor, examBlueprints, examContentVersion, itemsFor } from "../content/exam.ts";
import type { ExamHistoryRecord, ExamRepository } from "../storage/examRepository.ts";

/** EXAM practice rehearsal UI. Neutral, Finnish instructions, no learning cues, hints or feedback before a durable finish. */
const SKILL_FI: Record<ExamItem["skill"], string> = { reading: "Tekstin ymmärtäminen", listening: "Puheen ymmärtäminen", writing: "Kirjoittaminen", speaking: "Puhuminen" };
const SKILL_UK: Record<ExamItem["skill"], string> = { reading: "Читання", listening: "Аудіювання", writing: "Письмо", speaking: "Говоріння" };
const newId = () => "sess-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
type Machine = ReturnType<typeof createExamMachine>;

export function ExamScreen({ repository, onHome }: { repository: ExamRepository; onHome: () => void }) {
  const actor = useMemo(() => createActor(createExamMachine(repository, itemsFor, examBlueprints.map(b => b.id), examContentVersion)), [repository]);
  const [snap, setSnap] = useState<SnapshotFrom<Machine>>(() => actor.getSnapshot());
  useEffect(() => { const sub = actor.subscribe(setSnap); actor.start(); return () => { sub.unsubscribe(); actor.stop(); }; }, [actor]);
  const { session, items, error } = snap.context;
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [snap.value, session?.index]);
  const [, force] = useState(0);
  useEffect(() => {                                                       // practice clock: observe elapsed time once per second
    if (!snap.matches("active") || !session?.timeLimitMinutes) return;
    const t = setInterval(() => { actor.send({ type: "TICK", now: Date.now(), elapsedMs: Date.now() - Date.parse(session.startedAt) }); force(x => x + 1); }, 1000);
    return () => clearInterval(t);
  }, [actor, snap, session]);
  useEffect(() => {                                                       // draft autosave: 1.2 s after the last keystroke, never blocks typing
    if (!snap.context.dirty || !snap.matches("active")) return;
    const t = setTimeout(() => actor.send({ type: "AUTOSAVE" }), 1200);
    return () => clearTimeout(t);
  }, [actor, snap]);
  const busy = snap.matches("saving") || snap.matches("finishing") || snap.matches("clearing") || snap.matches("loading");
  const navBusy = busy || snap.matches("autosaving");

  if (snap.matches("loading")) return <section className="panel exam" aria-busy="true"><p>Ladataan…</p></section>;
  if (snap.matches("setup")) return <ExamSetup error={error} repository={repository} onStart={(blueprintId, minutes, skills) => actor.send({ type: "START", blueprintId, minutes, skills, now: Date.now(), sessionId: newId() })} onHome={onHome} />;

  if (snap.matches("finished") || snap.matches("clearing")) {
    const r = scoreSession(items, session!);
    return (
      <section className="panel exam" aria-labelledby="ex-res">
        <p className="eyebrow">02 · Симуляція YKI · harjoituskoe</p>
        <h1 id="ex-res" ref={heading} tabIndex={-1}>Tulokset · Результати</h1>
        <p className="qualification">Лише точність завдань із ключем. Письмо й говоріння не оцінюються автоматично. Це не офіційний YKI і не прогноз рівня.</p>
        <ul className="skill-lines">
          {(Object.keys(r.bySkill) as ExamItem["skill"][]).map(k => {
            const b = r.bySkill[k];
            return <li key={k}><strong>{SKILL_UK[k]}</strong> <span lang="fi" className="muted">· {SKILL_FI[k]}</span><br />
              {b.objective ? `${b.correct} з ${b.objective} із ключем правильні` : ""}{b.ungraded ? `${b.objective ? "; " : ""}${b.ungraded} без оцінки` : ""}{b.unanswered ? `${b.objective || b.ungraded ? "; " : ""}${b.unanswered} без відповіді` : ""}{!b.objective && !b.ungraded && !b.unanswered ? "—" : ""}</li>;
          })}
        </ul>
        <h2>Відповіді по завданнях</h2>
        <ol className="skill-lines">
          {r.details.map(d => {
            const it = items.find(x => x.id === d.id)!;
            const key = it.options && d.correct !== undefined ? (it.kind === "boolean" ? (d.correct === "true" ? "Oikein" : "Väärin") : it.options[Number(d.correct)]) : null;
            return <li key={d.id}><span lang="fi">{it.prompt}</span><br />
              <strong>{{ correct: "Правильно", incorrect: "Неправильно", ungraded: "Без оцінки", unanswered: "Без відповіді" }[d.status]}</strong>
              {key && <> · ключ: <span lang="fi">{key}</span></>}</li>;
          })}
        </ol>
        {error && <p className="feedback error" role="alert">Не вдалося очистити ({error}).</p>}
        <div className="actions">
          <button type="button" className="btn" disabled={busy} onClick={() => actor.send({ type: "NEW_REHEARSAL" })}>Нова репетиція</button>
          <button type="button" className="btn secondary" onClick={onHome}>На головну</button>
        </div>
      </section>
    );
  }

  const item = items[session!.index]!;
  const answer = session!.answers[item.id] ?? "";
  const left = remainingSeconds(session!, new Date());
  const go = (index: number) => actor.send({ type: "GOTO", index, now: Date.now() });
  const set = (value: string) => actor.send({ type: "ANSWER", itemId: item.id, value, now: Date.now() });
  const unanswered = items.filter(x => !(session!.answers[x.id] ?? "").trim()).length;
  return (
    <section className="panel exam" aria-labelledby="ex-item">
      <div className="exam-bar">
        <span className="pill">{snap.context.skills ? `Osakoeharjoitus: ${snap.context.skills.map(k => SKILL_FI[k]).join(", ")}` : "Harjoituskoe"} · epävirallinen</span>
        <span aria-live="polite">Tehtävä {session!.index + 1} / {items.length}</span>
        {left !== null && <span className="pill" aria-live="off">Harjoitusaika {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</span>}
      </div>
      <h1 id="ex-item" ref={heading} tabIndex={-1} lang="fi">{SKILL_FI[item.skill]}</h1>
      {snap.matches("expired") ? (
        <div role="alert" className="exam-notice">
          <p lang="fi">Harjoitusaika päättyi. Vastauksia ei voi enää muuttaa.</p>
          <div className="actions"><button type="button" className="btn" onClick={() => actor.send({ type: "CONFIRM_FINISH", now: Date.now() })}>Lopeta ja näytä tulokset</button></div>
        </div>
      ) : snap.matches("confirming") ? (
        <div role="alertdialog" aria-labelledby="ex-confirm" className="exam-notice">
          <p id="ex-confirm" lang="fi">Haluatko lopettaa? Vastaamatta: {unanswered}.</p>
          <div className="actions">
            <button type="button" className="btn" onClick={() => actor.send({ type: "CONFIRM_FINISH", now: Date.now() })}>Lopeta koe</button>
            <button type="button" className="btn secondary" onClick={() => actor.send({ type: "CANCEL_FINISH" })}>Jatka</button>
          </div>
        </div>
      ) : (
        <ExamItemView item={item} answer={answer} onAnswer={set} disabled={busy} />
      )}
      <p className="muted exam-save" aria-live="polite">{snap.matches("autosaving") ? "Tallennetaan luonnosta…" : snap.context.dirty ? "Luonnos tallentuu pian." : "Tallennettu."}</p>
      {snap.context.autosaveError && <p className="feedback error" role="alert">Чернетку НЕ збережено ({snap.context.autosaveError}). Наступний перехід спробує ще раз — не закривай вкладку.</p>}
      {snap.matches("saveError") && (
        <div className="feedback error" role="alert"><p>НЕ збережено ({error}). Твоя відповідь лишилася тут.</p>
          <button type="button" className="btn" onClick={() => actor.send({ type: "RETRY" })}>Спробувати ще раз</button></div>
      )}
      {(snap.matches("active") || snap.matches("saving") || snap.matches("saveError") || snap.matches("autosaving")) && (
        <div className="actions">
          <button type="button" className="btn secondary" disabled={navBusy || session!.index === 0} onClick={() => go(session!.index - 1)}>Edellinen</button>
          {session!.index < items.length - 1
            ? <button type="button" className="btn" disabled={navBusy} onClick={() => go(session!.index + 1)}>{busy ? "Tallennetaan…" : "Seuraava"}</button>
            : <button type="button" className="btn" disabled={navBusy} onClick={() => actor.send({ type: "REQUEST_FINISH" })}>Lopeta koe</button>}
        </div>
      )}
    </section>
  );
}

function ExamItemView({ item, answer, onAnswer, disabled }: { item: ExamItem; answer: string; onAnswer: (v: string) => void; disabled: boolean }) {
  const audio = item.skill === "listening" ? audioUrlFor(item.audioPath) : null;
  return (
    <div className="exam-item">
      {item.passage && <><h2 lang="fi">{item.heading}</h2><div className="exam-passage" lang="fi">{item.passage}</div></>}
      {item.skill === "listening" && (
        <div className="exam-audio">
          {audio ? <audio controls preload="none" src={audio} aria-label={`Äänite: ${item.heading ?? ""}`} /> : <p>Äänitettä ei löydy.</p>}
          <p className="muted">Harjoitustoisto: kuuntelukertoja ei rajoiteta (virallista 2027-sääntöä ei ole vahvistettu).</p>
        </div>
      )}
      {item.options ? (
        <fieldset className="choices-set" disabled={disabled}>
          <legend lang="fi">{item.prompt}</legend>
          {item.options.map((o, i) => {
            const val = item.kind === "boolean" ? (i === 0 ? "true" : "false") : String(i);
            return <label key={`${item.id}-${i}`} className="radio"><input type="radio" name={`ex-${item.id}`} checked={answer === val} onChange={() => onAnswer(val)} /> <span lang="fi">{o}</span></label>;
          })}
        </fieldset>
      ) : (
        <>
          <p className="exam-prompt" lang="fi">{item.prompt}</p>
          <label className="field" htmlFor={`ex-${item.id}`} lang="fi">{item.skill === "speaking" ? "Kirjoita puheenvuorosi suunnitelma (puhetta ei arvioida automaattisesti)" : "Vastauksesi"}</label>
          <textarea id={`ex-${item.id}`} className="answer" lang="fi" rows={item.skill === "writing" ? 8 : 4} maxLength={12000} value={answer} disabled={disabled} onChange={e => onAnswer(e.target.value)} />
        </>
      )}
    </div>
  );
}

function ExamSetup({ error, repository, onStart, onHome }: { error: string | null; repository: ExamRepository; onStart: (b: string, m: number, skills: ExamSkill[] | null) => void; onHome: () => void }) {
  const [blueprint, setBlueprint] = useState(examBlueprints[0]!.id);
  const [minutes, setMinutes] = useState(0);
  const all: ExamSkill[] = ["reading", "listening", "writing", "speaking"];
  const [skills, setSkills] = useState<ExamSkill[]>(all);
  const [history, setHistory] = useState<ExamHistoryRecord[] | null>(null);
  useEffect(() => { repository.history().then(setHistory, () => setHistory([])); }, [repository]);
  const partial = skills.length > 0 && skills.length < all.length;
  return (
    <section className="panel exam" aria-labelledby="ex-setup">
      <p className="eyebrow">02 · Симуляція YKI</p>
      <h1 id="ex-setup">Тренувальна репетиція</h1>
      <p className="qualification">Незалежна тренувальна репетиція. Не офіційний YKI і не відтворення цифрового іспиту 2027: офіційні таймінги, навігацію й правила прослуховування ще не підтверджено. Під час репетиції немає підказок; результати — лише після завершення.</p>
      {error && <p className="feedback error" role="alert">Не вдалося прочитати збережену репетицію ({error}).</p>}
      <fieldset className="choices-set">
        <legend>Набір завдань</legend>
        {examBlueprints.map(b => <label key={b.id} className="radio"><input type="radio" name="bp" checked={blueprint === b.id} onChange={() => setBlueprint(b.id)} /> {b.title_uk}</label>)}
      </fieldset>
      <fieldset className="choices-set">
        <legend>Навички (усі 4 — повна репетиція; частина — окремий тренувальний субтест)</legend>
        {all.map(k => (
          <label key={k} className="radio"><input type="checkbox" checked={skills.includes(k)}
            onChange={e => setSkills(s => e.target.checked ? all.filter(x => s.includes(x) || x === k) : s.filter(x => x !== k))} /> {SKILL_UK[k]} <span lang="fi" className="muted">· {SKILL_FI[k]}</span></label>
        ))}
        {partial && <p className="muted">Це тренувальний субтест, не «офіційний частковий YKI» (такий можливий лише для підтверджених OPH днів).</p>}
      </fieldset>
      <fieldset className="choices-set">
        <legend>Тренувальний таймер (не офіційний)</legend>
        {PRACTICE_LIMITS_MINUTES.map(m => <label key={m} className="radio"><input type="radio" name="tm" checked={minutes === m} onChange={() => setMinutes(m)} /> {m === 0 ? "Без таймера" : `${m} хв`}</label>)}
      </fieldset>
      <div className="actions">
        <button type="button" className="btn" disabled={skills.length === 0} onClick={() => onStart(blueprint, minutes, partial ? skills : null)}>Aloita · Почати</button>
        <button type="button" className="btn secondary" onClick={onHome}>На головну</button>
      </div>
      {skills.length === 0 && <p className="feedback error" role="alert">Обери хоча б одну навичку.</p>}
      <h2>Попередні репетиції</h2>
      {history === null ? <p className="muted">Завантаження…</p> : history.length === 0 ? <p className="muted">Ще немає завершених репетицій.</p> : (
        <ul className="skill-lines exam-history">
          {history.map(h => (
            <li key={h.sessionId}>
              <strong>{new Date(h.finishedAt).toLocaleDateString("uk-UA")}</strong> · {examBlueprints.find(b => b.id === h.blueprintId)?.title_uk ?? h.blueprintId}
              {h.skills ? ` · ${h.skills.map(k => SKILL_UK[k]).join(", ")}` : " · усі 4 навички"}<br />
              {(Object.keys(h.bySkill) as ExamSkill[]).filter(k => h.bySkill[k].objective || h.bySkill[k].ungraded).map(k =>
                `${SKILL_UK[k]}: ${h.bySkill[k].objective ? `${h.bySkill[k].correct}/${h.bySkill[k].objective} із ключем` : ""}${h.bySkill[k].ungraded ? `${h.bySkill[k].objective ? ", " : ""}${h.bySkill[k].ungraded} без оцінки` : ""}`).join(" · ") || "без відповідей"}
              <br /><small className="muted">Версія завдань: {h.contentVersion}. Не прогноз складання YKI.</small>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
