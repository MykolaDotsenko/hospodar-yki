# Content and research architecture — Hospodar YKI

**Decision:** 22.10.2026 · **Status:** adopted *repository organization*, not an application migration. **Rule:** separate learning assets, link-only sources, executable exercises, vocabularies, evidence/research, product specs, and production code; keep existing runtime paths stable until consumers are migrated and tests prove parity.

## Navigation, owners and status

| What | Discovery entrypoint | Current canonical files | Future output |
| --- | --- | --- | --- |
| Image files, illustrations, sprites, brand logos | [assets/images](../assets/images/README.md) | `brand/logo/*.svg` (three real SVGs), no verified learning illustration bank yet | `apps/web/src/assets/` imported assets, or `public/` when stable filenames are required; Phaser game pack |
| Audio / transcripts / captions | [assets/audio](../assets/audio/README.md) | `audio/`, `assets/audio/library.json`, `assets/audio/available.json` | rights-checked bundles/streaming or PAD packs |
| Videos and subtitles | [assets/video](../assets/video/README.md) | `video/open/*.webm`, `assets/video/open/available.json` | licensed streaming/Web, Play install-time pack |
| YouTube URLs, chapters | [sources/youtube](../sources/youtube/README.md) | `sources/youtube/youtube-catalog.json` | **link-only** YouTube watch/embed; **never** copy streams into offline media |
| Other external providers / official examples | [sources](../sources/README.md) | `video/publisher-*.json`, `sources/official/yki-mock-simulation-sources.json`, `research/yki/yki-content-sources-2026-10.json` | link-only until explicit redistribution permission |
| Finnish vocabulary, chunks, frequency | [knowledge/dictionaries](FOLDER-STRUCTURE.md) | `content/b1/lexicon/`, `knowledge/dictionaries/b1/rektio-v1.json` | stable lemma/chunk IDs and learner evidence |
| Exercises, lessons, dialogues, rubrics | [learning/exercises](../learning/exercises/README.md) | `content/b1/`, `learning/exercises/video/exercises.json` | validated item schemas, versions, 4 skill paths |
| Teaching methods, science and books | [research/pedagogy](../research/pedagogy/README.md) | `research/learning-*.json`, `docs/04…`, `docs/08…` | prioritized experiments, not fabricated effectiveness |
| Visual design / color theory | [research/design](../research/design/README.md) | `research/color-*.json`, `docs/16…`, `brand/` | design tokens / hypotheses |
| UX/accessibility/interactions | [research/ux](../research/ux/README.md) | `research/ux/interactive-visual-learning-v1.json`, `docs/18…` | a11y, journeys, usability tasks |
| Game mechanics / NPC / transfer | [research/gameplay](../research/gameplay/README.md) | `docs/23…`, `research/user-cases/product-session-modes-v1.json` | design/test hypotheses, no claimed Phaser implementation |
| User cases, journeys and acceptance | [research/user-cases](../research/user-cases/README.md) | `docs/11…`, `docs/15…`, `docs/21…` | Gherkin/acceptance fixtures after implementation |
| Research and architectural evidence generally | [research](../research/README.md) | `research/*.json`, `docs/01…27` | no unnecessary re-copying |
| Third-party PDF books / sources | [knowledge](../knowledge/README.md) | `content/third-party/` | protected original files; no unlicensed redistribution |

The **machine-readable ownership map** is [docs/FOLDER-STRUCTURE.md](FOLDER-STRUCTURE.md). It records pointers, not duplicate copies of media/learning objects. [catalog/README](FOLDER-STRUCTURE.md) explains provenance statuses and versioning. `docs/FOLDER-STRUCTURE.md` is a **point-in-time Git blob inventory** for existing binaries; it is not a redistribution license or automatically updated release manifest.

## Why existing binary/content files stay in place

Paths like `audio/long/b1/…`, `video/open/…` and `content/b1/themes/…` are already used by working Web pages, JSON manifests, Python import/validation scripts and GitHub workflows. Moving only directory names without updating **every** consumer would break features and licensing attribution. Therefore this PR creates canonical **logical ownership, indexes, schema/CI, and migration gates first**, without duplicating or relocating those binaries. New resources go through registered owners; a physical migration requires a separate atomic PR proving all references/CI, old exports and offline formats.

