# Quality register — evidence, not vanity scores

**Updated:** 2026-10-22 · **Status:** initial known-risk register. This page is not an issue tracker, SLA or a measured "health %" report. Resolve entries only with links to commits and repeatable tests.

| ID | Risk / concrete known gap | Priority | Acceptance evidence | State |
| --- | --- | --- | --- | --- |
| Q-01 | Browser LEARN still stores progress in `localStorage` | High | Versioned IDB migration, backup/export, idempotent tests | **OPEN** |
| Q-02 | `ExamCheckpoint` and `FirstAttemptEvent` have separate JS models | High | One versioned schema/fixtures and cross-platform durable parity | **OPEN** |
| Q-03 | Browser V1 used a matching snapshot as lost-ACK confirmation; Android native still lacks verified receipt parity | High | Browser now verifies durable eventId + exact payload fingerprint; native protocol still needs compiled implementation | **PARTIAL — WEB MITIGATED** |
| Q-04 | Native Room/Capacitor media are source-only Kotlin prototypes | High | Gradle build, emulator/device transactional tests | **OPEN** |
| Q-05 | Native `packId` selection and full Media3 video surface unverified | High | Play-installed synthetic PAD, real path/seek/video + rights checks | **OPEN** |
| Q-06 | 2027 digital YKI details, free response grading and human media review incomplete | High | Verified OPH evidence, human Finnish rubric calibration, qualified rights | **OPEN** |
| Q-07 | Browser E2E across Firefox/WebKit/mobile and quota cases incomplete | Medium | Playwright suite with CI evidence | **OPEN** |
| Q-08 | No buildable Android AAB nor packaged 2–3 GB licensed content | High for release | Real Play internal testing, size/space/thermal proof | **OPEN** |
| Q-09 | Production observability, privacy/retention and rollback not verified | High for release | Approved threat/release checklist with observable tests | **OPEN** |
| Q-10 | CI path filters or active specifications reference removed content roots | Medium | [PR #37](https://github.com/MykolaDotsenko/hospodar-yki/pull/37), `validate_doc_integrity.py` + regression/CI evidence | **MITIGATED — docs/CI** |
| Q-11 | No project-wide licensing grant; media rights still per source | High for release | Maintainer-approved code LICENSE plus verified asset-level permissions | **OPEN** |

## Maintenance

One entry should name the risk, owning area, concrete next check, current status and evidence. Do not close a risk on an ADR paragraph or green static validator alone. Technical debt is addressed through small plans/PRs; link completed [execution plans](exec-plans/README.md). Product/architecture design-fit scores are not runtime SLIs.

## Future measurable signals (not yet instrumented)

- Atomic commit success/failure/latency, crash-resume integrity and backup recovery.
- Cross-platform golden-fixture agreement, unexpected schema migration failures.
- Android median/P95 playback seek latency, startup CPU/thermal, dropped frames and disk headroom.
- Finnish content human review coverage, confirmed rights percentage and task-level pedagogical quality.
- Accessible flows, offline journey success and E2E pass rate across supported devices.

No numerical targets are claimed without a reproducible benchmark, measured baseline and explicit owner.
