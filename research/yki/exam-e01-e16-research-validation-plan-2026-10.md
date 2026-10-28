# Hospodar YKI — E01–E16: EXAM fidelity × assessment × learning research execution plan

**Created:** 2026-10-29. **Owner:** research/yki (programme); engineering source of truth: [docs/21](../../docs/21-digital-yki-exam-simulator-executable-spec.md); official claim ledger: [R02 audit](20-yki-official-complete-audit-2026-10.md), [official evidence JSON](yki-digital-fidelity-evidence-2026-10.json). **Status:** approved research/implementation PLAN, not 16 completed studies, verified 2027 software, a shipped Android app, or evidence of increased YKI performance.

## 0. Purpose, boundaries, and baseline

**Goal:** make the independent Hospodar YKI EXAM mode both a demonstrably faithful, original practice simulation of the digital Finnish intermediate YKI and the first step in a scientifically testable learning cycle: **sealed unfamiliar EXAM → honest skill-specific results → separate LEARN review and self-repair → novel delayed transfer → independent new EXAM form**.

- **What is live:** the Web EXAM MVP has two original mini-blueprints, **9 items each** (reading 3, listening 4, writing 1, speaking 1), non-official optional practice timers, browser local voice recording (not durably retained), and IndexedDB V1 checkpoints. Only objective items are keyed; productive skills are ungraded. See [app README](../../app/README.md) and [EXAM specification](../../docs/21-digital-yki-exam-simulator-executable-spec.md).
- **What is not proven:** exact digital-2027 UI, number/order/timing of items, audio replay/back navigation, human-calibrated level 3/4, full exam forms, reliable persisted voice, Android/Room production parity, or real-user efficacy. The existing 12 research tracks R01–R12 are desk reviews/designs, **0 completed participant studies**; references to them below are **reuse**, not a second completed study.
- **Non-negotiable:** separate a) historical paper/2011 YKI examples, b) OPH digital *demo observation*, c) first-party-confirmed *live 2027* rules, and d) our *practice-only* defaults. Never promote demo observations to live production facts without independent confirmation. Official-like appearance is not official endorsement.
- **Scope:** 16 **work packages E01–E16** about EXAM delivery, validation and learning impact. These are **not** 16 newly completed literature reviews. Priority /100 below is expert sequencing, not measured impact or product score.
- **Rights and privacy:** do not scrape protected Inspera assets, reproduce official tasks or reuse recordings without authorization. Originals need human S2 review, voice rights, accessibility captions where relevant; first-attempts and voice recordings remain private, user-controlled, and protected. No mandatory cloud or generative AI dependency.

