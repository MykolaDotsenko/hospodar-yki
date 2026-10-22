# Release and rollback runbook — current evidence vs future targets

**Status:** a **release checklist**, not proof that Web hosting or Android delivery exists. Read [TESTING](TESTING.md) before calling any gate passed.

## Current deliverable

The runnable asset is `app/`, a browser-local prototype served with `python3 -m http.server 8080`. It is **not** a verified production deployment. `native/android/prototype/` contains Kotlin sources, not an Android app/Gradle project. A 2–3GB media library, Play install-time packs and signed AAB do not currently exist.

## Web preview/release prerequisites (future)

1. Confirm exact commit/tag, scope, release owner, licenses and human content review.
2. Run all affected Node/Python tests and real Chromium IndexedDB tests; add E2E multi-browser and accessibility checks when React shell actually exists.
3. Before changing storage: test export/import, V1→V2 migration, incompatible content hash/version, idempotent retry, browser quota failure, offline/lost-ACK and rollback.
4. Build from reproducible locked dependencies **after** Vite scaffold exists. Keep environment secrets server-only; validate CDN caching, HTTPS, CSP and cache invalidation.
5. Smoke test LEARN and EXAM in deployed Web, simulate storage/unavailable media, record exact version and results. Observe performance/errors without recording private raw answers.
6. Roll back static assets after failure, but note that **schema/data downgrade requires a separately tested compatibility path**. Never imply that swapping a CDN file reverts user IndexedDB data.

## Android Play release prerequisites (future G3/G4)

- Create and compile real Capacitor/Gradle project, register tested Room and media bridges, pin plugin/SDK versions and export schema migrations.
- Produce a signed **AAB**; Google Play install-time **Play Asset Delivery** packs are not a single 3GB standalone APK. Verify current Play size limits, compressed device size and installation/update disk headroom (including low-storage behavior) before shipping.
- Use an authorized **synthetic >1GB** asset pack for technical validation before licensing a large real media collection. Test `packId` resolution, traversal rejection, checksum, seek/pause, Media3 video surface, subtitles, audio focus and airplane mode on a **Play-installed** device.
- Record phone/Android versions, CPU/memory/thermal/frames, Play Console/bundletool size output, installation and upgrade/downgrade results.
- Confirm mic permission denial/recovery, process kill between writes, Room schema migration, export/delete and no phantom "saved" acknowledgments.
- Review copyright/source/redistribution licenses for each published pack, GDPR/privacy/store disclosure, screen reader/keyboard/contrast/reduced motion and cross-platform parity.
- Rollback may require a compatible forward patch; Play rollback is **not** automatic user-data rollback. Protect migrations with back-compat and portable backup.

## Go/no-go matrix

| Gate | Evidence necessary | Today |
| --- | --- | --- |
| Web MVP local smoke | Browser page + unit + IDB where relevant | **PARTIAL** — current source/CI, no prod release |
| Contract migration parity | Web/Kotlin fixtures + durable fault injection | **NOT VERIFIED** |
| Android install | Gradle build + AAB + real device logs | **NOT BUILT** |
| >1GB PAD assets | Play install, hash/seek/codec measurements | **NOT VERIFIED** |
| Finnish language & media rights | Human editorial + per-asset permission ledger | **REVIEW REQUIRED** |
| Official YKI fidelity | OPH-backed evidence + explicit unknowns | **NOT AN OFFICIAL CLONE** |
| Security/privacy and recovery | Verified controls and recorded review | **NOT RELEASE VERIFIED** |

## Incident handling after production exists

Triage scope/severity; stop rollout without erasing user data; preserve sanitized logs; reproduce on pinned commit; determine if migrations/content hashes were affected; document recovery/export path and communicate user-impact truthfully; add a regression test and post-incident action. Do not promise availability/support SLOs until they are instrumented and owned.

**Related:** [roadmap](25-implementation-vertical-slice-roadmap.md) · [security](SECURITY.md) · [architecture integration](27-stack-architecture-compatibility-and-implementation-gates.md).

**Release handoff:** use the task-specific [CI and release evidence matrix](operations/CI-QUALITY-GATES.md), the [Web/Android G1–G6 migration guide](guides/WEB-ANDROID-MIGRATION.md) and [licensing boundaries](../LICENSING.md). A passed docs/path check is necessary hygiene, not permission to publish an Android binary or distribute third-party media.
