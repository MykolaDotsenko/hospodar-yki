/**
 * LEARN picture mission (IV-REQ-06, SENS-02, method of learning/exercises/a1/image-led/lessons.json):
 *
 *   look      photo + Finnish prompt; learner answers unassisted first (no models, no Ukrainian gloss)
 *   support   only now: model sentences + Ukrainian gloss of the scene (learning phase only)
 *   transfer  new situation WITHOUT the photo, models or translation → independent production
 *   done      both answers saved ungraded (no automatic grade for open production)
 *
 * The photo's Finnish alt text stays on the image for screen-reader users; it is a description, not a model answer.
 */
export interface PictureLesson {
  lesson_id: string; image_id: string; level: string; topic: string; skills: string[];
  initial_prompt_fi: string; scaffold_after_attempt_fi: string[]; transfer_prompt_fi: string; response_status: string;
}
export type PicturePhase = "look" | "support" | "transfer" | "done";
export interface PictureSession { lessonId: string; phase: PicturePhase; first: string; transfer: string }
export type PictureEvent = { type: "SUBMIT_FIRST"; text: string } | { type: "CONTINUE" } | { type: "SUBMIT_TRANSFER"; text: string };
export const PICTURE_MAX_CHARS = 800;

export class PictureError extends Error {
  constructor(public readonly code: "NOT_ALLOWED" | "EMPTY", m: string) { super(m); this.name = "PictureError"; }
}

export function validatePictureLesson(x: unknown): x is PictureLesson {
  const l = x as PictureLesson;
  return Boolean(l && /^[a-z\d_-]{1,90}$/i.test(String(l.lesson_id)) && typeof l.image_id === "string" && l.image_id &&
    typeof l.initial_prompt_fi === "string" && l.initial_prompt_fi && typeof l.transfer_prompt_fi === "string" && l.transfer_prompt_fi &&
    Array.isArray(l.scaffold_after_attempt_fi) && l.scaffold_after_attempt_fi.length >= 1 && l.response_status === "ungraded");
}

export function startPicture(l: PictureLesson): PictureSession {
  if (!validatePictureLesson(l)) throw new TypeError("Invalid picture lesson");
  return { lessonId: l.lesson_id, phase: "look", first: "", transfer: "" };
}

const clean = (t: string) => {
  const v = t.trim();
  if (!v) throw new PictureError("EMPTY", "Write something first");
  return v.slice(0, PICTURE_MAX_CHARS);
};

export function pictureReducer(s: PictureSession, l: PictureLesson, e: PictureEvent): PictureSession {
  if (l.lesson_id !== s.lessonId) throw new TypeError("Lesson mismatch");
  if (e.type === "SUBMIT_FIRST" && s.phase === "look") return { ...s, first: clean(e.text), phase: "support" };
  if (e.type === "CONTINUE" && s.phase === "support") return { ...s, phase: "transfer" };
  if (e.type === "SUBMIT_TRANSFER" && s.phase === "transfer") return { ...s, transfer: clean(e.text), phase: "done" };
  throw new PictureError("NOT_ALLOWED", `${e.type} not allowed in ${s.phase}`);
}

/** Visibility rules: models + gloss only in `support`; the photo never in `transfer`. */
export function pictureView(s: PictureSession, l: PictureLesson) {
  return {
    phase: s.phase,
    showPicture: s.phase === "look" || s.phase === "support",
    prompt_fi: s.phase === "transfer" ? l.transfer_prompt_fi : l.initial_prompt_fi,
    models_fi: s.phase === "support" ? l.scaffold_after_attempt_fi : null,
    showGloss: s.phase === "support",
    first: s.phase === "look" ? null : s.first,
  };
}

export function pictureEvidence(s: PictureSession, l: PictureLesson) {
  if (s.phase !== "done") throw new PictureError("NOT_ALLOWED", "Not finished");
  const skill = l.skills.includes("writing") ? "writing" as const : "speaking" as const;
  return [
    { skill, taskId: l.lesson_id, status: "ungraded" as const, response: `[picture, unassisted first attempt] ${s.first}` },
    { skill, taskId: `${l.lesson_id}-transfer`, status: "ungraded" as const, response: `[new situation, no picture or translation] ${s.transfer}` },
  ];
}
