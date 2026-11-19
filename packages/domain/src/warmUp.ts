/**
 * «Перед справою» (method mobile-contextual-micropractice, research mobilevocab22/26): a short optional warm-up right
 * before a real situation, e.g. before going to the shop or the health centre. The registry example is
 * «Ennen kauppaa: pyydä kuitti, palauta tuote».
 *
 *   try         one phrase card of this place: the Ukrainian meaning only; the learner recalls the Finnish phrase
 *               (or says honestly that it does not come) — the own try is frozen
 *   shown       ONLY NOW: the phrase, its context and translation next to the own try (no automatic judgement)
 *   first_line  after WARM_UP_SIZE phrases: the first sentence the learner means to say there, in own words
 *   done        the first line to take along, and a pointer to mark the deed afterwards
 *
 * Nothing is stored, scheduled or scored: it is rehearsal for a real situation, not evidence. Phrase practice with a
 * schedule stays in the phrase cards. No reminder or notification ever starts it (the method's own limit).
 */
import { localDate, type LearnerState } from "./learner.ts";

export const WARM_UP_SIZE = 3;
export const WARM_UP_MAX_CHARS = 300;

interface Pickable { id: string; kind: string; group: string }

/**
 * The phrase cards for a warm-up at this place: due reviews first (oldest due first), then phrases the learner has not
 * met yet, then the rest; ties keep the bank order. Deterministic, so a reload shows the same cards.
 */
export function warmUpCards<T extends Pickable>(cards: readonly T[], place: string, state: LearnerState, today: string = localDate()): T[] {
  const pool = cards.filter(c => c.kind === "chunk" && c.group === place);
  const met = new Set(state.diagnostics.map(d => d.taskId.replace(/-transfer$/, "")));
  const due = pool.filter(c => state.cards[c.id] && state.cards[c.id]!.due <= today)
    .sort((a, b) => state.cards[a.id]!.due.localeCompare(state.cards[b.id]!.due));
  const fresh = pool.filter(c => !state.cards[c.id] && !met.has(c.id));
  const seen = new Set<string>(), out: T[] = [];
  for (const c of [...due, ...fresh, ...pool]) {
    if (out.length === WARM_UP_SIZE) break;
    if (!seen.has(c.id)) { seen.add(c.id); out.push(c); }
  }
  return out;
}

export type WarmUpPhase = "try" | "shown" | "first_line" | "done";
export interface WarmUp { place: string; ids: string[]; index: number; phase: WarmUpPhase; tries: (string | null)[]; firstLine: string }
export type WarmUpEvent =
  | { type: "TRY"; text: string }          // the own recall
  | { type: "NOT_RECALLED" }               // honest "it does not come": shown as such, never as a wrong answer
  | { type: "NEXT" }
  | { type: "FIRST_LINE"; text: string };

export class WarmUpError extends Error {
  constructor(public readonly code: "NOT_ALLOWED" | "EMPTY" | "NO_CARDS", m: string) { super(m); this.name = "WarmUpError"; }
}

export function startWarmUp(place: string, ids: readonly string[]): WarmUp {
  if (!ids.length) throw new WarmUpError("NO_CARDS", "No phrase cards for this place");
  return { place, ids: [...ids], index: 0, phase: "try", tries: [], firstLine: "" };
}

const text = (t: string) => {
  const v = String(t ?? "").trim();
  if (!v) throw new WarmUpError("EMPTY", "Write something first");
  return v.slice(0, WARM_UP_MAX_CHARS);
};

export function warmUpReducer(s: WarmUp, e: WarmUpEvent): WarmUp {
  const no = (): never => { throw new WarmUpError("NOT_ALLOWED", `${e.type} not allowed in ${s.phase}`); };
  switch (e.type) {
    case "TRY": return s.phase === "try" ? { ...s, tries: [...s.tries, text(e.text)], phase: "shown" } : no();
    case "NOT_RECALLED": return s.phase === "try" ? { ...s, tries: [...s.tries, null], phase: "shown" } : no();
    case "NEXT":
      if (s.phase !== "shown") return no();
      return s.index + 1 < s.ids.length ? { ...s, index: s.index + 1, phase: "try" } : { ...s, phase: "first_line" };
    case "FIRST_LINE": return s.phase === "first_line" ? { ...s, firstLine: text(e.text), phase: "done" } : no();
  }
}

/** What the screen may show: the phrase only after the own try; the own try is read-only once given. */
export function warmUpView(s: WarmUp) {
  const trying = s.phase === "try";
  return {
    phase: s.phase,
    cardId: trying || s.phase === "shown" ? s.ids[s.index]! : null,
    step: Math.min(s.index + 1, s.ids.length), of: s.ids.length,
    revealed: s.phase === "shown",
    ownTry: s.phase === "shown" ? s.tries[s.index] ?? null : null,
    firstLine: s.phase === "done" ? s.firstLine : null,
  };
}
