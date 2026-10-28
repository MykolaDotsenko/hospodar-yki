# R11 — офлайн-стійкість навчання, збережені відповіді й безпечна міграція LEARN

**Later implementation update 28.10.2026:** [real manual local V1 JSON restore](../../app/learn-backup.mjs) now uses R11 strict preflight indirectly in active Web LEARN Progress page, alongside [19 Node tests](../../app/tests/learn-backup.test.mjs) and [real browser UI test](../../app/tests/learn-backup-browser.html). It does not migrate to experimental V2, compile Android or make locally stored data permanently safe; no learning benefit established. The original dated research status below remains a historical snapshot.

**Перевірено 28.10.2026. Власник:** research/architecture; app/ + packages/contracts/ + native/android/ for eventual implementation. **Status:** SELECTED PRIMARY TECHNICAL EVIDENCE + SOURCE AUDIT + ISOLATED READ-ONLY PREFLIGHT (22 Node tests). NOT AN ACTIVE LEARN DATA MIGRATION; no AAB or real 3–4GB offline pack; no actual loss-of-power Android/phone test; no adult Finnish causal study. Adults Ukrainian-L1 A1.3–B2.1, LEARN and independent EXAM 2027.

**Canonical scope:** [12-study R11 programme](../29-twelve-product-research-studies-execution-2026-10.md), existing [ADR-024](../../docs/24-reliability-hardened-architecture-web-android.md), [G1 implementation evidence](../../docs/architecture/G1-IMPLEMENTATION.md), [migration guide](../../docs/guides/WEB-ANDROID-MIGRATION.md), [R10 accessibility](../ux/22-r10-accessibility-mobile-qa-2026-10.md), [R06 independent review scheduling](../pedagogy/33-r06-transparent-adaptive-finnish-learning-2026-10.md), [R05 curated rights](../../sources/audio/R05-MULTITALKER-MATERIAL-INTAKE-2026-10.md). Not a replacement architecture or second study-method registry.

## 1. Key research question and architectural judgment

Can an adult learner resume the exact sequence **independent first Finnish answer → feedback → assisted repair → due review → unseen day14/30 transfer** without silent loss/duplication after device restart, two-tab race, quota failure, failed transaction or missing licensed content? Can EXAM retain a distinct exact checkpoint receipt without leaking hints or inventing 2027 scoring rules?

**Measured outcomes:** error-free persistence, exact receipt lookup, deterministic conflict resolution, recovery and export, mode isolation, correct language evidence and true offline access. None of these are themselves evidence that Finnish B1 scores improved. Future learning comparison is [R01](../ux/learning-impact-evaluation-protocol.md): matched study time+curated content, blinded new Finnish writing/speaking and listening/reading after 14/30 days; NOT RUN.

**ADOPT/P0:** local-first transactional source of truth, immutable independent event identity, exact receipt after uncertain ACK, no data loss under migration, real media/version hash validation, human-usable export/retry. **ADAPT/P1:** Web persistent-storage request with user consent and storage-risk explanation; evaluate strict durability for infrequent critical commits separately from keystroke drafts. **REJECT/P0:** silent legacy filter/truncation, last-writer-wins merges of first attempts, automatic 4GB PWA prefetch, synthetic audio fallback scored as real listening, guaranteed-persistent-browser-storage marketing or claiming Kotlin sources equal built Android.

## 2. Research evidence: original platform sources, observed implementation and caveats

