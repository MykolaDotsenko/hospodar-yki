/**
 * LEARN listening mission (IV-REQ-04, LE-08, MULTI-02, SENS-03/04, R07 support rule).
 *
 *   predict (optional) → listen (learner-started, no text) → gist question → detail questions
 *   → feedback (keys + why) → review (transcript / subtitles now allowed) → done
 *
 * - Questions cannot be answered before the learner has started the audio at least once.
 * - Accessibility support BEFORE answering (transcript, slower speed) is allowed, but then the
 *   answers are recorded as `supported` — never as independent listening evidence.
 * - First answers are frozen when submitted; keys appear only in `feedback`.
 * - Synthetic single-voice audio is practice, not authentic multi-talker listening (E05).
 */
export interface ListeningQuestion { id: string; prompt_fi: string; options_fi: string[]; correct_index: number; why_uk?: string }
export interface ListeningLesson {
  id: string; title_fi: string; path: string; transcript_path?: string; subtitles_path?: string;
  duration_seconds: number; narrators_type: string; teacher_review?: string; questions: ListeningQuestion[];
}
export type ListeningPhase = "predict" | "listen" | "questions" | "feedback" | "review" | "done";
export type ListeningSupport = "transcript" | "slow";
export interface ListeningSession {
  lessonId: string; phase: ListeningPhase; prediction: string; audioStarts: number;
  support: ListeningSupport[]; answers: Record<string, number>; index: number;
}
export type ListeningEvent =
  | { type: "SUBMIT_PREDICTION"; text: string } | { type: "SKIP_PREDICTION" }
  | { type: "AUDIO_STARTED" } | { type: "REQUEST_SUPPORT"; kind: ListeningSupport }
  | { type: "BEGIN_QUESTIONS" } | { type: "ANSWER"; questionId: string; optionIndex: number }
  | { type: "OPEN_REVIEW" } | { type: "FINISH" };

export class ListeningError extends Error {
  constructor(public readonly code: "AUDIO_NOT_STARTED" | "NOT_ALLOWED" | "INVALID_ANSWER", m: string) { super(m); this.name = "ListeningError"; }
}

export function validateListeningLesson(l: unknown): l is ListeningLesson {
  const x = l as ListeningLesson;
  return Boolean(x && typeof x.id === "string" && x.id && typeof x.path === "string" && x.path.startsWith("assets/audio/") &&
    !x.path.includes("..") && Number.isFinite(x.duration_seconds) && x.duration_seconds > 0 &&
    Array.isArray(x.questions) && x.questions.length >= 1 &&
    x.questions.every(q => q && typeof q.id === "string" && Array.isArray(q.options_fi) && q.options_fi.length >= 2 &&
      Number.isInteger(q.correct_index) && q.correct_index >= 0 && q.correct_index < q.options_fi.length));
}

export function startListening(lesson: ListeningLesson): ListeningSession {
  if (!validateListeningLesson(lesson)) throw new TypeError("Invalid listening lesson");
  return { lessonId: lesson.id, phase: "predict", prediction: "", audioStarts: 0, support: [], answers: {}, index: 0 };
}

export function listeningReducer(s: ListeningSession, lesson: ListeningLesson, e: ListeningEvent): ListeningSession {
  if (lesson.id !== s.lessonId) throw new TypeError("Lesson mismatch");
  const no = () => { throw new ListeningError("NOT_ALLOWED", `${e.type} not allowed in ${s.phase}`); };
  switch (e.type) {
    case "SUBMIT_PREDICTION": return s.phase === "predict" ? { ...s, prediction: e.text.trim().slice(0, 400), phase: "listen" } : no();
    case "SKIP_PREDICTION": return s.phase === "predict" ? { ...s, phase: "listen" } : no();
    case "AUDIO_STARTED": return ["listen", "questions", "review"].includes(s.phase) ? { ...s, audioStarts: s.audioStarts + 1 } : no();
    case "REQUEST_SUPPORT":
      if (!["listen", "questions"].includes(s.phase)) return no();
      return s.support.includes(e.kind) ? s : { ...s, support: [...s.support, e.kind] };
    case "BEGIN_QUESTIONS":
      if (s.phase !== "listen") return no();
      if (s.audioStarts < 1 && !s.support.includes("transcript"))
        throw new ListeningError("AUDIO_NOT_STARTED", "Listen to the recording first");
      return { ...s, phase: "questions" };
    case "ANSWER": {
      if (s.phase !== "questions") return no();
      const q = lesson.questions[s.index];
      if (!q || q.id !== e.questionId) return no();
      if (!Number.isInteger(e.optionIndex) || e.optionIndex < 0 || e.optionIndex >= q.options_fi.length)
        throw new ListeningError("INVALID_ANSWER", "Choose an option");
      const answers = { ...s.answers, [q.id]: e.optionIndex };     // first answer frozen: index moves on
      const index = s.index + 1;
      return { ...s, answers, index, phase: index >= lesson.questions.length ? "feedback" : "questions" };
    }
    case "OPEN_REVIEW": return s.phase === "feedback" ? { ...s, phase: "review" } : no();
    case "FINISH": return s.phase === "feedback" || s.phase === "review" ? { ...s, phase: "done" } : no();
  }
}

/** Single place deciding what is visible: no text/keys before answering (unless support requested). */
export function listeningView(s: ListeningSession, lesson: ListeningLesson) {
  const answered = s.phase === "feedback" || s.phase === "review" || s.phase === "done";
  const q = s.phase === "questions" ? lesson.questions[s.index] : undefined;
  return {
    phase: s.phase,
    showPlayer: s.phase !== "predict",
    question: q ? { id: q.id, prompt_fi: q.prompt_fi, options_fi: q.options_fi, kind: s.index === 0 ? "gist" as const : "detail" as const, n: s.index + 1, of: lesson.questions.length } : null,
    showTranscript: s.phase === "review" || (s.support.includes("transcript") && !answered),
    allowSubtitles: s.phase === "review",
    results: answered ? lesson.questions.map(x => ({ id: x.id, prompt_fi: x.prompt_fi, chosen: s.answers[x.id] ?? null,
      correct: x.correct_index, key_fi: x.options_fi[x.correct_index], why_uk: x.why_uk ?? null, isCorrect: s.answers[x.id] === x.correct_index })) : null,
    independent: s.support.length === 0,
    synthetic: /tts/i.test(lesson.narrators_type),
  };
}

/** Diagnostics to persist: objective + independent → scored; any support → ungraded (never failure or mastery). */
export function listeningEvidence(s: ListeningSession, lesson: ListeningLesson) {
  if (s.phase !== "done") throw new ListeningError("NOT_ALLOWED", "Mission is not finished");
  const independent = s.support.length === 0;
  return lesson.questions.filter(q => q.id in s.answers).map(q => independent
    ? { skill: "listening" as const, taskId: q.id, status: "scored" as const, correct: s.answers[q.id] === q.correct_index }
    : { skill: "listening" as const, taskId: q.id, status: "ungraded" as const, response: `supported:${s.support.join("+")}` });
}
