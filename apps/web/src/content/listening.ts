/** Listening lessons + their media, read from the single physical owners (learning/, assets/audio). */
import type { ListeningLesson } from "@hospodar/domain";
import data from "../../../../learning/exercises/b1/audio-long/lessons.json";

export const listeningLessons = (data as unknown as { lessons: ListeningLesson[] }).lessons;
const audio = import.meta.glob("../../../../assets/audio/long/b1/*.ogg", { query: "?url", import: "default", eager: true }) as Record<string, string>;
const vtt = import.meta.glob("../../../../assets/audio/long/b1/*.vtt", { query: "?url", import: "default", eager: true }) as Record<string, string>;
const txt = import.meta.glob("../../../../assets/audio/long/b1/*.txt", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const find = (m: Record<string, string>, repoPath?: string) => repoPath ? Object.entries(m).find(([k]) => k.endsWith(repoPath.replace(/^assets\/audio\/long\/b1\//, "/")))?.[1] ?? null : null;
export const mediaFor = (l: ListeningLesson) => ({ audio: find(audio, l.path), subtitles: find(vtt, l.subtitles_path), transcript: find(txt, l.transcript_path) });
