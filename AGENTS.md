# Hospodar YKI — instructions for coding agents

You are working on a **local-first Finnish/YKI learning application**: Ukrainian-language explanations; Finnish-language practice; LEARN and EXAM modes with reading, listening, writing and speaking. Optimize for reliable learning outcomes, privacy, accessibility, and verified tests—not for new frameworks or large diffs.

## First read (progressive disclosure)

1. [docs/INDEX.md](docs/INDEX.md) — which document owns which decision, and its status.
2. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — **real code** versus planned Web/Android stack.
3. [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) and [docs/TESTING.md](docs/TESTING.md) — exact available commands.
4. Read **only the task-relevant** requirements, ADRs, schemas and test files linked from INDEX; do not load the entire `docs/` or research library by default.
5. For multi-file, irreversible, security-sensitive or long-running changes use [docs/exec-plans/README.md](docs/exec-plans/README.md). Update plans with actual evidence.

## Run today (repository root)

```sh
python3 -m http.server 8080    # separate terminal; open http://localhost:8080/app/
node --test app/tests/*.test.mjs
node --test packages/contracts/tests/*.test.mjs
python3 scripts/validate_architecture_decision.py
python3 scripts/validate_android_game_architecture.py
python3 scripts/validate_reliability_architecture.py
python3 scripts/validate_ai_docs.py
```

The browser HTTP server is **not a deployment**. Node 22 is used in CI; Python 3.12 for architecture/doc checks. See [TESTING](docs/TESTING.md) for the real Chromium IndexedDB integration test. Do not claim that a test ran if you did not run it.

## Source of truth / precedence

- **Implemented behavior:** current code, reproducible tests and CI runs. A design document is *not* proof of an implementation.
- **Product intent:** [docs/15-two-modes-skill-scopes.md](docs/15-two-modes-skill-scopes.md), [docs/11-mvp-product-requirements.md](docs/11-mvp-product-requirements.md).
- **Architecture:** [ADR-027](docs/27-stack-architecture-compatibility-and-implementation-gates.md), [ADR-024](docs/24-reliability-hardened-architecture-web-android.md), then earlier ADRs. ADR-024 supersedes the old Android IndexedDB proposal: **Web IndexedDB/Dexie; Android Room/SQLite**.
- **Plan, not completion evidence:** [G0–G6 roadmap](docs/25-implementation-vertical-slice-roadmap.md).
- **YKI fidelity:** cite [evidence specification](docs/14-digital-yki-fidelity-spec.md). Never invent official 2027 interface, timing, rubric or grade.

On conflict, identify the contradiction, preserve data and working behavior, and propose the smallest testable correction. Do not silently rewrite policies.

## Hard engineering invariants

- Keep `app/` runnable (vanilla ES modules today). React/Vite/Phaser/Capacitor/Kotlin Room are **target design or prototypes**, not a built Android app.
- Preserve two top-level modes, four skill areas and **exam integrity**. EXAM must not leak answers, coaching, hints or first-try SRS signals before submission; synthetic timers and unofficial scoring must be labelled as practice.
- `ExamCheckpoint` (mutable draft/navigation) is **not** `FirstAttemptEvent` (immutable independent learner evidence). Never score autosave as mastery. Do not mark ungraded speaking/writing as an official YKI result.
- Critical writes are atomic, idempotent and fail closed: persist before navigation or success UI; handle retry/conflict/quota without fabricated success. See [CONTRACTS](docs/CONTRACTS.md).
- Android Kotlin files under `native/android/prototype/` are **uncompiled prototypes**. No Gradle build, app installation, full Media3 video, PAD verification or 2–3 GB offline course is proven.
- Media must have verified redistribution rights; external official/YouTube material is link-only absent explicit permission. No learner voice, private data, secrets or production credentials in Git. No raw microphone upload by default.
- Keep domain contracts framework independent; platform-specific storage/media adapters behind interfaces; preserve IDs, content hashes and versioned migration semantics.
- Prefer small, reversible vertical slices with unit/integration tests and meaningful error handling. No blanket rewrites, generated binary dumps, microservices or unrelated dependency upgrades.

## Definition of Done (for **every** change)

1. Scope and acceptance criteria cited (e.g., ADR-027 C-01…C-10); distinguish target from implemented.
2. Diff is minimal; no unreviewed scope expansion; backward compatibility/data migration/rollback addressed.
3. Relevant tests **actually executed** with commands, results and limitations in PR. Missing environment => explicitly **not run**, never "passed".
4. User-visible and architectural changes update canonical docs, not parallel contradictory copies. Check all relative links.
5. Explicitly report security/privacy, licensing, accessibility, offline and platform impact where applicable.
6. Add/update regression tests for bug fixes and failure paths; request human language/content review when pedagogical accuracy or rights depend on it.
7. Open a PR using [.github/pull_request_template.md](.github/pull_request_template.md). Never merge failing checks or claim a source-only Android feature is production-ready.

## Document maintenance

Use the compact index as navigation. Mark each claim `IMPLEMENTED`, `PARTIAL`, `TARGET` or `UNKNOWN` with evidence when meaningful. Prefer replacing stale claims to appending another conflicting paragraph. Code-generated fixtures and automated checks outrank subjective maturity scores. For content edits use [content/CONTRIBUTING.md](content/CONTRIBUTING.md). For agent workflow read [docs/AI-WORKFLOW.md](docs/AI-WORKFLOW.md).
