import { useEffect, useRef, useState, type FormEvent } from "react";
import { addDiagnostic, clinicEvidence, clinicReducer, clinicView, startClinic, ClinicError, CLINIC_MAX_CHARS,
  type ClinicEvent, type ClinicItem, type ClinicSession, type LearnerState } from "@hospodar/domain";
import { clinicItems } from "../content/writingClinic.ts";
import type { LearnerRepository } from "../storage/learnerRepository.ts";

type Snap = { state: LearnerState; revision: number };
const FOCUS_UK: Record<string, string> = { clarity: "зрозумілість", grammar: "граматика", register: "стиль", vocabulary: "лексика", content: "зміст", coherence: "зв'язність" };

export function WritingClinicScreen({ repository, snapshot, onSaved, onHome }: { repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void; onHome: () => void }) {
  const [item, setItem] = useState<ClinicItem | null>(null);
  if (item) return <Clinic key={item.id} item={item} repository={repository} snapshot={snapshot} onSaved={onSaved} onExit={() => setItem(null)} />;
  const done = new Set(snapshot.state.diagnostics.map(d => d.taskId));
  return (
    <section className="panel" aria-labelledby="wc-title">
      <p className="eyebrow">Навчання · письмо</p>
      <h1 id="wc-title">Майстерня письма</h1>
      <p>Спершу пишеш сам(а), потім шукаєш проблеми в слабкій чернетці, бачиш зразок, переписуєш свій текст і пишеш новий — уже без зразка.</p>
      <p className="draft-note">Чернетки: ще не перевірено S2-викладачем. Письмо автоматично не оцінюється.</p>
      <ul className="choices" aria-label="Завдання з письма">
        {clinicItems.map(i => (
          <li key={i.id}><button type="button" className="choice" onClick={() => setItem(i)}>
            <span lang="fi">{i.title_fi}</span>
            <small>{done.has(`${i.id}-transfer`) ? "уже пройдено" : `${i.required.length} пункти завдання`}</small>
          </button></li>
        ))}
      </ul>
      <div className="actions"><button type="button" className="btn secondary" onClick={onHome}>На головну</button></div>
    </section>
  );
}

