/**
 * Unfinished LEARN Picture Mission is a device-local checkpoint, not a grade.
 * Reconstruct the phase by passing a frozen first attempt through the original
 * domain reducer before exposing any models, gloss or independent transfer.
 */
import {
  pictureReducer, startPicture, PICTURE_MAX_CHARS,
  type PictureLesson, type PictureSession,
} from "@hospodar/domain";

export interface PictureDraftMaterial {
  lesson: PictureLesson;
  picture: { id: string; url: string; alt_fi: string; alt_uk: string; credit: unknown };
}

export interface PictureDraftPayload {
  session: PictureSession;
  input: string;
  contentFingerprint: string;
}

export function pictureFingerprint(material: PictureDraftMaterial): string {
  // Detect changes in the editorial content, picture or provenance. Not an authenticity signature.
  const text = JSON.stringify([material.lesson, material.picture]);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export const picturePayload = (session: PictureSession, input: string, material: PictureDraftMaterial): PictureDraftPayload => ({
  session, input, contentFingerprint: pictureFingerprint(material),
});

/** Fail closed on a forged stage, changed material or unearned access to model answers. */
export function validPictureDraft(value: unknown, material: PictureDraftMaterial): value is PictureDraftPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const p = value as Record<string, unknown>;
  if (Object.keys(p).sort().join("|") !== "contentFingerprint|input|session" ||
      typeof p.input !== "string" || p.input.length > PICTURE_MAX_CHARS ||
      p.contentFingerprint !== pictureFingerprint(material) ||
      !p.session || typeof p.session !== "object" || Array.isArray(p.session)) return false;

  const s = p.session as PictureSession;
  if (Object.keys(s).sort().join("|") !== "first|lessonId|phase|transfer" ||
      s.lessonId !== material.lesson.lesson_id ||
      (s.phase !== "look" && s.phase !== "support" && s.phase !== "transfer") ||
      typeof s.first !== "string" || typeof s.transfer !== "string" ||
      s.first.length > PICTURE_MAX_CHARS || s.transfer !== "" ||
      (s.phase === "support" && p.input !== "")) return false;
  try {
    let replay = startPicture(material.lesson);
    if (s.phase === "support" || s.phase === "transfer") {
      if (!s.first || s.first !== s.first.trim()) return false;
      replay = pictureReducer(replay, material.lesson, { type: "SUBMIT_FIRST", text: s.first });
    }
    if (s.phase === "transfer")
      replay = pictureReducer(replay, material.lesson, { type: "CONTINUE" });
    return JSON.stringify(replay) === JSON.stringify(s);
  } catch { return false; }
}
