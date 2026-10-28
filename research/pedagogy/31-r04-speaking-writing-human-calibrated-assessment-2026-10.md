# 31 — R04: достовірне оцінювання говоріння та письма фінською (YKI 3/4, human + automated feedback)

**Дата перевірки першоджерел:** 28.10.2026. **Owner:** research/pedagogy + S2 assessment expert; official YKI provenance: research/yki. **Stage:** SOURCE_REVIEW_COMPLETED / INTERVENTION_SPEC_DRAFT / HUMAN_CALIBRATION_NOT_RUN / REAL_USER_STUDY_NOT_RUN / APP_FEATURE_NOT_IMPLEMENTED. **Population:** дорослі україномовні учні фінської A1.3–B2.1; іспит suomi keskitaso (3/B1, 4/B2). **Статус огляду:** вибірковий критичний evidence synthesis, **не PRISMA systematic review**.

**Не дублювати:** R01 [протокол оцінювання впливу](../ux/learning-impact-evaluation-protocol.md), R02 [digital fidelity](../yki/20-yki-official-complete-audit-2026-10.md), R03 [морфологія, M01–M09](30-r03-finnish-morphology-ukrainian-learner-evidence-2026-10.md), [канонічні 70 методів](learning-methods-v1.json), [наявні внутрішні вагові рубрики](../../learning/exercises/b1/feedback-rubrics.json) та [розмежування LEARN/EXAM](../../docs/15-two-modes-skill-scopes.md). Цей документ додає **валідність, калібрування, human assessment, feedback safety та acceptance gates**, не створює другий методичний реєстр.

## 1. Питання, результат і межа впевненості

**PICO:** Для дорослих фінськомовних L2-учнів (особлива ціль — L1 українська) чи feedback за human-anchored, task-specific рубрикою плюс власне виправлення, порівняно з **часово й змістово еквівалентним S2-редагованим feedback та готовими прикладами**, покращить **самостійну зрозумілість, виконання завдання й мовні засоби у нових письмових/усних ситуаціях на 14/30 день**? **Окрема мета:** чи можна довіряти machine-assistance як *навчальній допомозі* без необґрунтованого прирівнювання до YKI 3/4?

**Основне рішення — ADOPT/P0 для дизайну:** дві **незалежні формувальні** рубрики, спершу значення/успіх комунікації, потім зв'язність, регістр і форма; до підказки фіксується перша незалежна спроба; 1–3 цільові зауваження й self-repair; новий контекст; відкладене оцінювання **незнайомих** завдань. **EXAM:** жодного поточного feedback/підказок, а офіційна оцінка/еквівалентність YKI **не передбачається**. Поки немає незалежної людської калібровки, показувати **ungraded / not an official YKI score**.

### 1.1 Прямі офіційні критерії OPH (джерело істини, не наше тлумачення 100-бальних ваг)

