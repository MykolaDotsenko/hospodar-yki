/** CURATED-09: the saved synthetic recordings are LEARN listening now — without breaking held-out checks or the exam. */
import { describe, expect, it } from "vitest";
import { alternatesFor, heldOutReading, listeningLessons, mediaFor, trainingLessons } from "./listening.ts";
import { skillRetentionBank } from "./skillRetention.ts";
import { placeIndex } from "./places.ts";

describe("saved synthetic recordings connected to LEARN listening (CURATED-09)", () => {
  it("theme dialogues and notices and the free inference texts are listening lessons with their own audio, questions and transcript", () => {
    const ids = trainingLessons.map(l => l.id);
    expect(ids.filter(id => /-dialogue$/.test(id))).toHaveLength(9);
    expect(ids.filter(id => /-notice$/.test(id))).toHaveLength(9);
    expect(ids.filter(id => id.startsWith("b1-read-inference-"))).toEqual(["b1-read-inference-004-audio", "b1-read-inference-005-audio"]);
    for (const l of trainingLessons) {
      expect(listeningLessons).toContain(l);                                            // in the learner pool
      const m = mediaFor(l);
      expect(m.audio, l.id).toBeTruthy();                                                // the bundled file resolves
      expect(m.transcript, l.id).toMatch(/\S/);                                          // shown only after the answers (listeningView)
      expect(l.questions.length).toBeGreaterThan(0);
      expect(l.narrators_type).toMatch(/tts/);                                           // labelled synthetic, one voice
    }
  });

  it("a withheld delayed-check text never becomes LEARN listening, and no exam lesson is touched", () => {
    expect([...heldOutReading]).toEqual(skillRetentionBank.reading.map(r => r.id));    // the same three texts the checks use
    for (const id of heldOutReading) expect(listeningLessons.some(l => l.id.startsWith(id))).toBe(false);
    expect(trainingLessons.some(l => l.id.startsWith("b1long-"))).toBe(false);
  });

  it("each theme lesson belongs to its place; slower/faster recordings exist only as after-answer replays", () => {
    for (const l of trainingLessons.filter(x => /^0\d-/.test(x.id))) {
      const item = placeIndex.items.find(i => i.skill === "listening" && l.questions[0]!.id.startsWith(i.itemId));
      expect(item?.place, l.id).toBe(l.topic);
    }
    const notice = trainingLessons.find(l => l.id === "05-matkustaminen-notice")!;
    expect(alternatesFor(notice).map(a => a.variant)).toEqual(["scaffold_slow"]);
    expect(alternatesFor(trainingLessons.find(l => l.id === "b1-read-inference-004-audio")!).map(a => a.variant)).toEqual(["challenge_fast"]);
    expect(alternatesFor(trainingLessons.find(l => l.id === "05-matkustaminen-dialogue")!)).toEqual([]);
    for (const l of trainingLessons) expect(alternatesFor(l).every(a => a.url && a.path !== l.path)).toBe(true);
  });
});
