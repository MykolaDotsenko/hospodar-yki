import { describe, expect, it } from "vitest";
import { pictureReducer, pictureView, startPicture } from "@hospodar/domain";
import { pictureMissions } from "../content/pictureMissions.ts";
import { pictureFingerprint, picturePayload, validPictureDraft } from "./pictureDraft.ts";

const m = pictureMissions[0]!;
const first = "Tässä on tori, ihmisiä ja monta kauppaa.";
const transfer = "Anteeksi, paljonko omenat maksavat?";
const start = () => startPicture(m.lesson);
const supported = () => pictureReducer(start(), m.lesson, { type: "SUBMIT_FIRST", text: first });
const transferred = () => pictureReducer(supported(), m.lesson, { type: "CONTINUE" });

describe("Picture Mission reducer-replayed checkpoint, IV-REQ-06", () => {
  it("accepts fresh, partial first answer, frozen first answer and independent transfer input", () => {
    expect(validPictureDraft(picturePayload(start(), "", m), m)).toBe(true);
    expect(validPictureDraft(picturePayload(start(), "Ensimmäinen yritys.", m), m)).toBe(true);
    expect(validPictureDraft(picturePayload(supported(), "", m), m)).toBe(true);
    expect(validPictureDraft(picturePayload(transferred(), transfer, m), m)).toBe(true);
    expect(validPictureDraft(picturePayload(transferred(), "", m), m)).toBe(true);
    expect(validPictureDraft(picturePayload(pictureReducer(transferred(), m.lesson,
      { type: "SUBMIT_TRANSFER", text: transfer }), "", m), m)).toBe(false);
  });

  it("rejects fake hints, unsubmitted first, forged transfer, extraneous fields and stale content", () => {
    const raw = picturePayload(start(), "", m);
    const fake = [
      { ...raw, session: { ...start(), phase: "support" } },
      { ...raw, session: { ...start(), phase: "transfer" } },
      { ...raw, session: { ...start(), first } },
      { ...raw, session: { ...start(), transfer } },
      { ...raw, session: { ...start(), unknown: true } },
      { ...raw, contentFingerprint: "old-content" },
      { ...raw, input: "x".repeat(801) },
      { ...raw, extra: true },
      { ...picturePayload(supported(), "", m), input: "text in support" },
      { ...picturePayload(supported(), "", m), session: { ...supported(), first: " " + first } },
    ];
    for (const f of fake) expect(validPictureDraft(f, m)).toBe(false);
    expect(pictureFingerprint({ ...m, lesson: { ...m.lesson, initial_prompt_fi: "New editorial text" } })).not.toBe(pictureFingerprint(m));
    expect(pictureFingerprint({ ...m, picture: { ...m.picture, alt_uk: m.picture.alt_uk + " зміна" } })).not.toBe(pictureFingerprint(m));
  });

  it("keeps the picture and model hidden as appropriate, never marks open production graded", () => {
    expect(pictureView(start(), m.lesson).models_fi).toBeNull();
    expect(pictureView(start(), m.lesson).showGloss).toBe(false);
    expect(pictureView(supported(), m.lesson).models_fi).toEqual(m.lesson.scaffold_after_attempt_fi);
    expect(pictureView(transferred(), m.lesson).showPicture).toBe(false);
    expect(pictureView(transferred(), m.lesson).models_fi).toBeNull();
  });
});
