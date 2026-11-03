import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { addDiagnostic, blankState, pictureEvidence, pictureReducer, pictureView, startPicture, validatePictureLesson,
  PictureError, type PictureLesson } from "../src/index.ts";

const root = new URL("../../../", import.meta.url);
const lessons: PictureLesson[] = JSON.parse(readFileSync(new URL("learning/exercises/a1/image-led/lessons.json", root), "utf8")).items;
const pictures: { id: string }[] = JSON.parse(readFileSync(new URL("assets/images/pictures/available.json", root), "utf8")).assets;
const L = lessons[0]!;

describe("picture mission: photo + gloss only while learning, then production without them (IV-REQ-06)", () => {
  it("all 8 real lessons are valid and each points at a verified local photo", () => {
    expect(lessons).toHaveLength(8);
    for (const l of lessons) {
      expect(validatePictureLesson(l)).toBe(true);
      expect(pictures.some(p => p.id === l.image_id), l.image_id).toBe(true);
    }
    expect(validatePictureLesson({ ...L, response_status: "scored" })).toBe(false);
  });
  it("first attempt is unassisted: no models or Ukrainian gloss before it; empty refused", () => {
    const s = startPicture(L);
    expect(pictureView(s, L)).toMatchObject({ showPicture: true, models_fi: null, showGloss: false, first: null });
    expect(() => pictureReducer(s, L, { type: "SUBMIT_FIRST", text: " " })).toThrow(PictureError);
    expect(() => pictureReducer(s, L, { type: "CONTINUE" })).toThrow(PictureError);
  });
  it("support shows models + gloss; transfer hides photo, models and gloss; evidence is ungraded", () => {
    const sup = pictureReducer(startPicture(L), L, { type: "SUBMIT_FIRST", text: "Tässä on tori." });
    expect(pictureView(sup, L)).toMatchObject({ showPicture: true, models_fi: L.scaffold_after_attempt_fi, showGloss: true, first: "Tässä on tori." });
    const tr = pictureReducer(sup, L, { type: "CONTINUE" });
    expect(pictureView(tr, L)).toMatchObject({ showPicture: false, models_fi: null, showGloss: false, prompt_fi: L.transfer_prompt_fi });
    const done = pictureReducer(tr, L, { type: "SUBMIT_TRANSFER", text: "Paljonko omena maksaa?" });
    const ev = pictureEvidence(done, L);
    expect(ev.map(e => [e.taskId, e.status])).toEqual([[L.lesson_id, "ungraded"], [`${L.lesson_id}-transfer`, "ungraded"]]);
    let st = blankState();
    for (const e of ev) st = addDiagnostic(st, e);
    expect(st.diagnostics.some(d => "correct" in d)).toBe(false);
  });
});
