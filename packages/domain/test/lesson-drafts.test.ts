import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { externalDraft, externalReducer, masterclassDraft, masterclassReducer, restoreExternalDraft, restoreMasterclassDraft, startExternal, startMasterclass,
  toExternalMission, toMasterclass, type ExternalMission, type ExternalSourceItem, type Masterclass, type MasterclassLesson } from "../src/index.ts";

const root = new URL("../../../", import.meta.url);
const read = (p: string) => JSON.parse(readFileSync(new URL(p, root), "utf8"));
const m = (read("learning/exercises/b1/masterclasses/lessons.json").lessons as MasterclassLesson[]).map(toMasterclass).find((x): x is Masterclass => !!x)!;
const x = (read("sources/audio/oph-adult-spoken-finnish-2026-10.json").items as ExternalSourceItem[]).map(toExternalMission).find((y): y is ExternalMission => !!y)!;
const T = new Date("2026-11-19T10:00:00Z");
const rt = (d: unknown) => JSON.parse(JSON.stringify(d));

describe("pause and resume masterclasses and external missions (COG-11)", () => {
  it("masterclass: frozen answers and later steps come back at the same step; nothing before any work; a finished lesson is not kept", () => {
    let s = startMasterclass(m);
    expect(masterclassDraft(s, "", T)).toBeNull();
    s = masterclassReducer(s, m, { type: "ANSWER", index: 0 });
    expect(restoreMasterclassDraft(rt(masterclassDraft(s, "", T)), m)?.session.answers).toEqual([0]);
    s = masterclassReducer(s, m, { type: "ANSWER", index: 1 });
    s = masterclassReducer(s, m, { type: "CONTINUE" });
    const back = restoreMasterclassDraft(rt(masterclassDraft(s, "Ilmoittaudu", T)), m)!;
    expect(back).toMatchObject({ value: "Ilmoittaudu", session: { phase: "repair", answers: [0, 1] } });
    expect(() => masterclassReducer({ ...back.session, phase: "check" }, m, { type: "ANSWER", index: 1 })).toThrow();   // the screen cannot re-ask
    const good = rt(masterclassDraft(s, "", T));
    expect(restoreMasterclassDraft({ ...good, session: { ...good.session, answers: [0] } }, m)).toBeNull();          // repair before both answers
    expect(restoreMasterclassDraft({ ...good, session: { ...good.session, answers: [0, 99] } }, m)).toBeNull();
    expect(restoreMasterclassDraft({ ...good, session: { ...good.session, phase: "model" } }, m)).toBeNull();          // a model without an own response
    expect(restoreMasterclassDraft({ ...good, lessonId: "other" }, m)).toBeNull();
    s = masterclassReducer(s, m, { type: "SUBMIT_REPAIR", text: "Parempi versio." });
    s = masterclassReducer(masterclassReducer(s, m, { type: "CONTINUE" }), m, { type: "SUBMIT_RESPONSE", text: "Oma vastaus." });
    s = masterclassReducer(masterclassReducer(s, m, { type: "JUDGE", judgement: "partly" }), m, { type: "CONTINUE" });
    expect(restoreMasterclassDraft(rt(masterclassDraft(s, "", T)), m)?.session.phase).toBe("transfer");
    expect(masterclassDraft(masterclassReducer(s, m, { type: "SUBMIT_TRANSFER", text: "Uusi teksti." }), "", T)).toBeNull();
  });
  it("external mission: the own answer comes back with the step; «not found» and done are never kept; inconsistent records are refused", () => {
    let s = startExternal(x);
    expect(externalDraft(s, " ", T)).toBeNull();
    expect(restoreExternalDraft(rt(externalDraft(s, "Asiakas haluaa", T)), x)).toMatchObject({ value: "Asiakas haluaa", session: { phase: "open" } });
    s = externalReducer(s, x, { type: "ANSWER", text: "Asiakas haluaa varata ajan." });
    const back = restoreExternalDraft(rt(externalDraft(s, "", T)), x)!;
    expect(back.session).toMatchObject({ phase: "reflect", answer: "Asiakas haluaa varata ajan." });
    expect(externalDraft(externalReducer(startExternal(x), x, { type: "NOT_FOUND" }), "", T)).toBeNull();
    const good = rt(externalDraft(s, "", T));
    expect(restoreExternalDraft({ ...good, session: { ...good.session, answer: "" } }, x)).toBeNull();
    expect(restoreExternalDraft({ ...good, session: { ...good.session, phase: "done" } }, x)).toBeNull();
  });
});
