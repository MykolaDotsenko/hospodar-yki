import { useState } from "react";
import { R08_CHOICE_UK, type R08Task } from "@hospodar/domain";
import { r08Drafts } from "../content/r08.ts";
import { R08MissionScreen } from "./R08MissionScreen.tsx";

/** S2 reviewer preview: walk each draft exactly as a learner would; nothing is stored. */
export function ReviewerScreen({ onHome }: { onHome: () => void }) {
  const [open, setOpen] = useState<R08Task | null>(null);
  if (open) return <R08MissionScreen key={open.id} task={open} preview onExit={() => setOpen(null)} />;
  return (
    <section className="panel" aria-labelledby="review-title">
      <p className="reviewer-banner" role="note">Режим рецензента S2 — для викладачів. Ці завдання ще не показуються учням.</p>
      <h1 id="review-title">Чернетки R08: значення → форма</h1>
      <p>Пройди кожне завдання як учень. Опублікувати його можна лише через <code>review_card</code> (статус <code>published</code>) після перевірки ключа, варіантів, значень і прав.</p>
      <ul className="choices" aria-label="Чернетки">
        {r08Drafts.map(t => (
          <li key={t.id}><button type="button" className="choice" onClick={() => setOpen(t)}>
            <span lang="fi">{t.prompt_fi}</span>
            <small>{t.id} · {R08_CHOICE_UK[t.semantic_relation]} · {t.learning_focus}</small>
          </button></li>
        ))}
      </ul>
      <div className="actions"><button type="button" className="btn secondary" onClick={onHome}>На головну</button></div>
    </section>
  );
}
