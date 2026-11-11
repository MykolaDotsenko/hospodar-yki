/** Dialogue scripts + negotiation moves, read from their single physical owner (learning/exercises/b1/contextual). */
import { validateDialogue, withNegotiation, type DialogueItem, type NegotiationMoves } from "@hospodar/domain";
import data from "../../../../learning/exercises/b1/contextual/dialogues-v1.json";
import moves from "../../../../learning/exercises/b1/contextual/negotiation-moves-v1.json";

const items = (data as unknown as { items: DialogueItem[] }).items;
if (!items.every(validateDialogue)) throw new Error("dialogues-v1.json has an invalid item");
/** Each dialogue with its paired clarification request and changed condition (S2-pending drafts). */
export const dialogues = withNegotiation(items, moves as unknown as NegotiationMoves);
