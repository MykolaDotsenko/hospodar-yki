import "fake-indexeddb/auto";
import Dexie from "dexie";
import { describe, expect, it } from "vitest";
import { addDiagnostic, blankState, pictureEvidence, pictureReducer, startPicture } from "@hospodar/domain";
import { pictureMissions } from "../content/pictureMissions.ts";
import { picturePayload } from "./pictureDraft.ts";
import { createLearnerRepository } from "./learnerRepository.ts";

const name = () => "picture-v8-" + Math.random().toString(16).slice(2);
const m = pictureMissions[0]!;
const first = "Tässä on tori ja ihmisiä.";
const transferText = "Haluaisin ostaa omenat torilta.";
const firstSubmitted = () => pictureReducer(startPicture(m.lesson), m.lesson, { type: "SUBMIT_FIRST", text: first });
const transfer = () => pictureReducer(firstSubmitted(), m.lesson, { type: "CONTINUE" });
describe("Dexie v8 independent Picture Mission checkpoint", () => {
  it("stores an unfinished independent answer without claiming completed evidence", async () => {
    const n = name(), repo = createLearnerRepository(n);
    const row = await repo.savePictureDraft(picturePayload(startPicture(m.lesson), first, m), 0, 0);
    expect(row).toMatchObject({ revision: 1, learnerRevision: 0, input: first });
    expect(await createLearnerRepository(n).readPictureDraft()).toEqual(row);
    expect((await repo.read()).state.diagnostics).toHaveLength(0);
    expect((await repo.read()).revision).toBe(0);
  });

  it("blocks stale tab writes, deletion, finish and a different mission ID", async () => {
    const n = name(), a = createLearnerRepository(n), b = createLearnerRepository(n);
    await a.savePictureDraft(picturePayload(startPicture(m.lesson), first, m), 0, 0);
    await a.savePictureDraft(picturePayload(startPicture(m.lesson), first + " Lisää.", m), 0, 1);
    await expect(b.savePictureDraft(picturePayload(startPicture(m.lesson), first, m), 0, 1))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    await expect(b.discardPictureDraft(0, 1)).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    await expect(b.finishPictureDraft(blankState(), 0, 1, m.lesson.lesson_id, transferText))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    const other = pictureMissions[1]!;
    await expect(b.savePictureDraft(picturePayload(startPicture(other.lesson), "", other), 0, 2))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    expect((await b.readPictureDraft())?.input).toBe(first + " Lisää.");
  });

  it("atomically commits both independent responses ungraded, then removes draft exactly once", async () => {
    const n = name(), repo = createLearnerRepository(n), s = transfer();
    const row = await repo.savePictureDraft(picturePayload(s, transferText, m), 0, 0);
    await expect(repo.finishPictureDraft(blankState(), 0, row.revision, m.lesson.lesson_id, "wrong"))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    await expect(repo.finishPictureDraft(blankState(), 0, row.revision, "other-lesson", transferText))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    const done = pictureReducer(s, m.lesson, { type: "SUBMIT_TRANSFER", text: transferText });
    let next = blankState();
    for (const ev of pictureEvidence(done, m.lesson)) next = addDiagnostic(next, ev);
    const saved = await repo.finishPictureDraft(next, 0, row.revision, m.lesson.lesson_id, transferText);
    expect(saved.revision).toBe(1);
    const reopened = createLearnerRepository(n);
    expect(await reopened.readPictureDraft()).toBeNull();
    const diagnostics = (await reopened.read()).state.diagnostics;
    expect(diagnostics).toHaveLength(2);
    expect(diagnostics.map(d => d.status)).toEqual(["ungraded", "ungraded"]);
    await expect(repo.finishPictureDraft(next, 0, row.revision, m.lesson.lesson_id, transferText))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
  });

  it("rejects import/restore over a draft, requires exact revision to erase and verifies empty", async () => {
    const n = name(), a = createLearnerRepository(n), b = createLearnerRepository(n);
    await a.savePictureDraft(picturePayload(startPicture(m.lesson), first, m), 0, 0);
    await expect(a.restoreWebLearn(blankState(), [], 0))
      .rejects.toMatchObject({ code: "DESTINATION_NOT_EMPTY" });
    await expect(a.importLegacy(blankState(), { id: "picture-import", source: "legacy_v1_file",
      originalSha256: "a".repeat(64), originalBytes: 3,
      counts: { attempts: 0, diagnostics: 0, errors: 0, retention: 0, cards: 0 } }))
      .rejects.toMatchObject({ code: "DESTINATION_NOT_EMPTY" });
    await b.savePictureDraft(picturePayload(startPicture(m.lesson), first + " Nyt.", m), 0, 1);
    await expect(a.eraseAll(0, 0, 0, 0, 0, 0, 1)).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    await a.eraseAll(0, 0, 0, 0, 0, 0, 2);
    expect(await b.readPictureDraft()).toBeNull();
    expect(await b.read()).toEqual({ state: blankState(), revision: 0 });
  });

  it("preserves existing v7 learner and Dialogue rows on additive v8 upgrade", async () => {
    const n = name(), old = new Dexie(n);
    old.version(7).stores({ learner: "id", imports: "id", missionDraft: "id", clinicDraft: "id",
      readingDraft: "id", listeningDraft: "id", dialogueDraft: "id" });
    await old.table("learner").put({ id: "current", revision: 1, state: blankState(), updatedAt: "2026-11-10T00:00:00Z" });
    await old.table("dialogueDraft").put({ id: "active", revision: 1, learnerRevision: 1, savedAt: "2026-11-10T00:00:00Z",
      session: { itemId: "old-dialogue", phase: "turns", turn: 0, replies: {}, qIndex: 0, answers: {}, judged: {}, transfer: "" },
      input: "Old retained value", contentFingerprint: "existing" });
    old.close();
    const upgraded = createLearnerRepository(n);
    expect((await upgraded.read()).revision).toBe(1);
    expect((await upgraded.readDialogueDraft())?.input).toBe("Old retained value");
    expect(await upgraded.readPictureDraft()).toBeNull();
  });
});
