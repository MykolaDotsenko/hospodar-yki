# 18 — Наука ефективного навчання, бестселери та best practices → вимоги до Hospodar YKI

**Зріз:** 21.10.2026. **Ціль:** підготувати дорослого користувача до фінського YKI keskitaso (A2.2 → стабільний B1/B1+), а не максимізувати кліки/серію днів.  
**Статус:** evidence-to-engineering specification, **НЕ** твердження про реалізовані алгоритми, лабораторну перевірку додатка або прочитання повних платних книжок.  
**Machine-readable registry:** [research/pedagogy/learning-blueprints-books-v1.json](learning-blueprints-books-v1.json).  
**Не дублювати:** [67 методик](08-learning-methods-evidence-2026-10.md) / [реєстр методик](learning-methods-v1.json) / [оцінки ефективності](learning-effectiveness-ratings-v1.json) / [наявне ТЗ](../../docs/15-two-modes-skill-scopes.md). Цей документ — **implementation bridge** від книжок/джерел до конкретних правил, алгоритмів, тестів і метрик.

## 0. Що реально вдалося прочитати / перевірити

Вивчено **офіційні відкриті синопсиси, зміст, авторські пояснення та дозволені уривки**, а не всі сторінки платних книжок. Для наукових статей переважно використано publisher abstract/open HTML, для деяких відкриті розділи; метааналізи **не** перекодувалися як новий власний systematic review. Не копіювати платні книги, PDF, діаграми або запатентовані вправи в репозиторій без окремої ліцензії. Опис ідей — **оригінальний переказ + конкретна власна імплементація**.

Статус `public_excerpt` ≠ `full_text_read`; `publisher_description` ≠ підтвердження всіх тверджень книжки науковими дослідженнями. Книга, навіть популярна чи написана науковцем, — **вторинне/практичне джерело**, а для висновку про ефективність перевіряти дослідження окремо.

## 1. Книги, перевірені за першоджерелами

