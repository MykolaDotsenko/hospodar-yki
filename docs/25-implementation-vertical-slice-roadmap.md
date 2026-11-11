# ADR-025 — Implementation-first roadmap: Hospodar YKI Web + Android

**Updated:** 22.10.2026 · **Baseline:** `main@b276e7f`.  
**Status:** **PARTIALLY IMPLEMENTED, NOT ANDROID-RELEASE-READY**. This roadmap is operational; [ADR-027](27-stack-architecture-compatibility-and-implementation-gates.md) is the canonical architectural compatibility/acceptance plan, with [ADR-024](24-reliability-hardened-architecture-web-android.md) controlling platform storage.

## 1. Verified implementation (do not reset this progress)

- [x] Browser LEARN MVP: `app/index.html`, `app/core.mjs`, basic first-try SRS, currently **`localStorage`**.
- [x] Browser EXAM practice: `app/exam.html`, four skills / nine tasks per rehearsal, objective-only grading, open production ungraded.
- [x] `app/attempt-storage.mjs`: **IndexedDB event+snapshot atomic transaction** for exam draft checkpoint, optimistic revision, duplicate event handling, failed-write blocking, legacy exam-storage import.
- [x] `app/media-platform.mjs`: typed-ish JS provider protocols, rights/hash/path manifest validation, Web/native mock adapter.
- [x] `packages/contracts/src/index.mjs`: separate immutable first-answer command reference with in-memory test repository; **not durable production first-attempt persistence**.
- [x] Node unit tests and a **real Chromium IndexedDB** integration test in `validate-app-mvp.yml` (subset of browser failure scenarios).
- [x] Kotlin source prototypes for Room DAO, Capacitor exam plugin and Media3 playback. **Source exists, native compilation/device parity is not proven.**

A draft autosave is NOT proof of an independently recalled first answer. Current JS contract `app/attempt-storage.d.ts` and `packages/contracts/` must converge with distinct event types.

## 2. Implement in this order (no parallel big-bang rewrite)

| Step | Owner subsystem | Work / acceptance | Completion evidence | Status |
| --- | --- | --- | --- | --- |
| **G0** | Existing app/test | Freeze baseline fixtures, known failure inventory; protect working browser MVP | Node + Chromium IDB green, documented source hash | **PARTIAL** — regression tests exist |
| **G1** | `packages/contracts`, domain | One versioned command registry, `ExamCheckpoint` vs `FirstAttemptEvent`, canonical serialization, cross-language errors; C-01…C-06 | Shared fixtures + JS/Room parity, ID-based lost-ACK reconciliation | **PARTIAL** — V2 JS commands/fixtures, isolated Web V2 IDB, V1 Web receipt recovery; UI integration, Kotlin parity and migrations NOT DONE |
| **G2** | `apps/web`, Web storage | React 19 / strict TS / Vite app; port Learn+Exam, IndexedDB/Dexie, legacy export/migration, PWA selective offline | All legacy missions and exam tests pass; Playwright Chromium/Firefox/WebKit | **PARTIAL — G2-a (03.11.2026):** `apps/web` shell + one LEARN mission + Dexie + TS domain parity; migration, EXAM, PWA, other screens NOT DONE ([plan](exec-plans/active/2026-11-03-g2-web-react-scaffold.md)) |
| **G3** | `apps/android`, Kotlin | Scaffold Capacitor+Gradle; integrate native Room, migrations, plugins, lifecycle; 1 shared task end-to-end | Compiled debug/Release-compatible AAB, emulator & physical phone tests | **SOURCE PROTOTYPE ONLY** |
| **G4** | Media pipeline/native | Real PAD `packId` routing + checksum/path parity, native seek + video surface, captions; >1 GB **synthetic** offline install-time test | Signed AAB + bundletool / Play internal install, airplane-mode seek, resource profile | **SOURCE PROTOTYPE ONLY** |
| **G5** | Learning/game/exam | Phaser 2D scene + NPC quest with real outcome/feedback/transfer; 4-skill parity, strict exam mode | End-to-end Web/Android gameplay + accessible forms + 30 FPS measured mid-range Android | **NOT STARTED** |
| **G6** | Content/release | Licensed reviewed Finnish media, S2 editorial review, safe version upgrades, GDPR/consent, backup/restore and rollback | Release matrix pass, actual install/download size, real-device tests | **NOT STARTED** |

