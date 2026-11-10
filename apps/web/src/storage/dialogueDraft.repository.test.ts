import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { addDiagnostic, blankState, dialogueEvidence, dialogueReducer, startDialogue } from "@hospodar/domain";
import { dialogues } from "../content/dialogues.ts";
import { dialoguePayload } from "./dialogueDraft.ts";
import { createLearnerRepository } from "./learnerRepository.ts";

const db = () => "dialogue-v7-" + Math.random().toString(16).slice(2);
const item = dialogues[0]!;
const own = "Hei! Olen tänään uudessa kielikahvilassa.";
function transfer() {
  let s = startDialogue(item);
  for (const t of item.turns) {
    if (t.speaker === "A") s = dialogueReducer(s, item, { type: "SKIP_REPLY" });
    s = dialogueReducer(s, item, { type: "NEXT_TURN" });
  }
  for (const q of item.questions) {
    s = dialogueReducer(s, item, { type: "ANSWER", questionId: q.id, text: own });
    s = dialogueReducer(s, item, { type: "JUDGE", questionId: q.id, judgement: "partly" });
  }
  return s;
}
describe("Dexie v7 Dialogue checkpoint", () => {
  it("persists and reloads unfinished answers separately from completed learner history", async () => {
    const n = db(), a = createLearnerRepository(n);
    const row = await a.saveDialogueDraft(dialoguePayload(startDialogue(item), own, item), 0, 0);
    expect(row).toMatchObject({ revision: 1, learnerRevision: 0, input: own });
    expect(await createLearnerRepository(n).readDialogueDraft()).toEqual(row);
    expect((await a.read()).state.diagnostics).toHaveLength(0);
  });
  it("blocks stale-tab writes and deletion or completion after a concurrent edit", async () => {
    const n = db(), a = createLearnerRepository(n), b = createLearnerRepository(n);
    await a.saveDialogueDraft(dialoguePayload(startDialogue(item), own, item), 0, 0);
    await a.saveDialogueDraft(dialoguePayload(startDialogue(item), own + " Moi.", item), 0, 1);
    await expect(b.saveDialogueDraft(dialoguePayload(startDialogue(item), "older", item), 0, 1))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    await expect(b.discardDialogueDraft(0, 1)).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    await expect(b.finishDialogueDraft(blankState(), 0, 1, item.id, own))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    expect((await a.readDialogueDraft())?.input).toBe(own + " Moi.");
  });
  it("commits first answers as ungraded evidence exactly once and removes checkpoint atomically", async () => {
    const n = db(), repo = createLearnerRepository(n), s = transfer();
    const row = await repo.saveDialogueDraft(dialoguePayload(s, own, item), 0, 0);
    await expect(repo.finishDialogueDraft(blankState(), 0, row.revision, item.id, "not the text"))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    const done = dialogueReducer(s, item, { type: "SUBMIT_TRANSFER", text: own });
    let state = blankState();
    for (const ev of dialogueEvidence(done, item)) state = addDiagnostic(state, ev);
    const committed = await repo.finishDialogueDraft(state, 0, row.revision, item.id, own);
    expect(committed.revision).toBe(1);
    const back = createLearnerRepository(n);
    expect(await back.readDialogueDraft()).toBeNull();
    expect((await back.read()).state.diagnostics).toHaveLength(item.questions.length + 1);
    expect((await back.read()).state.diagnostics.every(ev => ev.status === "ungraded")).toBe(true);
    await expect(repo.finishDialogueDraft(state, 0, row.revision, item.id, own))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
  });
  it("does not overwrite pending dialogue on import/restore; erasure checks draft revisions", async () => {
    const n = db(), a = createLearnerRepository(n), b = createLearnerRepository(n);
    await a.saveDialogueDraft(dialoguePayload(startDialogue(item), own, item), 0, 0);
    await expect(a.restoreWebLearn(blankState(), [], 0)).rejects.toMatchObject({ code: "DESTINATION_NOT_EMPTY" });
    await expect(a.importLegacy(blankState(), { id: "legacy-dialogue", source: "legacy_v1_file",
      originalSha256: "a".repeat(64), originalBytes: 2,
      counts: { attempts: 0, diagnostics: 0, errors: 0, retention: 0, cards: 0 } }))
      .rejects.toMatchObject({ code: "DESTINATION_NOT_EMPTY" });
    await b.saveDialogueDraft(dialoguePayload(startDialogue(item), own + " Parempi.", item), 0, 1);
    await expect(a.eraseAll(0, 0, 0, 0, 0, 1)).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    await a.eraseAll(0, 0, 0, 0, 0, 2);
    expect(await b.readDialogueDraft()).toBeNull();
    expect(await b.read()).toEqual({ state: blankState(), revision: 0 });
  });
  it("refuses other dialogue overwrite or divergent learner profile", async () => {
    const repo = createLearnerRepository(db());
    await repo.saveDialogueDraft(dialoguePayload(startDialogue(item), "", item), 0, 0);
    const other = dialogues[1]!;
    await expect(repo.saveDialogueDraft(dialoguePayload(startDialogue(other), "", other), 0, 1))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    await repo.commit(blankState(), 0);
    await expect(repo.saveDialogueDraft(dialoguePayload(startDialogue(item), "", item), 0, 1))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
  });
});
