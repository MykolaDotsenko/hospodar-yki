# Finnish B1 speech video library — Hospodar YKI

**Stage:** Licensed sources reviewed 2026-10-21. Binary import uses GitHub Actions; the **only evidence that a video was actually downloaded and committed** is a `.webm` file plus `open/available.json` with `state=verified_binary`, nonzero bytes and SHA-256. A metadata entry alone is **not** a downloaded video.

### YouTube — link-only curated material (NEW 2026-10-21)

**[14 directly verified-by-metadata watch URLs, 35 teacher-description chapter markers](youtube-catalog.json)** · **[Human-readable selection and future player UX spec (YTP-01…14)](YOUTUBE-LEARNING-CATALOG.md)** · **[Static validator](../scripts/validate_youtube_video_catalog.py)**.

YouTube content is **NOT downloaded or copied** into this repository. Catalog entries store `youtube_video_id`, `watch_url`, creator/title, estimated level, skill, topic, why it helps, original pending-review exercise seeds, and study chapters. Playback/embedding, language quality and subtitles **are not yet verified**. Future player uses only official embed/IFrame API (when allowed), otherwise opens source in YouTube. No third-party audio extraction; creator branding/ads/player controls remain intact. The video lessons are **learn-only**, not unseen exam tasks.

### The first three candidates

| ID | Speaker/content | Length | Est. level | Source / licence | Value |
|---|---|---:|---|---|---|
| `jenni-puhekieli` | [Wikitongues Jenni](https://commons.wikimedia.org/wiki/File:WIKITONGUES-_Jenni_speaking_Finnish.webm): life abroad, conversational differences, spontaneous colloquial Finnish | 3:11 | B1+ | Wikitongues, [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | puhekieli, gist + details; full unreviewed Finnish transcript is on Commons source |
| `kinola-helsinki` | [Elokuvateatteri Kinola](https://commons.wikimedia.org/wiki/File:Elokuvateatteri_Kinola.webm): Finnish narration about former Helsinki cinema | 1:35 | B1+ | Aprom, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | place / history, narration; photo credits/source included at Commons |
| `claes-esittely` | [Claes Andersson (fi)](https://commons.wikimedia.org/wiki/File:Claes_Andersson_fi.webm): self-introduction and professional experience | 1:17 | B1 | Holger Motzkau, [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) | self-presentation, work; source describes subtitles, independently unverified |

**Licensing and provenance:** Credit the named authors, link to the original Commons file and exact licence, say the 360p WebM is a Wikimedia transcode. For adapted/remixed derivative works licensed BY-SA, respect ShareAlike distribution requirements. Do not treat an apparent Commons license as permission to copy third-party *unrelated* video/audio/subtitle components. Do not present videos as official OPH/YKI content. All content level ratings are editor estimates; `teacher_review=pending`.

**Multimedia constraints:** These are genuine one-person native speech video clips, **not** modern two-person B1 YKI dialogues. They supplement, not replace, the planned native multi-speaker interview/dialogue corpus. No unverified `transcript.fi.txt`, fabricated SRT/VTT, copied YouTube-only recordings, or invented correct answer keys are committed.

### Layout

- `catalog.json`: intended media titles, original source, license, author, intended training use; no assertion that the asset is present.
- `open/*.webm`: **actual downloaded** lower-resolution Commons VP9/Opus transcoded source (if successful).
- `open/available.json`: importer-generated audit with playback codec, duration, bytes, SHA-256, error status.
- `exercises.json`: original draft comprehension prompts with `teacher_review=pending`, no graded keys before manual S2 verification.
- `../scripts/import_open_finnish_videos.py`: restricted allowlist downloader and media quality gate.
- `../.github/workflows/import-open-finnish-videos.yml`: CI downloads compact 360p sources, commits only validated video binary outputs; never writes learner data.

Run locally from repository root: `python3 scripts/import_open_finnish_videos.py` with `ffprobe` installed and network access. This script **does not modify** `app/**` or official exam item banks. Manually inspect source and verify rights before adding any future titles.

**Frontend lesson policy:** A natural first hearing without transcripts/embedded text when possible → question on gist → details → only then optional transcript/captions verified by S2 → different audio-only unseen transfer. If subtitles are hardcoded, note that listening-only assessment is compromised; use as learning scaffold, not the holdout.
