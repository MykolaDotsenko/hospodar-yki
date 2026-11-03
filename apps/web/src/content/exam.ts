/** EXAM practice blueprints + their source-linked items (same physical owners the legacy EXAM reads). */
import { buildItems, type ExamBlueprint, type ExamContent, type ExamItem, type ExamSkill } from "@hospodar/domain";
import mini from "../../../../learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json";
import reading from "../../../../learning/exercises/b1/contextual/reading-pack-v1.json";
import listening from "../../../../learning/exercises/b1/audio-long/lessons.json";
import baseline from "../../../../learning/exercises/b1/diagnostics/baseline-v1.json";

export const examBlueprints = (mini as unknown as { blueprints: (ExamBlueprint & { id: string; title_uk: string; audience: string })[] }).blueprints;
const content = { reading, listening, baseline } as unknown as ExamContent;
/** Items of a blueprint, optionally restricted to a subset of skills (single-subtest practice, EXAM-03). */
export const itemsFor = (blueprintId: string, skills: ExamSkill[] | null = null): ExamItem[] => {
  const b = examBlueprints.find(x => x.id === blueprintId);
  if (!b) throw new Error(`Unknown blueprint ${blueprintId}`);
  const items = buildItems(b, content);
  return skills ? items.filter(i => skills.includes(i.skill)) : items;
};
/** Recorded with every finished attempt, so history says which item-bank version was used. */
export const examContentVersion = `mini-rehearsals ${(mini as { schema_version?: string; created_at?: string }).schema_version ?? "?"} · ${(mini as { created_at?: string }).created_at ?? "?"}`;

const audio = import.meta.glob("../../../../assets/audio/long/b1/*.ogg", { query: "?url", import: "default", eager: true }) as Record<string, string>;
export const audioUrlFor = (repoPath?: string) => repoPath ? Object.entries(audio).find(([k]) => k.endsWith("/" + repoPath))?.[1] ?? null : null;
