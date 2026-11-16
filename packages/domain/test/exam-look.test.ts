import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { admitExamLookLink, examLookLinks, type ExamLookCatalog } from "../src/index.ts";

const catalog = JSON.parse(readFileSync(new URL("../../../sources/official/yki-mock-simulation-sources.json", import.meta.url), "utf8")) as ExamLookCatalog & { not_full_b1_mocks: { id: string }[] };

describe("what the exam looks like (CURATED-09, docs/29 stage 4)", () => {
  it("exam look: OPH pages, organizer examples and practice videos, link-only and labelled; A1–A2 story videos left out; a video with model answers says where they start", () => {
    const { links, refused } = examLookLinks(catalog);
    expect(refused).toEqual([]);
    expect(links.filter(l => l.group === "oph")).toHaveLength(2);
    expect(links.filter(l => l.group === "organizer").map(l => l.host)).toEqual(Array(5).fill("ykitesti.solki.jyu.fi"));
    expect(links.filter(l => l.group === "practice")).toHaveLength(5);
    const notMocks = catalog.not_full_b1_mocks.map(m => m.id);
    expect(links.some(l => notMocks.includes(l.id))).toBe(false);
    expect(links.find(l => l.id === "yki-harjoitus-timed-speaking-2022")!.answersFrom).toBe("16:22");
    expect(links.filter(l => l.group === "organizer").every(l => l.answersFrom === null)).toBe(true);
    expect(admitExamLookLink("http://www.oph.fi/x")).toMatchObject({ ok: false });
    expect(admitExamLookLink("https://ykimock.fi/")).toMatchObject({ ok: false });
    const claim = examLookLinks({ ...catalog, mock_youtube_videos: [{ ...catalog.mock_youtube_videos[0]!, is_verified_digital_2027_mock: true }] });
    expect(claim.refused.map(r => r.id)).toEqual(["yki-harjoitus-timed-speaking-2022"]);
  });
});
