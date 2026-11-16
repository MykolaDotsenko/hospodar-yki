/**
 * Every LEARN content bank a learner can meet, as review units for the S2 reviewer workspace (docs/29 stage 1).
 * A unit is the raw item exactly as stored in its physical owner file — the bytes the content hash covers — plus how a
 * reviewer can walk it on the real learner screen. Items an EXAM blueprint uses are never listed (EXAM-11): exam forms
 * are reviewed in their own sealed process (docs/29 stage 4), so this page cannot expose them.
 */
import type { ReviewSkill, ReviewSourceKind } from "@hospodar/domain";
import exam from "../../../../learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json";
import cloze from "../../../../learning/exercises/b1/grammar/contextual-cloze.json";
import r08 from "../../../../learning/exercises/b1/grammar/r08-meaning-stems-original-drafts.json";
import paraphrase from "../../../../learning/exercises/b1/high-yield/paraphrase-drills.json";
import reactions from "../../../../learning/exercises/b1/high-yield/speaking-reaction-bank.json";
import opinions from "../../../../learning/exercises/b1/high-yield/opinion-argumentation-v1.json";
import chunks from "../../../../knowledge/dictionaries/b1/contextual-chunks-v1.json";
import rektio from "../../../../knowledge/dictionaries/b1/rektio-v1.json";
import forms from "../../../../learning/exercises/b1/grammar/ftb-frequency-cloze-v1.json";
import tenses from "../../../../learning/exercises/grammar/tenses/lessons.json";
import clock from "../../../../learning/exercises/grammar/time-and-clock/lessons.json";
import dialogues from "../../../../learning/exercises/b1/contextual/dialogues-v1.json";
import moves from "../../../../learning/exercises/b1/contextual/negotiation-moves-v1.json";
import reading from "../../../../learning/exercises/b1/contextual/reading-pack-v1.json";
import clinic from "../../../../learning/exercises/b1/high-yield/writing-repair-clinic.json";
import listening from "../../../../learning/exercises/b1/audio-long/lessons.json";
import training from "../../../../learning/exercises/b1/audio-training/index.json";
import { heldOutReading } from "./listening.ts";
import stories from "../../../../learning/exercises/b1/audio-long/human-stories.json";
import pictures from "../../../../learning/exercises/a1/image-led/lessons.json";
import baseline from "../../../../learning/exercises/b1/diagnostics/baseline-v1.json";
import transfer from "../../../../learning/exercises/b1/grammar/delayed-transfer-v1.json";
import inference from "../../../../learning/exercises/b1/high-yield/reading-inference-bank.json";
import librivox from "../../../../learning/exercises/b1/audio-training/librivox-human.json";
import audioVisual from "../../../../learning/exercises/a1/audio-visual/lessons.json";

type Json = Record<string, unknown>;
export type WalkScreen = "mission" | "r08" | "practice" | "dialogue" | "reading" | "writing" | "listening" | "pictures" | "diagnostic" | "media";
export interface ReviewUnit { file: string; id: string; item: Json; label: string }
export interface ReviewBank {
  id: string; title_uk: string; skills: ReviewSkill[]; audio: boolean;
  /** Where a learner meets it; `walk` opens that real screen in the reviewer sandbox (perItem: straight at this unit). */
  where_uk: string; walk: { screen: WalkScreen; perItem: boolean } | null;
  source: { kind: ReviewSourceKind; license: string; urlField?: string };
  units: ReviewUnit[]; heldOutForExam: number;
}

/** Ids every EXAM blueprint uses: never listed here (EXAM-11). */
export const EXAM_ITEM_IDS = new Set((exam as unknown as { blueprints: { skill_blocks: { item_id: string }[] }[] }).blueprints
  .flatMap(b => b.skill_blocks.map(s => s.item_id)));
/** Content files that hold only EXAM configuration or forms: reviewed in the sealed exam process, not here. */
export const EXAM_ONLY_FILES = ["learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json", "learning/exercises/b1/exam-patterns/exam-profiles-v1.json"];

