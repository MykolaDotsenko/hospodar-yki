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
 * Negotiation of meaning (method negotiation-repair-dialogues, research #26 GL-02; optional `negotiation`):
 *   repair     at one learner turn the partner did NOT understand → asks for clarification → the learner must say it
 *              again in other words (no model yet) → only then the script line → learner confirms whether the second
 *              version carried the meaning (self-report). A skipped reply gets no repair.
 *   roleplay   own role-play of the new situation → then the CONDITION CHANGES (`transfer`) and the learner adapts.
 *   Items without `negotiation` behave exactly as before.
 *
 * Scripts only (no recording): this is reading/interaction practice, NOT listening assessment.
 */
export interface DialogueTurn { speaker: string; text_fi: string }
export interface DialogueQuestion { id: string; type: string; prompt_fi: string; model_answer_fi: string; evidence_fi: string }
export interface DialogueNegotiation { repairTurn: number; clarification_fi: string; condition_change_fi: string }
export interface DialogueItem {
  id: string; title_fi: string; turns: DialogueTurn[]; questions: DialogueQuestion[]; roleplay_transfer_fi: string;
  audio_status: string; quality_status: string; negotiation?: DialogueNegotiation;
}
export type DialoguePhase = "turns" | "questions" | "roleplay" | "transfer" | "done";
export type SelfJudgement = "same" | "partly" | "different";
export interface DialogueSession {
  itemId: string; phase: DialoguePhase; turn: number; replies: Record<number, string>;
  qIndex: number; answers: Record<string, string>; judged: Record<string, SelfJudgement>; transfer: string;
  /** Negotiation: the learner's second wording after the clarification request, its self-check, and the role-play text. */
  repair: string; repairJudged: SelfJudgement | null; roleplay: string;
}
export type DialogueEvent =
  | { type: "REPLY"; text: string } | { type: "SKIP_REPLY" } | { type: "NEXT_TURN" }
  | { type: "ANSWER"; questionId: string; text: string } | { type: "JUDGE"; questionId: string; judgement: SelfJudgement }
  | { type: "REPHRASE"; text: string } | { type: "JUDGE_REPAIR"; judgement: SelfJudgement } | { type: "SUBMIT_ROLEPLAY"; text: string }
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
  const n = d.negotiation;
  if (n !== undefined && (!n || !Number.isInteger(n.repairTurn) || d.turns[n.repairTurn]?.speaker !== LEARNER_SPEAKER ||
      typeof n.clarification_fi !== "string" || !n.clarification_fi.trim() ||
      typeof n.condition_change_fi !== "string" || !n.condition_change_fi.trim())) return false;
  // The highlighted evidence must exist in exactly one turn, otherwise the cue would point at the wrong line.
  return d.questions.every(q => q && /^[a-z\d_-]{1,100}$/i.test(q.id) && typeof q.model_answer_fi === "string" &&
    d.turns.filter(t => t.text_fi.includes(q.evidence_fi)).length === 1);
}

export function startDialogue(d: DialogueItem): DialogueSession {
  if (!validateDialogue(d)) throw new TypeError("Invalid dialogue");
  return { itemId: d.id, phase: "turns", turn: 0, replies: {}, qIndex: 0, answers: {}, judged: {}, transfer: "", repair: "", repairJudged: null, roleplay: "" };
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
  const production: DialoguePhase = d.negotiation ? "roleplay" : "transfer";
  const advance = (st: DialogueSession): DialogueSession => {
    const turn = st.turn + 1;
    return turn < d.turns.length ? { ...st, turn } : { ...st, turn, phase: d.questions.length ? "questions" : production };
  };
  const repairStep = repairState(s, d);
  switch (e.type) {
    case "REPLY": return learnerTurn && !(s.turn in s.replies) ? { ...s, replies: { ...s.replies, [s.turn]: clean(e.text) } } : no();
    case "SKIP_REPLY": return learnerTurn && !(s.turn in s.replies) ? { ...s, replies: { ...s.replies, [s.turn]: "" } } : no();
    case "NEXT_TURN":
      if (s.phase !== "turns") return no();
      if (learnerTurn && !(s.turn in s.replies)) throw new DialogueError("NOT_ALLOWED", "Your reply first");   // reply-first
      if (repairStep) throw new DialogueError("NOT_ALLOWED", "Clarify first");                                 // partner did not understand
      return advance(s);
    case "REPHRASE": return repairStep === "rephrase" ? { ...s, repair: clean(e.text) } : no();
    case "JUDGE_REPAIR":
      return repairStep === "confirm" && ["same", "partly", "different"].includes(e.judgement) ? { ...s, repairJudged: e.judgement } : no();
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
      return { ...s, judged: { ...s.judged, [q.id]: e.judgement }, qIndex, phase: qIndex >= d.questions.length ? production : "questions" };
    }
    case "SUBMIT_ROLEPLAY": return s.phase === "roleplay" ? { ...s, roleplay: clean(e.text), phase: "transfer" } : no();
    case "SUBMIT_TRANSFER": return s.phase === "transfer" ? { ...s, transfer: clean(e.text), phase: "done" } : no();
  }
}

/** Which negotiation step is pending at the repair turn: the second wording, then its self-confirmation. */
function repairState(s: DialogueSession, d: DialogueItem): "rephrase" | "confirm" | null {
  const n = d.negotiation;
  if (!n || s.phase !== "turns" || s.turn !== n.repairTurn || !s.replies[s.turn]) return null;     // skipped reply → no repair
  return s.repair === "" ? "rephrase" : s.repairJudged === null ? "confirm" : null;
}

