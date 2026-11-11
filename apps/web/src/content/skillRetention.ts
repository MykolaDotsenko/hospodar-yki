/**
 * Delayed 7/14/30 checks for all four skills (GL-03). Items are WITHHELD: the inference texts and the
 * theme prompts are loaded by no LEARN screen; listening uses a lesson this learner has not met (first
 * exposure) and never an EXAM item. All items are S2-pending drafts.
 */
import { buildSkillRetentionBank, validateSkillRetentionBank } from "@hospodar/domain";
import inference from "../../../../learning/exercises/b1/high-yield/reading-inference-bank.json";
import exam from "../../../../learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json";
import { listeningLessons, mediaFor } from "./listening.ts";

const themeFiles = import.meta.glob("../../../../learning/exercises/b1/themes/*.json", { eager: true, import: "default" }) as Record<string, { writing: never[]; speaking: never[] }>;
const examItemIds = (exam as unknown as { blueprints: { skill_blocks: { item_id: string }[] }[] }).blueprints.flatMap(b => b.skill_blocks.map(s => s.item_id));

export const skillRetentionBank = buildSkillRetentionBank({
  version: "skill-retention-v1",
  inference: (inference as unknown as { items: never[] }).items,
  themeTasks: Object.values(themeFiles).flatMap(t => [...t.writing, ...t.speaking]),
  writingIds: ["02-koti-ja-asuminen-writing-02", "03-kaupat-ja-palvelut-writing-01", "06-terveys-ja-hyvinvointi-writing-02"],
  speakingIds: ["02-koti-ja-asuminen-speaking-01", "05-matkustaminen-speaking-01", "08-ymparisto-speaking-02"],
  listening: listeningLessons as never[],
  examItemIds,
});
if (!validateSkillRetentionBank(skillRetentionBank)) throw new Error("skill retention bank is invalid");

export const listeningMediaFor = (itemId: string) => {
  const l = listeningLessons.find(x => x.id === itemId);
  return l ? mediaFor(l) : { audio: null, subtitles: null, transcript: null };
};
