import { delayedTransferQueue, dueCards, HOSPODAR_HOME, hospodarMoment, placeProgress, practiceDue, skillPracticeCounts, skillRetentionQueue, todayPlan,
  type LearnerState, type PlaceId, type Skill, type TodayAction } from "@hospodar/domain";
import { placeIndex, places } from "../content/places.ts";
import { PlaceGlyph } from "../ui/PlaceGlyph.tsx";
import { Hospodar } from "../ui/Hospodar.tsx";
import { exercises } from "../content/cloze.ts";
import { practiceCards } from "../content/practice.ts";
import { skillRetentionBank } from "../content/skillRetention.ts";
import { transferBank } from "../content/transfer.ts";
import { Icon, type IconName } from "../ui/icons.tsx";
import { SKILL_FI, SKILL_UK } from "../ui/MissionChrome.tsx";

export type HomeTarget = "mission" | "exam" | "reading" | "listening" | "writing" | "dialogue" | "practice" | "pictures" | "media"
  | "diagnostic" | "retention" | "progress" | "import" | "data" | "offline";
const SKILL_VIEW: Record<Skill, HomeTarget> = { reading: "reading", listening: "listening", writing: "writing", speaking: "dialogue" };
const SKILL_WHAT: Record<Skill, string> = {
  reading: "Тексти з питаннями: спершу відповідь, потім доказ у тексті",
  listening: "Записи: спершу слухаєш і відповідаєш, потім текст",
  writing: "Майстерня письма: твій текст, розбір, нова ситуація",
  speaking: "Діалоги з уточненнями і зміною умов",
};
const ACCUSATIVE: Record<Skill, string> = { reading: "читання", listening: "аудіювання", writing: "письмо", speaking: "говоріння" };

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

