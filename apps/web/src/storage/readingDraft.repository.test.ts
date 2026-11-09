import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import Dexie from "dexie";
import { addDiagnostic, blankState, readingEvidence, readingReducer, startReading } from "@hospodar/domain";
import { readingItems } from "../content/reading.ts";
import { readingPayload } from "./readingDraft.ts";
import { createLearnerRepository } from "./learnerRepository.ts";

const db = () => "reading-v5-" + Math.random().toString(16).slice(2);
const item = readingItems[0]!;
const ownText = "Haluan oppia suomea ja osallistua kielikahvilaan ensi keskiviikkona.";
function transfer() {
  let s = startReading(item);
  for (const q of item.questions) {
    const value = q.type === "single_choice" ? String(q.correct_index) : q.type === "true_false" ? "false" : ownText;
    s = readingReducer(s, item, { type: "ANSWER", questionId: q.id, value });
  }
  for (const q of item.questions) if (q.type === "open")
    s = readingReducer(s, item, { type: "JUDGE", questionId: q.id, judgement: "partly" });
  return readingReducer(s, item, { type: "TO_TRANSFER", kind: "writing" });
}
describe("Dexie v5 Reading checkpoint / completion", () => {
  it("upgrades real v4 IndexedDB without erasing the old learner document", async () => {
    const n = db();
    const old = new Dexie(n);
    old.version(4).stores({ learner: "id", imports: "id", missionDraft: "id", clinicDraft: "id" });
    await old.table("learner").put({ id: "current", revision: 3, state: blankState(), updatedAt: "2026-11-08" });
    old.close();
    const repo = createLearnerRepository(n);
    expect((await repo.read()).revision).toBe(3);
    expect(await repo.readReadingDraft()).toBeNull();
    const row = await repo.saveReadingDraft(readingPayload(startReading(item), ownText, item), 3, 0);
    expect(row.learnerRevision).toBe(3);
  });
  it("recovers editable Finnish and an independently submitted phase across new DB handles; no premature evidence", async () => {
    const n = db(), a = createLearnerRepository(n);
    const row = await a.saveReadingDraft(readingPayload(startReading(item), ownText, item), 0, 0);
    expect(row).toMatchObject({ revision: 1, learnerRevision: 0, input: ownText });
    expect(await createLearnerRepository(n).readReadingDraft()).toEqual(row);
    const s = readingReducer(startReading(item), item, { type: "ANSWER", questionId: item.questions[0]!.id, value: "0" });
    const saved = await a.saveReadingDraft(readingPayload(s, "", item), 0, 1);
    expect(saved.session.index).toBe(1);
    expect((await createLearnerRepository(n).read()).state.diagnostics).toHaveLength(0);
  });
  it("stale tabs cannot overwrite, delete or finish newer Reading work", async () => {
    const n = db(), a = createLearnerRepository(n), b = createLearnerRepository(n);
    await a.saveReadingDraft(readingPayload(startReading(item), ownText, item), 0, 0);
    await a.saveReadingDraft(readingPayload(startReading(item), ownText + " Uusi.", item), 0, 1);
    await expect(b.saveReadingDraft(readingPayload(startReading(item), "older", item), 0, 1))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    await expect(b.discardReadingDraft(0, 1)).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    await expect(b.finishReadingDraft(blankState(), 0, 1, item.id, ownText))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    expect((await b.readReadingDraft())?.input).toBe(ownText + " Uusi.");
  });
  it("commits first objective evidence and ungraded transfer exactly once, atomically removing checkpoint", async () => {
    const n = db(), repo = createLearnerRepository(n), s = transfer();
    const row = await repo.saveReadingDraft(readingPayload(s, ownText, item), 0, 0);
    await expect(repo.finishReadingDraft(blankState(), 0, row.revision, item.id, "different"))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    expect((await repo.read()).state.diagnostics).toHaveLength(0);
    let state = blankState();
    const finished = readingReducer(s, item, { type: "SUBMIT_TRANSFER", text: ownText });
    for (const ev of readingEvidence(finished, item)) state = addDiagnostic(state, ev);
    const saved = await repo.finishReadingDraft(state, 0, row.revision, item.id, ownText);
    expect(saved.revision).toBe(1);
    const reopened = createLearnerRepository(n);
    expect(await reopened.readReadingDraft()).toBeNull();
    expect((await reopened.read()).state.diagnostics).toHaveLength(item.questions.length + 1);
    await expect(repo.finishReadingDraft(state, 0, row.revision, item.id, ownText))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
  });
  it("blocks import/restore with unfinished Reading and requires Reading revision before LEARN deletion", async () => {
    const n = db(), a = createLearnerRepository(n), b = createLearnerRepository(n);
    await a.saveReadingDraft(readingPayload(startReading(item), ownText, item), 0, 0);
    await expect(a.restoreWebLearn(blankState(), [], 0)).rejects.toMatchObject({ code: "DESTINATION_NOT_EMPTY" });
    await expect(a.importLegacy(blankState(), { id: "legacy-read", source: "legacy_v1_file",
      originalSha256: "a".repeat(64), originalBytes: 2,
      counts: { attempts: 0, diagnostics: 0, errors: 0, retention: 0, cards: 0 } }))
      .rejects.toMatchObject({ code: "DESTINATION_NOT_EMPTY" });
    await b.saveReadingDraft(readingPayload(startReading(item), ownText + " 2", item), 0, 1);
    await expect(a.eraseAll(0, 0, 0, 1)).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    expect((await a.readReadingDraft())?.input).toBe(ownText + " 2");
    await a.eraseAll(0, 0, 0, 2);
    expect(await b.readReadingDraft()).toBeNull();
    expect(await b.read()).toEqual({ state: blankState(), revision: 0 });
  });
  it("rejects saving on an unrelated learner revision or overwriting a different active item", async () => {
    const n = db(), repo = createLearnerRepository(n);
    await repo.saveReadingDraft(readingPayload(startReading(item), "", item), 0, 0);
    const another = readingItems[1]!;
    await expect(repo.saveReadingDraft(readingPayload(startReading(another), "", another), 0, 1))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    await repo.commit(blankState(), 0);
    await expect(repo.saveReadingDraft(readingPayload(startReading(item), "a", item), 0, 1))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
  });
});
