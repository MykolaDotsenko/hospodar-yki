/** Release build, pool empty (docs/29 stage 1): say so plainly instead of showing unreviewed drafts. */
export function NotReviewedYet({ onHome }: { onHome: () => void }) {
  return (
    <section className="panel" aria-labelledby="not-reviewed-title">
      <h1 id="not-reviewed-title">Ще не перевірено</h1>
      <p>У цій збірці показуються лише завдання, які перевірив і схвалив викладач фінської як другої мови (S2). Для цього розділу таких завдань поки немає.</p>
      <p className="muted">Неперевірені завдання тут не показуються навмисно: краще менше завдань, ніж неперевірена фінська.</p>
      <div className="actions"><button type="button" className="btn secondary" onClick={onHome}>На головну</button></div>
    </section>
  );
}
