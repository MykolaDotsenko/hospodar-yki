import { describe, expect, it } from "vitest";
import { clinicReducer, startClinic } from "@hospodar/domain";
import { clinicItems } from "../content/writingClinic.ts";
import { clinicFingerprint, clinicPayload, validClinicDraft } from "./clinicDraft.ts";

const item = clinicItems[0]!;
const draft = "Hei! Minulla on ongelma asunnossa. Voitteko auttaa minua tällä viikolla?";
describe("writing clinic draft version/replay gate", () => {
  it("admits only matching content and legitimate reducer phases", () => {
    const s0 = startClinic(item);
    expect(validClinicDraft(clinicPayload(s0, draft, item), item)).toBe(true);
    const s1 = clinicReducer(s0, item, { type: "SUBMIT_DRAFT", text: draft });
    const s2 = clinicReducer(s1, item, { type: "SELF_CHECK", points: [0] });
    const s3 = clinicReducer(clinicReducer(s2, item, { type: "DRAFT_SAVED" }), item, { type: "CONTINUE" });
    expect(validClinicDraft(clinicPayload(s3, "", item), item)).toBe(true);
    const s4 = clinicReducer(s3, item, { type: "MARK", sentences: [0] });
    const s5 = clinicReducer(s4, item, { type: "CONTINUE" });
    const s6 = clinicReducer(s5, item, { type: "CONTINUE" });
    const s7 = clinicReducer(s6, item, { type: "CONTINUE" });
    const s8 = clinicReducer(s7, item, { type: "SUBMIT_REWRITE", text: draft });
    for (const state of [s4, s5, s6, s7, s8]) expect(validClinicDraft(clinicPayload(state, "", item), item)).toBe(true);
  });
  it("refuses a forged post-model phase, mismatched content, oversized text and done", () => {
    const s = startClinic(item), p = clinicPayload(s, "Terve!", item);
    expect(validClinicDraft({ ...p, session: { ...s, phase: "model" } }, item)).toBe(false);
    expect(validClinicDraft({ ...p, contentFingerprint: "old" }, item)).toBe(false);
    expect(validClinicDraft({ ...p, input: "a".repeat(1601) }, item)).toBe(false);
    expect(validClinicDraft({ ...p, session: { ...s, phase: "done" } }, item)).toBe(false);
    expect(validClinicDraft({ ...p, session: { ...s, firstAnswer: "hidden" } }, item)).toBe(false);
    expect(clinicFingerprint({ ...item, model_fi: item.model_fi + "!" })).not.toBe(clinicFingerprint(item));
  });
});
