import { afterEach, describe, expect, it, vi } from "vitest";
import { isPublishedItem } from "@hospodar/domain";
import { reviewBanks } from "./reviewBanks.ts";

/**
 * Release mode (docs/29 stage 1, code queue 2): a release build gives learners only S2-published items. Every pool a
 * learner screen draws from is loaded once as a release build and once as the beta build used today.
 */
const rawById = new Map<string, unknown>(reviewBanks.flatMap(b => b.units.map(u => [u.id, u.item] as const)));
afterEach(() => { vi.unstubAllEnvs(); vi.doUnmock("../../../../learning/exercises/b1/grammar/contextual-cloze.json"); vi.resetModules(); });

async function pools(channel: "beta" | "release") {
  vi.resetModules();
  vi.stubEnv("VITE_HOSPODAR_CHANNEL", channel);
  const [cloze, practice, dialogues, reading, clinic, listening, pictures, transfer, retention, media, diagnostic, exam, r08, release] = await Promise.all([
    import("./cloze.ts"), import("./practice.ts"), import("./dialogues.ts"), import("./reading.ts"), import("./writingClinic.ts"),
    import("./listening.ts"), import("./pictureMissions.ts"), import("./transfer.ts"), import("./skillRetention.ts"), import("./media.ts"),
    import("./diagnostic.ts"), import("./exam.ts"), import("./r08.ts"), import("./release.ts")]);
  const b = retention.skillRetentionBank;
  return {
    channel: release.CHANNEL,
    entries: {
      cloze: cloze.exercises.map(e => e.id), practice: practice.practiceCards.map(c => c.id), dialogues: dialogues.dialogues.map(d => d.id),
      reading: reading.readingItems.map(i => i.id), writing: clinic.clinicItems.map(i => i.id), listening: listening.listeningLessons.map(l => l.id),
      allListening: listening.allListeningLessons.map(l => l.id), pictures: pictures.pictureMissions.map(m => m.lesson.lesson_id),
      transfer: transfer.transferBank.items.map(i => i.task_id), skillChecks: [...b.reading, ...b.listening, ...b.writing, ...b.speaking].map(i => i.id),
      librivox: media.librivoxWorks.flatMap(w => w.narrators.flatMap(n => n.parts.map(p => p.id))), r08: r08.learnerR08Tasks.map(t => t.id),
    } as Record<string, string[]>,
    negotiation: dialogues.dialogues.filter(d => d.negotiation).length,
    diagnostic: diagnostic.diagnosticAvailable, examForms: exam.examBlueprints.map(f => f.id), skillChecksAvailable: retention.skillChecksAvailable,
  };
}

describe("release mode: learners get only S2-published content", () => {
  it("in a release build no pool holds an unpublished item (today nothing is published, so every pool is empty)", async () => {
    const p = await pools("release");
    expect(p.channel).toBe("release");
    for (const [pool, ids] of Object.entries(p.entries)) {
      for (const id of ids) expect(isPublishedItem(rawById.get(id)), `${pool}: ${id} is not published`).toBe(true);
    }
    expect(Object.values(p.entries).flat()).toEqual([]);
    expect(p.negotiation).toBe(0);
    expect(p.diagnostic).toBe(false);
    expect(p.examForms).toEqual([]);
    expect(p.skillChecksAvailable).toBe(false);
  });
  it("the beta build keeps every draft, so the empty release pools come from the filter, not from missing content", async () => {
    const p = await pools("beta");
    expect(p.channel).toBe("beta");
    for (const [pool, ids] of Object.entries(p.entries)) if (pool !== "r08") expect(ids.length, pool).toBeGreaterThan(0);
    expect(p.entries.r08).toEqual([]);                                   // R08 is published-only in every build
    expect(p.diagnostic && p.examForms.length > 0 && p.skillChecksAvailable && p.negotiation > 0).toBe(true);
  });
  it("a published item does reach the release pool, and the draft next to it does not", async () => {
    const card = (status: string) => ({ schema: "hospodar-review-card-v1", status });
    const base = { prompt_fi: "Asun ___ (Helsinki).", answer_fi: "Helsingissä", explanation_uk: "Місце: -ssa.", transfer_task_fi: "Missä sinä asut?" };
    vi.doMock("../../../../learning/exercises/b1/grammar/contextual-cloze.json", () => ({ default: { exercises: [
      { ...base, id: "pub-1", review_card: card("published") }, { ...base, id: "rev-1", review_card: card("s2_reviewed") }, { ...base, id: "draft-1" },
    ] } }));
    vi.resetModules();
    vi.stubEnv("VITE_HOSPODAR_CHANNEL", "release");
    expect((await import("./cloze.ts")).exercises.map(e => e.id)).toEqual(["pub-1"]);
  });
});
