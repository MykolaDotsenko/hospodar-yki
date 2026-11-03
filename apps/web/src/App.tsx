import { useEffect, useState } from "react";
import { dueCards, type LearnerState } from "@hospodar/domain";
import type { LearnerRepository } from "./storage/learnerRepository.ts";
import { MissionScreen } from "./screens/MissionScreen.tsx";
import { exercises } from "./content/cloze.ts";
import { learnerR08Tasks } from "./content/r08.ts";
import { ReviewerScreen } from "./screens/ReviewerScreen.tsx";

type View = "home" | "mission" | "review";
const initialView = (): View => (location.hash === "#review" ? "review" : "home");

export function App({ repository, markUrl }: { repository: LearnerRepository; markUrl: string }) {
  const [view, setView] = useState<View>(initialView);
  useEffect(() => { const f = () => setView(initialView()); addEventListener("hashchange", f); return () => removeEventListener("hashchange", f); }, []);
  const [snapshot, setSnapshot] = useState<{ state: LearnerState; revision: number } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    repository.read().then(setSnapshot, e => setLoadError(String(e?.code ?? e)));
  }, [repository]);

  return (
    <>
      <header className="topbar">
        <div className="wrap topbar-inner">
          <a className="brand" href="./" onClick={e => { e.preventDefault(); setView("home"); }}>
            <img className="brand-mark" src={markUrl} alt="" width={46} height={46} />
            <span><strong>Hospodar YKI</strong><small>Фінська для життя. Впевненість для YKI.</small></span>
          </a>
          <span className="pill" aria-live="polite">{view === "mission" ? "01 · Навчання" : view === "review" ? "Рецензент S2" : "Головна"}</span>
        </div>
      </header>
      <main id="main" className="wrap" tabIndex={-1}>
        {loadError && <p className="feedback error" role="alert">Не вдалося прочитати локальний прогрес ({loadError}). Навчання працює, але нічого не буде збережено.</p>}
        {view === "home" && <Home state={snapshot?.state ?? null} onLearn={() => setView("mission")} />}
        {view === "review" && <ReviewerScreen onHome={() => { history.replaceState(null, "", location.pathname); setView("home"); }} />}
        {view === "mission" && snapshot && (
          <MissionScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => setView("home")} />
        )}
      </main>
      <footer className="wrap footer">
        <p>Незалежний навчальний застосунок, не пов'язаний з OPH/JYU. Не є офіційним YKI. Прогрес зберігається лише на цьому пристрої.</p>
        <p><a href="#review">Режим рецензента S2 (для викладачів)</a>{learnerR08Tasks.length === 0 && " · завдання «значення → форма» з'являться після рецензії"}</p>
      </footer>
    </>
  );
}

function Home({ state, onLearn }: { state: LearnerState | null; onLearn: () => void }) {
  const done = state?.attempts.length ?? 0;
  const due = state ? dueCards(state).filter(c => exercises.some(e => e.id === c.id)).length : 0;
  return (
    <section aria-labelledby="home-title">
      <h1 id="home-title">Що сьогодні робимо?</h1>
      <div className="mode-gateway">
        <button type="button" className="mode-entry mode-entry-learn" onClick={onLearn}>
          <span className="mode-number">01</span>
          <strong>Навчання</strong>
          <small>Граматика в контексті: спершу власна відповідь, потім підказка й самовиправлення.</small>
          <span className="mode-cta">{done ? "Продовжити" : "Почати місію"} →</span>
        </button>
        <div className="mode-entry mode-entry-exam" aria-describedby="exam-note">
          <span className="mode-number">02</span>
          <strong>Симуляція YKI</strong>
          <small id="exam-note">У новій версії ще в розробці. Тренувальна репетиція поки працює в попередній версії застосунку.</small>
        </div>
      </div>
      <p className="muted" aria-live="polite">Виконано місій: <strong>{done}</strong> · на повторення сьогодні: <strong>{due}</strong></p>
      <p className="qualification">Навчання дозволяє підказки після твоєї відповіді — симуляція їх приховує. Вправи — чернетки, ще не перевірені викладачем фінської як другої мови (S2).</p>
    </section>
  );
}
