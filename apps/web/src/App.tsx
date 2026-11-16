import { useEffect, useState } from "react";
import type { GoalRecord, LearnerState } from "@hospodar/domain";
import { HomeScreen } from "./screens/HomeScreen.tsx";
import type { ActiveSession } from "./screens/SessionPlanPanel.tsx";
import { onGoalsChanged, readGoals } from "./storage/goals.ts";
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
import { NotReviewedYet } from "./screens/NotReviewedYet.tsx";
import { IN_RELEASE } from "./content/release.ts";
import { exercises } from "./content/cloze.ts";
import { practiceCards } from "./content/practice.ts";
import { dialogues } from "./content/dialogues.ts";
import { readingItems } from "./content/reading.ts";
import { clinicItems } from "./content/writingClinic.ts";
import { listeningLessons } from "./content/listening.ts";
import { pictureMissions } from "./content/pictureMissions.ts";
import { diagnosticAvailable } from "./content/diagnostic.ts";
import { examBlueprints } from "./content/exam.ts";
import { WorkshopScreen } from "./screens/WorkshopScreen.tsx";
import type { PlaceId } from "@hospodar/domain";
import { applyAppearance, applyFont, applyGuide, applyTheme, readAppearance, readFont, readGuide, readTheme, type Appearance, type FontChoice, type Theme } from "./appearance.ts";

