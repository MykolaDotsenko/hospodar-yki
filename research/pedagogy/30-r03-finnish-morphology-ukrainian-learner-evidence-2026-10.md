# 30 — R03: граматика й морфологія фінської для україномовних учнів — доказова основа Hospodar YKI

**Перевірка:** 28.10.2026. **Owner:** педагогіка + S2 linguist. **Статус:** `SOURCE_REVIEW_COMPLETED / UKRAINIAN_L1_ERROR_RANKING_UNVALIDATED / PARTICIPANT_STUDY_NOT_RUN / LESSONS_NOT_IMPLEMENTED`. Вікова/рівнева ціль: дорослі україномовні A1.3–B2.1; YKI keskitaso B1/B2. **Це цільовий критичний огляд selected studies, не систематичний PRISMA**, не аналіз конфіденційних учнівських корпусів, не дослід із користувачами Hospodar.

**Зв'язки:** [R01–R12 program, саме R03](../29-twelve-product-research-studies-execution-2026-10.md#r03--найскладніші-місця-фінської-дослідження-орієнтоване-на-l2), [70 канонічних методик](learning-methods-v1.json) та [експертні рейтинги](learning-effectiveness-ratings-v1.json), [новітня міжнародна база №26](26-global-effective-language-learning-2026-10.md), [meaning-first/structured input №25](25-pragmatics-processing-notes-finnish-2026-10.md), [study design owner](../ux/learning-impact-evaluation-protocol.md), [EXAM fidelity](../../docs/14-digital-yki-fidelity-spec.md). Це **topic-specific evidence+lesson design**, не нова методика в JSON і не заміна наявної граматичної програми.

## 1. Науковий висновок та рішення для продукту

**Проблема ≠ «у фінській багато відмінків»**. Слід розрізняти **три незалежні механізми**, які в однаковій неправильній фразі можуть змішуватися:

1. **SEMANTIC CASE SELECTION:** учень не зрозумів, чи говорить про місце, напрямок, джерело, частину/кількість, цілісний об'єкт, дію в процесі або заперечення. Наприклад, `talossa/talosta/taloon` — не три довільні закінчення.
2. **STEM ALLOMORPHY/MORPHOPHONOLOGY:** відмінок вибрано правильно, але учень **не може утворити правильну основу**: `vesi → vedessä`, `ilta → illalla`, `kauppa → kaupan`, `kukka → kukan`. **Не** замінювати навчання правилом «приклей -ssa до номінативу».
3. **VALENCY / REKTIO + REGISTER:** форма визначається конкретною конструкцією, не загальною семантикою місця: `pitää kahvista`, `tutustua uusiin ihmisiin`, `luottaa sinuun`, `pystyä tekemään` (standard). Нормативне `pystyy tekemään` і розмовне `pystyy tehdä` можуть співіснувати в регістрах, але не підлягають одному автоматичному «виправленню».

**Пріоритетне продуктове рішення (ADOPT, P0):** навчальний цикл `значення → independent case selection → independent stem production → feedback, що називає тип помилки → self-repair → нове слово/речення/ситуація → held-out 14/30-day task`. Тренувати **граматичну форму в реальній комунікативній дії**, а не максимум суфіксів за хвилину. Відокремлювати `first_answer`, `feedback_shown` і `repair_answer` для чесної метрики. Не змушувати весь курс проходити відмінювання, якщо учень проходить незалежну діагностику.

**Важливо про українців:** наведені нижче експерименти/корпуси переважно **різномовні, російськомовні, естономовні або інші L1**. У цьому огляді **не знайдено надійного україномовного корпусного рейтингу** найчастіших конкретних помилок у Finnish A2/B1. Фрази «українці найчастіше плутають X» — **гіпотеза для перевірки**, а не результат наукової статті. Українська/фінська морфологічні відмінності — аргумент для навчальної адаптації, але не замінник емпіричних даних.

## 2. Первинні джерела, експерименти, ризик перенесення