export function HomeScreen({ state, go, openPlace, guide = false }: { state: LearnerState | null; go: (v: HomeTarget) => void; openPlace: (id: PlaceId) => void; guide?: boolean }) {
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
  const more: { id: string; icon: IconName; label: string; note: string; to: HomeTarget }[] = [
    { id: "practice", icon: "practice", label: `Практика без підказки${phrasesDue > 0 ? ` · повторити ${phrasesDue}` : ""}`, note: "Фрази, реакції, власна думка", to: "practice" },
    { id: "pictures", icon: "photo", label: "Фото-місії", note: "Опиши справжнє місце у Фінляндії", to: "pictures" },
    { id: "media", icon: "media", label: "Медіатека", note: "Живі голоси й відео з джерелами", to: "media" },
    { id: "diagnostic", icon: "start", label: state?.diagnostics.some(d => d.skill === "writing") ? "Стартова діагностика (ще раз)" : "Стартова діагностика", note: "Короткі завдання без оцінки рівня", to: "diagnostic" },
  ];

  return (
    <section aria-labelledby="home-title">
      <h1 id="home-title">Що сьогодні робимо?</h1>

      {first && (
        <section className="today" aria-labelledby="today-title">
          <h2 id="today-title" className="today-kicker">Твій наступний крок</h2>
          <p className="today-title">{first.title}</p>
          <p className="today-why">{first.why}</p>
          <div className="actions"><button type="button" className="btn" onClick={() => go(first.go)}>{first.cta}</button></div>
          {rest.length > 0 && (
            <ul className="today-rest" aria-label="Також на сьогодні">
              {rest.map(r => <li key={r.cta}><span>{r.title}</span> <button type="button" className="btn secondary" onClick={() => go(r.go)}>{r.cta}</button></li>)}
            </ul>
          )}
          <p className="muted today-count" aria-live="polite">Виконано місій: <strong>{done}</strong> · на повторення сьогодні: <strong>{grammarDue}</strong></p>
        </section>
      )}

      <div className="mode-gateway">
        <button type="button" className="mode-entry mode-entry-learn" onClick={() => go("mission")}>
          <span className="mode-number">01</span>
          <strong>Навчання</strong>
          <small>Граматика в контексті: спершу власна відповідь, потім підказка й самовиправлення.</small>
          <span className="mode-cta">{done ? "Продовжити" : "Почати місію"} →</span>
        </button>
        <button type="button" className="mode-entry mode-entry-exam" onClick={() => go("exam")} aria-describedby="exam-note">
          <span className="mode-number">02</span>
          <strong>Симуляція YKI</strong>
          <small id="exam-note">Тренувальна репетиція з 4 навичок, без підказок. Не офіційний YKI: правила цифрового іспиту 2027 ще не підтверджено.</small>
          <span className="mode-cta">Почати репетицію →</span>
        </button>
      </div>

      {/* «Моє господарство»: the name made visible — life in Finland as nine places. Game elements only where research
          allows them: free choice, never locked, a key only for a correct first independent answer, nothing decays (R08-MOT). */}
      <nav className="estate" aria-labelledby="estate-title">
        <h2 id="estate-title">Моє господарство у Фінляндії</h2>
        {guide && state && <Hospodar says={HOSPODAR_HOME[hospodarMoment(state, new Date())]} />}
        <p className="estate-about">Господар — той, хто сам дає раду своїм справам. Обери місце: двері відчиняються після твоєї першої спроби,
          ключ — за кожну правильну першу відповідь без підказки. Нічого не замкнено й нічого не згорає.</p>
        <ul className="estate-grid">
          {places.map(pl => {
            const p = estate.find(x => x.place === pl.id);
            return (
              <li key={pl.id}><button type="button" className="place-tile" data-testid={`place-${pl.id}`} data-door={p?.doorOpen ? "open" : "closed"} onClick={() => openPlace(pl.id)}>
                <PlaceGlyph open={Boolean(p?.doorOpen)} />
                <span className="place-tile-text"><strong>{pl.title_uk}</strong><span lang="fi" className="place-tile-fi">{pl.title_fi}</span>
                  <small>{p?.doorOpen ? <><Icon name="key" size={15} /> ключів: {p.keys} · спроб фінською: {p.practice}</> : "Двері ще зачинені"}</small></span>
              </button></li>
            );
          })}
        </ul>
        <p className="muted estate-count">Відчинено дверей: <strong>{doors}</strong> з {places.length} · ключів: <strong>{keys}</strong></p>
      </nav>

      <nav aria-labelledby="skills-title">
        <h2 id="skills-title">Чотири навички</h2>
        <ul className="skill-grid">
          {(Object.keys(SKILL_VIEW) as Skill[]).map(skill => (
            <li key={skill}>
              <button type="button" className="skill-tile" data-accent={skill} data-testid={`nav-${skill}`} onClick={() => go(SKILL_VIEW[skill])}>
                <span className="skill-tile-head"><Icon name={skill} size={24} /><strong>{SKILL_UK[skill]}</strong><span lang="fi" className="skill-tile-fi">{SKILL_FI[skill]}</span></span>
                <span className="skill-tile-what">{SKILL_WHAT[skill]}</span>
                <small>{tileState(skill)}</small>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-labelledby="more-title">
        <h2 id="more-title">Ще вправи</h2>
        <ul className="more-grid">
          {more.map(m => (
            <li key={m.id}><button type="button" className="more-tile" data-testid={`nav-${m.id}`} onClick={() => go(m.to)}>
              <Icon name={m.icon} size={22} /><span><strong>{m.label}</strong><small>{m.note}</small></span>
            </button></li>
          ))}
        </ul>
      </nav>

      <nav className="utility" aria-label="Прогрес і дані">
        <button type="button" className="link-btn" onClick={() => go("progress")}><Icon name="steps" size={18} /> Мій прогрес</button>
        <button type="button" className="link-btn" onClick={() => go("data")}>Мої дані: копія й видалення</button>
        <button type="button" className="link-btn" onClick={() => go("offline")}>Офлайн-доступ</button>
        <button type="button" className="link-btn" onClick={() => go("import")}>Перенести прогрес з попередньої версії</button>
      </nav>
      <p className="qualification">Навчання дозволяє підказки після твоєї відповіді — симуляція їх приховує. Вправи — чернетки, ще не перевірені викладачем фінської як другої мови (S2).</p>
    </section>
  );
}
