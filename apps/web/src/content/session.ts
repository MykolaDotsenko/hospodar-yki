/**
 * Candidates for «План заняття» (packages/domain/src/sessionPlan.ts), built only from LEARN pools that already exclude
 * EXAM items and, in a release build, unpublished items (learnerPool). Nothing here is stored.
 */
import { delayedTransferQueue, dueCards, localDate, placeOfTask, practiceDue, skillRetentionQueue, skillRetentionTaskId, workshopStatus,
  type LearnerState, type SessionCandidates, type SessionTask, type YkiSkill } from "@hospodar/domain";
import { exercises } from "./cloze.ts";
import { practiceCards } from "./practice.ts";
import { transferBank } from "./transfer.ts";
import { skillRetentionBank } from "./skillRetention.ts";
import { FAMILIES, workshopItems } from "./workshop.ts";
import { readingItems } from "./reading.ts";
import { listeningLessons } from "./listening.ts";
import { clinicItems } from "./writingClinic.ts";
import { dialogues } from "./dialogues.ts";
import { placeIndex } from "./places.ts";
import { IN_RELEASE, isPublishedItem } from "./release.ts";

/** Editorial estimates in minutes, shown as «≈» (not measured): a reading text or a recording with its questions, a
 *  dialogue with role-play, a writing-clinic message with its rewrite and new situation. */
export const TASK_MINUTES: Readonly<Record<YkiSkill, number>> = Object.freeze({ reading: 8, listening: 8, speaking: 10, writing: 15 });
export type SessionView = "reading" | "listening" | "writing" | "dialogue";
export interface SessionTaskInfo extends SessionTask { title_fi: string; view: SessionView }

/** Listening evidence is keyed by the shared prefix of the lesson's question ids (b1long-1-q1 → b1long-1). */
const listeningPrefix = (l: { id: string; questions: { id: string }[] }) => {
  const prefixes = new Set(l.questions.map(q => q.id.replace(/-q\d+$/, "")));
  return prefixes.size === 1 ? [...prefixes][0]! : l.id;
};
const info = (item: unknown, id: string, skill: YkiSkill, view: SessionView, title_fi: string, prefix: string): SessionTaskInfo => ({
  id, skill, view, title_fi, prefix, minutes: TASK_MINUTES[skill], place: placeOfTask(placeIndex, prefix)?.place ?? null,
  published: isPublishedItem(item as never),
});
export const sessionTasks: SessionTaskInfo[] = [
  ...readingItems.map(i => info(i, i.id, "reading", "reading", i.title_fi, i.id)),
  ...listeningLessons.map(l => info(l, l.id, "listening", "listening", l.title_fi, listeningPrefix(l))),
  ...clinicItems.map(c => info(c, c.id, "writing", "writing", c.title_fi, c.id)),
  ...dialogues.map(d => info(d, d.id, "speaking", "dialogue", d.title_fi, d.id)),
];
export const taskInfo = (id: string) => sessionTasks.find(t => t.id === id) ?? null;
/** A build that shows labelled drafts may plan them; a release build plans only S2-published tasks. */
export const PLAN_DRAFTS = !IN_RELEASE;

export function sessionCandidates(state: LearnerState, now: Date = new Date()): SessionCandidates {
  const today = localDate(now);
  const delayed = [
    ...delayedTransferQueue(state, transferBank, now).filter(q => q.due).map(q => ({ id: q.taskId, prefix: q.taskId })),
    ...skillRetentionQueue(state, skillRetentionBank, now).filter(q => q.due).map(q => ({ id: skillRetentionTaskId(q.skill), prefix: skillRetentionTaskId(q.skill) })),
  ];
  const phrases = practiceDue(state, practiceCards, today).map(c => c.id);
  const grammar = dueCards(state, today).filter(c => exercises.some(e => e.id === c.id)).map(c => c.id);
  const weak = workshopStatus(state, FAMILIES, workshopItems, today).filter(w => w.isBottleneck && w.set.length > 0);
  const pick = weak.find(w => w.retestDue) ?? weak[0];
  return {
    review: { delayed, phrases, grammar },
    weakSpot: pick ? { family: pick.family, retestDue: pick.retestDue, set: pick.set } : null,
    tasks: sessionTasks,
  };
}
