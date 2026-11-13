import { delayedTransferQueue, dueCards, hospodarHome, hospodarMoment, localDate, placeProgress, workshopStatus, practiceDue, skillPracticeCounts, skillRetentionQueue, todayPlan,
  type LearnerState, type PlaceId, type Skill, type TodayAction } from "@hospodar/domain";
import { placeIndex, places } from "../content/places.ts";
import { FAMILIES, workshopItems } from "../content/workshop.ts";
import { PlaceGlyph } from "../ui/PlaceGlyph.tsx";
import { Hospodar } from "../ui/Hospodar.tsx";
import { exercises } from "../content/cloze.ts";
import { practiceCards } from "../content/practice.ts";
import { skillRetentionBank } from "../content/skillRetention.ts";
import { transferBank } from "../content/transfer.ts";
import { Icon, type IconName } from "../ui/icons.tsx";
import { SKILL_FI, SKILL_UK } from "../ui/MissionChrome.tsx";
import { tr, type UiLocale } from "../uiLocale.ts";

export type HomeTarget = "workshop" | "mission" | "exam" | "reading" | "listening" | "writing" | "dialogue" | "practice" | "pictures" | "media"
  | "diagnostic" | "retention" | "progress" | "import" | "data" | "offline";
const SKILL_VIEW: Record<Skill, HomeTarget> = { reading: "reading", listening: "listening", writing: "writing", speaking: "dialogue" };
const SKILL_WHAT: Record<Skill, string> = {
  reading: "Тексти з питаннями: спершу відповідь, потім доказ у тексті",
  listening: "Записи: спершу слухаєш і відповідаєш, потім текст",
  writing: "Майстерня письма: твій текст, розбір, нова ситуація",
  speaking: "Діалоги з уточненнями і зміною умов",
};
const ACCUSATIVE: Record<Skill, string> = { reading: "читання", listening: "аудіювання", writing: "письмо", speaking: "говоріння" };
const SKILL_NL: Record<Skill, string> = { reading: "Lezen", listening: "Luisteren", writing: "Schrijven", speaking: "Spreken" };
const SKILL_WHAT_NL: Record<Skill, string> = {
  reading: "Teksten en vragen: eerst antwoorden, daarna het bewijs in de tekst zoeken",
  listening: "Audio: eerst luisteren en antwoorden, daarna de transcriptie",
  writing: "Schrijfwerkplaats: jouw tekst, feedback en een nieuwe situatie",
  speaking: "Dialogen met vervolgvragen en veranderende situaties",
};

/** What the learner reads for each recommended step: the action, why now, and the button. Never a level or a score. */
function describe(a: TodayAction): { title: string; why: string; cta: string; go: HomeTarget } {
  switch (a.kind) {
    case "delayed_check": return { title: "Сьогодні є відкладена перевірка: нове завдання без підказки.", go: "retention", cta: "Пройти",
      why: "Чому зараз: минуло 7, 14 або 30 днів після заняття. Так видно, що справді залишилося в пам'яті." };
    case "phrase_review": return { title: `Повтори фрази, які минулого разу не вдалося згадати: ${a.count}.`, go: "practice", cta: "Повторити фрази",
      why: "Чому зараз: настав запланований день повторення саме цих фраз." };
    case "grammar_review": return { title: `Повтори граматичні завдання, заплановані на сьогодні: ${a.count}.`, go: "mission", cta: "Повторити граматику",
      why: "Чому зараз: настав запланований день повторення цих завдань." };
    case "diagnostic": return { title: "Почни з короткого знайомства: по одному завданню на читання, письмо й говоріння.", go: "diagnostic", cta: "Почати діагностику",
      why: "Чому з цього: так застосунок побачить твої перші відповіді. Рівень чи оцінку він не визначає." };
    case "skill_practice": return { title: `Потренуй ${ACCUSATIVE[a.skill!]}.`, go: SKILL_VIEW[a.skill!], cta: `Тренувати ${ACCUSATIVE[a.skill!]}`,
      why: a.reason === "never_practised" ? "Чому це: з цієї навички ще немає жодної твоєї відповіді."
        : `Чому це: тут найменше практики серед чотирьох навичок — збережено відповідей: ${a.count}.` };
  }
}

