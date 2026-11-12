import { describe, expect, it } from "vitest";

/**
 * TZ-EXAM-20 / EXAM-PILLAR-02 (automated part): the interface never claims to be the official YKI. Every sentence of a
 * UI source that mentions "official" (офіційн… / virallinen…) must also say it is NOT: не, ні, неофіційн…, ei, epä…
 * The legal review of rights and privacy itself stays a human step.
 */
const sources = import.meta.glob(["../**/*.ts", "../**/*.tsx", "!../**/*.test.*"], { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const OFFICIAL = /офіційн|virallis|virallinen|viralli/i;
/** "Official" only matters next to the exam itself or its outcome — not "офіційні справи" (Kela, city services). */
const EXAM_CONTEXT = /YKI|іспит|екзамен|сертифікат|результат|оцінк|рівен|\bkoe\b|kokee|tutkint|tulos|arvosana|taso/i;
const NEGATION = /(^|[^\p{L}])(не|ні|неофіційн\p{L}*|ще не|ei|eikä|epävirallinen|epävirallis\p{L}*)([^\p{L}]|$)|неофіційн|epäviralli/iu;

export function unsupportedOfficialClaims(text: string): string[] {
  return text.split(/(?<=[.!?…])\s+|\n|`/)
    .map(s => s.trim())
    .filter(s => OFFICIAL.test(s) && EXAM_CONTEXT.test(s) && !NEGATION.test(s));
}

describe("no false 'official YKI' claims in the interface (TZ-EXAM-20)", () => {
  it("the checker itself: a bare claim fails, a negated one passes", () => {
    expect(unsupportedOfficialClaims("Пройди офіційний YKI вдома.")).toHaveLength(1);
    expect(unsupportedOfficialClaims("Virallinen YKI-koe.")).toHaveLength(1);
    expect(unsupportedOfficialClaims("Це не офіційний YKI.")).toEqual([]);
    expect(unsupportedOfficialClaims("Harjoituskoe · epävirallinen")).toEqual([]);
    expect(unsupportedOfficialClaims("Впоратися з офіційними справами: Kela, курси.")).toEqual([]);   // not about the exam
    expect(unsupportedOfficialClaims("Це тренувальний субтест, не «офіційний частковий YKI».")).toEqual([]);
  });
  it("no UI source states or implies that the app is the official YKI", () => {
    expect(Object.keys(sources).length).toBeGreaterThan(30);
    const hits = Object.entries(sources).flatMap(([file, text]) =>
      text.split("\n").flatMap((line, i) => /^\s*(\/\/|\*|\/\*)/.test(line) ? []
        : unsupportedOfficialClaims(line).map(c => `${file}:${i + 1}: ${c.slice(0, 120)}`)));
    expect(hits).toEqual([]);
  });
});
