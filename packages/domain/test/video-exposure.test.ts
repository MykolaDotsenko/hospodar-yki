import { describe, expect, it } from "vitest";
import { emptyVideoExposure, markModelAnswersSeen, parseVideoExposure, unmarkModelAnswersSeen, videoCheckStatus } from "../src/index.ts";

describe("exposure to model answers in practice videos (MOCK-VID-08)", () => {
  it("video exposure: the learner's own mark turns a video from a fresh check into an example; the first day stays; removable", () => {
    let log = emptyVideoExposure();
    expect(videoCheckStatus(log, "yki-harjoitus-timed-speaking-2022")).toBe("fresh");
    log = markModelAnswersSeen(log, "yki-harjoitus-timed-speaking-2022", "2026-11-18");
    log = markModelAnswersSeen(log, "yki-harjoitus-timed-speaking-2022", "2026-11-20");
    expect(log.seen["yki-harjoitus-timed-speaking-2022"]).toBe("2026-11-18");
    expect(videoCheckStatus(log, "yki-harjoitus-timed-speaking-2022")).toBe("seen");
    expect(Object.keys(log).sort()).toEqual(["seen", "version"]);           // no score or count
    expect(() => markModelAnswersSeen(log, "bad id!", "2026-11-18")).toThrow("BAD_ID");
    expect(() => markModelAnswersSeen(log, "x", "18.11.2026")).toThrow("BAD_DAY");
    expect(videoCheckStatus(unmarkModelAnswersSeen(log, "yki-harjoitus-timed-speaking-2022"), "yki-harjoitus-timed-speaking-2022")).toBe("fresh");
  });
  it("video exposure: the reader keeps valid marks and drops anything else; a damaged record is no marks, never invented ones", () => {
    expect(parseVideoExposure({ version: 1, seen: { a: "2026-11-18", "b c": "2026-11-18", d: "yesterday" } })).toEqual({ version: 1, seen: { a: "2026-11-18" } });
    for (const bad of [null, [], "x", { version: 2, seen: {} }, { version: 1, seen: [] }]) expect(parseVideoExposure(bad)).toEqual(emptyVideoExposure());
  });
});
