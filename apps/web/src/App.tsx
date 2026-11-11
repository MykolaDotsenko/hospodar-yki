import { useEffect, useState } from "react";
import { dueCards, practiceDue, type LearnerState } from "@hospodar/domain";
import { practiceCards } from "./content/practice.ts";
import type { LearnerRepository } from "./storage/learnerRepository.ts";
import type { ExamRepository } from "./storage/examRepository.ts";
import type { VoiceStore } from "./storage/voiceStore.ts";
import { ExamScreen } from "./screens/ExamScreen.tsx";
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
import { ReadingScreen } from "./screens/ReadingScreen.tsx";
import { PracticeScreen } from "./screens/PracticeScreen.tsx";
import { DataScreen } from "./screens/DataScreen.tsx";
import { OfflineScreen } from "./screens/OfflineScreen.tsx";
import { applyUpdate, onUpdateReady } from "./pwa/offline.ts";
import { delayedTransferQueue, skillRetentionQueue } from "@hospodar/domain";
import { skillRetentionBank } from "./content/skillRetention.ts";
import { transferBank } from "./content/transfer.ts";
import { applyAppearance, readAppearance, type Appearance } from "./appearance.ts";

type View = "home" | "mission" | "review" | "import" | "retention" | "progress" | "listening" | "diagnostic" | "writing" | "dialogue" | "media" | "pictures" | "reading" | "practice" | "exam" | "data" | "offline";
const initialView = (): View => (location.hash === "#review" ? "review" : "home");

export function App({ repository, examRepository, voiceStore, markUrl }: { repository: LearnerRepository; examRepository: ExamRepository; voiceStore: VoiceStore; markUrl: string }) {
  const [view, setView] = useState<View>(initialView);
  useEffect(() => { const f = () => setView(initialView()); addEventListener("hashchange", f); return () => removeEventListener("hashchange", f); }, []);
  const [snapshot, setSnapshot] = useState<{ state: LearnerState; revision: number } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [appearance, setAppearance] = useState<Appearance>(readAppearance);
  useEffect(() => { applyAppearance(appearance); }, [appearance]);
  const [updateReady, setUpdateReady] = useState(false);
  useEffect(() => onUpdateReady(setUpdateReady), []);

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
          <span className="pill" aria-live="polite">{view === "exam" ? "02 · Симуляція YKI" : view === "mission" ? "01 · Навчання" : view === "review" ? "Рецензент S2" : view === "import" || view === "progress" ? "Прогрес" : view === "data" ? "Мої дані" : view === "offline" ? "Офлайн" : view === "retention" || view === "listening" || view === "diagnostic" || view === "writing" || view === "dialogue" || view === "media" || view === "pictures" || view === "reading" || view === "practice" ? "01 · Навчання" : "Головна"}</span>
        </div>
      </header>
      <main id="main" className="wrap" tabIndex={-1}>
        {updateReady && view !== "exam" && (                                   // WEB-06 update guard: never offered inside the exam
          <div className="feedback" role="status"><p>Доступна нова версія застосунку. Прогрес збережено на пристрої й не зміниться.</p>
            <button type="button" className="btn secondary" onClick={applyUpdate}>Оновити зараз</button></div>
        )}
        {loadError && <p className="feedback error" role="alert">Не вдалося прочитати локальний прогрес ({loadError}). Навчання працює, але нічого не буде збережено.</p>}
        {view === "home" && <Home state={snapshot?.state ?? null} onLearn={() => setView("mission")} onImport={() => setView("import")}
          onRetention={() => setView("retention")} onProgress={() => setView("progress")} onListening={() => setView("listening")} onDiagnostic={() => setView("diagnostic")} onWriting={() => setView("writing")} onDialogue={() => setView("dialogue")} onMedia={() => setView("media")} onPictures={() => setView("pictures")} onReading={() => setView("reading")} onPractice={() => setView("practice")} onExam={() => setView("exam")} onData={() => setView("data")} onOffline={() => setView("offline")} />}
        {view === "offline" && <OfflineScreen onHome={() => setView("home")} />}
        {view === "data" && snapshot && <DataScreen repository={repository} examRepository={examRepository} voiceStore={voiceStore} snapshot={snapshot} onErased={setSnapshot} onHome={() => setView("home")} />}
        {view === "exam" && <ExamScreen repository={examRepository} voiceStore={voiceStore} onHome={() => setView("home")} />}
        {view === "reading" && snapshot && <ReadingScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => setView("home")} />}
        {view === "practice" && snapshot && <PracticeScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => setView("home")} />}
        {view === "pictures" && snapshot && <PictureMissionScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => setView("home")} />}
        {view === "media" && snapshot && <MediaScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => setView("home")} />}
        {view === "dialogue" && snapshot && <DialogueScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => setView("home")} />}
        {view === "writing" && snapshot && <WritingClinicScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => setView("home")} />}
        {view === "diagnostic" && snapshot && <DiagnosticScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => setView("home")} onListening={() => setView("listening")} />}
        {view === "listening" && snapshot && <ListeningScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => setView("home")} />}
        {view === "retention" && snapshot && <RetentionScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => setView("home")} />}
        {view === "progress" && snapshot && <ProgressScreen state={snapshot.state} examRepository={examRepository} onHome={() => setView("home")} onLearn={() => setView("mission")} onRetention={() => setView("retention")} />}
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

