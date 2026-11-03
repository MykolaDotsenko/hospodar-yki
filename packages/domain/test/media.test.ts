import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { admitExternalLink, admitMedia, admitVideo, normaliseLicence, shuffleOptions, type ExternalLink, type MediaEntry } from "../src/index.ts";

const root = new URL("../../../", import.meta.url);
const json = (p: string) => JSON.parse(readFileSync(new URL(p, root), "utf8"));
const audio: MediaEntry[] = json("assets/audio/available.json").items;
const video: (MediaEntry & { sha256: string })[] = json("assets/video/open/available.json").assets;
const pictures: (MediaEntry & { sha256: string })[] = json("assets/images/pictures/available.json").assets;
const illustrations: MediaEntry[] = json("assets/images/illustrations/library.json").items;
const librivox: (MediaEntry & { sha256: string })[] = json("learning/exercises/b1/audio-training/librivox-human.json").items;
const story = json("learning/exercises/b1/audio-long/human-stories.json").items[0];
const links: ExternalLink[] = json("sources/youtube/youtube-catalog.json").items;
const sha = (p: string) => createHash("sha256").update(readFileSync(new URL(p, root))).digest("hex");

describe("media rights gate (AGENTS media rule)", () => {
  it("every repo media entry used by apps/web is admitted, exists on disk, and hashes match where recorded", () => {
    const all = [...audio, ...video, ...pictures, ...illustrations, ...librivox, { ...story, path: story.audio_path }];
    expect(all).toHaveLength(26 + 3 + 8 + 6 + 15 + 1);
    for (const e of all) {
      expect(admitMedia(e), e.id).toMatchObject({ ok: true });
      expect(existsSync(new URL(e.path, root)), e.path).toBe(true);
    }
    for (const e of [...video, ...pictures, ...librivox, { ...story, path: story.audio_path }]) expect(sha(e.path), e.path).toBe(e.sha256);
  });
  it("refuses NC/ND, unknown licences, missing credit/source and unsafe paths", () => {
    const ok = pictures[0]!;
    expect(admitMedia({ ...ok, license: "CC BY-NC 4.0" })).toMatchObject({ ok: false });
    expect(admitMedia({ ...ok, license: "CC BY-ND 4.0" })).toMatchObject({ ok: false });
    expect(admitMedia({ ...ok, license: "youtube_link_only" })).toMatchObject({ ok: false });
    expect(admitMedia({ ...ok, author: "" })).toMatchObject({ ok: false, reason: "no author/creator" });
    expect(admitMedia({ ...ok, source_url: "http://example.org" })).toMatchObject({ ok: false });
    expect(admitMedia({ ...ok, path: "assets/../secret.jpg" })).toMatchObject({ ok: false });
    expect(admitMedia({ ...illustrations[0]!, source_page: undefined })).toMatchObject({ ok: true, source: null });
    expect(["CC-BY-SA-3.0", "CC BY-SA 3.0", "cc-by-4.0"].map(normaliseLicence)).toEqual(["CC BY-SA 3.0", "CC BY-SA 3.0", "CC BY 4.0"]);
  });
  it("A11Y-03: a video is admitted only with a reviewed WebVTT caption file; the 3 open videos have none", () => {
    for (const v of video) expect(admitVideo(v, (v as { captions_path?: string }).captions_path)).toMatchObject({ ok: false, reason: expect.stringContaining("WCAG 1.2.2") });
    expect(admitVideo(video[0]!, "assets/video/open/jenni-puhekieli.fi.vtt")).toMatchObject({ ok: true });
    expect(admitVideo(video[0]!, "assets/video/../x.vtt")).toMatchObject({ ok: false });
    expect(admitVideo(video[0]!, "assets/video/open/x.srt")).toMatchObject({ ok: false });
    expect(admitVideo({ ...video[0]!, license: "CC BY-NC 4.0" }, "assets/video/open/x.vtt")).toMatchObject({ ok: false, reason: expect.stringContaining("licence") });
  });
  it("external links are link-only cards; non-allow-listed hosts and local copies are refused", () => {
    const admitted = links.filter(l => admitExternalLink(l).ok);
    expect(admitted.length).toBeGreaterThan(0);
    expect(admitted.every(l => l.transcript_locally_stored !== true && l.official_yki_material !== true)).toBe(true);
    const y = links[0]!;
    expect(admitExternalLink({ ...y, watch_url: "https://evil.example/watch?v=1" })).toMatchObject({ ok: false });
    expect(admitExternalLink({ ...y, watch_url: "http://www.youtube.com/watch?v=1" })).toMatchObject({ ok: false });
    expect(admitExternalLink({ ...y, transcript_locally_stored: true })).toMatchObject({ ok: false });
  });
  it("shuffleOptions is deterministic, keeps the key, and breaks the all-first-option pattern of the human story", () => {
    const qs = story.questions as { options_fi: string[]; correct_index: number }[];
    expect(qs.every(q => q.correct_index === 0)).toBe(true);
    const out = qs.map((q, i) => shuffleOptions(`${story.id}-q${i + 1}`, q.options_fi, q.correct_index));
    out.forEach((o, i) => expect(o.options[o.correct_index]).toBe(qs[i]!.options_fi[0]));
    expect(new Set(out.map(o => o.correct_index)).size).toBeGreaterThan(1);
    expect(shuffleOptions("x", ["a", "b", "c"], 2)).toEqual(shuffleOptions("x", ["a", "b", "c"], 2));
  });
});
