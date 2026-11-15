import { describe, expect, it } from "vitest";
import { deedDoneOn, emptyDeedLog, markDeed, parseDeedLog, unmarkDeed } from "../src/index.ts";

describe("private real-life deed marks (real-world-interaction)", () => {
  it("a mark is a date per place; it can be removed; nothing else is recorded", () => {
    let log = markDeed(emptyDeedLog(), "housing", "2026-11-15");
    expect(deedDoneOn(log, "housing")).toBe("2026-11-15");
    expect(deedDoneOn(log, "work")).toBeNull();
    expect(Object.keys(log)).toEqual(["version", "done"]);                  // no count, score, streak or level field
    log = unmarkDeed(log, "housing");
    expect(log).toEqual(emptyDeedLog());
  });
  it("the reader drops anything unexpected instead of inventing a mark", () => {
    expect(parseDeedLog({ version: 1, done: { housing: "2026-11-15", nowhere: "2026-11-15", work: "yesterday", health: 3 } }))
      .toEqual({ version: 1, done: { housing: "2026-11-15" } });
    for (const bad of [null, "x", [], { version: 2, done: {} }, { version: 1, done: [] }]) expect(parseDeedLog(bad)).toEqual(emptyDeedLog());
  });
  it("unknown places and malformed dates are refused", () => {
    expect(() => markDeed(emptyDeedLog(), "moon" as never, "2026-11-15")).toThrow("UNKNOWN_PLACE");
    expect(() => markDeed(emptyDeedLog(), "work", "15.11.2026")).toThrow("BAD_DAY");
  });
});
