# Learning impact experiment protocol — true language gain before visual delight

**Статус:** EXPERIMENT DESIGN / **NO PARTICIPANT DATA COLLECTED**. Updated 2026-10-22.
**Owner:** UX evaluation; collaborate with pedagogy/S2 reviewer, design, accessibility and engineering.
**Scope:** approved improvements to LEARN; EXAM remains a protected assessment and requires confirmed official fidelity policy.

## R01 primary pilot dossier — implementation-ready *draft*, NOT REGISTERED/NOT RUN (28.10.2026)

Related [12-workstream evidence and scope](../29-twelve-product-research-studies-execution-2026-10.md#r01--виміряти-реальну-ефективність-learn-а-не-швидкість-натискань). **Do not recruit people or claim registration** until data controller, privacy owner, S2 panel and a competent study reviewer approve the actual protocol.

- **Population:** adults learning Finnish, initially UA-speaking A2–B1; independently assessed baseline, learner recruitment not yet started. Avoid claims that 50 or 100 participants provides power without planning.
- **Hypothesis:** Hospodar contextual `retrieval→feedback→repair→new-context→spaced` yields higher **day-14 uncued new-context writing communicative success** than a strong `elaboration→feedback` programme with matched duration, Finnish item objectives, S2 review and exposure. This comparison isolates the integrated pedagogy only imperfectly: **explicitly describe changed components**.
- **Assignment:** randomized and baseline-stratified groups; freeze content versions, comparable prompts and independent held-out variants; no hidden correct-answer leakage. No crossover until carryover analysis establishes validity.
- **Primary endpoint:** one **pre-defined** functional writing rubric (whether recipient can understand/use the request), with separate grammar/form subscore; independent blinded Finnish S2 evaluation. Formal scoring scale, minimum meaningful difference, assignment scheme, sampling/power, primary analysis and missingness strategy **must be settled before enrolment**.
- **Secondary:** day-30 writing, day-14/30 unseen reading, listening with new voice, and speaking only if consented voice + calibrated humans. Do not treat 4 skills as one uncorrected primary family.
- **Telemetry:** minimal opt-in `participant_pseudonym`, `study_arm`, `assignment_version`, `content_version`, `attempt_event_id`, `first_response_at`, `feedback_exposure_at`, `due_at`, `actual_attempt_at`, `valid_independent_answer`, `missing_or_late_reason`; keep privacy/voice separate, no names or raw responses in public Git, data deletion documented. Existing 120-record localStorage cap risks deleting baselines; must be fixed before launch.
- **Reporting:** participant flow, observed outcomes **including null/negative**, attrition, 95% CI, prespecified ITT with sensitivity, rater agreement and adverse burden; score each skill, not a fake official CEFR level. Gate: second human reviewer and S2 licensed/verified prompts.
- **Required acceptance before a single trial participant:** tested first attempt durability across reload/offline; sealed new items; anonymization & withdrawal; calibrated rating rubric; ethics/privacy sign-off; documented versioned study protocol. **Current: NONE of these readiness gates verified as a set; R01 status NOT RUN.**

## 1. Study question and research ethics

Pre-register a **specific falsifiable hypothesis**: e.g. "Optional focused visual cue during explanation improves 14-day unaided use of Finnish inessive/illative in *new* contexts, compared with time/content-equivalent plain explanation." A preference for animation is **not** this outcome.

- Population: adult Ukrainian-speaking Finnish learners A2–B1+, include baseline CEFR/skill and accessibility needs without collecting unnecessary protected personal information.
- Consent: informed opt-in to study/telemetry/voice separately, withdrawal and retention/deletion controls; no learner raw voice, screenshots, names or private answer logs in public GitHub.
- Analysis plan: register research question, assignment, test window and primary metric **before first enrolment**. Distinguish exploratory and confirmatory comparisons; adjust for multiple tests rather than picking the winning segment after results.
- Baseline/control: matched Finnish text/audio/task, total practice time, teacher guidance, topic difficulty, exposure count and independent test pool; **randomized between-person or appropriate counterbalanced design**. Account for carryover in within-person experiments. Blind human rating where possible.

## 2. Primary outcomes (not vanity metrics)

| Dimension | Outcome and collection | Interpretation and guardrail |
| --- | --- | --- |
| Delayed independent retention | Day-7 / day-14 (and optionally day-30) **unseen** Finnish chunk/task recall without hints/transcript/sample answer | Record attrition; do not treat recognition click as independent production |
| Generalization/transfer | New communicative context, unfamiliar audio/voice, unseen writing/speaking prompt; content versions frozen | Stratify four skills; avoid rehearsal contamination |
| Communication quality | Human-reviewed task success/content and separate language control; productive skills have rubric and uncertainty | Never equate product score with official YKI 3/B1 decision |
| Task usability | Task success, misclicks, navigation errors, interruptions, voluntary abandon, subjective workload and participant comments | Secondary outcomes; clicks/time alone are not proof of better learning |
| Attention/fatigue & accessibility | Self-reported distraction, motion/sound tolerability, keyboard/screen reader/mic-denied journeys, dropout | Avoid intrusive eye-tracking or inferred diagnoses without specific justification |
| Safety & trust | Misleading save/grade claims, exam leakage, recording consent, storage failure, privacy/rights complaints | Any serious failure blocks rollout regardless of learning uplift |

## 3. Study lifecycle and acceptance

1. **Protocol:** link relevant reviewed evidence [22](../pedagogy/22-memory-attention-sensory-learning-evidence-2026-10.md); specify target persona, hypothesized mechanism, independent outcomes and a **minimal** UI variant.
2. **Design:** decide sample-size/power feasibility where applicable; pre-register minimum meaningful improvement or equivalence bounds (do **not** invent a universal magic +20%). Plan reporting with confidence intervals, effect sizes, exclusions, attrition and negative outcomes.
3. **Quality/consent:** S2 teacher verifies Finnish stimuli/answers; test navigation, WCAG 2.2, reduced motion, audio control, screen-reader and offline behavior. Make quiet/plain variant always usable; learners choose accommodations.
4. **Run:** feature-flag randomized LEARN variants; protect EXAM and held-out items. Avoid unapproved tracking or manipulating reward loops to coerce excessive time in app.
5. **Analyze:** intention-to-treat when appropriate, sensitivity checks including dropout and time-on-task; inspect iOS/Android, novice/advanced and accessibility strata without spurious subgroup claims.
6. **Decision:** ADOPT only for demonstrable meaningful benefit with no unacceptable UX/a11y/privacy regression; ADAPT/RETEST for inconclusive results; REJECT if harm. Publish **anonymized aggregate** with version, date and limitations. Do not fabricate real-world sample sizes or A/B results.
7. **Handoff:** annotate [product requirements](../../docs/15-two-modes-skill-scopes.md) and [EVIDENCE-TO-UX guide](../../docs/guides/EVIDENCE-TO-UX.md) with exact acceptance cases; engineering tickets/PRs reference **existing** research IDs, no duplicate catalogs.

## 4. Planned first study set

- **UX-L01 (P0):** no-effect vs meaningful semantic visual cue for Finnish case usage in novel communicative writing at day 14.
- **UX-L02 (P0):** spaced independent retrieval vs rereading with matched material/time/exposure, day-7/14 unseen production.
- **UX-L03 (P1):** captions/transcript timing + user control vs equally accessible baseline on new Finnish listening comprehension.
- **UX-L04 (P1):** focused user-controlled audio cues vs quiet baseline on effort, comprehension and delayed recall.
- **UX-L05 (P1):** NPC information-gap conversation vs plain equivalent conversation, day-14 independent oral transfer.
- **UX-L06 (P1):** short self-chosen 10/20-minute missions vs fixed-length task under equal cumulative study dose.

**Nothing above has been run yet.** Link actual study outcome only after it exists. See [UX backlog](ux-research-backlog-v1.md) for existing scenarios; this document owns **measurement design**, not duplicate issue tracking.

**References:** [CAST UDL 3.0](https://udlguidelines.cast.org/), [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [L2 spacing review](https://doi.org/10.1111/lang.12479), [multimedia meta-review](https://doi.org/10.3102/00346543211052329).

## 5. UX-L02 instrumentation pilot (24.10.2026; NOT a trial)

**Status:** partial Web implementation, **NO participants / NO measured impact**. The Web LEARN `7/14/30 днів` tab and `app/retention-core.mjs` reuse canonical `spaced-retrieval` (expert **Product fit 98/100; expected learning effectiveness 96/100**, neither a percent gain nor a measured causal effect). A task bank of 12 original prompts covers 4 grammar contexts. The prompts differ from the initial cloze, but **unseen content** is not guaranteed because learners can inspect shipped assets and similar contexts; they are not a held-out, calibrated test set. Day 7/14/30 is a **fixed exploratory scheduling convention**, not scientifically established as the unique optimal spacing.

**Scientific support already catalogued:** Kim & Webb (2022), [DOI 10.1111/lang.12479](https://doi.org/10.1111/lang.12479): 48 L2 spacing experiments (3,411 participants; 98 effects), advantages particularly relevant to delayed retention, with no statistically established superiority of equal over expanding spacing. This review does **not** test our app, Finnish grammar, Ukrainian learners or ungraded free writing. Official [JYU YKI scope](https://www.jyu.fi/fi/hytk/solki/tutkimus/yleiset-kielitutkinnot-yki) includes four distinct practical skills; this pilot only captures **writing**, not language scores in all four.

**Validity guardrails:** first independent response is preserved; no model answer or text-generation suggestions before submission, writing kept `ungraded`, missed windows explicitly tracked instead of retrospectively completed, results remain local with export/delete. An observation stores both nominal checkpoint day and the actual elapsed days/late-by-days to prevent misreporting delayed outcomes. Current on-device clock is the scheduling source, not an anti-tampering scientific timestamp. The localStorage 120-entry attempt cap can remove old baselines; long-term study tracking requires a future durable ID/migration design.

**Next study (not run):** adult Finnish A2–B1 participants, randomized time-matched spaced retrieval vs equally timed rereading, independent S2/teacher blind rubric on *separate held-out production tasks*, 7/14/30-day attrition, intention-to-treat and confidence intervals; stratify by rektio/case, no automatic CEFR/YKI prediction. Stop/adapt on increased burden, incorrect Finnish prompts, accessibility issues or null/negative unseen outcomes. Content requires human S2 review before being represented as vetted training material.