**Official first-party checkpoints (verified as public pages 2026-10-29):**
- [OPH: before the YKI test and digital demo entrypoints](https://www.oph.fi/fi/koulutus-ja-tutkinnot/ennen-yki-testia): four ungraded digital demo links. In previous R02 automatic text access to Inspera returned HTTP 403; **actual demo interactions have NOT been inspected**. A 403 is not evidence that users cannot open the demos.
- [OPH: digital pilot announcement, 18 September 2026](https://www.oph.fi/en/news/2026/digital-yki-tests-will-be-piloted-november-2026): Finnish intermediate digital pilot planned **7 November 2026**; OPH plans participant feedback. Digital testing occurs on a **test-centre computer**.
- [OPH: official dates and subtests](https://www.oph.fi/en/education-and-qualifications/selecting-right-yki-test-test-days): refer to the [dated R02 calendar audit](20-yki-official-complete-audit-2026-10.md) for the spring 2027 registration and full/partial days; recheck close to the relevant date.
- [OPH speaking criteria](https://www.oph.fi/sites/default/files/documents/Puhumisen_arviointikriteerit.pdf) and [writing criteria](https://www.oph.fi/sites/default/files/documents/Kirjoittamisen_arviointikriteerit.pdf): criteria for human interpretation, **not** an automatic software grade formula.
- [SOLKI examples](https://ykitesti.solki.jyu.fi/tutustu-testiin/testifin/): historical/example task material; may support construct design but does **not** establish current digital controls.

## 1. How to execute each work package (mandatory common protocol)

Every E-study must record **question → existing evidence and contradictions → missing observation → research design / comparator → source and rights → product decision → named owner → testable acceptance → status**. Use [research programme methodology](../RESEARCH-PROGRAM.md) and [study impact protocol](../ux/learning-impact-evaluation-protocol.md). For each new rule create/update **existing** [digital fidelity ledger](yki-digital-fidelity-evidence-2026-10.json); do not fork a second machine authority.

Suggested states: NOT_STARTED → DESK_EVIDENCE_REUSED → DATA_COLLECTION → REVIEWED → IMPLEMENTED → E2E_VERIFIED → USER_VALIDATED. Each state requires a dated proof; NEVER mark actual OPH UI observation or a human trial complete because an agent wrote a report.

**Evidence record, illustrative contract (not a deployed schema):**

    parameter_id: F5.AUDIO_REPLAY
    observed_value: null
    source_type: OPH_CURRENT | OPH_DEMO_OBSERVED | SOLKI_HISTORICAL | PRACTICE_DECISION
    source_url: https://...
    applies_to: demo | actual_2027 | historical | practice
    observed_on: null
    observed_by: null
    version_or_hash: null
    rights_status: LINK_ONLY
    confidence: UNKNOWN | VERIFIED | CONFLICT
    browser_e2e_test: null

If uncertain, preserve null; a user-chosen training timer/replay rule must be labelled PRACTICE, not official.

## 2. E01–E16 matrix: exact research question, output and release evidence

| Work package | Question and applied research method | Deliverable / acceptance gate | Reuse from existing work | Priority /100 |
| --- | --- | --- | --- | ---: |
| **E01 — Normative digital rules** | Compare current OPH announcements, regulations, confirmed test-day instructions and legacy SOLKI; date each claim and flag conflicts. | Critical rule inventory with source/date/applicability, confirmed/unknown/conflict and version; no paper-only assumption enters strict mode. | R02; [docs/14](../../docs/14-digital-yki-fidelity-spec.md), [docs/21](../../docs/21-digital-yki-exam-simulator-executable-spec.md) | **100** |
| **E02 — Four Inspera demo walkthroughs** | Authorized *manual* desktop inspection of reading/listening/writing/speaking demos: screen flow, focus/keyboard, timer, playback, back/edit, microphone, submit, errors. Compare observations with text rules. | One time-stamped walkthrough matrix **per skill**, reproducible interaction scenarios, disagreements and gaps; screenshots/artefacts only if use is permitted; no unverifiable claims. | R02: demo URLs exist, UI unobserved | **100** |
| **E03 — Construct and item-family representativeness** | Map genres/functions, task families, proficiency demand and content domains against source-tagged YKI examples; require blinded S2 item review. | Versioned blueprint for each skill and full mock, coverage matrix; digital 2027 counts/order remain null until confirmed. | F1/F2/F3; [task-pattern catalogue](yki-official-patterns-v2.json) | **100** |
| **E04 — Timing and test-day state** | Audit time limits, response windows, breaks, pause/resume and transitions separately from old paper examples; inject boundary/time drift cases. | Verified clock/state-machine fixtures; every unverified rule locked out of STRICT, practice timer unmistakable. | R02; [exam core](../../app/exam-core.mjs) | **99** |
| **E05 — Listening authenticity** | Human multi-talker vs one-voice, authentic spoken register, comprehension gist/detail/inference, distractors; check the actual digital playback policy independently. | Rights-cleared original audio bank with voice/tempo/register/duration metadata, S2-reviewed keys and captions after attempt in LEARN only; no playback assumptions. | R05; [audio inventory](../../assets/audio/README.md) | **99** |
| **E06 — Speaking simulation** | Examine verified preparation and recording lifecycle, scripted reactions/monologues/interactions, understandable Finnish, microphone permission, recording loss. | Original S2-reviewed prompts, robust local audio evidence or explicit failure/UNGRADED, full mic-denied/crash/restart tests. | R04; [speaking rubric research](../pedagogy/31-r04-speaking-writing-human-calibrated-assessment-2026-10.md) | **100** |
| **E07 — Writing simulation** | Genre/audience, coherence, task completion, Finnish ä/ö entry, editing/word count if verified, keyboard usability, interrupted text recovery. | Original S2-reviewed tasks; Unicode, focus, autosave failure, recovery and no premature key/feedback tests. | R04; [OPH writing criteria](https://www.oph.fi/sites/default/files/documents/Kirjoittamisen_arviointikriteerit.pdf) | **100** |
| **E08 — Reading simulation** | Genre, pragmatics, main ideas, details, inference, task difficulty, plausible distractors with independently reviewed answer alternatives. | Four-skill blueprint reading bank, distractor reviews, unknown official digital count unchanged. | R03; SOLKI/YKI pattern audits | **98** |
| **E09 — Human calibration of productive scoring** | Two independent trained S2 raters score a consented sample using task-completion-first analytic and holistic rubric; assess disagreement, rater severity and uncertainty; adjudicate. | Inter-rater agreement, exemplar anchors, error cases and bias review; if uncalibrated, output **UNGRADED** not YKI 3/4 or predicted pass. | R04 research; [OPH speaking criteria](https://www.oph.fi/sites/default/files/documents/Puhumisen_arviointikriteerit.pdf) | **100** |
| **E10 — Original equivalent test-form bank** | Develop legally independent, source/CEFR tagged item bank; inspect exposure, test-retest leakage, balance, S2 agreement and, **only with enough data**, psychometric fit. | Separate unseen forms and sealed held-out pool; exact form size provisional until E01/E02; content provenance/rights/approver 100% for released items. | Existing 2×9-item practice sets are *not* full forms | **100** |
| **E11 — Readiness and predictive validity** | Test whether independent skill performance predicts blind held-out tasks and, where consented and feasible, later YKI subtest outcomes; correct for baseline and exposure. | Skill-wise uncertainty/calibration report; no unsupported transform from % correct to official level. | R01/R04 outcome protocols | **99** |
| **E12 — Post-exam learning feedback** | Compare post-submit explanatory feedback + self-repair with matched high-quality review control, avoiding solution leakage before the attempt. | Hard EXAM → REVIEW boundary; item-linked evidence and S2-approved guidance **only after** immutable finish; delayed unseen language outcome. | R01/R07/R08, [LEARN scope](../../docs/15-two-modes-skill-scopes.md) | **100** |
| **E13 — Repetition and generalization** | Compare independent full mocks, short module practice and time-matched spaced transfer; use new topics, voices, and forms at 7/14/30 days. | Task-exposure guard; per-skill transfer results reported separately; repeat of known item not counted as new proficiency. | R01/R06, [retention core](../../app/retention-core.mjs) | **100** |
| **E14 — Test anxiety, cognitive load, usability** | Observe adult learners with keyboard/headsets, accessibility needs and limited computer confidence; compare focused UI with distracting training visuals; collect burden + objective performance. | Desktop and mobile accessibility matrix, reduced motion/audio opt-outs, consented usability session; do not infer official accommodations from demo. | R07/R09/R10; [R10 QA](../ux/22-r10-accessibility-mobile-qa-2026-10.md) | **97** |
| **E15 — Durability, privacy, offline and recovery** | Fault-inject tab exit, lost ack, concurrent writes, timer drift, disconnected audio device, mic denial, disk quota and aborted recording; validate no false success. | Real Chromium and Android (when compiled) E2E failure matrix, immutable first attempt, consent/delete/export, only verified saved states. | R11; [G1 evidence](../../docs/architecture/G1-IMPLEMENTATION.md) | **100** |
| **E16 — Fair causal study: mock → review → gain** | With time/content-matched active comparator and independent baseline, randomize an EXAM+review+transfer strategy against ordinary high-quality mocks/review; blind S2 scoring on unseen tasks. | Preregistered primary day-14 functional writing/speaking *separately*, day-30 and all skills exploratory, attrition/ITT/CI/rater agreement; report null effects and harms. **NO completed trial currently.** | R01/R12, [impact protocol](../ux/learning-impact-evaluation-protocol.md) | **100** |

**Priority is a planning judgement.** Do not sum these 16 ratings as an overall EXAM score, or interpret them as evidence that Hospodar works.

## 3. Dual-layer learner flow — strict test integrity with useful learning

1. **PREPARE:** learner chooses full/one subtest/clearly described custom practice; verified official profile only when every critical rule passed E01/E02; practice settings visible before start.
2. **EXAM:** unexposed versioned item set; immutable independent first attempt, authoritative elapsed time and local committed session receipts; no scores, hints, transcripts, grammar highlights, progression XP, sample answers or adaptive task substitutions *during* a strict exam.
3. **FINISH:** explicit durable submit receipt before revealing any key. If a save/voice receipt is uncertain, label as uncertain and offer safe recovery instead of claiming completion.
4. **RESULT:** reading/listening objective key evidence, missing answers and uncertainty; speaking/writing UNGRADED until validated reviewer process. No overall official YKI level or pass prediction from current pilot numbers.
5. **REVIEW/LEARN (separate screen/session):** reveal right/wrong with S2 explanations, human speech review where available, user self-repair, Finnish chunks and real-world tasks. Keep the scored first attempt unchanged.
6. **TRANSFER:** sealed new voice/context/task after a planned delay; measure independent productive success (meaning and form separately), not familiar response recall.
7. **NEW EXAM:** unseen form with comparable verified coverage; preserve content-version and exposure lineage, report results per skill and uncertainty, not a fake improvement percentage.

**Example (original, not from YKI):** “Et pääse huomenna lääkäriin. Soita ja siirrä aika.” In EXAM, record a spontaneous request without a model phrase. Only after finishing REVIEW may show “Haluaisin siirtää aikaani / Sopisiko perjantai?” A later independent task asks to reschedule a bank visit, requiring a new utterance rather than the memorized answer.

## 4. Decision gates — falsifiable, non-compensatory

| Gate | Pass condition | Current state 2026-10-29 |
| --- | --- | --- |
| **G-EX-01: Source provenance** | 100% mandatory digital parameters source-linked with applies_to/date/reviewer/version; unknowns explicitly remain unknown | **PARTIAL** R02 source ledger; demo interactions not manually observed |
| **G-EX-02: Manual demo & field corroboration** | Four legal manual demo walkthroughs + conflict register; first-party live-2027 confirmation for strict claims | **NOT RUN** |
| **G-EX-03: Content validity/rights** | Every released key/task/audio independently reviewed for natural Finnish, CEFR, provenance, redistribution | **NOT COMPLETE** |
| **G-EX-04: No contamination** | No pre-finish keys/hints, locked first attempts, sealed held-out forms and form version audit | **PARTIAL** browser practice contracts |
| **G-EX-05: Honest productive assessment** | Calibrated human review and agreement, or visible UNGRADED; no unsupported official grade | **UNGRADED implemented; calibration NOT RUN** |
| **G-EX-06: Durable complete attempt** | Full fault-injection E2E incl. raw voice recovery on supported platforms; no false save receipts | **PARTIAL Web V1; Android not compiled, audio not durable** |
| **G-EX-07: Four-skill experience** | Complete independent subtest and full test flows with verified duration/count only where known | **9-item mini mock only** |
| **G-EX-08: Human outcome validation** | Consented feasible matched comparison, preregistration and blinded unseen day14/30 outcomes | **NOT RUN** |

No weighted fidelity or colorful design score can compensate for a failed critical gate. **Strict 2027 exact mode must stay disabled** until the relevant 2027 provenance and E2E evidence exist. Practice-only simulation may still be useful and should be accurately labelled.

## 5. Implement in small, reversible stages (do not duplicate R01–R12)

| Phase | Work | Artifact and executable test | Go / no-go |
| --- | --- | --- | --- |
| **P0.1 — immediately** | E01 + E02: OPH source audit, **manual** all-four demos; inspect available instructions and pilot questions; no copying tasks | Update existing R02 ledger + docs/14/21; record 4 skill-by-skill walkthroughs, each observed field and UNKNOWN | No strict UI rule until confirmed |
| **P0.2 — after 7 Nov 2026 pilot notices** | Re-check official OPH updates and date-specific guidance; investigate E03/E04 and engine differences | Delta report showing **changed/unchanged/not published**; official-profile fixtures | Pilot announcement alone does not verify production UX |
| **P0.3 — first functional slice** | E05–E08 + E10: one S2-approved original full-cycle prototype, meaningful voice and text with rights | Web 4-skill flow, save/reload/failure tests, original reviewed content | No full-exam claim from a mini bank |
| **P0.4 — reliability and review** | E09/E12/E13/E15: isolate EXAM vs LEARN, persist permitted audio, deliver valid post-exam feedback and unseen repeats | Human reviewer version, exact attempts, E2E keyboard/mic/voice/clock and transfer fixtures | Fail closed on lost voice/event |
| **P1 — user validation** | E11/E14/E16: feasibility, trial registration/consent, rater calibration, blinded comparisons | UX/device report; prespecified 14/30-day outcomes including null/negative | No efficacy or pass-rate claim without trials |

Use current [ADR-025 staged delivery](../../docs/25-implementation-vertical-slice-roadmap.md). Do not big-bang rewrite or mistake design milestones for implemented code.

**Specific pilot calendar:** OPH announced a Finnish intermediate digital pilot for **2026-11-07** (future relative to this plan); public outcome/release guidance should be rechecked after that date. The planned **2027-04-10** full Finnish intermediate digital sitting is a preparation milestone; the Hospodar date/profile needs to be reverified against the official calendar before publication.

## 6. Ownership, costs and stop-rules

- **Research/yki:** official claims and demos, versioning, evidence conflict resolution; requires explicit approval of digital-rule assertions.
- **Learning and S2 editorial:** authored content, genre/audio/voice register, productive rubrics and alternate valid responses; review before release.
- **App + contracts:** immutable first attempt; correct EXAM/LEARN separation, source-backed profile, durable voice and events, E2E failure tests; current Android parity remains blocked.
- **Research/ux and pedagogy:** study protocol, strong comparator, delayed unseen task pool and human-user consent; avoid circular evaluations.
- **Privacy/accessibility:** no public learner audio/text, retention/deletion and recorder consent; keyboard/screen reader testing and accommodations by explicit policy.
- **Stop / RECHECK:** insufficient OPH rule → UNKNOWN/practice-only; unsuitable/unknown media rights → link-only or exclude; rater disagreement → UNGRADED; lost recording → no inferred speaking result; failure-path storage ambiguity → NO saved-success assertion; study bias/underpowered outcomes → no marketing claim.

## 7. Traceability and checklists for each implementation PR

A PR implementing an EXAM change should link to: (1) an E01–E16 work package here, (2) its F1–F6 axis in [docs/21](../../docs/21-digital-yki-exam-simulator-executable-spec.md), (3) existing authoritative evidence record, (4) original S2/right approvals if content, (5) tested success and failure scenarios, (6) user-visible trust copy, and (7) a clearly named evidence status. No empty “passed” checkboxes.

**Documentation-only acceptance for this plan:** all 16 IDs present once, no new unverifiable official timing, R01–R12 crosswalk, links from [research/yki/README](README.md) and [docs/INDEX](../../docs/INDEX.md), no application behavior/data migration altered, actual tests and reviewer evidence reported separately. This document itself does **not** close any G-EX gate.
