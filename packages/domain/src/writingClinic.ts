/**
 * LEARN writing clinic: draft → feedback → rewrite → new task (IV-REQ-07, UIO-03, R04, rubric feedback_steps).
 *
 *   write      own text first (no model, no weak draft visible)                → persisted ungraded
 *   selfcheck  learner ticks the task points they covered (self-report)
 *   spot       learner marks sentences of a deliberately weak draft they would change
 *   issues     editor-written issues revealed (content/register before grammar) + found/missed
 *   model      pedagogical model, only now (model_visibility = after_attempt)
 *   rewrite    learner edits THEIR OWN draft; word diff shown — guided, never independent
 *   transfer   new situation without model or draft                           → persisted ungraded
 *
 * Nothing here is a grade: no automatic score for writing, no level, no YKI prediction.
 */
export interface ClinicIssue { fragment_fi: string; why_uk: string; focus: string }
export interface ClinicItem {
  id: string; title_fi: string; prompt_fi: string; required: string[]; first_draft_fi: string; issues: ClinicIssue[];
  model_fi: string; transfer_fi: string; feedback_uk: string; model_visibility: string; model_note_uk: string; self_check_uk: string[];
}
const PHASES = ["write", "selfcheck", "spot", "issues", "model", "rewrite", "transfer", "done"] as const;
export type ClinicPhase = typeof PHASES[number];
export interface ClinicSession {
  itemId: string; phase: ClinicPhase; draft: string; checked: number[]; marked: number[];
  rewrite: string; transfer: string; draftSaved: boolean;
}
export type ClinicEvent =
  | { type: "SUBMIT_DRAFT"; text: string } | { type: "DRAFT_SAVED" } | { type: "SELF_CHECK"; points: number[] }
  | { type: "MARK"; sentences: number[] } | { type: "CONTINUE" }
  | { type: "SUBMIT_REWRITE"; text: string } | { type: "SUBMIT_TRANSFER"; text: string };

export const CLINIC_MIN_CHARS = 20;
export const CLINIC_MAX_CHARS = 1600;
export class ClinicError extends Error {
  constructor(public readonly code: "NOT_ALLOWED" | "TOO_SHORT" | "NOT_SAVED", m: string) { super(m); this.name = "ClinicError"; }
}

export function draftSentences(item: Pick<ClinicItem, "first_draft_fi">): string[] {
  return item.first_draft_fi.trim().split(/(?<=[.!?])\s+/).filter(Boolean);
}

/** Every issue must sit in exactly one sentence of the weak draft, and the model may only appear after the attempt. */
export function validateClinicItem(x: unknown): x is ClinicItem {
  const i = x as ClinicItem;
  if (!i || typeof i.id !== "string" || !/^[a-z\d_-]{1,90}$/i.test(i.id) || typeof i.prompt_fi !== "string" ||
      typeof i.first_draft_fi !== "string" || typeof i.model_fi !== "string" || typeof i.transfer_fi !== "string" ||
      i.model_visibility !== "after_attempt" || !Array.isArray(i.required) || i.required.length < 1 ||
      !Array.isArray(i.issues) || i.issues.length < 1) return false;
  const s = draftSentences(i);
  return i.issues.every(q => q && typeof q.fragment_fi === "string" && q.fragment_fi && s.filter(x => x.includes(q.fragment_fi)).length === 1);
}

export function startClinic(item: ClinicItem): ClinicSession {
  if (!validateClinicItem(item)) throw new TypeError("Invalid clinic item");
  return { itemId: item.id, phase: "write", draft: "", checked: [], marked: [], rewrite: "", transfer: "", draftSaved: false };
}

const text = (t: string) => {
  const v = t.trim();
  if (v.length < CLINIC_MIN_CHARS) throw new ClinicError("TOO_SHORT", "At least 20 characters");
  return v.slice(0, CLINIC_MAX_CHARS);
};
const indices = (xs: number[], n: number) => [...new Set(xs)].filter(i => Number.isInteger(i) && i >= 0 && i < n).sort((a, b) => a - b);

