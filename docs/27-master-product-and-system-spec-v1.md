# Hospodar YKI — Master Product & System Specification v1.0

**Status:** APPROVED TARGET SPECIFICATION; not proof of a finished product.  
**Baseline audited:** `main` at `b276e7f94fc830db0b835eef99079c4dbfa8622f` (22 October 2026).  
**Scope:** Finnish YKI `keskitaso` B1/B1+ preparation, evidence-based four-skill learning, official-source-informed **unofficial** digital exam rehearsal, and optional 2D story game, running in **a full-feature Web/PWA and Android application**. Android release has ~2–3 GB licensed/owned media preinstalled via Google Play Asset Delivery.  
**Priority:** correctness > recoverability > learning efficacy > honest official fidelity > accessibility > enjoyable gameplay > appearance > stack fashion.  
**Audience:** frontend, Kotlin/Android, QA, content editors, privacy/security, product design. Ukrainian is the interface default, Finnish is the authentic task language.

## 0. Reading order / source-of-truth hierarchy

1. **This document:** product scope, invariants, versioning and evidence status.
2. [28 — architecture & domain boundaries](28-reference-architecture-and-domain-boundaries.md): C4, modules, interfaces, lifecycle, deployment.
3. [29 — data/contract/media/exam protocol](29-cross-platform-protocols-and-data-contracts.md): wire formats, atomicity, privacy, platform adapters.
4. [30 — verification, operations and roll-out](30-quality-gates-release-and-migration.md): traceability, tests, CI, measured performance, disaster recovery.
5. **Existing authoritative domain sources:** [official audit](20-yki-official-complete-audit-2026-10.md), [verified exam simulator restrictions](21-digital-yki-exam-simulator-executable-spec.md), [two mode scopes](15-two-modes-skill-scopes.md), [learning science](19-learning-books-to-engineering-2026-10.md), [game/large media](23-android-offline-game-and-3gb-media-architecture.md).
6. Older ADR-022/023/024 retain decision history; **where they differ, this v1 + docs 28–30 clarify without silently rewriting history**. The specific correction `Web Dexie / Android Room` from ADR-024 remains binding.
7. Machine-readable [traceability registry](../research/cross-platform-architecture-requirements-v1.json) encodes testable requirements and real status.

**Vocabulary for claims:** `CURRENT_CODE` = found in current repository; `PARTIAL_PROTO` = reference/prototype without compiled release; `TARGET` = design only; `OFFICIAL_VERIFIED` = primary OPH/SOLKI with precise applicability; `UNKNOWN_OFFICIAL` = cannot assert. Each public feature/status UI must reflect this distinction.

## 1. Product definition and deliberately explicit non-goals

**One product, two first-class platforms, one domain.**

- **Learn mode:** all four YKI skills, independent recall, meaning-first feedback, optional form correction and self-repair, transfer task in a new context, spaced retrieval and user-confirmed unknown Finnish vocabulary/chunks, opt-in authentic voice practice, adaptive and user-directed curricula, progress with uncertainty.
- **Exam mode:** full or selected modules `reading/listening/writing/speaking`, **no coaching/hints/transcript/answer key until committed finish**, timing/controls only where digitally verified, fixed item/content version per session, recovery from crashes, independent per-skill outcomes, productive skills unrated until documented evaluation.
- **Story game:** optional Finnish-town/map, NPCs, social/real-life missions, choices, speaking/listening mini-games and animated encouragement. Render a fully accessible task-driven route without gaming scene. No XP/streak substitute for measured retained language skill.
- **Android:** release installable through Google Play AAB, with **every packaged, rights-cleared essential media asset** ready offline after complete Play installation. ~2–3 GB is a *download budget goal*, not a reason to add filler. AAB + split APK/PAD `install-time` packs is **not one side-loadable 3GB APK**.
- **Web/PWA:** same tasks, story, modes, pedagogy and core functionality; streamed HTTPS media; explicit *user-selected* offline packs, with quota/eviction transparency; opening URL never requires a 3GB cold download.
- **Optional cloud:** progress sync and consented AI assistance; loss of network, sign-out, AI provider outage or missing account **must not block core packaged learning**. Cloud may be unavailable offline and must say so in UI.
- **No official branding/certification:** product is NOT developed/endorsed by OPH nor a substitute for invigilated YKI. No automatic promise `YKI 3`, `B1 passed` or official-grade probability from a single mock.

