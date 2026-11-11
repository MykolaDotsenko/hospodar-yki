# G2 Web: Browser storage resilience, quota diagnosis and opt-in persistence

**Date:** 2026-11-11. **Base:** `main@25f27e6fb997490133e948a1f77bed4432263a80`. **Stage:** targeted PR; verify CI before merge. Not a release gate for native Android or physical storage faults.

## User problem

The LEARN and EXAM IndexedDB stores live in the browser's origin. Without explicit user-facing inspection, learners could mistake a green "saved" checkpoint for a guaranteed backup. In the ordinary **best-effort** storage mode, browsers may evict origin data under pressure; private browsing, user-cleared data, or device loss can also remove it. Existing save errors did not distinguish quota exhaustion from ambiguous readback or competing tabs, making recovery guidance unreliable.

## Scope and engineering acceptance

1. Add a **read-only**, capability-checked StorageManager inspection on **My Data** (never request permission on mount), with verified `persisted()`, optional `estimate()`, and approximate origin-wide usage/quota. The quota is *not* the application's exclusive quota. Report unknown API results as unknown, not as "safe".
2. Offer **Request persistent storage** only as an **explicit user click**, verify the actual `persisted()` response after `persist()`; surface denied, unsupported, unverified and thrown errors without claiming a grant. No server calls, telemetry, login, external storage, new permissions at startup, and no store migration.
3. Advisory low headroom below **64 MiB** (heuristic, not a measured write limit); do not claim an estimate is a reliable prediction of success, or that persistent storage protects against user deletion, corruption, eviction from explicit browser actions or hardware failure.
4. Improve quota error mapping for DOMException / Firefox / Dexie-wrapped causes; never classify generic AbortError as disk-full. All LEARN exercise flows show actionable distinctions among quota/disk-full, stale-tab CAS and ambiguous readback. An uncertain write must not be described as definitely lost.
5. Disclose prominently: **portable JSON excludes unfinished LEARN drafts and voice bytes**. Advise the learner to finish work or copy an unsaved response before leaving on a storage failure; do not promise background sync.
6. Keep all pre-existing IndexedDB v1–v9 rows and behavior untouched; EXAM and LEARN data are not deleted or uploaded by the inspection.

## Verification

- Pure unit: `apps/web/src/storage/browserStorageHealth.test.ts` mocks unsupported browser APIs, best-effort vs persistent, estimate failures, low/unknown headroom, opt-in call count, denied/unverified/throwing requests, browser quota DOMException and wrapped error classification.
- Real Playwright: `apps/web/e2e/storage-health.spec.ts` on Chromium/Firefox/WebKit mocks browser storage manager while using the real UI, proves **no implicit persist()**, one request per click, verified grant, denial, low quota, unsupported API, and normal navigation.
- Existing full G2 CI: TypeScript, Vitest, production build, baseline LEARN/EXAM Playwright, axe, docs/traceability/source-tree/ADR gates.
- **Not run / not proven**: actual low disk, real OS kill before 650ms debounce, browser eviction, storage policy in private mode across all browser versions, native Android Room/process death, cloud backups, full 4-skill YKI accuracy, S2 editorial approval or learning efficacy.

## Rollback

Source-only changes. No IndexedDB schema bump, no new tables and no migration. Reverting the UI removes the inspection and request control while retaining every learner/exam row. Do not erase existing browser data on rollback.
