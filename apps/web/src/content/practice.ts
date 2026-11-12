/**
 * "Практика без підказки": existing banks read from their single physical owners
 * (learning/exercises/b1/high-yield, knowledge/dictionaries/b1). All cards are S2-pending drafts.
 * EXAM-11 isolation: any id an EXAM blueprint uses is never offered here.
 */
import { chunkCard, opinionCard, paraphraseCard, reactionCard, rektioCard, validatePracticeCard, type PracticeCard, type PracticeKind,
  type ChunkItem, type OpinionItem, type ParaphraseItem, type ReactionItem, type RektioItem } from "@hospodar/domain";
import paraphrase from "../../../../learning/exercises/b1/high-yield/paraphrase-drills.json";
import reactions from "../../../../learning/exercises/b1/high-yield/speaking-reaction-bank.json";
import opinions from "../../../../learning/exercises/b1/high-yield/opinion-argumentation-v1.json";
import chunks from "../../../../knowledge/dictionaries/b1/contextual-chunks-v1.json";
import rektio from "../../../../knowledge/dictionaries/b1/rektio-v1.json";
import exam from "../../../../learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json";

const items = <T,>(x: unknown) => (x as { items: T[] }).items;
const cards: PracticeCard[] = [
  ...items<ParaphraseItem>(paraphrase).map(paraphraseCard),
  ...items<ReactionItem>(reactions).map(reactionCard),
  ...items<OpinionItem>(opinions).map(opinionCard),
  ...items<ChunkItem>(chunks).map(chunkCard),
  ...items<RektioItem>(rektio).map(rektioCard),
];
const bad = cards.find(c => validatePracticeCard(c) === false) as PracticeCard | undefined;
if (bad) throw new Error(`practice card ${bad.id} is invalid`);
const examIds = new Set((exam as unknown as { blueprints: { skill_blocks: { item_id: string }[] }[] }).blueprints
  .flatMap(b => b.skill_blocks.map(s => s.item_id)));

export const practiceCards = cards.filter(c => !examIds.has(c.id));

/** Learner-facing names of the banks' internal theme keys; case names of rektio items stay Finnish grammar terms. */
const GROUP_UK: Record<string, string> = {
  identity: "Я і моє життя", housing: "Житло", home: "Житло", services: "Послуги й покупки", shopping: "Послуги й покупки", culture: "Культура й дозвілля",
  travel: "Подорожі й транспорт", transport: "Подорожі й транспорт", health: "Здоров'я", work: "Робота", environment: "Довкілля", society: "Суспільство",
  functions: "Корисні звороти", education: "Навчання", leisure: "Дозвілля", official: "Офіційні справи", authorities: "Офіційні справи",
  partitiivi: "partitiivi", partitiivi_context: "partitiivi (залежить від змісту)", elatiivi: "elatiivi", illatiivi: "illatiivi", allatiivi: "allatiivi", ablatiivi: "ablatiivi",
  MA_infinitiivi_illatiivi: "MA-infinitiivi (illatiivi)",
};
export const groupLabel = (group: string) => GROUP_UK[group] ?? group;
export const PRACTICE_KINDS: { kind: PracticeKind; title: string; about: string }[] = [
  { kind: "paraphrase", title: "Те саме іншими словами", about: "Обери речення з тим самим значенням, потім перекажи своїми словами." },
  { kind: "reaction", title: "Реакція в ситуації", about: "Коротка усна відповідь у побутовій ситуації: прохання, відмова, уточнення." },
  { kind: "opinion", title: "Моя думка", about: "Висловись і поясни чому. Фрази-опори з'являються лише після спроби." },
  { kind: "chunk", title: "Фрази для життя", about: "Згадай готову фразу фінською, потім вжий її в новій ситуації." },
  { kind: "rektio", title: "Керування дієслів (rektio)", about: "Скажи речення з правильним відмінком після дієслова або прикметника." },
];
