# 11 — Передові методи й технології підготовки до YKI (оновлено 21.10.2026)

> **Готовий research + product blueprint, не реалізований інтерфейс.** Розширили [каталог методів](../research/learning-methods-v1.json) від **35 до 51**, із **29 до 49** наукових/офіційних джерел; додали **16 нових методів/архітектурних правил** і оновили джерела **9 раніше описаних** методик. Результати в [machine-readable плані 11 модулів](../research/yki-methodology-implementation-v1.json).

## Чому недостатньо просто збільшувати кількість уроків

Наша ціль — **офіційний YKI keskitaso ≥3**, і він оцінює **чотири незалежні навички** (puhuminen, puheen ymmärtäminen, kirjoittaminen, tekstin ymmärtäminen). Для підготовки надійніше розв'язувати комунікативне завдання, усвідомлювати помилку, самостійно виправляти її і переносити в новий сценарій, ніж нескінченно читати зразки. [OPH — оцінювання](https://www.oph.fi/fi/koulutus-ja-tutkinnot/yki-testin-jalkeen).

**Рейтинг /100 — ЕКСПЕРТНА ОЦІНКА пріоритету саме для Hospodar YKI, а не шанси скласти YKI, не effect size та не калібрований психометричний тест.** Компоненти кожного балу: доказовість 30, відповідність фінській/YKI 30, підходящість A2.2–B1 20, простота реалізації 10, автономність та мотивація 10. Ярлики `HIGH` можуть відноситися до офіційного assessment-фреймворку, який *не є* причинним випробуванням педагогічної ефективності.

## Ключовий рейтинг нових доповнень

| Метод/технологія | /100 | Черга | Практичний результат для застосунку |
|---|---:|---|---|
| **YKI construct alignment: здібності → жанри → незалежне оцінювання** | **98** | P0 | Матриця з чотирма модулями YKI, 9 темами та can-do дескрипторами, мапінгом контенту і перевіркою coverage. |
| **Якірні людські оцінки й перевірка узгодженості AI-feedback** | **97** | P0 | Blind teacher anchor set: double-marking, rubrics, human adjudication, confidence, abstain option і журнал розбіжностей. |
| **Deliberate practice: усунення індивідуальних вузьких місць** | **96** | P0 | Error taxonomy → 3-5 targeted prompts → independent near/far transfer → delayed re-test. |
| **Feedback literacy: самовиправлення, uptake, перевірка переносу** | **95** | P0 | Розділити error evidence, підказку, self-repair, порівняння, нову тему і delayed uptake. |
| **Negotiation of meaning: уточнення й відновлення спілкування** | **94** | P0 | Сценарій змінює умову; партнер не зрозумів → clarification prompt → candidate answer → confirm. |
| **AI рольові розмови + педагогічний контроль + AI literacy** | **93** | P0 | Grounded scenario engine; structured rubric; teacher-approved key phrases; inspect low-confidence corrections. |
| **Listening evidence audit: gist → деталі → чому помилився** | **92** | P0 | First listen with hidden transcript; answer; targeted replay; reveal aligned transcript and evidence spans after attempt. |
| **Фінська фонологічна тривалість: окремо сприйняття і вимова** | **92** | P0 | Human minimal pairs + multi-talker forced choice + recording + human/phonetic calibrated feedback. |
| **Focus on Form під час комунікативного завдання** | **92** | P0 | Task → error trigger → concise rule+contrast → immediate second attempt → new context. |
| **CEFR mediation: пояснити текст/умову іншій людині просто** | **90** | P0 | Read/listen short authentic-like notice → 30s plain Finnish summary for friend; constrained fact checking. |
| **Digital test literacy: клавіатура, таймер, навушники, навігація** | **90** | P0 | Neutral computer-based rehearsal without inventing exact OPH 2027 widgets; timed free text and audio practice. |
| **Holdout item bank, difficulty tags і поступова психометрична калібровка** | **89** | P1 | Versioned train/test pools, teacher anchors, content hashing, exposure controls, sample-size and fairness gates. |
| **ASR як допоміжна підказка з оцінкою впевненості, не суддя** | **89** | P1 | ASR result + uncertainty flags + user playback + manual correction + confirm correct pronunciation where measurable. |
| **FSRS-подібний data-driven scheduler для підтверджених chunks** | **87** | P1 | Opt-in local SRS, delayed recall, cold-start defaults, explicit unknown detection, retention targets. |
| **Privacy-first learner analytics: явна згода, локальна історія** | **85** | P1 | Data minimization; consent for recording; encryption; delete/export; TTL; anonymous event metrics; model QA sandbox. |
| **Пасивне AI-переписування відповідей без власної другої спроби** | **46** | AVOID_OR_SUPPLEMENT_ONLY | Ніколи не показувати готовий ідеальний еталон до першої спроби; не винагороджувати copy/paste. |

## Критичні джерела — точні наукові висновки

