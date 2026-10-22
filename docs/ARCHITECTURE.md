# Architecture map — real implementation and approved target

**Status:** verified repository map as of 2026-10-22, with planned boundaries separated from code. [Authority/index](INDEX.md) · [ADR-027](27-stack-architecture-compatibility-and-implementation-gates.md).

## Implemented now (source exists)

```text
app/index.html ── app/app.mjs ── app/core.mjs ── learning/exercises/**/*.json
     │                                 └── LEARN progress: localStorage
     └── app/exam.html ── app/exam.mjs ── app/exam-core.mjs
                                  └── app/attempt-storage.mjs
                                       └── IndexedDB (exam event + checkpoint)
app/media-platform.mjs ── browser/native media contract prototype
packages/contracts/src/{index,media}.mjs ── first-attempt & rights contracts
native/android/prototype/*.kt ── Kotlin SOURCE ONLY: Room + Media bridge
```

**Runnable Web MVP:** plain JavaScript ES modules; browser pages served via a local HTTP server (not a build step). UI, progression, sample exam and limited audio exist. Browser exam IndexedDB uses event+snapshot transactions and a Chromium integration check; learning SRS still uses `localStorage`.

**Not implemented:** `apps/web` React/Vite/PWA, `apps/android` Capacitor/Gradle app, Phaser gameplay, shared strict TypeScript domain, durable Android Room binary, real Play Asset Delivery 2–3GB, full online sync, verified official YKI 2027 reproduction. See [implementation status](25-implementation-vertical-slice-roadmap.md).

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
3. **CONTENT:** identity = `itemId + version + sha256`; freeze content identity in an in-flight attempt. Rights/source validation comes before media bundling; never copy 2–3GB assets into IndexedDB/Room.
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
| Curriculum and audio | `content/`, `audio/`, `video/` | [content authoring](../learning/CONTRIBUTING.md) |

## Change protocol

When design and source disagree, keep both statuses visible and open a scoped fix with a regression test. Treat [ADR-024](24-reliability-hardened-architecture-web-android.md) and [ADR-027](27-stack-architecture-compatibility-and-implementation-gates.md) as the latest architecture integration decisions; do not edit old ADRs as if they were live source code. Read [TESTING](TESTING.md) before reporting "implemented".
