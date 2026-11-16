/**
 * The 12 saved masterclasses (learning/exercises/b1/masterclasses/lessons.json; CURATED-09): original project lessons,
 * drafts pending S2 review. Release builds keep only S2-published lessons.
 */
import { toMasterclass, type Masterclass, type MasterclassLesson } from "@hospodar/domain";
import data from "../../../../learning/exercises/b1/masterclasses/lessons.json";
import { learnerPool } from "./release.ts";
import { listeningLessons } from "./listening.ts";

export const masterclasses: Masterclass[] = learnerPool((data as unknown as { lessons: MasterclassLesson[] }).lessons)
  .map(toMasterclass).filter((m): m is Masterclass => m !== null);

/** The listening lesson with the recording a masterclass is built around (its own questions check listening). */
export const recordingLessonFor = (m: Masterclass) => (m.audioLessonId ? listeningLessons.find(l => l.id === m.audioLessonId) ?? null : null);

export const MASTERCLASS_SKILL_UK: Record<Masterclass["skill"], string> = {
  reading: "Читання", listening: "Аудіювання", speaking: "Говоріння", writing: "Письмо", integrated: "Усе разом",
};
