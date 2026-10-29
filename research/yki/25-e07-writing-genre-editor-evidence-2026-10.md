# E07 — Письмо YKI keskitaso: жанри, критеріальне оцінювання та надійний цифровий редактор

**Перевірка джерел:** 29 жовтня 2026. **Стан:** виконано аудит першоджерел і реального коду Hospodar; створено evidence ledger, isolated reference policy і 12 unit tests. **Не виконано:** інтеграція в робочий EXAM, ручне проходження Inspera, два S2-оцінювачі, реальні оригінальні повні завдання, browser E2E, емпіричне підтвердження ефективності.

**Existing owners:** [R04 — людська калібровка письма/мовлення](../pedagogy/31-r04-speaking-writing-human-calibrated-assessment-2026-10.md) (не створювати нову конкуруючу рубрику), [E03 item blueprint](21-e03-construct-task-blueprint-2026-10.md), [E04 timer state](22-e04-digital-timing-session-policy-2026-10.md), [EXAM F1–F6](../../docs/21-digital-yki-exam-simulator-executable-spec.md), [канонічні 13 сімейств](yki-official-patterns-v2.json).

**Доставлені артефакти:** [E07 машинний доказовий реєстр](e07-writing-editor-evidence-2026-10.json), [isolated pure-JS writing policy](../../app/e07-writing-evidence-policy.mjs), [12 перевірок](../../app/tests/e07-writing-evidence-policy.test.mjs). **Reference module не підключений до живого Web EXAM.**

## 1. Результат першоджерел: YKI оцінює комунікацію, не довжину тексту

