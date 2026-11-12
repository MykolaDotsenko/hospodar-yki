import { useRef, useState, type FormEvent } from "react";
import { recordSkillCheck, skillCheckReducer, skillCheckReveal, skillCheckView, skillRetentionQueue, startSkillCheck, SKILL_CHECK_MAX_CHARS,
  type LearnerState, type Skill, type SkillCheckEvent, type SkillCheckItem, type SkillCheckSession, type SkillRetentionStatus } from "@hospodar/domain";
import { listeningMediaFor, skillRetentionBank } from "../content/skillRetention.ts";
import type { LearnerRepository } from "../storage/learnerRepository.ts";
import { writeFailureAdvice } from "../storage/browserStorageHealth.ts";
import { Icon } from "../ui/icons.tsx";
import { TrustNote } from "../ui/TrustNote.tsx";

type Snap = { state: LearnerState; revision: number };
const SKILL_UK: Record<Skill, string> = { reading: "Читання", listening: "Аудіювання", writing: "Письмо", speaking: "Говоріння" };
const code = (e: unknown) => String((e as { code?: string })?.code ?? "SAVE_FAILED");

/** GL-03: one delayed 7/14/30 check per skill, on a NEW withheld item; saved before anything is revealed. */
export function SkillChecks({ repository, snapshot, onSaved }: { repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void }) {
  const queue = skillRetentionQueue(snapshot.state, skillRetentionBank);
  const [open, setOpen] = useState<{ skill: Skill; day: 7 | 14 | 30; check: SkillCheckItem } | null>(null);
  if (open) return <SkillCheckRun key={`${open.skill}-${open.day}`} {...open} repository={repository} snapshot={snapshot} onSaved={onSaved} onClose={() => setOpen(null)} />;
  return (
    <section aria-labelledby="sk-title">
      <h2 id="sk-title">Відкладені перевірки за навичками</h2>
      <p>Через 7, 14 і 30 днів після першого заняття з навички — <strong>нове</strong> завдання, якого ти ще не бачив(ла), без підказок. Відповідь зберігається до того, як з'являться ключі.</p>
      <ul className="skill-lines">
        {queue.map(q => <li key={q.skill}><strong>{SKILL_UK[q.skill]}</strong><br />{line(q)}
          {q.due && <> <button type="button" className="btn" onClick={() => setOpen({ skill: q.skill, day: q.due!.day, check: q.due!.check })}>Пройти перевірку дня {q.due.day}</button></>}
        </li>)}
      </ul>
    </section>
  );
}

function line(q: SkillRetentionStatus): string {
  if (!q.anchorDate) return "Почнеться через 7 днів після першого заняття з цієї навички.";
  const parts = [`Виконано: ${q.completed.length ? q.completed.map(d => `день ${d}`).join(", ") : "ще нічого"}`];
  if (q.missed.length) parts.push(`пропущено: ${q.missed.map(d => `день ${d}`).join(", ")} (не зараховується заднім числом)`);
  if (q.unavailable) parts.push(`вікно дня ${q.unavailable} відкрите, але нових записів, яких ти не чув(ла), більше немає — перевірку не підмінюємо знайомим`);
  else if (!q.due && q.nextDay) parts.push(`наступна — через ${q.nextDay - q.ageDays} дн.`);
  else if (!q.due && !q.nextDay && !q.unavailable) parts.push("усі три перевірки пройдено або їхні вікна минули");
  return parts.join(" · ");
}

