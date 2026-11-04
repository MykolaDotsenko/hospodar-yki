/**
 * LEARN dialogue mission: the learner takes speaker A's turns opposite an in-task interlocutor (DEC-06: NPC as
 * conversation partner, no mascot). IV-REQ-07 (agency), COLOR-14 (correspondence cue only after the attempt), UIO-03.
 *
 *   turns      B lines appear in order; at each A turn the learner writes THEIR reply first, then sees the script's
 *              line as "one possible reply" (never a key — no comparison or score)
 *   questions  open comprehension answer first → model answer + the dialogue line where it is said, highlighted,
 *              + learner's own judgement (same / partly / different) — self-report, never `correct`
 *   transfer   role-play situation, own text/plan                                   → ungraded
 *
 * Scripts only (no recording): this is reading/interaction practice, NOT listening assessment.
 */
export interface DialogueTurn { speaker: string; text_fi: string }
export interface DialogueQuestion { id: string; type: string; prompt_fi: string; model_answer_fi: string; evidence_fi: string }
export interface DialogueItem {
  id: string; title_fi: string; turns: DialogueTurn[]; questions: DialogueQuestion[]; roleplay_transfer_fi: string;
  audio_status: string; quality_status: string;
}
export type DialoguePhase = "turns" | "questions" | "transfer" | "done";
export type SelfJudgement = "same" | "partly" | "different";
export interface DialogueSession {
  itemId: string; phase: DialoguePhase; turn: number; replies: Record<number, string>;
  qIndex: number; answers: Record<string, string>; judged: Record<string, SelfJudgement>; transfer: string;
}
export type DialogueEvent =
  | { type: "REPLY"; text: string } | { type: "SKIP_REPLY" } | { type: "NEXT_TURN" }
  | { type: "ANSWER"; questionId: string; text: string } | { type: "JUDGE"; questionId: string; judgement: SelfJudgement }
  | { type: "SUBMIT_TRANSFER"; text: string };

export const LEARNER_SPEAKER = "A";
export const DIALOGUE_MAX_CHARS = 800;
export class DialogueError extends Error {
  constructor(public readonly code: "NOT_ALLOWED" | "EMPTY" | "NOT_JUDGED", m: string) { super(m); this.name = "DialogueError"; }
}

export function validateDialogue(x: unknown): x is DialogueItem {
  const d = x as DialogueItem;
  if (!d || typeof d.id !== "string" || !/^[a-z\d_-]{1,80}$/i.test(d.id) || !Array.isArray(d.turns) || d.turns.length < 2 ||
      !d.turns.some(t => t.speaker === LEARNER_SPEAKER) || !d.turns.every(t => t && typeof t.text_fi === "string" && t.text_fi) ||
      !Array.isArray(d.questions) || typeof d.roleplay_transfer_fi !== "string" || !d.roleplay_transfer_fi) return false;
  // The highlighted evidence must exist in exactly one turn, otherwise the cue would point at the wrong line.
  return d.questions.every(q => q && /^[a-z\d_-]{1,100}$/i.test(q.id) && typeof q.model_answer_fi === "string" &&
    d.turns.filter(t => t.text_fi.includes(q.evidence_fi)).length === 1);
}

export function startDialogue(d: DialogueItem): DialogueSession {
  if (!validateDialogue(d)) throw new TypeError("Invalid dialogue");
  return { itemId: d.id, phase: "turns", turn: 0, replies: {}, qIndex: 0, answers: {}, judged: {}, transfer: "" };
}

const clean = (t: string) => {
  const v = t.trim();
  if (!v) throw new DialogueError("EMPTY", "Write something first");
  return v.slice(0, DIALOGUE_MAX_CHARS);
};

