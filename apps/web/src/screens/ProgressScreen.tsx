import { useState } from "react";
import { delayedTransferQueue, dueCards, type LearnerState, type Skill } from "@hospodar/domain";
import { exercises } from "../content/cloze.ts";
import { transferBank } from "../content/transfer.ts";

const SKILLS: Array<{ id: Skill; uk: string; fi: string }> = [
  { id: "reading", uk: "Читання", fi: "Tekstin ymmärtäminen" }, { id: "listening", uk: "Аудіювання", fi: "Puheen ymmärtäminen" },
  { id: "writing", uk: "Письмо", fi: "Kirjoittaminen" }, { id: "speaking", uk: "Говоріння", fi: "Puhuminen" },
];

/** UX-05 / UIO-08 / IV-REQ-09: separate signals per skill, actionable next steps, no %, no level. */
export function ProgressScreen({ state, onHome, onLearn, onRetention }: { state: LearnerState; onHome: () => void; onLearn: () => void; onRetention: () => void }) {
  const [tab, setTab] = useState<"learn" | "exam">("learn");
  const a = state.attempts;
  const independent = a.filter(x => x.firstCorrect).length;
  const guided = a.filter(x => !x.firstCorrect && x.repairCorrect).length;
  const queue = delayedTransferQueue(state, transferBank);
  const retDone = queue.reduce((n, q) => n + q.completed.length, 0);
  const retMissed = queue.reduce((n, q) => n + q.missed.length, 0);
  const retDue = queue.filter(q => q.due).length;
  const reviews = dueCards(state).filter(c => exercises.some(e => e.id === c.id)).length;
  const actions = [
    ...(reviews ? [{ text: `Повторити ${reviews} заплановане(-их) завдання`, go: onLearn }] : []),
    ...(retDue ? [{ text: "Пройти відкладену перевірку (нова ситуація)", go: onRetention }] : []),
  ].slice(0, 2);
  return (
    <section className="panel" aria-labelledby="prog-title">
      <p className="eyebrow">Мій прогрес</p>
      <h1 id="prog-title">Що вже вмієш і що далі</h1>
      <div className="tabs" role="tablist" aria-label="Розділ прогресу">
        <button type="button" role="tab" aria-selected={tab === "learn"} className="tab" onClick={() => setTab("learn")}>Навчання</button>
        <button type="button" role="tab" aria-selected={tab === "exam"} className="tab" onClick={() => setTab("exam")}>Пробні іспити</button>
      </div>
      {tab === "exam" ? (
        <p role="tabpanel">Пробні іспити ще не перенесено в нову версію; їхні результати зберігаються окремо від навчання і не змішуються з ним.</p>
      ) : (
        <div role="tabpanel">
          <h2>Сьогодні</h2>
          {actions.length ? <ul className="choices">{actions.map(x => <li key={x.text}><button type="button" className="choice" onClick={x.go}>{x.text}</button></li>)}</ul>
            : <p>Немає запланованих повторень. Можна почати нову місію.</p>}
          <h2>Граматика в контексті</h2>
          <ul>
            <li>Самостійно правильно з першої спроби: <strong>{independent}</strong> з {a.length}</li>
            <li>Виправлено з підказкою (не рахується як самостійне): <strong>{guided}</strong></li>
            <li>Власні речення в новій ситуації (без оцінки): <strong>{a.filter(x => x.transferText).length}</strong></li>
          </ul>
          <h2>Відкладені перевірки 7 / 14 / 30</h2>
          <ul>
            <li>Виконано (без оцінки): <strong>{retDone}</strong></li>
            <li>Пропущено вікон: <strong>{retMissed}</strong> — пропуск не зараховується заднім числом</li>
          </ul>
          <h2>Чотири навички</h2>
          <ul className="skill-lines">
            {SKILLS.map(s => {
              const xs = state.diagnostics.filter(d => d.skill === s.id);
              const scored = xs.filter(d => d.status === "scored");
              return (
                <li key={s.id}><strong>{s.uk}</strong> <span lang="fi" className="muted">· {s.fi}</span><br />
                  {xs.length === 0 ? "Ще не тренувалося в цій версії." :
                    `${scored.filter(d => d.correct).length} з ${scored.length} перевірених відповідей правильні; ${xs.length - scored.length} без оцінки (письмо/говоріння оцінює людина).`}
                </li>
              );
            })}
          </ul>
          <p className="muted">Це твої відповіді на цьому пристрої, а не рівень B1 і не прогноз YKI.</p>
        </div>
      )}
      <div className="actions"><button type="button" className="btn secondary" onClick={onHome}>На головну</button></div>
    </section>
  );
}
