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
import { readUiLocale, storeUiLocale, tr, type UiLocale } from "./uiLocale.ts";

type View = "workshop" | "place" | "home" | "mission" | "review" | "import" | "retention" | "progress" | "listening" | "diagnostic" | "writing" | "dialogue" | "media" | "pictures" | "reading" | "practice" | "exam" | "data" | "offline";
const initialView = (): View => (location.hash === "#review" ? "review" : "home");

export function App({ repository, examRepository, voiceStore, markUrl }: { repository: LearnerRepository; examRepository: ExamRepository; voiceStore: VoiceStore; markUrl: string }) {
  const [view, setView] = useState<View>(initialView);
  const [locale, setLocale] = useState<UiLocale>(readUiLocale);
  const L = (uk: string, nl: string) => tr(locale, uk, nl);
  useEffect(() => { storeUiLocale(locale); }, [locale]);
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
      <header className="topbar" lang={locale}>
        <div className="wrap topbar-inner">
          <a className="brand" href="./" onClick={e => { e.preventDefault(); goTo("home"); }}>
            <img className="brand-mark" src={markUrl} alt="" width={46} height={46} />
            <span><strong>Hospodar YKI</strong><small>{L("Фінська для життя. Впевненість для YKI.", "Fins voor het dagelijks leven. Zelfvertrouwen voor YKI.")}</small></span>
          </a>
          <button type="button" className="pill toggle" aria-pressed={appearance === "calm"}
            onClick={() => setAppearance(a => (a === "calm" ? "standard" : "calm"))}>{L("Спокійний режим", "Rustige weergave")}</button>
          <label className="language-choice">{L("Мова інтерфейсу", "Interfacetaal")}{" "}
            <select aria-label={L("Мова інтерфейсу", "Interfacetaal")} value={locale} onChange={e => setLocale(e.target.value as UiLocale)}>
              <option value="uk">Українська</option><option value="nl">Nederlands (bèta)</option>
            </select>
          </label>
          <span className="pill" aria-live="polite">{view === "exam" ? L("02 · Симуляція YKI", "02 · YKI-oefenexamen") : view === "mission" || view === "workshop" || view === "retention" || view === "listening" || view === "diagnostic" || view === "writing" || view === "dialogue" || view === "media" || view === "pictures" || view === "reading" || view === "practice" ? L("01 · Навчання", "01 · Leren") : view === "review" ? L("Рецензент S2", "S2-review") : view === "import" || view === "progress" ? L("Прогрес", "Voortgang") : view === "data" ? L("Мої дані", "Mijn gegevens") : view === "offline" ? L("Офлайн", "Offline") : view === "place" ? L("Моє господарство", "Mijn leefwereld") : L("Головна", "Start")}</span>
        </div>
      </header>
      <main id="main" className="wrap" lang={view === "home" ? locale : "uk"} tabIndex={-1}>
        {updateReady && view !== "exam" && (                                   // WEB-06 update guard: never offered inside the exam
          <div className="feedback" role="status"><p>{L("Доступна нова версія застосунку. Прогрес збережено на пристрої й не зміниться.", "Er is een nieuwe versie beschikbaar. Je voortgang blijft op dit apparaat bewaard.")}</p>
            <button type="button" className="btn secondary" onClick={applyUpdate}>{L("Оновити зараз", "Nu bijwerken")}</button></div>
        )}
        {loadError && <p className="feedback error" role="alert">{L("Не вдалося прочитати локальний прогрес", "Lokale voortgang kon niet worden geladen")} ({loadError}). {L("Навчання працює, але нічого не буде збережено.", "Oefenen kan nog, maar resultaten worden niet opgeslagen.")}</p>}
        {view === "home" && <HomeScreen state={snapshot?.state ?? null} locale={locale} guide={showGuide} go={v => goTo(v)} openPlace={id => { setPlace(id); goTo("place"); }} />}
        {view === "place" && place && snapshot && <PlaceScreen id={place} state={snapshot.state} guide={showGuide} onHome={() => goTo("home")}
          open={(v, id) => goTo(v === "dialogue" ? "dialogue" : v === "writing" ? "writing" : v === "practice" ? "practice" : v === "listening" ? "listening" : "reading", id)} />}
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
        {view === "listening" && snapshot && <ListeningScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => goTo("home")} initialId={startId} />}
        {view === "retention" && snapshot && <RetentionScreen repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => goTo("home")} />}
        {view === "progress" && snapshot && <ProgressScreen state={snapshot.state} examRepository={examRepository} onHome={() => goTo("home")} onLearn={() => goTo("mission")} onRetention={() => goTo("retention")} onPlace={id => { setPlace(id); goTo("place"); }} />}
        {view === "import" && snapshot && <ImportScreen repository={repository} current={snapshot} onImported={setSnapshot} onHome={() => goTo("home")} />}
        {view === "review" && <ReviewerScreen onHome={() => { history.replaceState(null, "", location.pathname); goTo("home"); }} />}
        {view === "workshop" && snapshot && <WorkshopScreen state={snapshot.state} guide={showGuide} onHome={() => goTo("home")} open={id => goTo("mission", id, true)} />}
        {view === "mission" && snapshot && (
          <MissionScreen key={startId ?? "ranked"} repository={repository} snapshot={snapshot} onSaved={setSnapshot} onHome={() => goTo("home")}
            initialTaskId={startId} workshop={fromWorkshop ? { label: "До майстерні слабких місць", onBack: () => goTo("workshop") } : undefined} />
        )}
      </main>
      <footer className="wrap footer" lang={locale}>
        <p>{L("Незалежний навчальний застосунок, не пов\u0027язаний з OPH/JYU. Не є офіційним YKI. Прогрес зберігається лише на цьому пристрої.", "Onafhankelijke leerapp, niet verbonden aan OPH/JYU. Geen officieel YKI-examen. Voortgang wordt alleen op dit apparaat opgeslagen.")}</p>
        <p className="theme-choice"><label htmlFor="theme">{L("Тема", "Thema")}</label>{" "}
          <select id="theme" value={theme} onChange={e => setTheme(e.target.value as Theme)}>
            <option value="system">{L("Як у системі", "Systeem")}</option><option value="light">{L("Світла", "Licht")}</option><option value="dark">{L("Темна", "Donker")}</option>
          </select></p>
        <p className="guide-choice"><label><input type="checkbox" checked={guide} onChange={e => setGuide(e.target.checked)} /> {L("Показувати Господаря", "Toon de gids")}</label></p>
        <p><a href="#review">{L("Режим рецензента S2 (для викладачів)", "S2-reviewmodus (voor docenten)")}</a>{learnerR08Tasks.length === 0 && L(" · завдання «значення → форма» з\u0027являться після рецензії", " · oefeningen verschijnen na controle")}</p>
        {locale === "nl" && <p role="note">Nederlands is nog in bèta: het startscherm en de navigatie zijn vertaald. Oefeningen, andere schermen en de YKI-simulatie blijven in het Oekraïens en Fins.</p>}
      </footer>
    </>
  );
}
