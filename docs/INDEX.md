# Hospodar YKI — Documentation index and source-of-truth map

**E05 EXAM listening authenticity research (29.10.2026):** [sourced SOLKI/CEFR/multi-talker audit with actual 6× one-voice synthetic long lessons and original human-audio production contract](../research/yki/23-e05-authentic-listening-exam-evidence-2026-10.md), [evidence and eight open gates](../research/yki/e05-authentic-listening-audit-2026-10.json), [reference-only release validation](../app/e05-listening-asset-gate.mjs) + [12 regression tests](../app/tests/e05-listening-asset-gate.test.mjs). **No actual new media, two-person Finnish S2 review or active EXAM runtime code was changed; exact 2027 audio replay/seek remains unknown.** Reuses established R05 evidence, no duplicate canon.

**E04 timed EXAM fidelity research (29.10.2026):** [first-party OPH and historical SOLKI timer provenance, ten risks in live code, and transaction/deadline requirements](../research/yki/22-e04-digital-timing-session-policy-2026-10.md) + [machine risk/evidence ledger](../research/yki/e04-timing-evidence-2026-10.json); [isolated, NOT imported timing reference](../app/e04-timing-policy.mjs) with [12 tests](../app/tests/e04-timing-policy.test.mjs). **Current clock/expiry bugs NOT yet fixed in actual EXAM**, and digital 2027 official module durations/replay/nav remain UNKNOWN. Strict exact mode OFF.

**E03 examined, not production-calibrated (29.10.2026):** [Official SOLKI/JYU task construct audit, 13-pattern vs two 9-task Hospodar mini sessions, S2 editorial and held-out bank gates](../research/yki/21-e03-construct-task-blueprint-2026-10.md) and [machine-readable coverage audit](../research/yki/e03-construct-task-coverage-audit-2026-10.json). **6 structural matches, 2 partial and 5 missing** are *not official fidelity scores*; exact digital 2027 counts/timing, original S2 content approval, full-bank implementation and learner validation remain NOT DONE. F1–F6 source of truth stays [docs/21](21-digital-yki-exam-simulator-executable-spec.md).

**EXAM E01–E16 implementation research roadmap (29.10.2026):** [16 evidence-gated research/work packages for digital-2027 fidelity, four-skill content, human assessment, post-exam learning and 14/30-day outcomes](../research/yki/exam-e01-e16-research-validation-plan-2026-10.md). This **plans** the research-to-build sequence while reusing R01–R12 and the F1–F6 [exam specification](21-digital-yki-exam-simulator-executable-spec.md); no manual Inspera demo inspection, post-pilot official behaviour, full mock bank, voice durability, calibrated scoring or user trials are claimed. Strict exact-2027 mode remains disabled.

**First live post-R12 vertical slice (28.10.2026):** [Web LEARN JSON backup/restore](../app/learn-backup.mjs) connected to actual app.mjs Progress screen, using R11 preflight, explicit confirmation, record counts, unchanged original V1 bytes and localStorage readback/rollback. [19 Node cases](../app/tests/learn-backup.test.mjs) and [real Chromium UI restore/reload/concurrency test](../app/tests/learn-backup-browser.html). **Not a V2 migration, full offline Android, new S2-reviewed lessons or YKI outcome study.** Browser storage can still be cleared; user manages backup file privately.

**R12 fair competitor benchmark (28.10.2026):** [dated critical comparison with eight alternatives, OPH digitesti baseline, fair 100-point *future rubric* and blinded day14/30 study design](../research/benchmark/r12-fair-finnish-yki-comparative-study-2026-10.md); [nine-product source snapshot, 13 primary URLs](../research/benchmark/r12-competitor-evidence-snapshot-2026-10.json) and [21 source-evidence tests](../app/tests/r12-benchmark-evidence.test.mjs). [docs/28 strategy](28-product-quality-niche-leadership-strategy.md) remains authority; **scores/winners NULL and zero comparative participant trials**, prices periodically recheck. Finnish it! also supports Ukrainian; no invented unique-language advantage, finished full-offline Android or officially validated EXAM similarity.

**R11 offline durability (28.10.2026):** [architecture evidence, legacy data-loss audit, Play install-time limits, 27 failure scenarios and 20 release gates](../research/architecture/r11-offline-integrity-resilience-2026-10.md); [isolated no-write LEARN V1 migration preview and explicit save states](../app/r11-legacy-migration-preflight.mjs) + [22 tests](../app/tests/r11-legacy-migration-preflight.test.mjs). **No active LEARN V1→V2 migration.** EXAM currently IDB V1, V2 remains experimental and Android Room/PAD is not compiled nor installed. Google Play: 4GB compressed cumulative base+feature+install-time packs, 1.5GB per pack; 3–4GB remains unverified plan.

