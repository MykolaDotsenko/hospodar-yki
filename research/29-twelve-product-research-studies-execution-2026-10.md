# 29 — 12 досліджень Hospodar YKI, послідовно: перевірені джерела → рішення → протоколи → критерії завершення

**Перевірено:** 28.10.2026. **Owner:** cross-domain research programme. **Аудиторія:** дорослі україномовні учні фінської A1.3–B2.1; **два рівноцінні продукти LEARN і EXAM**. **Статус:** **12/12 SOURCE-BASED DESK REVIEWS + IMPLEMENTATION/STUDY DESIGNS DOCUMENTED; 0/12 REAL-USER STUDIES RUN.** Це не systematic PRISMA review, не лонгітюдне дослідження користувачів і не доказ того, що Hospodar кращий за альтернативи. **Не підміняти** завершений огляд реальною людською участю, калібруванням оцінювачів або перевіркою OPH demo.

**Джерела істини:** [research protocol](RESEARCH-PROGRAM.md), [70 канонічних методик](pedagogy/learning-methods-v1.json), [два експертні рейтинги](pedagogy/learning-effectiveness-ratings-v1.json), [learning outcomes study protocol](ux/learning-impact-evaluation-protocol.md), [UX interaction research №20](ux/20-multimodal-interactive-learning-2026-10.md), [психологія №27](pedagogy/27-cognitive-memory-attention-psychology-2026-10.md), [quality strategy №28](../docs/28-product-quality-niche-leadership-strategy.md) та [digital YKI fidelity №14](../docs/14-digital-yki-fidelity-spec.md). Жодного дубльованого machine evidence registry, не збільшувати кількість «методів» без справді нових методів та їх синхронної реєстрації.

## 0. Як виконувати 12 напрямів «по черзі» — чесна модель станів

Для кожного з 12: **(a) desk research and evidence triage → (b) Hospodar-specific intervention / no-adoption decision → (c) human/editorial/protocol readiness → (d) runnable implementation + QA → (e) real learner experiment or first-party exam verification → (f) report of outcomes, null effects and limitations.**

**У цьому PR завершено (a) і (b), а для (c) створено план із критерiями**, проте немає набору учасників, етичного/організаційного погодження, проведених RCT, публічних приватних recordings, підтвердженого EXAM 2027 UX або доказу переваги. Статус кожного human pilot — `NOT_RUN`; кожна правка навчальної функції окремо потребує code+CI+S2.

**Послідовність:** R01 → R02 → R03 → R04 → R05 → R06 → R07 → R08 → R09 → R10 → R11 → R12. R01 визначає вимірювання для всіх інших; R02 — окремий EXAM evidence gate. R03–R08 формують навчальний зміст/механіки, R09–R11 забезпечують тривале й доступне використання, R12 перевіряє реальну диференціацію. **P0 не означає**, що потрібно чекати завершення 30-денних випробувань для документального вивчення наступного напряму.

## R01 — Виміряти реальну ефективність LEARN, а не швидкість натискань