**Blockers to remove before calling G1 complete:** `commitWithRecovery` currently checks only a matching snapshot/revision after ambiguous failure, not the **actual event ID**; duplicate acknowledged results are not guaranteed to preserve the *original* receipt if later writes occurred. Canonical JSON equality between JS/Room is not yet specified; native error mapping largely collapses errors. See [ADR-027 §3](27-stack-architecture-compatibility-and-implementation-gates.md).

**Blockers before calling G4 complete:** `HospodarMediaPlugin.kt` validates `packId` as nonempty but opens `context.assets.open(relativePath)` without pack-scoped resolution; Kotlin path check is not identical to Web strict percent-encoding rejection; no native `PlayerView` video surface, and no measured install-time PAD pack test.

## 3. CI/quality policy

- Retain **real** `node --test app/tests/*.test.mjs` + Chromium IndexedDB and Python content validators as regression baseline; green static ADR checks do not certify Android/Web release.
- G1: add cross-runtime golden fixtures and native Room tests to CI; future native changes must trigger native tests (current `validate-app-mvp.yml` is primarily scoped to `app/**` and selected content).
- G2: Vitest unit + Playwright Chromium, Firefox, WebKit/Android browser smoke, keyboard/axe, microphone permission and quota cases. Do not replace existing tests until feature parity passes.
- G3–G4: CI Gradle build, Room schema migrations, emulator tests, signed AAB + Play internal physical-device install-time delivery with >1GB synthetic fixture.
- G5–G6: Android process kill, low disk, update/reinstall, headphone interruption, verified captions/codec, reduced-motion + sustained FPS/battery/memory; media licensing ledger and security review.
- Each gate PR must include code/test evidence, actual status and rollback. No release claim based solely on markdown, compiled Kotlin sources or design-fit score.

## Research-to-UX adoption gate (not an additional product milestone)

For upcoming G2/G5 UI, voice, SRS and Phaser work, apply [research program](../research/RESEARCH-PROGRAM.md) → [experiment protocol](../research/ux/learning-impact-evaluation-protocol.md) → [engineering handoff](guides/EVIDENCE-TO-UX.md). Use a small accessible and silent-by-default learning loop before adding game or audiovisual effects. Retain human Finnish S2 review and 7/14-day unseen transfer evaluation; research and experiments are not implementation completion evidence. This gate uses existing G0–G6, C-01…C-10 and current PR reviews; **no extra registry**.

## 4. Exclusions / migration safety

Do **not** deploy two independent domain engines or score ungraded speaking/writing as an official YKI level. Do **not** block offline core on Supabase login or automatic multi-GB Web download. Do **not** remove the existing `app/` until critical flows, old exports, check/scores and data migrations are demonstrably equivalent. Checksum/version pin content to an in-progress attempt.

**Acceptance case list:** [C-01…C-10](27-stack-architecture-compatibility-and-implementation-gates.md). **Legacy release gates:** [REL-01…REL-16](24-reliability-hardened-architecture-web-android.md), [ANDR-01…ANDR-18 / WEB-01…WEB-10](23-android-offline-game-and-3gb-media-architecture.md).

## Web LEARN Reading slice — 09.11.2026 (part of G2, not G2 completion)

`apps/web` now has **coded** v5 IndexedDB Reading checkpoints with reducer-validated restoration, phase write/readback ACK, stale-tab CAS and atomic completed evidence + draft deletion. New source/unit/E2E suites are identified in [execution plan](exec-plans/active/2026-11-09-durable-reading-draft.md). **CI remains to be verified independently** and G2 still needs broader Web/mobile accessibility and failure-mode evidence. G3–G6 Android, large media delivery, official YKI 2027, licensed/S2-final material and efficacy trials remain uncompleted; the old table above is a baseline, not a claim of latest implementation inventory.

## LEARN Listening Web durability slice — 10.11.2026

Implementation coded on its own feature branch: Dexie v6 `listeningDraft`, reducer-validated independent first answers, sticky accessibility support (always ungraded), serialized CAS/readback, atomic diagnostics + checkpoint removal, and privacy/delete/restore integration. Browser/device/Android release claims **not** warranted before independent CI and hardware evidence. [Plan + pending gates](exec-plans/active/2026-11-10-durable-listening-draft.md). G2 remains partial; G3–G6 unchanged.