export function clinicReducer(s: ClinicSession, item: ClinicItem, e: ClinicEvent): ClinicSession {
  if (item.id !== s.itemId) throw new TypeError("Item mismatch");
  const no = (): never => { throw new ClinicError("NOT_ALLOWED", `${e.type} not allowed in ${s.phase}`); };
  switch (e.type) {
    case "SUBMIT_DRAFT": return s.phase === "write" ? { ...s, draft: text(e.text), phase: "selfcheck" } : no();
    case "DRAFT_SAVED": return s.draft ? { ...s, draftSaved: true } : no();
    case "SELF_CHECK": return s.phase === "selfcheck" ? { ...s, checked: indices(e.points, item.required.length) } : no();
    case "MARK": return s.phase === "spot" ? { ...s, marked: indices(e.sentences, draftSentences(item).length) } : no();
    case "CONTINUE": {
      if (s.phase === "selfcheck" && !s.draftSaved) throw new ClinicError("NOT_SAVED", "Persist the draft first");
      const next: Partial<Record<ClinicPhase, ClinicPhase>> = { selfcheck: "spot", spot: "issues", issues: "model", model: "rewrite" };
      return next[s.phase] ? { ...s, phase: next[s.phase]! } : no();
    }
    // An unchanged rewrite is allowed (the learner may judge the draft fine) — the diff will say "no changes".
    case "SUBMIT_REWRITE": return s.phase === "rewrite" ? { ...s, rewrite: text(e.text), phase: "transfer" } : no();
    case "SUBMIT_TRANSFER": return s.phase === "transfer" ? { ...s, transfer: text(e.text), phase: "done" } : no();
  }
}

export type DiffPart = { kind: "same" | "added" | "removed"; text: string };
/** Word-level LCS diff of the learner's own draft vs rewrite (process feedback: what you changed, not whether it is right). */
export function wordDiff(a: string, b: string): DiffPart[] {
  const x = a.split(/\s+/).filter(Boolean), y = b.split(/\s+/).filter(Boolean);
  const n = x.length, m = y.length;
  const L: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    L[i]![j] = x[i] === y[j] ? L[i + 1]![j + 1]! + 1 : Math.max(L[i + 1]![j]!, L[i]![j + 1]!);
  const out: DiffPart[] = [];
  const push = (kind: DiffPart["kind"], t: string) => {
    const last = out[out.length - 1];
    if (last && last.kind === kind) last.text += " " + t; else out.push({ kind, text: t });
  };
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (x[i] === y[j]) { push("same", x[i]!); i++; j++; }
    else if (L[i + 1]![j]! >= L[i]![j + 1]!) push("removed", x[i++]!);
    else push("added", y[j++]!);
  }
  while (i < n) push("removed", x[i++]!);
  while (j < m) push("added", y[j++]!);
  return out;
}

/** What the screen may show; model/issues never before the learner's own draft and attempt. */
export function clinicView(s: ClinicSession, item: ClinicItem) {
  const sentences = draftSentences(item);
  const issueSentence = item.issues.map(q => sentences.findIndex(x => x.includes(q.fragment_fi)));
  const after = (p: ClinicPhase) => PHASES.indexOf(s.phase) >= PHASES.indexOf(p);
  return {
    phase: s.phase,
    prompt_fi: s.phase === "transfer" ? item.transfer_fi : item.prompt_fi,
    required: item.required,
    showWeakDraft: s.phase === "spot" || s.phase === "issues",
    sentences: s.phase === "spot" || s.phase === "issues" ? sentences : [],
    issues: after("issues") && s.phase !== "transfer" && s.phase !== "done" ? item.issues.map((q, k) => ({
      ...q, sentence: issueSentence[k]!, found: s.marked.includes(issueSentence[k]!) })) : null,
    extraMarked: after("issues") ? s.marked.filter(m => !issueSentence.includes(m)) : [],
    model: s.phase === "model" || s.phase === "rewrite" ? { text_fi: item.model_fi, note_uk: item.model_note_uk } : null,
    ownDraft: s.phase === "write" || s.phase === "transfer" ? null : s.draft,      // hidden in transfer: new task, own words
    diff: s.phase === "done" ? wordDiff(s.draft, s.rewrite) : null,
    checked: s.checked, marked: s.marked, selfCheck_uk: item.self_check_uk, feedback_uk: item.feedback_uk,
  };
}

/** All three texts are ungraded writing evidence, labelled by how independent they were. */
export function clinicEvidence(s: ClinicSession, item: ClinicItem, which: "draft" | "final") {
  const ev = (taskId: string, label: string, t: string) => ({ skill: "writing" as const, taskId, status: "ungraded" as const, response: `[${label}] ${t}` });
  if (which === "draft") {
    if (!s.draft) throw new ClinicError("NOT_ALLOWED", "No draft");
    return [ev(item.id, `independent draft; self-check ${s.checked.length}/${item.required.length}`, s.draft)];
  }
  if (s.phase !== "done") throw new ClinicError("NOT_ALLOWED", "Clinic not finished");
  return [ev(`${item.id}-rewrite`, "guided rewrite after model", s.rewrite), ev(`${item.id}-transfer`, "new task, no model shown", s.transfer)];
}
