# Implementation slice 2026-10-22 — Atomic exam checkpoint and media contracts

**Status: code changed in the runnable legacy Web exam, native Kotlin source created but not integrated/compiled.** Do not substitute specification checks for real on-device tests.

## Delivered

1. `app/attempt-storage.mjs`: IndexedDB v1 tables `sessions` + `events`, single atomic readwrite transaction for `eventId` and snapshot `revision`; exactly-once commit, conflict guard and divergent duplicate rejection. Browser `createMemoryExamRepository` is a deterministic test reference.
2. `app/attempt-storage.d.ts`: typed 1.0 protocol. `createAndroidExamRepository(nativeBridge)` invokes **one Kotlin native method per commit** rather than unsafe JS callback/transaction across JNI/WebView.
3. `app/exam.mjs`: working four-skill nine-question practice route now uses IndexedDB for checkpoints, migrating valid legacy `localStorage` data exactly once, coalescing high-frequency inputs, **flushing drafts and waiting for durable transaction before navigation/finish/key reveal**. On failure: fail closed, export current in-memory session, retry save. Optional timers remain practice-only, not OPH digital confirmed.
4. `app/media-platform.mjs` and `.d.ts`: versioned whitelist of rights-cleared audio/video media, media identity SHA256, safe relative paths, Web HTTPS URL and native verified asset handle without exposing asset `file://` addresses. Works with mock native bridge and has test coverage.
5. `native/android/prototype/*.kt`: Room DAO and Capacitor exam plugin, Media3/AssetManager playback prototype. **Not compiled** because this repo has no generated Android Gradle project or PAD packs. Native video PlayerView and 2–3GB release **not completed**.
6. Tests `app/tests/attempt-storage.test.mjs` and `media-platform.test.mjs` for idempotency, conflict, failed write, malformed payload and media rights/hash/path guards; existing JS MVP tests preserved.

## Deliberate boundary with concurrent shared domain work

Another branch, `feat/typed-contracts-atomic-attempts-20261022`, defines `packages/contracts/` for **immutable per-question first-attempt events**. This slice introduces a **separate** local `exam snapshot checkpoint` protocol (draft autosave and UI session state). They complement rather than replace one another:

- `ExamCheckpoint` (`app/attempt-storage.mjs`): resumable drafting and navigation progress.
- `FirstAttemptEvent` (`packages/contracts`, when merged): immutable response evidence and skill measurement.

**Do not assign official YKI grade or mark an answer independently recalled merely because it was autosaved as a draft.** Before full React/TS migration, unify serialization/IDs and publish a single canonical contract registry for the two event types; avoid duplicate scoring models.

## Remaining gaps before claiming the planned 96/97/97 scores

- Android real Gradle app, Capacitor native bridge compilation and **Room device tests**.
- Real Google Play AAB with large `install-time` packs, verified Media3 seek/subtitles/video render, memory/thermal/CPU/space metrics.
- Web browser E2E tests on IndexedDB (including multiple tabs, browser kill, quota errors) and cross-platform tests with fixture parity; this PR's Node tests alone do not prove those.
- React/Vite/Phaser frontend migration + shared domain integration; the playable MVP is still `app/` vanilla JavaScript.
- Real authentic, redistributable offline Finnish recordings/videos, S2 human reviews, and reliable evaluated speaking/writing.
- New official YKI 2027 digital pilot specs once OPH confirms them; avoid strict fidelity claims until then.

## Quick check

```bash
node --check app/exam.mjs
node --check app/attempt-storage.mjs
node --check app/media-platform.mjs
node --test app/tests/*.test.mjs
```

[Architecture ADR-024](24-reliability-hardened-architecture-web-android.md) and [native prototype](../native/android/prototype/README.md).
