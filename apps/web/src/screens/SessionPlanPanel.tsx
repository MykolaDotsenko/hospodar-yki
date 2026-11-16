import { useEffect, useRef } from "react";
import { blockProgress, planSession, PLACE_IDS, SESSION_MINUTES, YKI_SKILLS,
  type LearnerState, type PlaceId, type SessionBlock, type SessionChoice, type SessionMinutes, type SessionPlan, type YkiSkill } from "@hospodar/domain";
import { PLAN_DRAFTS, sessionCandidates, taskInfo } from "../content/session.ts";
import { familyInfo } from "../content/workshop.ts";
import { places } from "../content/places.ts";
import { SKILL_UK } from "../ui/MissionChrome.tsx";
import { Icon } from "../ui/icons.tsx";

/** A plan lives only in memory for this page visit (MOT-11: nothing about it is stored without consent). */
export interface ActiveSession { plan: SessionPlan; choice: SessionChoice }
export type PlanTarget = "reading" | "listening" | "writing" | "dialogue" | "practice" | "mission" | "retention" | "workshop";

const KIND_UK: Record<SessionBlock["kind"], string> = { review: "Повторення", weak_spot: "Слабке місце", new_task: "Нова справа" };
const placeTitle = (id: PlaceId | null) => (id ? places.find(p => p.id === id)?.title_uk ?? null : null);

export function makeSession(state: LearnerState, choice: SessionChoice, now: Date = new Date()): ActiveSession {
  return { plan: planSession(state, sessionCandidates(state, now), choice, { now, allowDrafts: PLAN_DRAFTS }), choice };
}