function SkillCheckRun({ skill, day, check, repository, snapshot, onSaved, onClose }: {
  skill: Skill; day: 7 | 14 | 30; check: SkillCheckItem; repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void; onClose: () => void;
}) {
  const [s, setS] = useState<SkillCheckSession>(() => startSkillCheck(skill, day, check));
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const busy = useRef(false);
  const v = skillCheckView(s, check);
  const media = skill === "listening" ? listeningMediaFor(check.item.id) : null;

  function step(e: SkillCheckEvent) {
    setError(null);
    try { setS(skillCheckReducer(s, check, e)); if (e.type === "ANSWER") setValue(""); }
    catch (err) {
      const c = code(err);
      setError(c === "AUDIO_NOT_STARTED" ? "Спершу ввімкни запис." : c === "EMPTY" ? "Спершу дай відповідь." : c === "INVALID" ? "Обери варіант." : "Цей крок зараз недоступний.");
    }
  }
  async function save(final: SkillCheckSession) {
    if (busy.current) return;
    busy.current = true; setSaving(true); setError(null);
    try {
      const next = recordSkillCheck(snapshot.state, skillRetentionBank, final);
      const committed = await repository.commit(next, snapshot.revision);
      const verified = await repository.read();                         // reveal only after an exact, fresh readback
      if (verified.revision !== committed.revision || JSON.stringify(verified.state) !== JSON.stringify(next))
        throw Object.assign(new Error("Stored progress differs"), { code: "READBACK_MISMATCH" });
      onSaved(verified); setSaved(true);
    } catch (err) {
      setError(`Не збережено (${code(err)}). Ключі приховані, доки відповідь не збережено. ${writeFailureAdvice(err)}`);
    } finally { busy.current = false; setSaving(false); }
  }
  function submitText(e: FormEvent) {
    e.preventDefault();
    try { const next = skillCheckReducer(s, check, { type: "SUBMIT_TEXT", text: value }); setS(next); void save(next); }
    catch { setError("Спершу напиши відповідь."); }
  }

  const reveal = saved ? skillCheckReveal(s, check) : null;
  return (
    <section className="feedback" aria-labelledby="skc-title">
      <h2 id="skc-title">{SKILL_UK[skill]} · перевірка дня {day}</h2>
      <TrustNote>Не іспит YKI.</TrustNote>
      {check.kind === "objective" && <p lang="fi"><strong>{check.item.title_fi}</strong></p>}
      {v.showReadingText && check.kind === "objective" && <div className="prompt reading-text" lang="fi">{check.item.text_fi}</div>}
      {skill === "listening" && media && !saved && (
        <>
          {media.audio ? <audio controls preload="none" src={media.audio} onPlay={() => { if (s.phase === "answer") step({ type: "AUDIO_STARTED" }); }} />
            : <p className="feedback error" role="alert">Аудіофайл недоступний — перевірку не можна пройти чесно.</p>}
          {!s.supported && !v.ready && <button type="button" className="btn secondary" onClick={() => step({ type: "SHOW_TEXT" })}>Показати текст (тоді без оцінки)</button>}
          {v.showTranscript && media.transcript && <div className="prompt transcript" lang="fi">{media.transcript}</div>}
        </>
      )}

      {!v.ready && v.question && (
        <form onSubmit={e => { e.preventDefault(); const qId = v.question!.id; const val = value;
          try { const next = skillCheckReducer(s, check, { type: "ANSWER", questionId: qId, value: val }); setS(next); setValue(""); if (next.phase === "ready") void save(next); }
          catch (err) { const c = code(err); setError(c === "AUDIO_NOT_STARTED" ? "Спершу ввімкни запис." : c === "EMPTY" ? "Спершу дай відповідь." : "Обери варіант."); } }} noValidate>
          {v.question.options_fi ? (
            <fieldset className="choices-set" disabled={!v.canAnswer}>
              <legend><span className="muted">Питання {v.question.n} з {v.question.of} · </span><span lang="fi">{v.question.prompt_fi}</span></legend>
              {v.question.options_fi.map((o, i) => {
                const val = v.question!.type === "true_false" ? (i === 0 ? "true" : "false") : String(i);
                return <label key={`${v.question!.id}-${i}`} className="radio"><input type="radio" name="skq" checked={value === val} onChange={() => setValue(val)} /> <span lang="fi">{o}</span></label>;
              })}
            </fieldset>
          ) : (
            <>
              <label className="field" htmlFor="skq-open"><span className="muted">Питання {v.question.n} з {v.question.of} · </span><span lang="fi">{v.question.prompt_fi}</span></label>
              <input id="skq-open" className="answer" lang="fi" autoComplete="off" maxLength={600} value={value} onChange={e => setValue(e.target.value)} />
            </>
          )}
          {!v.canAnswer && <p className="muted">Спершу ввімкни запис — питання стануть активними.</p>}
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions"><button type="submit" className="btn" disabled={saving}>{saving ? "Зберігаю…" : "Відповісти"}</button></div>
          <p className="muted">Перша відповідь фіксується. Ключі — лише після збереження всієї перевірки.</p>
        </form>
      )}

      {!saved && check.kind === "production" && (
        <form onSubmit={submitText} noValidate>
          <p className="prompt" lang="fi">{check.item.prompt_fi}</p>
          <label className="field" htmlFor="skc-text">{skill === "speaking" ? "Скажи вголос і запиши свої репліки фінською (без оцінки)" : "Твій текст фінською (без оцінки)"}</label>
          <textarea id="skc-text" className="answer" lang="fi" rows={4} maxLength={SKILL_CHECK_MAX_CHARS} disabled={saving || v.ready} value={value} onChange={e => setValue(e.target.value)} />
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions"><button type="submit" className="btn" disabled={saving || v.ready}>{saving ? "Зберігаю…" : "Зберегти відповідь"}</button></div>
        </form>
      )}
      {v.ready && !saved && error && (
        <div className="actions"><button type="button" className="btn" disabled={saving} onClick={() => void save(s)}>Спробувати зберегти ще раз</button></div>
      )}

      {reveal && (
        <>
          <p role="status"><Icon name="ok" /> Перевірку збережено на цьому пристрої.</p>
          {reveal.kind === "objective" ? (
            <>
              {reveal.supported && <p className="muted">З показаним текстом — збережено без оцінки.</p>}
              <ol className="skill-lines">{reveal.results.map(r => (
                <li key={r.n}><span lang="fi">{r.prompt_fi}</span><br /><strong>Твоя відповідь:</strong> <span lang="fi">{r.answer}</span><br />
                  {r.correct === null ? <><strong>Приклад:</strong> <span lang="fi">{r.key_fi}</span></> : <><strong>{r.correct ? "Правильно з першої спроби" : "Ще не так"}</strong> · <span lang="fi">{r.key_fi}</span></>}
                  {r.why_uk && <><br /><span className="muted">{r.why_uk}</span></>}</li>
              ))}</ol>
              {skill === "listening" && media?.transcript && <details><summary>Текст запису</summary><div className="prompt transcript" lang="fi">{media.transcript}</div></details>}
            </>
          ) : (
            <>
              <p>Самоперевірка — чи є у твоїй відповіді ці пункти? Це не оцінка; оцінити може лише викладач.</p>
              <ul>{reveal.points_fi.map(p => <li key={p} lang="fi">{p}</li>)}</ul>
            </>
          )}
        </>
      )}
      <div className="actions"><button type="button" className="btn secondary" disabled={saving} onClick={onClose}>{saved ? "Готово" : "Скасувати (нічого не збережено)"}</button></div>
    </section>
  );
}
