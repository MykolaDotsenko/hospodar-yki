/** Dialogue scripts + negotiation moves, read from their single physical owner (learning/exercises/b1/contextual). */
import { validateDialogue, withNegotiation, type DialogueItem, type NegotiationMoves } from "@hospodar/domain";
import data from "../../../../learning/exercises/b1/contextual/dialogues-v1.json";
import moves from "../../../../learning/exercises/b1/contextual/negotiation-moves-v1.json";
import { IN_RELEASE, isPublishedItem, learnerPool } from "./release.ts";

const items = learnerPool((data as unknown as { items: DialogueItem[] }).items);
if (!items.every(validateDialogue)) throw new Error("dialogues-v1.json has an invalid item");
/** Each dialogue with its paired clarification request and changed condition (S2-pending drafts). */
/** In a release build the partner moves join only when that file is published too; otherwise dialogues run without them. */
const releasedMoves = !IN_RELEASE || isPublishedItem(moves) ? (moves as unknown as NegotiationMoves) : { ...(moves as unknown as NegotiationMoves), pairing: {} };
export const dialogues = withNegotiation(items, releasedMoves);
