import { describe, expect, it } from "vitest";
import { OPH_CRITERIA, RATER_LEVEL_CHOICES, raterPackage, raterPackageHtml, type RaterItem } from "../src/index.ts";

const items: RaterItem[] = [
  { id: "r1", skill: "reading", prompt: "Lue teksti." },
  { id: "w1", skill: "writing", prompt: "Kirjoita viesti taloyhtiölle." },
  { id: "s1", skill: "speaking", prompt: "Soita ja siirrä aikaa." },
  { id: "s2", skill: "speaking", prompt: "Kerro mielipiteesi." },
];

describe("package for a human S2 rater (TZ-EXAM-16, R04)", () => {
  it("rater package: writing and speaking only, with OPH criterion names and sources, empty level choices for the rater, no grade anywhere", () => {
    const p = raterPackage(items, { r1: "0", w1: " Hei! Ovi on rikki. ", s2: "" }, new Set(["s1"]), "Mini-rehearsal A", "2026-11-19");
    expect(p.productions.map(x => [x.id, x.skill, x.voiceRecorded])).toEqual([["w1", "writing", false], ["s1", "speaking", true]]);   // unanswered s2 left out, reading never
    expect(p.productions[0]!.response_fi).toBe("Hei! Ovi on rikki.");
    expect(p.criteria).toBe(OPH_CRITERIA);
    expect(OPH_CRITERIA.speaking.source).toMatch(/^https:\/\/www\.oph\.fi\/.*Puhumisen_arviointikriteerit\.pdf$/);
    expect(OPH_CRITERIA.writing.dimensions_fi).toContain("rakenteiden tarkkuus");
    expect(RATER_LEVEL_CHOICES).toEqual(["alle 3", "3", "4", "ei arvioitavissa"]);
    expect(JSON.stringify(p)).not.toMatch(/"(score|grade|level|points)"\s*:/);   // the app never fills a rating
    expect(() => raterPackage(items, { r1: "1" }, new Set(), "x", "2026-11-19")).toThrow("NOTHING_TO_RATE");
  });

  it("rater package HTML: self-contained, every learner text escaped, the voice recording stays on the device, the rating left empty", () => {
    const p = raterPackage(items, { w1: '<script>alert("x")</script> & kiitos' }, new Set(["s1"]), "A <b>", "2026-11-19");
    const html = raterPackageHtml(p);
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; kiitos");
    expect(html).toContain("A &lt;b&gt;");
    expect(html).toContain("ei mukana tässä tiedostossa");
    expect(html).toContain("☐ 3");
    expect(html).not.toMatch(/☑|☒|checked/);
    expect(html).not.toMatch(/<script|src=|@import|https:\/\/(?!www\.oph\.fi)/);   // nothing loads from anywhere
  });
});