### 1. TBLT, сучасні технології та робота з реальними ситуаціями

- **Bryfonski, Ziegler & Montee (2025):** технологічний TBLT, **17 досліджень**, aggregate `g=0.384`; після виключення двох потенційних outliers `g=0.265`. Це **невеликий середній ефект**, не доказ найкращого методу саме для Finnish YKI. [DOI](https://doi.org/10.3138/calico-2024-0029).
- **Li, Shadiev & Chiu (2025/2026):** GenAI + TBLT, **25 досліджень, 2431 учасник**, модератори: AI-literacy учня, task planning, хто оцінює. Висновок для нас — цільові сценарії з прозорими правилами і teacher-anchored feedback, а не відкритий чат без навчальної мети. [DOI](https://doi.org/10.1007/s11528-025-01140-7).
- **Saarela et al. (2026):** GenAI метааналіз **51 дослідження, 175 ефектів**, позитивні, але гетерогенні результати; не можна переносити їх безпосередньо на фінську чи офіційну шкалу YKI. [DOI](https://doi.org/10.1007/s10791-026-10015-1).

### 2. Аудіювання — не лише пасивне прослуховування

- **Dalman & Plonsky (опубліковано онлайн 2022, друкований випуск 2025):** стратегічне навчання L2 listening, **45 досліджень, 51 незалежна вибірка, d=0.69**; ефект залежить від контексту/методу вимірювання. [DOI](https://doi.org/10.1177/13621688211072981).
- **Сценарій:** прослухати нове фінське повідомлення → визначити тему → відповісти про час, причину, обмеження → прослухати проблемний фрагмент → лише тоді показати транскрипт з доказом → дати іншого диктора на незалежному тесті. Зберігати **first-listen** і **assisted-listen** окремо.

### 3. Довгі/короткі звуки — особливо важливо саме фінською

- **Saloranta & Heikkola (2022):** 4-тижневий курс із **68 учнями фінської** поліпшив **розпізнавання тривалості голосних, але не їх власну вимову**. [DOI](https://doi.org/10.1075/jslp.20040.sal).
- **Saloranta et al. (2022), N=18:** короткий listen-and-repeat для тривалості приголосних поліпшив поведінкове розрізнення, але вимірюване продукування та електрофізіологічні показники не продемонстрували ефектів тренування. [PubMed](https://pubmed.ncbi.nlm.nih.gov/35312934/).
- **Висновок:** пари `tuli/tuuli` і `kuka/kukka` — *спочатку відрізни звук на слух*, а потім *вимов і отримай незалежний feedback*. Не рахувати, що ASR-розшифровка доводить правильну кількість звука.
- **ASR meta (англійська!):** **15 досліджень, 38 ефектів, g=0.69**; ефективніше з явним feedback і для segmental аспектів, тоді як суперсегментні ефекти слабші. Це **не** Finnish benchmark. [Cambridge ReCALL](https://www.cambridge.org/core/journals/recall/article/effectiveness-of-automatic-speech-recognition-in-eslefl-pronunciation-a-metaanalysis/A915444CF252B61D14961D2FE733822D).

### 4. AI корекція письма — не плутати якісний текст із засвоєною навичкою

- **79 empirical papers (System, 2026):** AI корекція і rewrite зосереджені в середніх стадіях письма; часто мало attention до реальних комунікативних завдань та валідного assessment. [DOI](https://doi.org/10.1016/j.system.2026.104081).
- **22 studies systematic review (2025):** AI швидко допомагає з grammar/lexis/structure, але глибший зміст і контекст вимагають людського зворотного зв'язку. [ERIC](https://eric.ed.gov/?id=EJ1472557).
- **Не давати:** `напиши за мене ідеальний email` за першу спробу. **Давати:** task-fulfilment (чи все сказано?) → дві-три найважливіші цільові помилки → prompt self-repair → нове невідоме письмо без моделі → delayed re-test. Порівнювати з blinded S2 expert anchors.

### 5. Правила й межі цифрового YKI 2027

- [OPH офіційний календар](https://www.oph.fi/fi/koulutus-ja-tutkinnot/sopivan-yki-testin-valinta-ja-testipaivat): фінські тести 2027 цифрові, **10.04.2027** — повний keskitaso, **08–25.03.2027** — реєстрація. Є окремі весняні дати для частин іспиту.
- [OPH 18.09.2026](https://www.oph.fi/fi/uutiset/2026/yki-digitestia-kokeillaan-marraskuussa-2026): комп'ютер на тестовому місці, зміст завдань подібний до паперового, **листопадовий пілот ще не відбувся станом на 21.10.2026**. Тому **не вигадувати** точні скріншоти UI, таймери, правила повторного програвання чи клавіші.
- [OPH assessment](https://www.oph.fi/fi/koulutus-ja-tutkinnot/yki-testin-jalkeen): чотири незалежні модулі. Наш `score /100` — тільки внутрішня метрика, жоден поріг не можна називати сертифікованим рівнем 3 без валідного human grading та дослідження відповідності.

### 6. CEFR: mediation, online interaction, дія як одиниця навчання

- [CEFR descriptors](https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors) і [mediation](https://www.coe.int/en/web/common-european-framework-reference-languages/mediation) — це фреймворки, а **не** причинні докази ефективності. Можна обґрунтовано навчати зрозуміло переказати оголошення іншій людині, уточнити потреби адресата, вибачитися й відстояти думку.

## Технології — що використовувати, а чого не обіцяти

| Технологія | Практичне місце в застосунку | Застереження |
|---|---|---|
| **LLM + constrained scenario/state machine** | Рольові діалоги з новою умовою й самовиправленням | Grounded content, versioned prompts, учитель на пограничних випадках |
| **Finnish speech-to-text (ASR)** | Текстова допомога/транскрипція голосової відповіді | WER і акцент не дорівнюють вимові; low-confidence abstain |
| **Human recordings + acoustic playback** | Quantity (довгі/короткі звуки), голоси, register | Дозволи, калібрація human evaluation, без псевдоточних phoneme scores |
| **FSRS-подібний SRS** | Адаптивні повторення підтверджено складних chunks | [Benchmark FSRS](https://github.com/ankitects/fsrs-benchmark) на Anki — прогноз пам'яті, не результат YKI |
| **Knowledge graph + RAG/metadata** | Джерело/ліцензія → конструкція → сценарій → пояснення | Не копіювати захищені ресурси, перевіряти генерований приклад |
| **Holdout item bank** | Незнайома діагностика за модулями | Не називати IRT calibrated без достатнього емпіричного набору |
| **Privacy-first learner model** | Персональний профіль, помилки, голос і прогрес | Публічний GitHub не зберігає голос і відповіді користувачів |

## Робоча архітектура — 11 модулів для майбутньої розробки

| Пакет | Пріоритет | Основний приймальний критерій |
|---|---|---|
| **Knowledge graph лексика → chunk → речення → задача** | P0 | Every exposed task has provenance and license class |
| **YKI real-life task engine з адаптивною зміною обставин** | P0 | Every scenario has task-success criteria independent of grammar |
| **Багаторівневий слуховий тренажер gist/details/inference** | P0 | No script-only dialogue scored as listening |
| **Письмо: зміст → самовиправлення → новий текст** | P0 | AI never calls own numeric feedback official YKI grade |
| **AI voice tutor: task success, repair, uncertainty-aware ASR** | P0 | Accent/noise low-confidence responses abstain from precise phoneme punishment |
| **Finnish duration: perception vs production lab** | P1 | Perception and production reported as distinct outcomes |
| **Delayed recall на підтверджено проблемних конструкціях** | P1 | No bulk import of 10k lemmas into personal queue |
| **Four-skill independent assessment, teacher anchors, holdouts** | P0 | Never combine four modules into one official YKI grade |
| **Цифрові вправи як підготовка до роботи на комп'ютері** | P1 | No false claim of exact digital 2027 YKI UI |
| **A/B evaluation with meaningful outcomes** | P1 | Measure independently checked outcomes and confidence intervals |
| **Лінгвістична редактура контенту та експертні контрольні зразки** | P0 | Unreviewed item excluded from strict scoring |

## Емпірично перевіряти наші продуктові гіпотези, а не приписувати готові результати

Заплановано **4** тестовані порівняння: (1) self-repair проти AI rewrite; (2) targeted listening replay проти швидкого відкриття субтитрів; (3) різні реальні голоси проти одного TTS для фінської quantity; (4) targeted bottleneck practice проти випадкових вправ. Первинні outcome — **незнайомі незалежні завдання з відкладеною перевіркою**, а не retention у застосунку чи кількість натискань. [Повна специфікація експериментів](../research/yki-methodology-implementation-v1.json).

### Реалізація за фазами (пропозиція)

1. **P0 / Content QA & Baseline:** узгодити чотири модулі YKI, рубрики, teacher QA, ліцензії, distinct train vs holdout.
2. **P0 / Task loop:** mission state, self-repair, writing/listening evidence, real-life functional chunks, український targeted feedback.
3. **P0 / AI voice + human anchors:** природні діалоги, ASR confidence, змістова оцінка окремо від граматичної.
4. **P1 / Finnish quantity:** multi-speaker perception, separate production, human calibration, teacher-reviewed stimuli.
5. **P1 / SRS + digitally neutral practice:** adaptive chunks, fair repeated/novel tests, computer familiarity (без вигаданого екзаменаційного UI).
6. **P1 / Evidence cycle:** mini A/B tests, 7/14 day novel transfer, privacy and accessibility audit.

**Do not misrepresent status:** документація й JSON-плани — **специфікація майбутньої розробки**. У цьому циклі **не впроваджено** фронтенд, серверний адаптивний алгоритм, AI-транскрипцію чи YKI-grade prediction.