**R10 accessibility/mobile QA (28.10.2026):** [№22 verified WCAG 2.2/WAI/Android/Traficom standards, source-level UX audit, 20 future release gates and NOT-RUN human/device matrix](../research/ux/22-r10-accessibility-mobile-qa-2026-10.md). Small **active MVP CSS fixes**: focus navy not gold, 44px major touch targets, 320px two-row route, narrow EXAM cards, better overflow containment; [12 source regression tests](../app/tests/r10-accessibility-contract.test.mjs). **Not a full rendered-browser or Android device a11y audit; no 2027 YKI accommodation behavior inferred.** 3–4GB full offline Android capacity remains a plan, not tested assets.

**Canonical R08 grammar (28.10.2026):** [№34 critical evidence on Finnish meaning/case/stem/rektio and day14/30 transfer](../research/pedagogy/34-r08-finnish-case-stems-meaning-transfer-2026-10.md), [14 S2-PENDING original form+meaning exercise drafts](../learning/exercises/b1/grammar/r08-meaning-stems-original-drafts.json), [isolated deterministic S2-approved-only reference](../app/r08-grammar-core.mjs) + [16 focused unit tests](../app/tests/r08-grammar-core.test.mjs). **Not integrated into active LEARN; no human approved exercise assets or YKI improvement proven.** Different from [R08-MOT motivation](../research/gameplay/02-r08-motivation-autonomy-habits-2026-10.md).

**R08-MOT autonomy-first motivation research (28.10.2026):** [gameplay №02 — 16 evidence sources, 7 controlled study plans, 18 gates](../research/gameplay/02-r08-motivation-autonomy-habits-2026-10.md); [isolated local study-plan, no-punishment return and honest progress proof code](../app/r08-motivation-core.mjs), [16 Node tests](../app/tests/r08-motivation-core.test.mjs). Research reference NOT imported into active learner UI. **Naming:** motivation track R08-MOT is distinct from 12-study programme's R08 Finnish morphology workstream, still not implemented as a tested intervention. No new sound/media or Android AAB.

**R07 interactive UX (28.10.2026):** [№21 — source-critical meaning-first multimodal Finnish interface](../research/ux/21-r07-meaningful-interactive-finnish-ux-2026-10.md); [isolated response-first pure interaction prototype](../app/r07-interaction-core.mjs) + [15 unit tests](../app/tests/r07-interaction-core.test.mjs). Sound/motion controls, caption support and day15 tests are **design/prototype only**; current app screen not yet rewired, no real participants or recordings added. Research is new UX stage safety, not a second design palette or method catalog.

**R06 transparent Finnish adaptive-learning research (28.10.2026):** [№33 evidence-to-design study](../research/pedagogy/33-r06-transparent-adaptive-finnish-learning-2026-10.md), [isolated deterministic reference module](../app/adaptation-core.mjs), [Node tests](../app/tests/adaptation-core.test.mjs). Includes first-independent-response safety, 4-skill exposure vs proficiency separation, grounded user-visible reasons, active fixed-spaced comparator and preregistered 14/30-day human trial design. **Not used in production mission selection; NOT validated on users.**

**R05 researched 28.10.2026:** [human multi-talker phonetic training and full offline 3–4GB content plan](../research/pedagogy/32-r05-multitalker-phonetic-transfer-2026-10.md); [sensory/sound design research update](../research/design/19-r05-sound-visual-design-transfer-2026-10.md); [real material source-rights intake](../sources/audio/R05-MULTITALKER-MATERIAL-INTAKE-2026-10.md). No newly bundled recordings, SFX, UI redesign, Android installation or participant learning effects; all pending separate QA/feature work.

**Owner:** repository maintainers. **Updated:** 2026-10-24. **Scope:** engineering navigation; does **not** certify production readiness.

> Start with [../AGENTS.md](../AGENTS.md). Read the narrowest relevant documents; the research library is reference material, not mandatory context for every coding task.

**R04 deep research 28.10.2026:** [human-calibrated speaking/writing assessment dossier №31](../research/pedagogy/31-r04-speaking-writing-human-calibrated-assessment-2026-10.md): OPH public 3/4 criteria (both PDF tables visually checked); Finnish L2 human/ASR studies; distinct learning vs official grading, two formative rubric proposals, self-repair and delayed unseen speaking/writing evaluation with 14 proposed release gates. **Research/spec only; no app grading feature or human calibration completed.**

**New 28.10.2026 research execution overview:** [12 sequenced research tracks, evidence, implementation and trial readiness R01–R12](../research/29-twelve-product-research-studies-execution-2026-10.md). **12/12 source reviews completed; 0/12 actual user studies performed**; includes R01 pre-registration draft and current OPH digital YKI official facts (not unofficial interface claims). Existing canonical 70-method library retained.

