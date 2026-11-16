/**
 * DESIGN-11 anti-sameness gate, as rules a test can fail (brand/identity-v03-screen-system.md §9):
 * the app's form language is a ruled household ledger with one signature cut, not a dashboard of rounded cards.
 * Static: reads the stylesheets; the rendered checks live in e2e/design.spec.ts.
 */
import { describe, expect, it } from "vitest";
// @ts-expect-error vitest runs in Node; the browser tsconfig deliberately has no Node types
import { readFileSync } from "node:fs";

const read = (f: string): string => readFileSync(new URL(f, import.meta.url), "utf8");
const css = read("./styles.css").replace(/\/\*[\s\S]*?\*\//g, "");
const fonts = read("./fonts.css");
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({ selector: m[1]!.trim(), body: m[2]! }));
const having = (re: RegExp) => rules.filter(r => re.test(r.body)).map(r => r.selector);

describe("form language: a ruled ledger, not a dashboard (DESIGN-11)", () => {
  it("no box carries an accent stripe down its left edge (the commonest generated-UI callout)", () => {
    expect(having(/border-left\s*:/)).toEqual([]);
    // The one allowed use: the hairline between the two mode entries, which is a column rule, not a stripe on a box.
    expect(having(/border-left-color\s*:/)).toEqual([".mode-entry + .mode-entry", ".mode-entry + .mode-entry"]);
    expect(having(/border-left-(width|style)\s*:/)).toEqual([]);
  });
  it("surfaces are square: the only rounded shapes are the gold steps, which copy the round stroke ends of the H-mark", () => {
    const rounded = rules.filter(r => [...r.body.matchAll(/border-radius\s*:\s*([^;]+)/g)].some(m => m[1]!.trim() !== "0")).map(r => r.selector);
    expect(rounded.sort()).toEqual([".mode-entry::after", ".today::after"]);
    expect(css).toMatch(/button, input, textarea, select \{ font: inherit; border-radius: 0; \}/);   // native controls too (iOS rounds them)
    expect(css).not.toMatch(/var\(--radius-/);
  });
  it("no uppercase tracked labels, no drop shadows, no gradients, glass or animation loops", () => {
    expect(css).not.toMatch(/text-transform\s*:\s*uppercase/);
    expect(css).not.toMatch(/letter-spacing\s*:/);
    expect(css).not.toMatch(/box-shadow\s*:/);
    expect(css).not.toMatch(/gradient\(|backdrop-filter|@keyframes/);
  });
  it("the signature cut belongs to the screen's one main sheet only (next step / plan on Home, the task sheet elsewhere)", () => {
    const cut = rules.filter(r => /clip-path\s*:\s*polygon\(0 0, 100% 0, 100% calc\(100% - 30px\), calc\(100% - 30px\) 100%, 0 100%\)/.test(r.body)).map(r => r.selector);
    expect(cut.sort()).toEqual([".panel", ".today"]);
    // The exam and the reviewer's nested sheet have no cut; forced colours get a real border instead of it.
    expect(css).toMatch(/html\[data-mode="exam"\] \.panel, \.panel\.review-unit \{ clip-path: none; border: 1px solid var\(--stroke\); \}/);
    expect(css).toMatch(/@media \(forced-colors: active\) \{[^}]*\.panel, \.today \{ clip-path: none; border: 1px solid CanvasText; \}/);
  });
  it("gold is decoration, so it stays on Home: no task sheet, exam sheet or calm screen carries it (COG-07, ATT-01, COLOR-15/20)", () => {
    // Besides the two Home signatures, gold only marks a state that is also said in words: a warning's rule and an open door.
    expect(having(/var\(--gold\)/).sort()).toEqual([".feedback.warn", ".mode-entry::after", ".place-step", ".today::after", ".voice-status.warn"]);
    expect(rules.filter(r => /^\.panel\b/.test(r.selector) && /::(after|before)/.test(r.selector))).toEqual([]);      // nothing drawn on the task sheet
    expect(css).toMatch(/\[data-appearance="calm"\] \.today::after \{ display: none; \}/);
    expect(css).toMatch(/\[data-appearance="calm"\] \.mode-entry::after \{ display: none; \}/);
  });
  it("two voices: Ukrainian guidance in Arsenal, Finnish in Finlandica — bundled files only, nothing fetched from another origin", () => {
    expect(css).toMatch(/:root \{[^}]*font-family: "Arsenal", system-ui/);
    expect(css).toMatch(/\[lang="fi"\] \{ font-family: "Finlandica", system-ui/);
    const faces = [...fonts.matchAll(/@font-face \{([^}]*)\}/g)].map(m => m[1]!);
    expect(faces.filter(f => /font-family: "Arsenal"/.test(f))).toHaveLength(4);        // 400 and 700 × Cyrillic and Latin
    expect(faces.filter(f => /font-family: "Finlandica"/.test(f))).toHaveLength(2);     // variable 400–700 × Latin and Latin Extended
    for (const f of faces) {
      expect(f).toMatch(/src: url\("\.\.\/node_modules\/@fontsource(-variable)?\/(arsenal|finlandica)\/files\/[a-z0-9-]+\.woff2"\)/);
      expect(f).toMatch(/font-display: swap/);
      expect(f).toMatch(/unicode-range:/);
    }
    expect(fonts).not.toMatch(/https?:\/\//);
    // The Cyrillic subset covers the Ukrainian letters і ї є ґ (U+0456, U+0457, U+0454, U+0491).
    expect(fonts).toMatch(/U\+0400-045F, U\+0490-0491/);
  });
  it("legibility: one x-height for every face, a readable measure for long Finnish text, and the learner's own font choice", () => {
    expect(css).toMatch(/:root \{[^}]*font-size-adjust: 0\.53;/);                               // Arsenal/Finlandica (0.50) are not smaller than the fallback
    expect(css).toMatch(/\.reading-text \{[^}]*line-height: 1\.75; max-width: 31em; \}/);        // about 65–70 characters per line
    expect(css).toMatch(/\.prompt\.reading-text\[lang="fi"\] \{ font-weight: 400; \}/);
    expect(css).toMatch(/:root\[data-font="system"\], :root\[data-font="system"\] \[lang="fi"\] \{ font-family: system-ui/);
    expect(css).toMatch(/body \{[^}]*font-size: 1\.0625rem; line-height: 1\.5; \}/);              // rem: the browser's own text size still wins
  });
  it("a ruled row still looks clickable: every row that opens something carries the same chevron", () => {
    expect(css).toMatch(/\.choice::after, \.place-tile::after, \.more-tile::after, \.skill-tile::after \{ content: ""; position: absolute;/);
    for (const row of [".choice", ".place-tile", ".more-tile", ".skill-tile"]) {
      const body = rules.find(r => r.selector === row)?.body ?? "";
      expect(body, row).toMatch(/position: relative/);
      expect(body, row).toMatch(/cursor: pointer/);
    }
  });
  it("only weights the two typefaces really have are requested (no synthesised bold)", () => {
    const weights = new Set([...css.matchAll(/font-weight\s*:\s*(\d+)/g)].map(m => Number(m[1])));
    for (const w of weights) expect(w >= 400 && w <= 700, String(w)).toBe(true);
    expect(css).toMatch(/font-synthesis-weight: none/);
  });
});
