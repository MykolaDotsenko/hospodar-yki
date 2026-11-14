import { describe, expect, it } from "vitest";
import { isPublishedItem, releaseChannelOf, releasePool } from "../src/index.ts";

const card = (status: string) => ({ review_card: { schema: "hospodar-review-card-v1", status } });
const items = [
  { id: "pub", ...card("published") }, { id: "rev", ...card("s2_reviewed") }, { id: "draft", ...card("draft") },
  { id: "gone", ...card("withdrawn") }, { id: "none" }, { id: "claim", teacher_review: "published" },
];

describe("release channel (docs/29 stage 1, QL-01)", () => {
  it("a release pool holds only published items — S2-approved but unpublished, drafts, withdrawn and bare claims stay out", () => {
    expect(releasePool(items, "release").map(i => i.id)).toEqual(["pub"]);
  });
  it("beta keeps every item (screens label drafts)", () => {
    expect(releasePool(items, "beta").map(i => i.id)).toEqual(items.map(i => i.id));
  });
  it("an entry built from several stored items is releasable only when all of them are published", () => {
    const entries = [{ id: "a", parts: [items[0], items[0]] }, { id: "b", parts: [items[0], items[1]] }, { id: "c", parts: [] }];
    expect(releasePool(entries, "release", e => e.parts).map(e => e.id)).toEqual(["a"]);
  });
  it("only the exact word 'release' makes a release build; the card must be an object with status published", () => {
    expect(releaseChannelOf("release")).toBe("release");
    for (const v of [undefined, "", "Release", "prod", "beta"]) expect(releaseChannelOf(v)).toBe("beta");
    expect(isPublishedItem({ review_card: "published" })).toBe(false);
    expect(isPublishedItem(null)).toBe(false);
  });
});
