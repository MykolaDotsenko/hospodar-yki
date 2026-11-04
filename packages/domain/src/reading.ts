/**
 * LEARN interactive reading (IV-REQ-05, IV-AC-05, COLOR-14, UIO-03):
 *
 *   questions  text + one question at a time; first answer frozen; no key, no highlight, no model answer
 *   feedback   keys + model answers, and ONLY NOW the exact evidence span of each question highlighted in the text
 *              (with a text label "← питання N"); open answers get the learner's own judgement (self-report)
 *   transfer   writing or speaking task on the same topic without the text → ungraded
 *   done
 *
 * Exam isolation (EXAM-11, YKI-FID-07): items used by an EXAM blueprint are never offered in LEARN.
 */
export interface ReadingQuestion {
  id: string; type: "single_choice" | "true_false" | "open"; prompt_fi?: string; statement_fi?: string;
  options_fi?: string[]; correct_index?: number; answer?: boolean; model_answer_fi?: string; evidence_fi: string;
}
export interface ReadingItem {
  id: string; title_fi: string; text_fi: string; questions: ReadingQuestion[];
  speaking_transfer_fi: string; writing_transfer_fi: string; quality_status: string; is_official_exam: boolean;
}
export type ReadingPhase = "questions" | "feedback" | "transfer" | "done";
export type ReadingJudgement = "same" | "partly" | "different";
export interface ReadingSession {
  itemId: string; phase: ReadingPhase; index: number; answers: Record<string, string>;
  judged: Record<string, ReadingJudgement>; transferKind: "writing" | "speaking"; transfer: string;
}
export type ReadingEvent =
  | { type: "ANSWER"; questionId: string; value: string } | { type: "JUDGE"; questionId: string; judgement: ReadingJudgement }
  | { type: "TO_TRANSFER"; kind: "writing" | "speaking" } | { type: "SUBMIT_TRANSFER"; text: string };

export class ReadingError extends Error {
  constructor(public readonly code: "NOT_ALLOWED" | "EMPTY" | "INVALID" | "NOT_JUDGED", m: string) { super(m); this.name = "ReadingError"; }
}

/** Every evidence span must occur exactly once and spans must not overlap, so the highlight is unambiguous. */
export function evidenceSpans(item: Pick<ReadingItem, "text_fi" | "questions">): { questionId: string; start: number; end: number }[] | null {
  const spans = item.questions.map(q => {
    const start = item.text_fi.indexOf(q.evidence_fi);
    return { questionId: q.id, start, end: start + q.evidence_fi.length, count: item.text_fi.split(q.evidence_fi).length - 1 };
  });
  if (spans.some(s => s.count !== 1)) return null;
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  for (let i = 1; i < sorted.length; i++) if (sorted[i]!.start < sorted[i - 1]!.end) return null;
  return sorted.map(({ questionId, start, end }) => ({ questionId, start, end }));
}

export function validateReadingItem(x: unknown): x is ReadingItem {
  const i = x as ReadingItem;
  if (!i || !/^[a-z\d_-]{1,90}$/i.test(String(i.id)) || typeof i.text_fi !== "string" || !Array.isArray(i.questions) || i.questions.length < 1 ||
      i.is_official_exam !== false || typeof i.writing_transfer_fi !== "string" || typeof i.speaking_transfer_fi !== "string") return false;
  const okQ = i.questions.every(q => q && /^[a-z\d_-]{1,100}$/i.test(q.id) && typeof q.evidence_fi === "string" && q.evidence_fi.length > 0 && (
    (q.type === "single_choice" && Array.isArray(q.options_fi) && Number.isInteger(q.correct_index) && q.correct_index! >= 0 && q.correct_index! < q.options_fi.length) ||
    (q.type === "true_false" && typeof q.answer === "boolean" && typeof q.statement_fi === "string") ||
    (q.type === "open" && typeof q.model_answer_fi === "string")));
  return okQ && evidenceSpans(i) !== null;
}

/** LEARN pool = reading items minus anything an EXAM blueprint uses (held-out isolation). */
export function learnReadingPool<T extends { id: string }>(items: T[], examBlueprints: { skill_blocks: { skill: string; item_id: string }[] }[]): T[] {
  const examIds = new Set(examBlueprints.flatMap(b => b.skill_blocks.filter(s => s.skill === "reading").map(s => s.item_id)));
  return items.filter(i => !examIds.has(i.id));
}

export function startReading(item: ReadingItem): ReadingSession {
  if (!validateReadingItem(item)) throw new TypeError("Invalid reading item");
  return { itemId: item.id, phase: "questions", index: 0, answers: {}, judged: {}, transferKind: "writing", transfer: "" };
}

