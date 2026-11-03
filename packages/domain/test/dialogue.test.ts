import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { addDiagnostic, blankState, dialogueEvidence, dialogueReducer, dialogueView, startDialogue, validateDialogue,
  DialogueError, type DialogueEvent, type DialogueItem, type DialogueSession } from "../src/index.ts";

const items: DialogueItem[] = JSON.parse(readFileSync(new URL("../../../learning/exercises/b1/contextual/dialogues-v1.json", import.meta.url), "utf8")).items;
const D = items[0]!;
const run = (events: DialogueEvent[], s: DialogueSession = startDialogue(D)) => events.reduce((x, e) => dialogueReducer(x, D, e), s);
/** Walk all turns: reply at learner turns (or skip every other one), then advance. */
const walk = (): DialogueEvent[] => D.turns.flatMap((t, i): DialogueEvent[] => t.speaker === "A"
  ? [i === 2 ? { type: "SKIP_REPLY" } : { type: "REPLY", text: `Oma repliikki ${i}` }, { type: "NEXT_TURN" }] : [{ type: "NEXT_TURN" }]);

describe("dialogue mission: learner as speaker A (IV-REQ-07, COLOR-14, DEC-06)", () => {
  it("all 9 real dialogues are valid; each evidence quote is in exactly one turn", () => {
    expect(items).toHaveLength(9);
    for (const d of items) expect(validateDialogue(d)).toBe(true);
    expect(validateDialogue({ ...D, questions: [{ ...D.questions[0]!, evidence_fi: "ei ole dialogissa" }] })).toBe(false);
  });
  it("reply first: the script's A-line is hidden until the learner replies or skips; cannot advance before", () => {
    const s = startDialogue(D);
    expect(dialogueView(s, D).awaitingReply).toBe(true);
    expect(dialogueView(s, D).lines[0]!.text_fi).toBeNull();
    expect(() => dialogueReducer(s, D, { type: "NEXT_TURN" })).toThrow(DialogueError);
    expect(() => dialogueReducer(s, D, { type: "REPLY", text: "  " })).toThrow(/Write/);
    const r = run([{ type: "REPLY", text: "Hei, olen uusi täällä." }]);
    expect(dialogueView(r, D).lines[0]).toMatchObject({ text_fi: D.turns[0]!.text_fi, reply: "Hei, olen uusi täällä." });
    expect(() => dialogueReducer(r, D, { type: "REPLY", text: "toinen" })).toThrow(DialogueError);   // reply frozen
    expect(dialogueView(r, D).lines).toHaveLength(1);                                                   // later turns not shown yet
  });
  it("questions: answer first; model answer and the highlighted line only after answering; self-judgement, never `correct`", () => {
    const q = run(walk());
    expect(q.phase).toBe("questions");
    const v = dialogueView(q, D);
    expect(v.question!.model_fi).toBeNull();
    expect(v.lines.some(l => l.evidence)).toBe(false);
    const Q = D.questions[0]!;
    const a = dialogueReducer(q, D, { type: "ANSWER", questionId: Q.id, text: "Hän haluaa puhua." });
    const av = dialogueView(a, D);
    expect(av.question!.model_fi).toBe(Q.model_answer_fi);
    expect(av.lines.filter(l => l.evidence).map(l => l.text_fi)).toEqual([D.turns.find(t => t.text_fi.includes(Q.evidence_fi))!.text_fi]);
    expect(() => dialogueReducer(a, D, { type: "ANSWER", questionId: Q.id, text: "muutettu" })).toThrow(DialogueError);
  });
  it("transfer and evidence: comprehension saved ungraded with self-judgement; role-play as ungraded speaking plan", () => {
    const done = run([...walk(), ...D.questions.flatMap((q, i): DialogueEvent[] => [{ type: "ANSWER", questionId: q.id, text: `vastaus ${i}` },
      { type: "JUDGE", questionId: q.id, judgement: i === 0 ? "same" : "partly" }]),
      { type: "SUBMIT_TRANSFER", text: "Hei, olen Oksana. Voisitko puhua vähän hitaammin?" }]);
    expect(dialogueView(done, D).transfer_fi).toBe(D.roleplay_transfer_fi);
    const ev = dialogueEvidence(done, D);
    expect(ev.map(e => [e.skill, e.status])).toEqual([["reading", "ungraded"], ["reading", "ungraded"], ["speaking", "ungraded"]]);
    expect(ev[0]!.response).toBe("[dialogue; self-judged same] vastaus 0");
    let st = blankState();
    for (const e of ev) st = addDiagnostic(st, e);
    expect(st.diagnostics.some(d => "correct" in d)).toBe(false);
    expect(dialogueView(done, D).scriptOnly).toBe(true);
  });
});
