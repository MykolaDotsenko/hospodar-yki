# Architecture map — real implementation and approved target

**Status:** source map updated for the 2026-11-07 G2 Web progress-recovery slice; release targets remain separate from implemented code. [Authority/index](INDEX.md) · [ADR-027](27-stack-architecture-compatibility-and-implementation-gates.md).

See the [ADR lifecycle and current decision map](architecture/README.md) for explicit precedence, and the [Web/Android migration how-to](guides/WEB-ANDROID-MIGRATION.md) for implementation sequencing. These navigation pages do not replace the canonical contracts in [CONTRACTS](CONTRACTS.md).

**Module boundaries are actively checked:** [independent domain and contracts rule](architecture/MODULE-BOUNDARIES.md) runs in CI. React/Phaser/Dexie/Room are platform-specific TARGET choices, not dependencies of pure domain logic.

## Implemented now (source exists)

```text
app/index.html ── app/app.mjs ── app/core.mjs ── learning/exercises/**/*.json
     │                                 └── LEARN progress: localStorage
     └── app/exam.html ── app/exam.mjs ── app/exam-core.mjs
                                  └── app/attempt-storage.mjs
                                       └── IndexedDB (exam event + checkpoint)
app/session-v2-idb.mjs ── isolated experimental V2 Web adapter (not active app storage)
apps/web (React 19 + Vite 8 + TS) ── packages/domain (pure TS, parity with app/core.mjs)
     └── Dexie DB hospodar-yki:web:v1 (LEARN progress, legacy import and Web JSON LEARN-only restore; v3 separate cloze draft)
app/media-platform.mjs ── browser/native media contract prototype
packages/contracts/src/{index,media}.mjs ── first-attempt & rights contracts
native/android/prototype/*.kt ── Kotlin SOURCE ONLY: Room + Media bridge
```

**Runnable Web MVP:** plain JavaScript ES modules; browser pages served via a local HTTP server (not a build step). UI, progression, sample exam and limited audio exist. Browser exam V1 IndexedDB uses event+snapshot transactions with event-receipt recovery and a Chromium integration check; an **isolated** V2 adapter separately proves first-attempt uniqueness. The live learning SRS still uses `localStorage`.