export function readingReducer(s: ReadingSession, item: ReadingItem, e: ReadingEvent): ReadingSession {
  if (item.id !== s.itemId) throw new TypeError("Item mismatch");
  const no = (): never => { throw new ReadingError("NOT_ALLOWED", `${e.type} not allowed in ${s.phase}`); };
  switch (e.type) {
    case "ANSWER": {
      const q = item.questions[s.index];
      if (s.phase !== "questions" || !q || q.id !== e.questionId) return no();
      const v = String(e.value ?? "").trim();
      if (!v) throw new ReadingError("EMPTY", "Answer first");
      if (q.type === "single_choice" && !(Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) < q.options_fi!.length)) throw new ReadingError("INVALID", "Choose an option");
      if (q.type === "true_false" && v !== "true" && v !== "false") throw new ReadingError("INVALID", "Choose true or false");
      const index = s.index + 1;                                            // first answer frozen: index moves on
      return { ...s, answers: { ...s.answers, [q.id]: v.slice(0, 600) }, index, phase: index >= item.questions.length ? "feedback" : "questions" };
    }
    case "JUDGE": {
      const q = item.questions.find(x => x.id === e.questionId);
      if (s.phase !== "feedback" || !q || q.type !== "open" || !["same", "partly", "different"].includes(e.judgement)) return no();
      return { ...s, judged: { ...s.judged, [q.id]: e.judgement } };
    }
    case "TO_TRANSFER": {
      if (s.phase !== "feedback") return no();
      if (item.questions.some(q => q.type === "open" && !(q.id in s.judged))) throw new ReadingError("NOT_JUDGED", "Compare your open answers first");
      return { ...s, phase: "transfer", transferKind: e.kind === "speaking" ? "speaking" : "writing" };
    }
    case "SUBMIT_TRANSFER": {
      if (s.phase !== "transfer") return no();
      const t = e.text.trim();
      if (!t) throw new ReadingError("EMPTY", "Write something first");
      return { ...s, transfer: t.slice(0, 1600), phase: "done" };
    }
  }
}

const correctOf = (q: ReadingQuestion, v: string | undefined) =>
  q.type === "single_choice" ? v === String(q.correct_index) : q.type === "true_false" ? v === String(q.answer) : null;

/** Visibility: text always; keys, model answers and evidence highlight only in feedback; the text is hidden in transfer. */
export function readingView(s: ReadingSession, item: ReadingItem) {
  const q = s.phase === "questions" ? item.questions[s.index] : undefined;
  const reveal = s.phase === "feedback";
  const spans = evidenceSpans(item)!;
  const segments: { text: string; questionNumber: number | null }[] = [];
  if (reveal) {
    let pos = 0;
    for (const sp of spans) {
      if (sp.start > pos) segments.push({ text: item.text_fi.slice(pos, sp.start), questionNumber: null });
      segments.push({ text: item.text_fi.slice(sp.start, sp.end), questionNumber: item.questions.findIndex(x => x.id === sp.questionId) + 1 });
      pos = sp.end;
    }
    if (pos < item.text_fi.length) segments.push({ text: item.text_fi.slice(pos), questionNumber: null });
  } else segments.push({ text: item.text_fi, questionNumber: null });
  return {
    phase: s.phase,
    showText: s.phase !== "transfer" && s.phase !== "done",
    segments,
    question: q ? { id: q.id, type: q.type, n: s.index + 1, of: item.questions.length, prompt_fi: q.prompt_fi ?? q.statement_fi ?? "",
      options_fi: q.type === "single_choice" ? q.options_fi! : q.type === "true_false" ? ["Oikein", "Väärin"] : null } : null,
    results: reveal ? item.questions.map((x, i) => ({ id: x.id, n: i + 1, type: x.type, prompt_fi: x.prompt_fi ?? x.statement_fi ?? "",
      answer: s.answers[x.id] ?? null, correct: correctOf(x, s.answers[x.id]),
      key_fi: x.type === "single_choice" ? x.options_fi![x.correct_index!]! : x.type === "true_false" ? (x.answer ? "Oikein" : "Väärin") : x.model_answer_fi!,
      judged: s.judged[x.id] ?? null })) : null,
    transfer_fi: s.phase === "transfer" ? (s.transferKind === "speaking" ? item.speaking_transfer_fi : item.writing_transfer_fi) : null,
    transferKind: s.transferKind,
  };
}

/** Objective answers scored (independent first attempt); open answers and transfer ungraded with the learner's judgement. */
export function readingEvidence(s: ReadingSession, item: ReadingItem) {
  if (s.phase !== "done") throw new ReadingError("NOT_ALLOWED", "Not finished");
  return [
    ...item.questions.map(q => q.type === "open"
      ? { skill: "reading" as const, taskId: q.id, status: "ungraded" as const, response: `[open; self-judged ${s.judged[q.id] ?? "none"}] ${s.answers[q.id] ?? ""}` }
      : { skill: "reading" as const, taskId: q.id, status: "scored" as const, correct: correctOf(q, s.answers[q.id]) === true, response: s.answers[q.id] ?? "" }),
    { skill: s.transferKind, taskId: `${item.id}-transfer`, status: "ungraded" as const, response: `[new task, no text shown] ${s.transfer}` },
  ];
}
