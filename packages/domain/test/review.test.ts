import { describe, expect, it } from "vitest";
import {
  canonicalReviewJson, formatSha256, itemReviewStatus, parseReviewDecisionsFile, reviewDecisionErrors, reviewDecisionsFile, upsertDecision,
  validReviewerId, REVIEW_DECISIONS_SCHEMA, type ReviewDecision,
} from "../src/index.ts";

const HASH = "sha256:" + "a".repeat(64);
const approve = (over: Partial<ReviewDecision> = {}, approval: Partial<NonNullable<ReviewDecision["approval"]>> = {}): ReviewDecision => ({
  file: "learning/exercises/b1/grammar/contextual-cloze.json", item_id: "b1-cloze-001", content_hash: HASH, decision: "approve",
  reviewer_id: "s2-rev-01", reviewed_at: "2026-11-14",
  approval: { level: "B1.1", skills: ["grammar"], communicative_outcome_uk: "Сказати, де я живу, з правильним відмінком.",
    source: { kind: "project_original", license: "project_original" }, answer_variants_reviewed: true, transcript_reviewed: null, content_version: 1, ...approval },
  ...over,
});
const giveBack = (over: Partial<ReviewDecision> = {}): ReviewDecision => ({
  file: "knowledge/dictionaries/b1/rektio-v1.json", item_id: "rektio-01", content_hash: HASH, decision: "return",
  reviewer_id: "s2-rev-01", reviewed_at: "2026-11-14", return_categories: ["key"], reason_uk: "Прийнятний також варіант «Helsingissä».", ...over,
});

describe("S2 review decisions (docs/29 stage 1, QL-01)", () => {
  it("a complete approval passes; every required card field is refused when missing", () => {
    expect(reviewDecisionErrors(approve(), { hasAudio: false })).toEqual([]);
    const cases: [ReviewDecision, RegExp][] = [
      [approve({}, { level: "" }), /рівень/],
      [approve({}, { skills: [] }), /навичку/],
      [approve({}, { communicative_outcome_uk: "так" }), /що учень зможе/],
      [approve({}, { source: { kind: "", license: "project_original" } }), /походження/],
      [approve({}, { source: { kind: "licensed", license: "CC-BY-ND-4.0", url: "https://x.fi" } }), /поширення/],
      [approve({}, { source: { kind: "licensed", license: "CC-BY-4.0" } }), /https/],
      [approve({}, { answer_variants_reviewed: false }), /ключ і всі прийнятні варіанти/],
      [approve({}, { content_version: 0 }), /Версія/],
      [approve({ reviewer_id: "" }), /псевдонімний/],
      [approve({ reviewer_id: "Anna Virtanen" }), /псевдонімний/],
      [approve({ reviewed_at: "14.11.2026" }), /РРРР-ММ-ДД/],
      [approve({ content_hash: "" }), /хешу/],
      [approve({ file: "../secrets.json" }), /файл/],
      [approve({ file: "apps/web/src/App.tsx" }), /файл/],
      [{ ...approve(), approval: undefined } as unknown as ReviewDecision, /картку рецензії/],
    ];
    for (const [d, needle] of cases) expect(reviewDecisionErrors(d, { hasAudio: false }).join(" "), String(needle)).toMatch(needle);
  });
  it("audio items need the transcript checked; items without audio must not claim it", () => {
    expect(reviewDecisionErrors(approve({}, { transcript_reviewed: null }), { hasAudio: true }).join(" ")).toMatch(/аудіо разом із транскриптом/);
    expect(reviewDecisionErrors(approve({}, { transcript_reviewed: true }), { hasAudio: true })).toEqual([]);
    expect(reviewDecisionErrors(approve({}, { transcript_reviewed: true }), { hasAudio: false }).join(" ")).toMatch(/немає аудіо/);
  });
  it("a return needs a category and a concrete reason, but no card fields", () => {
    expect(reviewDecisionErrors(giveBack(), { hasAudio: false })).toEqual([]);
    expect(reviewDecisionErrors(giveBack({ return_categories: [] }), { hasAudio: false }).join(" ")).toMatch(/причину повернення/);
    expect(reviewDecisionErrors(giveBack({ reason_uk: "погано" }), { hasAudio: false }).join(" ")).toMatch(/що саме виправити/);
  });
  it("reviewer ids are pseudonymous", () => {
    expect(validReviewerId("s2-rev-01")).toBe(true);
    for (const bad of ["a", "name@mail.fi", "Anna Virtanen", "x..y", "ä-rev"]) expect(validReviewerId(bad), bad).toBe(false);
  });
  it("one decision per item; the file refuses an incomplete approval and round-trips", () => {
    const list = upsertDecision(upsertDecision([], approve()), giveBack());
    const replaced = upsertDecision(list, giveBack({ file: approve().file, item_id: approve().item_id }));
    expect(replaced).toHaveLength(2);
    expect(replaced.filter(d => d.decision === "return")).toHaveLength(2);
    const file = reviewDecisionsFile(list, "2026-11-14T10:00:00.000Z", () => false);
    expect(file.schema).toBe(REVIEW_DECISIONS_SCHEMA);
    expect(parseReviewDecisionsFile(JSON.parse(JSON.stringify(file)))).toEqual(file.decisions);
    expect(() => reviewDecisionsFile([approve({}, { level: "" })], "2026-11-14T10:00:00.000Z", () => false)).toThrow(/рівень/);
    expect(parseReviewDecisionsFile({ schema: "other", decisions: [] })).toBeNull();
    expect(parseReviewDecisionsFile({ schema: REVIEW_DECISIONS_SCHEMA, decisions: [{ file: 1 }] })).toBeNull();
  });
});

describe("canonical item JSON (parity with scripts/validate_content_publication.py)", () => {
  it("drops the review card, sorts keys, compact separators, keeps Finnish letters unescaped", () => {
    const item = { prompt_fi: "Asun ___ (Helsinki).", id: "x", review_card: { status: "draft" }, nested: { b: [1, 2.5, true, null], a: "ä\"\n" } };
    expect(canonicalReviewJson(item)).toBe('{"id":"x","nested":{"a":"ä\\"\\n","b":[1,2.5,true,null]},"prompt_fi":"Asun ___ (Helsinki)."}');
  });
  it("refuses numbers whose text differs between JavaScript and Python", () => {
    expect(() => canonicalReviewJson({ x: 0.00001 })).toThrow(/canonical/);
    expect(canonicalReviewJson({ x: 0.0001, y: 143 })).toBe('{"x":0.0001,"y":143}');
  });
  it("formats a sha256 digest", () => {
    expect(formatSha256(new Uint8Array([0, 15, 255]))).toBe("sha256:000fff");
  });
  it("item status reads the repository card and notices edits made after the decision", () => {
    expect(itemReviewStatus({ id: "x" }, HASH)).toBe("unreviewed");
    expect(itemReviewStatus({ review_card: { status: "published", content_hash: HASH } }, HASH)).toBe("approved");
    expect(itemReviewStatus({ review_card: { status: "published", content_hash: HASH } }, "sha256:" + "b".repeat(64))).toBe("approved_changed");
    expect(itemReviewStatus({ review_card: { status: "draft", content_hash: HASH, s2_review: { decision: "returned" } } }, HASH)).toBe("returned");
    expect(itemReviewStatus({ review_card: { status: "draft", content_hash: HASH, s2_review: { decision: "returned" } } }, "sha256:" + "b".repeat(64))).toBe("returned_changed");
    expect(itemReviewStatus({ review_card: { status: "draft" } }, HASH)).toBe("unreviewed");
  });
});
