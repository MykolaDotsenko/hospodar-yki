import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { addDiagnostic, blankState, externalEvidence, externalReducer, externalView, startExternal, toExternalMission, ExternalMissionError,
  type ExternalMission, type ExternalSourceItem } from "../src/index.ts";

const root = new URL("../../../", import.meta.url);
const items = (p: string) => JSON.parse(readFileSync(new URL(p, root), "utf8")).items as ExternalSourceItem[];
const oph = items("sources/audio/oph-adult-spoken-finnish-2026-10.json");
const verified = items("sources/learning/a2-b1-verified-source-missions-2026-10.json");
const dialogues = items("sources/audio/authentic-dialogues-2026-10.json");
const all = [...oph, ...verified, ...dialogues].map(toExternalMission);

describe("missions with an external source (CURATED-09): link only, own words first, teacher answers only after", () => {
  it("external mission: all 27 saved missions load; audio and video are listening, slides, PDFs and written dialogues are reading; every link is a reviewed learning host", () => {
    expect(all).toHaveLength(27);
    expect(all.every(m => m !== null)).toBe(true);
    const ms = all as ExternalMission[];
    expect(ms.filter(m => m.skill === "reading").map(m => m.id)).toEqual([...verified.slice(2), ...dialogues.filter(d => /written/.test(d.material_kind))].map(d => d.id));
    expect(ms.every(m => /^https:\/\/(www\.oph\.fi|www\.kielibuusti\.fi|aoe\.fi)\//.test(m.firstUrl))).toBe(true);
    expect(toExternalMission({ ...oph[0]!, is_official_yki: true })).toBeNull();
    expect(toExternalMission({ ...oph[0]!, audio_index_url: "https://soundcloud.com/x" })).toBeNull();      // not a reviewed learning host
    expect(toExternalMission({ ...dialogues[0]!, mission: { ...dialogues[0]!.mission, reflection_uk: "" } })).toBeNull();
  });

  it("external mission: where the publisher's teacher page shows the answers, only the audio index is linked before the own answer; the teacher page appears after it", () => {
    const m = toExternalMission(oph[0]!)!;
    expect(m.firstUrl).toBe(oph[0]!.audio_index_url);
    expect(m.afterUrl).toBe(oph[0]!.source_page);
    let s = startExternal(m);
    let v = externalView(s, m);
    expect(v.firstUrl).toBe(m.firstUrl);
    expect(v.afterUrl).toBeNull();
    expect(v.reflection_uk).toBeNull();
    expect(() => externalReducer(s, m, { type: "ANSWER", text: " " })).toThrow(ExternalMissionError);
    s = externalReducer(s, m, { type: "ANSWER", text: "Asiakas haluaa ilmoittautua kurssille." });
    v = externalView(s, m);
    expect(v.reflection_uk).toBe(m.reflection_uk);
    expect(v.afterUrl).toBe(m.afterUrl);
    s = externalReducer(s, m, { type: "CONTINUE" });
    v = externalView(s, m);
    expect(v.transfer_fi).toBe(m.transfer_fi);
    expect(v.firstUrl).toBeNull();                                         // the new situation has no source
    expect(v.prompt_fi).toBeNull();
    s = externalReducer(s, m, { type: "SUBMIT_TRANSFER", text: "Hei, lomake ei toimi." });
    expect(externalView(s, m).later_fi).toBe(m.later_fi);
    const verifiedMission = toExternalMission(verified[0]!)!;
    expect(verifiedMission.afterUrl).toBeNull();                           // no teacher answer page to hold back
  });

  it("external mission: nothing is scored; a track that was not found ends the mission with nothing saved", () => {
    const m = toExternalMission(dialogues[0]!)!;
    let s = startExternal(m);
    s = externalReducer(s, m, { type: "ANSWER", text: "Bussi on myöhässä." });
    s = externalReducer(s, m, { type: "CONTINUE" });
    s = externalReducer(s, m, { type: "SUBMIT_TRANSFER", text: "Anteeksi, kelpaako tämä lippu?" });
    const ev = externalEvidence(s, m);
    expect(ev.map(e => [e.skill, e.status])).toEqual([["listening", "ungraded"], ["speaking", "ungraded"]]);
    let state = blankState();
    for (const e of ev) state = addDiagnostic(state, e);
    expect(state.diagnostics.every(d => d.status === "ungraded")).toBe(true);
    const lost = externalReducer(startExternal(m), m, { type: "NOT_FOUND" });
    expect(lost.phase).toBe("not_found");
    expect(() => externalEvidence(lost, m)).toThrow(/Not finished/);
  });
});
