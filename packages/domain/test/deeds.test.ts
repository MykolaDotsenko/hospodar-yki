import { describe, expect, it } from "vitest";
import { clearDeedNote, deedDoneOn, deedNote, emptyDeedLog, markDeed, parseDeedLog, setDeedNote, unmarkDeed } from "../src/index.ts";

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

describe("private reflection after a real-life deed (real-world-interaction)", () => {
  it("deed reflection: only next to a mark; how it went is one of three, the note is short and optional; removing the mark removes the reflection", () => {
    expect(() => setDeedNote(emptyDeedLog(), "housing", "well", "")).toThrow("NOT_MARKED");
    let log = markDeed(emptyDeedLog(), "housing", "2026-11-15");
    expect(() => setDeedNote(log, "housing", "great" as never, "")).toThrow("BAD_WENT");
    expect(() => setDeedNote(log, "housing", "partly", "x".repeat(301))).toThrow("TOO_LONG");
    log = setDeedNote(log, "housing", "partly", "  Kysyn  ensi kerralla hitaammin.  ");
    expect(deedNote(log, "housing")).toEqual({ went: "partly", next_uk: "Kysyn ensi kerralla hitaammin." });
    expect(Object.keys(log).sort()).toEqual(["done", "notes", "version"]);  // still no count, score, streak or level
    expect(parseDeedLog(JSON.parse(JSON.stringify(log)))).toEqual(log);   // survives storage
    log = markDeed(log, "work", "2026-11-16");
    expect(deedNote(log, "housing")).not.toBeNull();                       // another mark leaves it alone
    expect(clearDeedNote(log, "housing")).toEqual({ version: 1, done: log.done });
    log = unmarkDeed(log, "housing");
    expect(deedNote(log, "housing")).toBeNull();
    expect(log).toEqual({ version: 1, done: { work: "2026-11-16" } });
  });
  it("deed reflection: the reader drops a reflection without its mark, an unknown feeling or a note that is too long", () => {
    expect(parseDeedLog({ version: 1, done: { housing: "2026-11-15" },
      notes: { housing: { went: "hard", next_uk: "ok" }, work: { went: "well", next_uk: "" }, health: { went: "superb", next_uk: "" } } }))
      .toEqual({ version: 1, done: { housing: "2026-11-15" }, notes: { housing: { went: "hard", next_uk: "ok" } } });
    expect(parseDeedLog({ version: 1, done: { housing: "2026-11-15" }, notes: { housing: { went: "well", next_uk: "x".repeat(301) } } }))
      .toEqual({ version: 1, done: { housing: "2026-11-15" } });
  });
});
