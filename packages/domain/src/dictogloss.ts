/**
 * Dictogloss on existing listening lessons (method dictogloss, P1): listen to one short segment (at most twice) →
 * reconstruct it in Finnish from memory → only then compare with the segment's transcript.
 * Pure and deterministic; uses the lesson's own subtitle cues as segments (no new Finnish content or keys).
 *
 *  - the transcript is never visible before the learner's reconstruction is submitted;
 *  - comparison is process feedback: words of the original that also occur in the learner's text are marked —
 *    a different but valid form is NOT marked, so this is never a score, a percentage or a level;
 *  - the reconstruction is saved as ungraded listening/writing evidence with the learner's own judgement.
 */
export interface VttCue { start: number; end: number; text: string }
export type DictoglossPhase = "listen" | "write" | "compare" | "done";
export type DictoglossJudgement = "most" | "main" | "little";
export interface DictoglossSession { lessonId: string; cue: number; phase: DictoglossPhase; listens: number; text: string; judged: DictoglossJudgement | null }
export type DictoglossEvent =
  | { type: "PLAYED" } | { type: "START_WRITING" } | { type: "SUBMIT"; text: string }
  | { type: "JUDGE"; judgement: DictoglossJudgement } | { type: "FINISH" };

export const DICTOGLOSS_MAX_LISTENS = 2;
export const DICTOGLOSS_MAX_CHARS = 1000;
export class DictoglossError extends Error {
  constructor(public readonly code: "NOT_ALLOWED" | "NO_LISTEN" | "EMPTY" | "NOT_JUDGED", m: string) { super(m); this.name = "DictoglossError"; }
}

const stamp = (t: string) => {
  const m = /^(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})$/.exec(t.trim());
  if (!m) return NaN;
  return Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]!.padEnd(3, "0")) / 1000;
};

/** WebVTT cues (start/end seconds and text); NOTE blocks and malformed cues are skipped. */
export function parseVttCues(raw: string): VttCue[] {
  const cues: VttCue[] = [];
  for (const block of String(raw ?? "").replace(/\r/g, "").split(/\n{2,}/)) {
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
    const at = lines.findIndex(l => l.includes("-->"));
    if (at < 0) continue;
    const [a, b] = lines[at]!.split("-->");
    const start = stamp(a ?? ""), end = stamp((b ?? "").trim().split(/\s+/)[0] ?? "");
    const text = lines.slice(at + 1).join(" ").replace(/<[^>]+>/g, "").trim();
    if (Number.isFinite(start) && Number.isFinite(end) && end > start && text) cues.push({ start, end, text });
  }
  return cues;
}

export function startDictogloss(lessonId: string, cue: number): DictoglossSession {
  if (!Number.isInteger(cue) || cue < 0) throw new RangeError("cue");
  return { lessonId, cue, phase: "listen", listens: 0, text: "", judged: null };
}

export function dictoglossReducer(s: DictoglossSession, e: DictoglossEvent): DictoglossSession {
  const no = (): never => { throw new DictoglossError("NOT_ALLOWED", `${e.type} not allowed in ${s.phase}`); };
  switch (e.type) {
    case "PLAYED":
      if (s.phase !== "listen" || s.listens >= DICTOGLOSS_MAX_LISTENS) return no();
      return { ...s, listens: s.listens + 1 };
    case "START_WRITING":
      if (s.phase !== "listen") return no();
      if (s.listens < 1) throw new DictoglossError("NO_LISTEN", "Listen first");
      return { ...s, phase: "write" };
    case "SUBMIT": {
      if (s.phase !== "write") return no();
      const t = String(e.text ?? "").trim();
      if (!t) throw new DictoglossError("EMPTY", "Write first");
      return { ...s, text: t.slice(0, DICTOGLOSS_MAX_CHARS), phase: "compare" };
    }
    case "JUDGE":
      if (s.phase !== "compare" || !["most", "main", "little"].includes(e.judgement)) return no();
      return { ...s, judged: e.judgement };
    case "FINISH":
      if (s.phase !== "compare") return no();
      if (!s.judged) throw new DictoglossError("NOT_JUDGED", "Judge first");
      return { ...s, phase: "done" };
  }
}

const norm = (w: string) => w.toLocaleLowerCase("fi").replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");

/** Words of the original, each marked when the same word form occurs in the learner's text (multiset match). */
export function markShared(original: string, own: string): { word: string; shared: boolean }[] {
  const pool = new Map<string, number>();
  for (const w of own.split(/\s+/).map(norm).filter(Boolean)) pool.set(w, (pool.get(w) ?? 0) + 1);
  return original.split(/\s+/).filter(Boolean).map(word => {
    const k = norm(word), n = pool.get(k) ?? 0;
    if (k && n > 0) { pool.set(k, n - 1); return { word, shared: true }; }
    return { word, shared: false };
  });
}

/** The transcript appears only after the reconstruction; nothing of it before. */
export function dictoglossView(s: DictoglossSession, cue: VttCue) {
  const after = s.phase === "compare" || s.phase === "done";
  return {
    phase: s.phase, listensLeft: Math.max(0, DICTOGLOSS_MAX_LISTENS - s.listens),
    canWrite: s.phase === "listen" && s.listens > 0,
    original: after ? cue.text : null,
    marked: after ? markShared(cue.text, s.text) : null,
    own: after ? s.text : null,
  };
}

export const dictoglossTaskId = (lessonId: string, cue: number) => `dictogloss-${lessonId}-${cue + 1}`;

export function dictoglossEvidence(s: DictoglossSession) {
  if (s.phase !== "done") throw new DictoglossError("NOT_ALLOWED", "Not finished");
  return { skill: "listening" as const, taskId: dictoglossTaskId(s.lessonId, s.cue), status: "ungraded" as const,
    response: `[dictogloss after ${s.listens} listen(s); self-judged ${s.judged}] ${s.text}` };
}

/** The first segment of a lesson the learner has not reconstructed yet (null when all are done). */
export function nextDictoglossCue(doneTaskIds: ReadonlySet<string>, lessonId: string, cueCount: number): number | null {
  for (let i = 0; i < cueCount; i++) if (!doneTaskIds.has(dictoglossTaskId(lessonId, i))) return i;
  return null;
}