| Книга / автор | Fit Hospodar /100* | Що забираємо в продукт | Статус доступу |
|---|---:|---|---|
| [**Make It Stick** — Brown, Roediger, McDaniel (2014)](https://www.makeitstick.com/about-make-it-stick) | **98** | retrieval, spacing, interleaving, відмову від «знайомо = вивчив» | авторські принципи + публічний уривок, не весь текст |
| [**Understanding How We Learn: A Visual Guide** — Weinstein, Sumeracki, Caviglioli (2019)](https://www.routledge.com/How-Learning-Happens-Seminal-Works-in-Educational-Psychology-and-What-They-Mean-in-Practice/Kirschner-Hendrick/p/book/9781138561694) | **98** | 6 strategies (retrieval / spaced / elaboration / interleaving / concrete examples / dual coding) + обмеження | каталог/зміст Routledge, публічні пояснення Learning Scientists |
| [**How Learning Happens**, 2nd ed. — Kirschner & Hendrick (2024)](https://www.routledge.com/How-Learning-Happens-Seminal-Works-in-Educational-Psychology-and-What-/A-Kirschner-Hendrick/p/book/9781032498409) | **96** | guidance для новачків, робоча пам'ять, learning misconceptions, відбір evidence | зміст та publisher preview, не 416 сторінок |
| [**How We Learn** — Stanislas Dehaene (2020/2021)](https://www.penguinrandomhouse.com/books/579922/how-we-learn-by-stanislas-dehaene/) | **94** | attention → active engagement → error feedback → consolidation | публічний видавничий виклад / уривки |
| [**Outsmart Your Brain** — Daniel Willingham (2023)](https://www.simonandschuster.com/books/Outsmart-Your-Brain/Daniel-T-Willingham/9781982167172) | **94** | уникнення ілюзій компетентності, короткі самоперевірки, навчання як навичка | синопсис видавця, не вся книга |
| [**Small Teaching**, 2nd ed. — James M. Lang (2021)](https://www.wiley.com/en-us/small-teaching-everyday-lessons-from-the-science-of-learning-2nd-edition-p-9781119755548) | **93** | короткі мікроцикли prediction → retrieval → connection → explanation | publisher TOC + опис/доступні уривки |
| [**Peak** — K. Anders Ericsson & Robert Pool (2016)](https://www.publishersweekly.com/9780544456235) | **91** | малі навички, expert model, вузьке місце, цілеспрямована повторна спроба | публічний професійний review, не книга |
| [**Fluent Forever**, revised ed. — Gabriel Wyner (2024)](https://www.penguinrandomhouse.com/books/224541/fluent-forever-revised-edition-by-gabriel-wyner/) | **90** | слухове розрізнення, власні контекстні картинки/фрази, retrieval flashcards | сторінка автора та видавця; marketing не = validated |
| [**A Mind for Numbers** — Barbara Oakley (2014)](https://www.penguinrandomhouse.com/books/314056/a-mind-for-numbers-by-barbara-oakley-phd/) | **88** | кероване навантаження, чергування фокуса/перерв, вправи на проблемну навичку | видавничий опис, авторський уривок |
| [**Atomic Habits** — James Clear (2018)](https://www.penguinrandomhouse.com/books/543993/atomic-habits-by-james-clear/) | **84** | зниження тертя початку місії, прив'язка до рутини, прогрес без шеймінгу | видавничий/авторський опис; НЕ дослідження L2 ефективності |
| [**Why Don't Students Like School?**, 2nd ed. — Daniel Willingham (2021)](https://www.wiley-vch.de/en/areas-interest/humanities-social-sciences/education-12ed/k-12-general-12ed1/teaching-learning-k-12-12ed13/why-don-39-t-students-like-school-978-1-119-71566-5) | **92** | посильний виклик, prior knowledge, пояснення незрозумілого, не перевантажувати пам'ять | publisher preview і опис |

*Fit 0–100 = експертний пріоритет **для реалізації** з урахуванням YKI/A2→B1+; **не** оцінка наукової доказовості книжки, не measured effect size і не продажний рейтинг. Книги тут популярні та/або відомі; верифікація конкретного місця в bestseller rankings для кожної не проводилася.

### Особливо корисні безкоштовні авторські best practices

- [The Learning Scientists: Six Strategies](https://www.learningscientists.org/blog/2016/8/18-1): самі автори попереджають, що доказовість шести стратегій різна; retrieval/spacing — найсильніші.
- [What Works Clearinghouse — Organizing Instruction and Study](https://ies.ed.gov/ncee/wwc/PracticeGuide/1): рекомендації spacing, examples/problem solving, visuals and verbal guidance, конкретні правила, але насамперед шкільний контекст.
- [Make It Stick — official principles](https://www.makeitstick.com/about-make-it-stick): корисно проти пасивного rereading.
- [Learning Scientists posters](https://www.learningscientists.org/posters/): **ліцензія CC BY-NC-ND 4.0**; не імпортувати постери в комерційний продукт та не редагувати їх. Можна використовувати **самі загальні педагогічні ідеї** з посиланням на первинні праці.

## 2. Наукові дослідження, які накладають конкретні обмеження на програму

| Джерело | Метод/масштаб | Що доводить / чого НЕ доводить | Наслідок |
|---|---|---|---|
| [Dunlosky et al. 2013](https://doi.org/10.1177/1529100612453266) | широкий огляд 10 навчальних технік | test practice, distributed practice мають широку підтримку; highlight/reread менш корисні як самостійна стратегія | незалежна відповідь — перед показом еталона |
| [Kim & Webb 2022](https://doi.org/10.1111/lang.12479) | **48** L2-експериментів, **N=3411** | spacing проти massing допомагає L2, на відкладеному тесті довші інтервали корисні; **equal vs expanding не мали статистично надійної різниці** | SRS із перевіркою реального пригадування; не заявляти, що графік 1/3/7/14/30 науково оптимальний |
| [Cepeda et al. 2006](https://doi.org/10.1037/0033-2909.132.3.354) | **317 експериментів / 184 статті** | інтервал повтору залежить від горизонту майбутнього тесту | алгоритм враховує due date YKI та фактичний успіх; не нескінченний жорсткий календар |
| [Rowland 2014](https://doi.org/10.1037/a0037559) | метааналіз testing vs restudy | складне вільне пригадування часто ефективніше за впізнавання; не означає примусово задавати занадто важке питання без підтримки | short answer + typed/speech first, MCQ як scaffolding/діагностика |
| [Pan & Rickard 2018](https://doi.org/10.1037/bul0000151) | **122 експерименти, N=10 382**, transfer `d=0.40` | general transfer можливий, неоднаковий для різних типів transfer | замінювати контекст, мову адресата та форму відповіді; held-out unseen tasks |
| [Brunmair & Richter 2019](https://doi.org/10.1037/bul0000209) | meta interleaving | ефект модерується подібністю категорій та навчальним матеріалом | порівнювати `illatiivi ↔ inessiivi ↔ elatiivi` після первинного засвоєння, не random everything |
| [Wisniewski, Zierer & Hattie 2020](https://doi.org/10.3389/fpsyg.2019.03087) | **435 досліджень, N>61 000**, overall `d=0.48` | фідбек корисний, але велика гетерогенність, важливий **зміст** фідбеку, не лише факт його існування | feedback: досягнення комунікативної мети → 1–2 high-impact помилки → next attempt |
| [Scherer, Graham & Busse 2024](https://doi.org/10.1016/j.learninstruc.2024.101961) | **95 праць, 200 порівнянь** | surface feedback змінює поверхневу точність; змістовний фідбек потрібен для якості думки; не всі результати переносяться на AI | для письма окремо `content_coverage`, `coherence`, `language_form` |
| [Lyster, Saito & Sato 2013](https://www.cambridge.org/core/journals/language-teaching/article/abs/oral-corrective-feedback-in-second-language-classrooms/B33FC71C12A1317DCA0CE704B7B0BC00) | L2 corrective-feedback review | зворотний зв'язок різниться за timing, формою і взаємодією; не безпечний висновок «виправляти всі слова завжди» | під час roleplay не зупиняти кожну секунду, окремий repair pass після репліки |
| [Pashler et al. 2008/2009](https://doi.org/10.1111/j.1539-6053.2009.01038.x) | critical evidence review | **немає достатніх даних для «visual/auditory/kinesthetic learner» meshing** | не проводити тест «типу навчання», вибирати modality за навичкою і потребою |
| [Lee & Huang 2008](https://doi.org/10.1017/S0272263108080479) | L2 input enhancement meta | у середньому form noticing `d=+0.22` поряд із meaning tradeoff `d=-0.26` | спочатку значення, потім один grammar cue, потім без cue |
| [Learning Scientists 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8368916/) | applied scientific review | mechanistic engagement важливіший, ніж наліпка «6 стратегій» | кожна кнопка/дія повинна викликати корисну розумову дію, а не декоративний «гейміфікований» click |

**Не додавати стандартизовані ефекти між різними дослідженнями.** Перенесення на Finnish YKI — педагогічна інженерна гіпотеза, яку перевіряємо на **нових B1 завданнях** з людською перевіркою.

## 3. 13 конкретних інженерних рішень, не чергова теорія

### LE-01. «Відповідь спочатку»: retrieval before reveal

- **Learn:** користувач відповідає без правильної форми, потім feedback; `hint_level` фіксується. Перший результат не переписується після самовиправлення.
- **Exam:** ключі, підказки, explanations і teaching overlays заблоковані до завершення.
- **Acceptance:** `first_attempt_correct`, `assisted_success`, `delayed_correct` зберігаються окремо.

### LE-02. Розумний SRS, не просто календар

- Поточний масив `1/3/7/14/30` днів — **прозорий MVP default**, не оптимальна формула.
- P1: інтервал залежить від незалежного recall, difficulty item, часових обмежень, цільової дати, частоти помилок; доведена рівність `equal` і `expanding` за Kim/Webb робить «обов'язково exponential growth» невиправданим.
- Усі scheduled reviews — з двосторонньою діагностикою: `recognized` і `produced` (продуктивна активність має власний evidence ledger), усе з timestamp, content version і provenance.

### LE-03. Чесне поступове підвищення складності (scaffolding)

- Новачку: короткий **worked example** із поясненням **після проби**, один guided contrast, один самостійний unseen приклад.
- Користувачу із двома стабільними успіхами: менше підказок, нова ситуація, змішана граматика.
- **Заборона:** не робити «чим більше страждань, тим краще навчання»; складність має бути посильною.

### LE-04. Interleaving, але не хаотичний random

- Старт `blocked` для складної нової конструкції; згодом `contrastive mix` близьких конструкцій; лише після цього multi-skill adaptive mix.
- Приклад: `menen kirjastoon` / `olen kirjastossa` / `tulen kirjastosta`.
- **Міряти:** чи людина сама обрала правильний відмінок у незнайомому реченні, а не лише впізнала зразок.

### LE-05. Місія навколо реальної мети, а не абстрактного балу

- Побутові ситуації: помилка у рахунку, автобус, запис до лікаря, оренда, робота, школа, загублений телефон.
- `task_goal`, `audience`, `outcome`, `register`, `success_criteria` — обов'язкові поля контенту.
- Не вважати граматично правильне речення успіхом, якщо ціль повідомлення не виконано.

### LE-06. Дозований feedback: зміст → форма → власне виправлення

- Письмо/говоріння: два шари: **чи виконав комунікативну задачу** і **як передав мовну форму**.
- У feedback максимум **1–3 пріоритетні помилки**, не повний червоний «автоматичний ремонт».
- Помилку показувати з `evidence_span` та `confidence`. Якщо AI невпевнений, запропонувати варіант і ручну перевірку; **не вигадувати оцінку YKI 3**.

### LE-07. Функціональна фонетика

- Продукт: розрізнення `tuli / tuuli / tulli`, `mato / matto`, ритм, quantity contrast, природні контексти.
- Навіть якщо STT розпізнав слово, це **не** верифікує якість/природність вимови чи fluency; допоміжна метрика.
- Voice recordings тільки за явним дозволом і з export/delete. Лише ліцензовані, перевірені фінські native/competent models.

### LE-08. Аудіювання: gist перед transcript, а не читання замість слухання

- Без транскрипту: коротке питання «про що / навіщо», потім 2–3 detail questions, лише після відповіді — verified transcript/VTT, якщо він є.
- Далі новий аудіоуривок без підказки. Зберігати **listening-first** success окремо від transcript-assisted.

### LE-09. Письмо: план → власний текст → 2 незалежні перевірки → rewrite

- Для YKI: особисте повідомлення, формальний e-mail, скарга, думка. `register` і `must_cover_points` не плутати з морфологічною точністю.
- Після першої версії: content/coherence feedback; grammar/lexis feedback; rewrite **без копіювання готового еталона**; новий адресат/обставина.
- Не оцінювати CEFR, якщо немає людських anchor texts та calibration.

### LE-10. Пізня незалежна перевірка кожної навички

- 1/3/7/14/30 review (поточний MVP), потім unseen `7-day transfer`, `14-day transfer` у нових контекстах (план для продукту).
- `near transfer` (та сама структура, інше слово) і `far transfer` (інший співрозмовник, інший жанр) — окремі типи.
- Вести `exposure_history` на item рівні; повторене екзаменаційне завдання не «невідоме».

### LE-11. Calibration: прогноз учня проти actual first attempt

- До навчального тесту коротке «Чи зможу я сказати це без підказки?» (опційно), після — оцінка actual. Розрив — сигнал для рекомендацій.
- Не робити 0–100 self-confidence синонімом рівня YKI B1.
- `confidence_gap` для навчального плану, не для шеймінгу.

### LE-12. Дрібний регулярний старт без маніпулятивної гейміфікації

- «Почати 10/20/30 хв», «Продовжити з того місця», конкретне пояснення «чому саме ця місія»; дозволити паузу без втрати.
- Habit stacking / календар / нагадування — лише opt-in; не примушувати до streak, не карати відсутність навчання.
- Завдання мають бути внутрішньо значущими (вміння владнати реальну ситуацію), а не заробляння монет.

### LE-13. Контент та інтерфейс — один доказовий контракт

- `skill`, `target`, `objective`, `CEFR difficulty hint`, `source/license`, `S2_review`, `exposure`, `estimated_duration`, `answer_key_type`, `feedback_policy`, `transfer_variant_ids`, `YKI_compatibility`.
- Словники: слово → chunk → побутове речення → власний productive приклад → пізній незнайомий контекст. Не вважати всі незнайомі слова автоматично невідомими.
- Test pool **ізольований від** показуваного learn content; copyrighted excerpts/books не імпортувати до commercial app без дозволу.

## 4. Конкретний learning UX — зразок 20-хвилинної місії

**Це проєктний сценарій, а не науково доведене оптимальне розбиття хвилин.**

| Час | Екран | Дія |
|---|---|---|
| 0–2 хв | `Повернення знань` | 2–3 короткі due retrieval без підказок |
| 2–6 хв | `Ситуація` | слухання/текст + питання на головну думку |
| 6–10 хв | `Використай` | розв'язати ситуацію письмово/вголос; target тієї самої теми |
| 10–13 хв | `Помилки` | 1–3 конкретні high-impact issues, значення перед граматикою |
| 13–16 хв | `Самовиправлення` | друга незалежна спроба після пояснення, не auto-fix |
| 16–19 хв | `Нова ситуація` | unseen context, відповісти без підтримки |
| 19–20 хв | `Що далі` | результат per-skill, due review, один next-best-action |

**На 10 хв**: скоротити число завдань, не пропускати незалежну спробу й transfer. **На 30 хв**: більше реалістичних взаємодій, не декоративних экранчиків. **На speaking-only** — весь цикл усний, без прихованих reading tasks. **На exam mode** — жодного teaching feedback до завершення.

## 5. Prioritised implementation contracts

| Пріоритет | Компонент | Definition of done |
|---|---|---|
| **P0** | Transparent session planner | Skill-specific або 4-skill mixed; тільки валідні task IDs; підказки не витікають в exam; план можна повторити/протестувати |
| **P0** | First-attempt & error ledger | Незмінна початкова відповідь, source/version, допомога, категорія помилки, без «гарних» фейкових YKI оцінок |
| **P0** | Guided correction & transfer | semantic content first; fixed error budget; unrehearsed new context; delayed cue fading |
| **P0** | Privacy, rights and content QC | Exposed тільки licensed/teacher-reviewed для оцінних тверджень; data export/delete |
| **P1** | Adaptive retrieval scheduling | Existing 1/3/7/14/30 baseline, compare data-driven alternate; due-first but avoid starvation 4 skills |
| **P1** | Learner skill graph & diagnostic | 4 distinct skill evidence streams, uncertainty, why recommended, per-genre coverage |
| **P1** | Legitimate voice & audio | human reviewed multivoice B1 Finnish with aligned transcript, quantity contrast drills, human-validated feedback |
| **P1** | Full writing/speaking feedback | separate task success/linguistics, uncertainty/abstention, human anchor validity |
| **P1** | Content evaluation engine | 7/14-day unseen tasks, versioned held-out pool, teacher double scoring for productive outputs |
| **P2** | Experiments & notification habits | Pre-registered compare on unseen transfer; opt-in reminders, low stimulation mode |

## 6. Anti-patterns / scope cuts

1. **«Ти візуал — слухання не потрібно».** Learning styles meshing not supported; modality must come from *target skill*.
2. **Автогенерація нескінченних задач без редактури.** More material ≠ validated Finnish; insert provenance and review.
3. **Показувати ідеальну відповідь до першої спроби**, а потім рахувати first-attempt mastery.
4. **AI оцінює вимову за speech-to-text** або ставить `YKI 3/4` за grammar accuracy.
5. **Повне блокування підказок новачку у learn**, коли exercise явно не посильний: потрібне пояснення після спроби.
6. **Суворий експоненційний SRS як науковий закон**, без порівняння recall після delay.
7. **Всім завжди хаотичний mix**, навіть без попередніх worked examples і базового розуміння.
8. **Яскраві картки, стрики, бали, які заміняють навчання**; не обіцяти +40% memory від палітри.
9. **Впроваджувати дизайн із книжки дослівно:** продуктове рішення може спиратися на загальну ідею, але не копіювати ілюстрації/вправи/тексти.

## 7. Outcome metrics / реальна перевірка

**Primary:** `7-day_unseen_cueless_skill_success` окремо для `reading/listening/writing/speaking`; для продуктивних навичок — ручна або валідована rubric review із невизначеністю.  
**Secondary:** `14-day_transfer`, `independent_first_attempt_rate`, `error_recurrence`, `time_to_communicative_success`, `help_requests`, `return_to_practice`, `four_skill_coverage`, `content_exposure_leakage`.  
**Guardrails:** `gist_comprehension` (чи не заважає виділення форми значенню), `anxiety_self_report`, `accessibility`, `retention_impact`, `privacy`, `evaluation_calibration`.  
**Experiments:** random assignment at task/user with item difficulty control and held-out evaluation; predefine minimum worthwhile effect, sample size, time horizon; don't report synthetic 0–100 expert priorities as causal gain.

### What we have vs what we have not

**Already exists:** static minimal MVP one vertical mission with `first-attempt → self-repair → transfer → SRS`, content registries, short 4-skill diagnostic and 9-task mini exam.  
**Still planned:** mature adaptive session planner across 4 skills, novice-aware fading, teacher-calibrated feedback, full digital-2027 YKI simulator, human multivoice Finnish, proven 7-day retention experiment.

**Підсумок:** сильний продукт — це **навчальний двигун** (retrieval, adaptive spacing, feedback, transfer) навколо **живих фінських комунікативних цілей**. Брендинг/кольори повинні спрямовувати увагу на ці дії, а не створювати ілюзію засвоєння. Критерій успіху — незалежна здатність користувача діяти фінською через тижні, не хвилини.
