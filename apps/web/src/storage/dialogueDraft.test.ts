import { describe, expect, it } from "vitest";
import { dialogueReducer, startDialogue, type DialogueItem, type DialogueSession } from "@hospodar/domain";
import { dialogues } from "../content/dialogues.ts";
import { dialogueFingerprint, dialoguePayload, validDialogueDraft } from "./dialogueDraft.ts";

const d = dialogues[0]!;
function progress(item: DialogueItem): DialogueSession {
  let s = startDialogue(item);
  for (const t of item.turns) {
    if (t.speaker === "A") {
      s = dialogueReducer(s, item, { type: "REPLY", text: "Hei! Minä harjoittelen täällä suomea." });
    }
    s = dialogueReducer(s, item, { type: "NEXT_TURN" });
  }
  for (const q of item.questions) {
    s = dialogueReducer(s, item, { type: "ANSWER", questionId: q.id, text: "Kyllä." });
    s = dialogueReducer(s, item, { type: "JUDGE", questionId: q.id, judgement: "partly" });
  }
  return s;
}
describe("Dialogue checkpoint must replay all independent attempts", () => {
  it("accepts empty, typed, saved turn, answer-before-model, judgement and transfer", () => {
    let s = startDialogue(d);
    expect(validDialogueDraft(dialoguePayload(s, "", d), d)).toBe(true);
    expect(validDialogueDraft(dialoguePayload(s, "Hei, olen uusi.", d), d)).toBe(true);
    s = dialogueReducer(s, d, { type: "REPLY", text: "Hei, olen uusi." });
    expect(validDialogueDraft(dialoguePayload(s, "", d), d)).toBe(true);
    s = dialogueReducer(s, d, { type: "NEXT_TURN" });
    expect(validDialogueDraft(dialoguePayload(s, "", d), d)).toBe(true);
    expect(validDialogueDraft(dialoguePayload(progress(d), "Haluan puhua enemmän.", d), d)).toBe(true);
    const done = dialogueReducer(progress(d), d, { type: "SUBMIT_TRANSFER", text: "Haluan puhua enemmän." });
    expect(validDialogueDraft(dialoguePayload(done, "", d), d)).toBe(false);
  });
  it("rejects fabricated revealed scripts, skipped replies, keys, unknown answers and changed editorial content", () => {
    const s = startDialogue(d), p = dialoguePayload(s, "", d);
    expect(validDialogueDraft({ ...p, session: { ...s, phase: "transfer" } }, d)).toBe(false);
    expect(validDialogueDraft({ ...p, session: { ...s, turn: d.turns.length } }, d)).toBe(false);
    expect(validDialogueDraft({ ...p, session: { ...s, replies: { 0: "surprise" } } }, d)).toBe(false);
    expect(validDialogueDraft({ ...p, session: { ...s, answers: { unexpected: "a" } } }, d)).toBe(false);
    expect(validDialogueDraft({ ...p, session: { ...s, judged: { surprise: "same" } } }, d)).toBe(false);
    expect(validDialogueDraft({ ...p, extra: true }, d)).toBe(false);
    expect(validDialogueDraft({ ...p, input: "x".repeat(801) }, d)).toBe(false);
    expect(validDialogueDraft({ ...p, contentFingerprint: "stale" }, d)).toBe(false);
    expect(dialogueFingerprint({ ...d, turns: d.turns.map((t,i) => i === 0 ? { ...t, text_fi: t.text_fi + "!" } : t) })).not.toBe(dialogueFingerprint(d));
  });
  it("never opens the model answer without the first response or a fabricated self-judgement", () => {
    const t = progress(d);
    expect(validDialogueDraft({ ...dialoguePayload(t, "", d), session: { ...t, answers: {} } }, d)).toBe(false);
    expect(validDialogueDraft({ ...dialoguePayload(t, "", d), session: { ...t, judged: {} } }, d)).toBe(false);
    expect(validDialogueDraft(dialoguePayload(t, "Aion kysyä jotain.", d), d)).toBe(true);
  });
});
