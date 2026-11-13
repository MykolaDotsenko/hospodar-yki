import { coverageMap, SKILL_CAN_DO_UK, YKI_SKILLS, type LearnerState, type PlaceId, type YkiSkill } from "@hospodar/domain";
import { placeIndex, places } from "../content/places.ts";

/**
 * YKI preparation map (yki-constructive-alignment): nine YKI themes × four skills.
 * Each cell: LEARN tasks tried / available for that theme and skill. Counts only — never a percentage, level, grade or
 * pass prediction. An empty cell is the app's missing material, said plainly; exam tasks are never counted here.
 */
const SKILL_UK: Record<YkiSkill, string> = { reading: "Читання", listening: "Аудіювання", writing: "Письмо", speaking: "Говоріння" };

export function YkiMap({ state, onPlace }: { state: LearnerState; onPlace?: (id: PlaceId) => void }) {
  const m = coverageMap(state, placeIndex);
  const cell = (p: PlaceId, s: YkiSkill) => m.cells.find(c => c.place === p && c.skill === s)!;
  return (
    <section className="yki-map" aria-labelledby="yki-map-title">
      <h2 id="yki-map-title">Карта підготовки: 9 тем YKI × 4 навички</h2>
      <p className="muted">У клітинці — скільки завдань навчання ти вже спробував(ла) з доступних. «—» означає, що в застосунку для цього поєднання ще немає матеріалу; це не твоя слабкість. Завдання пробного іспиту тут не рахуються.</p>
      <p data-testid="yki-map-summary">Спробувано поєднань тема-навичка: <strong>{m.triedCells}</strong> з {m.availableCells} доступних. Без матеріалу поки: {m.contentGaps.length}.</p>
      <div className="yki-map-scroll">
        <table className="yki-map-table">
          <caption className="visually-hidden">Спробувані завдання за темами YKI й навичками</caption>
          <thead><tr><th scope="col">Тема</th>{YKI_SKILLS.map(s => <th key={s} scope="col">{SKILL_UK[s]}</th>)}</tr></thead>
          <tbody>
            {places.map(p => (
              <tr key={p.id} data-place={p.id}>
                <th scope="row">{onPlace
                  ? <button type="button" className="linkish" onClick={() => onPlace(p.id)}>{p.title_uk}</button>
                  : p.title_uk}</th>
                {YKI_SKILLS.map(s => {
                  const c = cell(p.id, s);
                  if (c.itemsTotal === 0) return <td key={s} data-cell="gap"><span aria-hidden="true">—</span><span className="visually-hidden">немає матеріалу</span></td>;
                  return (
                    <td key={s} data-cell={c.itemsTried ? "tried" : "untried"}>
                      <span aria-hidden="true">{c.itemsTried}/{c.itemsTotal}</span>
                      <span className="visually-hidden">спробувано {c.itemsTried} з {c.itemsTotal}</span>
                      {c.keys > 0 && <small className="muted"> · ключів {c.keys}</small>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>Що означає кожна навичка</h3>
      <dl className="place-status">
        {YKI_SKILLS.map(s => <div key={s}><dt>{SKILL_UK[s]}</dt><dd>{SKILL_CAN_DO_UK[s]}</dd></div>)}
      </dl>
      <p className="muted">Опис дій — редакційний підсумок публічних описів завдань YKI keskitaso, не критерії оцінювання OPH. Ключ — правильна перша відповідь без підказки; письмо й говоріння не оцінюються автоматично.</p>
    </section>
  );
}