**Non-goals for v1:** 3D open-world gaming, microservice fleet, required account, pay-to-win/compulsive gamification, automatically importing copyrighted YouTube/SOLKI assets, generative LLM running offline across all devices, cryptographically secure high-stakes exam from client-distributed answer keys, live OPH test question bank.

## 2. Functional capabilities and boundaries

### 2.1 Learn policy (`LEARN`)

The experience is evidence-based and user-steerable:

1. Choose `adaptive_mix` all four skills, `structured_all`, `single_skill`, or `custom_mix` of 2–3 skills; quick sessions 10/20/30 min as a preference not guarantee.
2. Run diagnostic tasks and show *skill-specific observations*, `insufficient_evidence` when sample is too small; no global fabricated B1 score.
3. Schedule recall of **confirmed** unknown items/chunks (not every encountered word). Keep pronunciation models and orthographic forms distinct.
4. First attempt is independent and immutable as an event. Showing a hint, key or auto-fill is recorded as `exposed`; later guided repair cannot overwrite initial performance.
5. Feedback chain: meaning/communicative success → one targeted form correction → user repair → different transfer context → future independent spaced test. Defer translation/transcript until appropriate first attempt; avoid learning-style pseudoscience.
6. Four-skill minimum: reading real texts and questions; listening authentic rights-cleared native Finnish speech with varied voices; writing practical messages/opinions; speaking record/respond and useful situational dialogues. **STT recognized text ≠ pronunciation, speaking proficiency or CEFR grade**.
7. Optional NPC wrapper turns a task into a believable Finnish need, but skipping animation must preserve task/result.

### 2.2 Exam policy (`EXAM`)

- `full_exam`: four independent skills; `single_subtest`: one selected skill; `practice_subset`: 2–3 clearly **unofficial**. `official_partial_profile` only when OPH date actually permits the selected subtests; this is a simulator, not booking/registration.
- An `ExamProfile` pins `profileId/profileVersion`, source claims, item family, content pack, timer/playback/navigation/UI policies. Unknown official 2027 details have **null**, and profile mode `PRACTICE_UNVERIFIED` must remain visible.
- Build a **unseen held-out assessment pool** distinct from learning; if the same item/version or full transcript has been exposed, flag invalid for unseen proficiency inference.
- `reading/listening`: objective keyed raw accuracy only for reviewed keyed items, **not** automatic conversion to official `taitotaso 3`. `speaking/writing`: `submitted_ungraded`, `pending_review`, or calibrated, transparently labelled formative feedback.
- No answer leak until `submitted`; exam engine cannot call learning hint renderer via accidental prop/state reuse.
- Android permission denial, dead mic, missing packet, storage full or media decoding error produces `blocked`/`not_assessable`, **never silent success**.
- `2011` normative or SOLKI demo paper timings/playback are evidence of *historical examples only*; do not republish as digitally verified OPH 2027 timings. OPH plans digital spring 2027 with a pilot in November 2026; later changes require source-backed amendment, not silent inference.

### 2.3 Game policy (`GAME`)

`GAME` is a **presentation/mission shell** around `LEARN`, not a competing scoring engine. React DOM must own text entry, instructions, accessibility and exam. Phaser draws scene/NPC/map/input, emits typed `QuestAction`, renders resulting projection; it has **no** direct access to repository, keys, AI SDK or SRS tables. No Phaser mounted during active exam. `skipScene`, `calmMode`, keyboard/touch and equivalent non-game task are first-class.

### 2.4 Media and voice

