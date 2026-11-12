import { HOSPODAR_WORKSHOP, localDate, workshopStatus, type FamilyStatus, type LearnerState } from "@hospodar/domain";
import { exercises } from "../content/cloze.ts";
import { FAMILIES, familyInfo, tagLabel, workshopItems } from "../content/workshop.ts";
import { Hospodar } from "../ui/Hospodar.tsx";
import { Eyebrow } from "../ui/MissionChrome.tsx";
import { TrustNote } from "../ui/TrustNote.tsx";

const uaDate = (d: string) => d.split("-").reverse().join(".");
const tagOf = (id: string) => exercises.find(e => e.id === id)?.grammar_tag ?? "";
/** A list of forms, each name in its own language (Finnish grammar terms vs Ukrainian descriptions). */
function Forms({ tags, sep }: { tags: string[]; sep: string }) {
  return <>{tags.map((t, i) => { const l = tagLabel(t); return <span key={`${t}-${i}`}>{i > 0 && sep}<span lang={l.lang}>{l.text}</span></span>; })}</>;
}

/**
 * «Майстерня слабких місць» (methods error-bottleneck-deliberate, interleaving-grammar; PSY-06, COG-10, GL-03).
 * Outside any task: it lists families of confusable forms, marks the ones where the learner's FIRST answer was
 * wrong on two or more tasks, and opens a set of new tasks mixed across forms; seven days after the last practice
 * the next new task is a delayed check. Nothing here is a level, a score or a YKI estimate.
 */
export function WorkshopScreen({ state, guide = false, open, onHome }: {
  state: LearnerState; guide?: boolean; open: (taskId: string) => void; onHome: () => void;
}) {
  const statuses = workshopStatus(state, FAMILIES, workshopItems, localDate());
  const anyAttempt = statuses.some(s => s.attempted > 0);
  const firstBottleneck = statuses.find(s => s.isBottleneck)?.family;

  return (
    <section className="panel workshop" data-accent="grammar" aria-labelledby="ws-title">
      <Eyebrow accent="grammar">Навчання · майстерня слабких місць</Eyebrow>
      <h1 id="ws-title">Майстерня слабких місць</h1>
      <p>Сюди потрапляє родина схожих форм, коли твоя <strong>перша</strong> відповідь була неправильною щонайменше у двох різних завданнях.
        Набір — 3–5 нових завдань, яких ти ще не бачив(ла), упереміш зі схожими формами. Через 7 днів після останньої практики наступне нове завдання стає перевіркою без підказки.</p>
      {guide && <Hospodar size={96} says={HOSPODAR_WORKSHOP} />}
      <TrustNote many>Завдання й ключі — з наявного банку граматики; нових відповідей тут не вигадано.</TrustNote>
      {!anyAttempt && (
        <p className="feedback" role="status">Ще немає твоїх відповідей у граматичних місіях, тож слабких місць не видно. Можна вже зараз потренувати будь-яку родину форм.</p>
      )}
      <ul className="workshop-list">
        {statuses.map(s => <Family key={s.family} s={s} primary={s.family === firstBottleneck} open={open} />)}
      </ul>
      <div className="actions"><button type="button" className="btn secondary" onClick={onHome}>На головну</button></div>
    </section>
  );
}

function Family({ s, primary, open }: { s: FamilyStatus; primary: boolean; open: (id: string) => void }) {
  const info = familyInfo(s.family);
  const cta = s.retestDue ? "Пройти перевірку на новому завданні" : s.isBottleneck ? "Почати набір" : "Потренувати";
  return (
    <li className="workshop-family" data-family={s.family} data-bottleneck={s.isBottleneck ? "yes" : "no"}>
      <h2>{info.title_uk}</h2>
      {s.isBottleneck && <p className="workshop-flag"><strong>Твоє слабке місце</strong> — перша відповідь неправильна у {s.wrongFirst} різних завданнях.</p>}
      <p className="muted"><Forms tags={[...info.tags]} sep=" · " /></p>
      {s.attempted > 0 && <p>Твоїх перших відповідей тут: {s.attempted}, з них неправильних: {s.wrongFirst}.</p>}
      <p className="muted">{info.why_uk}</p>
      {s.retestDue && <p className="feedback warn" role="status">Сьогодні — відкладена перевірка: минуло 7 днів після останньої практики. Підказок не буде до твоєї першої відповіді.</p>}
      {!s.retestDue && s.retestOn && <p>Перевірка на новому завданні — з {uaDate(s.retestOn)} (7 днів після останньої практики).</p>}
      {s.delayed.length > 0 && (
        <ul className="skill-lines" aria-label="Відкладені перевірки">
          {s.delayed.map(d => <li key={d.taskId}>Через {d.gapDays} дн. на новому завданні (<Forms tags={[tagOf(d.taskId)]} sep="" />): {d.correct ? "правильно з першої спроби" : "ще не так"}</li>)}
        </ul>
      )}
      {s.set.length > 0 ? (
        <>
          <p>У наборі: {s.set.length} {s.set.length === 1 ? "нове завдання" : "нових завдань"} — <Forms tags={s.set.map(tagOf)} sep=" → " />.
            {s.thin && " Нових завдань цієї родини майже не лишилося; більше з'явиться після рецензії S2-викладача."}</p>
          <div className="actions"><button type="button" className={primary ? "btn" : "btn secondary"} data-testid={`workshop-${s.family}`} onClick={() => open(s.set[0]!)}>{cta}</button></div>
        </>
      ) : (
        <p className="muted">Нових завдань цієї родини більше немає: ти бачив(ла) всі. Нові з'являться після рецензії S2-викладача; повторення — у звичайних місіях за розкладом.</p>
      )}
    </li>
  );
}