**Докази та межі:** [Kim & Webb, 2022, L2 spaced practice, 48 experiments/3,411 participants](https://doi.org/10.1111/lang.12479) — перевага distributed practice; [Gonçalves, Muniz & Jaeger, 2025, 44 studies/142 comparisons](https://doi.org/10.1007/s10648-025-10076-6) — над **змістовним elaborative encoding** середня перевага retrieval мала (`g=0.14`), feedback — важливий модератор. Це не випробування Hospodar, і тривалість 7/14/30 — експериментальні контрольні точки, не універсально оптимальні інтервали.

**Product action (ADOPT / P0):** один повний S2-reviewed learning loop `слухаю/читаю → формулюю власну відповідь → бачу змістовий feedback → виправляю → інша реальна ситуація → delayed held-out`. Приклад: `Haluaisin siirtää lääkäriaikaani` → через 14 днів самостійно попросити іншого адресата перенести іншу домовленість. Чотири модальності міряти окремо. Впровадити відстеження **першої незалежної відповіді до підказки**, а не лише клік `completed`.

**Майбутнє RCT / NOT RUN:** цільова популяція UA-speaking adults A2–B1 (перед стратифікацією валідна baseline-diagnostic, не тільки self-rating); A — Hospodar mission із retrieval + feedback + contextual transfer + spacing; B — **сильне** teacher-reviewed elaboration + feedback + порівнювані задачі/час/media, не слабке rereading. Рандомізація, заморожений held-out пул, окремі нові питання/голоси, за можливості blinded S2-оцінювачі. Primary preregister: day-14 **unseen communicative task success** з окремими meaning/form вимірами, secondary day-30 та інші 4 skills, attrition/burden. Створити power feasibility й мінімально значущу різницю **до** recruitment; не вигадувати n=100 чи +20%. Intention-to-treat, missingness, confidence intervals, прив'язка до actual elapsed days.

**Acceptance / owner:** `research/ux/` owns protocol, `learning/` content and human S2 review, `app/` immutable first-attempt/durable storage, `docs/` release gates. Failure: overfitted familiar item, leaked key, different study dose, teacher-blindness compromised, lost event ID. Доказове твердження про uplift — **заборонено** до виконання.

## R02 — Достовірність цифрового YKI 2027: не припускати невідомі правила

**Official facts checked 28.10.2026:** [OPH pilot announcement 18.09.2026](https://www.oph.fi/en/news/2026/digital-yki-tests-will-be-piloted-november-2026): **7.11.2026** пілот suomi keskitaso в Helsinki, Rovaniemi, Pori, Espoo; Swedish **14.11**. Це ще **майбутні** дати; наразі немає жодного post-pilot висновку. [OPH spring 2027 schedule](https://www.oph.fi/en/education-and-qualifications/selecting-right-yki-test-test-days): **усі фінські весняні YKI цифрові**, 10.04.2027 усі чотири subtests; 12.05 — лише writing+listening, 2.06 — reading+speaking. [Підготовка/офіційні демо](https://www.oph.fi/fi/koulutus-ja-tutkinnot/ennen-yki-testia). Вміст OPH demo **не перевірено тут вручну**; посилання ≠ evidence реальних навігаційних правил.

**Product action (ADOPT / P0):** залишити два **рівноцінні** режими, EXAM state machine з шістьма fidelity-секторами `F1…F6` із [специфікації №21](../docs/21-digital-yki-exam-simulator-executable-spec.md); original S2 items, isolated four subtests, secure autosave/mic failure recovery; unsupported 2027 таймінги, повтори audio, Back/Next, edit/seek та grading = `UNKNOWN` або practice-only — **не вигаданий preset**.

**Research/verification plan:** (1) кодувати кожне твердження `parameter / value|null / official_url / date / applies_to_demo_or_live / reviewer / status`; (2) після дозволеного manual OPH digital-demo walk-through порівняти з доступними first-party офіційними правилами, розбіжності маркувати conflict; (3) після пілоту 7/14.11 перевірити новини й офіційні release notes, **не** вважати чутки тестувальників стандартом; (4) E2E для save, keyboard, mic denied, time, module transitions у кожному verified profile. Не обходити доступ, не копіювати захищені завдання/інтерфейс на поширення.

**Acceptance:** F1–F6 окремі `verified/unknown/conflict/implemented-and-tested`, **100% критичних позначених confirmed параметрів** мають first-party provenance і replayable acceptance; exact digital mock маркетувати лише якщо немає критичних unknown. `docs/14` + `docs/21` owners; **actual demo audit = NOT RUN**, pilot майбутній.

**R02 follow-up conducted 28.10.2026:** [first-party audit, 4 Inspera practice links, source-based full eight-date calendar and fail-closed 2027 unknowns](yki/20-yki-official-complete-audit-2026-10.md#r02-deep-follow-up--28102026-oph-digital-yki-2027-eight-dates-demos-and-fail-closed-quality-gate). OPH page and date-level facts checked; all four Inspera automated text fetches returned 403; **no manual demo UI inspected and no November pilot held yet**. Calendar corrected in two source JSON catalogues with regression contracts. **R02 desk/source-audit advanced, F4/F5/F6 certification still blocked.** R01 human outcome trial remains NOT RUN.

## R03 — Найскладніші місця фінської: дослідження, орієнтоване на L2

**Безпосередні Finnish L2 факти:** [Salmela et al., 2025, morphology processing, Studies in Second Language Acquisition](https://doi.org/10.1017/S0272263125000026) — складність для L2 часто в **зміні основи** (*stem allomorphy*), а не тільки додаванні суфікса: `vesi → vedessä`, `ilta → illalla` (у порівнянні з прозорими `talo → talossa`). Ця праця **не встановлює перелік універсальних помилок саме українців**. [Salmela et al., FMA randomized controlled pilot, published online 2024](https://doi.org/10.1080/09588221.2024.2365664): 3 тижні, training `n=33` vs active Suomipassi control `n=38`; краща **морфологічна продукція**, transfer to novel inflectional forms у певних задачах; lexical recognition gains значною мірою стосувалися trained items. **Не** доказ загальної B1 комунікації чи переваги нашого додатка.

**Product action (ADOPT / P0):** створити й S2-reviewed матрицю `noun stem change × case × communicative situation × level × error family` + незалежний item bank для `-ssa/-sta/-Vn`, partitive/genitive, consonant gradation, pronouns, rektio і functional chunks. Приклад: `vesi / vedessä` у повідомленні про несправність; learning cue після first try, потім unseen `käsi/kädessä` у новому реченні. Не застосовувати naive suffix-string algorithm для всіх слів.

**Study plan:** зібрати **добровільні й анонімізовані** фрагменти письма від реальних учнів + teacher-coded error taxonomy з двома незалежними рецензентами; перевірити українськомовну підгрупу окремо, не «вигадувати типовість» із будь-якої іншої L1. Held-out нові словоформи + meaningful writing/speaking at day-14; confusion matrix transparent vs altered stem. Не брати чужі підручники/приватні тексти без прав.

**Acceptance / owner:** `learning/exercises/grammar/`, `knowledge/`, `research/pedagogy/`; review accuracy, provenance, error/lesson mapping, inter-rater agreement reported; sample collection **NOT RUN**.

**R03 deep follow-up completed at research-design level 28.10.2026:** [№30 — 15 source-verified Finnish morphosyntax and learner-corpus references, M01…M09 diagnosis taxonomy, 12 engineering gates and R03-H01 human study protocol](pedagogy/30-r03-finnish-morphology-ukrainian-learner-evidence-2026-10.md). Distinguish semantic case selection, stem allomorphy, rektio and communicative success; 2026 Finnish L2 neuro findings **Russian L1, not Ukrainian**; no empirically validated Ukrainian-specific error ranking. ICLFI/Topling access restricted, no participants or data accessed. R03 source research documented; **UKR L1 corpus validation/S2 teacher items & clinical claims NOT RUN/NOT READY**. Next deep source track **R04**, not another competing R03 method registry.

## R04 — Чесне оцінювання письма й говоріння, без фіктивних «YKI = 3»

**Наукові результати:** [Wang & Min, 2026, 67 studies/392 effects](https://doi.org/10.1177/02655322251387816), human-machine **speech** scoring correlation `r=.654` overall; pronunciation `r=.606`, grammar+vocabulary `r=.499`; **кореляція не означає agreement/замінність оцінювача**. [Tseng et al., 2026, meta-synthesis 11 reviews >300 AWE studies](https://doi.org/10.1007/s11423-026-10601-6): автоматичний writing feedback ефективніший як обмежена допомога, від поверхневої правки до глибшої, за участі людини. [L2 AI-assisted feedback meta 2026](https://doi.org/10.1016/j.system.2026.104018): `d=.271` загалом, емоційний ефект більший за cognitive. **Ані кореляція, ані середня відсутність score-difference не є сертифікацією YKI.**

**Product action (ADOPT / P0):** 2 незалежні рецензовані аналітичні рубрики: **виконання комунікативного завдання + зрозумілість/зв'язність** та **мовні ресурси (лексика/форми/граматика/вимова)**, з реальними exemplars і allowed variants; feedback у LEARN перед інтерпретацією grade. Говоріння: intelligibility > імітація акценту носія (див. [Council of Europe phonology descriptors](https://www.coe.int/en/web/common-european-framework-reference-languages/phonological-competence)). `ungraded` без calibrated human panel; ASR transcript ≠ phonemic length/intonation grade.

**Study plan:** мінімум 2 незалежні human raters на калібрувальній підвибірці; blind double-scoring, agreement `weighted kappa/ICC` за типом рубрики, discrepancy adjudication, analysis for L1/level/accent differences; unseen tasks repeated independently; separate formative explanation from grade. Середній r з paper **не** підставляти замість наших ICC.

**Acceptance / owners:** `learning/` rubrics та S2 reviewers, `research/yki/` validity, `app/` display `ungraded`; documented rater process and no misleading official equivalence; **rater calibration NOT RUN**.

**R04 deep source follow-up (28.10.2026):** [№31 — OPH human-rated speaking/writing at levels 3/4, Finnish L2 rater uncertainty/ASR prototype, international automated scoring/feedback evidence](pedagogy/31-r04-speaking-writing-human-calibrated-assessment-2026-10.md). Human-calibrated formative rubric, task-completion-first corrections, consented audio, no official YKI score, 14 **proposed** release gates. SOURCE_REVIEW_ONLY; **NO human rater calibration or participant trial**; existing internal rubric weights ≠ OPH criteria. Next source track R05.

## R05 — Автентичне аудіювання й фонетична тривалість

**Evidence:** [Uchihara, Karas & Thomson, 2025, 79-study HVPT meta](https://doi.org/10.1017/S0272263125100879), treatment-control `g=.67` **speech perception**; measured production generalization should be separate. [Kurokawa, Hein & Uchihara, 2025, 49 L2 experiments](https://doi.org/10.1111/lang.12697), captions compared to no captions helped incidental vocabulary, `g=.56`, **не** доводить captions always-on на самостійному listening test. [Kielipankki ArkiSyn](https://www.kielipankki.fi/corpora/arkisyn/) містить морфосинтаксично анотовані розмови; **public availability не гарантує права вбудувати медіа офлайн**. [University of Turku ArkiSyn profile](https://www.utu.fi/en/university/faculty-of-humanities/school-of-languages-and-translation-studies/research/utu-digilang/arkisyn-database-of-finnish-conversational-discourse) містить CC BY-ND / privacy conditions, тому використовувати лише дозволений research reference до окремої rights review.

**Product action (ADOPT / P0):** короткі original licensed two-speaker `puhekieli ↔ kirjakieli` діалоги з різними голосами, gist/detail, delayed unseen new-speaker testing, optional subtitles for LEARN, no transcript answer leakage during independent listening. Minimal-pair perception `tuli / tuuli / tulli` не вважати production mastery.

**Study plan:** same talker vs multi-talker, content/time matched; independent listening gist/detail on **unseen voice and sentences** after 14 days, separate human-reviewed oral output. Аудіо S2+voice rights, captions/a11y/mic-denied handling. `assets/`, `learning/`, `research/pedagogy/` own; **human recordings + participant trials NOT RUN**.

**R05 deep follow-up (28.10.2026):** [№32 — multi-talker Finnish HVPT, distinct perception/production, subtitle/caption controls, natural voices, 16 proposed gates](pedagogy/32-r05-multitalker-phonetic-transfer-2026-10.md) + [design #19 — audio-first calm UI, semantic effects, visual load, music counterevidence](design/19-r05-sound-visual-design-transfer-2026-10.md) + [licensed/blocked material intake](../sources/audio/R05-MULTITALKER-MATERIAL-INTAKE-2026-10.md). 85 existing binaries unchanged; 0 newly imported. Full-offline install-time Android target allows up to ~3–4GB Play compressed but no AAB QA or S2 voice pack built. Human experiments **NOT_RUN**. Next source track R06.

## R06 — Адаптація: «найкраще наступне завдання», а не магічний AI

**Evidence:** [Kim & Webb spaced L2 meta](https://doi.org/10.1111/lang.12479) підтримує spacing, **не** один найкращий scheduler. [Finnish morphology FMA 2024 controlled pilot](https://doi.org/10.1080/09588221.2024.2365664) показує можливість адаптивної мобільної практики фінської морфології, але змішує schedule/content/type of task, **не ізолює** ефект персоналізації. [Learning dashboards meta 07.10.2026](https://doi.org/10.1016/j.iheduc.2026.101119), 21 controlled / student-facing `g=.287`, prediction interval encompasses zero — **dashboards не дорівнюють adaptive interventions**.

**Product action (EXPERIMENT / P0 after R01):** deterministic on-device next-task scoring на основі `confirmed_error/type × overdue review × skill balance × known item difficulty × chosen interest/time`; transparent `why this task`, optional choice override; ніякої обов'язкової cloud LLM, жодної прихованої «B1 92%». Лише дійсно невідомі/помилкові chunks у персональному словнику.

**Study plan:** same content bank/time/exposure: personalized **error-targeted scheduler** vs fixed spaced **strong schedule**, 14/30-day unseen task success + missed-review burden/attrition, four skills. Не оптимізувати по click streak. Owner `learning/`, `app/` domain; acceptance includes deterministic tests and rollback. **Not implemented/tested as a completed adaptive experiment**.

**R06 deep follow-up (28.10.2026):** [№33 — 15 carefully bounded sources, cold-start and 4-skill ranker design, 18 proposed gates and 5 controlled studies](pedagogy/33-r06-transparent-adaptive-finnish-learning-2026-10.md). [Pure JS independent reference prototype](../app/adaptation-core.mjs) + [negative-case unit tests](../app/tests/adaptation-core.test.mjs) added without wiring into current LEARN missionSelection; existing SRS and content bank unchanged. Human study R06-H01…H05 **NOT RUN**; no claim personalized scheduling is better than a strong fixed spaced curriculum. NEXT R07.

## R07 — Які UI взаємодії справді поліпшують пам'ять і мовлення?

**Evidence:** [2025 L2 TELL cognitive-load meta, 35 studies](https://doi.org/10.1016/j.system.2026.104068) reports achievement `g=.69`, cognitive load `g=-.20`, але bundles technology/content, не доводить конкретний screen design. [Student-facing dashboards 2026](https://doi.org/10.1016/j.iheduc.2026.101119) малий неоднорідний ефект. [Mobile language games meta 2025, 38 studies/4102 participants](https://doi.org/10.1080/09588221.2025.2528786): `g=.962`, але великі відмінності між settings, для writing/speaking/grammar і Finnish недостатньо доказів.

**Product action (ADOPT limited / P0):** clear one-task screen, user-start/paused short audio, **independent production prompt**, process feedback, repair, fresh real-world scenario; semantic visuals і controls only, optional sound/motion, actionable next-skill. LEARN uses scaffold stages; EXAM entirely sealed. Видимий user choice and recoverability.

**Study plan:** existing [UX #20 controlled comparisons](ux/20-multimodal-interactive-learning-2026-10.md#9-прикладний-аудит-uiux--реальний-результат-навчання-26102026): pause at question vs equal-time postmedia active response; staged feedback vs equally good all-at-once feedback; semantic interaction vs static semantic control. **Primary** day-14 meaning/form on unseen new voice/context; a11y/cognitive-load guardrails. Avoid simultaneously changing content+graphics+voice (confounding). UX study **NOT RUN**.

**R07 deep follow-up (28.10.2026):** [UX №21 — 16 original/review/normative sources, contradictory game/video/music/attention findings, seven controlled day-14/day-30 comparisons, 18 release gates](ux/21-r07-meaningful-interactive-finnish-ux-2026-10.md). New [pure JS response-first interaction state machine](../app/r07-interaction-core.mjs) + [15 independent Node tests](../app/tests/r07-interaction-core.test.mjs) are a **REFERENCE PROTOTYPE ONLY**: not imported into app.mjs, not a runnable UI, not a microphone or tested Finnish gain. Keeps LEARN vs EXAM sealed, 70 canonical methods and 3–4GB optional offline media cap. **Next R08.**

## R08 — Граматичне навчання: meaning first + accurate stem changes + transfer

**Canonical R08 deep execution completed 28.10.2026 as research+editorial drafts, NOT human/production success:** [№34 — distinct case meaning vs stem production, 11 critically bounded research/reference/standard entries, 4 future controlled comparisons, 18 gates](pedagogy/34-r08-finnish-case-stems-meaning-transfer-2026-10.md), [14 original S2-pending form-meaning scenarios](../learning/exercises/b1/grammar/r08-meaning-stems-original-drafts.json) and [S2-gated isolated reference state machine](../app/r08-grammar-core.mjs) + [16 tests](../app/tests/r08-grammar-core.test.mjs). S2 review 0/14, human trials NOT RUN, no app screen integration, no claimed Finnish B1 uplift. Distinct from parallel R08-MOT; canonical R09 remains next.

**Parallel motivation track R08-MOT, without rewriting canonical R08 (28.10.2026):** After R07, motivation/gamification was announced as the next study despite this section reserving R08 for morphology. The separately scoped [R08-MOT 16-source evidence review, 7 controlled comparisons and 18 proposed gates](gameplay/02-r08-motivation-autonomy-habits-2026-10.md) plus [isolated no-coercion JS reference](../app/r08-motivation-core.mjs) and [16 Node tests](../app/tests/r08-motivation-core.test.mjs) address autonomy, honest progress, nonpunitive return, opt-in if–then plans and controversial streak/contest results. **R08-MOT human trials NOT RUN; canonical R08 grammar work remains open.** R08-MOT does NOT claim 12-workstream extra study completed or erase the finite 12/12 desk reviews.

**Evidence:** [Finnish RCT FMA 2024](https://doi.org/10.1080/09588221.2024.2365664) improved written morphological production with 3-week targeted training vs general Finnish app, but no general B1 pass inference. [Finnish 2025 morph processing](https://doi.org/10.1017/S0272263125000026) demonstrates greater L2 difficulty for altered stem allomorphs. [CEFR descriptors](https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors) give functional outcomes, not a causal teaching method. [Global method review #26](pedagogy/26-global-effective-language-learning-2026-10.md) documents feedback, task repetition and limits.

**Product action (ADOPT / P0):** `start with intended meaning → independent inflection → S2-reviewed form explanation → self-repair → new context and new inflection → delayed transfer`. Example `vesi → vedessä`; `käsi → kädessä` unseen. Distinguish transparent and nontransparent, case choice vs stem alternation vs rektio error; avoid simple last-character regex or auto-correct as the only training.

**Study plan:** R08-A visual morphology cue in feedback vs equivalent textual explanation, matching teacher/text/time; R08-B guided production transfer vs repeated familiar forms; primary unseen writing plus comprehension day-14. Content rights/editorial check 100% published. `learning/exercises/grammar/` owns; **comparisons NOT RUN**.

## R09 — Мотивація без примусу та стресових streak

**Evidence:** [Alamer et al., 2025, SDT/L2 meta](https://doi.org/10.1007/s10648-025-10038-y) correlations of intrinsic motivation with L2 achievement `r=.26` and identified regulation `r=.16`; **correlation ≠ causal trial** and not proof badges cause L2 success. [Mobile games 2025 meta](https://doi.org/10.1080/09588221.2025.2528786) positive average but heterogeneous and weak on independently-produced B1.

**Product action (ADAPT / P1):** authentic 10/20-minute missions, user choice of topic and skill, voluntary restart, skill accomplishment feedback, no monetized luck/reward loops, shame/streak loss, or nighttime pressure. Adult Ukrainian learner contexts (work, housing, health appointments, child care); user-tested topic relevance rather than stereotypes.

**Study plan:** meaningful scenario quests vs same language action/content/time in calm plain UI; day-14 new functional production **primary**, voluntary completion and autonomy scores **secondary**; measure negative anxiety or abandoned attempts. `research/gameplay/` and `research/user-cases/`; **NOT RUN**.

## R10 — Доступність: usable by all ≠ optional polish

**Standard and limit:** [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) AA semantics/focus/contrast/target sizes, captions and controllable motion/audio. Це стандарт доступності, **не causal дослідження пам'яті**. Суміжна accessibility research у [UX](ux/README.md) не замінює тестування на реальних пристроях і в людей.

**Product action (ADOPT / P0):** keyboard+screen reader, 200% zoom, 320/360/390 px, 4.5:1 body contrast/3:1 important UI, target controls and focus, captions/transcripts with equivalent accessible task, calm/reduced motion, no reliance on hue/sound only. Mic denied/audio absent → user sees honest `not recorded/ungraded`, no false fail in speaking, export and delete. EXAM accessibility exceptions must align with OPH, not invented disqualifications.

**Study plan:** consenting diverse users (visual/hearing/motor/cognitive and mobile constraints) complete **actual** tasks without coaching; log severity and task success, audio caption sync, speech input failure, paper fallback or accommodation needs; never force disclosure of diagnosis or record health attributes unnecessarily. Owner `app/` QA + `docs/`; **real user accessibility sessions NOT RUN**.

## R11 — Offline/reliability performance: pedagogical dose only counts when saved

**Product evidence:** [MVP README](../app/README.md) reports exam IndexedDB while **LEARN remains localStorage**; [ADR-025](../docs/25-implementation-vertical-slice-roadmap.md) documents G1 blockers including idempotent event recovery. [WCAG 2.2](https://www.w3.org/TR/WCAG22/) supports accessible robustness but is not evidence of memory uplift. App data consistency and offline retrieval are **engineering validation**, not RCT research.

**Product action (ADOPT / P0):** durable atomic first attempt+feedback exposure+review schedule and version hash across refresh, quota, app update, offline sessions and corrupted/missing media. Web IndexedDB migration without losing existing LEARN data, rollback/restore, user-visible export and deletion; Android `Room` and packaged licensed audio only after real Gradle/device validation. No false Android release claim.

**QA protocol:** 20+ scenario classes across airplane mode, storage full, two tabs, rapid tap, failed commit then recovery, clock/timezone change, interrupted mic, device sleep, restore from backup, old schema versions, inaccessible content license; each must preserve original first attempt or explicitly report `not saved`. Test desktop/mobile physical device and emulator; baseline performance repeatability, no fabricated load numbers. **Outcome:** completion and data integrity, not B1 grade. Owner `app/`, `packages/contracts/`, `native/android/`; full matrix **NOT RUN**.

## R12 — Fair competitor benchmarking: no claim «№1» without matched outcomes

**Evidence base:** [WordDive official](https://www.worddive.com/fi/opi-suomea/), [Finnish it! independent Kielibuusti page](https://www.kielibuusti.fi/en/learn-finnish/learning-materials-and-courses/find-online-learning-materials/finnish-it), [YKI Trainer](https://ykitrainer.fi/en), [OPH demos](https://www.oph.fi/fi/koulutus-ja-tutkinnot/ennen-yki-testia). Publicly claimed features are **not effectiveness evidence**. [Learning dashboards 2026 meta](https://doi.org/10.1016/j.iheduc.2026.101119) warns that simple score charts and engagement gains are not necessarily learning.

**Product action (EXPERIMENT / P1 after R01):** public, dated **feature and usability benchmark** by same real Finnish task difficulty, device, accessibility, audio authenticity, privacy/offline and pricing; record observed version/date and source, label unsupported comparisons `unknown`. **Outcome trial** needs time/content-comparable LEARN practice with consented adults, matched baseline and S2-blind delayed transfer at day-14/30. Different proprietary curricula make strict causal attribution hard; report limitations. For EXAM, score verifiable OPH fidelity **not copied visuals or unofficial timing**.

**Ethics & acceptance:** do not scrape protected teaching media/paywalled contents, disclose financing/conflicts, do not use misleading rankings or cherry-picked tasks; source-backed matrix updated on date of study. Owner `research/` + `docs/28`; **head-to-head cohort NOT RUN**.

## 13. Operational protocol (ready for pre-registration review, not consent/ethics approval)

### R01 primary pilot research dossier

- **Research question:** Does a teacher-reviewed Hospodar contextual retrieval+feedback+spaced-repair flow beat an equally strong active elaboration+feedback sequence for adult Finnish A2/B1 learners on a **new** communicative task after 14 days?
- **Participants:** adult volunteers learning Finnish; Finnish diagnostic beforehand, Ukrainian-speaking group is the recruitment focus. A priori sample size via power/feasibility; no arbitrary number presented as sufficient.
- **Consent:** two separate controls for participating in **research** and for **any optional voice recording**; granular data deletion and right to withdraw; no sensitive identities, raw private records, or recordings stored in public Git; GDPR/retention owner review before recruitment.
- **Design:** randomized, baseline-stratified, two-arm allocation; both groups get S2-checked matched learning duration, comparable content/media difficulty, feedback and exposure. Same target learning objectives; independently written held-out A/B parallel tasks that none sees during practice.
- **Primary unit:** one independent novel functional writing outcome `task_success` measured by blind human S2 rubric at **day 14**; meaning+form scored separately. Pre-register whether ordinal, binary or continuous aggregate and how user-level clustering/CI handled; multi-item task scoring. Speaking, listening, reading and day-30 are separate **secondary** exploratory outcomes until sufficient sample; avoid 4-skill uncorrected multiplicity.
- **Scheduling:** actual elapsed time in timestamp/days, predeclared allowable checkpoint window, late/missing shown honestly, baseline and assignment retained through interruptions; missed = missing, not automatic fail/success. Record prior exposure, no answer leaks.
- **Analysis:** ITT primary, prespecified sensitivity per-protocol, adjusted for baseline, 95% CI/effect size, attrition and adverse user-reported burden; report null/negative and exploratory as such; do not use a weak rereading-only control to claim supremacy.
- **Decision threshold:** set before collecting data based on **meaningful language behavior**, reliability and harm; if neutral/noisy, simplify and replicate, not declare victory.
- **Implementation requirements:** published lesson/items S2-reviewed with provenance/rights, durable `attempt_id` event, `item_version` and `feedback_seen_at`, `test_window_due_at` and `actual_elapsed`, blinded rating form; **do not** collect research identifiers through unrestricted analytics.

### Cross-workstream completion gates

| Gate | Definition of done | Current status 28.10.2026 |
| --- | --- | --- |
| **D — Literature audit** | 12 specific evidence summaries, contradictions and first-party sources | **COMPLETED desk audit in this document** |
| **P — Test protocol** | Population, target, control, outcomes, validity, owner, failures for all; detailed R01 pilot | **DOCUMENTED / NOT APPROVED for real recruitment** |
| **C — Content** | Actual Finnish original human S2-reviewed items, audio licenses, distinct held-out sets | **NOT VERIFIED across all 12** |
| **I — Implementation** | Data and UI contracts, robust code, automated+manual tests, privacy | **NOT COMPLETED by this document** |
| **H — Human outcomes** | Consent, actual participants, prereg, observed/negative outcome report | **0/12 RUN** |
| **Y — First-party YKI** | Each F1–F6 critical rule official source + manual demo when permitted + E2E | **NOT COMPLETE; 7.11 pilot future** |

**Avoid the false binary «дослідження виконане, значить функція готова»:** completion of 12 desk reviews enables **next engineering or ethically recruited studies**, but does not substitute those steps. No background process/promise is attached to this file.

## 14. Immediate task queue after literature: smallest value-first implementation

1. **First R01 pilot readiness:** review questionnaire/consent language with privacy owner and two human S2 graders; produce S2-licensed A/B comparable materials, sealed held-out writing prompts and prospective sample-size analysis; fix first attempt durability blocker. `P0`.
2. **R02 exam source evidence:** inspect OPH digital demos manually **where accessible and permitted**; maintain F1–F6 `unknown/conflict` ledger; schedule factual follow-up **after 7.11** via normal product release review, not fake current findings. `P0`.
3. **R03/R08 Finnish:** create 1 validated transparent vs changed-stem microcycle with a **new-context** task; content S2 and audit permissions. `P0`.
4. **R04/R05 scoring/media:** rater guidelines and rights-cleared original two-voice Finnish samples; fail `ungraded` not pseudo machine YKI grade. `P0`.
5. **R06/R07/R09 UI:** only after usable first cycle, A/B against equally meaningful plain UI; avoid heavy dashboards and game worlds before delayed effect. `P1`.
6. **R10/R11 reliability/a11y:** essential engineering QA gates in parallel with first real lesson, not optional user-experiment placebo. `P0`.
7. **R12 competition:** source-linked neutral functional benchmark; no «best in world» marketing until rigorous matched outcomes. `P1`.

**Research → Hospodar rule:** For every future source, record `finding → applicability → learner problem → concrete Finnish example → LEARN/EXAM safety → matched outcome → ADOPT/ADAPT/EXPERIMENT/REJECT and owner`. A scientifically defensible `DO NOT SHIP` is a positive product decision.