Two distinct classes:
- **Distribution media:** original/redistributable, versioned, hash-checked audio/video/images with provenance and licensing. Android loaded from install-time packs; Web streamed or selectively cached. It is **read-only** and never stored in progress DB.
- **User media:** recording produced with explicit mic permission. Private native app files (Android) or local Blob store (Web) keyed to an attempt; user-controlled retention/erase/export. Cloud AI processing requires distinct informed opt-in and processor data handling. Do not log transcripts/voice by default.

## 3. Most important domain invariants (cross-platform)

| ID | REQUIRED invariant | Observable failure behavior |
|---|---|---|
| INV-01 | One immutable `FirstAttemptEvent` per `sessionId,itemId,itemVersion,attemptOrdinal`; retry by `eventId` idempotent | Duplicate equivalent → same result; divergent → conflict |
| INV-02 | `commitAttempt` verifies `expectedRevision`, atomically writes event+snapshot+progress | Version conflict → recover, **no partial commit** |
| INV-03 | A draft checkpoint and independent first-answer evidence are **different records** | Autosave ≠ grading, no fabricated `firstCorrect` |
| INV-04 | Task and exam profile pin item version, schema version, content hash, asset manifest hash | Mismatch → explicit incompatible/blocked state |
| INV-05 | User remains in current task until local commit is **acknowledged** | Save failure → user-visible retry/export |
| INV-06 | Exam has no learning hints, game XP, transcripts, keys or AI intervention before submission | Fail closed if item metadata or policy invalid |
| INV-07 | Writing and speaking never silently assigned official YKI/CEFR by LLM/ASR | `ungraded` or qualified formative estimate only |
| INV-08 | Every packaged media asset has redistribution permission, source, expected bytes/hash and playable variant | Reject release asset lacking proof/rights |
| INV-09 | Android first installed version works fully offline with its packaged curriculum | Missing pack/codec blocks release |
| INV-10 | Web supports online streaming and opt-in small offline packs, no implicit multi-GB preload | Quota/unsupported storage shows actionable error |
| INV-11 | Cloud sync optional, server never overwrites local attempts through blind last-write-wins | Conflict surfaced, attempts immutable |
| INV-12 | Android app/private voice files and packaged course resources are never mixed with progress DB | Invalid storage placement blocks media import |
| INV-13 | User can export, import (validated), and delete local data; cloud deletion where enabled | Explicit confirmation and truthful result |
| INV-14 | Current MVP cannot be erased until migration parity, rollback and Android/Web smoke gates pass | CI/release gate red |
| INV-15 | Accessibility alternatives preserve ability to complete core tasks | No game-only requirement, transcript hidden only under practice exam policy |
| INV-16 | Training evaluation depends on independent retention/transfer, not streak count | Analytics distinguish `practice` vs `unseen` |

## 4. Implementation truth table (audited, not inferred)

| Component | Code paths on `main` | Current status | Missing before production |
|---|---|---|---|
| Legacy learn UI | `app/index.html`, `app/app.mjs`, `app/core.mjs` | `CURRENT_CODE` HTML/ESM/localStorage | React TypeScript feature parity, migration, browser E2E |
| Legacy 9-question exam | `app/exam.html`, `app/exam.mjs`, `app/exam-core.mjs` | `CURRENT_CODE` small 4-skill practice | Full/single modules, strict verified profile, calibrated scoring |
| Web transactional exam checkpoint | `app/attempt-storage.mjs`, `.d.ts`, tests | `CURRENT_CODE` IndexedDB, browser-oriented unit cases | Real browser multi-tab/quota/kill matrix, canonical protocol consolidation |
| Shared first-attempt contract | `packages/contracts/src/index.mjs`, tests | `CURRENT_CODE` JS runtime assertions + in-memory reference | Strict TS compilation, persistence adapters, cross-language contract fixtures |
| Media contract and Web adapter | `app/media-platform.mjs`, `packages/contracts/src/media.mjs` | `CURRENT_CODE` manifest assertions/URL mapping + mock native bridge | Media3 actually playing packaged data, streamed URLs tested |
| Kotlin/Room/media prototype | `native/android/prototype/*.kt` | `PARTIAL_PROTO` source files only | Generated Gradle Android app, compile, device tests, PAD |
| React/Vite/Phaser app | `apps/web` absent | `TARGET` | Scaffold, accessible UI, game vertical slice |
| Signed Android AAB and PAD 2–3GB | `apps/android` absent | `TARGET` | Compile, sign, internal test, size/memory/disk headroom |
| AI/sync EU backend | No deployed service evidenced | `TARGET` | Security RLS, DPA, consent, encryption, processing limits |
| Full reviewed redistributed media library | Existing catalog/content assets partial | `TARGET` | Rights review, editor S2, SFX/audio quality, subtitle QA |

