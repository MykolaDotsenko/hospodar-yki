# Execution plan: G2-e Web v1 LEARN recovery from exported JSON

- **Date / owner:** 2026-11-07 / implementation agent, repository owner review
- **Status:** IN_PROGRESS
- **Baseline main SHA:** `e44c6f7fb2376b5a35379085904d10c8c4492ffa`
- **Requirements:** LEARN-16, WEB-07, QL-08; docs/SECURITY.md, docs/CONTRACTS.md, G2-e
- **Scope:** NEW React Web app, verified *LEARN-only* recovery from its own v1 `My data` JSON export. Do not modify the legacy app, EXAM, voice bytes, Android, or cloud.

## Problem and acceptance

The Web app can export LEARN and EXAM records but cannot ingest that export. Importing directly would be dangerous: count-only verification, lossy V1 readers, two separate IndexedDB databases (no atomic cross-DB restoration), and voice receipts with no backed-up bytes.

Accept only bounded v1 Web-export files, validate **individual LEARN records** and count parity, reject V1 reader loss/unknown records, present a preview and strict scope warning, require explicit confirmation and **empty destination**, transact LEARN plus pre-existing import receipts in one Dexie transaction, perform fresh readback before reporting success, and reject concurrent edits. Never rewrite EXAM, synthesise missing audio, merge profiles, or turn ungraded production into an exam grade.

## Implementation sequence

| Milestone | Deliverable | Verification | Status |
| --- | --- | --- | --- |
| 1 | Pure `inspectWebLearnBackup` with fail-closed schema, bounds and lossless checks | `pnpm --filter @hospodar/domain test` | IMPLEMENTED; CI PENDING |
| 2 | Empty-destination transactional restore, CAS and readback | `pnpm --filter @hospodar/web test` | IMPLEMENTED; CI PENDING |
| 3 | Accessible preview, consent, warnings, errors and reload | `pnpm exec playwright test e2e/restore.spec.ts` | IMPLEMENTED; CI PENDING |
| 4 | Multi-engine CI and release decision | `validate-web-app.yml` on PR | NOT RUN |

## Decisions / limitations

- Restores **LEARN only**, including previously recorded legacy-import receipts; EXAM and voice remain untouched. Atomicity cannot be promised across independent databases. Existing EXAM records in destination are never removed.
- Export format v1 is **not signed**. Structural verification does not establish who authored the file or that every statement is truthful; never say cryptographically authenticated.
- No automatic source-file deletion, destructive overwrite, recovery of EXAM history/audio, cloud upload, migration to Android or production GDPR sign-off.
- Existing backup exports remain compatible; no DB schema change. The pre-existing `verifyDataExport` is deliberately left as a lightweight export checker, while restore requires the stricter inspector.

## Verification log

| Check | Status | Evidence |
| --- | --- | --- |
| Domain, Web unit, TypeScript, build, browser E2E | NOT RUN | Await workflow result |
| Manual physical-device and real browser quota/eviction | NOT RUN | Separate release gate |

## Rollback and remaining work

The feature is additive; revert the branch without changing storage schema. An abandoned restore cannot overwrite a nonempty new profile; if an ambiguous readback occurs, report uncertainty and inspect stored data rather than falsely claiming no write. Recovery of EXAM history requires its own separately designed transaction and audio semantics, with consent and tests. Real device/screen-reader validation and S2 review remain release blockers.
