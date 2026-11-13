/** Listening lessons + their media, read from the single physical owners (learning/, assets/audio). */
import { admitMedia, parseVttCues, shuffleOptions, validateListeningLesson, type ListeningLesson, type VttCue } from "@hospodar/domain";
import data from "../../../../learning/exercises/b1/audio-long/lessons.json";
import stories from "../../../../learning/exercises/b1/audio-long/human-stories.json";
import exam from "../../../../learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json";

type Story = { id: string; title_fi: string; audio_path: string; transcript_path: string; duration_seconds: number; narrator: string;
  rights: string; audio_source: string; teacher_review: string; questions: { prompt_fi: string; options_fi: string[]; correct_index: number }[] };
export interface LessonCredit { credit: string; licence: string; source: string | null }

/** Human-voiced public-domain story → listening lesson. Options are shuffled per question: the source has every key first. */
const human: (ListeningLesson & { credit: LessonCredit })[] = (stories as unknown as { items: Story[] }).items.flatMap(s => {
  const gate = admitMedia({ id: s.id, path: s.audio_path, rights: s.rights, narrator: s.narrator, audio_source: s.audio_source });
  if (!gate.ok) return [];
  const lesson = { id: s.id, title_fi: s.title_fi, path: s.audio_path, transcript_path: s.transcript_path, duration_seconds: s.duration_seconds,
    narrators_type: "human_single_narrator_public_domain_reading", teacher_review: s.teacher_review,
    questions: s.questions.map((q, i) => { const id = `${s.id}-q${i + 1}`; const sh = shuffleOptions(id, q.options_fi, q.correct_index);
      return { id, prompt_fi: q.prompt_fi, options_fi: sh.options, correct_index: sh.correct_index }; }),
    credit: { credit: `${s.narrator} (LibriVox)`, licence: gate.licence, source: gate.source } };
  return validateListeningLesson(lesson) ? [lesson] : [];
});

/** Every lesson, incl. those an EXAM blueprint uses (for banks that exclude exam ids themselves). */
export const allListeningLessons: (ListeningLesson & { credit?: LessonCredit })[] = [...(data as unknown as { lessons: ListeningLesson[] }).lessons, ...human];
const examIds = new Set((exam as unknown as { blueprints: { skill_blocks: { item_id: string }[] }[] }).blueprints.flatMap(b => b.skill_blocks.map(x => x.item_id)));
/** The LEARN listening pool: never a lesson an EXAM blueprint uses (EXAM-11 held-out isolation). */
export const listeningLessons = allListeningLessons.filter(l => !examIds.has(l.id));
const audio = import.meta.glob(["../../../../assets/audio/long/b1/*.ogg", "../../../../assets/audio/human/short-stories/*.mp3"], { query: "?url", import: "default", eager: true }) as Record<string, string>;
const vtt = import.meta.glob("../../../../assets/audio/long/b1/*.vtt", { query: "?url", import: "default", eager: true }) as Record<string, string>;
const txt = import.meta.glob(["../../../../assets/audio/long/b1/*.txt", "../../../../assets/audio/human/short-stories/*.txt"], { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const find = (m: Record<string, string>, repoPath?: string) => repoPath ? Object.entries(m).find(([k]) => k.endsWith("/" + repoPath))?.[1] ?? null : null;
export const mediaFor = (l: ListeningLesson) => ({ audio: find(audio, l.path), subtitles: find(vtt, l.subtitles_path), transcript: find(txt, l.transcript_path) });

/** Subtitle cues of a lesson (its own transcript chunks with timing) — the segments for dictogloss. */
const vttRaw = import.meta.glob("../../../../assets/audio/long/b1/*.vtt", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
export const cuesFor = (l: ListeningLesson): VttCue[] => {
  const raw = find(vttRaw, l.subtitles_path);
  return raw ? parseVttCues(raw) : [];
};