| ID | Дослідження / точно підтриманий висновок | Вибірка, обмеження, застосування до Hospodar |
| --- | --- | --- |
| **R03-E01** [Salmela et al., 2024, *Computer Assisted Language Learning* — Finnish Morphology Application RCT](https://doi.org/10.1080/09588221.2024.2365664) | **3-тижневий randomized single-blind trial**, дорослі beginner Finnish L2. FMA training **n=33** vs active **Suomipassi n=38**, загалом 71 analysed (із 173 enrolled, значне вибування і критерії виключення). Суттєві поліпшення **утворення відмінюваних форм**, у т.ч. novel pseudowords; найбільш виражене для transparent forms. Trained-word recognition виграло, **word-recognition speed between groups не виграло**, untrained recognition findings неоднозначні. Не доводить B1 writing/speaking або перевагу алгоритму окремо від контенту/системи. **DIRECT_FINNISH_GENERAL, NOT UKRAINIAN_SPECIFIC**. |
| **R03-E02** [Salmela, Lehtonen, Vainio & Bertram, 2025, *SSLA* — stem allomorphy](https://doi.org/10.1017/S0272263125000026) | Lexical decision і eye tracking у реченнях L1 vs L2 Finnish: L2 **довше/частіше помилялися** на semi-transparent changed stems, longer fixation у context; L1 pattern відрізняється. Приклад зі статті `aamu→aamulla` vs `ilta→illalla`. **Механізм обробки, а не randomized teaching effectiveness**. DIRECT_FINNISH_GENERAL. |
| **R03-E03** [Hedlund et al., 2026, *Journal of Neurolinguistics* — morphological encoding and fMRI](https://doi.org/10.1016/j.jneuroling.2026.101319) | **3×15**: beginner Finnish L2 **L1 Russian**, advanced L2 **L1 Russian**, Finnish native; overt/covert inflection of high/medium/pseudoword stems з/без gradation. Beginners частіше помилялися, advanced наближалися до native; brain responses show processing differences. **Корелятивне нейрофізіологічне порівняння, не рекомендація fMRI, не RCT і НЕ Ukrainian L1.** DIRECT_FINNISH/RUSSIAN_GROUP, INDIRECT_UA. |
| **R03-E04** [Dal Pozzo, 2023 — L2 Finnish object partitive](https://doi.org/10.6093/1826-753X/10968) | Онлайн-завдання для різних контекстів об'єктного партитиву: **заперечення — менше variability**, **aspect/event boundedness — складніше**. Не універсальне ранжування українців і не RCT навчання. DIRECT_FINNISH_GENERAL. |
| **R03-E05** [Spoelman, 2011/2012 — L1 effects on Finnish partitive](https://oulurepo.oulu.fi/handle/10024/34890) | Порівняння ICLFI **Estonian, German, Dutch** за partitive over/underuse; мовний бекграунд змінює типи помилок і можливий transfer. Не припускати, що українці мають той самий pattern. DIRECT_FINNISH_NON_UA. |
| **R03-E06** [Nissilä, 2011, University of Oulu — verbs & rections](https://oulurepo.oulu.fi/handle/10024/37361) | Test translations **111 Estonian +15 Russian learners**, частотність verb, досвід і L1–L2 similarities впливали на verbs/rections, складно навіть advanced. Не Ukrainian, translation-to-Finnish не spontaneous YKI speaking. DIRECT_FINNISH_NON_UA. |
| **R03-E07** [Seppälä, 2013 — ICLFI verb chains and rections](https://www.ceeol.com/search/article-detail?id=187591) | Learner-corpus study: abstract MA-infinitive and deverbal nouns difficult; verbs/rections краще викладати **chunks** у ситуаціях, а не лише в списках. Корпус не демонструє причинної переваги chunk-навчання сам по собі. DIRECT_FINNISH_GENERAL. |
| **R03-E08** [Kielitoimiston ohjepankki — rektio](https://kielitoimistonohjepankki.fi/ohje/rektioita-mita-rektio-on/) | Нормативна довідка Kotus: `tutustua + mihin`, `haaveilla + mistä`, регістрові варіанти `pystyy tekemään/pystyy tehdä`. **Факт норми, НЕ outcome study**. HUMAN S2 answer variants required. |
| **R03-E09** [Kielitoimiston ohjepankki — acceptable inflection variants](https://kielitoimistonohjepankki.fi/ohje/taivutustyyppeja-palveluita-ja-palveluja-mansikoihin-ja-mansikkoihin/) | Нормативні множинні альтернативи (`mansikoita/mansikkoja`, `mansikoihin/mansikkoihin` залежно від парадигми). **Не** штрафувати допустимий варіант як єдину неправильну відповідь. Не результат експерименту. |
| **R03-E10** [ICLFI corpus, Kielipankki](https://www.kielipankki.fi/corpora/iclfi/) | Морфологічно анотоване, CEFR-рівні та L1 metadata learner written Finnish. **Усі доступні версії потребують індивідуального доступу (RES)**, персональні дані/приватність `+PRIV`. Немає отриманих чи проаналізованих текстів. **ACCESS-RESTRICTED**. |
| **R03-E11** [Topling/Cefling, Kielipankki](https://www.kielipankki.fi/corpora/topling/) | **1 194 Finnish L2 written samples** у проєктному описі, CEFR оцінки; дані про writing development, можуть допомогти сформувати тестовий банк. **RES permission required**, не стверджувати, що корпус містить n українських учнів. |
| **R03-E12** [LAS2 Advanced Learner Finnish, University of Turku](https://www.utu.fi/en/university/faculty-of-humanities/school-of-languages-and-translation-studies/research/utu-digilang/the-advanced-finnish-learners-corpus) | **~400 академічних текстів** високого рівня, синтаксично/морфологічно анотованих, `CC BY-NC-ND` та accession conditions. **Не репрезентативно для A1.3–B1 українців**, не пакувати в комерційний/offline застосунок без legal review. |
| **R03-E13** [Brunni et al., 2015 — Finnish learner error annotation](https://doi.org/10.15845/bells.v6i0.812) | Описує **неоднозначності анотації** morphologically-rich learner errors і потребу тега/контексту, інакше «помилка закінчення» плутається з semantic choice. **Метааналіз чи effectiveness trial — ні.** |
| **R03-E14** [Lesonen et al., 2017 — adult L2 Finnish developmental trajectories](https://research.rug.nl/en/publications/from-conceptualization-to-constructions-in-finnish-as-an-l2-a-cas/) | **Один дорослий** long-term learner study: зміна конструкцій неоднорідна, багато item-based variability. Не встановлює універсальної послідовності тем/чотирьох навичок для всіх. |
| **R03-E15** [OPH YKI performance construct and dates](https://www.oph.fi/fi/koulutus-ja-tutkinnot/sopivan-yki-testin-valinta-ja-testipaivat) | YKI оцінює **читання, аудіювання, говоріння, письмо** окремо; рівень 3=B1, 4=B2. **Нормативна вимога**, не причинний метод навчання; digital UI unknown → [R02](../yki/20-yki-official-complete-audit-2026-10.md). |

**Пріоритетність доказів:** E01 = найпряміше втручання на beginner Finnish morphology, але втрата учасників має значення; E02/E03 = механізми та рівневі відмінності, не effect-of-app; E04–07 = контекстні труднощі/transfer non-UA, без причинної інтервенції; E08–09 = мовні нормативні reference gates; E10–12 = prospective corpora, **no access/no counts extracted**; E13–14 = coding/development; E15 = official exam construct.

### 2.1. Що ми свідомо **не** стверджуємо

- Немає підтвердженого рейтингу «ТОП-10 **найпоширеніших помилок українців**»; E03 має `L1 Russian`, E05–06 — естонську/німецьку/голландську і трохи російську. Навіть схожість окремих слов'янських граматичних явищ **не** доводить однаковий L1-transfer.
- `n=33` та `n=38` RCT — **аналізована**, не початково набрана вибірка; пропуски та вибування можуть зміщувати результати. Контрольний застосунок навчав **іншого змісту**; не можна приписувати весь ефект лише SRS/візуалізації.
- `fMRI` не потрібна в Hospodar. Pseudoword transfer — сильніший тест rule application, **не самостійна B1 комунікація**.
- **Semantic case selection** і **stem morphology** можуть бути помилковими одночасно — annotation має дозволяти multi-label і `ambiguous` а не примусову одну помилку.
- **Нормативний Kotus** допускає кілька форм і регістрів. `wrong` без genre, case, inflection class and S2 review може бути фальшивою помилкою.
- У фінській частина складнощів — **значення події** (completed vs ongoing, quantity, negation), і рівень може стрибати між завданнями; не виходити на стовідсоткову «граматичну майстерність» із словоформ на картках.

## 3. Операційна карта діагностики — 9 гіпотез до людського вимірювання

**Це навчальні пріоритети, НЕ frequency-ranked помилки україномовних**. Деякі перетинаються; кожна має власний експериментальний prompt.

| Tag / Priority | Що учень має розуміти | Самостійна нова дія фінською / межа |
| --- | --- | --- |
| **M01 · P0 Semantic local cases** | `missä/mistä/mihin`, source vs destination, `-ssa/-sta/-Vn` | `Asun talossa`, `Lähden talosta`, `Menen taloon`; пояснити життєвий рух, не вгадати останню букву |
| **M02 · P0 Stem change** | `ilta→illalla`, `vesi→vedessä`, `kukka→kukan`; потрібна правильна **основа**, не механічне приклеювання | `Olen illalla kotona`; нове слово `käsi→kädessä` для transfer, **не** заучений `ilta` |
| **M03 · P0 Object partitive** | negation / quantity / boundedness | `En ostanut kirjaa`; `Luin kirjaa` vs `Luin kirjan`; перевіряти meaning, не лише суфікс |
| **M04 · P0 Verb rection** | які слова вимагають яку форму | `Pidän kahvista`, `Tutustun uuteen naapuriin`, `Luotan sinuun` у живому зверненні; dictionary+S2 |
| **M05 · P1 Consonant gradation** | strong/weak `k/p/t`, gradation by word class, reverse/irregular cases | `kauppa→kaupan`; `matto→maton`; нове слово в листі, не лише isolated MCQ |
| **M06 · P1 Number and case** | singular/plural partitive and case allomorphs, several standard variants | `Etsin edullisia takkeja`; альтернативні norm variants допустимі, S2 review |
| **M07 · P1 Verb chains** | `pystyä tekemään`, `mennä tekemään`, `alkaa tehdä` та genre | `En pysty tulemaan huomenna` — ввічливе повідомлення роботодавцю; colloquial acceptance context-specific |
| **M08 · P1 Genitive and consonant alternation** | власник / визначення / inflected modifier | `uuden kuukauden alussa`; відмінювання групи слів, не лише noun |
| **M09 · P1 Form-to-communication transfer** | тотожний відмінок у новому жанрі: скарга, лист лікарю, колезі | `Haluaisin siirtää aikaani` → `Voisimmeko siirtää kokousta?`; оцінка змісту окремо від граматики |

**Сортування наступного навчального дня:** `actual error frequency by user (only consenting learner) + severity for task meaning + confirmed CEFR step + due review + task relevance`, не глобальна декларація «90% українців помиляються тут». Без даних/згоди — стандартна логіка курсу і ручний learner choice.

## 4. Ready-to-build teaching slice: зміст → форма → самовиправлення

### Сценарій A: «Звідки й куди?» — навчання значень

1. **Meaning-first:** простий план будівлі з трьома діями `Olen kotona / Tulen kotoa / Menen kotiin` (не підмішувати `talossa` без пояснення місцевих форм), далі `talossa/talosta/taloon`; один зрозумілий сюжет.
2. **First answer:** `Mistä asiakas tulee?` → учень пише `Hän tulee talosta`, без кольорової готової закінцівки.
3. **Feedback:** якщо вибрано `taloon`, тип `M01 semantic source/destination` (виправити значення); якщо `*talosta` з помилковою основою — `M02 stem`. Для кожного слова S2-approved variants.
4. **Self-repair:** учень заново формулює `Hän tulee talosta`; перший запис збережений, другий окремий.
5. **Novel context:** `Lähden työpaikalta ja menen kauppaan` (також внутрішні/зовнішні локальні форми; не удавати той самий case).
6. **Delayed 14/30:** нова карта/адресат, не показувати оригінальне правило, здійснити практичну комунікативну дію.

### Сценарій B: «Не лише закінчення» — зміна основи

1. Ознайомлення `aamu → aamulla` (прозора) vs `ilta → illalla` (зміна основи). Учень має встановити значення речення, а не абстрактну буквену анімацію.
2. **Independent:** `Missä puhelin on?` → `Puhelin on kädessä` (за учнівським prompt picture; базова `käsi` наявна в навчанні).
3. **Feedback:** `käsi→käde- + -ssä` = `kädessä`; не `*käsissä` як автоматична **однина** (увага: `käsissä` має можливий plural meaning, тому `*wrong` лише за singular prompt). Значення й number є частиною grading policy.
4. **New lexical form:** `Vesi on lasissa` або `Lasiin tulee vettä` з іншим контекстом; оцінювати **яку** операцію тренуємо, не змішувати все в один бал.
5. **Delayed held-out:** слово іншої, but teacher-matched, inflection class, без спливаючого закінчення.

### Сценарій C: «Партитив як значення події»

- `En osta kahvia` — заперечення → об'єкт у partitive.
- `Juon kahvia` — незавершена/необмежена кількісно дія.
- `Join kahvin` — цілісний об'єкт, завершеність у цьому контексті.
- Учень обирає **реальне значення дії**, сам пише прохання/пояснення, отримує коментар meaning/form окремо. Автоматичний ключ повинен бути **context-bound**; без context навіть `Join kahvia` і `Join kahvin` можуть обидва бути коректними в різних смислах.

### Сценарій D: «Rektio як chunk»

- `Olen kiinnostunut suomen kielestä` (зацікавлений фінською мовою), `Pidän tästä kurssista` (подобається курс), `Luotan opettajaan` (довіряю викладачеві).
- Помилка `*pidän tämä kurssi` анотується `M04 rektio`, а якщо неправильна форма основи й рекція — multi-label; feedback пропонує **один максимум два** кроки, потім перенос в іншу ситуацію.
- Genre policy: нормативне `pystyn tulemaan`; у LEARN розмовні варіанти можуть бути окремо пояснені, EXAM наслідує verified official task construct, не видає slang за помилку мовного змісту без жанрової рубрики.

**Всі наведені приклади — editorial design sketches, не опублікований `teacher_reviewed` item bank.** Перед shipping — S2 checking, originals, difficulty, multiple acceptable answers, text/audio rights, accessibility, two levels of grading: semantically complete and morphologically accurate.

## 5. Де знайти реальні україномовні помилки — доступ, приватність, не вигадувати частоти

### 5.1. Корпуси (discovery only)

- **ICLFI** [Kielipankki](https://www.kielipankki.fi/corpora/iclfi/): має L1/CEFR metadata; всі версії доступні **лише за заявки**, умови `+PRIV`, не завантажувалися й **не перевірено, скільки саме українськомовних**.
- **Topling** [Kielipankki](https://www.kielipankki.fi/corpora/topling/): 1,194 Finnish L2 examples на рівні проєкту, необхідний RES; не відомий UA subgroup.
- **LAS2** [Turku](https://www.utu.fi/en/university/faculty-of-humanities/school-of-languages-and-translation-studies/research/utu-digilang/the-advanced-finnish-learners-corpus): не A1–B1, академічні тексти, не використовувати для «найпоширеніших помилок українців».
- До дозволу та ліцензії не отримувати/експортувати чутливий learner content; не завантажувати корпус у публічний repo чи cloud LLM без окремої правової підстави.

### 5.2. Проспективний ethically-approved learner-error pilot

**Гіпотеза:** changed-stem і contextual partitive/valency tasks можуть пояснювати суттєву частку **помилок конкретної когорти** та її нового письма/мовлення, але обсяг/ранги наперед **НЕ ВІДОМІ**.

**Вибірка:** дорослі добровольці L1-UA і за добровільною згодою separately-coded bilingual UA/RU/other; облік CEFR A1.3/A2.2/B1, освіти, досвіду/рівня контакту з фінською. Не об'єднувати всіх «українців» за громадянством у L1-UA; мова першого засвоєння і звична мова різні. Запланувати sample-size/power feasibility до набору, не вписувати фіктивне N. Валідний consent + data controller, retention, withdraw/delete, окремо voice-permission; no raw identifying learner material in Git.

**Мінімальні original prompts:** 4 × короткий contextual case task; 4 × transparent/changed-stem inflections; 4 × different-partitive situations (negation/aspect/quantity); 4 × real rektio chunks; 2 × 60–100-word short practical messages (housing/work/doctor); optional oral turn із дозволом запису. Тестові одиниці S2-reviewed до підключення учасників. **Ці кількості — первинна пропозиція протоколу, не статистично обґрунтована дозована норма.**

**Annotation schema (опис, не окремий центральний реєстр):** `consented_pseudonym, baseline_level, L1_self_report, prompt_id, prompt_version, situation, goal, first_answer, corrected_answer_optional, case_choice{correct/incorrect/ambiguous}, stem_form{correct/incorrect/ambiguous}, rektio{correct/incorrect/ambiguous}, partitive_semantics{correct/incorrect/ambiguous}, communicative_success{yes/partial/no/ungraded}, correct_variant_ids, register, rater_1, rater_2, adjudication, exposure_history, due_at, observed_at, response_mode, data_deletion_status`. **Не писати ім'я, IP, медичні дані, громадянство чи діагноз у навчальний record**; reidentification key поза дослідницькими response data, якщо взагалі потрібен.

**Кодування:** 2 незалежні S2 reviewers на перекритій підвибірці; training calibration, agreement (nominal `Cohen κ` або multi-label per-category metrics), reconcile disagreements, `uncertain/ungradable` допустимі; рівень помилки вказується лише де вправді був контекст **для її появи** (denominator = genuine opportunities, не кількість усіх слів). Multiple independent observations per learner => cluster-aware uncertainty. Правильність граматики не замінює `task success`.

**Outputs:** anonymous distribution `errors / opportunities` by tag, task, proficiency and self-reported language background with uncertainty intervals; no per-group ranking when subgroup sample too small / sensitive; error confusion matrix; named difficulties **only after actual evidence**. Record natural/context confounds and teacher-bias errors.

### 5.3. Рандомізований педагогічний follow-up (R03-H01, NOT RUN)

**A:** targeted `stem + meaning + feedback + novel-task` intervention vs **B:** equally reviewed `meaningful Finnish language practice with feedback` same time/items/topic but **no targeted stem training**; separate contrast if testing explicit colored semantic cue vs uncolored explanation (do **not** change both teaching and graphics at once).
- **Primary:** **day-14** unseen context writing morphosyntax (human-blind meaning and form independently), pre-registered error family M02/M03; **secondary** 30-day transfer, new-lemma pseudoword wordform (mechanism only), communicative task success, cognitive burden/attrition.
- Baseline stratification CEFR, real exposure, avoid source/task leakage, report ITT + effect sizes/CI and null/negative findings; no fake promise of +X%. `M01…09` are hypotheses, not machine class labels discovered with training.
- **Approval gates before enrolment:** S2 items, lawful content rights, privacy, internal study/ethics review, storage durability beyond 120 localStorage attempts and blinded rubric. **No participants recruited or data collected for this R03 in this repository review.**

## 6. Engineering contract: distinct diagnostics, one concise useful feedback

**Proposed `concept-level` types, not deployed runtime:**

```ts
type L2MorphErrorFamily =
  | "M01_SEMANTIC_CASE" | "M02_STEM_ALLOMORPHY"
  | "M03_OBJECT_PARTITIVE" | "M04_REKTIO"
  | "M05_GRADATION" | "M06_PLURAL_CASE"
  | "M07_VERB_CHAIN" | "M08_GENITIVE_AGREEMENT"
  | "M09_COMMUNICATIVE_TRANSFER";

type AssessmentStatus = "correct" | "incorrect" | "ambiguous" | "ungraded";
type EvidenceClass = "DIRECT_FINNISH" | "OTHER_L1_TO_FINNISH" |
  "NORMATIVE" | "INDIRECT" | "HYPOTHESIS";

interface ReviewedFinnishMorphTask {
  taskId: string;
  level: string;                 // verified S2 curriculum gate
  intendedMeaning: string;        // learner task goal, not answer leak
  originalPromptFi: string;
  answerVariantsFi: string[];     // vetted + number/register/context
  errorOpportunities: L2MorphErrorFamily[];
  skill: "reading"|"listening"|"writing"|"speaking";
  feedbackFiUk: string;           // independent-first policy
  heldOutPairId: string|null;     // never render in LEARN before test
  s2Reviewed: boolean;
  sourceRightsApproved: boolean;
  versionHash: string;
}
```

**Acceptance M3-01…M3-12** (release/blocking criteria, **not implemented by this research PR**):

| Gate | Must-pass |
| --- | --- |
| **M3-01** | Every published prompt has S2 approval, rationale and grammar source, context-bound answer variants and rights. |
| **M3-02** | Separate `case_choice`, `stem_form`, `valency`, `meaning` and `task_success` where actual opportunities exist; avoid false generic "wrong ending". |
| **M3-03** | `M01` meaning before morphological color/cue; first attempt saved independently, feedback and repair events distinct. |
| **M3-04** | Changed stems tested with novel but S2-matched lexemes, not only repeated base-form suffixes. |
| **M3-05** | Partitive negation/aspect/quantity contexts distinguish communicative meaning; tests reject decontextualized unique answer where alternatives valid. |
| **M3-06** | Rektio chunks are complete `verb + required complement` and register-specific; never flag valid puhekieli as uniformly incorrect. |
| **M3-07** | Morphology correction can be `ambiguous`; escalation to human reviewer, no invented official CEFR/YKI rating. |
| **M3-08** | Item data can accept multiple teacher-approved variants, Finnish Unicode `ä/ö`, consonant doubling, case number, no coercive one-string rule. |
| **M3-09** | Held-out 7/14/30 real timestamps (not fake scheduled completions), no prior exposure/version leakage. |
| **M3-10** | Offline first answers durable across refresh/storage failures; incomplete recording must be `ungraded/not_saved`, not successful speaking. |
| **M3-11** | Privacy and rights: no corpus raw text storage without RES/consent; no personal identifiers/PII in Git/telemetry. |
| **M3-12** | EXAM four-skill practice only, **no** grammar highlights, answer-exposing feedback, fake B1 grade, or unverified 2027 UI controls. |

### First smallest value slice (P0)

Create **one** original `M01 + M02` microcycle (not 80 generated exercises):
- **2** contrasting `missä/mistä/mihin` meanings and **2** transparent-vs-changed-stem words.
- **1** independent first answer, **one focused** context-specific explanation, **one** self-repair, **one** new lexical situation and one **held-out delayed** task.
- Native/teacher-approved Finnish forms, Ukrainian explanation, keyboard/mobile, reduced motion, no default audio/autoplay and no AI dependency.
- Unit tests for wrong vs acceptable variant, ambiguous/number distinction, multi-tagging, refocus/recovery and exam firewall.
- **Ship/learning-gain claims only after** content review, real tests and measured independent outcomes; this document is research-only.

## 7. Research decisions and risk register

| Decision | Priority | Why/next action |
| --- | --- | --- |
| **ADOPT** Finnish changed-stem as independent skill | P0 | Strong direct L2 Finnish processing findings E01–E03; build targeted training and novel-lemma test. |
| **ADOPT** contextual partitive and case semantics | P0 | Finnish-specific E04/05 + meaning-first pedagogy; S2-approved cases and held-out transfer. |
| **ADOPT** rektio chunks with genre-sensitive variants | P0 | E06/07 + normative Kotus E08; prioritize authentic high-frequency communication. |
| **EXPERIMENT** Ukrainian-specific error ranking | P0 | **No verified representative UA corpus findings**; prospectively ethically recruit, do not claim prior frequency. |
| **RECHECK** Ukrainian L1 subgroup presence in ICLFI/Topling | P1 | Restricted RES/+PRIV; cannot assume subgroup exists or reuse data. |
| **ADAPT** safe grammar feedback | P0 | Separate wrong case, wrong stem and inadequate meaning; human S2 variants, more than one acceptable form. |
| **REJECT** suffix-only mechanical generator as full pedagogy | P0 | Stem alternations and selection cannot be explained by naïve appending. |
| **REJECT** any `brain-scan = optimal UI` / automatic YKI grade | P0 | Neurology observation not intervention; speaking/writing require human-calibrated rubric. |
| **DEFER** advanced plural/fusional stack complexity for beginners | P1 | Stage by learner readiness, not overwhelm with B2 morphophonology at A1.3. |

**R03 completion:** 15 individually linked evidence/official resources audited; 9 **unranked** testable problem families; 4 example communication microcycles; human corpus/ethical annotation/experimental protocol; 12 explicit engineering requirements. **No corpus access applied for, no new UA learner data analysed, no participant study performed, no runnable app feature added.** Next in the [program](../29-twelve-product-research-studies-execution-2026-10.md) is **R04 — human-calibrated speaking/writing assessment**, while R03 still needs licensed S2 content and user trials before being called empirically validated.