## LEARN Dialogue Web durability slice — 10.11.2026

G2 Web implementation branch adds IndexedDB v7 dialogue checkpoints, reply-before-script reducer replay, no premature model reveal, serialized CAS/readback, and atomic ungraded role-play completion. Privacy/data erasure/export inventory and 3-engine browser verification remain explicit gates before declaring a merge. [Execution plan](exec-plans/active/2026-11-10-durable-dialogue-draft.md). Android native, S2 content review, measured effects and exact YKI 2027 fidelity remain unverified.

## LEARN Picture Mission Web durability slice — 10.11.2026

Scoped G2 Web checkpoint work, **not** a G2/G6 release: additive Dexie v8 picture drafts with lesson+licensed-photo fingerprint and pure reducer replay; unassisted response persisted before showing Finnish models/Ukrainian gloss; separate transfer without the picture; bounded autosave, exact Save & Exit, cross-tab CAS/readback, and atomic ungraded final diagnostics plus deletion. Explicit LEARN erase/import/restore fail-closed protections and portable export disclosure include unfinished photo work. [Execution plan, implementation and test locations](exec-plans/active/2026-11-10-durable-picture-mission-draft.md). Native Android, true media eviction/power-loss resilience, S2 review, measured learning and official YKI 2027 fidelity remain unverified.

## LEARN Diagnostic Web durability slice — 11.11.2026

Scoped **G2 Web** work, not G2 completion: Dexie v9 `diagnosticDraft`, strictly reducer-replayed frozen reading choices/writing and speaking text, verified pause/reload, stale-tab CAS, and **per-skill atomic checkpoint + diagnostic evidence**. Speaking finalization atomically deletes the matching draft. A voice-only, unfinished answer is **not** persistently recoverable because actual audio is ephemeral. LEARN privacy inventory, typed wipe and fail-closed import/restore include the store; portable JSON excludes unfinished Diagnostic. Implementation, acceptance gates, and nonclaims: [execution plan](exec-plans/active/2026-11-11-durable-diagnostic-draft.md). Browser eviction/power loss, Android, S2 approval, efficacy and exact official YKI 2027 format remain unverified.

## G2 Web browser storage resilience — 11.11.2026

Scoped storage-quality work, **not** a claim that IndexedDB is a durable off-device backup: read-only StorageManager `persisted()` and origin-wide `estimate()` in My Data, user-click-only `persist()` with readback verification, low-headroom advisory, nested DOMException/Dexie quota classification and actionable LEARN write-error guidance. Portable JSON still excludes unfinished LEARN drafts and raw recorded audio. [Execution plan and test matrix](exec-plans/active/2026-11-11-browser-storage-resilience.md). Full browser CI and release gates must be checked against the PR SHA; actual eviction, power loss, low-disk device testing, Android/native, S2 and 2027 official format fidelity remain **unverified**.

## G2 Web transactional fault injection and legacy replay guard — 11.11.2026

Scoped integrity hardening after v9 Diagnostic and browser storage inspection: legacy import now requires a truly unowned/empty destination (including blank learner and pre-existing receipts), verifies exact imported receipt alongside learner counts, and warns that post-commit readback failure is ambiguous rather than "nothing changed". Real `IDBObjectStore` abort tests inject quota/abort faults **between the two writes** of import and Diagnostic transactions; Web E2E injects and checks recovery in Chromium/Firefox/WebKit. See [fault matrix execution plan](exec-plans/active/2026-11-11-idb-abort-import-replay.md). All tests remain gated by PR CI. Physical OS kill, actual browser eviction, hardware disk pressure, Room and Android remain unverified.

## LEARN existing-content connection — 11.11.2026

Scoped G2 Web slice: paraphrase, speaking reaction, opinion, contextual chunk and rektio banks become «Практика без підказки» cards (own answer first, model after, new situation; only the paraphrase choice scored). No new storage store, no SRS feed, no S2 approval, no Android. See [ARCHITECTURE](ARCHITECTURE.md#2026-11-11--learn-практика-без-підказки-existing-banks-connected-g2-web).
