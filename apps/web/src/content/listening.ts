/** Listening lessons + their media, read from the single physical owners (learning/, assets/audio). */
import { admitMedia, heldOutReadingIds, parseVttCues, shuffleOptions, validateListeningLesson, type ListeningLesson, type VttCue } from "@hospodar/domain";
import data from "../../../../learning/exercises/b1/audio-long/lessons.json";
import stories from "../../../../learning/exercises/b1/audio-long/human-stories.json";
import exam from "../../../../learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json";
import training from "../../../../learning/exercises/b1/audio-training/index.json";
import inferenceBank from "../../../../learning/exercises/b1/high-yield/reading-inference-bank.json";
import { learnerPool } from "./release.ts";

type Story = { id: string; title_fi: string; audio_path: string; transcript_path: string; duration_seconds: number; narrator: string;
  rights: string; audio_source: string; teacher_review: string; questions: { prompt_fi: string; options_fi: string[]; correct_index: number }[]; review_card?: unknown };
export interface LessonCredit { credit: string; licence: string; source: string | null }

/** Human-voiced public-domain story → listening lesson. Options are shuffled per question: the source has every key first. */
const human: (ListeningLesson & { credit: LessonCredit })[] = learnerPool((stories as unknown as { items: Story[] }).items).flatMap(s => {
  const gate = admitMedia({ id: s.id, path: s.audio_path, rights: s.rights, narrator: s.narrator, audio_source: s.audio_source });
  if (!gate.ok) return [];
  const lesson = { id: s.id, title_fi: s.title_fi, path: s.audio_path, transcript_path: s.transcript_path, duration_seconds: s.duration_seconds,
    narrators_type: "human_single_narrator_public_domain_reading", teacher_review: s.teacher_review,
    questions: s.questions.map((q, i) => { const id = `${s.id}-q${i + 1}`; const sh = shuffleOptions(id, q.options_fi, q.correct_index);
      return { id, prompt_fi: q.prompt_fi, options_fi: sh.options, correct_index: sh.correct_index }; }),
    credit: { credit: `${s.narrator} (LibriVox)`, licence: gate.licence, source: gate.source },
    ...(s.review_card ? { review_card: s.review_card } : {}) };                                    // keeps the draft label honest
  return validateListeningLesson(lesson) ? [lesson] : [];
});

const examIds = new Set((exam as unknown as { blueprints: { skill_blocks: { item_id: string }[] }[] }).blueprints.flatMap(b => b.skill_blocks.map(x => x.item_id)));

/**
 * Short synthetic recordings of the nine theme situations (a dialogue and a notice each) and of two inference texts
 * (CURATED-09: they were saved but unused). One synthetic voice; S2-pending like every draft. The notice's slower and
 * the inference text's faster recording are offered only after the answers, to replay at another tempo.
 * The inference texts withheld for the delayed reading checks are never turned into LEARN listening.
 */
type TrainingLesson = { id: string; category: string; original_content_path: string; quality_status: string; transcript_fi: string;
  questions: { id: string; type?: string; prompt_fi?: string; statement_fi?: string; options?: string[]; options_fi?: string[];
    correct_index?: number; answer?: boolean; explanation_uk?: string; evidence_fi?: string }[];
  audio_versions: { path: string; variant: string; tempo_multiplier: number; duration_seconds: number }[] };
export interface AltRecording { variant: "scaffold_slow" | "challenge_fast"; path: string; tempo: number }
export type TrainingListening = ListeningLesson & { topic?: string; transcript_text: string; alternates: AltRecording[] };
const THEME_PLACE: Record<string, string> = { "01": "identity", "02": "housing", "03": "services", "04": "culture", "05": "travel",
  "06": "health", "07": "work", "08": "environment", "09": "society" };
const themeFiles = import.meta.glob("../../../../learning/exercises/b1/themes/*.json", { eager: true, import: "default" }) as
  Record<string, { id: string; reading: { title_fi: string }; listening: { title_fi: string } }>;
