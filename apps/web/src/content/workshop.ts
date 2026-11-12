/**
 * Майстерня слабких місць: families of confusable forms over the LEARN cloze bank (contextual-cloze.json).
 * The grouping is editorial (Ukrainian explanations, Finnish grammar terms); it adds no Finnish answer keys —
 * every task and key comes from the existing bank, which is still an S2-pending draft.
 */
import type { GrammarFamily, WorkshopItem } from "@hospodar/domain";
import { exercises } from "./cloze.ts";

export interface FamilyInfo extends GrammarFamily { title_uk: string; why_uk: string }
export const FAMILIES: FamilyInfo[] = [
  { id: "location", title_uk: "Місцеві відмінки: де? звідки? куди?", tags: ["inessiivi", "elatiivi", "illatiivi", "adessiivi", "allatiivi"],
    why_uk: "Форми на -ssa/-sta/-Vn, -lla/-lta/-lle легко сплутати. Тому вони чергуються в одному наборі: щоразу треба вирішити, яке питання ставить ситуація." },
  { id: "rektio", title_uk: "Керування дієслів (rektio)", tags: ["rektio_elatiivi", "rektio_partitiivi"],
    why_uk: "Відмінок після дієслова залежить від самого дієслова, а не від логіки «куди/де». Набір змішує дієслова з різним керуванням." },
  { id: "past", title_uk: "Минулий час і заперечення в минулому", tags: ["imperfekti", "perfekti", "past_negation", "passive_past", "perfect_plural"],
    why_uk: "Imperfekti, perfekti та заперечення в минулому відрізняються значенням і будовою. Чергування змушує щоразу обирати форму за змістом." },
  { id: "verbs", title_uk: "Форми дієслова", tags: ["verb_type_1", "verb_type_4", "kpt", "plural_verb", "negation", "konditionaali", "necessity", "politeness"],
    why_uk: "Типи дієслів, чергування приголосних і способи дієслова змішані, щоб тренувати вибір, а не механічне повторення одного зразка." },
  { id: "nominals", title_uk: "Форми іменника: партитив, генітив, множина, числа", tags: ["partitiivi", "genetiivi", "object", "plural", "numerals"],
    why_uk: "Партитив, генітив і форма об'єкта залежать від значення речення. Набір чергує їх, щоб вибір спирався на зміст." },
];
export const workshopItems: WorkshopItem[] = exercises.filter(e => e.grammar_tag).map(e => ({ id: e.id, tag: e.grammar_tag! }));
export const familyInfo = (id: string) => FAMILIES.find(f => f.id === id)!;

/** Learner-facing names of the bank's internal tags: real Finnish grammar terms stay Finnish, the rest is Ukrainian. */
const TAG_LABEL: Record<string, { text: string; lang: "fi" | "uk" }> = {
  inessiivi: { text: "inessiivi", lang: "fi" }, elatiivi: { text: "elatiivi", lang: "fi" }, illatiivi: { text: "illatiivi", lang: "fi" },
  adessiivi: { text: "adessiivi", lang: "fi" }, allatiivi: { text: "allatiivi", lang: "fi" },
  rektio_elatiivi: { text: "дієслово + elatiivi", lang: "uk" }, rektio_partitiivi: { text: "дієслово + partitiivi", lang: "uk" },
  imperfekti: { text: "imperfekti", lang: "fi" }, perfekti: { text: "perfekti", lang: "fi" },
  past_negation: { text: "заперечення в минулому", lang: "uk" }, passive_past: { text: "пасив минулого часу", lang: "uk" },
  perfect_plural: { text: "perfekti в множині", lang: "uk" },
  verb_type_1: { text: "дієслова 1-го типу", lang: "uk" }, verb_type_4: { text: "дієслова 4-го типу", lang: "uk" },
  kpt: { text: "чергування k-p-t", lang: "uk" }, plural_verb: { text: "дієслово в множині", lang: "uk" },
  negation: { text: "заперечення", lang: "uk" }, konditionaali: { text: "konditionaali", lang: "fi" },
  necessity: { text: "необхідність (täytyy, pitää)", lang: "uk" }, politeness: { text: "ввічливе прохання", lang: "uk" },
  partitiivi: { text: "partitiivi", lang: "fi" }, genetiivi: { text: "genetiivi", lang: "fi" },
  object: { text: "форма об'єкта", lang: "uk" }, plural: { text: "множина", lang: "uk" }, numerals: { text: "числівники", lang: "uk" },
};
export const tagLabel = (tag: string) => TAG_LABEL[tag] ?? { text: tag, lang: "uk" as const };
export const hasTagLabel = (tag: string) => tag in TAG_LABEL;

