# 33 — R06: прозора персоналізація фінської A1.3–B2.1, адаптивне повторення і чотири навички

**Перевірка:** 28.10.2026. **Owner:** research/pedagogy, implementation owner app learning domain, study owner R01 UX. **Status:** CRITICAL_SELECTIVE_REVIEW_COMPLETED / REFERENCE_PROTOTYPE_ONLY / USER_TRIAL_NOT_RUN / APP_NOT_INTEGRATED. Ціль: українськомовні дорослі A2→B1+ (ширша LEARN A1.3–B2.1). Розділяти LEARN і EXAM YKI 2027. Це не PRISMA, не дані користувачів і не доведена ефективність Hospodar.

**Не дублювати:** [R01 human outcome study](../ux/learning-impact-evaluation-protocol.md), [R03 Finnish morphology](30-r03-finnish-morphology-ukrainian-learner-evidence-2026-10.md), [R04 calibrated speaking/writing](31-r04-speaking-writing-human-calibrated-assessment-2026-10.md), [R05 natural multi-talker audio](32-r05-multitalker-phonetic-transfer-2026-10.md), [70 canonical methods](learning-methods-v1.json), [current SRS](../../app/core.mjs), [current active mission selection](../../app/app.mjs), [quiet audio UI](../design/19-r05-sound-visual-design-transfer-2026-10.md), [ADR-024/027](../../docs/27-stack-architecture-compatibility-and-implementation-gates.md). Немає нового другого методичного реєстру і нових ratings.

## 1. Рішення для Hospodar — не плутати evidence і гіпотезу

**Question/PICOT:** чи покращить прозорий локальний рекомендатор S2-редагованих фінських вправ із урахуванням due reviews, помилок першої незалежної спроби, балансу 4 навичок, реального рівня task, доступного часу та обраної теми **самостійну нову комунікативну відповідь через 14 днів** порівняно із **сильним** фіксованим інтервальним розкладом з таким самим контентом, media, рівнем, відгуком та часом? Day-30 secondary, слухання/читання/писання/говоріння роздільно; trained task recall ≠ transfer. Людський pilot не виконано.

**Decision:** ADOPT/P0 evidence-quality separation + transparent user choice + privacy; EXPERIMENT/P0 proposed ranking weights and adaptive scheduling, not claim superior; REJECT YKI 3/4 probability, hidden AI-model scoring, generic personal-proficiency estimates from 1 quiz. Existing 1/3/7/14/30 SRS remains unchanged and useful as comparison — ці інтервали не називати універсальним науковим оптимумом.

## 2. Critical evidence ledger: research → learner action → test

