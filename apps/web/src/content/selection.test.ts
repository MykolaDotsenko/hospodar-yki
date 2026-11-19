import { describe, expect, it } from "vitest";
import { blankState, type LearnerState, type MissionAttempt } from "@hospodar/domain";
import { exercises } from "./cloze.ts";
import { INTERLEAVED_WHY, recommend } from "./selection.ts";

const NOW = new Date("2026-11-19T12:00:00+02:00");
const attempt = (taskId: string, grammarTag: string, completedAt: string): MissionAttempt => ({
  taskId, grammarTag, firstAnswer: "x", firstCorrect: true, secondAnswer: "", repairCorrect: null, transferText: "t",
  transferScoring: "ungraded", skill: "grammar", completedAt,
});
const withAttempts = (attempts: MissionAttempt[], dueId?: string): LearnerState => ({
  ...blankState(), attempts,
  ...(dueId ? { cards: { [dueId]: { stage: 1, due: "2026-11-19", reviews: 1, failures: 1, lastCorrect: false, lastReviewed: "2026-11-18T10:00:00+02:00" } } } : {}),
});

describe("R06 cloze missions with interleaving of grammar forms (interleaving-grammar)", () => {
  // Two tasks of the same form; the second is due for review today, so R06 ranks it first.
  const [done, due] = exercises.filter(e => e.grammar_tag === "elatiivi");

  it("after a mission of one form the next mission is another form; the R06 top task only moves one place and says why", () => {
    expect(done && due).toBeTruthy();
    expect(recommend(withAttempts([], due!.id), NOW)[0]!.exercise.id).toBe(due!.id);              // R06 alone: the due task first
    const r = recommend(withAttempts([attempt(done!.id, "elatiivi", "2026-11-19T11:50:00+02:00")], due!.id), NOW);
    expect(r[0]!.exercise.grammar_tag).not.toBe("elatiivi");
    expect(r[0]!.why[0]).toBe(INTERLEAVED_WHY);
    expect(r[1]!.exercise.id).toBe(due!.id);                                   // the R06 choice comes right after
    expect(r[1]!.why).not.toContain(INTERLEAVED_WHY);
    expect(r.map(o => o.exercise.id)).not.toContain(done!.id);                // practised today: spacing still holds
  });

  it("a mission finished on an earlier day does not reorder anything: a new day starts with the plain R06 order", () => {
    const r = recommend(withAttempts([attempt(done!.id, "elatiivi", "2026-11-18T20:00:00+02:00")], due!.id), NOW);
    expect(r[0]!.exercise.id).toBe(due!.id);
    expect(r.some(o => o.why.includes(INTERLEAVED_WHY))).toBe(false);
  });

  it("no two neighbouring suggestions are the same form while another form is left", () => {
    const r = recommend(blankState(), NOW);
    const tags = r.map(o => o.exercise.grammar_tag ?? o.exercise.id);
    const blocks = tags.filter((t, i) => i > 0 && t === tags[i - 1]).length;
    const counts = new Map<string, number>();
    for (const t of tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    const most = Math.max(...counts.values());
    expect(blocks).toBeLessThanOrEqual(Math.max(0, most - (tags.length - most) - 1));   // only an unavoidable tail
  });
});
