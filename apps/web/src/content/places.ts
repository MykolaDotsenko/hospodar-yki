/**
 * «Моє господарство»: nine everyday places of life in Finland = the nine YKI keskitaso themes.
 * Built only from LEARN pools that already exclude EXAM items (readingItems, practiceCards) and from
 * LEARN-only banks (dialogues, writing clinic). Theme files contribute titles only — their writing and
 * speaking prompts stay withheld for the delayed 7/14/30 checks (GL-03).
 *
 * Life goals and real-life deeds are Ukrainian editorial drafts (no Finnish answer keys); the app never
 * tracks the deeds (MOT-03). Status: draft, not S2-reviewed.
 */
import { buildPlaceIndex, buildScenario, placeOfTheme, PLACE_IDS, type ScenarioStep, type PlaceId, type PlaceItem, type PracticeKind, type YkiSkill } from "@hospodar/domain";
import { readingItems } from "./reading.ts";
import { dialogues } from "./dialogues.ts";
import { clinicItems } from "./writingClinic.ts";
import { PRACTICE_KINDS, practiceCards } from "./practice.ts";
import { listeningLessons } from "./listening.ts";

const themeFiles = import.meta.glob("../../../../learning/exercises/b1/themes/*.json", { eager: true, import: "default" }) as Record<string, { id: string; title_fi: string; title_uk: string }>;
const THEME_FILE: Record<PlaceId, string> = {
  identity: "01-mina-ja-taustani", housing: "02-koti-ja-asuminen", services: "03-kaupat-ja-palvelut", culture: "04-kulttuuri", travel: "05-matkustaminen",
  health: "06-terveys-ja-hyvinvointi", work: "07-tyo", environment: "08-ymparisto", society: "09-yhteiskunta",
};
const titleOf = (p: PlaceId) => {
  const t = Object.values(themeFiles).find(f => f.id === THEME_FILE[p]);
  if (!t) throw new Error(`theme file for ${p} is missing`);
  return { title_fi: t.title_fi, title_uk: t.title_uk };
};

/** What being "господар" of this place means in real life, and one optional deed outside the app. */
const LIFE: Record<PlaceId, { goal_uk: string; deed_uk: string }> = {
  identity: { goal_uk: "Розповісти про себе: звідки ти, чим займаєшся і навіщо тобі фінська.", deed_uk: "Привітайся з сусідом чи колегою фінською й скажи одне речення про себе." },
  housing: { goal_uk: "Зрозуміти оголошення в будинку й домовитися про ремонт.", deed_uk: "Знайди в під'їзді дошку оголошень (ilmoitustaulu) і прочитай одне оголошення до кінця." },
  services: { goal_uk: "Купити, повернути товар, поскаржитися на послугу.", deed_uk: "У магазині запитай фінською, де знайти потрібний товар." },
  culture: { goal_uk: "Записатися на гурток чи подію й домовитися про зустріч.", deed_uk: "Знайди на сайті бібліотеки чи міста одну подію цього тижня й прочитай опис фінською." },
  travel: { goal_uk: "Зрозуміти зміну маршруту й запитати дорогу.", deed_uk: "Перемкни застосунок свого перевізника на фінську й знайди свій маршрут." },
  health: { goal_uk: "Записатися до лікаря й пояснити, що з тобою.", deed_uk: "Прочитай фінською сторінку свого terveysasema про запис на прийом." },
  work: { goal_uk: "Домовитися про зміну, зрозуміти інструктаж на роботі чи навчанні.", deed_uk: "Скажи колезі чи одногрупнику фінською одне речення про свій план на день." },
  environment: { goal_uk: "Сортувати сміття за інструкцією й говорити про погоду та природу.", deed_uk: "Прочитай фінські написи на контейнерах для сміття у своєму дворі." },
  society: { goal_uk: "Впоратися з офіційними справами: Kela, курси, онлайн-послуги міста.", deed_uk: "Відкрий сайт свого міста фінською й знайди одну сторінку, яка тобі справді потрібна." },
};

export type QuestView = "reading" | "listening" | "dialogue" | "writing" | "practice";
export interface Quest { view: QuestView; itemId: string; kindUk: string; title: string; titleLang: "fi" | "uk"; practiceKind?: PracticeKind; count?: number;
  /** Evidence task ids start with this when it differs from itemId (listening questions). */ taskPrefix?: string;
  /** The YKI skill of a single-item quest (practice groups have none here). */ skill?: YkiSkill }