**R02 researched 28.10.2026:** [digital YKI 2027 official-source deep follow-up](../research/yki/20-yki-official-complete-audit-2026-10.md#r02-deep-follow-up--28102026-oph-digital-yki-2027-eight-dates-demos-and-fail-closed-quality-gate). Source-verified all **8 Finnish spring 2027 dates** (including missing 24.04 and 22.05), official links to four Inspera demos, *crawler* access 403 and no verified demo UI controls. JSON source ledgers and regression checks updated; strict digital-2027 exact still BLOCKED. R01 pilot remains future.

**R03 Finnish morphology, 28.10.2026:** [research №30 — language-specific Finnish L2 studies, no invented Ukrainian-L1 error rankings](../research/pedagogy/30-r03-finnish-morphology-ukrainian-learner-evidence-2026-10.md). Nine proposed difficulty families, four meaningful lesson loops, 12 acceptance criteria, consented learner-corpus/error study plan. Human S2 content, independent tasks and users **NOT RUN / NOT YET RELEASED**. Next R04 speaking/writing assessment.

## Pick the shortest guide for your task

| Need | Read first | Why |
| --- | --- | --- |
| Make Hospodar demonstrably best for learners in its niche | [28 — Quality & niche leadership strategy](28-product-quality-niche-leadership-strategy.md) → [Canonical product requirements](15-two-modes-skill-scopes.md) | TARGET differentiation; QL-01…09, measured U14/U30, F1–F6, release gates and 6-step execution priorities, not a measured product win |
| Confirm product strategy (non-AI learner runtime, curated science-led material) | [Canonical CURATED-01…08 requirements](15-two-modes-skill-scopes.md#продуктовий-принцип-2026-10-24-кураторський-контент-замість-ai-репетитора) | TARGET decisions; no claim that content, gameplay and Android are complete |
| Deliver equal exam pillar, confirm digital YKI fidelity | [EXAM-PILLAR-01…08](15-two-modes-skill-scopes.md#два-рівноцінні-стовпи-продукту-2026-10-24) → [OPH digital demo evidence + unknowns](14-digital-yki-fidelity-spec.md#нова-вимога-2026-10-24-другий-рівноцінний-стовп-hospodar-yki) → [Executable simulator spec](21-digital-yki-exam-simulator-executable-spec.md) | TARGET: four official OPH demo *links* available; UI not yet manually verified or live-2027 certified |
| Plan lessons and media from A1.3 to B2.1 | [Curriculum](../learning/curriculum/README.md) → [Tenses](../learning/exercises/grammar/tenses/README.md) + [Clock/time](../learning/exercises/grammar/time-and-clock/README.md) | Explicit TARGET levels vs existing B1 exercises |
| Visual library physically imported | [Illustrations](../assets/images/illustrations/library.json), [attributed photos](../assets/images/pictures/available.json), [image-led lessons](../learning/exercises/a1/image-led/lessons.json) | Actual offline files, hash/rights proof and teacher-review boundary |
| Add visual assets | [Illustrations](../assets/images/illustrations/README.md) and [Pictures](../assets/images/pictures/README.md) | Separate visual purpose, alt, rights, review before ingestion |
| Understand what runs now, and why the target stack was chosen | [Architecture decisions](architecture/README.md) | Explicit historical/accepted target versus running source |
| Implement React/TypeScript, Dexie, Android Room or PAD | [Web and Android migration how-to](guides/WEB-ANDROID-MIGRATION.md) | Step-by-step safety gates and tests |
| Add a YKI task, dictionary, image, audio, transcript or video URL | [Content authoring guide](guides/CONTENT-AUTHORING.md) | One physical owner, rights, review, validation |
| Change GitHub Actions or qualify release | [CI and quality gates](operations/CI-QUALITY-GATES.md) | Exact triggers, evidence, planned versus runnable commands |
| Evaluate interactive UI/UX **against actual learning outcomes** (not engagement only) | [UX #20 §9 — current 2026 meta-analyses, UIO-01…10 and UX-I01…04](../research/ux/20-multimodal-interactive-learning-2026-10.md#9-прикладний-аудит-uiux--реальний-результат-навчання-26102026) → [impact study protocol](../research/ux/learning-impact-evaluation-protocol.md) | **RESEARCH/TARGET**: interactive pause + comprehension/production prompts, feedback, actionable progress, attention safeguards; some dashboard studies null; no product effect demonstrated |
| Design semantic colors, learning audio, captions, motion or sound effects with evidence | [18 — Critical multimodal/UI synthesis](../research/design/18-multisensory-learning-interface-evidence-2026-10.md) → [Evidence-to-UX implementation gate](guides/EVIDENCE-TO-UX.md) | **RESEARCH + TARGET**; 15 sources, mixed/negative evidence, SENS-01…12 expert design priorities and controlled trials, not observed gains |
| Apply experimental psychology to attention, memory, concentration, breaks and distraction | [27 — Cognitive psychology for Finnish learning](../research/pedagogy/27-cognitive-memory-attention-psychology-2026-10.md) → [UX outcome research protocol](../research/ux/learning-impact-evaluation-protocol.md) | RESEARCH/TARGET only: COG-01…16, PSY-01…09, 5 unrun comparative studies; no learner cognitive gains established |
| Implement best validated worldwide language-learning methods for Finnish | [26 — Critical global L2 method evidence update (2025–2026)](../research/pedagogy/26-global-effective-language-learning-2026-10.md) → [canonical 70 rated methods](../research/pedagogy/learning-methods-v1.json) → [dual effectiveness scores](../research/pedagogy/learning-effectiveness-ratings-v1.json) | RESEARCH+TARGET only; 20 existing methods, 15 sources, 5 proposed comparisons, no product uplift or duplicated catalog |
| Research memory, attention, audio/visual learning effects or competitive learning outcomes | [Evidence-based research program](../research/RESEARCH-PROGRAM.md) → [research-to-UX handoff](guides/EVIDENCE-TO-UX.md) | Scientific evidence, accessibility, experiment protocols and implementation gates |
| Choose code/media redistribution policy | [Licensing boundaries](../LICENSING.md) | Public repo does not automatically grant media rights |

The core [ARCHITECTURE](ARCHITECTURE.md), [CONTRACTS](CONTRACTS.md), [TESTING](TESTING.md), [SECURITY](SECURITY.md), [RELEASE](RELEASE.md) and numbered ADRs keep their historical stable paths. This is deliberate: large file migrations would break existing deep links without improving code quality.

## Authority by question

| Question | Canonical reference | Status / interpretation |
| --- | --- | --- |
| What is the product? | [15 — modes, four skills and UX](15-two-modes-skill-scopes.md) + [11 — MVP requirements](11-mvp-product-requirements.md) | **TARGET** product behavior; some browser functionality exists |
| What already runs? | [../app/README.md](../app/README.md) + `app/` source/tests + [26 — implementation evidence](26-atomic-exam-and-media-implementation-2026-10.md) | **PARTIAL** Web vanilla JS, IndexedDB exam only |
| How much of G1 event unification actually runs? | [G1 implementation evidence](architecture/G1-IMPLEMENTATION.md) + [contracts](CONTRACTS.md) | Hardened Web V1 vs V2 in-memory reference and pending Android |
| What is the approved cross-platform architecture? | [27 — integrations/contracts/gates](27-stack-architecture-compatibility-and-implementation-gates.md) | **TARGET** integration contract; not an Android release |
| Where does critical data live? | [24 — reliability decision](24-reliability-hardened-architecture-web-android.md) | **TARGET** Web Dexie/IndexedDB, Android Kotlin Room |
| Why this stack? | [22 — stack ADR](22-optimal-stack-and-architecture-adr-2026-10.md) | **ACCEPTED DESIGN**, not deployed React/Phaser |
| Android packaging/2D media? | [23 — distribution/game ADR](23-android-offline-game-and-3gb-media-architecture.md) | **TARGET** install-time PAD, licensed media only |
| Which work next? | [25 — G0–G6 roadmap](25-implementation-vertical-slice-roadmap.md) | **PARTIAL** G0; G1–G6 not complete |
| Exam and official YKI fidelity? | [14 — digital fidelity](14-digital-yki-fidelity-spec.md) + [21 — executable exam spec](21-digital-yki-exam-simulator-executable-spec.md) | **TARGET**, 2027 unknowns explicit |
| Content and rights? | [../learning/CONTRIBUTING.md](../learning/CONTRIBUTING.md) + [06 — verification](../sources/learning/06-sources-and-verification.md) | Human-reviewed, rights-aware content process |

For **present code facts**, inspect the actual files/tests and CI, not an old roadmap snapshot. For **what should be built**, use current product spec/ADR. When they differ, record the gap; don't describe the feature as implemented.

## From scientific evidence to actual learning outcomes

The [research program](../research/RESEARCH-PROGRAM.md) owns methodology and taxonomy: **no parallel registry**. The [memory, attention, audio/visual synthesis](../research/pedagogy/22-memory-attention-sensory-learning-evidence-2026-10.md) contains first source-linked findings; [impact evaluation](../research/ux/learning-impact-evaluation-protocol.md) owns pre-registered outcome measurements. Convert insights into code only through the [EVIDENCE-TO-UX checklist](guides/EVIDENCE-TO-UX.md), the product's canonical requirement, and real acceptance tests. No feature efficacy is implemented or validated by adding these documents.

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
| Navigate code and module boundaries | [ARCHITECTURE.md](ARCHITECTURE.md) + [executable module boundaries](architecture/MODULE-BOUNDARIES.md) |
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
