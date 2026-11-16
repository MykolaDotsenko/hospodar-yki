/**
 * One set of media rules on every screen with audio or video (docs/29 stage 3; packages/domain/src/mediaRules.ts).
 * Static: every <audio>, <video> and <TaskAudio> in the source is registered here with its media context and the
 * E2E test (e2e/media-rules.spec.ts) that checks it rendered. A new media element fails this test until it is
 * registered and covered — so no screen can quietly bring back autoplay, a browser speed menu or an unrecorded aid.
 */
import { describe, expect, it } from "vitest";
import { MEDIA_CONTEXTS, type MediaContext } from "@hospodar/domain";
// @ts-expect-error vitest runs in Node; the browser tsconfig deliberately has no Node types
import { readdirSync, readFileSync, statSync } from "node:fs";

const SRC = new URL("./", import.meta.url);
const read = (f: string): string => readFileSync(new URL(f, SRC), "utf8");
function sources(dir = ""): string[] {
  return (readdirSync(new URL(dir || "./", SRC)) as string[]).flatMap(name => {
    const rel = `${dir}${name}`;
    if (statSync(new URL(rel, SRC)).isDirectory()) return name === "test" ? [] : sources(`${rel}/`);
    return /\.(tsx?|mjs|js)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [rel] : [];
  });
}
const files = sources();
/** Source without block comments and whole-line `//` comments (a comment that mentions <audio> is not a player). */
const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
/** Opening JSX/HTML tags, read up to the first `>` outside `{…}` (attributes may hold arrow functions). */
function tags(src: string, tag: string): string[] {
  const text = code(src), out: string[] = [];
  for (const m of text.matchAll(new RegExp(`<${tag}\\b`, "g"))) {
    let depth = 0, i = m.index! + m[0].length;
    for (; i < text.length; i++) {
      const ch = text[i];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      else if (ch === ">" && depth === 0) break;
    }
    out.push(text.slice(m.index!, i + 1));
  }
  return out;
}

const E2E = "media rules ·";
/** Every raw media element in the app, with its context and why it is not the shared task player. */
const RAW: { file: string; tag: "audio" | "video"; context: MediaContext; e2e: string; why: string }[] = [
  { file: "ui/TaskAudio.tsx", tag: "audio", context: "learn-task", e2e: `${E2E} LEARN listening`, why: "the shared task player itself" },
  { file: "screens/DictoglossRun.tsx", tag: "audio", context: "learn-task", e2e: `${E2E} dictogloss`, why: "no controls; one segment, started only by the learner's button, at most twice" },
  { file: "screens/MediaScreen.tsx", tag: "video", context: "library", e2e: `${E2E} media library`, why: "watching outside a task" },
  { file: "screens/MediaScreen.tsx", tag: "audio", context: "library", e2e: `${E2E} media library`, why: "listening outside a task" },
  { file: "screens/DiagnosticScreen.tsx", tag: "audio", context: "own-recording", e2e: "", why: "the learner's own voice, played back on request" },
  { file: "screens/ExamVoice.tsx", tag: "audio", context: "own-recording", e2e: "", why: "the learner's own exam answer, played back on request" },
  { file: "screens/ExamScreen.tsx", tag: "audio", context: "own-recording", e2e: "", why: "the learner's own exam answer in the summary" },
];
/** Every task stimulus goes through <TaskAudio>, with these contexts. */
const TASK_PLAYERS: { file: string; contexts: MediaContext[]; e2e: string; count?: number }[] = [
  { file: "screens/ListeningScreen.tsx", contexts: ["learn-task", "learn-after"], e2e: `${E2E} LEARN listening` },
  { file: "screens/SkillChecks.tsx", contexts: ["learn-task"], e2e: `${E2E} delayed listening check` },
  // two exam players: the native one (unlimited plays, pause/seek allowed) and the counted one with no controls
  { file: "screens/ExamScreen.tsx", contexts: ["exam"], e2e: `${E2E} EXAM listening`, count: 2 },
];
/** Where code may call .play(): only inside a handler of the learner's own button. */
const PLAY_CALLS: Record<string, RegExp> = {
  "screens/DictoglossRun.tsx": /function play\(\)[\s\S]*?a\.play\(\)/,
  "screens/ExamScreen.tsx": /const start = \(\) => \{[\s\S]*?onPlayed\(\);[\s\S]*?a\.play\(\)/,
};

describe("media rules on every screen with audio or video (docs/29 stage 3)", () => {
  it("media rules: every <audio>/<video> is registered with its context and an E2E check; task recordings use the one task player", () => {
    const e2e = read("../e2e/media-rules.spec.ts");
    for (const kind of ["audio", "video"] as const) {
      const found = Object.fromEntries(files.map(f => [f, tags(read(f), kind).length]).filter(([, n]) => (n as number) > 0));
      const registered: Record<string, number> = {};
      for (const r of RAW.filter(x => x.tag === kind)) registered[r.file] = (registered[r.file] ?? 0) + 1;
      expect(found, `unregistered <${kind}>: add it to RAW with its media context and an E2E check, or use <TaskAudio>`).toEqual(registered);
    }
    const players = Object.fromEntries(files.map(f => [f, tags(read(f), "TaskAudio").length]).filter(([, n]) => (n as number) > 0));
    expect(players).toEqual(Object.fromEntries(TASK_PLAYERS.map(p => [p.file, p.count ?? 1])));
    for (const p of TASK_PLAYERS) for (const t of tags(read(p.file), "TaskAudio")) {
      // The context may be computed (ListeningScreen's mediaContext), so its values are looked for in the file's code.
      expect(t, `${p.file}: the player names its context`).toMatch(/context=\{?/);
      for (const c of p.contexts) expect(code(read(p.file)), `${p.file} must use context "${c}"`).toContain(`"${c}"`);
      if (p.contexts.includes("learn-task")) expect(t, `${p.file}: a slower speed in a task is help`).toMatch(/onSlower=\{/);
    }
    for (const r of [...RAW, ...TASK_PLAYERS]) {
      if ("context" in r) expect(MEDIA_CONTEXTS).toContain(r.context);
      if (r.e2e) expect(e2e, `E2E for ${r.file}`).toContain(`test("${r.e2e}`);
    }
  });

  it("media rules: nothing autoplays or is played by code without the learner; the task player hides the browser speed menu", () => {
    for (const f of files) {
      const src = read(f);
      expect(/\bautoPlay\b|\bautoplay\b/.test(code(src)), `${f}: autoplay`).toBe(false);
      // .play() only where a learner's button starts it: one dictogloss segment, or a counted exam play
      if (/\.play\(/.test(code(src))) { expect(Object.keys(PLAY_CALLS)).toContain(f); expect(src).toMatch(PLAY_CALLS[f]!); }
    }
    expect(read("screens/DictoglossRun.tsx")).toMatch(/onClick=\{play\}/);
    expect(read("screens/ExamScreen.tsx")).toMatch(/onClick=\{start\}/);
    expect(tags(read("screens/ExamScreen.tsx"), "TaskAudio").filter(t => /\bbare\b/.test(t))).toHaveLength(1);
    const player = tags(read("ui/TaskAudio.tsx"), "audio")[0]!;
    expect(player).toContain('preload="none"');
    expect(read("ui/TaskAudio.tsx")).toContain('"nodownload noplaybackrate"');
    expect(read("ui/TaskAudio.tsx")).toMatch(/onRateChange=\{/);
    for (const r of RAW.filter(x => x.context === "library")) for (const t of tags(read(r.file), r.tag)) expect(t).toContain('preload="none"');
  });
});
