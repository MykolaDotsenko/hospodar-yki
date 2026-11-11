# G2 Web — fail-closed legacy import replay and atomic IndexedDB abort verification

**2026-11-11 · base:** `main@da828c309c0195f59edd48242730bb778cdf081b`
**Scope:** QL-08 / LEARN-16 / R11 evidence integrity, not official YKI or Android release. **Status:** code and tests on PR branch; CI must pass before merge.

## Failure analysis

A legacy import already saves the learner row and original-byte SHA receipt in one IndexedDB transaction. The post-commit readback checks learner counts, but the previous import guard allowed a *blank* previously imported learner to be imported again, potentially appending a new receipt on a retry after an ambiguous readback failure. The UI also incorrectly claimed "nothing changed" for post-commit verification failures. This is a real risk of confusing an unacknowledged write with an uncommitted write.

Diagnostic G2 v9 commits LEARN diagnostics and the next-stage draft in a single IndexedDB transaction, but tests previously verified successful commits and stale revisions, not **real transactional abort after the first write was queued**. In an offline-first app, fail-closed atomicity is central to first-attempt and evidence integrity.

## Implementation

- Legacy import refuses an already-owned learner row **even if it has zero historical records**; it also refuses pre-existing import receipts. Explicit LEARN wipe, not blind re-import, is the reset pathway.
- Read back learner record **and** matching import receipt together in a fresh read-only transaction, checking exact receipt contents and expected historical counts. Distinguish `READBACK_MISMATCH` and `READ_FAILED` from a failed write; an unexpected post-commit readback is **ambiguous**, not proof that the import did not occur.
- User-facing import errors stop saying "nothing changed" after an uncertain save, preserve legacy original data, instruct the learner to inspect progress/receipts before attempting another import, and surface disk quota failures accurately.
- No migrations, production fault switches, new telemetry, network operations, cloud backup or learner evidence format changes.

## Acceptance gates (all required)

1. `apps/web/src/storage/learnerRepository.failure-matrix.test.ts` exercises blank import replay and ambiguous after-commit readback, then intercepts real `IDBObjectStore.put/delete` with `transaction.abort()` under fake-indexeddb: no partial imported learner/receipt, no partial Diagnostic reading evidence/next-stage draft, no orphaned speaking evidence/draft. Retrying an explicitly aborted transaction can succeed exactly once; an old revision cannot replay.
2. `apps/web/e2e/import.spec.ts` injects a quota error **at receipt write after learner write** in actual Chromium/Firefox/WebKit; verifies user feedback, untouched original V1 data, and a single successful receipt on retry.
3. `apps/web/e2e/diagnostic-restore.spec.ts` injects an aborted Diagnostic next-stage draft write in actual browsers; verifies phase/evidence rollback after reload and safe one-time progression.
4. Full G2 CI: domain parity, strict TS, Vitest, build, 3-engine Playwright and axe, traceability/docs/source-tree/ADR gates. Do not claim merge on any failed/in-progress check.

## Nonclaims and follow-up

The injected aborts model real IndexedDB transaction semantics; **they are not actual low-disk hardware tests**, OS process-kill during a pending IndexedDB write, browser storage eviction, or Android Room/process-death proof. Post-commit lost-ACK recovery remains fail-closed and requires manual inspection; the app does not falsely auto-confirm an uncertain result. The legacy input JSON and user's old V1 storage remain unchanged.

## Rollback

A source-only patch with no schema change. Revert changes safely without deleting learner/import/draft stores. Reversing the replay guard is not recommended because it reopens a data-ownership hole.