**Path distinction:** authoring repository path is not necessarily a browser URL, Vite import, or Android PAD physical path. A future build manifest must map stable `mediaId+version+hash` to delivery-specific URLs/pack identifiers. Never write absolute environment paths into lessons.

## Metadata contract and licensing

A new or changed resource record MUST have: stable opaque `id`, `kind`, `status`, title/locale, `source` and `rights` (copyright holder, license/SPDX or explicit unknown and review state), version/hash when bundled, accessibility information (transcript/captions/alt when pertinent), human pedagogical review, and delivery eligibility. [JSON Schema](FOLDER-STRUCTURE.md) defines the draft contract; `target_only` means it is **not** enforced over all legacy curricula today.

**Licensing rule:** `link_only`, `unknown` and `review_required` MUST NOT enter a distributable asset bundle. CC attribution and derivatives/ND restrictions must be preserved. Do not assume GitHub-public means licensed. YouTube catalog is a URL index, not downloadable audio/video; follow YouTube API Services Policies. For file-level license attribution consider SPDX+REUSE (including `.license` sidecars for binaries) after auditing all actual rights; **do not assign generic licenses to legacy binaries by assumption**.

## Stable identifiers and quality gates

- Stable IDs independently of file location; versioned schemas and content hash for learner attempts. Content refactor may change paths, never silently change learning IDs.
- One original **source of truth per asset/item**; manifests link to files; no duplicated content payloads in `catalog/`.
- Audio/video: record original author, exact version/source URL, license, source/derived, language, codecs, media length, SHA-256, transcript/VTT, consent/rights. Existing catalog fields may be incomplete; never label unknown as verified.
- Vocabulary: lemma, surface form, POS as needed, case/government, chunk, Finnish example, translation, source ID, review/evidence, A2/B1 level; don't overwrite historical learner first attempt.
- Exercises: 4 skills, type, purpose, difficulty/CEFR estimate, learning objective, keys or ungraded rubric, item/version/source, prompt/answer separation and explicit S2 review.
- Research: evidence source, URL/DOI, date, study population, limitations, method, outcome and decision linkage. Separate empirical evidence from subjective scores and gameplay/design hypotheses.
- UX: scenario and persona/use case, a11y criteria, success signal, test protocol, participant ethics. No invented usability-study results.
- External sources: URLs only; no assumption of current availability, embed right, official YKI status or downloaded copy.

## Incremental migration protocol

1. Audit producer + every consumer with text search/tests, record baseline Git SHA and existing IDs.
2. Add new manifest/resource schema and compatibility resolution, with unit tests for both old/new paths.
3. Move files in **one PR** with scripted reference replacements and updated CI workflows; preserve release/import paths until parity.
4. Run content validators, Node browser checks, actual Chromium IDB where affected, media rights checks, doc/manifest checks. For Android pack paths run real Gradle/Play tests **when Android exists**.
5. Only then deprecate legacy paths; document archive mapping, no blind duplicates. A Git file move does not erase past commits or retroactively shrink history.

## External source references

- [GitHub repository limits](https://docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits), [Git LFS](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage).
- [Vite static assets/public](https://vite.dev/guide/assets.html) (target React/Vite, **not** present vanilla JS app).
- [Android Play Asset Delivery](https://developer.android.com/guide/playcore/asset-delivery).
- [REUSE Specification 3.3](https://reuse.software/spec/) and [W3C informative/decorative image alternatives](https://www.w3.org/WAI/tutorials/images/).
- [1EdTech QTI v3](https://www.1edtech.org/standards/qti) provides **future interoperability inspiration**, not current QTI conformance.
- [YouTube API Services Policies](https://developers.google.com/youtube/terms/developer-policies).

**Read next:** [AGENTS](../AGENTS.md) → [catalog](FOLDER-STRUCTURE.md) → source/collection README → [content authoring](../learning/CONTRIBUTING.md) or [research method](../research/README.md).
