import { useMemo, useState } from "react";
import { startWarmUp, warmUpCards, warmUpReducer, warmUpView, WARM_UP_MAX_CHARS, WarmUpError, type LearnerState, type PlaceId, type WarmUp as WarmUpState } from "@hospodar/domain";
import { practiceCards } from "../content/practice.ts";

/**
 * «Перед справою» (mobile-contextual-micropractice): an optional 2-minute warm-up right before the real deed of this place.
 * Phrase cards of this place, the phrase only after the own recall, then the first sentence the learner means to say
 * there. Nothing is stored, scheduled or scored; no reminder ever opens it. The learner's own note from last time
 * (real-world-interaction) comes first, because it is the most personal thing to rehearse.
 */
export function WarmUpBox({ place, state, lastTimeNext }: { place: PlaceId; state: LearnerState; lastTimeNext: string | null }) {
  const cards = useMemo(() => warmUpCards(practiceCards, place, state), [place]);       // fixed for this visit
  const [run, setRun] = useState<WarmUpState | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  if (!cards.length) return null;
  const act = (e: Parameters<typeof warmUpReducer>[1]) => {
    try { setRun(warmUpReducer(run!, e)); setInput(""); setError(null); }      // computed here, so an error is caught here
    catch (x) { setError(x instanceof WarmUpError && x.code === "EMPTY" ? "Спершу напиши хоч щось — або натисни «Не пригадую»." : "Цей крок зараз недоступний."); }
  };

  if (!run) return (
    <div className="warm-up" data-testid="warm-up">
      <button type="button" className="btn secondary" onClick={() => setRun(startWarmUp(place, cards.map(c => c.id)))}>Іду зараз — розминка на 2 хвилини</button>
      <p className="muted">{cards.length === 1 ? "Одна фраза" : `${cards.length} фрази`} цього місця й твоє перше речення там. Нічого не зберігається й не оцінюється.</p>
    </div>
  );

  const v = warmUpView(run);
  const card = v.cardId ? cards.find(c => c.id === v.cardId)! : null;
  return (
    <section className="warm-up" data-testid="warm-up" aria-labelledby="warm-up-title">
      <h3 id="warm-up-title">Перед справою</h3>
      {lastTimeNext && v.phase !== "done" && <p data-testid="warm-up-last-time"><strong>Минулого разу ти записав(ла):</strong> {lastTimeNext}</p>}
      {card && (
        <>
          <p className="muted">Фраза {v.step} з {v.of}</p>
          <dl className="skill-lines">
            {card.prompt.map(l => <div key={l.label_uk}><dt className="muted">{l.label_uk}</dt><dd lang={l.lang}>{l.text}</dd></div>)}
          </dl>
          {!v.revealed ? (
            <form onSubmit={e => { e.preventDefault(); act({ type: "TRY", text: input }); }}>
              <label className="field" htmlFor="warm-up-try">Пригадай фінською (своїми словами)</label>
              <input id="warm-up-try" lang="fi" maxLength={WARM_UP_MAX_CHARS} autoComplete="off" spellCheck={false} value={input} onChange={e => setInput(e.target.value)} />
              {error && <p className="feedback error" role="alert">{error}</p>}
              <div className="actions">
                <button type="submit" className="btn">Показати фразу</button>
                <button type="button" className="btn secondary" onClick={() => act({ type: "NOT_RECALLED" })}>Не пригадую</button>
              </div>
            </form>
          ) : (
            <>
              <p data-testid="warm-up-own"><strong>Твоя спроба:</strong> {v.ownTry === null ? <span className="muted">не пригадалося — це нормально, тепер ти її бачиш</span> : <span lang="fi">{v.ownTry}</span>}</p>
              <dl className="skill-lines" data-testid="warm-up-reveal">
                {card.reveal.map(l => <div key={l.label_uk}><dt className="muted">{l.label_uk}</dt><dd className={l.lang === "fi" ? "prompt" : undefined} lang={l.lang}>{l.text}</dd></div>)}
              </dl>
              <p className="muted">Порівняй сам(а): інша правильна форма теж можлива. Застосунок не оцінює.</p>
              <div className="actions"><button type="button" className="btn" onClick={() => act({ type: "NEXT" })}>{v.step < v.of ? "Наступна фраза" : "Далі: моє перше речення"}</button></div>
            </>
          )}
        </>
      )}
      {v.phase === "first_line" && (
        <form onSubmit={e => { e.preventDefault(); act({ type: "FIRST_LINE", text: input }); }}>
          <label className="field" htmlFor="warm-up-first">Що ти скажеш першим, коли прийдеш? Напиши фінською своїми словами.</label>
          <textarea id="warm-up-first" lang="fi" rows={2} maxLength={WARM_UP_MAX_CHARS} spellCheck={false} value={input} onChange={e => setInput(e.target.value)} />
          {error && <p className="feedback error" role="alert">{error}</p>}
          <div className="actions"><button type="submit" className="btn">Готово</button></div>
        </form>
      )}
      {v.phase === "done" && (
        <div data-testid="warm-up-done">
          <p><strong>Візьми з собою:</strong> <span lang="fi">{v.firstLine}</span></p>
          <p className="muted">Розминка не збереглася й не оцінюється. Після справи можеш позначити її нижче й записати, що наступного разу скажеш інакше.</p>
          <div className="actions"><button type="button" className="btn secondary" onClick={() => setRun(null)}>Закрити розминку</button></div>
        </div>
      )}
    </section>
  );
}