function Clinic({ item, repository, snapshot, onSaved, onExit }: { item: ClinicItem; repository: LearnerRepository; snapshot: Snap; onSaved: (s: Snap) => void; onExit: () => void }) {
  const [s, setS] = useState<ClinicSession>(() => startClinic(item));
  const latest = useRef(s); latest.current = s;
  const snap = useRef(snapshot); snap.current = snapshot;
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"idle" | "saving" | { error: string }>("idle");
  const heading = useRef<HTMLHeadingElement>(null);
  const v = clinicView(s, item);
  useEffect(() => { heading.current?.focus(); }, [s.phase]);

  const act = (e: ClinicEvent) => {
    setError(null);
    try { const n = clinicReducer(latest.current, item, e); latest.current = n; setS(n); return true; }
    catch (err) { setError(err instanceof ClinicError && err.code === "TOO_SHORT" ? "Напиши щонайменше 20 символів." : "Цей крок зараз недоступний."); return false; }
  };
  async function persist(which: "draft" | "final", session: ClinicSession = latest.current) {
    setSaving("saving");
    try {
      let st = snap.current.state;
      for (const ev of clinicEvidence(session, item, which)) st = addDiagnostic(st, ev);
      const saved = await repository.commit(st, snap.current.revision);
      snap.current = saved; onSaved(saved); setSaving("idle"); return true;
    } catch (err) { setSaving({ error: String((err as { code?: string })?.code ?? "SAVE_FAILED") }); return false; }
  }
  const saveError = typeof saving === "object" && <p className="feedback error" role="alert">НЕ збережено ({saving.error}). Твій текст лишився тут — спробуй ще раз.</p>;
  const titles = { write: "Твій текст", selfcheck: "Перевір себе", spot: "Знайди проблеми в чужій чернетці", issues: "Що варто змінити",
    model: "Зразок", rewrite: "Перепиши свій текст", transfer: "Нова ситуація — без зразка", done: "Готово" };
  const textarea = (id: string, label: string) => (
    <>
      <label className="field" htmlFor={id}>{label}</label>
      <textarea id={id} className="answer" lang="fi" rows={7} maxLength={CLINIC_MAX_CHARS} value={text} onChange={e => setText(e.target.value)} />
      {error && <p className="feedback error" role="alert">{error}</p>}
    </>
  );

  return (
    <section className="panel" aria-labelledby="cl-title">
      <p className="eyebrow">Навчання · майстерня письма · <span lang="fi">{item.title_fi}</span></p>
      <h1 id="cl-title" ref={heading} tabIndex={-1}>{titles[s.phase]}</h1>
      <p className="draft-note">Чернетка: ще не перевірено S2-викладачем. Без автоматичної оцінки.</p>

      {(s.phase === "write" || s.phase === "transfer") && (
        <form onSubmit={(e: FormEvent) => { e.preventDefault();
          if (s.phase === "write") { if (act({ type: "SUBMIT_DRAFT", text })) setText(""); return; }
          // Advance to "done" only after the commit succeeded; on failure the learner keeps the text on this step.
          let next: ClinicSession;
          try { next = clinicReducer(latest.current, item, { type: "SUBMIT_TRANSFER", text }); setError(null); }
          catch { setError("Напиши щонайменше 20 символів."); return; }
          void persist("final", next).then(ok => { if (ok) { latest.current = next; setS(next); setText(""); } }); }} noValidate>
          <div className="prompt" lang="fi">{v.prompt_fi}</div>
          {s.phase === "write" && <p>Що має бути в тексті: <span lang="fi">{v.required.join(" · ")}</span>.</p>}
          {textarea(s.phase === "write" ? "cl-draft" : "cl-transfer", s.phase === "write" ? "Твій текст фінською (зразок з'явиться пізніше)" : "Твій новий текст фінською (зразка й чернетки тут немає)")}
          {s.phase === "transfer" && saveError}
          <div className="actions"><button type="submit" className="btn" disabled={saving === "saving"}>{s.phase === "write" ? "Готово — перевірити себе" : saving === "saving" ? "Зберігаю…" : "Зберегти й завершити"}</button></div>
        </form>
      )}

      {s.phase === "selfcheck" && (
        <>
          <p>Твій текст (зафіксований):</p>
          <div className="prompt transcript" lang="fi">{v.ownDraft}</div>
          <fieldset className="choices-set">
            <legend>Що з цього є у твоєму тексті? <span className="muted">(самоперевірка — не оцінка)</span></legend>
            {v.required.map((p, i) => (
              <label key={p} className="radio"><input type="checkbox" checked={v.checked.includes(i)}
                onChange={e => act({ type: "SELF_CHECK", points: e.target.checked ? [...v.checked, i] : v.checked.filter(x => x !== i) })} /> <span lang="fi">{p}</span></label>
            ))}
          </fieldset>
          {saveError}
          <div className="actions"><button type="button" className="btn" disabled={saving === "saving"}
            onClick={() => void persist("draft").then(ok => { if (ok) { act({ type: "DRAFT_SAVED" }); act({ type: "CONTINUE" }); } })}>
            {saving === "saving" ? "Зберігаю…" : "Зберегти чернетку й далі"}</button></div>
        </>
      )}

      {(s.phase === "spot" || s.phase === "issues") && (
        <>
          <p>{s.phase === "spot" ? "Це навмисно слабка чернетка іншої людини на те саме завдання. Познач речення, які ти б змінив(ла)." : item.feedback_uk}</p>
          <fieldset className="choices-set">
            <legend>Чернетка</legend>
            {v.sentences.map((t, i) => {
              const issue = v.issues?.find(q => q.sentence === i);
              return (
                <div key={i}>
                  <label className="radio"><input type="checkbox" disabled={s.phase === "issues"} checked={v.marked.includes(i)}
                    onChange={e => act({ type: "MARK", sentences: e.target.checked ? [...v.marked, i] : v.marked.filter(x => x !== i) })} /> <span lang="fi">{t}</span></label>
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
          <div className="actions"><button type="button" className="btn" onClick={() => act({ type: "CONTINUE" })}>{s.phase === "spot" ? "Показати, що варто змінити" : "Далі: зразок"}</button></div>
        </>
      )}

      {s.phase === "model" && v.model && (
        <>
          <div className="prompt transcript" lang="fi">{v.model.text_fi}</div>
          <p className="muted">{v.model.note_uk}</p>
          <h2>Твій текст</h2>
          <div className="prompt transcript" lang="fi">{v.ownDraft}</div>
          <div className="actions"><button type="button" className="btn" onClick={() => { setText(v.ownDraft ?? ""); act({ type: "CONTINUE" }); }}>Переписати свій текст</button></div>
        </>
      )}

      {s.phase === "rewrite" && (
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); if (act({ type: "SUBMIT_REWRITE", text })) setText(""); }} noValidate>
          <details className="why"><summary>Показати зразок ще раз</summary><div className="transcript" lang="fi">{v.model?.text_fi}</div></details>
          <ul>{v.selfCheck_uk.map(q => <li key={q}>{q}</li>)}</ul>
          {textarea("cl-rewrite", "Твій переписаний текст (не копіюй зразок — покращ свій)")}
          <div className="actions"><button type="submit" className="btn">Далі: нова ситуація</button></div>
        </form>
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