/** What the learner reads for a block: the thing to do and why now. Never a level, score or prediction. */
function describe(b: SessionBlock): { title: string; titleLang?: "fi"; place: string | null; why: string } {
  if (b.kind === "review") {
    const n = (k: string) => b.items.filter(i => i.kind === k).length;
    const parts = [n("delayed") && `відкладена перевірка — ${n("delayed")}`, n("phrase") && `фрази — ${n("phrase")}`, n("grammar") && `граматика — ${n("grammar")}`].filter(Boolean);
    const why = [b.reasons.includes("DELAYED_CHECK_DUE") ? "минуло 7, 14 або 30 днів — так видно, що справді залишилося в пам'яті" : null,
      b.reasons.includes("PHRASES_DUE") || b.reasons.includes("GRAMMAR_DUE") ? "настав запланований день повторення" : null].filter(Boolean).join("; ");
    return { title: `Повтори: ${parts.join(", ")}`, place: null,
      why: `Чому зараз: ${why}.${b.later > 0 ? ` Ще ${b.later} — іншим разом, надолужувати не треба.` : ""}` };
  }
  if (b.kind === "weak_spot") {
    const fam = b.family ? familyInfo(b.family) ?? null : null;
    return { title: fam ? fam.title_uk : "Майстерня слабких місць", place: null,
      why: b.reasons.includes("WEAK_SPOT_RETEST_DUE")
        ? "Чому зараз: минув тиждень після практики — нове завдання покаже, чи помилка не повертається."
        : "Чому: тут перша відповідь була неправильною щонайменше у двох різних завданнях. Нові завдання — впереміш." };
  }
  const t = taskInfo(b.items[0]!.id);
  const why = [b.reasons.includes("CHOSEN_SKILL") ? "ти обрав(-ла) цю навичку" : null,
    b.reasons.includes("CHOSEN_PLACE") ? "ти обрав(-ла) це місце" : null,
    b.reasons.includes("GOAL_PLACE") ? "це місце — твоя мета" : null,
    b.reasons.includes("NEVER_PRACTISED_SKILL") ? "з цієї навички ще немає жодної твоєї відповіді" : null,
    b.reasons.includes("LEAST_PRACTISED_SKILL") ? `тут найменше практики серед чотирьох навичок (збережено відповідей: ${b.exposure})` : null,
    "ти ще не пробував(-ла) це завдання"].filter(Boolean);
  return { title: t ? t.title_fi : b.items[0]!.id, titleLang: "fi", place: placeTitle(b.place), why: `Чому: ${why.join("; ")}.` };
}
export function SessionPlanPanel({ state, session, onSession, go }: {
  state: LearnerState; session: ActiveSession; onSession: (s: ActiveSession | null) => void; go: (v: PlanTarget, id: string | null) => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const created = session.plan.createdAt;
  useEffect(() => { heading.current?.focus(); }, [created]);
  const { plan, choice } = session;
  const progress = plan.blocks.map(b => blockProgress(b, state, plan.createdAt));
  const current = progress.findIndex(p => !p.complete);
  const rechoose = (next: Partial<SessionChoice>) => onSession(makeSession(state, { ...choice, ...next }));

  function open(b: SessionBlock, i: number) {
    const next = progress[i]!.pending[0] ?? b.items[0]!;
    if (b.kind === "weak_spot") return go("workshop", null);
    if (next.kind === "delayed") return go("retention", null);
    if (next.kind === "phrase") return go("practice", next.id);
    if (next.kind === "grammar") return go("mission", next.id);
    const t = taskInfo(next.id);
    if (t) go(t.view, t.id);
  }

  return (
    <section className="today session-plan" aria-labelledby="plan-title">
      <h2 id="plan-title" className="today-kicker" ref={heading} tabIndex={-1}>План заняття · ≈ {plan.total} хв із {plan.minutes}</h2>
      <div className="actions" role="group" aria-label="Скільки часу на заняття">
        {SESSION_MINUTES.map(m => (
          <button key={m} type="button" className="btn secondary" aria-pressed={choice.minutes === m} onClick={() => rechoose({ minutes: m })}>{m} хв</button>
        ))}
      </div>
      <div className="plan-choice">
        <label className="field" htmlFor="plan-skill">Нова справа — навичка</label>
        <select id="plan-skill" value={choice.skill ?? ""} onChange={e => rechoose({ skill: (e.target.value || null) as YkiSkill | null })}>
          <option value="">Будь-яка</option>
          {YKI_SKILLS.map(s => <option key={s} value={s}>{SKILL_UK[s]}</option>)}
        </select>
        <label className="field" htmlFor="plan-place">Місце</label>
        <select id="plan-place" value={choice.place ?? ""} onChange={e => rechoose({ place: (e.target.value || null) as PlaceId | null })}>
          <option value="">Будь-яке</option>
          {PLACE_IDS.map(p => <option key={p} value={p}>{placeTitle(p)}</option>)}
        </select>
      </div>

      {plan.missing === "CHOSEN_TASKS_TOO_LONG" && <p className="feedback" role="status">Нове завдання з таким вибором не вміщується в час, що лишився (письмо — приблизно 15 хв). Обери довше заняття або іншу навичку.</p>}
      {plan.missing === "NO_TASK_FOR_CHOICE" && <p className="feedback" role="status">З таким вибором нових завдань уже немає — спробуй іншу навичку чи місце.</p>}
      {plan.blocks.length === 0 && plan.missing === null && <p className="feedback" role="status">Поки немає завдань для плану на цьому пристрої.</p>}
      <ol className="plan-blocks">
        {plan.blocks.map((b, i) => {
          const d = describe(b), p = progress[i]!, main = i === current;
          return (
            <li key={`${b.kind}-${i}`} data-testid="plan-block" data-kind={b.kind} data-done={p.complete ? "yes" : "no"}>
              <p className="plan-kind">{KIND_UK[b.kind]}{b.skill ? ` · ${SKILL_UK[b.skill]}` : ""} · ≈ {b.minutes} хв</p>
              <p className="today-title"><span {...(d.titleLang ? { lang: d.titleLang } : {})}>{d.title}</span>{d.place && <small className="muted"> · {d.place}</small>}</p>
              <p className="today-why">{d.why}</p>
              <p className="muted" aria-live="polite">{p.complete ? <><Icon name="ok" size={16} /> Зроблено</> : p.of > 1 ? `Зроблено ${p.done} з ${p.of}` : "Ще не почато"}</p>
              {!p.complete && <div className="actions"><button type="button" className={main ? "btn" : "btn secondary"} onClick={() => open(b, i)}>{p.done > 0 ? "Продовжити" : "Почати"}</button></div>}
            </li>
          );
        })}
      </ol>
      {plan.blocks.length > 0 && current === -1 && <p className="feedback" role="status"><Icon name="ok" /> План на сьогодні виконано. Можна зупинитися або обрати щось ще.</p>}
      <p className="muted plan-note">Час приблизний — таймера немає. Будь-який крок можна пропустити, а зупинитися — будь-коли: нічого не згорає й надолужувати не треба. Нагадувань немає. План ніде не зберігається і зникне після перезавантаження сторінки.</p>
      <div className="actions"><button type="button" className="btn secondary" onClick={() => onSession(null)}>Закрити план</button></div>
    </section>
  );
}

/** The short entry on the «next step» card: choose a length to get a plan. */
export function PlanStart({ onPick }: { onPick: (m: SessionMinutes) => void }) {
  return (
    <div className="plan-start" role="group" aria-labelledby="plan-start-label">
      <span id="plan-start-label">Або склади план заняття:</span>
      {SESSION_MINUTES.map(m => <button key={m} type="button" className="btn secondary" onClick={() => onPick(m)}>{m} хв</button>)}
    </div>
  );
}