export function HomeScreen({ state, go, openPlace, guide = false, locale = "uk" }: { state: LearnerState | null; go: (v: HomeTarget) => void; openPlace: (id: PlaceId) => void; guide?: boolean; locale?: UiLocale }) {
  const L = (uk: string, nl: string) => tr(locale, uk, nl);
  const done = state?.attempts.length ?? 0;
  const grammarDue = state ? dueCards(state).filter(c => exercises.some(e => e.id === c.id)).length : 0;
  const phrasesDue = state ? practiceDue(state, practiceCards).length : 0;
  const skillQueue = state ? skillRetentionQueue(state, skillRetentionBank) : [];
  const delayedDue = state ? delayedTransferQueue(state, transferBank).filter(q => q.due).length + skillQueue.filter(q => q.due).length : 0;
  const practice = state ? skillPracticeCounts(state) : { reading: 0, listening: 0, writing: 0, speaking: 0 };
  const plan = state ? todayPlan({ delayedDue, phrasesDue, grammarDue, practice,
    hasAnyEvidence: state.attempts.length > 0 || state.diagnostics.length > 0 }) : [];
  const [first, ...rest] = plan.map(describe);
  const tileState = (skill: Skill) => {
    const q = skillQueue.find(x => x.skill === skill);
    const saved = practice[skill] ? `Збережено відповідей: ${practice[skill]}` : "Ще не тренувалося";
    const later = q?.due ? " · відкладена перевірка сьогодні" : q?.anchorDate && q.nextDay ? ` · перевірка через ${q.nextDay - q.ageDays} дн.` : "";
    return saved + later;
  };
  const estate = state ? placeProgress(state, placeIndex) : [];
  const doors = estate.filter(p => p.doorOpen).length, keys = estate.reduce((n, p) => n + p.keys, 0);
  const workshop = state ? workshopStatus(state, FAMILIES, workshopItems, localDate()) : [];
  const weakSpots = workshop.filter(w => w.isBottleneck).length, retestToday = workshop.some(w => w.retestDue);
  const more: { id: string; icon: IconName; label: string; note: string; to: HomeTarget }[] = [
    { id: "workshop", icon: "grammar", label: `Майстерня слабких місць${retestToday ? " · перевірка сьогодні" : weakSpots ? ` · слабких місць: ${weakSpots}` : ""}`,
      note: "Нові завдання впереміш на твої повторювані помилки", to: "workshop" },
    { id: "practice", icon: "practice", label: `Практика без підказки${phrasesDue > 0 ? ` · повторити ${phrasesDue}` : ""}`, note: "Фрази, реакції, власна думка", to: "practice" },
    { id: "pictures", icon: "photo", label: "Фото-місії", note: "Опиши справжнє місце у Фінляндії", to: "pictures" },
    { id: "media", icon: "media", label: "Медіатека", note: "Живі голоси й відео з джерелами", to: "media" },
    { id: "diagnostic", icon: "start", label: state?.diagnostics.some(d => d.skill === "writing") ? "Стартова діагностика (ще раз)" : "Стартова діагностика", note: "Короткі завдання без оцінки рівня", to: "diagnostic" },
  ];

  return (
    <section aria-labelledby="home-title">
      <h1 id="home-title">{L("Що сьогодні робимо?", "Wat gaan we vandaag doen?")}</h1>

      {first && (
        <section className="today" aria-labelledby="today-title">
          <h2 id="today-title" className="today-kicker">{L("Твій наступний крок", "Jouw volgende stap")}</h2>
          <p className="today-title">{first.title}</p>
          <p className="today-why">{first.why}</p>
          <div className="actions"><button type="button" className="btn" onClick={() => go(first.go)}>{first.cta}</button></div>
          {rest.length > 0 && (
            <ul className="today-rest" aria-label={L("Також на сьогодні", "Ook voor vandaag")}>
              {rest.map(r => <li key={r.cta}><span>{r.title}</span> <button type="button" className="btn secondary" onClick={() => go(r.go)}>{r.cta}</button></li>)}
            </ul>
          )}
          <p className="muted today-count" aria-live="polite">{L("Виконано місій:", "Voltooide opdrachten:")} <strong>{done}</strong> · {L("на повторення сьогодні:", "vandaag te herhalen:")} <strong>{grammarDue}</strong></p>
        </section>
      )}

      <div className="mode-gateway">
        <button type="button" className="mode-entry mode-entry-learn" onClick={() => go("mission")}>
          <span className="mode-number">01</span>
          <strong>{L("Навчання", "Leren")}</strong>
          <small>{L("Граматика в контексті: спершу власна відповідь, потім підказка й самовиправлення.", "Grammatica in context: eerst zelf antwoorden, daarna hints en zelfcorrectie.")}</small>
          <span className="mode-cta">{done ? L("Продовжити", "Verdergaan") : L("Почати місію", "Opdracht starten")} →</span>
        </button>
        <button type="button" className="mode-entry mode-entry-exam" onClick={() => go("exam")} aria-describedby="exam-note">
          <span className="mode-number">02</span>
          <strong>{L("Симуляція YKI", "YKI-oefenexamen")}</strong>
          <small id="exam-note">{L("Тренувальна репетиція з 4 навичок, без підказок. Не офіційний YKI: правила цифрового іспиту 2027 ще не підтверджено.", "Oefenexamen met vier vaardigheden, zonder hints. Niet officieel: de regels voor het digitale YKI-examen van 2027 zijn nog niet bevestigd.")}</small>
          <span className="mode-cta">{L("Почати репетицію", "Oefenexamen starten")} →</span>
        </button>
      </div>

      {/* «Моє господарство»: the name made visible — life in Finland as nine places. Game elements only where research
          allows them: free choice, never locked, a key only for a correct first independent answer, nothing decays (R08-MOT). */}
      <nav className="estate" aria-labelledby="estate-title">
        <h2 id="estate-title">{L("Моє господарство у Фінляндії", "Mijn leefwereld in Finland")}</h2>
        {guide && state && <Hospodar says={hospodarHome(hospodarMoment(state, new Date()), new Date())} />}
        <p className="estate-about">{L("Господар — той, хто сам дає раду своїм справам. Обери місце: двері відчиняються після твоєї першої спроби, ключ — за кожну правильну першу відповідь без підказки. Нічого не замкнено й нічого не згорає.", "Kies een plek uit het dagelijks leven. Na je eerste poging gaat de deur open; elk juist eerste antwoord zonder hints geeft een sleutel. Niets zit op slot en je verliest geen sleutels.")}</p>
        <ul className="estate-grid">
          {places.map(pl => {
            const p = estate.find(x => x.place === pl.id);
            return (
              <li key={pl.id}><button type="button" className="place-tile" data-testid={`place-${pl.id}`} data-door={p?.doorOpen ? "open" : "closed"} onClick={() => openPlace(pl.id)}>
                <PlaceGlyph open={Boolean(p?.doorOpen)} />
                <span className="place-tile-text"><strong lang={locale === "nl" ? "fi" : "uk"}>{locale === "nl" ? pl.title_fi : pl.title_uk}</strong><span lang="fi" className="place-tile-fi">{pl.title_fi}</span>
                  <small>{p?.doorOpen ? <><Icon name="key" size={15} /> {L("ключів:", "sleutels:")} {p.keys} · {L("спроб фінською:", "pogingen in het Fins:")} {p.practice}</> : L("Двері ще зачинені", "Deur nog niet geopend")}</small></span>
              </button></li>
            );
          })}
        </ul>
        <p className="muted estate-count">{L("Відчинено дверей:", "Geopende deuren:")} <strong>{doors}</strong> {L("з", "van")} {places.length} · {L("ключів:", "sleutels:")} <strong>{keys}</strong></p>
      </nav>

      <nav aria-labelledby="skills-title">
        <h2 id="skills-title">{L("Чотири навички", "Vier vaardigheden")}</h2>
        <ul className="skill-grid">
          {(Object.keys(SKILL_VIEW) as Skill[]).map(skill => (
            <li key={skill}>
              <button type="button" className="skill-tile" data-accent={skill} data-testid={`nav-${skill}`} onClick={() => go(SKILL_VIEW[skill])}>
                <span className="skill-tile-head"><Icon name={skill} size={24} /><strong>{locale === "nl" ? SKILL_NL[skill] : SKILL_UK[skill]}</strong><span lang="fi" className="skill-tile-fi">{SKILL_FI[skill]}</span></span>
                <span className="skill-tile-what">{locale === "nl" ? SKILL_WHAT_NL[skill] : SKILL_WHAT[skill]}</span>
                <small>{tileState(skill)}</small>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-labelledby="more-title">
        <h2 id="more-title">{L("Ще вправи", "Meer oefeningen")}</h2>
        <ul className="more-grid">
          {more.map(m => (
            <li key={m.id}><button type="button" className="more-tile" data-testid={`nav-${m.id}`} onClick={() => go(m.to)}>
              <Icon name={m.icon} size={22} /><span><strong>{m.label}</strong><small>{m.note}</small></span>
            </button></li>
          ))}
        </ul>
      </nav>

      <nav className="utility" aria-label={L("Прогрес і дані", "Voortgang en gegevens")}>
        <button type="button" className="link-btn" onClick={() => go("progress")}><Icon name="steps" size={18} /> {L("Мій прогрес", "Mijn voortgang")}</button>
        <button type="button" className="link-btn" onClick={() => go("data")}>{L("Мої дані: копія й видалення", "Mijn gegevens: back-up en verwijderen")}</button>
        <button type="button" className="link-btn" onClick={() => go("offline")}>{L("Офлайн-доступ", "Offline toegang")}</button>
        <button type="button" className="link-btn" onClick={() => go("import")}>{L("Перенести прогрес з попередньої версії", "Voortgang uit vorige versie importeren")}</button>
      </nav>
      <p className="qualification">{L("Навчання дозволяє підказки після твоєї відповіді — симуляція їх приховує. Вправи — чернетки, ще не перевірені викладачем фінської як другої мови (S2).", "Tijdens het leren kun je na je antwoord hints krijgen; tijdens het oefenexamen niet. De oefeningen zijn concepten die nog niet door een docent Fins als tweede taal (S2) zijn beoordeeld.")}</p>
    </section>
  );
}
