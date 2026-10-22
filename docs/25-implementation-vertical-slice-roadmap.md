# ADR-025 — Implementation first: shared contracts and atomic command boundary

Date: 2026-10-22. **Status: partially implemented**, not an Android app.

## What is implemented now
- `packages/contracts/src/index.mjs`: strict runtime validation for immutable attempt commands; idempotency key, session revision and content version/hash; atomic `commitAttempt` API rather than unsafe callback-based cross-bridge transaction.
- `InMemoryAttemptRepository`: deterministic contract reference for tests; **not durable** and never a production exam store.
- `packages/contracts/src/media.mjs`: platform-neutral media asset identity, rights gate, provider contract. **Not** an Android player or PAD integration.
- Node tests: retry, collision, concurrency, malformed payload, media rights and identity.

## Native implementation required (not yet built)
1. Android `commitAttempt` must be a **single** Capacitor plugin call to Kotlin Room `@Transaction`, compare `expectedRevision`, insert event once, update snapshot; return idempotent result; failure must block navigation.
2. Web Dexie `db.transaction('rw', ...)` must implement the same command and contract tests with crash and quota failure scenarios.
3. Implement Android AssetManager/PAD seekable media adapter + Media3 on real Play-installed AAB and Web streaming adapter; verify subtitles, seek, background, codec and asset hash.
4. Integrate shared contracts into existing `app/exam-core.mjs` and then React/Vite migration. Existing MVP is unchanged.
5. Gate release on real device offline, process-kill, disk-full, microphone-denial, content upgrade and 2–3GB package tests.

## Architecture rule
The TypeScript domain owns learning and YKI state; React and Phaser are presentation. Kotlin is a thin platform adapter. Do not advertise this package as completed cross-platform production functionality.
