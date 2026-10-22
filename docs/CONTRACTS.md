# Cross-platform contracts — truth, invariants, migration boundaries

**State:** target contract defined; only pieces exist in runnable JS. [ADR-027 §3](27-stack-architecture-compatibility-and-implementation-gates.md) owns canonical target semantics. Do not mistake examples here for published V2 runtime types.

## Existing sources and honest boundaries

| Source | Currently works as | NOT yet equivalent to |
| --- | --- | --- |
| [app/attempt-storage.mjs](../app/attempt-storage.mjs) | `EXAM_COMMIT_PROTOCOL=1`; Web IndexedDB event + checkpoint transaction, revision, retries | Immutable first-answer repository and multi-platform canonical V2 |
| [app/attempt-storage.d.ts](../app/attempt-storage.d.ts) | Type declaration for existing JS prototype | A shared generated TypeScript/Kotlin contract |
| [packages/contracts/src/index.mjs](../packages/contracts/src/index.mjs) | Immutable first-answer commands/in-memory reference & tests | Persisted Android/Web canonical first-attempt storage |
| [packages/contracts/src/media.mjs](../packages/contracts/src/media.mjs) | Media identity/rights policy | Installed native PAD pack player |
| [native prototype](../native/android/prototype/README.md) | Room DAO/Capacitor plugin/Media3 sources | Compiled, instrumented, device-verified Android app |

## Entity distinction (MUST)

- **ExamCheckpoint:** mutable drafting, current question, optional practice timer and resumed session state. A snapshot is **not** independent evidence or grade.
- **FirstAttemptEvent:** immutable evidence of first independent answer against stable `itemId + itemVersion + contentHash`; prevents re-grading after hints.
- **RepairEvent / TransferEvent:** follow-up corrections and new-context production, linked to original item; never overwrite first attempt.
- **MediaAsset:** published `mediaId + version + hash + packId + path + redistribution rights`; not part of user event store.

Do not expose answer keys before submission. Mark productive free-text and speech as `ungraded` unless review/calibration explicitly establishes otherwise. Preserve editorial provenance and language metadata.

## Atomic command rules for G1 implementation

A single versioned, JSON-serializable `commitAttempt(command)` invocation goes to Web IndexedDB readwrite transaction or Android Capacitor plugin calling one Room `@Transaction`. Never pass JavaScript callbacks over the native bridge. Define:

1. `commandId`, `sessionId`, `expectedRevision`, exact event kind/body, `itemId/version/hash` and proposed next snapshot.
2. Canonical cross-runtime payload encoding and stable fingerprint (UTF-8, Unicode normalization policy, numeric/null/missing semantics and deterministic key ordering).
3. Idempotency: exact command retry returns original receipt; same ID with changed body returns `IDEMPOTENCY_CONFLICT`.
4. CAS: one winner per expected revision; stale writer → `REVISION_CONFLICT`; no lost update.
5. Crash atomicity: event, snapshot and derived progress/outbox committed together **or not at all**.
6. Ambiguous ACK recovery: read committed `commandId` (**event ID**), fingerprint and revision; a matching snapshot alone is **not sufficient**.
7. Portable errors (`INVALID_COMMAND`, `PROTOCOL_MISMATCH`, `IDEMPOTENCY_CONFLICT`, `REVISION_CONFLICT`, `QUOTA_OR_DISK_FULL`, `READ_FAILED`, `SAVE_FAILED`, `ASSET_UNAVAILABLE`, `HASH_MISMATCH`) must not be flattened by Kotlin bridge.
8. Persist before navigation/success. On failure, show retry/export and preserve in-memory draft without claiming durable save.
9. Versioned migrations need backup/export, forward/rollback path, repeatable restart semantics, content pinning and test fixtures.
10. Android Room/SQLite and Web Dexie/IndexedDB are separate adapters sharing one domain contract—not independent domain models.

**Current gap:** exact protocol V2 and shared Kotlin/JS golden fixtures are specified in [ADR-027](27-stack-architecture-compatibility-and-implementation-gates.md), **not implemented**. Existing checkpoint recovery and Kotlin errors require separate integration fixes. Do not change exported V1 shape without migration/version negotiation.

## Evidence to accept G1

- Golden fixtures in a future `packages/contracts/fixtures/`: valid, malformed, legacy, Unicode, numeric boundary, stale revision, duplicate ID and divergent payload.
- A single authoritative schema with JS runtime validators and Kotlin parity test; no hand-copied competing definitions.
- Tests C-01…C-06, fault injection (quota, kill, lost ACK) and migration across content version/hash.
- Review [TESTING](TESTING.md), [SECURITY](SECURITY.md) and [RELEASE](RELEASE.md). Claim completion only when both platform implementations pass applicable tests.
