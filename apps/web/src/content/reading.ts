/** Reading texts for LEARN, minus every text an EXAM blueprint uses (EXAM-11 held-out isolation). */
import { learnReadingPool, validateReadingItem, type ReadingItem } from "@hospodar/domain";
import pack from "../../../../learning/exercises/b1/contextual/reading-pack-v1.json";
import exam from "../../../../learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json";

const items = (pack as unknown as { items: ReadingItem[] }).items;
if (!items.every(validateReadingItem)) throw new Error("reading-pack-v1.json has an invalid item");
export const readingItems = learnReadingPool(items, (exam as unknown as { blueprints: { skill_blocks: { skill: string; item_id: string }[] }[] }).blueprints);
