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

Merged PR #26 (`feat/typed-contracts-atomic-attempts-20261022`) placed `packages/contracts/` on `main` for **immutable per-question first-attempt events**; PR #27 added the independent Web exam checkpoint store. This slice introduces a **separate** local `exam snapshot checkpoint` protocol (draft autosave and UI session state). They complement rather than replace one another:

- `ExamCheckpoint` (`app/attempt-storage.mjs`): resumable drafting and navigation progress.
- `FirstAttemptEvent` (`packages/contracts`, already merged): immutable response evidence and skill measurement.

**Do not assign official YKI grade or mark an answer independently recalled merely because it was autosaved as a draft.** Before full React/TS migration, unify serialization/IDs and publish a single canonical contract registry for the two event types; avoid duplicate scoring models.

## Remaining gaps before claiming the planned 96/97/97 scores

- Android real Gradle app, Capacitor native bridge compilation and **Room device tests**.
- Real Google Play AAB with large `install-time` packs, verified Media3 seek/subtitles/video render, memory/thermal/CPU/space metrics.
- **Broader** browser E2E tests (WebKit/Firefox/mobile, quota errors, browser kill, permissions) and Android/Web parity fixtures. The existing CI **does already include a real Chromium IndexedDB concurrency/lost-ACK/recovery test**; it does not cover every failure mode or Android.
- React/Vite/Phaser frontend migration + shared domain integration; the playable MVP is still `app/` vanilla JavaScript.
- Real authentic, redistributable offline Finnish recordings/videos, S2 human reviews, and reliable evaluated speaking/writing.
- New official YKI 2027 digital pilot specs once OPH confirms them; avoid strict fidelity claims until then.

## Integration risks found after merge (documentation, not fixes)

- **Lost ACK:** `commitWithRecovery` accepts equal `revision + session` after a failed write; this cannot prove that the **same event ID** committed when an unrelated concurrent command wrote an identical snapshot. Future protocol must read back `eventId + payload fingerprint`.
- **Duplicate receipt:** exact retry in current stores returns a snapshot of the current row; define whether duplicate acknowledgment must return the **original** commit receipt when subsequent commands advanced the session.
- **Cross-language identity:** `app/attempt-storage.mjs` and `packages/contracts/src/index.mjs` validate different event envelopes; Kotlin serializes `sessionJson` differently from JS unless canonicalization is specified. Do not treat them as already unified.
- **Native errors:** `HospodarExamStorePlugin.kt` explicitly preserves `REVISION_CONFLICT`, but other errors including divergent idempotency can currently surface as `SAVE_FAILED`.
- **Media:** `HospodarMediaPlugin.kt` accepts `packId` without resolving a named pack; Kotlin path checks do not yet match the strict Web percent-encoding check. Native Android video `PlayerView` is not integrated.

These issues are action items and **not claims of demonstrated production data loss**. Priority, proposed serializable command and acceptance cases are in [ADR-027](27-stack-architecture-compatibility-and-implementation-gates.md) and the [updated execution roadmap](25-implementation-vertical-slice-roadmap.md).

## Quick check

```bash
node --check app/exam.mjs
node --check app/attempt-storage.mjs
node --check app/media-platform.mjs
node --test app/tests/*.test.mjs
```

[Architecture ADR-024](24-reliability-hardened-architecture-web-android.md) and [native prototype](../native/android/prototype/README.md).
