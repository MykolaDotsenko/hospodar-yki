import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { addDiagnostic, blankState, dialogueEvidence, dialogueReducer, dialogueView, startDialogue, validateDialogue,
  withNegotiation, DialogueError, type DialogueEvent, type DialogueItem, type DialogueSession, type NegotiationMoves } from "../src/index.ts";

const items: DialogueItem[] = JSON.parse(readFileSync(new URL("../../../learning/exercises/b1/contextual/dialogues-v1.json", import.meta.url), "utf8")).items;
const D = items[0]!;
const moves: NegotiationMoves = JSON.parse(readFileSync(new URL("../../../learning/exercises/b1/contextual/negotiation-moves-v1.json", import.meta.url), "utf8"));
const negotiated = withNegotiation(items, moves);
const N = negotiated[1]!;                                            // "Soitto huoltoyhtiöön"
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

describe("negotiation of meaning: clarification request and changed condition (negotiation-repair-dialogues)", () => {
  const go = (events: DialogueEvent[], st: DialogueSession = startDialogue(N)) => events.reduce((x, e) => dialogueReducer(x, N, e), st);
  const toRepair: DialogueEvent[] = [{ type: "REPLY", text: "Hei, ikkuna on rikki." }, { type: "NEXT_TURN" }, { type: "NEXT_TURN" }];
  const afterTurns = (): DialogueEvent[] => [...toRepair, { type: "REPLY", text: "Viime viikolla." }, { type: "REPHRASE", text: "Huomasin sen seitsemän päivää sitten." },
    { type: "JUDGE_REPAIR", judgement: "partly" }, { type: "NEXT_TURN" }, { type: "NEXT_TURN" },
    { type: "REPLY", text: "Ei sovi." }, { type: "NEXT_TURN" }, { type: "NEXT_TURN" }, { type: "SKIP_REPLY" }, { type: "NEXT_TURN" }, { type: "NEXT_TURN" }];
  const questions = (): DialogueEvent[] => N.questions.flatMap((q): DialogueEvent[] => [{ type: "ANSWER", questionId: q.id, text: "vastaus" }, { type: "JUDGE", questionId: q.id, judgement: "same" }]);

  it("every real dialogue gets a paired clarification and condition change at a learner turn; a broken pairing is refused", () => {
    expect(negotiated).toHaveLength(9);
    for (const d of negotiated) {
      expect(validateDialogue(d)).toBe(true);
      expect(d.turns[d.negotiation!.repairTurn]!.speaker).toBe("A");
      expect(moves.clarification_requests_fi).toContain(d.negotiation!.clarification_fi);
      expect(moves.condition_changes_fi).toContain(d.negotiation!.condition_change_fi);
    }
    expect(() => withNegotiation(items, { ...moves, pairing: { [D.id]: { repair_turn: 1, clarification: 0, condition_change: 0 } } })).toThrow();
    expect(() => withNegotiation(items, { ...moves, pairing: { [D.id]: { repair_turn: 2, clarification: 9, condition_change: 0 } } })).toThrow();
  });
  it("partner did not understand: script line stays hidden and the dialogue cannot continue until the learner rephrases and confirms", () => {
    const replied = go([...toRepair, { type: "REPLY", text: "Viime viikolla." }]);
    let v = dialogueView(replied, N);
    expect(v).toMatchObject({ awaitingRephrase: true, awaitingRepairConfirm: false });
    expect(v.lines[2]).toMatchObject({ text_fi: null, reply: "Viime viikolla.", clarification_fi: N.negotiation!.clarification_fi, repair: null });
    expect(() => dialogueReducer(replied, N, { type: "NEXT_TURN" })).toThrow(/Clarify/);
    expect(() => dialogueReducer(replied, N, { type: "REPHRASE", text: " " })).toThrow(/Write/);
    expect(() => dialogueReducer(replied, N, { type: "JUDGE_REPAIR", judgement: "same" })).toThrow(DialogueError);
    const said = dialogueReducer(replied, N, { type: "REPHRASE", text: "Huomasin sen seitsemän päivää sitten." });
    v = dialogueView(said, N);
    expect(v).toMatchObject({ awaitingRephrase: false, awaitingRepairConfirm: true });
    expect(v.lines[2]).toMatchObject({ text_fi: N.turns[2]!.text_fi, repair: "Huomasin sen seitsemän päivää sitten." });
    expect(() => dialogueReducer(said, N, { type: "REPHRASE", text: "uudestaan" })).toThrow(DialogueError);       // second wording frozen too
    expect(() => dialogueReducer(said, N, { type: "NEXT_TURN" })).toThrow(/Clarify/);
    const ok = dialogueReducer(said, N, { type: "JUDGE_REPAIR", judgement: "same" });
    expect(dialogueReducer(ok, N, { type: "NEXT_TURN" }).turn).toBe(3);
  });
  it("no clarification at other turns or after a skipped reply", () => {
    const first = go([{ type: "REPLY", text: "Hei." }]);
    expect(dialogueView(first, N)).toMatchObject({ awaitingRephrase: false });
    expect(() => dialogueReducer(first, N, { type: "REPHRASE", text: "x" })).toThrow(DialogueError);
    const skipped = go([...toRepair, { type: "SKIP_REPLY" }]);
    expect(dialogueView(skipped, N)).toMatchObject({ awaitingRephrase: false });
    expect(dialogueView(skipped, N).lines[2]).toMatchObject({ text_fi: N.turns[2]!.text_fi, clarification_fi: null });
    expect(dialogueReducer(skipped, N, { type: "NEXT_TURN" }).turn).toBe(3);
  });
  it("condition change appears only after the learner's own role-play; all productions saved ungraded", () => {
    const rp = go([...afterTurns(), ...questions()]);
    expect(rp.phase).toBe("roleplay");
    expect(dialogueView(rp, N)).toMatchObject({ transfer_fi: N.roleplay_transfer_fi, change_fi: null, roleplay: null });
    expect(() => dialogueReducer(rp, N, { type: "SUBMIT_TRANSFER", text: "x" })).toThrow(DialogueError);
    const changed = dialogueReducer(rp, N, { type: "SUBMIT_ROLEPLAY", text: "Hei, korjaaja ei tullut eilen." });
    expect(dialogueView(changed, N)).toMatchObject({ phase: "transfer", change_fi: N.negotiation!.condition_change_fi, roleplay: "Hei, korjaaja ei tullut eilen." });
    const done = dialogueReducer(changed, N, { type: "SUBMIT_TRANSFER", text: "Valitettavasti se ei sovi. Kävisikö perjantai?" });
    const ev = dialogueEvidence(done, N);
    expect(ev.map(e => e.taskId)).toEqual([...N.questions.map(q => q.id), `${N.id}-repair`, `${N.id}-roleplay`, `${N.id}-change`]);
    expect(ev.find(e => e.taskId.endsWith("-repair"))!.response).toContain("self-judged partly");
    expect(ev.find(e => e.taskId.endsWith("-roleplay"))!.response).toContain("korjaaja ei tullut");
    let st = blankState(); for (const e of ev) st = addDiagnostic(st, e);
    expect(st.diagnostics.some(d => "correct" in d)).toBe(false);
  });
});