export const unitId = (item: Json) => String(item.id ?? item.lesson_id ?? item.task_id ?? "");
const LABEL_KEYS = ["prompt_fi", "title_fi", "expression_fi", "construction_fi", "question_fi", "stimulus_fi", "source_fi", "initial_prompt_fi",
  "fi", "first_task_fi", "name", "title_uk", "work"];
const labelOf = (item: Json) => {
  for (const k of LABEL_KEYS) if (typeof item[k] === "string" && (item[k] as string).trim()) return (item[k] as string).trim();
  return unitId(item);
};
const unit = (file: string) => (item: Json): ReviewUnit => ({ file, id: unitId(item), item, label: labelOf(item) });
/** True when the item or anything nested in it is an EXAM item — such a unit would expose it, so it is held out whole. */
export function containsExamItem(v: unknown): boolean {
  if (Array.isArray(v)) return v.some(containsExamItem);
  if (!v || typeof v !== "object") return false;
  const o = v as Json;
  if (["id", "lesson_id", "task_id", "item_id"].some(k => typeof o[k] === "string" && EXAM_ITEM_IDS.has(o[k] as string))) return true;
  return Object.values(o).some(containsExamItem);
}
function units(file: string, candidates: unknown[]): { units: ReviewUnit[]; heldOutForExam: number } {
  const all = candidates.filter((x): x is Json => Boolean(x) && typeof x === "object" && Boolean(unitId(x as Json)));
  const learn = all.filter(x => !containsExamItem(x));
  return { units: learn.map(unit(file)), heldOutForExam: all.length - learn.length };
}
const rows = (json: unknown, key: string, file: string) => units(file, (json as Json)[key] as unknown[]);
const root = (json: unknown, file: string) => units(file, [json]);
/** A file whose parts are separate tasks (the diagnostic): each part is a unit, so an EXAM part never rides along. */
const parts = (json: unknown, keys: string[], file: string) =>
  units(file, keys.flatMap(k => { const v = (json as Json)[k]; return Array.isArray(v) ? v : [v]; }));

const B1 = "learning/exercises/b1";
const ORIGINAL = { kind: "project_original", license: "project_original" } as const;
const themeFiles = import.meta.glob("../../../../learning/exercises/b1/themes/*.json", { eager: true, import: "default" }) as Record<string, Json>;
const themeUnits = Object.entries(themeFiles).sort(([a], [b]) => a.localeCompare(b)).flatMap(([path, t]) => {
  const file = `${B1}/themes/${path.split("/").pop()}`;
  const parts = [t.reading, t.listening, ...(t.speaking as Json[]), ...(t.writing as Json[]), ...(t.chunks as Json[])] as Json[];
  return parts.filter(p => p && unitId(p) && !containsExamItem(p)).map(unit(file));
});

