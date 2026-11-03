import { useEffect, useRef, useState, type FormEvent } from "react";
import { advanceR08, createR08Trial, r08View, R08_CHOICE_UK, R08_FAMILY_UK, type R08Session, type R08Task } from "@hospodar/domain";

/** R03/R08 meaning → form mission. In `preview` (S2 reviewer) nothing is persisted. */
export function R08MissionScreen({ task, preview, onExit }: { task: R08Task; preview: boolean; onExit: () => void }) {
  const [session, setSession] = useState<R08Session>(() => createR08Trial(task, { reviewerPreview: preview }));
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const view = r08View(session, task);
  useEffect(() => { heading.current?.focus(); }, [session.phase]);

  const act = (ev: Parameters<typeof advanceR08>[2]) => {
    setError(null);
    try { setSession(advanceR08(session, task, ev)); setInput(""); }
    catch { setError("Спершу дай відповідь."); }
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (view.phase === "form") act({ type: "SUBMIT_FORM", answer: input });
    else if (view.phase === "feedback") act(input.trim() ? { type: "SUBMIT_REPAIR", answer: input } : { type: "SKIP_REPAIR" });
    else if (view.phase === "transfer") act({ type: "SUBMIT_TRANSFER", answer: input });
  };
  const title = { meaning: "Що означає ця ситуація?", form: "Тепер форма", feedback: "Що вийшло", transfer: "Нова ситуація", done: "Готово" }[view.phase];

  return (
    <section className="panel" aria-labelledby="r08-title">
      {preview && <p className="reviewer-banner" role="note">Перегляд для S2-рецензента — чернетка, не для учнів. Відповіді не зберігаються.</p>}
      <p className="eyebrow">Навчання · значення → форма</p>
      <h1 id="r08-title" ref={heading} tabIndex={-1}>{title}</h1>

      {view.phase === "meaning" && (
        <>
          <p className="prompt" lang="fi">{view.contextFi}</p>
          <fieldset className="choices-set">
            <legend>{view.semanticQuestionUk}</legend>
            {view.options.map(o => (
              <button key={o} type="button" className="choice" onClick={() => act({ type: "CHOOSE_MEANING", choice: o })}>{R08_CHOICE_UK[o]}</button>
            ))}
          </fieldset>
          <p className="muted">Спершу обери значення — форму напишеш на наступному кроці.</p>
        </>
      )}

      {view.phase === "form" && (
        <form onSubmit={submit} noValidate>
          <p className="prompt" lang="fi">{view.promptFi}</p>
          <label className="field" htmlFor="r08-input">Впиши форму слова <span lang="fi">«{view.lemmaFi}»</span></label>
          <input id="r08-input" className="answer" lang="fi" autoComplete="off" autoCapitalize="none" spellCheck={false} value={input} onChange={e => setInput(e.target.value)} />
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions"><button type="submit" className="btn">Перевірити</button></div>
        </form>
      )}

      {view.phase === "feedback" && (
        <form onSubmit={submit} noValidate>
          <div className="feedback" role="status">
            <p><strong>Значення:</strong> {view.meaningCorrect === null ? "з підказкою (не рахується як самостійне)" : view.meaningCorrect ? "правильно" : "інше"} — потрібно {R08_CHOICE_UK[view.meaningRelation]}.</p>
            <p><strong>Форма:</strong> {view.formCorrect === null ? "з підказкою (не оцінюється)" : view.formCorrect ? "правильна" : "ще не та"}.</p>
            {view.errorFamily && <p>{R08_FAMILY_UK[view.errorFamily]}</p>}
            <p lang="fi"><span className="learning-cue">{view.answerFi}</span></p>
            {view.stemCue && <p lang="fi" className="muted">Основа: {view.stemCue}</p>}
            <p>{view.explanationUk}</p>
          </div>
          <label className="field" htmlFor="r08-repair">Хочеш виправити самостійно? Напиши форму ще раз (необов'язково, не оцінюється)</label>
          <input id="r08-repair" className="answer" lang="fi" autoComplete="off" value={input} onChange={e => setInput(e.target.value)} />
          <div className="actions"><button type="submit" className="btn">Далі: нова ситуація</button></div>
        </form>
      )}

      {view.phase === "transfer" && (
        <form onSubmit={submit} noValidate>
          <p className="prompt">{view.transferPromptFi}</p>
          <label className="field" htmlFor="r08-transfer">Твоє речення фінською (без зразка, не оцінюється автоматично)</label>
          <textarea id="r08-transfer" className="answer" lang="fi" rows={3} maxLength={1600} value={input} onChange={e => setInput(e.target.value)} />
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions"><button type="submit" className="btn">Завершити</button></div>
        </form>
      )}

      {view.phase === "done" && (
        <div className="feedback" role="status">
          <p>{preview ? "Перегляд завершено. Нічого не збережено." : "Місію завершено."} Самостійна форма: {view.independentForm ? "так" : "з підказкою"}. Перенос — без автоматичної оцінки.</p>
          <div className="actions"><button type="button" className="btn" onClick={onExit}>До списку</button></div>
        </div>
      )}
    </section>
  );
}
