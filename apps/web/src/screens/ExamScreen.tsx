import { useEffect, useMemo, useRef, useState } from "react";
import { createActor, type SnapshotFrom } from "xstate";
import { remainingSeconds, scoreSession, PRACTICE_LIMITS_MINUTES, type ExamItem, type ExamSkill, type SpeakingReceipt, voiceEvidenceOf } from "@hospodar/domain";
import { createExamMachine } from "../exam/examMachine.ts";
import { audioUrlFor, examBlueprints, examContentVersion, itemsFor } from "../content/exam.ts";
import type { ExamHistoryRecord, ExamRepository } from "../storage/examRepository.ts";
import type { VoiceStore } from "../storage/voiceStore.ts";
import { ExamVoice, useVerifiedClip } from "./ExamVoice.tsx";
import { ExamFidelity } from "./ExamFidelity.tsx";
import { ThresholdRoute } from "../ui/MissionChrome.tsx";
import { examProfileFile, examProfiles, pinOf, profileById } from "../content/examProfiles.ts";
import { examProfileHash, profileAvailability, type ExamProfile } from "@hospodar/domain";

/** EXAM practice rehearsal UI. Neutral, Finnish instructions, no learning cues, hints or feedback before a durable finish. */
const SKILL_FI: Record<ExamItem["skill"], string> = { reading: "Tekstin ymmärtäminen", listening: "Puheen ymmärtäminen", writing: "Kirjoittaminen", speaking: "Puhuminen" };
const SKILL_UK: Record<ExamItem["skill"], string> = { reading: "Читання", listening: "Аудіювання", writing: "Письмо", speaking: "Говоріння" };
const newId = () => "sess-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
type Machine = ReturnType<typeof createExamMachine>;

export function ExamScreen({ repository, voiceStore, onHome }: { repository: ExamRepository; voiceStore: VoiceStore; onHome: () => void }) {
  const actor = useMemo(() => createActor(createExamMachine(repository, itemsFor, examBlueprints.map(b => b.id), examContentVersion, voiceStore)), [repository, voiceStore]);
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
    if (!snap.context.dirty || snap.context.composingItemId || !snap.matches("active")) return;
    const t = setTimeout(() => actor.send({ type: "AUTOSAVE" }), 1200);
    return () => clearTimeout(t);
  }, [actor, snap]);
  const [recording, setRecording] = useState(false);
  const pruned = useRef<string | null>(null);
  useEffect(() => {                                                       // once per resumed session: drop clips no receipt points to
    if (!session || session.finishedAt || pruned.current === session.sessionId || !snap.matches("active")) return;
    pruned.current = session.sessionId;
    void voiceStore.pruneSession(session.sessionId, Object.values(session.voiceReceipts ?? {}).map(r => r.storageKey)).catch(() => {});
  }, [snap, session, voiceStore]);
  const busy = snap.matches("saving") || snap.matches("finishing") || snap.matches("clearing") || snap.matches("loading");
  const navBusy = busy || snap.matches("autosaving") || recording || snap.context.composingItemId !== null;

  if (snap.matches("loading")) return <section className="panel exam" aria-busy="true"><p>Ladataan…</p></section>;
  if (snap.matches("setup")) return <ExamSetup error={error} repository={repository} onStart={(blueprintId, minutes, skills, profile) => actor.send({ type: "START", blueprintId, minutes, skills, now: Date.now(), sessionId: newId(), profile: pinOf(profile) })} onHome={onHome} />;

  if (snap.matches("finished") || snap.matches("clearing")) {
    const r = scoreSession(items, session!);
    const used = profileById(session!.profileId);
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
              {key && <> · ключ: <span lang="fi">{key}</span></>}
              {d.voice === "stored" && <StoredVoice receipt={session!.voiceReceipts[d.id]!} voiceStore={voiceStore} onUnverified={() => actor.send({ type: "VOICE_UNVERIFIED", itemId: d.id })} />}</li>;
          })}
        </ol>
        {error && <p className="feedback error" role="alert">Не вдалося очистити ({error}).</p>}
        {used && <ExamFidelity profile={used} compact />}
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
  const unanswered = items.filter(x => !(session!.answers[x.id] ?? "").trim() && !voiceEvidenceOf(session!, x.id)).length;
  const pinned = profileById(session!.profileId);
  const subtests = items.map(x => x.skill).filter((k, i, a) => a.indexOf(k) === i);         // order of this session
  const changed = pinned && session!.profileHash && examProfileHash(pinned) !== session!.profileHash;
  return (
    <section className="panel exam" aria-labelledby="ex-item">
      <div className="exam-bar">
        <span className="pill">{snap.context.skills ? `Osakoeharjoitus: ${snap.context.skills.map(k => SKILL_FI[k]).join(", ")}` : "Harjoituskoe"} · epävirallinen</span>
        <span className="pill" data-testid="exam-profile">Profiili: {pinned?.title_fi ?? "Harjoitus"}</span>
        <span aria-live="polite">Tehtävä {session!.index + 1} / {items.length}</span>
        {left !== null && <span className="pill" aria-live="off">Harjoitusaika {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</span>}
      </div>
      <ThresholdRoute steps={subtests.map(k => SKILL_FI[k])} current={subtests.indexOf(item.skill)} accent="exam" label="Osakokeet · субтести" />
      <h1 id="ex-item" ref={heading} tabIndex={-1} lang="fi">{SKILL_FI[item.skill]}</h1>
      {changed && <p className="muted">Профіль оновився після початку цієї спроби; вона лишається на версії, з якою почалася.</p>}
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
        <>
          <ExamItemView key={item.id} item={item} answer={answer} onAnswer={set}
            onComposeStart={() => actor.send({ type: "COMPOSE_START", itemId: item.id })}
            onComposeEnd={value => actor.send({ type: "COMPOSE_END", itemId: item.id, value, now: Date.now() })}
            disabled={busy || snap.matches("saveError")} />
          {item.skill === "speaking" && <ExamVoice item={item} session={session!} revision={snap.context.revision} voiceStore={voiceStore}
            send={e => actor.send(e)} disabled={busy || snap.matches("autosaving")} onRecording={setRecording} />}
        </>
      )}
      <p className="muted exam-save" aria-live="polite">{snap.context.composingItemId ? "Syöttö kesken — viimeistele teksti ennen tallennusta." : snap.matches("saving") ? "Tallennetaan siirtymää…" : snap.matches("saveError") ? "Tallennus epäonnistui." : snap.matches("autosaving") ? "Tallennetaan luonnosta…" : snap.context.dirty ? "Luonnos tallentuu pian." : "Tallennettu."}</p>
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