type InferenceItem = { id: string; title_fi: string };
const inferenceItems = (inferenceBank as unknown as { items: InferenceItem[] }).items;
export const heldOutReading = new Set(heldOutReadingIds(inferenceItems, [...examIds]));
const trainingTitle = (t: TrainingLesson): string | null => {
  if (t.original_content_path.endsWith("reading-inference-bank.json")) return inferenceItems.find(i => `${i.id}-audio` === t.id)?.title_fi ?? null;
  const theme = Object.values(themeFiles).find(f => t.original_content_path.endsWith(`/${f.id}.json`));
  return theme ? (t.category === "one_voice_dialogue_script" ? theme.listening.title_fi : theme.reading.title_fi) : null;
};
export const trainingLessons: TrainingListening[] = learnerPool((training as unknown as { lessons: TrainingLesson[] }).lessons).flatMap(t => {
  if (heldOutReading.has(t.id.replace(/-audio$/, ""))) return [];                      // a withheld check text, never in LEARN
  const normal = t.audio_versions.find(v => v.variant === "normal");
  const title = trainingTitle(t);
  if (!normal || !title) return [];
  const theme = /^(\d{2})-/.exec(t.id)?.[1];
  const lesson: TrainingListening = {
    id: t.id, title_fi: title, path: normal.path, duration_seconds: normal.duration_seconds, narrators_type: "single_finnish_tts",
    teacher_review: t.quality_status, transcript_text: t.transcript_fi,
    // The mission is choice-only: true/false becomes Oikein/Väärin (as in the exam and delayed checks); open questions are left out.
    questions: t.questions.flatMap(q => {
      const why = { ...(q.explanation_uk ? { why_uk: q.explanation_uk } : {}), ...(q.evidence_fi ? { evidence_fi: q.evidence_fi } : {}) };
      if (q.type === "true_false" && typeof q.answer === "boolean" && q.statement_fi)
        return [{ id: q.id, prompt_fi: q.statement_fi, options_fi: ["Oikein", "Väärin"], correct_index: q.answer ? 0 : 1, ...why }];
      const options = q.options ?? q.options_fi;
      return q.type !== "open" && options && typeof q.correct_index === "number" && q.prompt_fi
        ? [{ id: q.id, prompt_fi: q.prompt_fi, options_fi: options, correct_index: q.correct_index, ...why }] : [];
    }),
    alternates: t.audio_versions.filter(v => v.variant === "scaffold_slow" || v.variant === "challenge_fast")
      .map(v => ({ variant: v.variant as AltRecording["variant"], path: v.path, tempo: v.tempo_multiplier })),
    ...(theme && THEME_PLACE[theme] ? { topic: THEME_PLACE[theme] } : {}),
  };
  return validateListeningLesson(lesson) ? [lesson] : [];
});

/** Every lesson, incl. those an EXAM blueprint uses (for banks that exclude exam ids themselves). */
export const allListeningLessons: (ListeningLesson & { credit?: LessonCredit })[] =
  [...learnerPool((data as unknown as { lessons: ListeningLesson[] }).lessons), ...human, ...trainingLessons];
/** The LEARN listening pool: never a lesson an EXAM blueprint uses (EXAM-11 held-out isolation). */
export const listeningLessons = allListeningLessons.filter(l => !examIds.has(l.id));
const audio = import.meta.glob(["../../../../assets/audio/long/b1/*.ogg", "../../../../assets/audio/human/short-stories/*.mp3", "../../../../assets/audio/tts/harri/*.ogg"],
  { query: "?url", import: "default", eager: true }) as Record<string, string>;
const vtt = import.meta.glob("../../../../assets/audio/long/b1/*.vtt", { query: "?url", import: "default", eager: true }) as Record<string, string>;
const txt = import.meta.glob(["../../../../assets/audio/long/b1/*.txt", "../../../../assets/audio/human/short-stories/*.txt"], { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const find = (m: Record<string, string>, repoPath?: string) => repoPath ? Object.entries(m).find(([k]) => k.endsWith("/" + repoPath))?.[1] ?? null : null;
export const mediaFor = (l: ListeningLesson) => ({ audio: find(audio, l.path), subtitles: find(vtt, l.subtitles_path),
  transcript: (l as Partial<TrainingListening>).transcript_text ?? find(txt, l.transcript_path) });
/** Other-tempo recordings of a lesson, for replaying after the answers (never during the task). */
export const alternatesFor = (l: ListeningLesson) => ((l as Partial<TrainingListening>).alternates ?? [])
  .map(a => ({ ...a, url: find(audio, a.path) })).filter((a): a is AltRecording & { url: string } => a.url !== null);

/** Subtitle cues of a lesson (its own transcript chunks with timing) — the segments for dictogloss. */
const vttRaw = import.meta.glob("../../../../assets/audio/long/b1/*.vtt", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
export const cuesFor = (l: ListeningLesson): VttCue[] => {
  const raw = find(vttRaw, l.subtitles_path);
  return raw ? parseVttCues(raw) : [];
};
