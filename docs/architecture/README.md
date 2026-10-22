# Architecture decisions — start here

This is a **human navigation guide**, not a second contract registry. Authoritative decisions remain in their existing ADR files; source code and real tests determine what runs. This avoids breaking historic deep links and evidence references when the documentation evolves.

**Executable dependency rules:** [MODULE-BOUNDARIES](MODULE-BOUNDARIES.md) explains current reusable JavaScript domain and future TypeScript packages, enforced in CI without an unnecessary new application scaffold.

## Current implementation versus accepted target

| Question | Running code (verified source, not a release claim) | Approved target | Authority |
| --- | --- | --- | --- |
| User interface | `app/` native ES modules + HTML/CSS | React 19 / strict TypeScript / Vite; Phaser only in game scenes | [ARCHITECTURE](../ARCHITECTURE.md), [ADR-022](../22-optimal-stack-and-architecture-adr-2026-10.md) |
| Web storage | LEARN localStorage; EXAM IndexedDB checkpoint | Dexie/IndexedDB durable learner evidence; tested migrations | [ADR-024](../24-reliability-hardened-architecture-web-android.md) |
| Android | Kotlin prototypes, **no compiling Gradle app** | Capacitor + Room/SQLite atomic critical writes | [ADR-024](../24-reliability-hardened-architecture-web-android.md), [ADR-027](../27-stack-architecture-compatibility-and-implementation-gates.md) |
| Offline media | Real OGG/MP3/WebM source assets; no published PAD | Licensed selective PWA packs; Android install-time Play Asset Delivery and Media3 | [ADR-023](../23-android-offline-game-and-3gb-media-architecture.md) |
| Data protocol | `app/attempt-storage.mjs` and `packages/contracts/` are distinct prototypes | One versioned cross-platform protocol; checkpoint !== first-attempt evidence | [CONTRACTS](../CONTRACTS.md), [ADR-027](../27-stack-architecture-compatibility-and-implementation-gates.md) |
| Cloud | None required for current offline learning | Supabase EU region **optional and opt-in** after security / RLS / GDPR checks | [ADR-022](../22-optimal-stack-and-architecture-adr-2026-10.md) |

## Decision lifecycle — do not confuse accepted with built

- **ADR-022 — ACCEPTED TARGET:** modular TypeScript local-first application and optional cloud; describes architectural choice, not deployed modules.
- **ADR-023 — ACCEPTED TARGET:** both Web/PWA and Android 2D game, PAD delivery. Its early Android IndexedDB recommendation is **SUPERSEDED IN THAT ONE AREA** by ADR-024; rest of the decision remains relevant.
- **ADR-024 — ACCEPTED TARGET, CURRENT AUTHORITY FOR PERSISTENCE:** Web Dexie/IndexedDB; Android Kotlin Room/SQLite for critical progress.
- **ADR-025 — ACTIVE IMPLEMENTATION ROADMAP:** [G0–G6 sequence](../25-implementation-vertical-slice-roadmap.md), not an assertion that any gate is fully passed.
- **ADR-026 — HISTORICAL IMPLEMENTATION EVIDENCE:** [the source slice](../26-atomic-exam-and-media-implementation-2026-10.md); inspect today’s code and current CI for actual status.
- **ADR-027 — ACCEPTED TARGET, CURRENT INTEGRATION AUTHORITY:** versioned contracts and release/verification gates; overrides conflicting older integration language.

A newly accepted decision must describe **Context → alternatives and trade-offs → Decision → Consequences → Status → Supersedes → Verification**. Do not silently alter an accepted historical decision to reverse it: add a concise new ADR and mark the affected older decision or subsection as superseded, with a link in both directions. The status of a decision is not the implementation status of the feature.

For concise implementation boundaries see [ARCHITECTURE](../ARCHITECTURE.md). For actual next steps see [Web/Android migration guide](../guides/WEB-ANDROID-MIGRATION.md). For release evidence see [CI quality gates](../operations/CI-QUALITY-GATES.md).

**Methodology:** [Microsoft architecture decision records](https://learn.microsoft.com/en-us/azure/well-architected/architect-role/architecture-decision-record), [Android architecture](https://developer.android.com/topic/architecture), [Diátaxis](https://diataxis.fr/).
