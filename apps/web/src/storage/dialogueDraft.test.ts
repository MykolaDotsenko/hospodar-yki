import { describe, expect, it } from "vitest";
import { dialogueReducer, startDialogue, type DialogueItem, type DialogueSession } from "@hospodar/domain";
import { dialogues } from "../content/dialogues.ts";
import { dialogueFingerprint, dialoguePayload, validDialogueDraft } from "./dialogueDraft.ts";

const d = dialogues[0]!;
function progress(item: DialogueItem): DialogueSession {
  let s = startDialogue(item);
  for (const t of item.turns) {
    if (t.speaker === "A") {
      const at = s.turn;
      s = dialogueReducer(s, item, { type: "REPLY", text: "Hei! Minä harjoittelen täällä suomea." });
      if (at === item.negotiation?.repairTurn) {
        s = dialogueReducer(s, item, { type: "REPHRASE", text: "Opiskelen suomea täällä." });
        s = dialogueReducer(s, item, { type: "JUDGE_REPAIR", judgement: "same" });
      }
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
    expect(progress(d).phase).toBe("roleplay");
    expect(validDialogueDraft(dialoguePayload(progress(d), "Haluan puhua enemmän.", d), d)).toBe(true);
    const changed = dialogueReducer(progress(d), d, { type: "SUBMIT_ROLEPLAY", text: "Haluan puhua enemmän." });
    expect(validDialogueDraft(dialoguePayload(changed, "Sopiiko myöhemmin?", d), d)).toBe(true);
    const done = dialogueReducer(changed, d, { type: "SUBMIT_TRANSFER", text: "Sopiiko myöhemmin?" });
    expect(validDialogueDraft(dialoguePayload(done, "", d), d)).toBe(false);
  });
  it("negotiation checkpoint: second wording only after an own reply; no script, continuation or changed condition without it", () => {
    const r = d.negotiation!.repairTurn;
    let s = startDialogue(d);
    for (let i = 0; i < r; i++) {
      if (d.turns[i]!.speaker === "A") s = dialogueReducer(s, d, { type: "REPLY", text: "Hei." });
      s = dialogueReducer(s, d, { type: "NEXT_TURN" });
    }
    s = dialogueReducer(s, d, { type: "REPLY", text: "Haluan puhua." });
    expect(validDialogueDraft(dialoguePayload(s, "Haluaisin harjoi", d), d)).toBe(true);            // typing the second wording
    expect(validDialogueDraft(dialoguePayload({ ...s, turn: r + 1 }, "", d), d)).toBe(false);          // skipped the clarification
    expect(validDialogueDraft(dialoguePayload({ ...s, repairJudged: "same" }, "", d), d)).toBe(false); // confirmed nothing
    const said = dialogueReducer(s, d, { type: "REPHRASE", text: "Haluaisin harjoitella." });
    expect(validDialogueDraft(dialoguePayload(said, "", d), d)).toBe(true);
    expect(validDialogueDraft(dialoguePayload(said, "ei kenttää", d), d)).toBe(false);                  // no input field while confirming
    const ok = dialogueReducer(said, d, { type: "JUDGE_REPAIR", judgement: "partly" });
    expect(validDialogueDraft(dialoguePayload(ok, "", d), d)).toBe(true);
    const rp = progress(d);
    expect(validDialogueDraft(dialoguePayload({ ...rp, phase: "transfer" }, "", d), d)).toBe(false);   // changed condition without own role-play
    expect(validDialogueDraft(dialoguePayload({ ...rp, roleplay: "keksitty" }, "", d), d)).toBe(false);
    expect(dialogueFingerprint({ ...d, negotiation: { ...d.negotiation!, condition_change_fi: "Muu." } })).not.toBe(dialogueFingerprint(d));
  });
  it("rejects fabricated revealed scripts, skipped replies, keys, unknown answers and changed editorial content", () => {
    const s = startDialogue(d), p = dialoguePayload(s, "", d);
    expect(validDialogueDraft({ ...p, session: { ...s, phase: "transfer" } }, d)).toBe(false);
    expect(validDialogueDraft({ ...p, session: { ...s, turn: d.turns.length } }, d)).toBe(false);
    expect(validDialogueDraft({ ...p, session: { ...s, replies: { 1: "surprise" } } }, d)).toBe(false);
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