function ExamItemView({ item, answer, onAnswer, onComposeStart, onComposeEnd, disabled }: {
  item: ExamItem; answer: string; onAnswer: (v: string) => void;
  onComposeStart: () => void; onComposeEnd: (v: string) => void; disabled: boolean;
}) {
  // Keep IME interim text *only* in the editor. It is not a submitted answer and must not
  // be autosaved. The final exact Unicode string is sent on compositionend (or blur fallback).
  const composing = useRef(false);
  const [compositionDraft, setCompositionDraft] = useState<string | null>(null);
  const completeComposition = (value: string) => {
    if (!composing.current) return;
    composing.current = false;
    setCompositionDraft(null);
    onComposeEnd(value);
  };
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
          <textarea id={`ex-${item.id}`} className="answer" lang="fi" rows={item.skill === "writing" ? 8 : 4}
            maxLength={12000} value={compositionDraft ?? answer} disabled={disabled}
            onChange={e => composing.current ? setCompositionDraft(e.currentTarget.value) : onAnswer(e.currentTarget.value)}
            onCompositionStart={e => { if (item.skill !== "writing") return; composing.current = true;
              setCompositionDraft(e.currentTarget.value); onComposeStart(); }}
            onCompositionEnd={e => completeComposition(e.currentTarget.value)}
            onBlur={e => completeComposition(e.currentTarget.value)} />
        </>
      )}
    </div>
  );
}

function ExamSetup({ error, repository, onStart, onHome }: { error: string | null; repository: ExamRepository; onStart: (b: string, m: number, skills: ExamSkill[] | null, profile: ExamProfile) => void; onHome: () => void }) {
  const [blueprint, setBlueprint] = useState(examBlueprints[0]!.id);
  const now = new Date();
  const [profileId, setProfileId] = useState(examProfiles.find(p => profileAvailability(p, examProfileFile, now).selectable)!.id);
  const profile = profileById(profileId)!;
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
        <legend>Режим точності</legend>
        {examProfiles.map(p => {
          const a = profileAvailability(p, examProfileFile, now);
          return <label key={p.id} className="radio"><input type="radio" name="profile" disabled={!a.selectable} checked={profileId === p.id}
            onChange={() => setProfileId(p.id)} />
            <span>{p.title_uk} <span lang="fi" className="muted">· {p.title_fi}</span>
              {a.reason_uk && <small className="muted radio-note">{a.reason_uk}</small>}</span></label>;
        })}
      </fieldset>
      <ExamFidelity profile={profile} />
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
        <button type="button" className="btn" disabled={skills.length === 0} onClick={() => onStart(blueprint, minutes, partial ? skills : null, profile)}>Aloita · Почати</button>
        <button type="button" className="btn secondary" onClick={onHome}>На головну</button>
      </div>
      {skills.length === 0 && <p className="feedback error" role="alert">Обери хоча б одну навичку.</p>}
      <h2>Попередні репетиції</h2>
      <ExamHistoryList history={history} />
    </section>
  );
}

/** Attempt history (EXAM-09): objective counts per skill, ungraded counted separately; never a grade or pass prediction. */
export function ExamHistoryList({ history }: { history: ExamHistoryRecord[] | null }) {
  return (
    <>
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
    </>
  );
}

/** After a durable finish: the learner may listen to their own stored answer — reviewable, never graded (E06). */
function StoredVoice({ receipt, voiceStore, onUnverified }: { receipt: SpeakingReceipt; voiceStore: VoiceStore; onUnverified: () => void }) {
  const url = useVerifiedClip(receipt, voiceStore, onUnverified);
  return url ? <figure className="player"><figcaption>Твій запис ({Math.max(1, Math.round(receipt.durationMs / 1000))} с) · без оцінки: оцінити може лише людина</figcaption>
    <audio controls src={url} aria-label="Прослухати свою усну відповідь" /></figure> : null;
}