/** Visible state. Script A-lines and model answers/evidence only after the learner's own attempt. */
export function dialogueView(s: DialogueSession, d: DialogueItem) {
  const shown = s.phase === "turns" ? d.turns.slice(0, s.turn + 1) : d.turns;
  const q = s.phase === "questions" ? d.questions[s.qIndex] : undefined;
  const answered = q ? q.id in s.answers : false;
  const n = d.negotiation;
  return {
    phase: s.phase,
    lines: shown.map((t, i) => {
      const mine = t.speaker === LEARNER_SPEAKER;
      const repaired = Boolean(n && i === n.repairTurn && s.replies[i]);
      // At the repair turn the script line stays hidden until the learner has said it again in other words.
      const revealed = !mine || (i in s.replies && !(repaired && s.repair === ""));
      return { index: i, mine, text_fi: revealed ? t.text_fi : null, reply: mine ? s.replies[i] ?? null : null,
        clarification_fi: repaired ? n!.clarification_fi : null, repair: repaired && s.repair ? s.repair : null,
        evidence: Boolean(q && answered && t.text_fi.includes(q.evidence_fi)) };
    }),
    awaitingRephrase: repairState(s, d) === "rephrase",
    awaitingRepairConfirm: repairState(s, d) === "confirm",
    awaitingReply: s.phase === "turns" && d.turns[s.turn]?.speaker === LEARNER_SPEAKER && !(s.turn in s.replies),
    question: q ? { id: q.id, prompt_fi: q.prompt_fi, n: s.qIndex + 1, of: d.questions.length,
      answer: s.answers[q.id] ?? null, model_fi: answered ? q.model_answer_fi : null } : null,
    transfer_fi: s.phase === "roleplay" || s.phase === "transfer" || s.phase === "done" ? d.roleplay_transfer_fi : null,
    /** Only after the learner's own role-play is in: the changed condition they must adapt to. */
    change_fi: n && (s.phase === "transfer" || s.phase === "done") ? n.condition_change_fi : null,
    roleplay: n && (s.phase === "transfer" || s.phase === "done") ? s.roleplay : null,
    scriptOnly: d.audio_status !== "recorded",
    reviewed: d.quality_status === "s2_approved",
  };
}

/**
 * Optional own plan before the role-play (pre-task-planning; research #26/#27). Speaking-like: the plan is hidden while the
 * learner gives their replies and comes back after it (next to what they said) for self-comparison. One line prepares a
 * repair move — what to say if the partner does not understand (negotiation-repair-dialogues). Session only; never scored.
 */
export const DIALOGUE_PLAN_FRAME_UK: readonly string[] = Object.freeze([
  "Чого ти хочеш досягти в цій розмові — одним рядком.",
  "2–3 ключові слова чи фрази, які знадобляться.",
  "Що скажеш, якщо тебе не зрозуміють (інакше, простіше).",
]);
export const DIALOGUE_PLAN_MAX_CHARS = 600;

/** Comprehension answers are open and semantic → ungraded with the learner's self-judgement; transfer → speaking plan, ungraded. */
export function dialogueEvidence(s: DialogueSession, d: DialogueItem, opts: { planned?: boolean } = {}) {
  if (s.phase !== "done") throw new DialogueError("NOT_ALLOWED", "Not finished");
  return [
    ...d.questions.filter(q => q.id in s.answers).map(q => ({ skill: "reading" as const, taskId: q.id, status: "ungraded" as const,
      response: `[dialogue; self-judged ${s.judged[q.id] ?? "none"}] ${s.answers[q.id]}` })),
    ...(s.repair ? [{ skill: "speaking" as const, taskId: `${d.id}-repair`, status: "ungraded" as const,
      response: `[said again after a clarification request; self-judged ${s.repairJudged ?? "none"}] ${s.repair}` }] : []),
    { skill: "speaking" as const, taskId: `${d.id}-roleplay`, status: "ungraded" as const, response: `[role-play plan, text${opts.planned ? "; after an own plan (hidden while replying)" : ""}] ${d.negotiation ? s.roleplay : s.transfer}` },
    ...(d.negotiation ? [{ skill: "speaking" as const, taskId: `${d.id}-change`, status: "ungraded" as const, response: `[adapted to a changed condition] ${s.transfer}` }] : []),
  ];
}

/** Editorial moves file (single owner: learning/exercises/b1/contextual/negotiation-moves-v1.json). */
export interface NegotiationMoves {
  clarification_requests_fi: string[]; condition_changes_fi: string[];
  pairing: Record<string, { repair_turn: number; clarification: number; condition_change: number }>;
}
/** Attach the paired moves; a dialogue without a pairing stays a plain dialogue. Throws on a broken pairing. */
export function withNegotiation(items: DialogueItem[], moves: NegotiationMoves): DialogueItem[] {
  return items.map(d => {
    const p = moves.pairing[d.id];
    if (!p) return d;
    const item: DialogueItem = { ...d, negotiation: { repairTurn: p.repair_turn,
      clarification_fi: moves.clarification_requests_fi[p.clarification] ?? "", condition_change_fi: moves.condition_changes_fi[p.condition_change] ?? "" } };
    if (!validateDialogue(item)) throw new Error(`negotiation pairing for ${d.id} is invalid`);
    return item;
  });
}
