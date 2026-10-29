# E03 — YKI suomi keskitaso: construct validity, item families and blueprint coverage (29.10.2026)

**Result:** FIRST-PARTY SOURCE + REPOSITORY CONTENT AUDIT COMPLETE. **Not completed:** independent Finnish S2 review, authorized digital Inspera inspection, full-size test-bank design calibration, empirical user testing, official 2027 timing/number-of-items verification. This is an E03 **research artifact**, not a statement that a full 2027 simulator is done.

**Boundaries:** [E01–E16 execution programme](exam-e01-e16-research-validation-plan-2026-10.md) · [canonical 13 families, 9 topics, 6 communicative functions](yki-official-patterns-v2.json) · [derived 13-family inventory, machine-checked](e03-construct-task-coverage-audit-2026-10.json) · [E01/E02 source audit](20-yki-official-complete-audit-2026-10.md) · [EXAM F1–F6 runtime spec](../../docs/21-digital-yki-exam-simulator-executable-spec.md).

## 1. Research question and evidence quality

**Question:** What content and item structure should Hospodar EXAM sample so that a candidate must actually comprehend, produce and interact in Finnish at intermediate B1/B2 levels, rather than memorize words or solve repeated quiz templates, while **not falsely asserting exact live 2027 YKI counts or UI**?

Three different evidence levels matter:

1. **OPH CURRENT:** A November 2026 digital pilot uses a test-centre computer; OPH says the tasks are similar to paper tasks, but this does **not** identify 2027 item counts, order, on-screen interaction or playback rights. [OPH 18.9.2026](https://www.oph.fi/fi/uutiset/2026/yki-digitestia-kokeillaan-marraskuussa-2026); planned Finnish pilot 7.11.2026 remains **future** relative to this study.
2. **JYU/SOLKI DESCRIPTIVE / LEGACY EXAMPLES:** four communicative skills, genres and historical task types can inform original test *constructs*. [JYU SOLKI YKI structure](https://www.jyu.fi/fi/hytk/solki/tutkimus/yleiset-kielitutkinnot-yki). [Reading examples](https://ykitesti.solki.jyu.fi/tutustu-testiin/testifin/keskitaso-tekstin-ymmartaminen/), [listening examples](https://ykitesti.solki.jyu.fi/tutustu-testiin/testifin/keskitaso-puheen-ymmartaminen/), [writing examples](https://ykitesti.solki.jyu.fi/tutustu-testiin/testifin/keskitaso-kirjoittaminen/), [speaking examples](https://ykitesti.solki.jyu.fi/tutustu-testiin/testifin/keskitaso-puhuminen/). These old pages describe **paper answer sheets, studio recordings and per-example seconds**. They are NOT live-2027 digital UX specifications.
3. **EXTERNAL MEASUREMENT GUIDANCE:** [ILTA Guidelines for Practice 2024](https://www.iltaonline.com/page/ILTAGuidelinesforPractice2024) require validity relative to intended decisions, adequate sampling, avoidance of construct-irrelevant variance, transparent score use, and demonstrated rater/technology suitability. [Council of Europe CEFR descriptors](https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors) provide reception, production and interaction outcomes, **not official YKI item quotas**.

**Copyright:** Only **describe** official item families and link to OPH/JYU. Do not copy test text, media, answer keys, screenshots or platform design without authorization. New content must be original, rights-cleared and individually S2-reviewed.

## 2. Critical new finding: 13 historically sourced task families vs Hospodar 2×9

The [canonical list](yki-official-patterns-v2.json) has **13 historically described task families** across 4 skills. Existing [mini-blueprint manifest](../../learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json) has only **2 mini sessions**, each with **3 reading + 4 listening + 1 writing + 1 speaking = 9 question/task units**. One item family can appear multiple times inside a block. **13 families ≠ 13 tasks** and a coverage percentage is *not* YKI fidelity or quality.

Derived audit (structural presence only, **no CEFR/S2 approval**):

| Skill | Present as a practice form (not calibrated) | Partial practice family | No equivalent in 2×9 minis |
| --- | --- | --- | --- |
| **Reading** | 3-option MCQ, true/false, short free response | — | None of 3 family *types*, but **genre and difficulty diversity are weak** |
| **Listening** | 3-option MCQ (4 per mini) | — | true/false and short free response; single synthetic voice limits realistic variation |
| **Writing** | opinion prompt | one formal course-organizer enquiry, not a range of complaint/application genres | separate personal/friendly message |
| **Speaking** | opinion prompt | one isolated situational response (not a five-event sequence) | sustained narrative and **audio-driven multi-turn conversation** |

**Count: 6 structurally present + 2 partial + 5 missing = 13.** This is an *internal catalog gap audit* only. Presence does not mean a task is licensable, validated or representative of an official live exam. The reading open answer is **UNGRADED**, although the underlying objective reading questions are keyed. Listening currently uses synthetic audio; speaking voice is **not durably preserved** across reloads. Even a 13/13 coverage result would never justify “100% authentic YKI”.

**Important potential construct underrepresentation:** one opinion plus one short speaking situation cannot test turn-taking and sustained real-world explanation adequately; one synthetic monologue cannot represent all of conversational listening. This inference is supported by JYU’s broader construct description, but we do **not** claim it is a measured performance deficit in Hospodar learners.

## 3. What a high-quality EXAM item must actually measure

### Reading — comprehension, not keyword matching

- **Potential authentic genres:** service notices, personal messages, advertisements, news, opinion/factual texts and narratives. Source: JYU descriptions.
- **Functions:** identify purpose/genre, main claim, necessary detail, implied consequence, author intent; not just find identical words from a prompt.
- **Original item rule:** the keyed answer must be uniquely best based on evidence in the passage; distractors plausible but not ambiguous. For example, a notice requiring an appointment should distinguish *booking requirement* from *opening hours*; do not reuse a printed official example.
- **Reviewer evidence:** for each option record text-span reasoning (internal, after EXAM only), possible alternative readings, reading load and accessible typography. Open comprehension responses require human/validated semantic rubric or UNGRADED — never arbitrary exact-string matching.

### Listening — genuine oral comprehension

- **Potential genres:** announcement, practical message, conversation, interview, news and information notice (JYU).
- **Construct:** listening to intention/meaning under natural Finnish prosody; disambiguate details and pragmatics, not artificial “hear matching word → click same word”.
- **Minimum content metadata for new assets:** recorded speakers, country/region and acceptable pronunciation without making accent identity an ability score, register/puhekieli, authentic duration, codec/checksum, sound quality, actual rights/license, transcript provenance, S2 naturalness review and timing.
- **Missing family targets:** original true/false and open-short answers; investigate robust semantic answer policies and fairness before automated marking. **Digital replay count, seeking and auto-start remain UNKNOWN**; do not force historical “twice” into the 2027 strict profile.

### Writing — purpose and audience first

- **Evidence:** historical Finnish examples contain a functional email and an opinion essay; general JYU explains **three different writing tasks**. This is a historical/construct signal, **not proof** that the 2027 screen will always have three fields or the same durations.
- **Our original genre prototypes (not yet written):** friendly message about a changed plan; practical request or complaint to housing/service provider; reasoned opinion on a common everyday issue.
- **Review matrix:** task fulfillment (all required speech acts), audience/register, intelligibility, organization, lexical and grammatical appropriateness, coherent argument; do not turn writing scoring into grammar-error counting.
- **No official word-count thresholds** until OPH publishes them. Our character limits are application safety controls, not exam specifications.

### Speaking — independent communicative response

- **Historically described families:** spontaneous situational reaction, multi-turn recorded role-play, sustained personal account and supported opinion.
- **Missing highest-value content:** original dialogue with **actual recorded interlocutor turns**, each requiring context-specific answer; narrative requiring a sustained coherent account; situational battery with multiple scenarios.
- **Review matrix:** meaning conveyed, response to interlocutor, turn management, intelligibility and fluency, register, sufficient language to complete task; acceptable colloquial variants. **No penalties for native-accent differences** when intelligibility is preserved.
- **Not allowed yet:** label a typed plan “spoken B1”, count speech seconds as proficiency, use an LLM to issue a fake YKI 3/4 score, or rely on recording not surviving reload.

## 4. Map content to real communicative functions (without creating another canonical taxonomy)

**Reuse** exactly **T01–T09** topics and **F01–F06** functions from [canonical taxonomy](yki-official-patterns-v2.json). New tasks store IDs, not parallel categories. Proposed planning grid **for internal balanced sampling, not official distribution**:

| Candidate context | Reading purpose | Listening purpose | Writing purpose | Speaking purpose | Functions to sample |
| --- | --- | --- | --- | --- | --- |
| Housing and services | understand maintenance/service notice | clarify schedule and necessary actions in a conversation | ask permission, clarify problem or file reasonable complaint | negotiate appointment, explain an issue | information, everyday transactions, politeness, regulating exchange |
| Work and learning | understand schedule/rules | interpret changed shift/course details | explain availability or request change | respond to a colleague, clarify misunderstanding | giving information, asking, social norms |
| Health and everyday life | understand practical directions | distinguish advice vs instruction | write a polite inquiry or update | explain issue and ask follow-up | asking/clarifying, feelings, social roles |
| Society and environment | interpret opinion/news and evidence | identify speaker’s stance in interview | express opinion with reasons | defend balanced view, disagree politely | opinion, reasoning, conversation management |

**Selection guardrails:** sampling from several real-life domains and functions across a form; a reasonable range of text/audio length and B1/B2 cognitive/pragmatic demand; multi-talker material where suitable. Do **not** apply fixed made-up percentages/quotas as official 2027 requirements. A B2-hard sentence does not become a validated B2 task solely because it is longer.

## 5. Executable editorial and psychometric research protocol

1. **Item definition (before drafting):** \`item_id\`, \`skill\`, existing \`Txx/Fxx\`, \`canonical_pattern_id\`, \`communicative_goal\`, \`genre\`, \`audience\`, \`source/provenance\`, \`rights\`, \`target_demand_hypothesis\`, \`form_status\` and \`asset_manifest\`; version changes require new content hash.
2. **Original authoring:** write only independently authored Finnish tasks with meaningful communication, correct answer variants and prompts; no direct copying of copyrighted SOLKI tasks. Create at least 2 alternate plausible forms for distractors where feasible.
3. **Independent S2 round A:** two adult-Finnish S2 specialists separately check language naturalness, clarity, level-demand hypothesis, unintended distractors and alternate possible correct answers, including colloquial language and realistic pragmatics.
4. **Adjudication round B:** reconcile disagreements and document revision; reject impossible/ambiguous response requirements, insensitive stereotypes and tasks where specialized background knowledge is the main gate.
5. **Pre-pilot dry run:** review accessibility, listening voice intelligibility, speaking audio capture, keyboard/ä/ö, scoring consistency and task-exposure leakage. A source-level script does not replace browser test.
6. **Pilot with consenting learners:** compare observed item difficulty, nonresponse, solution time, distractor selection, complaints, rater agreement and possible subgroup unfairness. Use content-validity judgement before statistics; fit Rasch/IRT only when data and test form design justify it. **No invented fixed sample size or score cutoffs.**
7. **Distinct pools:** AUTHOR_DRAFT → S2_APPROVED → PILOT → PRACTICE_EXPOSED; and separate sealed HELD_OUT_EXAM/TRANSFER. Do not claim unseen/independent if user has had an explanation, answer key or identical audio before.
8. **Release/withdrawal:** on error, rights issue, ambiguity, misleading scoring, acoustic failure or leakage, deprecate affected task version and handle previously collected data transparently. Only S2_APPROVED + rights-cleared items may be released as reviewed content.

**Outcome validity:** compare performance on genuinely new language situations on day 14/30, not a repeated bank. Human speaking/writing ratings remain independent and blind to condition when feasible; see [R01 protocol](../ux/learning-impact-evaluation-protocol.md), [R04](../pedagogy/31-r04-speaking-writing-human-calibrated-assessment-2026-10.md), [E16 causal study](exam-e01-e16-research-validation-plan-2026-10.md).

## 6. Actionable backlog, in priority order (source-backed, not official structure)

| Priority | Work contract | Concrete deliverable | Release gate |
| --- | --- | --- | --- |
| **P0-1** | LISTENING_TF + LISTENING_OPEN | Two original item families, S2-checked comprehension rationale and licensed sound; decide semantic scoring/UNGRADED | Objective key correctness or human open-answer review; no fake percent |
| **P0-2** | SPEAKING_DIALOGUE + SPEAKING_NARRATIVE | Original recorded interlocutor turns and sustained storytelling; separate mic and reply windows as **practice only** until E02/E04 | Audio lifecycle, replay/recording tests, S2 communicative validity |
| **P0-3** | WRITING_MESSAGE + richer WRITING_FORMAL | Friendly message, service request/complaint, recipient/genre variants | S2 review, genre/register rubric, no official UI word-count invented |
| **P0-4** | Reading/listening genre/voice diversity | Original short+long reading material; multi-talker listening, different register, discriminating inference items | Human reviewer can justify unique best answers and natural voices |
| **P0-5** | Independent held-out exam sets | Balanced planning pools with disjoint item/audio ids and per-skill unknown-item exposure logs | No repeated scored forms after LEARN review; save version/evidence |
| **P1** | Difficulty and calibration | Author hypotheses vs blinded S2 judgments and pilot performance, option diagnostics and rater disagreement | No CEFR/YKI level claims until evidence; item failure withdrawal |
| **Blocker** | E01/E02 live digital UX rules | Published official confirmation of 2027 counts/order/timer/audio/entry UI + E2E proof | Official strict profile remains null, not copied from older studio tasks |

### Engineering interface proposal (DESIGN ONLY)

The future form assembler should consume current canonical pattern IDs, never a second enum. Each proposed \`TaskVersion\` points to \`canonical_pattern_id\`, \`Txx/Fxx\`, \`genre\`, \`target_construct\`, \`rights\`, \`S2_review\`, \`asset_hash\` and \`exposure_pool\`. The form builder rejects a strictly claimed official exam when \`official_2027_item_count===null\`; practice-only mock shows an explicit disclaimer. Completing a mock seals first answers, then unlocks explanation events in **LEARN**; all new probes use distinct item IDs/assets.

Do **not** rewrite [app/exam-core.mjs](../../app/exam-core.mjs) or manufacture complete 2027 form sizes based on this research alone. Implementation requires small code PRs, E2E failure tests, content provenance and S2 approval.

## 7. Completion statement and next dependencies

| E03 deliverable | Status at 29.10.2026 |
| --- | --- |
| Primary first-party construct review (JYU/SOLKI/OPH) and research validity principles (CEFR/ILTA) | **DONE — dated source review** |
| Map canonical 13 families to existing 2×9 mini data and identify structural gaps | **DONE — JSON + regression unit tests** |
| Define cross-skill blueprint criteria, S2 content QA and held-out leakage protocol | **DONE — proposed, NOT executed** |
| 13/13 original S2-approved family exemplars | **NOT DONE** |
| Four full-size E03 representative live-2027 calibrated exam modules | **NOT DONE** |
| Confirm exact 2027 item counts and timing via authorized actual Inspera/manual + OPH | **BLOCKED E01/E02/E04** |
| Randomized learner trials or credible level-3 prediction | **NOT DONE (E09/E11/E16)** |

**Practical next step:** begin E04 timing only in a strict evidence-first profile (no made-up seconds), while content engineering can independently start **P0-1 + P0-2** with original items, human S2 editorial approvals and reproducible tests. Neither strand alone is sufficient to claim “accurate YKI 2027”.