| ID / original source | What is supported and limits | Product decision |
|---|---|---|
| R06-E01 [Kim & Webb 2022, L2 meta](https://doi.org/10.1111/lang.12479) | 48 experiments, N=3411, 98 effect sizes. Spacing > massing on average; delayed longer spacing often better; equal vs expanding not reliably distinct. **Not** the best universal personalized algorithm. | ADOPT/P0: space independent Finnish recall, compare strong fixed spaced schedule vs R06. |
| R06-E02 [Salmela et al. Finnish Morphology Application online 2024, RCT](https://doi.org/10.1080/09588221.2024.2365664) | Finnish adult beginner n=33 targeted app vs n=38 active app, 3 weeks; better morphological written production in targeted arm, but content+training+schedule bundled, no isolated adaptive scheduler or real-life B1 speaking. | ADAPT/P0: give confirmed R03 form/meaning errors independent targeted tasks, without claiming scheduler causal efficacy. |
| R06-E03 [Settles & Meeder 2016 HLR](https://research.duolingo.com/papers/settles.acl16.pdf) | Language platform word-level half-life regression ≥45% prediction-error improvement vs baselines; 12% daily engagement operational study; not Finnish communicative achievement. | RECHECK/P1 learned memory modeling when longitudinal consenting data and stronger baselines exist. |
| R06-E04 [Tabibian et al. 2019 MEMORIZE](https://doi.org/10.1073/pnas.1815156116) | Mathematical optimal-control scheduler and Duolingo large natural experiment; studied recall/frequency cost under assumed model, not YKI trial. | EXPERIMENT/P1 after cold-start and cost validation, do not present optimal universal dates. |
| R06-E05 [Gonçalves et al. 2025 retrieval vs elaboration meta](https://doi.org/10.1007/s10648-025-10076-6) | 44 studies / 142 comparisons, retrieval vs meaningful elaboration g=.14; feedback matters, no-feedback retrieval can underperform elaboration. | ADAPT/P0: independent first answer + focused feedback + self-repair + novel context; strong comparison. |
| R06-E06 [Sonbul et al. L2 collocations published 2025](https://doi.org/10.1002/tesq.3364) | 83 Arabic-L1 EFL, 23 collocations; equal and expanding spacing > no exposure; equal favored recognition, recall difference not significant. | ADAPT/P1 test chunks separately; avoid blind assumption expanding best. |
| R06-E07 [Spaced L2 phonetics, 2026](https://doi.org/10.1017/S0272263125101447) | Mandarin-to-English phonetic perception, spaced > massed; equal vs expanding no significant difference. Perception not speaking. | ADAPT/P1 separate perception review from R04 human speaking; new voice held out. |
| R06-E08 [Cao et al. 2025, 2 experiments N=1589](https://escholarship.org/uc/item/61p4p686) | Indonesian vocabulary: under time constraints harder material may need successful repetitions before spacing; immediate vs delay differ. | ADOPT/P0 scaffold failed first attempts instead of overwhelming overdue queue. |
| R06-E09 [Tang & Alibakhshi 2026](https://doi.org/10.1016/j.lmot.2026.102310) | EAP university n=84 quasi-experimental, eight-week adaptive flashcards; intact groups confound algorithm with teaching and content. | EXPERIMENT/P1 Finnish active comparator matched content/time/teacher QA. |
| R06-E10 [Dai et al. 2024 educational explanations](https://doi.org/10.58459/rptel.2024.19020) | N=276 high-school mathematics task recommender; explanations improved observed learning/perceptions but not quiz counts, transfer to Finnish unknown. | EXPERIMENT/P0 concise factual Why this task? and manual choice; delayed Finnish outcome. |
| R06-E11 [LAD meta Oct 7 2026](https://doi.org/10.1016/j.iheduc.2026.101119) | 21 pooled controlled, student dashboard g=.287; prediction interval contains 0, dashboards isolated from actual adaptive engines. | REJECT/P0 dashboard/magic mastery instead of measurable independent Finnish results. |
| R06-E12 [Aldabou & Mohammadzadeh online Oct 17 2026](https://doi.org/10.1177/21582440261498103) | Systematic review 65 EFL/ESL studies: contextual AI vocab benefits but real-world and long-term transfer lacking; not Finnish. | ADAPT/P1 curated meaningful interactions without cloud LLM, 14/30-day real response. |
| R06-E13 [Adaptive fact-learning cold-start simulation 2024](https://doi.org/10.1007/s11257-024-09401-5) | About 100M trials, 140k learners; item what info often better than learner who for early estimates. Predictive simulation, no measured learner causal uplift. | ADOPT/P0 neutral item-difficulty priors and explicit insufficient-evidence state, not ability labels. |
| R06-E14 [Idowu 2024 fairness review](https://doi.org/10.1007/s40593-023-00389-4) | Educational predictions/recommendations risk unfair performance across users; no single universal fairness fix. | ADOPT/P0 no inferred L1, ethnicity, age, disability; consented subgroup outcome review with uncertainty. |
| R06-E15 [European Commission data-minimization principles](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/principles-gdpr_en) | GDPR lawful specific purpose, minimize personal data, transparency, limited retention; normative not effectiveness experiment. | ADOPT/P0 local-only profile, export/delete, no microphone/health/attention telemetry. |

**Methodological limits:** Sources original publisher abstracts/full accessible content, no completed PRISMA/individual risk-of-bias review; meta analyses may overlap primary studies; HLR metric predictive error/engagement ≠ learning gain. None tested Hospodar Ukrainian-L1 Finnish with real 2027 YKI. Standardized g/d never convert to percentage or pass chance.

## 3. Existing MVP audited from main

- [core.mjs](../../app/core.mjs) already implements deterministic card stages 1/3/7/14/30; failed **first independent answer** resets stage even if guided repair succeeds; no human-calibrated CEFR score.
- [app.mjs](../../app/app.mjs) function missionSelection currently picks **earliest due grammar item** or first unseen one. **Not** four-skill personalization. Four-skill diagnostic is one sample per skill, objective reading/listening vs **ungraded** speaking/writing.
- Current state uses localStorage rather than future Web Dexie / Android Room; do not alter/migrate existing learner records in this research PR.
- [R06 isolated deterministic reference core](../../app/adaptation-core.mjs), [its Node unit tests](../../app/tests/adaptation-core.test.mjs) are a **testable research prototype, not connected to active missionSelection/UI**. No real user trials, no actual production rollout, no new native app.

## 4. Safety-critical data/decision contract

**Input/task metadata**: only rights-cleared, S2-approved original task ID, content version, level (human editorial estimate), skill, topic, estimated minutes, offline availability, necessary prerequisites and independent-item label. External media with no rights never recommended as installed media; content packages fit previous full 3–4GB install-time planning cap.

**Observed evidence**: first-independent objective scored result or explicitly human-reviewed score only. An ungraded writing/speaking answer is **exposure only**, neither wrong nor mastered. Failed guided repair ≠ fresh independent evidence. Observed R03 mistake (case meaning, stem allomorphy, verb rektio) requires verified error label, not stereotyped assumptions about Ukrainian learners.

**Constraints first**: mode=LEARN only; no EXAM-only, no hidden held-out keys, no unapproved source, no inaccessible missing media, prerequisite unmet or session longer than learner-available time. Device offline support validated separately for real packs; no automatic extrapolated score. No internet, cloud model, webcam, inferred mental fatigue or voice/accent demographics.

**Provisional ranking factors** (proposal, not empirically fitted coefficients): overdue due review 0–35; confirmed first-try error 0–22; four-skill practice exposure balance 0–15 (NOT competence); approved novel item 0–6; user's selected skill 0–6; selected topic 0–2. Stable task ID tie-break. All factors must yield truthful human-readable reasons, e.g. "Ти помилився в цій вправі у першій самостійній відповіді", "Планове повторення прострочене на 2 дні", "Ти обрав тему Житло", not "B1 93%". Users can choose another task/skill or disable recommendations in future UI.

**Cold start:** don't infer ability from 1 answer. Pick S2-reviewed level-appropriate clear starter tasks from user-selected skill and interests. Show "не вистачає даних для індивідуального висновку". No proprietary acoustic/psychological estimates.

**Language example:** phone voicemail about repair: "Huoltaja pääsee käymään torstaina kahden jälkeen. Soittaisitteko takaisin keskiviikkoon mennessä?" → first unguided listening gist/detail → feedback on *kahden jälkeen / keskiviikkoon mennessä* → own reply "Voin olla kotona torstaina puoli kolmelta" → later unseen speaker & new time situation. Voice rights R05 required. Writing alternative is a huoltoyhtiö complaint with original sentence, self-repair, later different recipient; writing stays ungraded without R04 calibrated human scoring.

## 5. Experiments — future preregistration, NOT RUN

| Trial | Treatment vs strong equal-time/content comparator | Primary independent day-14 outcome |
|---|---|---|
| R06-H01 / P0 | Transparent multi-skill error/due/exposure weighted ranker vs high-quality level-aware **fixed-spaced** task order with same content, media, feedback, duration and choice | Blind S2 scoring of unseen Finnish communicative writing and oral responses separately; objective new reading/listening separately; day30 secondary |
| R06-H02 / P1 | Exact same task order, "Why this task?" plus override vs normal transparent task picker | Held-out Finnish task success, burden, dropout and override frequency; not click-through alone |
| R06-H03 / P1 | Targeted independently confirmed R03 grammar errors vs exposure-balanced review with same due schedule | New morphological meaning-in-context and novel writing, not trained form repeats |
| R06-H04 / P2 | After consented sufficient histories: HLR/memory-optimized scheduling vs deterministic strong baseline | Calibration of recall prediction **and** blinded new communication outcomes; chronological held-out train/test split, subgroup cold-start |
| R06-H05 / P1 | Dense after-failure scaffold vs immediate forced spaced review | Novel day-14 success in difficulty-matched Finnish chunks and learner frustration/dropout |

**Requirements:** preregister outcome/analysis/missingness/minimum meaningful difference and power feasibility; stratify independent baseline; preserve answer keys and new-speaker held-out audio; human-rater blinded independent of recommender, harm/attrition, honest null results. No invented participant sample size or predeclared benefit.

## 6. Product acceptance R6-01…R6-18 (all PROPOSED, prototype does not pass product gates)

1. Pure deterministic same inputs → same ordered tasks/reason codes.
2. Only LEARN; never EXAM-only content or exam answer leaks.
3. S2-approved, rights-cleared, offline-available item filter enforced before ranking.
4. Media/skill prerequisites and time limit actually enforced.
5. Evidence of first independent result, never guided repair as proficiency.
6. Ungraded speaking/writing never counted as correct/wrong or official YKI grade.
7. Stable rule bounds and invalid date handling; Finnish local DST-safe overdue calculation.
8. Cold-start neutral content with no fabricated CEFR/proficiency/psychological score.
9. Each reason grounded in actual observed learning record or explicit user choice.
10. Four-skill practice coverage; exposure count separated from human-judged mastery.
11. Accessible manual choice, skip, sound-off/reduced-motion control.
12. Device offline source/pack readiness; 3–4GB allowed content size not a storage utilization target.
13. Preserve existing attempts across future storage migration and offline resume.
14. Reasonable low-data cap, export/delete/local privacy, no default telemetry.
15. Nonpunitive variant-sensitive R03 Finnish morphology and acceptable puhekieli.
16. No surprise music/SFX under reading, writing, listening or recording.
17. Controlled time-matched blinded unseen day-14/30 real user evaluation with uncertainty.
18. Feature PR includes QA across Web/Android E2E and rollback, before any measured-uplift claim.

**Next source track:** R07 meaningful interactive UX; carry design tokens and R05 audio-first discipline forward. Research complete ≠ finished product feature or empirically proven adaptive improvement.
