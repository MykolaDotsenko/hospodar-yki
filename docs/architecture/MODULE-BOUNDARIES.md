# Module boundaries — executable architecture fitness functions

**Status:** established for the existing JavaScript MVP; future TypeScript/Android layout remains TARGET. This document describes real, enforced boundaries and does not declare a new app.

## Physical layers, dependency direction

\`\`\`text
app/app.mjs + app/exam.mjs                (browser UI/composition)
           ├── app/core.mjs              (pure LEARN computation)
           ├── app/exam-core.mjs         (pure EXAM task/score computation)
           └── app/attempt-storage.mjs   (IndexedDB/platform adapter, NOT pure domain)

packages/contracts/src/                  (shared, framework-agnostic event contracts)
           ↑ consumed by future use cases/platform adapters; never imports UI
native/android/prototype/                (source-only plugin proof-of-concept)

TARGET: apps/web (React/Vite) ── use cases/domain ── repository interfaces
                                 └── Web Dexie adapter / native Kotlin Room adapter
\`\`\`

**One-way rule:** UI and adapters may import domain/contracts. Domain/contracts must **not** import UI code, React, Phaser, Capacitor, Dexie, Supabase or DOM/browser storage APIs. Shared domain functions should accept data and explicit time/input; do not smuggle persistence into a pure score method. Follow [ADR-027](../27-stack-architecture-compatibility-and-implementation-gates.md) and [CONTRACTS](../CONTRACTS.md).

## How it is enforced

- \`python3 scripts/validate_architecture_boundaries.py\` scans actual pure files: \`app/core.mjs\`, \`app/exam-core.mjs\`, \`packages/contracts/src\`, and any future \`packages/domain/src\`, \`packages/exam-engine/src\`, \`packages/learning-engine/src\`. **No future paths required to exist**.
- \`python3 -m unittest discover -s scripts/tests -p 'test_validate_architecture_boundaries.py' -v\` proves that attempts to reverse module direction or add framework/platform dependencies fail.
- Unconditional [source-tree CI](../../.github/workflows/validate-real-layout.yml) executes both, so file changes cannot bypass a path-scoped-only workflow.
- **AST upgrade:** `npm ci --prefix tools/architecture --ignore-scripts --no-audit --no-fund && npm test --prefix tools/architecture` parses real JS/TS syntax trees with lockfile-pinned TypeScript and checks static/re-export/dynamic imports, reverse dependencies and platform API globals. This complements the earlier Python checks.
- Static parsing still does not imply full TypeScript typechecking or Android runtime parity. At G1/G2 introduce actual TypeScript compiler, package \`exports\`, type-level dependency rules, Vite/Playwright and on-device tests **only after those builds exist**. Keep current Node+Chromium baseline until parity.

## Research and learning invariants at implementation boundary

- Research [claims and experiments](../../research/RESEARCH-PROGRAM.md) are **not** UI acceptance criteria until traceable handoff through [EVIDENCE-TO-UX](../guides/EVIDENCE-TO-UX.md), canonical requirements and tests.
- \`FirstAttemptEvent\` is not \`ExamCheckpoint\`. A learner sees a saved success state **only after** verified durable commit. Any new local-first adapter must preserve idempotency/recovery.
- LEARN feedback may be assisted after independent attempt; EXAM never reveals keys/hints before submission, and no unreviewed speaking/writing official grade is inferred.
- Keep Android-specific Room and Media3 native, Web Dexie/IndexedDB browser-specific. Avoid client-side Supabase SDK or license-gated media in the shared domain.

**Official design support:** [Android architecture separation of concerns, UDF and SSOT](https://developer.android.com/topic/architecture), [Android recommended data layer](https://developer.android.com/topic/architecture/recommendations), [TypeScript project references](https://www.typescriptlang.org/docs/handbook/project-references.html).
