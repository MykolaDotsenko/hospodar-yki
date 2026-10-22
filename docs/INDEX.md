# Hospodar YKI — Documentation index and source-of-truth map

**Owner:** repository maintainers. **Updated:** 2026-10-22. **Scope:** engineering navigation; does **not** certify production readiness.

> Start with [../AGENTS.md](../AGENTS.md). Read the narrowest relevant documents; the research library is reference material, not mandatory context for every coding task.

## Authority by question

| Question | Canonical reference | Status / interpretation |
| --- | --- | --- |
| What is the product? | [15 — modes, four skills and UX](15-two-modes-skill-scopes.md) + [11 — MVP requirements](11-mvp-product-requirements.md) | **TARGET** product behavior; some browser functionality exists |
| What already runs? | [../app/README.md](../app/README.md) + `app/` source/tests + [26 — implementation evidence](26-atomic-exam-and-media-implementation-2026-10.md) | **PARTIAL** Web vanilla JS, IndexedDB exam only |
| What is the approved cross-platform architecture? | [27 — integrations/contracts/gates](27-stack-architecture-compatibility-and-implementation-gates.md) | **TARGET** integration contract; not an Android release |
| Where does critical data live? | [24 — reliability decision](24-reliability-hardened-architecture-web-android.md) | **TARGET** Web Dexie/IndexedDB, Android Kotlin Room |
| Why this stack? | [22 — stack ADR](22-optimal-stack-and-architecture-adr-2026-10.md) | **ACCEPTED DESIGN**, not deployed React/Phaser |
| Android packaging/2D media? | [23 — distribution/game ADR](23-android-offline-game-and-3gb-media-architecture.md) | **TARGET** install-time PAD, licensed media only |
| Which work next? | [25 — G0–G6 roadmap](25-implementation-vertical-slice-roadmap.md) | **PARTIAL** G0; G1–G6 not complete |
| Exam and official YKI fidelity? | [14 — digital fidelity](14-digital-yki-fidelity-spec.md) + [21 — executable exam spec](21-digital-yki-exam-simulator-executable-spec.md) | **TARGET**, 2027 unknowns explicit |
| Content and rights? | [../learning/CONTRIBUTING.md](../learning/CONTRIBUTING.md) + [06 — verification](../sources/learning/06-sources-and-verification.md) | Human-reviewed, rights-aware content process |

For **present code facts**, inspect the actual files/tests and CI, not an old roadmap snapshot. For **what should be built**, use current product spec/ADR. When they differ, record the gap; don't describe the feature as implemented.

## AI-engineering operational entrypoints
### Media, content, knowledge and research

- [Content Architecture](CONTENT-ARCHITECTURE.md) — accepted semantic storage plan, migration rules and verified vs link-only sources.
- [Папки матеріалів](FOLDER-STRUCTURE.md) — фізична структура, справжні файли та правила розміщення; без додаткових реєстрів.
- [Assets](../assets/README.md) — images, local audio, licensed video; Web/Android delivery boundaries.
- [Sources](../sources/README.md) — YouTube/link-only, publishers and official YKI demonstrations.
- [Dictionaries](../knowledge/dictionaries/README.md) · [Exercises](../learning/exercises/README.md) — actual existing data owners.
- [Research](../research/README.md) — pedagogy, design, UX, gameplay, user cases; studies now physically organized by topic.


| Task | Read |
| --- | --- |
| Navigate code and module boundaries | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Launch / modify / debug | [DEVELOPMENT.md](DEVELOPMENT.md) |
| Run QA and qualify evidence | [TESTING.md](TESTING.md) |
| Change event/schema/migrations | [CONTRACTS.md](CONTRACTS.md) |
| Threat model, privacy or licensed media | [SECURITY.md](SECURITY.md) |
| Build/release/update/recover | [RELEASE.md](RELEASE.md) |
| Work with coding agents and review PRs | [AI-WORKFLOW.md](AI-WORKFLOW.md) |
| Multi-step execution plans | [exec-plans/README.md](exec-plans/README.md) |
| Reported risks and metrics | [QUALITY.md](QUALITY.md) |

## Existing specification / science library

- [12 — original MVP architecture](12-mvp-architecture.md) and ADR-022/023/024/027 record historical choices. **Superseding rule:** ADR-024 replaces the old Android IndexedDB proposal; ADR-027 clarifies integration/contracts. Do **not** blindly combine old diagrams.
- [02 — B1 competencies](02-b1-competencies.md), [05 — study system](05-study-system.md), [04 — learning science](../research/pedagogy/04-evidence-and-learning-science.md), [08 — methods](../research/pedagogy/08-learning-methods-evidence-2026-10.md) are source material for pedagogy, not evidence that engines are built.
- [13 — YKI examples](../research/yki/13-yki-exam-format-and-real-examples-2027.md) and [20 — official audit](../research/yki/20-yki-official-complete-audit-2026-10.md) support calibration. Unsupported 2027 digital details must stay uncertain.
- [../research/](../research/) and [../learning](../learning) contain machine-readable decisions/evidence and licensed or original learning material; see their readmes where present.

## Maintenance rule

Update this index **only when document ownership or entrypoints change**. Update the owning document **in the same PR** as behavior or architecture changes. Keep separate statuses: `TARGET` (planned), `SOURCE_PROTOTYPE`, `PARTIAL`, `IMPLEMENTED_TESTED`, `RELEASE_VERIFIED`. Avoid "100/100" readiness claims without objective release evidence.
