import { useEffect, useState } from "react";
import { dueCards, type LearnerState } from "@hospodar/domain";
import type { LearnerRepository } from "./storage/learnerRepository.ts";
import { MissionScreen } from "./screens/MissionScreen.tsx";
import { exercises } from "./content/cloze.ts";
import { learnerR08Tasks } from "./content/r08.ts";
import { ReviewerScreen } from "./screens/ReviewerScreen.tsx";
import { ImportScreen } from "./screens/ImportScreen.tsx";
import { RetentionScreen } from "./screens/RetentionScreen.tsx";
import { ProgressScreen } from "./screens/ProgressScreen.tsx";
import { ListeningScreen } from "./screens/ListeningScreen.tsx";
import { DiagnosticScreen } from "./screens/DiagnosticScreen.tsx";
import { WritingClinicScreen } from "./screens/WritingClinicScreen.tsx";
import { DialogueScreen } from "./screens/DialogueScreen.tsx";
import { MediaScreen } from "./screens/MediaScreen.tsx";
import { PictureMissionScreen } from "./screens/PictureMissionScreen.tsx";
import { delayedTransferQueue } from "@hospodar/domain";
import { transferBank } from "./content/transfer.ts";
import { applyAppearance, readAppearance, type Appearance } from "./appearance.ts";

type View = "home" | "mission" | "review" | "import" | "retention" | "progress" | "listening" | "diagnostic" | "writing" | "dialogue" | "media" | "pictures";
const initialView = (): View => (location.hash === "#review" ? "review" : "home");

export function App({ repository, markUrl }: { repository: LearnerRepository; markUrl: string }) {
  const [view, setView] = useState<View>(initialView);
  useEffect(() => { const f = () => setView(initialView()); addEventListener("hashchange", f); return () => removeEventListener("hashchange", f); }, []);
  const [snapshot, setSnapshot] = useState<{ state: LearnerState; revision: number } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [appearance, setAppearance] = useState<Appearance>(readAppearance);
  useEffect(() => { applyAppearance(appearance); }, [appearance]);

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
          <button type="button" className="pill toggle" aria-pressed={appearance === "calm"}
            onClick={() => setAppearance(a => (a === "calm" ? "standard" : "calm"))}>Спокійний режим</button>
          <span className="pill" aria-live="polite">{view === "mission" ? "01 · Навчання" : view === "review" ? "Рецензент S2" : view === "import" || view === "progress" ? "Прогрес" : view === "retention" || view === "listening" || view === "diagnostic" || view === "writing" || view === "dialogue" || view === "media" || view === "pictures" ? "01 · Навчання" : "Головна"}</span>
        </div>
      </header>
      <main id="main" className="wrap" tabIndex={-1}>
        {loadError && <p className="feedback error" role="alert">Не вдалося прочитати локальний прогрес ({loadError}). Навчання працює, але нічого не буде збережено.</p>}
        {view === "home" && <Home state={snapshot?.state ?? null} onLearn={() => setView("mission")} onImport={() => setView("import")}
          onRetention={() => setView("retention")} onProgress={() => setView("progress")} onListening={() => setView("listening")} onDiagnostic={() => setView("diagnostic")} onWriting={() => setView("writing")} onDialogue={() => setView("dialogue")} onMedia={() => setView("media")} onPictures={() => setView("pictures")} />}
        {view === "pictures" && snapshot && <PictureMissionScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => setView("home")} />}
        {view === "media" && snapshot && <MediaScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => setView("home")} />}
        {view === "dialogue" && snapshot && <DialogueScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => setView("home")} />}
        {view === "writing" && snapshot && <WritingClinicScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => setView("home")} />}
        {view === "diagnostic" && snapshot && <DiagnosticScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => setView("home")} onListening={() => setView("listening")} />}
        {view === "listening" && snapshot && <ListeningScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => setView("home")} />}
        {view === "retention" && snapshot && <RetentionScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => setView("home")} />}
        {view === "progress" && snapshot && <ProgressScreen state={snapshot.state} onHome={() => setView("home")} onLearn={() => setView("mission")} onRetention={() => setView("retention")} />}
        {view === "import" && snapshot && <ImportScreen repository={repository} current={snapshot} onImported={setSnapshot} onHome={() => setView("home")} />}
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

function Home({ state, onLearn, onImport, onRetention, onProgress, onListening, onDiagnostic, onWriting, onDialogue, onMedia, onPictures }: { state: LearnerState | null; onLearn: () => void; onImport: () => void; onRetention: () => void; onProgress: () => void; onListening: () => void; onDiagnostic: () => void; onWriting: () => void; onDialogue: () => void; onMedia: () => void; onPictures: () => void }) {
  const retDue = state ? delayedTransferQueue(state, transferBank).filter(q => q.due).length : 0;
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
      {retDue > 0 && <p className="feedback" role="status">Сьогодні є відкладена перевірка: нова ситуація без підказки. <button type="button" className="btn secondary" onClick={onRetention}>Пройти</button></p>}
      <div className="actions">
        <button type="button" className="btn secondary" onClick={onListening}>🎧 Аудіювання</button>
        <button type="button" className="btn secondary" onClick={onWriting}>✍ Майстерня письма</button>
        <button type="button" className="btn secondary" onClick={onDialogue}>💬 Діалоги</button>
        <button type="button" className="btn secondary" onClick={onPictures}>📷 Фото-місії</button>
        <button type="button" className="btn secondary" onClick={onMedia}>🖼 Медіатека</button>
        <button type="button" className="btn secondary" onClick={onDiagnostic}>{state?.diagnostics.some(d => d.skill === "writing") ? "Стартова діагностика (ще раз)" : "Стартова діагностика"}</button>
        <button type="button" className="btn secondary" onClick={onProgress}>Мій прогрес</button>
        <button type="button" className="btn secondary" onClick={onImport}>Перенести прогрес з попередньої версії</button>
      </div>
      <p className="qualification">Навчання дозволяє підказки після твоєї відповіді — симуляція їх приховує. Вправи — чернетки, ще не перевірені викладачем фінської як другої мови (S2).</p>
    </section>
  );
}