function Home({ state, onLearn, onImport, onRetention, onProgress, onListening, onDiagnostic, onWriting, onDialogue, onMedia, onPictures, onReading, onPractice, onExam, onData, onOffline }: { state: LearnerState | null; onLearn: () => void; onImport: () => void; onRetention: () => void; onProgress: () => void; onListening: () => void; onDiagnostic: () => void; onWriting: () => void; onDialogue: () => void; onMedia: () => void; onPictures: () => void; onReading: () => void; onPractice: () => void; onExam: () => void; onData: () => void; onOffline: () => void }) {
  const retDue = state ? delayedTransferQueue(state, transferBank).filter(q => q.due).length + skillRetentionQueue(state, skillRetentionBank).filter(q => q.due).length : 0;
  const done = state?.attempts.length ?? 0;
  const due = state ? dueCards(state).filter(c => exercises.some(e => e.id === c.id)).length : 0;
  const phrasesDue = state ? practiceDue(state, practiceCards).length : 0;
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
        <button type="button" className="mode-entry mode-entry-exam" onClick={onExam} aria-describedby="exam-note">
          <span className="mode-number">02</span>
          <strong>Симуляція YKI</strong>
          <small id="exam-note">Тренувальна репетиція з 4 навичок, без підказок. Не офіційний YKI: правила цифрового іспиту 2027 ще не підтверджено.</small>
          <span className="mode-cta">Почати репетицію →</span>
        </button>
      </div>
      <p className="muted" aria-live="polite">Виконано місій: <strong>{done}</strong> · на повторення сьогодні: <strong>{due}</strong></p>
      {retDue > 0 && <p className="feedback" role="status">Сьогодні є відкладена перевірка: нова ситуація без підказки. <button type="button" className="btn secondary" onClick={onRetention}>Пройти</button></p>}
      <div className="actions">
        <button type="button" className="btn secondary" onClick={onReading}>📖 Читання</button>
        <button type="button" className="btn secondary" onClick={onListening}>🎧 Аудіювання</button>
        <button type="button" className="btn secondary" onClick={onWriting}>✍ Майстерня письма</button>
        <button type="button" className="btn secondary" onClick={onDialogue}>💬 Діалоги</button>
        <button type="button" className="btn secondary" onClick={onPictures}>📷 Фото-місії</button>
        <button type="button" className="btn secondary" onClick={onPractice}>🗣 Практика без підказки{phrasesDue > 0 ? ` · повторити ${phrasesDue}` : ""}</button>
        <button type="button" className="btn secondary" onClick={onMedia}>🖼 Медіатека</button>
        <button type="button" className="btn secondary" onClick={onDiagnostic}>{state?.diagnostics.some(d => d.skill === "writing") ? "Стартова діагностика (ще раз)" : "Стартова діагностика"}</button>
        <button type="button" className="btn secondary" onClick={onProgress}>Мій прогрес</button>
        <button type="button" className="btn secondary" onClick={onImport}>Перенести прогрес з попередньої версії</button>
        <button type="button" className="btn secondary" onClick={onData}>Мої дані: копія й видалення</button>
        <button type="button" className="btn secondary" onClick={onOffline}>Офлайн-доступ</button>
      </div>
      <p className="qualification">Навчання дозволяє підказки після твоєї відповіді — симуляція їх приховує. Вправи — чернетки, ще не перевірені викладачем фінської як другої мови (S2).</p>
    </section>
  );
}
