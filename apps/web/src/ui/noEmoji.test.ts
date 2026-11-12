import { describe, expect, it } from "vitest";

/** DESIGN-11 (automated part): the interface uses its own icon family, never emoji pictographs. */
const sources = import.meta.glob(["../**/*.ts", "../**/*.tsx", "!../**/*.test.*"], { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

describe("anti-AI-sameness gate: own icons instead of emoji (DESIGN-11)", () => {
  it("no emoji pictograph in any UI source file", () => {
    expect(Object.keys(sources).length).toBeGreaterThan(30);
    const hits = Object.entries(sources).flatMap(([file, text]) => text.split("\n")
      .map((line, i) => (EMOJI.test(line) ? `${file}:${i + 1}` : null)).filter(Boolean));
    expect(hits).toEqual([]);
  });
});
