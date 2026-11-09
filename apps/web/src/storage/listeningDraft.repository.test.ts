import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import Dexie from "dexie";
import { addDiagnostic, blankState, listeningEvidence, listeningReducer, startListening } from "@hospodar/domain";
import { listeningLessons } from "../content/listening.ts";
import { listeningPayload } from "./listeningDraft.ts";
import { createLearnerRepository } from "./learnerRepository.ts";

const name = () => "listening-v6-" + Math.random().toString(16).slice(2);
const lesson = listeningLessons[0]!;
const prediction = "Vesikatkosta ja huoltokäynnistä.";
function feedback(supported: boolean) {
  let s = listeningReducer(startListening(lesson), lesson, { type: "SUBMIT_PREDICTION", text: prediction });
  if (supported) s = listeningReducer(s, lesson, { type: "REQUEST_SUPPORT", kind: "transcript" });
  else s = listeningReducer(s, lesson, { type: "AUDIO_STARTED" });
  s = listeningReducer(s, lesson, { type: "BEGIN_QUESTIONS" });
  for (const q of lesson.questions) s = listeningReducer(s, lesson, { type: "ANSWER", questionId: q.id, optionIndex: 0 });
  return s;
}
describe("Dexie v6 Listening checkpoint and evidence receipts", () => {
  it("upgrades v5 learner rows without touching earlier learner data or draft tables", async () => {
    const n = name(), v5 = new Dexie(n);
    v5.version(5).stores({ learner: "id", imports: "id", missionDraft: "id", clinicDraft: "id", readingDraft: "id" });
    await v5.table("learner").put({ id: "current", revision: 2, state: blankState(), updatedAt: "2026-11-09" });
    v5.close();
    const r = createLearnerRepository(n);
    expect((await r.read()).revision).toBe(2);
    expect(await r.readListeningDraft()).toBeNull();
    const row = await r.saveListeningDraft(listeningPayload(startListening(lesson), prediction, lesson), 2, 0);
    expect(row).toMatchObject({ revision: 1, learnerRevision: 2, input: prediction });
  });
  it("recovers exact prediction and supported stage in another IndexedDB handle without scoring", async () => {
    const n = name(), a = createLearnerRepository(n);
    const row = await a.saveListeningDraft(listeningPayload(startListening(lesson), prediction, lesson), 0, 0);
    expect(await createLearnerRepository(n).readListeningDraft()).toEqual(row);
    let s = listeningReducer(startListening(lesson), lesson, { type: "SUBMIT_PREDICTION", text: prediction });
    s = listeningReducer(s, lesson, { type: "REQUEST_SUPPORT", kind: "slow" });
    const saved = await a.saveListeningDraft(listeningPayload(s, "", lesson), 0, row.revision);
    expect(saved.session.support).toEqual(["slow"]);
    expect((await createLearnerRepository(n).read()).state.diagnostics).toHaveLength(0);
  });
  it("blocks conflicting tabs, wrong lesson, stale discard and changed learner revision", async () => {
    const n = name(), a = createLearnerRepository(n), b = createLearnerRepository(n);
    await a.saveListeningDraft(listeningPayload(startListening(lesson), prediction, lesson), 0, 0);
    await a.saveListeningDraft(listeningPayload(startListening(lesson), prediction + " Uusi", lesson), 0, 1);
    await expect(b.saveListeningDraft(listeningPayload(startListening(lesson), "stale", lesson), 0, 1))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    await expect(b.discardListeningDraft(0, 1)).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    const other = listeningLessons[1]!;
    await expect(b.saveListeningDraft(listeningPayload(startListening(other), "", other), 0, 2))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    await a.commit(blankState(), 0);
    await expect(b.saveListeningDraft(listeningPayload(startListening(lesson), prediction, lesson), 0, 2))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
  });
  it("supported transcript remains ungraded and final evidence + checkpoint deletion happen once", async () => {
    const n = name(), a = createLearnerRepository(n), s = feedback(true);
    const row = await a.saveListeningDraft(listeningPayload(s, "", lesson), 0, 0);
    const done = listeningReducer(s, lesson, { type: "FINISH" });
    const evidence = listeningEvidence(done, lesson);
    expect(evidence).toHaveLength(lesson.questions.length);
    expect(evidence.every(x => x.status === "ungraded")).toBe(true);
    let state = blankState();
    for (const ev of evidence) state = addDiagnostic(state, ev);
    await expect(a.finishListeningDraft(state, 0, row.revision, "other-lesson"))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    expect((await a.read()).state.diagnostics).toHaveLength(0);
    expect((await a.finishListeningDraft(state, 0, row.revision, lesson.id)).revision).toBe(1);
    const reopened = createLearnerRepository(n);
    expect(await reopened.readListeningDraft()).toBeNull();
    expect((await reopened.read()).state.diagnostics).toHaveLength(lesson.questions.length);
    await expect(a.finishListeningDraft(state, 0, row.revision, lesson.id)).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
  });
  it("independent session keeps scored objective first choices, but not before completion", async () => {
    const n = name(), a = createLearnerRepository(n), s = feedback(false);
    await a.saveListeningDraft(listeningPayload(s, "", lesson), 0, 0);
    expect((await a.read()).state.diagnostics).toHaveLength(0);
    let state = blankState();
    for (const ev of listeningEvidence(listeningReducer(s, lesson, { type: "FINISH" }), lesson))
      state = addDiagnostic(state, ev);
    await a.finishListeningDraft(state, 0, 1, lesson.id);
    expect((await a.read()).state.diagnostics).toHaveLength(lesson.questions.length);
    expect((await a.read()).state.diagnostics.every(d => d.status === "scored")).toBe(true);
  });
  it("protects unfinished Listening in import, restore, and revision-guarded LEARN erasure", async () => {
    const n = name(), a = createLearnerRepository(n), b = createLearnerRepository(n);
    await a.saveListeningDraft(listeningPayload(startListening(lesson), prediction, lesson), 0, 0);
    await expect(a.restoreWebLearn(blankState(), [], 0)).rejects.toMatchObject({ code: "DESTINATION_NOT_EMPTY" });
    await expect(a.importLegacy(blankState(), { id: "legacy-listen", source: "legacy_v1_file",
      originalSha256: "b".repeat(64), originalBytes: 3,
      counts: { attempts: 0, diagnostics: 0, errors: 0, retention: 0, cards: 0 } }))
      .rejects.toMatchObject({ code: "DESTINATION_NOT_EMPTY" });
    await b.saveListeningDraft(listeningPayload(startListening(lesson), prediction + " toinen", lesson), 0, 1);
    await expect(a.eraseAll(0, 0, 0, 0, 1)).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    expect((await a.readListeningDraft())?.input).toBe(prediction + " toinen");
    await a.eraseAll(0, 0, 0, 0, 2);
    expect(await createLearnerRepository(n).readListeningDraft()).toBeNull();
  });
});
