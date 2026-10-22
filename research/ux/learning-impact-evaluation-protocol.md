# Learning impact experiment protocol — true language gain before visual delight

**Статус:** EXPERIMENT DESIGN / **NO PARTICIPANT DATA COLLECTED**. Updated 2026-10-22.
**Owner:** UX evaluation; collaborate with pedagogy/S2 reviewer, design, accessibility and engineering.
**Scope:** approved improvements to LEARN; EXAM remains a protected assessment and requires confirmed official fidelity policy.

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