[OPH / Kirjoittamisen arviointikriteerit, PDF, сторінка 2](https://www.oph.fi/sites/default/files/documents/Kirjoittamisen_arviointikriteerit.pdf) визначає **холістичне** оцінювання. Загальна оцінка виникає із сукупності критеріїв, а не арифметичної формули. Підтверджені напрями: **joustavuus** (гнучкість), **koherenssi/sidosteisuus** (зв'язність), **ilmaisun tarkkuus/laajuus/idiomaattisuus** (точність, обсяг та природність висловлювання), **rakenteiden tarkkuus** (структури); окремі описи передачі інформації, творчого письма, есе/думки.

| Аспект | Taso 3 / B1 | Taso 4 / B2 |
| --- | --- | --- |
| Змістова мета | Прості зрозумілі тексти на звичайні теми, можуть бути локальні неточності | Гнучкіші й розвиненіші приватні/напівофіційні тексти, аргументація |
| Зв'язність | Переважно логічний і послідовний текст, можливі порушення | Різноманітніші засоби зв'язку й чіткіша структура |
| Регістр/адресат | Може недостатньо розрізняти formal та informal | Краще пристосовує стиль до читача, мети й ситуації |
| Граматика і лексика | Недосконалість допустима, якщо думка зрозуміла | Точніші слова/форми, більша гнучкість, допускаються дрібні помилки |

**Невірно:** “10 помилок = менше ніж taso 3”, “80/100 за нашою схемою = офіційне YKI 4”, “мінімум 150 слів — правило OPH”. Правильне інтерпретування рівнів вимагає *каліброваних людських оцінювачів*, а не лише grammar checker.

[OPH / YKI-testin jälkeen](https://www.oph.fi/fi/koulutus-ja-tutkinnot/yki-testin-jalkeen) прямо визначає оцінювання підготовленими мовними фахівцями за критеріями та роль SOLKI у навчанні/узгодженості оцінювачів; **автоматизована видача сертифіката відбувається після оцінювання**, це не доказ машинного оцінювання письма.

## 2. Історичні зразки, не сценарій цифрового 2027

[Університетський SOLKI “Suomi keskitaso — kirjoittaminen”](https://ykitesti.solki.jyu.fi/tutustu-testiin/testifin/keskitaso-kirjoittaminen/) говорить про **три різнотипні письмові завдання** та демонструє *дві* конкретні навчальні теми: функціональний лист/email до адміністрації й opinion post. Це **історичний опис** (на сторінці є “писати чітким почерком”); не можна з цього робити висновок, що цифровий Inspera 2027 має рівно три textarea, ці самі теми, word/character limits чи навіть той самий порядок.

[OPH digitesti pilot 18.9.2026](https://www.oph.fi/fi/uutiset/2026/yki-digitestia-kokeillaan-marraskuussa-2026): комп'ютерний пілот запланований на **7.11.2026**, станом на дату E07 — майбутня подія. [OPH before test](https://www.oph.fi/fi/koulutus-ja-tutkinnot/ennen-yki-testia) містить чотири демонстрації Inspera; ручного аудиту interaction не виконано.

**E07 live digital unknown:** official 2027 task count/sequence, editor layout, keyboard layout, copy-paste, spellcheck, autocorrect, live text counter, tab navigation, autosave receipt, timer, font size, allowed aids, accessibility provisions. У [E07 JSON](e07-writing-editor-evidence-2026-10.json) ці поля **null**, exact strict profile **false**.

**Стратегія:** застосовувати **власний practice-only** текстовий редактор із явно маркованими правилами, перш ніж OPH підтвердить Inspera production 2027. Не подавати тренувальні обмеження й опції як офіційну специфікацію.

## 3. Три канонічні writing families та жанрова автентичність

Не створювати нові taxonomy IDs; використати [існуючі](yki-official-patterns-v2.json):

| ID | Жанр майбутнього оригінального завдання | Що має перевіряти |
| --- | --- | --- |
| WRITING_MESSAGE | Особисте повідомлення, домовленість, зміна планів | Для кого і навіщо; 2–4 конкретні комунікативні дії; нормальне привітання й завершення |
| WRITING_FORMAL | Лист-звернення/запит/скарга/зміна запису | Проблема, наслідок, причина, чіткий запит; ввічливий відповідний регістр |
| WRITING_OPINION | Форум, висловлення позиції, розгляд альтернатив | Думка, аргументи, приклади, логічна зв'язність і доречний тон |

**Жанрова репрезентативність:** історичний сайт дає типи зразків, але не встановлює *квоти* для цифрової екзаменаційної форми. Не копіювати самі офіційні тексти чи формулювання; сценарії повинні бути оригінальними, з підтвердженими правами, 2 незалежними S2 review.

**Контент backlog у [E07 JSON](e07-writing-editor-evidence-2026-10.json):** 5 scenario briefs — особисте перенесення зустрічі, запит про житлову послугу, ввічлива зміна часу на роботі/курсі, аргументована думка про транспорт, коротке особисте повідомлення про побутову проблему. Кожен **BRIEF_ONLY_NOT_S2_REVIEWED**, не виданий за повноцінний банк.

## 4. Реальний code audit: два власні промпти, часткова персистентність

Перевірено [app/exam.mjs](../../app/exam.mjs), [app/exam-core.mjs](../../app/exam-core.mjs), [app/attempt-storage.mjs](../../app/attempt-storage.mjs), [2 mini blueprints](../../learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json), [diagnostic baseline](../../learning/exercises/b1/diagnostics/baseline-v1.json), [internal teaching rubric](../../learning/exercises/b1/feedback-rubrics.json).

**Точний baseline:**
- Є **2 mini EXAM**, кожен має **одне writing завдання**: d-w1 — звернення щодо курсу з вимогами “рівень мови, графік, 2 питання”; d-w2 — думка про життя в центрі міста чи спокійному районі, 2 погляди та завершення. Залежність від **лише 2 промптів** не дозволяє назвати full writing module репрезентативним.
- Редактор — HTML textarea з мовою **fi**, локальний атрибут **maxlength=12000** і числовий лічильник **JS string.length**, який рахує UTF-16 code units, а не офіційні слова/символи YKI. Це **локальний технічний запобіжник**, не вимога OPH.
- Письмові requiredPoints показані в **згорнутому details**. Це можуть бути умови завдання, а не підказки, тому для UX треба перевірити, чи учень їх помічає, і не ховати обов'язкові вимоги.
- Під час input Web EXAM одразу оновлює in-memory session і ставить **250ms debounce**. Далі — queueSave у IndexedDB; при navigation/finish викликається flushDraft, а перехід показується тільки після durable commit. Це вже **частково добрий захист**.
- **Критичні незакриті сценарії:** аварійне закриття вкладки до debounce; відсутня явна IME composition state machine; UI під час time expiry покладається на 1s interval замість атомарного дедлайну E04; simultaneous tabs і остання композиція при submit потребують E2E.
- У scoreSession writing лишається **ungraded**, без фіктивного YKI pass predictor; це правильно. Internal teaching weights **30/25/15/15/15** — власна евристика, **не OPH ваги**.
- JSON export містить відповіді користувача (приватний текст); потрібні прозоре локальне збереження, видалення, відновлення й додатковий privacy audit перед будь-яким cloud/AI-аналізом.

**P0:** вимога E07 — при останній композиції тексту (включно з ä, ö, великою/малою літерою, комбінованими Unicode знаками) **перехід не можна вважати успішним**, доки останню остаточну версію не підтверджено надійним readback. Це *design contract*, не підтверджена помилка на конкретному Android пристрої.

## 5. Ізольований executable policy для safe editor/review

Новий [app/e07-writing-evidence-policy.mjs](../../app/e07-writing-evidence-policy.mjs) створений для перевірки майбутньої інтеграції, **не імпортований поточним EXAM**:

1. **Fail-closed exact mode:** офіційний “verified-live-2027” профіль відхиляється; власний practice mode має максимум 12000 characters як **application safety choice**, officialWordCount=null.
2. **inspectWritingTask:** original rights, canonical family, адресат, комунікативна мета, необхідні пункти, 2 окремі S2 reviewer IDs. Лише метадані: не доказ реальних підписів або мовної якості.
3. **inspectWritingDraftReceipt:** правильні session/task, revision, committedAt, 64 hex content hash, writeCommitted та **точна рівність видимого Unicode тексту з дійсно переданим storedText**. Протокол reference-only; не читає IndexedDB і не розраховує криптографічний SHA-256 — це має зробити майбутній runtime, не просто JSON.
4. **canTransitionWriting:** у режимі draft блокування при compositionActive або unsavedDraft; submission/review не можуть редагувати першу запечатану відповідь.
5. **canUnlockWritingReview:** жодних підказок до durable finish і final revision; заборонений параметр official grade; дозволено **тільки formative post-exam review** при перевіреному збереженні.

**Ні функція, ні 12 source unit tests не доводять інтеграцію у справжній браузер.** Немає нового автоматичного grammar checker, офіційних балів або повної цифрової форми.

## 6. Наука: навчальний feedback має вимірювати новий текст, не виправлення старого

Доказова опора вже є в [R04](../pedagogy/31-r04-speaking-writing-human-calibrated-assessment-2026-10.md), тому повторний незалежний метааналіз у E07 не проводився. Додатковий cross-check 2024–2026:

| Дослідження | Що відомо | Дія в Hospodar |
| --- | --- | --- |
| [2026 L2 AI-feedback meta; 19 eligible studies, N=11 875](https://doi.org/10.1016/j.system.2026.104018) | Загальний d=.271, високий рівень гетерогенності, engagement ефект сильніший за когнітивний; пілоти показували завищений ефект | Формувальні підказки — допомога, не автоматичний YKI grade і не гарантія підвищення рівня |
| [2026 algorithm-based feedback meta, 33 studies](https://doi.org/10.1016/j.asw.2026.101034) | Є короткострокові ефекти на поверхневі та глибокі компоненти; глибші могли зберігатися довше, перенесення в нові тексти мале | Дивитися independent novel-genre transfer day14/30, а не editing score одного тексту |
| [2024 meta, feedback across L1/L2/FL](https://doi.org/10.1016/j.learninstruc.2024.101961) | Комбінований feedback рівня content/structure і accuracy корисний у різних умовах | Meaning/task fulfilment і genre спершу; 1–3 цільові помилки, далі власний self-repair, зміна ситуації |
| [W3C UI Events](https://www.w3.org/TR/uievents/) + [WCAG 2.2](https://www.w3.org/TR/WCAG22/) | IME composition/input sequences; доступність клавіатури, status messages, часові обмеження | Технічна доступність і reliability самі по собі **не є** доказом навчального ефекту |

**Навчальний протокол:** sealed first attempt EXAM → feedback після commit → завдання на самовиправлення **без готового еталонного тексту спочатку** → порівняння тільки після власної другої версії → нова ситуація з іншим адресатом → оцінка S2 на day14/day30 unseen writing. Сильна контрольна умова — S2-редаговані матеріали однакової складності й навчального часу.

**Дві незалежні оцінки:** task success/audience/coherence/lexical/grammar оцінювати фахівцями з фінської S2, але **не змішувати** евристичні rubric weights із офіційним рівнем. Для заяви про еквівалентність YKI 3/4 потрібна узгодженість людських оцінок, репрезентативний корпус, validity study та аналіз помилок.

## 7. Precise engineering work contracts — наступні кроки після research

| Пріоритет | Контракт | Acceptance | Стан |
| --- | --- | --- | --- |
| P0-1 | Оригінальні жанри message/formal/opinion | Дві незалежні S2-оцінки кожного запитання, належний адресат, task points, законні права | NOT DONE |
| P0-2 | Persistent Unicode/IME-safe editor | Final compositionend + input, local commit, exact text readback/revision, focus status на reload, no extra edits on finish | NOT DONE |
| P0-3 | Deadline + stale write guard | E04 serverless practice high-water and transaction cutoff, tests exactly at t±1ms | NOT DONE |
| P0-4 | Meaning-first holistic feedback | Human calibrated rubrics, no auto official level, only post-finish LEARN | NOT DONE |
| P0-5 | Authorized Inspera manual verification | Confirm 2027 digital writing controls, task count, typing/copy/paste/spellcheck, actual accommodations | BLOCKED E02 |
| P1 | Accessibility/privacy | Android Finnish keyboards, screen readers, local retention/export/delete, failed IDB/2 tabs | NOT RUN |
| P1 | Scientific delayed transfer | Day14/day30 new prompt/genre/recipient, blinded S2 judges vs fair baseline | NOT RUN |

**Критерії E07-G01..G10** (10 шт.) і **ризики E07-R01..R12** збережені в [JSON](e07-writing-editor-evidence-2026-10.json). На дату звіту **0/10 release gates passed**: це **не оцінка всього Hospodar**, а стан сертифікації нового E07 функціоналу.

**Результат цієї ітерації:** sourced research + фактичний code review + precision requirements + reference policy + 12 test cases + docs linking. Немає вигаданої exact симуляції YKI 2027 або непідтвердженого “writing grade”. Наступний науковий модуль **E08 — читання**, а паралельна P0 engineering implementation — стійке збереження тексту й реальна самостійна перевірка на Android/desktop.
