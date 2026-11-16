import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { addDiagnostic, blankState, buildSkillRetentionBank, MEDIA_CONTEXTS, mediaRules, NORMAL_RATE, rateVerdict, recordSkillCheck,
  skillCheckReducer, skillCheckReveal, skillCheckView, skillRetentionQueue, startSkillCheck, SUPPORT_RATE, SkillCheckError,
  type LearnerState, type SkillCheckItem, type SkillRetentionBank } from "../src/index.ts";

const root = new URL("../../../", import.meta.url);
const read = (p: string) => JSON.parse(readFileSync(new URL(p, root), "utf8"));

describe("one set of media rules (docs/29 stage 3; R7-05, R7-03, UIO-10)", () => {
  it("media rules: nothing autoplays anywhere; in a LEARN task a slower speed is help, in EXAM the speed is locked at 1×", () => {
    for (const c of MEDIA_CONTEXTS) expect(mediaRules(c).autoplay).toBe(false);
    expect(mediaRules("learn-task")).toMatchObject({ textBeforeAnswer: "support", slowerIsSupport: true, rateLocked: false, nativeSpeedMenu: false });
    expect(mediaRules("exam")).toMatchObject({ textBeforeAnswer: "never", slowerIsSupport: false, rateLocked: true, nativeSpeedMenu: false });
    expect(mediaRules("learn-after").nativeSpeedMenu).toBe(false);                     // our own speed buttons, not the browser's
    expect(mediaRules("library").nativeSpeedMenu).toBe(true);
    expect(() => mediaRules("anything" as never)).toThrow(TypeError);

    // LEARN task: slower before the help is recorded → "support" (record first, then slow); after → kept; faster is not help
    expect(rateVerdict("learn-task", SUPPORT_RATE)).toBe("support");
    expect(rateVerdict("learn-task", 0.5)).toBe("support");
    expect(rateVerdict("learn-task", SUPPORT_RATE, true)).toBe("ok");
    expect(rateVerdict("learn-task", NORMAL_RATE)).toBe("ok");
    expect(rateVerdict("learn-task", 1.5)).toBe("ok");
    // EXAM: any change goes back to 1×; nonsense rates are reset everywhere
    expect(rateVerdict("exam", SUPPORT_RATE)).toBe("reset");
    expect(rateVerdict("exam", 2)).toBe("reset");
    expect(rateVerdict("exam", NORMAL_RATE)).toBe("ok");
    for (const c of MEDIA_CONTEXTS) for (const bad of [0, -1, NaN, Infinity]) expect(rateVerdict(c, bad)).toBe("reset");
    expect(rateVerdict("library", 0.5)).toBe("ok");
    expect(rateVerdict("learn-after", 0.5)).toBe("ok");
  });
});

/* The delayed listening check follows the same rule as the listening mission. */
const themes = readdirSync(new URL("learning/exercises/b1/themes/", root)).filter(f => f.endsWith(".json")).map(f => read(`learning/exercises/b1/themes/${f}`));
const bank: SkillRetentionBank = buildSkillRetentionBank({
  version: "test", inference: read("learning/exercises/b1/high-yield/reading-inference-bank.json").items,
  themeTasks: themes.flatMap(t => [...t.writing, ...t.speaking]),
  writingIds: ["02-koti-ja-asuminen-writing-02", "03-kaupat-ja-palvelut-writing-01", "06-terveys-ja-hyvinvointi-writing-02"],
  speakingIds: ["02-koti-ja-asuminen-speaking-01", "05-matkustaminen-speaking-01", "08-ymparisto-speaking-02"],
  listening: read("learning/exercises/b1/audio-long/lessons.json").lessons,
  examItemIds: read("learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json").blueprints
    .flatMap((b: { skill_blocks: { item_id: string }[] }) => b.skill_blocks.map(s => s.item_id)),
});
const at = (s: string) => new Date(s);
const D0 = "2026-11-01T10:00:00+02:00", WHEN = "2026-11-08T12:00:00+02:00";
const listener = (): LearnerState => addDiagnostic(blankState(), { skill: "listening", taskId: "x-1", status: "scored", correct: true }, at(D0));

describe("delayed listening check: slower speed is help, like in the listening mission", () => {
  it("a slower speed makes the delayed listening check ungraded, shows no text and does not replace listening", () => {
    const s = listener();
    const check = skillRetentionQueue(s, bank, at(WHEN)).find(x => x.skill === "listening")!.due!.check as SkillCheckItem;
    if (check.kind !== "objective") throw new Error("expected an objective listening check");
    let ss = startSkillCheck("listening", 7, check);
    ss = skillCheckReducer(ss, check, { type: "SLOWER" });
    expect(ss).toMatchObject({ support: ["slow"], supported: true });
    expect(skillCheckReducer(ss, check, { type: "SLOWER" })).toBe(ss);                  // idempotent
    expect(skillCheckView(ss, check)).toMatchObject({ showTranscript: false, canAnswer: false, slower: true });
    const q0 = check.item.questions[0]!;
    expect(() => skillCheckReducer(ss, check, { type: "ANSWER", questionId: q0.id, value: "0" })).toThrow(SkillCheckError);   // still listen first
    ss = skillCheckReducer(ss, check, { type: "AUDIO_STARTED" });
    for (const q of check.item.questions)
      ss = skillCheckReducer(ss, check, { type: "ANSWER", questionId: q.id, value: q.type === "true_false" ? String(q.answer) : String(q.correct_index) });
    const next = recordSkillCheck(s, bank, ss, at(WHEN));
    const delayed = next.diagnostics.filter(d => d.taskId.startsWith("d7-"));
    expect(delayed.length).toBeGreaterThan(0);
    expect(delayed.every(d => d.status === "ungraded" && d.response.startsWith("[supported: slower] "))).toBe(true);   // all correct, still not scored
    expect(next.retention.at(-1)!.response).toContain("supported, ungraded");
    expect(skillCheckReveal(ss, check)).toMatchObject({ supported: true });

    // text + slower: both named; text alone keeps the earlier label
    let both = skillCheckReducer(skillCheckReducer(startSkillCheck("listening", 7, check), check, { type: "SHOW_TEXT" }), check, { type: "SLOWER" });
    expect(skillCheckView(both, check)).toMatchObject({ showTranscript: true, canAnswer: true });
    for (const q of check.item.questions) both = skillCheckReducer(both, check, { type: "ANSWER", questionId: q.id, value: "0" });
    expect(recordSkillCheck(s, bank, both, at(WHEN)).diagnostics.filter(d => d.taskId.startsWith("d7-"))
      .every(d => d.response.startsWith("[supported: text shown + slower] "))).toBe(true);
    // not for reading, writing or speaking
    const reading = { kind: "objective", item: bank.reading[0]! } as SkillCheckItem;
    expect(() => skillCheckReducer(startSkillCheck("reading", 7, reading), reading, { type: "SLOWER" })).toThrow(SkillCheckError);
  });
});
