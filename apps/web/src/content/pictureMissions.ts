/** Image-led missions (learning/exercises/a1/image-led) joined with rights-admitted local photos. */
import { validatePictureLesson, type PictureLesson } from "@hospodar/domain";
import data from "../../../../learning/exercises/a1/image-led/lessons.json";
import { pictures } from "./media.ts";

export const pictureMissions = (data as unknown as { items: PictureLesson[] }).items.flatMap(l => {
  const picture = pictures.find(p => p.id === l.image_id);
  return validatePictureLesson(l) && picture ? [{ lesson: l, picture }] : [];      // no admitted photo → mission not offered
});
