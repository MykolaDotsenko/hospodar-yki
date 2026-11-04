/** Dialogue scripts, read from their single physical owner (learning/exercises/b1/contextual). */
import { validateDialogue, type DialogueItem } from "@hospodar/domain";
import data from "../../../../learning/exercises/b1/contextual/dialogues-v1.json";

const items = (data as unknown as { items: DialogueItem[] }).items;
if (!items.every(validateDialogue)) throw new Error("dialogues-v1.json has an invalid item");
export const dialogues = items;