export function dialogueReducer(s: DialogueSession, d: DialogueItem, e: DialogueEvent): DialogueSession {
  if (d.id !== s.itemId) throw new TypeError("Dialogue mismatch");
  const no = (): never => { throw new DialogueError("NOT_ALLOWED", `${e.type} not allowed`); };
  const cur = d.turns[s.turn];
  const learnerTurn = s.phase === "turns" && cur?.speaker === LEARNER_SPEAKER;
  const advance = (st: DialogueSession): DialogueSession => {
    const turn = st.turn + 1;
    return turn < d.turns.length ? { ...st, turn } : { ...st, turn, phase: d.questions.length ? "questions" : "transfer" };
  };
  switch (e.type) {
    case "REPLY": return learnerTurn && !(s.turn in s.replies) ? { ...s, replies: { ...s.replies, [s.turn]: clean(e.text) } } : no();
    case "SKIP_REPLY": return learnerTurn && !(s.turn in s.replies) ? { ...s, replies: { ...s.replies, [s.turn]: "" } } : no();
    case "NEXT_TURN":
      if (s.phase !== "turns") return no();
      if (learnerTurn && !(s.turn in s.replies)) throw new DialogueError("NOT_ALLOWED", "Your reply first");   // reply-first
      return advance(s);
    case "ANSWER": {
      const q = d.questions[s.qIndex];
      if (s.phase !== "questions" || !q || q.id !== e.questionId || q.id in s.answers) return no();
      return { ...s, answers: { ...s.answers, [q.id]: clean(e.text) } };          // first answer frozen
    }
    case "JUDGE": {
      const q = d.questions[s.qIndex];
      if (s.phase !== "questions" || !q || q.id !== e.questionId || !(q.id in s.answers)) return no();
      if (!["same", "partly", "different"].includes(e.judgement)) return no();
      const qIndex = s.qIndex + 1;
      return { ...s, judged: { ...s.judged, [q.id]: e.judgement }, qIndex, phase: qIndex >= d.questions.length ? "transfer" : "questions" };
    }
    case "SUBMIT_TRANSFER": return s.phase === "transfer" ? { ...s, transfer: clean(e.text), phase: "done" } : no();
  }
}

/** Visible state. Script A-lines and model answers/evidence only after the learner's own attempt. */
export function dialogueView(s: DialogueSession, d: DialogueItem) {
  const shown = s.phase === "turns" ? d.turns.slice(0, s.turn + 1) : d.turns;
  const q = s.phase === "questions" ? d.questions[s.qIndex] : undefined;
  const answered = q ? q.id in s.answers : false;
  return {
    phase: s.phase,
    lines: shown.map((t, i) => {
      const mine = t.speaker === LEARNER_SPEAKER;
      const revealed = !mine || i in s.replies;
      return { index: i, mine, text_fi: revealed ? t.text_fi : null, reply: mine ? s.replies[i] ?? null : null,
        evidence: Boolean(q && answered && t.text_fi.includes(q.evidence_fi)) };
    }),
    awaitingReply: s.phase === "turns" && d.turns[s.turn]?.speaker === LEARNER_SPEAKER && !(s.turn in s.replies),
    question: q ? { id: q.id, prompt_fi: q.prompt_fi, n: s.qIndex + 1, of: d.questions.length,
      answer: s.answers[q.id] ?? null, model_fi: answered ? q.model_answer_fi : null } : null,
    transfer_fi: s.phase === "transfer" || s.phase === "done" ? d.roleplay_transfer_fi : null,
    scriptOnly: d.audio_status !== "recorded",
    reviewed: d.quality_status === "s2_approved",
  };
}

/** Comprehension answers are open and semantic → ungraded with the learner's self-judgement; transfer → speaking plan, ungraded. */
export function dialogueEvidence(s: DialogueSession, d: DialogueItem) {
  if (s.phase !== "done") throw new DialogueError("NOT_ALLOWED", "Not finished");
  return [
    ...d.questions.filter(q => q.id in s.answers).map(q => ({ skill: "reading" as const, taskId: q.id, status: "ungraded" as const,
      response: `[dialogue; self-judged ${s.judged[q.id] ?? "none"}] ${s.answers[q.id]}` })),
    { skill: "speaking" as const, taskId: `${d.id}-roleplay`, status: "ungraded" as const, response: `[role-play plan, text] ${s.transfer}` },
  ];
}
