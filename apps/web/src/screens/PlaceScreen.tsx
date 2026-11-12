import { placeProgress, type LearnerState, type PlaceId } from "@hospodar/domain";
import { placeIndex, places, practiceIdsOf, type Quest, type QuestView } from "../content/places.ts";
import { Icon } from "../ui/icons.tsx";
import { PlaceGlyph } from "../ui/PlaceGlyph.tsx";
import { TrustNote } from "../ui/TrustNote.tsx";

/**
 * One place of «Моє господарство»: what being "господар" here means in real life, the real missions
 * of this place, the honest keys and the open door. Never locked; nothing decays (R08-MOT, GAM-01).
 */
export function PlaceScreen({ id, state, open, onHome }: {
  id: PlaceId; state: LearnerState; open: (view: QuestView, itemId: string) => void; onHome: () => void;
}) {
  const place = places.find(p => p.id === id)!;
  const progress = placeProgress(state, placeIndex).find(p => p.place === id)!;
  const tried = (prefix: string) => state.diagnostics.some(d => d.taskId === prefix || d.taskId.startsWith(`${prefix}-`));
  const status = (q: Quest) => {
    if (q.view !== "practice") return tried(q.itemId) ? "ти вже пробував(ла)" : "ще не пробував(ла)";
    const ids = practiceIdsOf(id, q.practiceKind!);
    return `карток: ${ids.length} · пройдено ${ids.filter(tried).length}`;
  };
  const go = (q: Quest) => {
    if (q.view !== "practice") return open(q.view, q.itemId);
    const ids = practiceIdsOf(id, q.practiceKind!);
    open("practice", ids.find(c => !tried(c)) ?? ids[0]!);
  };

  return (
    <section className="panel place" aria-labelledby="place-title">
      <p className="eyebrow"><Icon name="home" size={18} /> <span>Моє господарство</span></p>
      <div className="place-head">
        <PlaceGlyph open={progress.doorOpen} size={72} />
        <div>
          <h1 id="place-title">{place.title_uk}</h1>
          <p className="place-fi" lang="fi">{place.title_fi}</p>
        </div>
      </div>
      <p className="place-goal"><strong>Бути тут господарем:</strong> {place.goal_uk}</p>
      <TrustNote many>Письмо й говоріння не оцінюються автоматично.</TrustNote>

      <dl className="place-status">
        <div><dt>Двері</dt><dd data-testid="place-door">{progress.doorOpen ? "відчинені — ти вже пробував(ла) тут сам(а)" : "ще зачинені — відчиняться після твоєї першої спроби"}</dd></div>
        <div><dt><Icon name="key" size={18} /> Ключі</dt><dd data-testid="place-keys">{progress.keys} <span className="muted">— правильні перші відповіді без підказки</span></dd></div>
        <div><dt>Спроби фінською</dt><dd>{progress.practice} <span className="muted">— твої тексти й відповіді без оцінки; це теж практика</span></dd></div>
      </dl>

      <h2>Справи тут</h2>
      <ul className="choices" aria-label={`Справи: ${place.title_uk}`}>
        {place.quests.map(q => (
          <li key={`${q.view}-${q.itemId}`}><button type="button" className="choice" onClick={() => go(q)}>
            <span>{q.kindUk} · <span lang={q.titleLang}>{q.title}</span></span>
            <small>{status(q)}</small>
          </button></li>
        ))}
      </ul>

      <h2>Справа в реальному житті</h2>
      <p>{place.deed_uk}</p>
      <p className="muted">Необов'язково. Застосунок цього не відстежує й не перевіряє — це твоя справа, не завдання.</p>

      <div className="actions"><button type="button" className="btn secondary" onClick={onHome}>На головну</button></div>
    </section>
  );
}
