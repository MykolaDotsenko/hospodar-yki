# Guide — migrating Web and Android without data loss

**R11 preflight refinement 28.10.2026:** Before attempting any V1→V2 conversion, [run the no-write old LEARN preflight](../../app/r11-legacy-migration-preflight.mjs) (22 tests in [R11 Node suite](../../app/tests/r11-legacy-migration-preflight.test.mjs)); a ready result **does NOT import anything**. Keep byte-for-byte original JSON user backup; reject unknown root/card fields, silent 120/160 record truncation, invalid retention and corrupt JSON rather than resetting to blank; require a separate atomic import/receipt/rollback implementation PR with real Chromium/Firefox/WebKit and physical Android instrumented migration tests. [Research and official source limits](../../research/architecture/r11-offline-integrity-resilience-2026-10.md); Android Play pack base+install-time 4GB compressed max and 1.5GB/asset pack must be measured from an actual build, not README estimates.

**Status: HOW-TO FOR FUTURE GATES, NOT EXECUTED.** The working reference remains `app/` until parity is demonstrated. Do not execute `pnpm build` or `./gradlew` yet: these project scaffolds are absent from the committed baseline.

## G0 / G1: baseline and shared contracts

1. Confirm the current `main` SHA; run the commands in [TESTING](../TESTING.md), including the real Chromium IndexedDB smoke. Preserve output and the known limitations.
2. Record golden fixtures for `ExamCheckpoint` (mutable resume state) and `FirstAttemptEvent` (immutable independent first attempt). Preserve all IDs, event identity, content hash, schema version and user-visible "ungraded" values.
3. Define serialization and error invariants in [CONTRACTS](../CONTRACTS.md) and [ADR-027](../27-stack-architecture-compatibility-and-implementation-gates.md); failures must preserve data and block misleading saved/graded UI.
4. Preserve export and restore of the existing LEARN localStorage payload. Test valid, corrupt, empty, older-version, duplicate and cross-tab cases before changing any durable store.

## G2: Web application (React/Vite/TypeScript)

1. Introduce `apps/web/` and a pinned package-manager lockfile in its own PR. Extract a pure TS domain package that does **not** import React, Phaser, Dexie, Capacitor or Supabase.
2. Port one full LEARN mission and one EXAM task using adapters rather than two scoring engines. Preserve keyboard navigation, focus management, Finnish diacritics and accessible text alternatives.
3. Migrate persisted LEARN state to Dexie/IndexedDB with a **tested idempotent migration**, rollback/export story, quota failure and eviction notice. Web IndexedDB is not guaranteed permanent storage.
4. Add service worker and optional downloadable offline packs **after** validated content ownership, rights and caching policy. Do not cache 2–3 GB by default or update the running exam mid-attempt.
5. Verify original vs new UX with contract/unit tests, Playwright Chromium/Firefox/WebKit, real mobile media/mic permissions and lost-ACK simulations. Keep the legacy app until these pass.

## G3 / G4: buildable Android shell and media packs

1. Create an actual Capacitor + Gradle app; compile Kotlin Room and media plugins. A source-only `native/android/prototype/` folder is **not** proof of build or Play compatibility.
2. Make the native Room `@Transaction` one durable operation per commit. No JS callback inside a native SQLite transaction. Export Room schemas to source control and test version upgrade plus recovery after process kill.
3. For media, strictly validate `packId` and decoded relative paths, licensed manifest and SHA. An installed **install-time** pack uses Android `AssetManager`; do not assume it shares lookup semantics with fast-follow/on-demand.
4. Before handling licensed large assets, use a legal **synthetic** >1 GB test asset pack. Build signed AAB, install from Play internal testing, check packed size and disk headroom, test seek, captions, audio focus, airplane mode, rotation, process kill and native video view.
5. Run shared golden fixtures on real Room and Web IndexedDB. Never call the platforms compatible solely because TypeScript or Node unit tests are green.

## G5 / G6: game and release

- Phaser manages 2D game world/NPC scenes only. Accessible DOM remains primary for text and exam answers; reduced motion and non-game fallback are required.
- Keep LEARN hints and first-attempt evidence separate from EXAM; show no training keys until submit. No unreviewed writing/speaking "official YKI" grade.
- Before Web or Play production release require [RELEASE](../RELEASE.md), [SECURITY](../SECURITY.md), [CI gates](../operations/CI-QUALITY-GATES.md), Finnish S2 review and verified per-asset distribution rights.

**Official references:** [Vite production base/asset paths](https://vite.dev/guide/build), [Android offline-first](https://developer.android.com/topic/architecture/data-layer/offline-first), [Room migrations and exported schemas](https://developer.android.com/training/data-storage/room/migrating-db-versions), [Capacitor Android plugins](https://capacitorjs.com/docs/android), [Play Asset Delivery install-time](https://developer.android.com/guide/playcore/asset-delivery/integrate-java), [MDN storage eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).
