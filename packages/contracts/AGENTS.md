# Shared domain contracts — scoped agent instructions

Follow [root AGENTS](../../AGENTS.md), [canonical contracts](../../docs/CONTRACTS.md), [ADR-027](../../docs/27-stack-architecture-compatibility-and-implementation-gates.md) and [module dependency rules](../../docs/architecture/MODULE-BOUNDARIES.md).

- Own stable IDs, validated versioned commands, media/rights contract, idempotent \`FirstAttemptEvent\` semantics and portable fixtures; do **not** treat exam draft \`ExamCheckpoint\` as evidence of independent recall.
- The shared contract package must not import app screens, browser storage, Android/Kotlin plugins, React, Phaser, Dexie, Supabase or Node-only runtime APIs. UI and adapters depend **on** contracts, never the reverse.
- Any schema/identity/payload change needs explicit migration, backwards compatibility, duplicate-event conflict tests and preserved receipt behavior. JS in-memory tests do **not** prove Room/Web parity.
- Run \`node --test packages/contracts/tests/*.test.mjs\`, \`python3 scripts/validate_architecture_boundaries.py\` and its Python tests from the root. Report exact results and native NOT RUN as appropriate.

## Portable V2 code

The file `src/session-v2.mjs` and [golden fixtures](fixtures/v2-golden.json) define the current portable JS V2 model. The real Web exam still persists V1 snapshots in IndexedDB. Keep FirstAttemptEvent distinct from mutable checkpoints. Do not silently migrate legacy data or claim Kotlin parity; see [G1 reality](../../docs/architecture/G1-IMPLEMENTATION.md).
