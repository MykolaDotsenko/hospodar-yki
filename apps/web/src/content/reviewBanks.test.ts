import { describe, expect, it } from "vitest";
import { EXAM_ITEM_IDS, EXAM_ONLY_FILES, reviewBanks, reviewUnitCount } from "./reviewBanks.ts";
import { exercises } from "./cloze.ts";
import { practiceCards } from "./practice.ts";
import { dialogues } from "./dialogues.ts";
import { readingItems } from "./reading.ts";
import { clinicItems } from "./writingClinic.ts";
import { listeningLessons } from "./listening.ts";
import { r08Drafts } from "./r08.ts";
import { REVIEW_SANDBOX_PREFIX } from "../storage/reviewSandbox.ts";
import { WEB_DB_NAME } from "../storage/learnerRepository.ts";

const sources = import.meta.glob(["./*.ts", "!./*.test.ts", "!./reviewBanks.ts"], { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const units = reviewBanks.flatMap(b => b.units.map(u => ({ bank: b, u })));

describe("S2 reviewer workspace banks (docs/29 stage 1, QL-01)", () => {
  it("every content file a LEARN screen loads is reviewable here, except EXAM-only files", () => {
    const loaded = new Set<string>();
    for (const src of Object.values(sources)) {
      for (const m of src.matchAll(/["'](?:\.\.\/)+((?:learning\/exercises|knowledge\/dictionaries)\/[^"'*]+\.json)["']/g)) loaded.add(m[1]!);
      for (const m of src.matchAll(/["'](?:\.\.\/)+((?:learning\/exercises|knowledge\/dictionaries)\/[^"']*)\*\.json["']/g)) loaded.add(m[1]! + "*");
    }
    expect(loaded.size).toBeGreaterThan(15);
    const files = new Set(units.map(x => x.u.file));
    for (const f of loaded) {
      if (EXAM_ONLY_FILES.includes(f)) continue;
      const covered = f.endsWith("*") ? [...files].some(x => x.startsWith(f.slice(0, -1))) : files.has(f);
      expect(covered, f).toBe(true);
    }
  });
  it("no EXAM item is ever listed (EXAM-11): exam forms are reviewed in their own sealed process", () => {
    expect(EXAM_ITEM_IDS.size).toBeGreaterThan(0);
    for (const { u } of units) expect(EXAM_ITEM_IDS.has(u.id), u.id).toBe(false);
    for (const { u } of units) expect(EXAM_ONLY_FILES).not.toContain(u.file);
    expect(reviewBanks.reduce((n, b) => n + b.heldOutForExam, 0)).toBeGreaterThan(0);          // the filter is doing real work
  });
  it("every unit has an id that is unique in its file, a readable label and a known content folder", () => {
    const seen = new Set<string>();
    for (const { u } of units) {
      expect(u.id, u.file).toBeTruthy();
      expect(u.label.length, u.id).toBeGreaterThan(1);
      expect(u.file).toMatch(/^(learning\/exercises|knowledge\/dictionaries)\/[\w./-]+\.json$/);
      expect(seen.has(`${u.file}#${u.id}`), `${u.file}#${u.id}`).toBe(false);
      seen.add(`${u.file}#${u.id}`);
    }
    expect(reviewUnitCount).toBe(units.length);
    expect(reviewUnitCount).toBeGreaterThan(400);
  });
  it("a per-item walk opens that very item on the learner screen", () => {
    const pools: Record<string, Set<string>> = {
      mission: new Set(exercises.map(e => e.id)), practice: new Set(practiceCards.map(c => c.id)), dialogue: new Set(dialogues.map(d => d.id)),
      reading: new Set(readingItems.map(i => i.id)), writing: new Set(clinicItems.map(i => i.id)), listening: new Set(listeningLessons.map(l => l.id)),
      r08: new Set(r08Drafts.map(t => t.id)),
    };
    for (const b of reviewBanks.filter(x => x.walk?.perItem)) {
      for (const u of b.units) expect(pools[b.walk!.screen]?.has(u.id), `${b.id}:${u.id}`).toBe(true);
    }
  });
  it("audio banks ask for the transcript check; the sandbox can never be the learner database", () => {
    expect(reviewBanks.filter(b => b.audio).map(b => b.id)).toEqual(expect.arrayContaining(["listening", "story", "librivox"]));
    expect(WEB_DB_NAME.startsWith(REVIEW_SANDBOX_PREFIX)).toBe(false);
    expect(REVIEW_SANDBOX_PREFIX.startsWith(WEB_DB_NAME)).toBe(false);
  });
});
