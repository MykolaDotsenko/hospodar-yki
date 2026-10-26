# Hospodar YKI — instructions for coding agents

You are working on a **local-first Finnish/YKI learning application**: Ukrainian-language explanations; Finnish-language practice; LEARN and EXAM modes with reading, listening, writing and speaking. Optimize for reliable learning outcomes, privacy, accessibility, and verified tests—not for new frameworks or large diffs.

**Product direction (2026-10-24):** Hospodar YKI is a **human-curated, evidence-informed, offline-first Finnish learning product**, not an AI tutor. The learner's path must work without any generative AI or network model: selected/licensed/S2-reviewed content; deterministic first-attempt/feedback and spaced retrieval; meaningful multimedia, accessible cues, optional sound and intrinsic-motivation gameplay. A generative model may assist content research or drafting **outside** learner-facing runtime, but is never a required teaching dependency or a source of unreviewed answer keys/YKI grades. Target requirements and evidence limits: [canonical product direction](docs/15-two-modes-skill-scopes.md#продуктовий-принцип-2026-10-24-кураторський-контент-замість-ai-репетитора). Do not conflate UI beauty/engagement with delayed language learning gains.

**Equal product pillar (2026-10-24):** The second **first-class product** is a **high-fidelity digital YKI suomi keskitaso simulator**, equal in priority to curated LEARN. It must reproduce only independently verified 2027 live exam behavior across construct/task families, S2-authored stimuli, time/sequence, digital UI/audio/mic/navigation and fair scoring. OPH publishes **four external digital demo links**; the links are verified on OPH but UI behavior is **not yet manually inspected or confirmed identical to 2027 live**. See [canonical EXAM-PILLAR-01…08](docs/15-two-modes-skill-scopes.md#два-рівноцінні-стовпи-продукту-2026-10-24) and [primary-source fidelity matrix](docs/14-digital-yki-fidelity-spec.md#нова-вимога-2026-10-24-другий-рівноцінний-стовп-hospodar-yki). No made-up exam settings, official grades, copyrighted copied tasks, or claims of exact 2027 digital fidelity without source and E2E evidence.

**Product scope update:** design new LEARN content for **A1.3 → B2.1** with differentiated levels; do not mislabel the working B1 MVP as six-level-ready. Images have distinct [illustration](assets/images/illustrations/README.md)/[picture](assets/images/pictures/README.md) homes; grammar tenses live in [learning/exercises/grammar/tenses](learning/exercises/grammar/tenses/README.md). EXAM remains evidence-based YKI keskitaso, not invented A1.3 exam certification.

**Quality and competitor differentiation (2026-10-24):** [Product-quality strategy #28](docs/28-product-quality-niche-leadership-strategy.md) defines learner-first competitive advantage, QL-01…09, 100-point **planning weight** (not measured product scores), release blockers and measurable 14/30-day independent transfer plus exam F1…F6. For new work cite one specific QL ID and a concrete runnable test/content review/evidence gate. Do not claim better outcomes versus competitors until a suitable controlled evaluation exists; don't substitute DAU/streaks, mock visuals, or AI metrics for real Finnish gains. This is a strategy complement, not a replacement for canonical spec #15 or research records.

## First read (progressive disclosure)
> **Content ownership:** media files live in [assets](assets/README.md), exercises in [learning/exercises](learning/exercises/README.md), dictionaries in [knowledge/dictionaries](knowledge/dictionaries/README.md), plans in [learning/plans](learning/plans/README.md), external video/audio links in [sources](sources/README.md), and research in [research](research/README.md). Read the [physical folder structure](docs/FOLDER-STRUCTURE.md) before touching assets; do not restore machine registries or copy YouTube media.


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

## Task-specific how-to guides

- [Current ADR status, decision precedence](docs/architecture/README.md) — accepted target is not implemented behavior.
- [Web/Android phased migration](docs/guides/WEB-ANDROID-MIGRATION.md) — durability, Gradle/Room and PAD release gates.
- [Content authoring and licensing](docs/guides/CONTENT-AUTHORING.md) — official YKI vs practice and media rights.
- [CI path filters and evidence](docs/operations/CI-QUALITY-GATES.md) — never assume a green workflow ran unless the path trigger matches.

## Source of truth / precedence

- **Implemented behavior:** current code, reproducible tests and CI runs. A design document is *not* proof of an implementation.
- **Product intent:** [docs/15-two-modes-skill-scopes.md](docs/15-two-modes-skill-scopes.md), [docs/11-mvp-product-requirements.md](docs/11-mvp-product-requirements.md).
- **Architecture:** [ADR-027](docs/27-stack-architecture-compatibility-and-implementation-gates.md), [ADR-024](docs/24-reliability-hardened-architecture-web-android.md), then earlier ADRs. ADR-024 supersedes the old Android IndexedDB proposal: **Web IndexedDB/Dexie; Android Room/SQLite**.
- **Plan, not completion evidence:** [G0–G6 roadmap](docs/25-implementation-vertical-slice-roadmap.md).
- **YKI fidelity:** cite [evidence specification](docs/14-digital-yki-fidelity-spec.md). Never invent official 2027 interface, timing, rubric or grade.

On conflict, identify the contradiction, preserve data and working behavior, and propose the smallest testable correction. Do not silently rewrite policies.

**Worldwide language-learning evidence (25.10.2026):** For new LEARN pedagogy/features consult [global method evidence update #26](research/pedagogy/26-global-effective-language-learning-2026-10.md), which triangulates current 2025–2026 meta-analyses with the **existing 70 methods and dual /100 expert ratings**. P0 priorities are curated Finnish input, multi-talker phonetics, real-world response, feedback plus self-repair, spelling/grammar in context, graded reading, and delayed independent retention/transfer; explicitly include retrieval-vs-elaboration, HVPT perception-vs-production, and task repetition generalization counterevidence. No new method IDs/registries unless genuinely new and simultaneously updated across canonical JSON, rankings and validators. Tests and S2 human review, not literature summaries, certify implementation.

**Memory and sustained attention psychology (2026-10-26):** [Research #27](research/pedagogy/27-cognitive-memory-attention-psychology-2026-10.md) establishes COG-01…16 and PSY-01…09, with negative results for distractors, forced interleaving of word lists, microbreak performance uncertainty, and mindfulness not equaling Finnish memory. For LEARN implement independent short-context retrieval, feedback, self-repair, calm reading/writing, optional breaks and new-context delayed assessment, not distracting quizzes/streaks or false B1 scores. No new generic method IDs (reuse canonical 70), no health/attention telemetry/camera tracking, and no EXAM hints. Product evidence requires code+S2 review+time-matched real-user study, not cited experiment alone.

## Research-driven UX and pedagogy, no engagement theater

If changing learning strategies, sounds, visual cues, animations, AI feedback, concentration features or game mechanics, first consult [research protocol](research/RESEARCH-PROGRAM.md), [sensory/memory evidence](research/pedagogy/22-memory-attention-sensory-learning-evidence-2026-10.md), and [implementation checklist](docs/guides/EVIDENCE-TO-UX.md). The existing [67 learning methods](research/pedagogy/08-learning-methods-evidence-2026-10.md) are research proposals and fit ratings, not measured in-app success. Demand controlled, delayed **independent** Finnish language transfer; avoid decorative distractions, mandatory background sound and unsupported learning-style/brainwave claims. Never add duplicate catalogs to document this work.

**Scoped instructions:** coding in [app/](app/AGENTS.md), [shared contracts](packages/contracts/AGENTS.md) or [research](research/AGENTS.md) has short area-specific checklists, all subordinate to this file. For dependency direction and static CI enforcement see [module boundaries](docs/architecture/MODULE-BOUNDARIES.md).

## Hard engineering invariants

- Keep `app/` runnable (vanilla ES modules today). **LEARN uses `localStorage`; EXAM checkpoints use IndexedDB.** React/Vite/Phaser/Capacitor/Kotlin Room are **target design or prototypes**, not a built Android app.
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

Use the compact index as navigation. Mark each claim `IMPLEMENTED`, `PARTIAL`, `TARGET` or `UNKNOWN` with evidence when meaningful. Prefer replacing stale claims to appending another conflicting paragraph. Code-generated fixtures and automated checks outrank subjective maturity scores. For content edits use [learning/CONTRIBUTING.md](learning/CONTRIBUTING.md). For agent workflow read [docs/AI-WORKFLOW.md](docs/AI-WORKFLOW.md).
