# Testing and evidence policy — Hospodar YKI

**Principle:** tests are evidence only for scenarios they actually execute. A green Markdown validator is **not** proof that an Android app builds, Finnish content is correct or a digital YKI exam is official.

## Runnable commands (from repository root)

| Scope | Exact command | What it proves / does not prove |
| --- | --- | --- |
| Browser JS syntax | `node --check app/core.mjs && node --check app/app.mjs && node --check app/exam-core.mjs && node --check app/exam.mjs && node --check app/attempt-storage.mjs` | Syntax, not user journeys |
| App unit/integration | `node --test app/tests/*.test.mjs` | Present unit/content and in-memory storage behavior, not all browsers |
| Portable V2 commands and golden fixtures | `node --test packages/contracts/tests/session-v2.test.mjs` | In-memory portable JS commands and fixtures; separate real Chromium IndexedDB V2 integration. NOT Kotlin parity |
| TypeScript AST import boundaries | `npm ci --prefix tools/architecture --ignore-scripts --no-audit --no-fund && npm test --prefix tools/architecture` | Real AST dependency/static API checks; not a compiler typecheck or Android build |
| New levels, tense, clock, imagery folders | `python3 scripts/validate_curriculum_coverage.py && python3 -m unittest discover -s scripts/tests -p 'test_validate_curriculum_coverage.py' -v` | Required A1.3–B2.1 sequence, original exercise/answer alignment and image folder boundaries; **not human language review** |
| Shared contract unit | `node --test packages/contracts/tests/*.test.mjs` | JS in-memory reference semantics, **not Kotlin parity** |
| Stack design/ADRs | `python3 scripts/validate_architecture_decision.py && python3 scripts/validate_android_game_architecture.py && python3 scripts/validate_reliability_architecture.py` | Requirement snapshots, **not deployed stack** |
| CI trigger paths and live normative content paths | `python3 scripts/validate_doc_integrity.py && python3 -m unittest discover -s scripts/tests -p 'test_validate_doc_integrity.py'` | Detect stale non-triggering workflow filters and obsolete educational doc paths; **not** runtime integration proof |
| Reusable-domain dependency direction | `python3 scripts/validate_architecture_boundaries.py && python3 -m unittest discover -s scripts/tests -p 'test_validate_architecture_boundaries.py'` | Static module boundaries for current JS and future TS pure packages; not runtime Android parity |
| Evolving scientific method catalog | `python3 scripts/validate_learning_methods.py && python3 scripts/validate_learning_books_bridge.py && python3 -m unittest discover -s scripts/tests -p 'test_validate_learning_methods_growth.py'` | No silent loss, consistent method citations and matching effectiveness IDs; does not prove causal efficacy |
| AI docs/invariants | `python3 scripts/validate_ai_docs.py` | Required files/links/document ownership + source baseline references |
| Physical folder, all media membership and references | `python3 scripts/validate_folder_layout.py && python3 -m unittest discover -s scripts/tests -p 'test_validate_folder_layout.py'` | Catch broken paths, orphan or duplicate OGG/MP3/WebM, invalid source ownership; not audio rights or teaching quality |
| AI docs validator tests | `python3 -m unittest discover -s scripts/tests -p 'test_validate_ai_docs.py'` | Validator handles valid and invalid fixtures |
| Browser IndexedDB | See shell example below | **Real Chromium IndexedDB V1 and isolated V2** durability, event uniqueness and recovery subset, not Room/device |

### Real Chromium IndexedDB smoke

The existing [GitHub Actions workflow](../.github/workflows/validate-app-mvp.yml) runs this and selects `google-chrome` or `chromium`:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
# in another terminal with Chrome/Chromium installed:
CHROME_BINARY=google-chrome node scripts/run-chromium-idb.mjs
```

Replace `google-chrome` with an installed Chromium binary if necessary; test harness errors should remain failures, not be replaced with mocked browser success. See [browser fixture](../app/tests/atomic-idb-browser.html).

## Minimum change-to-test mapping

| Modified area | Mandatory checks for reviewers |
| --- | --- |
| `app/` display or navigation | Syntax, `app/tests`, browser smoke/manual keyboard check where UI impact exists |
| `app/attempt-storage*` | Unit + **real Chromium** IndexedDB concurrent writers, retry, duplicate IDs, quota/write failure |
| `packages/contracts/` | Contract tests + fixture compatibility; Kotlin parity **blocked** until native build exists |
| `learning/`, `assets/audio/`, `assets/video/`, `sources/` | Relevant content/audio validators, human Finnish/rights sign-off; never import unknown rights |
| `native/android/prototype/` | JS contract tests only are **insufficient**; compiled Android tests needed to claim implementation |
| ADR, `AGENTS.md`, `docs/` | AI-doc validator + applicable architecture validators |
| Platform/cloud/security | Secrets/privacy/RLS + threat model and actual integration/E2E checks before enabled release |

## Failure-path acceptance matrix

Critical regressions to demonstrate as implementation advances: duplicate same event ID with divergent body fails; concurrent writers do not silently overwrite; lost ack matches **event ID/payload**, not snapshot alone; write failure prevents Next/Finish; updated content hash does not rewrite an active attempt; ungraded speaking/writing remains ungraded; denied mic/offline and low disk degrade honestly; unauthorized media/paths are rejected. Target cases [C-01…C-10](27-stack-architecture-compatibility-and-implementation-gates.md); release cases [G0…G6](25-implementation-vertical-slice-roadmap.md).

## Evidence levels

1. **STATIC:** docs/schema/lint pass (architecture is internally described).
2. **UNIT:** isolated functions and mocked/in-memory repositories pass.
3. **INTEGRATION:** real browser IndexedDB or actual platform IO passes.
4. **E2E/DEVICE:** real application, installed Android package or multiple browser engines pass on representative environments.
5. **RELEASE:** signed distributed artifact, migrations, observability, security/accessibility, media rights, performance, support and recovery are verified.

Report `PASS`, `FAIL`, or `NOT RUN` **per command** with relevant logs/CI URL. The current repo has **no Android Gradle build or instrumented test suite**. Green Node or Python checks cannot promote its Kotlin prototypes to device verified.

## When tests fail

Reproduce before patching; preserve a minimized failing fixture, fix the cause, rerun the specific test and affected neighboring tests, report what remains unverified. Never lower acceptance criteria, skip checks, blanket-ignore exceptions or redefine the assertion to hide failures.

**CI hardening:** [path-filter ownership and current release gates](operations/CI-QUALITY-GATES.md) explains which checks are real now; do not promote a future scaffold to a passing build. GitHub Action dependencies are pinned to upstream-verified commit SHAs and require reviewed upgrades.