export const reviewBanks: ReviewBank[] = [
  { id: "cloze", title_uk: "Граматика в контексті (cloze)", skills: ["grammar"], audio: false, source: ORIGINAL,
    where_uk: "Навчання → місія; майстерня слабких місць", walk: { screen: "mission", perItem: true },
    ...rows(cloze, "exercises", `${B1}/grammar/contextual-cloze.json`) },
  { id: "r08", title_uk: "Значення → форма (R08, чернетки)", skills: ["grammar"], audio: false, source: ORIGINAL,
    where_uk: "Учням не показується, доки не опубліковано", walk: { screen: "r08", perItem: true },
    ...rows(r08, "exercises", `${B1}/grammar/r08-meaning-stems-original-drafts.json`) },
  { id: "paraphrase", title_uk: "Те саме іншими словами", skills: ["reading", "writing"], audio: false, source: ORIGINAL,
    where_uk: "Практика без підказки", walk: { screen: "practice", perItem: true },
    ...rows(paraphrase, "items", `${B1}/high-yield/paraphrase-drills.json`) },
  { id: "reaction", title_uk: "Реакції в ситуаціях", skills: ["speaking"], audio: false, source: ORIGINAL,
    where_uk: "Практика без підказки", walk: { screen: "practice", perItem: true },
    ...rows(reactions, "items", `${B1}/high-yield/speaking-reaction-bank.json`) },
  { id: "opinion", title_uk: "Моя думка", skills: ["speaking", "writing"], audio: false, source: ORIGINAL,
    where_uk: "Практика без підказки", walk: { screen: "practice", perItem: true },
    ...rows(opinions, "items", `${B1}/high-yield/opinion-argumentation-v1.json`) },
  { id: "chunk", title_uk: "Фрази для життя", skills: ["vocabulary"], audio: false, source: ORIGINAL,
    where_uk: "Практика без підказки; повторення за розкладом", walk: { screen: "practice", perItem: true },
    ...rows(chunks, "items", "knowledge/dictionaries/b1/contextual-chunks-v1.json") },
  { id: "rektio", title_uk: "Керування дієслів (rektio)", skills: ["grammar"], audio: false, source: ORIGINAL,
    where_uk: "Практика без підказки; повторення за розкладом", walk: { screen: "practice", perItem: true },
    ...rows(rektio, "items", "knowledge/dictionaries/b1/rektio-v1.json") },
  { id: "dialogue", title_uk: "Діалоги (текст, без запису)", skills: ["speaking"], audio: false, source: ORIGINAL,
    where_uk: "Діалоги", walk: { screen: "dialogue", perItem: true },
    ...rows(dialogues, "items", `${B1}/contextual/dialogues-v1.json`) },
  { id: "negotiation", title_uk: "Репліки партнера: уточнення й зміна умови", skills: ["speaking"], audio: false, source: ORIGINAL,
    where_uk: "Усередині кожного діалогу", walk: { screen: "dialogue", perItem: false },
    ...root(moves, `${B1}/contextual/negotiation-moves-v1.json`) },
  { id: "reading", title_uk: "Тексти для читання", skills: ["reading"], audio: false, source: ORIGINAL,
    where_uk: "Читання", walk: { screen: "reading", perItem: true },
    ...rows(reading, "items", `${B1}/contextual/reading-pack-v1.json`) },
  { id: "clinic", title_uk: "Майстерня письма", skills: ["writing"], audio: false, source: ORIGINAL,
    where_uk: "Майстерня письма", walk: { screen: "writing", perItem: true },
    ...rows(clinic, "items", `${B1}/high-yield/writing-repair-clinic.json`) },
  { id: "listening", title_uk: "Аудіювання: довгі записи (синтетичний голос)", skills: ["listening"], audio: true, source: ORIGINAL,
    where_uk: "Аудіювання", walk: { screen: "listening", perItem: true },
    ...rows(listening, "lessons", `${B1}/audio-long/lessons.json`) },
  { id: "tenses", title_uk: "Часи дієслова: вибір форми й пояснення", skills: ["reading", "writing"], audio: false, source: ORIGINAL,
    where_uk: "Практика → «Час дієслова й годинник»: вибір, потім пояснення часу й часова шкала; відкрите завдання стає новою ситуацією",
    walk: { screen: "practice", perItem: false },
    ...rows(tenses, "exercises", "learning/exercises/grammar/tenses/lessons.json") },
  { id: "clock", title_uk: "Годинник і час", skills: ["reading", "writing"], audio: false, source: ORIGINAL,
    where_uk: "Практика → «Час дієслова й годинник»: вибір, потім приклад і годинник (лише після спроби)",
    walk: { screen: "practice", perItem: false },
    ...rows(clock, "exercises", "learning/exercises/grammar/time-and-clock/lessons.json") },
  { id: "forms", title_uk: "Форма слова в реченні (корпус UD Finnish FTB, CC BY 4.0)", skills: ["writing"], audio: false,
    source: { kind: "licensed", license: "CC BY 4.0" },
    where_uk: "Практика → «Форма слова в реченні»: самопорівняння, без оцінки; речення з корпусу, потрібне редагування S2 (архаїчний чи літературний контекст)",
    walk: { screen: "practice", perItem: false },
    ...rows(forms, "items", `${B1}/grammar/ftb-frequency-cloze-v1.json`) },
  { id: "training-listening", title_uk: "Аудіювання: короткі записи тем і текстів (синтетичний голос)", skills: ["listening"], audio: true, source: ORIGINAL,
    where_uk: "Аудіювання й місця «Моє господарство»; повільніший і швидший записи — лише після відповідей. Записи текстів 001–003 учням не показуються: ці тексти зарезервовано для відкладених перевірок читання",
    walk: { screen: "listening", perItem: true },
    ...units(`${B1}/audio-training/index.json`, ((training as Json).lessons as { id: string }[])
      .filter(l => !heldOutReading.has(l.id.replace(/-audio$/, "")))) },
  { id: "story", title_uk: "Аудіювання: оповідання (живий голос, суспільне надбання)", skills: ["listening"], audio: true,
    source: { kind: "public_domain", license: "public-domain", urlField: "audio_source" },
    where_uk: "Аудіювання", walk: { screen: "listening", perItem: true },
    ...rows(stories, "items", `${B1}/audio-long/human-stories.json`) },
  { id: "picture", title_uk: "Місії з фото", skills: ["writing", "vocabulary"], audio: false, source: ORIGINAL,
    where_uk: "Місії з фото (лише ті, для яких є допущене фото)", walk: { screen: "pictures", perItem: false },
    ...rows(pictures, "items", "learning/exercises/a1/image-led/lessons.json") },
  { id: "diagnostic", title_uk: "Стартова діагностика: читання й аудіювання", skills: ["reading"], audio: false, source: ORIGINAL,
    where_uk: "Діагностика: читання (письмо й говоріння діагностики — завдання з банку «Теми YKI»; власні d-w/d-s цього файлу належать пробному іспиту)", walk: { screen: "diagnostic", perItem: false },
    ...parts(baseline, ["reading", "listening", "writing", "speaking"], `${B1}/diagnostics/baseline-v1.json`) },
  { id: "transfer", title_uk: "Відкладене перенесення граматики", skills: ["writing"], audio: false, source: ORIGINAL,
    where_uk: "Відкладена перевірка через 7/14/30 днів (тут показано повністю)", walk: null,
    ...rows(transfer, "items", `${B1}/grammar/delayed-transfer-v1.json`) },
  { id: "inference", title_uk: "Читання між рядків (відкладені перевірки)", skills: ["reading"], audio: false, source: ORIGINAL,
    where_uk: "Відкладена перевірка читання (тут показано повністю)", walk: null,
    ...rows(inference, "items", `${B1}/high-yield/reading-inference-bank.json`) },
  { id: "themes", title_uk: "Теми YKI: тексти, діалоги, завдання, фрази", skills: ["reading", "listening", "writing", "speaking"], audio: false, source: ORIGINAL,
    where_uk: "Назви місць; письмо й говоріння — у відкладених перевірках; решта — у старому застосунку app/", walk: null,
    units: themeUnits, heldOutForExam: 0 },
  { id: "librivox", title_uk: "Живі голоси LibriVox (уривки)", skills: ["listening"], audio: true,
    source: { kind: "public_domain", license: "public-domain", urlField: "source_page" },
    where_uk: "Медіатека", walk: { screen: "media", perItem: false },
    ...rows(librivox, "items", `${B1}/audio-training/librivox-human.json`) },
  { id: "audio-visual", title_uk: "A1: звук і фото (старий застосунок)", skills: ["listening", "speaking"], audio: true, source: ORIGINAL,
    where_uk: "Лише в старому застосунку app/ (тут показано повністю)", walk: null,
    ...rows(audioVisual, "items", "learning/exercises/a1/audio-visual/lessons.json") },
];

export const reviewUnitCount = reviewBanks.reduce((n, b) => n + b.units.length, 0);