- [OPH — після тесту, assessment process + links to both criteria](https://www.oph.fi/fi/koulutus-ja-tutkinnot/yki-testin-jalkeen): офіційне оцінювання роблять **підготовлені фахівці**; Jyväskylän yliopisto Solki навчає оцінювачів і контролює узгодженість. Після оцінювання сертифікат випускається автоматизовано: це **не є доказом автоматичного machine-grading мовлення/письма**.
- [OPH — Puhumisen arviointikriteerit, PDF](https://www.oph.fi/sites/default/files/documents/Puhumisen_arviointikriteerit.pdf), стор. 2: рівень **3** — зрозуміле виконання звичайних ситуацій, допускаються паузи, L1 accent і недосконалі форми, якщо зміст передано; **4** — відносна плавність, ширша/детальніша аргументація, краща зв'язність, відповідність адресату й більш усталена вимова. Колонки: суто офіційні **sujuvuus, joustavuus, koherenssi/sidosteisuus, ilmaisun tarkkuus/laajuus/idiomaattisuus, ääntäminen/fonologinen hallinta, rakenteiden tarkkuus**. Оцінка формується *загалом*, не з арифметичної суми критеріїв.
- [OPH — Kirjoittamisen arviointikriteerit, PDF](https://www.oph.fi/sites/default/files/documents/Kirjoittamisen_arviointikriteerit.pdf), стор. 2: рівень **3** — простий, переважно послідовний зрозумілий текст про звичайні ситуації з можливими недоліками стилю/морфології; **4** — більш зв'язні приватні та напівофіційні тексти, розгорнута думка, адаптація до адресата, точніші й гнучкіші форми. Офіційні напрями: **joustavuus, koherenssi/sidosteisuus, ilmaisun tarkkuus/laajuus/idiomaattisuus, rakenteiden tarkkuus**, різні функції жанру. Оцінюється сукупність, не окреме число помилок.
- [OPH — результат за кожним окремим модулем](https://www.oph.fi/fi/koulutus-ja-tutkinnot/tietoa-yki-todistuksen-tarkastamisesta): для keskitason можливі **alle 3 / 3 / 4**, також «ei voida arvioida» за недостатньої відповіді. Не є коректним показувати один загальний бал 87/100 як «YKI 3».

**Критична межа:** OPH таблиці описують **construct/proficiency**, а не перевірені нами майбутні механіки цифрового UI 2027 (таймер/навігація/аудіо/дозволений replay). R02 залишає їх UNKNOWN до окремого підтвердження.

### 1.2 Важливе уточнення вже наявного Hospodar файлу

[feedback-rubrics.json](../../learning/exercises/b1/feedback-rubrics.json) уже містить internal teaching weights: speaking 30/20/20/15/15; writing 30/25/15/15/15. **Це наші евристики, не OPH weights, не калібрована шкала YKI і не валідований прогноз**. У speaking немає окремого phonological construct (потрібен для всебічної human rubric); наявне попередження правильно забороняє оцінювати fluency без сирого аудіо. **Рішення:** зберегти поточний контракт до окремого feature-PR; запланувати незалежний критерій зрозумілості вимови без accent penalty; будь-яка майбутня зміна ваг проходить S2 review і rater evidence, без «оптимізації» на тестові ключі.

## 2. Критичний evidence ledger: факт → межа → практичне рішення

| ID | Джерело, дизайн, популяція/метрика | Що підтверджено й що **НЕ** випливає | Hospodar дія |
|---|---|---|---|
| R04-E01 | [OPH speaking rubric, page 2](https://www.oph.fi/sites/default/files/documents/Puhumisen_arviointikriteerit.pdf), офіційний норматив | Рівні 3/4, intelligibility, communicative sufficiency та окремі виміри fluency/phonology; це не software grade formula. **DIRECT_YKI_NORM** | P0 ADOPT: людська аналітична рубрика speaking без native accent вимоги |
| R04-E02 | [OPH writing rubric, page 2](https://www.oph.fi/sites/default/files/documents/Kirjoittamisen_arviointikriteerit.pdf), норматив | Рівні 3/4; жанр, coherence, accuracy; результат цілісний, не error counter. **DIRECT_YKI_NORM** | P0 ADOPT: rubric жанру й адресата, task completion перед case endings |
| R04-E03 | [OPH assessment/appeals](https://www.oph.fi/fi/koulutus-ja-tutkinnot/yki-testin-jalkeen), процес | Треновані людські оцінювачі й Солкі; автоматично **видають сертифікат після оцінки**, не встановлено автоматичного graded speech. **DIRECT_YKI_NORM** | P0 ADOPT: **NO_OFFICIAL_SCORE** і human calibration |
| R04-E04 | [Honko & Neittaanmäki, 2023](https://doi.org/10.23997/pk.144389), Finnish speaking, 12 059 task ratings + notes/questionnaire | Навіть навчені оцінювачі інколи невпевнені. У дослідженні self-reported uncertainty не прогнозувала severity/consistency. Не дозволяє зробити висновок «human labels perfectly agree» або перенести частоти в наш корпус. **DIRECT_FINNISH_ASSESSMENT** | P0 ADOPT: adjudication при розбіжностях, окрема фіксація rater uncertainty/quality; без fabricated agreement |
| R04-E05 | [Hilden et al., 2025, DOI 10.58379/ROXO3257](https://doi.org/10.58379/ROXO3257), peer-reviewed Finnish+Swedish low-resource L2 speaking prototype, ASR wav2vec2 | Обнадійливі прототипні fluency/vocabulary features, але неоднозначні результати для інших pronunciation features; не доведено сертифікації YKI чи готового general-purpose grader. **DIRECT_FINNISH_TECH** | P1 EXPERIMENT: тільки обмежений signal-dependent fluency support після Finnish L2 calibration; ASR ≠ truth |
| R04-E06 | [Wang & Min, 2026](https://doi.org/10.1177/02655322251387816), meta 67 studies / 392 effect sizes | Human-machine speech correlation **r=.654 overall**, delivery .784, pronunciation .606, grammar+vocabulary .499. **Correlation ≠ absolute agreement, threshold accuracy, fairness або YKI validity.** Cross-language, diverse tasks. **L2_GENERAL** | P0 REJECT автономне присвоєння YKI 3/4; P1 calibration-first assisted hints |
| R04-E07 | [Tseng, Chen & Dong, 2026](https://doi.org/10.1007/s11423-026-10601-6), meta-synthesis **11 reviews covering 323 primary studies** | Позитивний напрям AWE, але *огляди перекриваються*, secondary synthesis, різні цілі; не 323 незалежні RCT із Finnish learners. **L2_GENERAL** | P0 ADAPT: автоматичні підказки можливі лише як *допоміжні*, з перевіркою викладача |
| R04-E08 | [AI-assisted L2 writing feedback meta, 2026](https://doi.org/10.1016/j.system.2026.104018), >11 000 learners | Overall **d=.271**; emotional engagement **d=.628**; pilot effects більші, ніж більш суворі дизайни. d ≠ відсоток правильних YKI відповідей. **L2_GENERAL** | P1 EXPERIMENT на відкладеному незалежному письмі; не підміняти literacy score engagement |
| R04-E09 | [Brown, Liu & Norouzian, online 2023 / issue 2026](https://doi.org/10.1177/13621688221147374), Bayesian WCF meta, 52 controlled L2 studies | Durable moderate L2 written corrective feedback; direct/indirect/metalinguistic variants подібні на агрегованому рівні. Немає підстав оголосити єдиний «найкращий» feedback type для Finnish. **L2_GENERAL** | P0 ADAPT: вибірково використовувати cue → learner repair, тестувати альтернативи |
| R04-E10 | [Scherer, Busse & Graham et al., 2024](https://doi.org/10.1016/j.learninstruc.2024.101961), meta 200 comparisons L1/L2/FL | Surface feedback часто допомагає surface outcomes (**g=.58** all groups), але **не показує надійного deep-level transfer**; surface-only для FL deep outcome інколи негативний. Не плутати g та % і не вважати ці оцінки specifically Finnish. **L2_GENERAL** | P0 ADOPT: розділяти meaning/organization vs language accuracy; вимірювати обидва |
| R04-E11 | [2026 systematic review generative AWE](https://doi.org/10.1016/j.asw.2026.101041), broad AWE contexts | AI helpful for grammar/coherence, reliability/higher-order fairness and ethics unsettled; переважно higher ed / інші L2. **INDIRECT** | P1 RECHECK перед майбутнім AI-assisted authoring; **НЕ** робити runtime LLM обов'язковим |

**Access/selection notes:** OPH criterion PDFs перевірені на рівні **стор. 2** із візуальною перевіркою таблиці. Метадані й abstracts DOI-публікацій перевірені у відкритих видавничих/університетських записах; **повний систематичний аудит raw effect datasets, RoB і реплікацій не проводився**. Проходи за ключами «YKI arviointikriteerit», «Finnish L2 speaking ASR», «automatic speech scoring meta», «AWE meta», «written corrective feedback»; відхилено джерела без валідної відповідності рівню/навичці або з перебільшеною переносимістю з English-only. **Null/counterevidence збережене**, жодна робота не тестувала Hospodar.

## 3. Дві різні teacher-reviewed формувальні рубрики: відповідність OPH без фальшивої формули

| Вимір (наш, НЕ офіційні ваги) | Speaking B1 (3) — орієнтир | Speaking B2 (4) — орієнтир | Writing B1 (3) → B2 (4) |
|---|---|---|---|
| **Task success / communicative purpose** | Мета досягнута у звичайній ситуації, без критичної втрати смислу | Незнайома ситуація, пояснення/аргументація | Основні пункти й адресат → ширша аргументація та точніший жанр |
| **Comprehensibility / coherence** | Зрозуміле цілісне повідомлення, окремі повтори/паузи допустимі | Більш пов'язані частини, логіка, приклади | Зв'язні прості речення → розгорнутий зв'язний текст |
| **Resources & accuracy** | Лексика й форми достатні; локальні помилки можливі | Різноманітніші форми, менше непорозумінь | Повсякденні форми → точніша лексика/структури |
| **Pragmatics/register** | Ввічлива функціональна реакція, навіть зі стилістичними огріхами | Регістр більш системно пристосований до слухача | Побутове повідомлення → різні приватні/напівофіційні жанри |
| **Oral-specific audio evidence** | Вимова **зрозуміла**, не обов'язково native; паузи можливі | Більш виразна й відносно плавна, без непрозорих фрагментів | **NOT_APPLICABLE** для письма |

**Застереження:** таблиця — операціоналізація для дизайну тренувальних tasks, не цитата чи перенесення формули OPH. Офіційний YKI рівень визначається з **цілісної** сукупності відповідей підготовленими оцінювачами. Не підставляти «≥75% → YKI 3» чи «B1 proficiency confidence 92%».

### 3.1 Розділяти чотири сутності у domain model

1. **attempt evidence:** task_id, task version, level, skill, prompt hash, first_independent_attempt immutable, answer medium (text/audio), captured_at, no_leak; аудіо лише за consent та privacy policy.
2. **rubric observation:** criterion_id, human/automated source, assessor id pseudonym, evidence snippet/timecode, observable claim, uncertainty flag, supported/not-supported; підтримка valid variants і puhekieli відповідно до контексту.
3. **formative coaching:** 1–3 ranked actionable errors з impact, hint strength, learner self-repair, alternate accepted answer та delayed_new_task; без раннього reveal ключа.
4. **certification:** **заборонена у Hospodar** без окремої юридичної/інституційної авторизації; ніякі internal weights не переводяться автоматично в official YKI.

**Missing signal policy:** немає raw audio / доступу до нього → **не оцінювати** вимову, fluency, phonemic length, prosody або загальний speaking score. Слабкий/шумний ASR → request rerecord з user control або **ungraded**; без прихованого «покарання» за мікрофон, акцент чи тишу.

## 4. Конкретні Finnish-learning loops з користю для користувача

### R04-L1 — LEARN WRITING: скарга / перенесення часу (P0 ADOPT)

**Завдання:** «Вам потрібно перенести запис до лікаря, запропонувати новий час і попросити підтвердження».

- Learner first independent output: «Hei, minä halua siirtää lääkäriaika. Sopiko torstaina?»
- **Meaning-first feedback:** адресат розуміє перенесення, але відсутнє чітке прохання підтвердити. Одна цільова формна підказка: *haluta* → «haluaisin» у ввічливому запиті; *lääkäriaikani* залежить від intended meaning. Не бездумно переписувати всю відповідь.
- **Self-repair:** «Hei, haluaisin siirtää lääkäriaikani. Sopisiko torstai klo 14? Voisitteko vahvistaa uuden ajan?»
- **New context (without model):** незалежно написати повідомлення для huoltoyhtiö про перенесення візиту. Через 14/30 днів — інший адресат/тема; blind human criteria task completion, comprehensibility, form. **Моделі речень створені як R04 design examples, не копія OPH test tasks**.

### R04-L2 — LEARN SPEAKING: телефонна зміна домовленості (P0 ADOPT)

**Prompt:** «Зателефонуйте до huoltoyhtiö: проблема з пральною машиною; уточніть, коли можливий ремонт».

- Independent recorded spoken reply; **оцінка лише з дозволеного аудіо**, не тільки ASR text.
- Корисний мінімум: «Hei, pesukoneeni ei toimi. Voisitteko lähettää huoltajan? Minulle sopii torstai iltapäivällä.»
- Рубрика спочатку перевіряє зрозумілість проблеми, прохання й доступний час; потім structured form і intelligibility. Дати time-coded feedback **тільки за достовірним слуховим спостереженням**.
- Якщо ASR помилково розпізнав «tuli / tuuli / tulli» або довжину приголосного — **не перетворювати WER на штраф за вимову**. Дати optional replay й альтернативний listening discrimination task; жодного official YKI grade.
- 14/30 день: незнайомий сценарій («toimituksen ongelma»), незалежний human listener оцінює зрозумілість. **Recording permissions, no upload by default**.

### R04-L3 — EXAM production tasks (P0 ADOPT, **assessment not deployed**)

- Original, rights-cleared, S2-reviewed tasks; 2027 UI/timing/mic/back/navigation **лише коли підтверджені R02**.
- Під час спроби: zero correctness hints, no grammar underline, zero feedback, no hidden adaptive prompt.
- Після завершення: окремий **LEARN review**, якщо є права/consent; чітко «навчальний розбір; не офіційний висновок».
- До human-rater calibration: display **«Не оцінено за офіційною шкалою YKI»**.

## 5. Прагматичний error taxonomy (НЕ частоти помилок українців)

| Code | Спостережуване відхилення | Label і пріоритет навчання | Safety |
|---|---|---|---|
| R04-T01 | Відсутній потрібний request / date / detail | TASK_MEANING_MISSING (P0) | Не сплутати з помилкою відмінка |
| R04-T02 | Фрагменти не зв'язуються, адресату важко стежити | COHERENCE_BREAK (P0) | Не карати за простий B1 синтаксис |
| R04-T03 | Надто фамільярно або не до того адресата | REGISTER_MISMATCH (P1) | puhekieli може бути доречною в усному побутовому контексті |
| R04-T04 | Механічні форми змінюють/ускладнюють зміст | FORM_IMPACT (P1), crossref R03 M01–M09 | Не штрафувати acceptable variants |
| R04-T05 | Слухач не може розрізнити ключову інформацію в аудіо | INTELLIGIBILITY_TARGET (P0) | Не діагностувати за transcript alone; accent ≠ fail |
| R04-T06 | Відповідь надто коротка для висновку | INSUFFICIENT_EVIDENCE | ungraded, не «нижчий рівень» |
| R04-T07 | Audio clipping/ASR mismatch/device error | TECHNICAL_UNCERTAINTY | fail closed; не приписувати учневі linguistic deficit |

**Дуже важливо:** це **hypothesis taxonomy**, не «7 типових помилок українців». Їхня частота, agreement і причинність **НЕ** встановлені. R03 morphological labels залишаються там; R04 — functional effect на повну продукцію.

## 6. Calibrated-human protocol: необхідний для будь-якого numerical reporting

**Перед recruitment:** незалежний письмовий protocol, ethics/consent, rights & retention, accessibility, reviewer training plan, rater rubric version, primary outcome and clinically irrelevant but educationally meaningful difference (pre-specified), power/feasibility на основі pilot variability; заборонено вигадувати N та effect size.

1. **Dataset:** лише consented original Finnish responses; різні жанри speaking monologue/dialogue та writing message/opinion, A2–B2, L1-UA як ціль + добровільні інші L1 для fairness; task difficulty, device/noise, accent, experience tracked лише за обґрунтованої потреби і consent. Names, addresses, health cases, audio PII **не комітити в public Git**.
2. **Human panel:** **мінімум 2 незалежні S2/YKI-familiar raters на калібрувальній підвибірці**, blinding до інших балів, групи дослідження, методу допомоги та AI output. Містити mixed level boundary responses, not only obvious successes. Розбіжності — третій rater/adjudication із записаним рішенням; провадити training+periodic drift checks.
3. **Scale:** окремо ordinal rating dimensions; **weighted kappa** для ordinal 3/4/insufficient vs **ICC absolute agreement (two-way random, appropriate model declared)** для інтервального, якщо валідно; разом з percent exact/adjacent agreement, contingency matrices, uncertainty intervals. **Pearson r показувати лише як додатковий**, не метрику надійності YKI.
4. **Model/ASR:** freeze version/seed/settings, task blind split, held-out voices/writers, no prompt leakage, actual ASR WER for consenting verified transcription (grouped by accent/L1/device), calibration error and threshold classification separately. Check false-positive «wrong Finnish», omission, invented corrections, hallucinated feedback.
5. **Fairness:** assess conditional error by L1, proficiency, accent/variety, disability accommodations and mic/noise where sufficient n; don't estimate individual demographics from audio. Без достатньої потужності позначити INCONCLUSIVE, не «fair by default».
6. **Outcomes:** primary *day-14 independent unseen communicative task success* (speaking і writing аналізувати окремо) human-blind; secondary day-30, confidence intervals, form/meaning, error persistence, revision quality, dropouts, time-on-task, frustration, technical failures. **Strong comparator** time-/content-matched teacher-approved meaningful elaboration + feedback (R01); not “nothing/no feedback”.
7. **Decision gates:** predefine minimum useful effect and reliability based on pilot + stakeholder review; do not invent κ≥.8 as universal certification. Stop automated scoring claims if severe subgroup error, unreliable audio, high disagreement near 3/4 threshold, or evidence of cue leakage. Report negatives/null and all baseline differences.
8. **No external AI runtime dependency:** curated rules/examples are teacher reviewed; optional experimentation with model-assisted authoring occurs outside learner-facing runtime and with dataset/data protection review.

## 7. Engineering contract proposals (specification only; NO implementation claim)

- **Owner learning/exercises/b1:** maintain distinct speaking/writing human observation criteria; draft new teacher-reviewed exemplars for levels 3/4 and allowed context/register variants. No fake conversion from 100-point internal scale to OPH 3/4.
- **Owner app/:** store immutable first attempt, task version, timestamp, post-attempt feedback event and self-repair; enforce no audio → no speaking score; revoke/delete consented media, offline by default; stable interrupted attempt. EXAM isolation must survive state restoration/restart.
- **Owner packages/contracts/:** future typed fields skill, task_id, channel, audio_evidence, assessable_dimensions, rubric_version, assessor_source, uncertainty, evidence pointer, output status UNGRADED/FORMATIVE_ONLY; no field implying official_level before authorization.
- **Owner research/yki/:** citation-level mapping to OPH speaking/writing tables and latest 2027 official test guidance; never assume software features before R02 demo validation.
- **Owner research/ux/:** randomized human trial, independent blinded human outcomes, retention 14/30, missed-session analyses.

### Release acceptance gates R4-01…R4-14 (all **PROPOSED**, none marked passed)

| Gate | Проверка / очікуваний тест |
|---|---|
| R4-01 | Criterion mapping OPH level 3/4 speaking PDF page 2 and writing PDF page 2 reviewed by S2 |
| R4-02 | Speaking vs writing dimensions independent, communicative task success first |
| R4-03 | Internal feedback weight/points never shown as official YKI or 3/4 probability |
| R4-04 | 2+ blind human raters on calibration subset with uncertainty+adjudication logs |
| R4-05 | Exact/weighted-kappa/ICC-appropriate CI reporting, no correlation-as-agreement |
| R4-06 | First independent answer immutable before any hint; new item pool held out |
| R4-07 | LEARN feedback limited, evidence-cited, supports learner self-repair |
| R4-08 | EXAM zero hints during attempt including after interruption/recovery |
| R4-09 | Missing/poor audio → UNGRADED; no pronunciation inference from transcript |
| R4-10 | Finnish acceptable variants and context-dependent puhekieli human-reviewed |
| R4-11 | Longitudinal independent speaking/writing at day 14/30, strong matched active comparator |
| R4-12 | Consent/retention/deletion/no real student PII in Git + accessibility fallback |
| R4-13 | Acoustic ASR model version, WER and fairness subgroup checks before release |
| R4-14 | Actual code+tests+appropriate CI+human S2 review; separate product study required for uplift |

## 8. Priority choices / explicit non-adoptions

**P0 ADOPT:** bilingual OPH-linked analytic observation design, meaning-first response → focused correction → self-repair → delayed unseen speaking/writing; human calibration plan; ungraded safety. **Expected benefit only hypothesis:** fewer misleading corrections and more meaningful communicative practice — **not measured**.

**P1 EXPERIMENT:** narrowly bounded Finnish ASR-assisted fluency/lexical metrics **only after** actual L2 Finnish human dataset and error/fairness analysis, with opt-out; not native-accent score. **No current production commitment.**

**REJECT:** autopublish «YKI 3/4» from LLM/ASR; fixed thresholds of internal 100-point rubric; accent penalties; hallucinated corrections; mass grammar mark-up before meaning diagnosis; gamified grade inflation; raw learner recordings committed to GitHub; assuming post-test release feedback mechanisms equal verified 2027 UI.

**Priority for next feature-PR:** create at least one S2-reviewed writing task and one recorded speaking task with full 3/4 observation anchors; implement immutable attempt + visible UNGRADED status + feedback only in LEARN; add negative tests; run human review. **Research-PR intentionally changes documentation only.**

## 9. Status and handoff

| Stage | Status at 28.10.2026 |
|---|---|
| OPH source audit + evidence-to-Hospodar mapping | **DONE at desk-research level** |
| Provisional formative rubric + Finnish prototypes + engineering gates | **SPEC_DRAFT** |
| Revised production rubric with S2-accepted exemplars | **NOT_DONE** |
| Actual product changes, audio/ASR feature or validated scoring | **NOT_IMPLEMENTED** |
| Calibrated independent human rater study | **NOT_RUN** |
| Participant transfer study, 14/30 days | **NOT_RUN** |
| Verified 2027 digital EXAM interface + high-stakes scoring | **NOT_VERIFIED / NOT_CLAIMED** |

**Principle:** джерело → конкретна навчальна дія → тестований контракт → human acceptance → independent user outcome. До останніх двох етапів не можна називати Hospodar «доведено точнішим за інших», «сертифікованим grading» або «підвищує YKI на X%».
