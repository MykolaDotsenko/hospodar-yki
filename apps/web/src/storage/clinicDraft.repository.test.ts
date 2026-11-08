import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { addDiagnostic, blankState, clinicEvidence, clinicReducer, startClinic } from "@hospodar/domain";
import { clinicItems } from "../content/writingClinic.ts";
import { clinicPayload } from "./clinicDraft.ts";
import { createLearnerRepository } from "./learnerRepository.ts";

const db = () => "clinic-v4-" + Math.random().toString(16).slice(2);
const item = clinicItems[0]!;
const firstText = "Hei! Minulla on ongelma kylpyhuoneen seinässä. Voitteko tulla katsomaan pian?";
const newText = "Hei! Keittiön ikkunasta vetää kylmää. Sopiiko huolto tiistaina tai torstaina?";
const first = () => clinicReducer(startClinic(item), item, { type: "SUBMIT_DRAFT", text: firstText });
const checked = () => clinicReducer(first(), item, { type: "SELF_CHECK", points: [0] });
const spot = () => clinicReducer(clinicReducer(checked(), item, { type: "DRAFT_SAVED" }), item, { type: "CONTINUE" });
const transfer = () => {
  let s = clinicReducer(spot(), item, { type: "MARK", sentences: [0] });
  for (let i = 0; i < 3; i++) s = clinicReducer(s, item, { type: "CONTINUE" });
  return clinicReducer(s, item, { type: "SUBMIT_REWRITE", text: firstText });
};

describe("Dexie v4 Writing Clinic checkpoint invariants", () => {
  it("recovers exact Finnish from another Dexie instance; incomplete writing is not counted", async () => {
    const n = db(), repo = createLearnerRepository(n);
    const saved = await repo.saveClinicDraft(clinicPayload(startClinic(item), firstText, item), 0, 0);
    expect(saved).toMatchObject({ revision: 1, learnerRevision: 0, input: firstText });
    expect(await createLearnerRepository(n).readClinicDraft()).toEqual(saved);
    expect((await repo.read()).state.diagnostics).toHaveLength(0);
    await repo.saveClinicDraft(clinicPayload(first(), "", item), 0, 1);
    expect((await createLearnerRepository(n).readClinicDraft())?.session.phase).toBe("selfcheck");
  });
  it("refuses stale tab write/discard and retains newer text", async () => {
    const n = db(), a = createLearnerRepository(n), b = createLearnerRepository(n);
    await a.saveClinicDraft(clinicPayload(startClinic(item), firstText, item), 0, 0);
    await a.saveClinicDraft(clinicPayload(startClinic(item), newText, item), 0, 1);
    await expect(b.saveClinicDraft(clinicPayload(startClinic(item), "stale", item), 0, 1))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    await expect(b.discardClinicDraft(0, 1)).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    expect((await b.readClinicDraft())?.input).toBe(newText);
  });
  it("atomically commits first draft with spot phase and final evidence with draft deletion", async () => {
    const n = db(), repo = createLearnerRepository(n);
    await repo.saveClinicDraft(clinicPayload(first(), "", item), 0, 0);
    await repo.saveClinicDraft(clinicPayload(checked(), "", item), 0, 1);
    let state = blankState();
    for (const ev of clinicEvidence(checked(), item, "draft")) state = addDiagnostic(state, ev);
    const mid = await repo.commitClinicDraftEvidence(state, clinicPayload(spot(), "", item), 0, 2);
    expect(mid.snapshot.revision).toBe(1);
    expect(mid.draft).toMatchObject({ revision: 3, learnerRevision: 1 });
    expect((await createLearnerRepository(n).read()).state.diagnostics).toHaveLength(1);
    const pending = await repo.saveClinicDraft(clinicPayload(transfer(), newText, item), 1, 3);
    await expect(repo.finishClinicDraft(state, 1, pending.revision, item.id, "wrong text"))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    expect((await repo.read()).state.diagnostics).toHaveLength(1);
    const finished = clinicReducer(transfer(), item, { type: "SUBMIT_TRANSFER", text: newText });
    for (const ev of clinicEvidence(finished, item, "final")) state = addDiagnostic(state, ev);
    expect((await repo.finishClinicDraft(state, 1, pending.revision, item.id, newText)).revision).toBe(2);
    expect((await createLearnerRepository(n).read()).state.diagnostics).toHaveLength(3);
    expect(await createLearnerRepository(n).readClinicDraft()).toBeNull();
    await expect(repo.finishClinicDraft(state, 1, pending.revision, item.id, newText))
      .rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    expect((await repo.read()).state.diagnostics).toHaveLength(3);
  });
  it("blocks import/restore while draft exists and protects it from stale LEARN erase", async () => {
    const n = db(), a = createLearnerRepository(n), b = createLearnerRepository(n);
    await a.saveClinicDraft(clinicPayload(startClinic(item), firstText, item), 0, 0);
    await expect(a.restoreWebLearn(blankState(), [], 0)).rejects.toMatchObject({ code: "DESTINATION_NOT_EMPTY" });
    await expect(a.importLegacy(blankState(), { id: "legacy-check", source: "legacy_v1_file",
      originalSha256: "a".repeat(64), originalBytes: 2,
      counts: { attempts: 0, diagnostics: 0, errors: 0, retention: 0, cards: 0 } }))
      .rejects.toMatchObject({ code: "DESTINATION_NOT_EMPTY" });
    await b.saveClinicDraft(clinicPayload(startClinic(item), newText, item), 0, 1);
    await expect(a.eraseAll(0, 0, 1)).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    expect((await a.readClinicDraft())?.input).toBe(newText);
    await a.eraseAll(0, 0, 2);
    expect(await b.readClinicDraft()).toBeNull();
    expect(await b.read()).toEqual({ state: blankState(), revision: 0 });
  });
});
