# G1 implementation evidence — source of truth

**Status:** PARTIAL — working portable V2 JavaScript reference plus hardened Web V1. **NOT** native parity or durable V2.
**Date:** 2026-10-23. Architecture authority: [CONTRACTS](../CONTRACTS.md), [ADR-027](../27-stack-architecture-compatibility-and-implementation-gates.md).

## What is tested today

| Boundary | Executable evidence | Scope |
| --- | --- | --- |
| Current browser EXAM | [V1 IndexedDB repository](../../app/attempt-storage.mjs) and [real Chromium test](../../app/tests/atomic-idb-browser.html) | One durable IDB transaction for checkpoint/event; optimistic revision |
| Lost-ACK recovery | `readEvent(eventId)` plus stored fingerprint/revision and current snapshot | Never infer success from an identical snapshot written by a different tab/command |
| Portable V2 reference | [session-v2.mjs](../../packages/contracts/src/session-v2.mjs) | Discriminated checkpoint, first-attempt, repair, transfer; stable sorted JSON; uniqueness and CAS **in memory** |
| Cross-language DTO candidate | [frozen JSON golden fixtures](../../packages/contracts/fixtures/v2-golden.json) and [unit tests](../../packages/contracts/tests/session-v2.test.mjs) | Node verified; Kotlin parity **NOT RUN** |
| Source-level boundaries | [TypeScript AST checker](../../tools/architecture/check-boundaries.mjs) and pinned package-lock | Detects forbidden imports, browser globals and reverse domain dependencies |
| Native Android | [Kotlin prototype](../../native/android/prototype/ExamDatabase.kt) | Source only, no Gradle or instrumented Room test, not an installed app |

**Critical distinction:** the real Web exam is still protocol V1. V2 contract/fixtures are **not** implicitly compatible with the existing `app/attempt-storage.d.ts`, nor is the Kotlin JSON serialization verified against the golden fixtures. The older native plugin lacks receipt lookup; recovery fails closed instead of claiming a save.

## Remaining G1 release-blocking work

1. Implement one durable V2 transaction (command receipt, immutable first-attempt, derived progress, session snapshot) in real Web IndexedDB and native Room, with storage uniqueness constraints.
2. Generate a buildable Android Gradle/Capacitor project. Prove matching V2 fixture bytes in Kotlin and JS, error codes, Unicode, numeric constraints and schema upgrades.
3. Provide explicit V1→V2 negotiated migration with export/backup and rollback. Never change saved V1 bytes without a no-loss test.
4. Test receipt identity after process kill/lost ACK, quota full, concurrent tabs, invalid content hash and retained historical sessions on real backends.
5. Ensure EXAM gives no hints before submission, LEARN first-try score never treats guided repair as mastery, and open answers remain ungraded unless human-calibrated.

**G1 must remain PARTIAL** until the above pass on both supported platforms. Do not claim 98/100 production readiness based on the green AST validator or in-memory reference tests.

## Architecture / documentation scale

The [main index](../INDEX.md) is the shortest starting point; [module boundaries](MODULE-BOUNDARIES.md) own dependency direction. Historical ADRs and the long product requirements remain stable with their deep links. This compact page describes implementation status only, without creating a second architecture or method registry.