**The existence of docs, tests, Kotlin text files and green static validators does not equal a working Android app or real hardware validation.**

## 5. Decision record and status notation

The previously discussed `91/93/86` scores are **qualitative, opinionated architecture-fit estimates**, not measured engineering/SLO results; projected `96/97/97` is **conditional** on passing hardware/browser release gates. Do not persist these as validated quality metrics. ADR changes require: problem statement → options/tradeoffs → source links → affected interfaces/tests → migration/rollback → version date → approval. Defer new frameworks unless profiling demonstrates a bottleneck.

### Non-negotiable review of known overlap

The current repository has TWO purpose-distinct APIs:
- `app/attempt-storage.mjs` commit: **checkpoint snapshots** (`start,answer,navigate,finish,legacy-import`), current-session persistence.
- `packages/contracts/src/index.mjs` commit: **immutable per-item first attempt** (`answered,skipped`).

These are **not yet one canonical event protocol**. Implementation must unify a versioned envelope + shared IDs and distinguish `CheckpointSaved` vs `FirstAttemptCommitted`; do not treat checkpoint autosave as independent first retrieval, do not force 250KB checkpoint JSON into a one-answer event, and do not write two incoherent session revisions. [Protocol resolution](29-cross-platform-protocols-and-data-contracts.md) specifies the target. This is the highest-value current integration documentation issue.

## 6. User journeys (minimum acceptance)

**Learn:** open without account → choose goal/skill/mix → listen/read → respond → durable first attempt → appropriate feedback → repair → transfer → spaced review → see evidence and export.  
**Game:** choose story → NPC Finnish request → React task overlay → commit → quest advances only on confirmed result → optional skip scene → due review works offline.  
**Exam:** choose full or one skill → see `unofficial / fidelity verified fields` → device/mic/storage preflight → start frozen profile → listen/respond → draft save → commit first answer → recovery after force stop → submit → results with four separate statuses and no false YKI grade.  
**Android first run:** install fully via Play → airplane mode → inspect pack manifest and local media file → play/seek Finnish audio and video → finish tasks → retain progress → optional export.  
**Web first run:** open URL with small initial bundle → stream lesson → optionally download selected offline media → airplane mode displays availability → resume recorded learner progress.

## 7. Source registry

Official OPH: [2027 test timing and registration](https://www.oph.fi/fi/koulutus-ja-tutkinnot/sopivan-yki-testin-valinta-ja-testipaivat), [digital pilot announcement](https://www.oph.fi/fi/uutiset/2026/yki-digitestia-kokeillaan-marraskuussa-2026). Historical SOLKI: [public Finnish examples](https://ykitesti.solki.jyu.fi/tutustu-testiin/testifin/); source != redistribution permission. Android: [PAD install-time semantics](https://developer.android.com/guide/playcore/asset-delivery), [Kotlin PAD integration](https://developer.android.com/guide/playcore/asset-delivery/integrate-java), [AssetManager/uncompressed `openFd`](https://developer.android.com/reference/android/content/res/AssetManager), [Android offline-first data](https://developer.android.com/topic/architecture/data-layer/offline-first). Web: [browser storage best-effort/eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria). Capacitor: [current documented runtime](https://capacitorjs.com/docs).

**Documentation acceptance:** Every P0 feature maps to owner module, cross-platform contract, real status, a failure mode, and one automated/device/human gate. A validator confirms structural consistency, while real implementation CI proves runtime behavior.
