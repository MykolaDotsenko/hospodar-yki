/**
 * Delayed 7/14/30 checks for all four skills (GL-03). Items are WITHHELD: the inference texts and the
 * theme prompts are loaded by no LEARN screen; listening uses a lesson this learner has not met (first
 * exposure) and never an EXAM item. All items are S2-pending drafts.
 */
import { buildSkillRetentionBank, validateSkillRetentionBank } from "@hospodar/domain";
import inference from "../../../../learning/exercises/b1/high-yield/reading-inference-bank.json";
import exam from "../../../../learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json";
import { allListeningLessons, mediaFor } from "./listening.ts";
import { IN_RELEASE, learnerPool } from "./release.ts";

const themeFiles = import.meta.glob("../../../../learning/exercises/b1/themes/*.json", { eager: true, import: "default" }) as Record<string, { writing: never[]; speaking: never[] }>;
const examItemIds = (exam as unknown as { blueprints: { skill_blocks: { item_id: string }[] }[] }).blueprints.flatMap(b => b.skill_blocks.map(s => s.item_id));

const themeTasks = learnerPool(Object.values(themeFiles).flatMap(t => [...t.writing, ...t.speaking]));
const inPool = (ids: string[]) => ids.filter(id => themeTasks.some(t => (t as { id: string }).id === id));   // release: published ones only
const built = buildSkillRetentionBank({
  version: "skill-retention-v1",
  inference: learnerPool((inference as unknown as { items: never[] }).items),
  themeTasks,
  writingIds: inPool(["02-koti-ja-asuminen-writing-02", "03-kaupat-ja-palvelut-writing-01", "06-terveys-ja-hyvinvointi-writing-02"]),
  speakingIds: inPool(["02-koti-ja-asuminen-speaking-01", "05-matkustaminen-speaking-01", "08-ymparisto-speaking-02"]),
  listening: allListeningLessons as never[],              // the bank drops exam ids itself
  examItemIds,
});
/** Beta: an invalid bank is a content bug and stops the build. Release: too few published items simply means no delayed
 *  skill checks yet (never a partial or draft check). */
const valid = validateSkillRetentionBank(built);
if (!valid && !IN_RELEASE) throw new Error("skill retention bank is invalid");
export const skillRetentionBank = valid ? built : { ...built, reading: [], listening: [], writing: [], speaking: [] };
export const skillChecksAvailable = valid;

export const listeningMediaFor = (itemId: string) => {
  const l = allListeningLessons.find(x => x.id === itemId);
  return l ? mediaFor(l) : { audio: null, subtitles: null, transcript: null };
};
