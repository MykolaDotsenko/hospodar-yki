import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { audioBand, ykiAudioGuide, type YkiAudioCandidate } from "../src/index.ts";

const catalog = JSON.parse(readFileSync(new URL("../../../sources/audio/yki-targeted-sources-2026-10.json", import.meta.url), "utf8")) as { external_candidates: YkiAudioCandidate[] };
const c = (over: Partial<YkiAudioCandidate>): YkiAudioCandidate => ({ id: "x-1", name: "Nimi", provider: "P", level: "A2.2", page: "https://aoe.fi/materiaali/1",
  notes: "Нотатка.", not_exam_simulation: true, ...over });

describe("audio guide for YKI listening preparation (CURATED-09)", () => {
  it("keeps only labelled, link-only publisher pages on allowed hosts; refuses official samples, downloads, unknown hosts and unlabelled entries", () => {
    const r = ykiAudioGuide([c({}), c({ id: "x-2", is_official_yki_sample: true }), c({ id: "x-3", not_exam_simulation: undefined }),
      c({ id: "x-4", page: "https://aoe.fi/api/v1/download/file/a.pdf" }), c({ id: "x-5", page: "http://aoe.fi/x" }),
      c({ id: "x-6", page: "https://example.com/audio" }), c({ id: "x-7", notes: " " }), c({ id: "x-8", page: "https://selkosanomat.fi/paakirjoitus/" })]);
    expect(r.links.map(l => l.id)).toEqual(["x-1", "x-8"]);
    expect(r.refused.map(x => x.id)).toEqual(["x-2", "x-3", "x-4", "x-5", "x-6", "x-7"]);
    expect(r.refused.find(x => x.id === "x-4")!.reason).toMatch(/download/);
  });
  it("bands are a reading aid from the level label: warm-up, B1, stretch — in that order", () => {
    expect([audioBand("A2.2"), audioBand("A2–B1"), audioBand("B1"), audioBand("B1+–B2"), audioBand("B1–B2")]).toEqual(["warmup", "b1", "b1", "stretch", "stretch"]);
    const r = ykiAudioGuide([c({ id: "s-1", level: "B2" }), c({ id: "w-1", level: "A2" }), c({ id: "b-1", level: "B1" })]);
    expect(r.links.map(l => l.band)).toEqual(["warmup", "b1", "stretch"]);
  });
  it("the saved catalog: 14 publisher pages are shown; the two script downloads are refused", () => {
    const r = ykiAudioGuide(catalog.external_candidates);
    expect(r.links).toHaveLength(14);
    expect(r.refused.map(x => x.id)).toEqual(["vierko-job-shadow-part1", "vierko-job-shadow-part2"]);
    expect(r.links.every(l => l.url.startsWith("https://"))).toBe(true);
  });
});