**G2-a…G2-d (03.11.2026):** `apps/web` React/Vite/TS app with Dexie persistence and `packages/domain` strict-TS policies with parity tests ([plan](exec-plans/active/2026-11-03-g2-web-react-scaffold.md)). **IMPLEMENTED (tested, S2 content pending):** LEARN missions (cloze, R08 reviewer preview, listening, reading, writing clinic, dialogues, picture missions, diagnostic, 7/14/30 delayed checks, media library), legacy progress import, «Мої дані» (verified JSON export + per-scope typed-confirmation erase + fail-closed LEARN-only restore from Web v1 backup into an empty profile, LEARN-16/WEB-07), and an EXAM practice rehearsal on an **XState** machine with its own IndexedDB (`hospodar-yki:web-exam:v1`: checkpoint + attempt history), full or skill-subset sessions, draft autosave and consented local voice recording (E06 receipts, separate `hospodar-yki:web-exam-voice:v1`), plus E07 IME-safe writing (composition gate and exact Unicode readback), and an offline app shell and explicit offline media packs with an exam-safe update guard (service worker, WEB-05/06). installable as a PWA (web app manifest). **Not implemented:** `apps/android` Capacitor/Gradle app, Phaser gameplay, cross-platform Kotlin/TypeScript V2 persistence parity, durable Android Room binary, real Play Asset Delivery (planned ≈3.6GB compressed within the 4GB Play ceiling, [R05](23-android-offline-game-and-3gb-media-architecture.md#r05-follow-up-28102026--storage-ceiling-increased-implementation-unchanged)), full online sync, verified official YKI 2027 reproduction. See [implementation status](25-implementation-vertical-slice-roadmap.md).

## Planned modular monolith (direction, **not** current paths)

```text
                  Pure TypeScript domain/contracts
                ↗           ↑               ↖
React/Vite Web UI       XState exam policy     Phaser 2D scenes
       │                       │                       │
       └──────── application use cases ────────────────┘
                         │
       ┌─────────────────┴──────────────────┐
 Web: Dexie / IndexedDB                Android: Capacitor bridge
 Web: CDN + selected cache                    Kotlin Room + Media3
                                        Google Play AAB / install-time PAD
                         │
          Optional future EU sync/AI gateway
```

**Dependency rule:** domain may depend on pure validation/schema utilities, never React, Phaser, Capacitor, browser globals, platform DB or Supabase. UI and native adapters depend on the shared contracts. Domain and application decisions must be deterministic and unit-testable with mock ports.

## Critical flows

1. **EXAM:** `start → edit checkpoint → atomic durable commit → next/finish`. A save failure blocks progression. Mark typed event evidence separately from editable drafts. On lost ACK confirm actual **event ID plus fingerprint**, not just matching snapshot. Never expose correct answers/coaching before appropriate submission.
2. **LEARN:** independent first response → immutable `FirstAttemptEvent` → corrections/transfer events → SRS update. A draft isn't evidence of independent recall. Do not silently migrate learning `localStorage` without export and repeatable migration tests.
3. **CONTENT:** identity = `itemId + version + sha256`; freeze content identity in an in-flight attempt. Rights/source validation comes before media bundling; never copy multi-GB media assets into IndexedDB/Room.
4. **ANDROID MEDIA:** install-time pack is target, not shipped. A provided `packId` must actually select a verified pack; native seek/subtitles/video and path traversal controls require compiled-device evidence.
5. **AI/VOICE:** core offline first; optional remote feedback only after explicit opt-in, with minimal data and no default voice upload.

## Where to change what

| Feature change | Current owner | Documentation / tests |
| --- | --- | --- |
| LEARN flow/SRS | `app/app.mjs`, `app/core.mjs` | [MVP spec](11-mvp-product-requirements.md), `app/tests/` |
| EXAM behavior | `app/exam.mjs`, `app/exam-core.mjs` | [21 — exam contract](21-digital-yki-exam-simulator-executable-spec.md), `app/tests/` |
| Exam persistence | `app/attempt-storage.mjs` | [CONTRACTS](CONTRACTS.md), IDB real-browser test |
| Immutable attempts | `packages/contracts/src/index.mjs` | [CONTRACTS](CONTRACTS.md), `packages/contracts/tests/` |
| Media/rights | `app/media-platform.mjs`, `packages/contracts/src/media.mjs` | [SECURITY](SECURITY.md), media tests |
| Kotlin source prototype | `native/android/prototype/` | [native README](../native/android/prototype/README.md); compile gate still absent |
| Curriculum and audio | `learning/exercises/`, `assets/audio/`, `assets/video/` | [content authoring](../learning/CONTRIBUTING.md) |

## Change protocol

When design and source disagree, keep both statuses visible and open a scoped fix with a regression test. Treat [ADR-024](24-reliability-hardened-architecture-web-android.md) and [ADR-027](27-stack-architecture-compatibility-and-implementation-gates.md) as the latest architecture integration decisions; do not edit old ADRs as if they were live source code. Read [TESTING](TESTING.md) before reporting "implemented".

## 2026-11-08: recoverable cloze LEARN draft (separate store, same Web DB)

The React LEARN cloze now uses the additive Dexie **v3 `missionDraft` table** with optimistic draft revision and learner-state revision. Step submission is checkpointed and reread before updating the UI. A frozen first attempt is kept separate from guided repair. A short idle debounce saves unfinished typing; **Зберегти та вийти** flushes immediately; reload validates the saved phase by re-running the pure mission reducer against the current editorial content fingerprint. A stale, malformed or old-content draft blocks silent continuation and requires deliberate discard; EXAM store and feedback rules are untouched. Finishing a mission updates the LEARN history and removes the matching draft **in one transaction**, verified afterward. LEARN deletion removes draft too; an unfinished draft blocks new-profile restore and legacy import rather than being overwritten. The existing Web JSON export remains **completed-records-only** and cannot be called a full paused-draft backup; UI says so explicitly. A physical power-kill/IDB eviction/Android resilience matrix and expanded autosave on the other LEARN skill screens are **NOT RUN**.

## 2026-11-08: WEB-05 offline cached-media integrity and fail-closed status

**Code:** `apps/web/src/pwa/offline.ts`, `apps/web/src/screens/OfflineScreen.tsx`; **evidence:** `apps/web/src/pwa/offline.test.ts`, `apps/web/e2e/offline.spec.ts`. Content URLs may remain the same after a build, so a Cache Storage hit is *not* proof that an offline file matches the current manifest. Both status and explicit repeat-download now verify each cached response's actual byte count and SHA-256; a stale, truncated, unreadable or hashless match never counts as ready. Re-download removes invalid bytes before network repair, and a fresh cache readback must match after writing before the UI reports success. A verification failure clears previously displayed ready rows rather than implying offline availability. This does **not** add content, install media automatically, touch LEARN/EXAM/voice records, prove resilience under physical device eviction, or guarantee future multi-gigabyte pack performance.

**Performance/standards trade-off:** Web Crypto `SubtleCrypto.digest` does not support incremental streaming, so every status check reads and hashes one media file in memory at a time; run real-device memory/latency measurements and evaluate an incremental hash strategy before deploying any 3–4GB Android/browser media catalogue. Reference: [MDN Cache.match](https://developer.mozilla.org/en-US/docs/Web/API/Cache/match), [MDN SubtleCrypto.digest](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest). This is a reliability fix under existing WEB-05 / QL-08, **not** a claim of new language-learning outcomes or official YKI fidelity.

## 2026-11-08: EXAM C-04 navigation ACK gate (durable before visible)

On the React/XState EXAM Web rehearsal, a prior implementation changed `session.index` to the destination before its IndexedDB transaction/readback completed. E2E could observe `Tehtävä 2 / 9` and reload while the saved checkpoint still pointed at item 1. A new internal `pendingNavigation` keeps the visible session/index unchanged during `saving` and across `saveError`/`RETRY` until the repository confirms exact readback. Next item appears only in the `persist.onDone` transition. The Finnish status text now says `Tallennetaan siirtymää…` while pending and `Tallennus epäonnistui.` after refusal, not `Tallennettu.`. The pending state is in memory only and never exported or scored.

**Acceptance:** domain Vitest uses a deferred repository commit to prove old index before ACK / new index after ACK, restores an independent IndexedDB reader on both sides; failure+retry regression asserts old task remains visible. Existing three-engine Playwright EXAM reload checks the new item is displayed only after the save receipt. No official YKI UI/timing fidelity claim. This addresses the failed post-merge main CI run 42510644046, which observed the next task on-screen before a persisted reload; S2/Android/device validation remain separate gates.

## 2026-11-09 — LEARN Writing Clinic checkpoints (IndexedDB v4)

An additive clinicDraft table, separate from cloze missionDraft and completed learner evidence, holds the unfinished stage, exact editable Finnish text and a content fingerprint. Checkpoints are serialized, version-guarded by both learner and draft revisions, and confirmed by fresh readback. Each phase is reconstructed with the pure clinic reducer before the UI can show a model. The first independent writing submission is committed atomically with the spot-stage checkpoint; final guided rewrite and new independent transfer are committed atomically with checkpoint deletion.

A second tab cannot replace or erase stale work. LEARN wipe clears this store under a revision check; legacy import and JSON restore fail closed if it is populated. The existing portable JSON export intentionally omits unfinished cloze and clinic drafts, which the data screen now discloses. No EXAM/YKI grade, S2 approval, true power-loss recovery, Android persistence or measured learning effect is claimed.

Evidence: apps/web/src/storage/clinicDraft.test.ts; clinicDraft.repository.test.ts; apps/web/e2e/writing-clinic-restore.spec.ts; plus unchanged full Playwright and architecture gates.

## 2026-11-09 — LEARN Reading checkpoint (Web Dexie v5)

The React LEARN Reading screen previously had no durable stage/input state. The new additive `readingDraft` table (Dexie v5) holds first-choice/open answers, editable Finnish input, self-judgements and the transfer stage, independent of completed diagnostics, cloze drafts, Writing Clinic, EXAM and voice. Content fingerprints and exact `readingReducer` replay reject stale or impossible phases before exposing answer keys/highlights. Serialized, CAS-checked writes with fresh readback gate each visible stage transition; final evidence and deletion of the matching checkpoint share one transaction. Stale tabs cannot overwrite a newer answer, and LEARN erase/import/restore handle the paused draft without destructive merging. Explicit Save & Exit flushes, whereas a sudden tab/process kill before idle autosave and device storage eviction remain **unverified**.

**Implementation / test owner:** `apps/web/src/storage/{readingDraft.ts,learnerRepository.ts}`, `apps/web/src/screens/{ReadingScreen.tsx,DataScreen.tsx}`, `apps/web/src/storage/readingDraft*.test.ts`, `apps/web/e2e/reading-restore.spec.ts`; [execution plan](exec-plans/active/2026-11-09-durable-reading-draft.md). **Status at authoring:** coded, awaiting independent CI. No S2 approval, Android or YKI fidelity claim.

## 2026-11-10 — LEARN Listening checkpoint (Web Dexie v6)

React Listening gains a separate additive `listeningDraft` store for current prediction/question text, frozen answers, audio-start count, and slow/transcript accessibility support flags. The exact lesson fingerprint and pure `listeningReducer` replay gate every resumed phase, preventing early answer-key reveal and stale-version restoration. Queued CAS/readback writes gate visible progression; support remains sticky and makes affected session evidence ungraded. Final diagnostic write plus draft removal is one IndexedDB transaction. LEARN erase/legacy import/JSON restore protect these drafts; the portable JSON export excludes unfinished drafts and says so.

Evidence owner: `apps/web/src/storage/listeningDraft*.ts`, `apps/web/src/storage/learnerRepository.ts`, `apps/web/src/screens/ListeningScreen.tsx` and `apps/web/e2e/listening-restore.spec.ts`. [Execution and validation plan](exec-plans/active/2026-11-10-durable-listening-draft.md). **Code authored; CI not yet asserted.** Audio kill/replay, disk eviction, full mobile a11y and native Android remain separate blockers.