| ID / level | Primary source and verifiable finding | Hospodar action / limit |
|---|---|---|
| REL-01 official Android | [Offline-first data layer](https://developer.android.com/topic/architecture/data-layer/offline-first): local database should be the read source of truth, writes to critical user data locally first and optional later network sync. | **ADOPT:** future Room Android, transactional IndexedDB Web behind portable command model; no cloud AI requirement. Not an experiment measuring second-language efficacy. |
| REL-02 official Android | [Data layer](https://developer.android.com/topic/architecture/data-layer): repository owns source-of-truth updates and UI observes it. | **ADOPT:** show saved success only after repository receipt; do not trust optimistic UI or unchanged snapshot. |
| REL-03 MDN Storage API | [Storage quotas, eviction and persistence](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria): best-effort storage can be evicted, persistent request may be denied, private browsing differs and user can delete any stored data. | **ADOPT:** backup/export, quota recovery, honest browser-local notice; navigator.storage.persist is NOT a guarantee. |
| REL-04 MDN IndexedDB | [IDB durability](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/durability) and [transaction options](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction): strict prioritizes persistent medium, relaxed can acknowledge OS buffers; UA/browser compatibility caveats. | **EXPERIMENT:** compare strict for first/last critical commit vs default for frequent draft, on actual browsers; neither prevents drive destruction or user deletion. |
| REL-05 MDN IndexedDB | [Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB): transaction COMPLETE not mere request success, abort/upgrade blocking, relaxed durability caveat. | **ADOPT:** existing V1/V2 receipt and CAS, test exact eventId on ACK loss, fail closed on conflict. |
| REL-06 official Android Room | [MigrationTestHelper](https://developer.android.com/reference/androidx/room/testing/MigrationTestHelper): create old DB and validate schema migration on real driver; retain old data checks separately. | **ADOPT:** compiled Kotlin parity+Room migration/rollback tests before Android release; existing Kotlin is only source prototype. |
| REL-07 official Google Play | [Size limits](https://support.google.com/googleplay/android-developer/answer/9859372?hl=en): base or feature module 500MB each; **single asset pack 1.5GB compressed; aggregate base+features+install-time asset packs 4GB compressed**; separate on-demand/fast-follow cap 30GB not equivalent to full first-start offline. | **ADOPT:** current 3.6GB nominal R05 pack proposal must stay below real compressed 4GB cap with headroom. No AAB was built. |
| REL-08 official Google PAD | [Play Asset Delivery guide](https://developer.android.com/guide/playcore/asset-delivery): update/install of install-time packs needs extra disk, guide notes about twice pack size, assets can change availability/location across update. | **ADOPT:** actual Play-installed airplane, update, low disk, pack-integrity and license tests. Avoid assuming pack files are writable durable user progress. |
| REL-09 Google PWA | [Caching](https://web.dev/learn/pwa/caching): service-worker caches selected URLs, extra media wastes bandwidth/disk and can serve stale content. | **ADAPT:** optional bounded Web packs with release manifest; never cache entire 4GB Android distribution on the Web by default. |
| REL-10 Chrome official | [Cache strategies](https://developer.chrome.com/docs/modern-web-guidance/guides/performance/performance): static hash-versioned immutable assets vs HTML and runtime freshness; bound cache sizes. | **ADAPT:** version every learning item/key and audio together; no mid-exam silent hot swap. |
| REL-11 actual repo V1 | [EXAM IndexedDB](../../app/attempt-storage.mjs) and [real Chromium test](../../app/tests/atomic-idb-browser.html) have atomic snapshot/event CAS, exact receipt and ACK recovery. | **KEEP:** current Web EXAM has meaningful browser tests, not hardware-power cycle or compiled Android. Don't replace needlessly. |
| REL-12 actual repo V2 | [Portable command](../../packages/contracts/src/session-v2.mjs) and [V2 experimental IndexedDB](../../app/session-v2-idb.mjs), [G1 record](../../docs/architecture/G1-IMPLEMENTATION.md) have independent first-attempt keyed by itemId/version/hash, receipts and CAS; not active LEARN/EXAM. | **ADAPT:** gated Web V1→V2 only after exact backup/migration test and Android Kotlin parity; no silent cutover. |
| REL-13 actual repo LEARN | [core.mjs](../../app/core.mjs) readState filters invalid cards/retention/attempts and caps historical lists to 120/160; [app.mjs](../../app/app.mjs) persists JSON via localStorage and handles failed write as volatile mode. | **ACTUAL R11 PROTOTYPE:** preflight checks against the shipped reader and refuses any potentially lossy conversion. No learner data touched. |
| REL-14 EU privacy | [EU GDPR data minimization](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/principles-gdpr_en): process only necessary learner information. | **ADOPT:** no automatic uploads of speaking/audio/answers; no private response snippets in migration diagnostics. |
| REL-15 W3C a11y | [WCAG 2.2](https://www.w3.org/TR/WCAG22/): understandable, perceivable state and keyboard access; normative not learning-effect evidence. | **ADOPT:** correct recovery copy for failed save, absent audio/microphone, accessible export/restore, mode separation. |

**Research validity:** mostly official standards, architecture documentation and directly inspected code; this is not 15 novel clinical/L2 trials. It is not a hardware failure audit or production performance benchmark. No throughput, crash resistance percentages or Finnish-learning gains have been measured.

## 3. Current honest implementation inventory

| Component | Implemented, verified to date | Open blocker |
| --- | --- | --- |
| LEARN Web | LocalStorage V1 state: attempts, cards/due, errors, four-skill diagnostics, delayed ungraded retention. | No atomic multi-tab durable event identity; browser evictable; old reader can filter/slice, never blindly import. |
| EXAM Web | IndexedDB V1 single transaction, revision check, stored event receipt, lost-ACK exact evidence; real Chromium CI. | Not a power-loss test; official YKI 2027 fidelity remains independently unknown. |
| Experimental shared V2 | Portable JS command/receipt and separate IndexedDB transaction with uniqueness, idempotence and item contentHash; real Chromium CI. | Not wired to live app, no Kotlin binary parity or migration. |
| Android | Room/Media plugin Kotlin prototype, no real APK/AAB. | No Gradle/Capacitor shell, PAD installed test, schema migration tests or 3–4GB assets. |
| Web offline | Some locally served media, local browser data; no verified complete app shell+content cache offline. | User-selected cache/versioning, eviction/space tests, no automatic huge Web pack. |

**Data risk:** a finished session without a committed receipt, a completed repair overwriting the first-answer evidence, a missed due review after timezone change or a caption-only task graded as audio comprehension must be treated as correctness bugs, not an engagement metric.

## 4. Real R11 reference code and 22 tests — strictly NOT a migration

[Migration preflight](../../app/r11-legacy-migration-preflight.mjs) + [22 focused Node tests](../../app/tests/r11-legacy-migration-preflight.test.mjs). Accepts an exact raw localStorage V1 JSON string supplied by a future explicitly authorized caller; the module **does not read storage, write data, export or migrate**. It returns metadata-only statuses and record counts, never learner answers:

- **empty:** no source, do not invent historical completion.
- **blocked:** malformed JSON/root, unsupported V1 version, unexpected root/card fields, invalid card day/stage, invalid historical entry, unsupported retention item, or >120/160 history cap that old readState would truncate.
- **ready:** structural preflight only; a future separate feature needs exact original byte-preserving user export, reviewed field mapping, atomic new-storage commit, exact receipt, equality of all counts and content, and rollback validation.
- Compare the parsed source with actual shipping readState() to identify **would-drop-data**. Never normalize Finnish ä/ö or erase free writing during migration.
- Provides deterministic UI copy for confirmed/uncertain/failed/media-missing, but **a UI copy function cannot verify whether storage wrote successfully**. Verified receipts remain the sole proof.
- The input size limit is JavaScript string-code-unit length, not measured disk bytes. JSON.parse cannot detect repeated keys; ready is not a checksum, not a secure export and not an actual migration. No credentials/answers are printed by results.

**No active app imports this module.** All 22 tests are static Node unit scenarios, not real migration E2E. It is safe to merge as a future gate without changing users' saved data.

## 5. Controlled reliability test protocol: 27 failure conditions (NOT RUN AS A FULL BATTERY)

| Group | Fault injection / real-device case | Required result |
| --- | --- | --- |
| 1–5 normal writes | First answer, repeated submit, reload, second tab, stale revision | One immutable first attempt per item/content version, no double mastery or lost answer. |
| 6–9 uncertain commits | Lost ACK after commit, duplicate commandId changed payload, identical snapshot but different eventId, next tap before async save | Recover exclusively by exact matching durable receipt; fail closed and offer retry/export otherwise. |
| 10–14 browser storage | QuotaExceededError, IndexedDB denied, Safari/private-session eviction, low disk, forced storage clear | No false saved claim; user sees practical export/recovery path. |
| 15–19 migration | Empty old V1, healthy old V1, invalid card, oversized history, unknown field, corrupted JSON | Source raw backup exact, no silent drop/truncation, verifiable import and rollback. |
| 20–23 content/offline | Airplane cold-start, missing/revoked media/license, bad audio SHA, PAD update under low disk | No fabricated completed listening or YKI grade; verified content only. |
| 24–27 Android/mobility | Room upgrade, process kill mid-transaction, Finnish DST/timezone, mic revoked/phone sleep | No wrong due date, no duplicate first attempt, honest ungraded recording state. |

Add export-to-fresh-device restore and identity-aware optional cross-device sync only when that feature exists. Conduct scenario-by-scenario in Chrome/Firefox/WebKit, mid-range physical Android with installed AAB, and Android Room instrumentation; cite logs, build/version, device, replayable steps and actual failure rate. **None of the Android cases have been run.**

## 6. Storage and media: full-offline 3–4GB is an upper allowance, not a quota to fill

R05 earlier nominal draft: 160 MB base + 1100 MB core audio + 640 MB advanced audio + 930 MB video + 490 MB visual + 280 MB exam = **3600 MB estimated**. Keep a **nominal 400MB headroom** versus 4GB and verify **actual compressed AAB/install-time distribution**, because MB decimal, compression and packing vary. Each install-time asset pack must meet 1.5GB independently; Web must not assume native Play installation guarantees. Google warns large install-time packs require substantially **more free installation/update disk than compressed transfer size**. Some optional content may not be redistributable and must never be bundled until human S2/licensing approval.

All signed content/voice packs must align taskVersion+contentHash+mediaHash+approved rights and have a text-only fallback where pedagogically valid. A transcript **before** independent audio response changes listening evidence to supported/ungraded, it does not make listening comprehension "failed". Learner answers/storage and downloaded content assets belong to **different data lifecycles**; deletion of media cache should not delete first attempts.

## 7. Proposed R11 acceptance gates and next owner

1. Verified source backup before V1→V2; raw Finnish unchanged.
2. Unknown fields and older/newer versions fail closed, not silently reset.
3. No capped-history truncation on migration and no accidental loss of ungraded answers.
4. Exact eventId/itemVersion/contentHash, optimistic revision CAS and unique first attempts.
5. Guided repair does not rewrite independent first-answer score.
6. Actual IndexedDB transaction oncomplete before saved/next, lost ACK receipt reconciliation only.
7. Test two concurrent tabs, failed write/retry, duplicate command mismatch.
8. LocalStorage and IndexedDB eviction/quota user-visible warning + usable export.
9. Cross-format Web/Android parity verified after compiling Kotlin, not assumed.
10. Room migration validated with real exported schemas and existing data rows.
11. Web offline app shell and selected media packs work after browser restart, with quota policy explained.
12. Android Play-installed offline install-time packs actually load in airplane mode, within 4GB limits and 1.5GB each.
13. Audio missing/hash mismatch/revoked rights blocks audio-only score, user gets supported alternative.
14. All four skills LEARN and high-fidelity EXAM evidence kept separate.
15. User writing/voice privacy, no forced cloud or AI evaluation.
16. EU/privacy and WCAG status feedback/export reviewed for accessible operation.
17. P95 latency, cold start and free disk measured only after real device build, no fabricated benchmark.
18. Full 27 failure matrix with failures reported, rollback and a separate app feature PR.
19. Any efficacy study uses matched pedagogy/time, independently new task and blind day14/day30 metrics.
20. Green research/Node tests are not a Play release gate on their own.

**Next production step:** implement real export/restore and LEARN migration using existing V2 contract, old V1 backup, exact receipt and preserved histories in a separately tested production PR; follow with real Room, Kotlin fixture, PAD and UI tests. **Next research workstream:** R12 per canonical roadmap. No claims of 100% durability or B1 success from this research package.