type View = "workshop" | "place" | "home" | "mission" | "review" | "import" | "retention" | "progress" | "listening" | "diagnostic" | "writing" | "dialogue" | "media" | "pictures" | "reading" | "practice" | "exam" | "data" | "offline";
/** The S2 reviewer workspace exists only in beta builds: a release build never shows keys or drafts. */
const initialView = (): View => (location.hash === "#review" && !IN_RELEASE ? "review" : "home");
/** Release build: a learner screen whose pool has no S2-published item shows «Ще не перевірено» instead. */
const EMPTY_IN_RELEASE: Partial<Record<View, boolean>> = IN_RELEASE ? {
  mission: exercises.length === 0, workshop: exercises.length === 0, practice: practiceCards.length === 0, dialogue: dialogues.length === 0,
  reading: readingItems.length === 0, writing: clinicItems.length === 0, listening: listeningLessons.length === 0,
  pictures: pictureMissions.length === 0, diagnostic: !diagnosticAvailable, exam: examBlueprints.length === 0,
} : {};
/** Release build: how many S2-published learner tasks this build carries (shown on Home, so an empty build says so). */
const RELEASED_TASKS = exercises.length + practiceCards.length + dialogues.length + readingItems.length + clinicItems.length + listeningLessons.length + pictureMissions.length;

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
  // «План заняття»: memory only for this page visit — never written to storage (MOT-11), so a reload forgets it.
  const [session, setSession] = useState<ActiveSession | null>(null);
  // The learner's goals and the first-run mark: on this device, written only by the learner's own action.
  const [goals, setGoals] = useState<GoalRecord | null>(readGoals);
  useEffect(() => onGoalsChanged(() => setGoals(readGoals())), []);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [appearance, setAppearance] = useState<Appearance>(readAppearance);
  useEffect(() => { applyAppearance(appearance); }, [appearance]);
  const [theme, setTheme] = useState<Theme>(readTheme);
  useEffect(() => { applyTheme(theme); }, [theme]);
  const [font, setFont] = useState<FontChoice>(readFont);
  useEffect(() => { applyFont(font); }, [font]);
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
        {EMPTY_IN_RELEASE[view] && <NotReviewedYet onHome={() => goTo("home")} />}
        {loadError && <p className="feedback error" role="alert">Не вдалося прочитати локальний прогрес ({loadError}). Навчання працює, але нічого не буде збережено.</p>}
        {view === "home" && IN_RELEASE && (
          <p className="feedback" role="status" data-testid="release-notice">Збірка випуску: тут лише завдання, перевірені викладачем S2 (зараз {RELEASED_TASKS}).
            {RELEASED_TASKS === 0 && " Поки що жодного — розділи покажуть «Ще не перевірено»."}</p>
        )}
        {view === "home" && <HomeScreen state={snapshot?.state ?? null} guide={showGuide} go={v => goTo(v)} openPlace={id => { setPlace(id); goTo("place"); }}
          session={session} onSession={setSession} start={(v, id) => goTo(v, id)} goals={goals} onGoals={setGoals} />}
        {view === "place" && place && snapshot && <PlaceScreen id={place} state={snapshot.state} guide={showGuide} onHome={() => goTo("home")}
          open={(v, id) => goTo(v === "dialogue" ? "dialogue" : v === "writing" ? "writing" : v === "practice" ? "practice" : v === "listening" ? "listening" : "reading", id)} />}
        {view === "offline" && <OfflineScreen onHome={() => goTo("home")} />}
        {view === "data" && snapshot && <DataScreen repository={repository} examRepository={examRepository} voiceStore={voiceStore} snapshot={snapshot} onErased={s => { setSnapshot(s); setSession(null); setGoals(readGoals()); }} onHome={() => goTo("home")} />}
        {view === "exam" && !EMPTY_IN_RELEASE.exam && <ExamScreen repository={examRepository} voiceStore={voiceStore} onHome={() => goTo("home")}
          onLearn={skill => goTo(skill === "reading" ? "reading" : skill === "listening" ? "listening" : skill === "writing" ? "writing" : "dialogue")} />}
        {view === "reading" && !EMPTY_IN_RELEASE.reading && snapshot && <ReadingScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => goTo("home")} initialId={startId} />}
        {view === "practice" && !EMPTY_IN_RELEASE.practice && snapshot && <PracticeScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => goTo("home")} initialCardId={startId} />}
        {view === "pictures" && !EMPTY_IN_RELEASE.pictures && snapshot && <PictureMissionScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => goTo("home")} />}
        {view === "media" && snapshot && <MediaScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => goTo("home")} />}
        {view === "dialogue" && !EMPTY_IN_RELEASE.dialogue && snapshot && <DialogueScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => goTo("home")} initialId={startId} />}
        {view === "writing" && !EMPTY_IN_RELEASE.writing && snapshot && <WritingClinicScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => goTo("home")} initialId={startId} />}
        {view === "diagnostic" && !EMPTY_IN_RELEASE.diagnostic && snapshot && <DiagnosticScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => goTo("home")} onListening={() => goTo("listening")} />}
        {view === "listening" && !EMPTY_IN_RELEASE.listening && snapshot && <ListeningScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => goTo("home")} initialId={startId} />}
        {view === "retention" && snapshot && <RetentionScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => goTo("home")} />}
        {view === "progress" && snapshot && <ProgressScreen state={snapshot.state} examRepository={examRepository} onHome={() => goTo("home")} onLearn={() => goTo("mission")} onRetention={() => goTo("retention")} onPlace={id => { setPlace(id); goTo("place"); }} />}
        {view === "import" && snapshot && <ImportScreen repository={repository} current={snapshot} onImported={s => { setSnapshot(s); setSession(null); }} onHome={() => goTo("home")} />}
        {view === "review" && !IN_RELEASE && <ReviewerScreen onHome={() => { history.replaceState(null, "", location.pathname); goTo("home"); }} />}
        {view === "workshop" && !EMPTY_IN_RELEASE.workshop && snapshot && <WorkshopScreen state={snapshot.state} guide={showGuide} onHome={() => goTo("home")} open={id => goTo("mission", id, true)} />}
        {view === "mission" && !EMPTY_IN_RELEASE.mission && snapshot && (
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
        <p className="font-choice"><label htmlFor="font">Шрифт</label>{" "}
          <select id="font" value={font} onChange={e => setFont(e.target.value as FontChoice)}>
            <option value="brand">Фірмові: Arsenal і Finlandica</option><option value="system">Звичний шрифт пристрою</option>
          </select></p>
        <p className="guide-choice"><label><input type="checkbox" checked={guide} onChange={e => setGuide(e.target.checked)} /> Показувати Господаря</label></p>
        {IN_RELEASE
          ? <p data-channel="release">Збірка випуску: лише завдання, перевірені викладачем S2.</p>
          : <p><a href="#review">Режим рецензента S2 (для викладачів)</a>{learnerR08Tasks.length === 0 && " · завдання «значення → форма» з'являться після рецензії"}</p>}
      </footer>
    </>
  );
}
