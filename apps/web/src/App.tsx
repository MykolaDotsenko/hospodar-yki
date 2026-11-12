import { useEffect, useState } from "react";
import type { LearnerState } from "@hospodar/domain";
import { HomeScreen } from "./screens/HomeScreen.tsx";
import type { LearnerRepository } from "./storage/learnerRepository.ts";
import type { ExamRepository } from "./storage/examRepository.ts";
import type { VoiceStore } from "./storage/voiceStore.ts";
import { ExamScreen } from "./screens/ExamScreen.tsx";
import { MissionScreen } from "./screens/MissionScreen.tsx";
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
import { PlaceScreen } from "./screens/PlaceScreen.tsx";
import { WorkshopScreen } from "./screens/WorkshopScreen.tsx";
import type { PlaceId } from "@hospodar/domain";
import { applyAppearance, applyGuide, applyTheme, readAppearance, readGuide, readTheme, type Appearance, type Theme } from "./appearance.ts";

type View = "workshop" | "place" | "home" | "mission" | "review" | "import" | "retention" | "progress" | "listening" | "diagnostic" | "writing" | "dialogue" | "media" | "pictures" | "reading" | "practice" | "exam" | "data" | "offline";
const initialView = (): View => (location.hash === "#review" ? "review" : "home");

export function App({ repository, examRepository, voiceStore, markUrl }: { repository: LearnerRepository; examRepository: ExamRepository; voiceStore: VoiceStore; markUrl: string }) {
  const [view, setView] = useState<View>(initialView);
  // «Моє господарство»: the open place, and one item a place asked a screen to open directly.
  const [place, setPlace] = useState<PlaceId | null>(null);
  const [startId, setStartId] = useState<string | null>(null);
  // A mission opened from «Майстерня слабких місць» returns there, not to Home.
  const [fromWorkshop, setFromWorkshop] = useState(false);
  const goTo = (v: View, id: string | null = null, workshop = false) => { setStartId(id); setFromWorkshop(workshop); setView(v); };
  useEffect(() => { const f = () => setView(initialView()); addEventListener("hashchange", f); return () => removeEventListener("hashchange", f); }, []);
  const [snapshot, setSnapshot] = useState<{ state: LearnerState; revision: number } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [appearance, setAppearance] = useState<Appearance>(readAppearance);
  useEffect(() => { applyAppearance(appearance); }, [appearance]);
  const [theme, setTheme] = useState<Theme>(readTheme);
  useEffect(() => { applyTheme(theme); }, [theme]);
  const [guide, setGuide] = useState<boolean>(readGuide);
  useEffect(() => { applyGuide(guide); }, [guide]);
  const showGuide = guide && appearance !== "calm";            // never in EXAM or inside a task: only Home and place screens receive it
  // DESIGN-12: the exam has its own neutral skin; LEARN keeps the expressive one. Presentation only.
  useEffect(() => { document.documentElement.dataset.mode = view === "exam" ? "exam" : "learn"; }, [view]);
  const [updateReady, setUpdateReady] = useState(false);
  useEffect(() => onUpdateReady(setUpdateReady), []);

  useEffect(() => {
    repository.read().then(setSnapshot, e => setLoadError(String(e?.code ?? e)));
  }, [repository]);

  return (
    <>
      <header className="topbar">
        <div className="wrap topbar-inner">
          <a className="brand" href="./" onClick={e => { e.preventDefault(); goTo("home"); }}>
            <img className="brand-mark" src={markUrl} alt="" width={46} height={46} />
            <span><strong>Hospodar YKI</strong><small>Фінська для життя. Впевненість для YKI.</small></span>
          </a>
          <button type="button" className="pill toggle" aria-pressed={appearance === "calm"}
            onClick={() => setAppearance(a => (a === "calm" ? "standard" : "calm"))}>Спокійний режим</button>
          <span className="pill" aria-live="polite">{view === "exam" ? "02 · Симуляція YKI" : view === "mission" ? "01 · Навчання" : view === "review" ? "Рецензент S2" : view === "import" || view === "progress" ? "Прогрес" : view === "data" ? "Мої дані" : view === "offline" ? "Офлайн" : view === "place" ? "Моє господарство" : view === "workshop" ? "01 · Навчання" : view === "retention" || view === "listening" || view === "diagnostic" || view === "writing" || view === "dialogue" || view === "media" || view === "pictures" || view === "reading" || view === "practice" ? "01 · Навчання" : "Головна"}</span>
        </div>
      </header>
      <main id="main" className="wrap" tabIndex={-1}>
        {updateReady && view !== "exam" && (                                   // WEB-06 update guard: never offered inside the exam
          <div className="feedback" role="status"><p>Доступна нова версія застосунку. Прогрес збережено на пристрої й не зміниться.</p>
            <button type="button" className="btn secondary" onClick={applyUpdate}>Оновити зараз</button></div>
        )}
        {loadError && <p className="feedback error" role="alert">Не вдалося прочитати локальний прогрес ({loadError}). Навчання працює, але нічого не буде збережено.</p>}
        {view === "home" && <HomeScreen state={snapshot?.state ?? null} guide={showGuide} go={v => goTo(v)} openPlace={id => { setPlace(id); goTo("place"); }} />}
        {view === "place" && place && snapshot && <PlaceScreen id={place} state={snapshot.state} guide={showGuide} onHome={() => goTo("home")}
          open={(v, id) => goTo(v === "dialogue" ? "dialogue" : v === "writing" ? "writing" : v === "practice" ? "practice" : "reading", id)} />}
        {view === "offline" && <OfflineScreen onHome={() => goTo("home")} />}
        {view === "data" && snapshot && <DataScreen repository={repository} examRepository={examRepository} voiceStore={voiceStore} snapshot={snapshot} onErased={setSnapshot} onHome={() => goTo("home")} />}
        {view === "exam" && <ExamScreen repository={examRepository} voiceStore={voiceStore} onHome={() => goTo("home")}
          onLearn={skill => goTo(skill === "reading" ? "reading" : skill === "listening" ? "listening" : skill === "writing" ? "writing" : "dialogue")} />}
        {view === "reading" && snapshot && <ReadingScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => goTo("home")} initialId={startId} />}
        {view === "practice" && snapshot && <PracticeScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => goTo("home")} initialCardId={startId} />}
        {view === "pictures" && snapshot && <PictureMissionScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => goTo("home")} />}
        {view === "media" && snapshot && <MediaScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => goTo("home")} />}
        {view === "dialogue" && snapshot && <DialogueScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => goTo("home")} initialId={startId} />}
        {view === "writing" && snapshot && <WritingClinicScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => goTo("home")} initialId={startId} />}
        {view === "diagnostic" && snapshot && <DiagnosticScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => goTo("home")} onListening={() => goTo("listening")} />}
        {view === "listening" && snapshot && <ListeningScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => goTo("home")} />}
        {view === "retention" && snapshot && <RetentionScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => goTo("home")} />}
        {view === "progress" && snapshot && <ProgressScreen state={snapshot.state} examRepository={examRepository} onHome={() => goTo("home")} onLearn={() => goTo("mission")} onRetention={() => goTo("retention")} />}
        {view === "import" && snapshot && <ImportScreen repository={repository} current={snapshot} onImported={setSnapshot} onHome={() => goTo("home")} />}
        {view === "review" && <ReviewerScreen onHome={() => { history.replaceState(null, "", location.pathname); goTo("home"); }} />}
        {view === "workshop" && snapshot && <WorkshopScreen state={snapshot.state} guide={showGuide} onHome={() => goTo("home")} open={id => goTo("mission", id, true)} />}
        {view === "mission" && snapshot && (
          <MissionScreen key={startId ?? "ranked"} repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => goTo("home")}
            initialTaskId={startId} workshop={fromWorkshop ? { label: "До майстерні слабких місць", onBack: () => goTo("workshop") } : undefined} />
        )}
      </main>
      <footer className="wrap footer">
        <p>Незалежний навчальний застосунок, не пов'язаний з OPH/JYU. Не є офіційним YKI. Прогрес зберігається лише на цьому пристрої.</p>
        <p className="theme-choice"><label htmlFor="theme">Тема</label>{" "}
          <select id="theme" value={theme} onChange={e => setTheme(e.target.value as Theme)}>
            <option value="system">Як у системі</option><option value="light">Світла</option><option value="dark">Темна</option>
          </select></p>
        <p className="guide-choice"><label><input type="checkbox" checked={guide} onChange={e => setGuide(e.target.checked)} /> Показувати Господаря</label></p>
        <p><a href="#review">Режим рецензента S2 (для викладачів)</a>{learnerR08Tasks.length === 0 && " · завдання «значення → форма» з'являться після рецензії"}</p>
      </footer>
    </>
  );
}