export interface Place { id: PlaceId; title_fi: string; title_uk: string; goal_uk: string; deed_uk: string; quests: Quest[];
  /** «Ціла справа»: understand → say → write in this place, or null when the place lacks one of them. */ scenario: ScenarioStep[] | null }

const readingPlace = (id: string): PlaceId | null => placeOfTheme(id.split("-").pop());          // ctx-reading-01-identity
const themeOf = (x: unknown): string | undefined => (x as { theme?: string }).theme;

const indexItems: PlaceItem[] = [];
const questsBy = new Map<PlaceId, Quest[]>(PLACE_IDS.map(p => [p, []]));
for (const r of readingItems) {
  const p = readingPlace(r.id); if (!p) continue;
  indexItems.push({ itemId: r.id, place: p, skill: "reading" });
  questsBy.get(p)!.push({ view: "reading", skill: "reading", itemId: r.id, kindUk: "Читання", title: r.title_fi, titleLang: "fi" });
}
for (const d of dialogues) {
  const p = placeOfTheme(themeOf(d)); if (!p) continue;
  indexItems.push({ itemId: d.id, place: p, skill: "speaking" });          // role-play replies (typed today)
  questsBy.get(p)!.push({ view: "dialogue", skill: "speaking", itemId: d.id, kindUk: "Діалог", title: d.title_fi, titleLang: "fi" });
}
for (const c of clinicItems) {
  const p = placeOfTheme((c as unknown as { topic?: string }).topic); if (!p) continue;
  indexItems.push({ itemId: c.id, place: p, skill: "writing" });
  questsBy.get(p)!.push({ view: "writing", skill: "writing", itemId: c.id, kindUk: "Письмо", title: c.title_fi, titleLang: "fi" });
}
/** Long listening lessons: question ids share one prefix (b1long-1-q1…), which is the evidence key. */
const questionPrefix = (ids: string[]) => {
  const prefixes = new Set(ids.map(id => id.replace(/-q\d+$/, "")));
  if (prefixes.size !== 1) throw new Error(`listening questions do not share one prefix: ${ids.join(", ")}`);
  return [...prefixes][0]!;
};
for (const l of listeningLessons) {
  const p = placeOfTheme((l as unknown as { topic?: string }).topic); if (!p) continue;      // literature stories belong to no place
  const prefix = questionPrefix(l.questions.map(q => q.id));
  indexItems.push({ itemId: prefix, place: p, skill: "listening" });
  questsBy.get(p)!.push({ view: "listening", skill: "listening", itemId: l.id, taskPrefix: prefix, kindUk: "Аудіювання", title: l.title_fi, titleLang: "fi" });
}
/** Practice kinds → the YKI skill they train; vocabulary and rektio cards train no single skill. */
const PRACTICE_SKILL: Partial<Record<PracticeKind, YkiSkill>> = { paraphrase: "reading", reaction: "speaking", opinion: "speaking" };
const practiceBy = new Map<string, { place: PlaceId; kind: PracticeKind; ids: string[] }>();
for (const c of practiceCards) {
  const p = placeOfTheme(c.group); if (!p) continue;                     // grammar groups (cases) belong to no place
  const skill = PRACTICE_SKILL[c.kind];
  indexItems.push({ itemId: c.id, place: p, ...(skill ? { skill } : {}) });
  const key = `${p}:${c.kind}`;
  if (!practiceBy.has(key)) practiceBy.set(key, { place: p, kind: c.kind, ids: [] });
  practiceBy.get(key)!.ids.push(c.id);
}
for (const { place, kind, ids } of practiceBy.values()) {
  const meta = PRACTICE_KINDS.find(k => k.kind === kind)!;
  questsBy.get(place)!.push({ view: "practice", itemId: ids[0]!, kindUk: "Практика", title: meta.title, titleLang: "uk", practiceKind: kind, count: ids.length });
}

export const placeIndex = buildPlaceIndex(indexItems);
export const practiceIdsOf = (place: PlaceId, kind: PracticeKind) => practiceBy.get(`${place}:${kind}`)?.ids ?? [];
const scenarioOf = (id: PlaceId) => buildScenario(questsBy.get(id)!.filter(q => q.skill && q.view !== "practice")
  .map(q => ({ skill: q.skill!, itemId: q.itemId, taskPrefix: q.taskPrefix ?? q.itemId })));
export const places: Place[] = PLACE_IDS.map(id => ({ id, ...titleOf(id), ...LIFE[id], quests: questsBy.get(id)!, scenario: scenarioOf(id) }));
/** The screen that opens a scenario step's item. */
export const viewOfSkill = (skill: YkiSkill): QuestView => skill === "speaking" ? "dialogue" : skill;
