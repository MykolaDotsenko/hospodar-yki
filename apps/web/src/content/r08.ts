/** R08 meaning→form tasks. Learners only ever get S2-published items (review_card); drafts are
 *  reachable exclusively through the S2 reviewer preview, which records nothing. */
import { validateR08Task, type R08Task } from "@hospodar/domain";
import data from "../../../../learning/exercises/b1/grammar/r08-meaning-stems-original-drafts.json";

type WithCard = R08Task & { review_card?: { status?: string } };
export const r08Drafts = (data as unknown as { exercises: WithCard[] }).exercises;
export const learnerR08Tasks = r08Drafts.filter(t => t.review_card?.status === "published" && validateR08Task(t, { requireApproved: true }));
