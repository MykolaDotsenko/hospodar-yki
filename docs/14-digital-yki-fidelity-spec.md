# 14 — Специфікація достовірної симуляції YKI keskitaso / Digitesti 2027

**Дата вивчення першоджерел:** 21.10.2026. **Стан:** reference-driven training simulator, **not official 2027 digital UI**.  
**Пов'язано:** [13 — приклади](../research/yki/13-yki-exam-format-and-real-examples-2027.md) · [33 доказові твердження (JSON)](../research/yki/yki-digital-fidelity-evidence-2026-10.json) · [дві міні-сесії](../learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json) · [вебтренажер](../app/exam.html).

## Обов'язкові сценарії симуляції: Full YKI і кожен модуль окремо

**Нова продуктова вимога (P0):** [два режими та повна матриця навичок](15-two-modes-skill-scopes.md), JSON-контракт: [product-session-modes-v1.json](../research/user-cases/product-session-modes-v1.json).

- **EXAM-FULL:** повна самостійна симуляція всіх 4 модулів у підтвердженій OPH структурі, з незалежними результатами та відкладеним feedback. **У поточному застосунку є лише коротка 9-item репетиція**, не повний іспит.
- **EXAM-READING / EXAM-LISTENING / EXAM-WRITING / EXAM-SPEAKING:** **кожна частина запускається й завершується окремо**, із завданнями лише відповідної навички, власною історією та результатом. Для speaking/writing без каліброваної людської перевірки `ungraded`.
- **EXAM-COMBO:** довільні тренувальні комбінації явно називати `practice subset`; симуляції підтверджених `osakoepäivät` обмежити модулями, дозволеними OPH **на конкретну дату**; не обіцяти місця/реєстрацію.
- **NO RANDOM EXAM ORDER:** режим `adaptive mixed all` існує в **Навчанні**, а не як вигаданий порядок офіційного іспиту.
- **TIMER/AUDIO/UI fidelity:** позначки `officially_verified` та first-party source per parameter; режим `practice` до підтвердження цифрових правил.
- **ASSESSMENT:** 4 незалежні стовпчики результатів для повного іспиту; для окремої спроби — рівно 1 стовпчик, без недостовірного «загального балу».

Це **цільовий функціонал і критерії реалізації**, а не твердження, що всі перелічені варіанти вже реалізовані.

## A. Рівні достовірності

1. **Чинні офіційні факти:** 4 незалежні модулі, цифровий тест у testipaikka (не вдома), всі фінські навесні 2027 digital; кваліфіковане критерійне оцінювання без єдиного підсумкового бала. Джерела: [OPH календар](https://www.oph.fi/fi/koulutus-ja-tutkinnot/sopivan-yki-testin-valinta-ja-testipaivat), [OPH digitesti pilot 18.09.2026](https://www.oph.fi/fi/uutiset/2026/yki-digitestia-kokeillaan-marraskuussa-2026), [OPH оцінювання](https://www.oph.fi/fi/koulutus-ja-tutkinnot/yki-testin-jalkeen).
2. **Офіційні архівні зразки типів:** SOLKI: [читання](https://ykitesti.solki.jyu.fi/tutustu-testiin/testifin/keskitaso-tekstin-ymmartaminen/), [аудіювання](https://ykitesti.solki.jyu.fi/tutustu-testiin/testifin/keskitaso-puheen-ymmartaminen/), [говоріння](https://ykitesti.solki.jyu.fi/tutustu-testiin/testifin/keskitaso-puhuminen/), [письмо](https://ykitesti2.solki.jyu.fi/ykitesti2/web/en/node/21). Вони відтворюють мовну діяльність, але частково містять **паперові інструкції, які в цифровій системі можуть змінитися**.
3. **Окремі історичні приклади часу:** монолог 60 секунд підготовки + 90 секунд говоріння; у симульованих розмовах репліки 10–25 секунд; старий listening — зазвичай двічі, іноді повністю + частинами. Це лише **факти про конкретні SOLKI демо**, а не гарантована конфігурація цифрового тесту 2027.
4. **Невідомі цифрові параметри:** конкретна послідовність 4 модулів, ліміти і паузи, кнопки Next/Back, можливість перевіряти чи змінювати відповідь, кількість прослуховувань, система звукозапису, індикація часу, повне екранне оформлення, автозбереження. Кожен має `unverified_2027` у JSON.

### Принцип продукту

**Реалістичність = валідна комунікативна діяльність + чесно задокументований UX.** Не прикрашати дизайн фейковою печаткою OPH і не змушувати користувача вірити, що training session — повний офіційний тест.

## B. Матриця того, що симулювати

| Навичка | Із першоджерела | Training implementation | Питання до OPH після пілоту |
|---|---|---|---|
| Читання | новина, лист, оголошення, рекламний текст; MCQ / oikein-väärin / open | різні жанри, 2–4 питання на текст, gist/detail/inference; фокус клавіатури; ключ після завершення | точний вигляд статті/питання, pagination, editing, duration |
| Аудіювання | короткі повідомлення, інтерв'ю, телефон, діалоги; запитання MCQ / O-V / open | окремий аудіоплеєр, transcript hidden до спроби, B1 2–3 хв; якщо диктор синтетичний — явна позначка | autoplay, повтори, seek/pause, час на читання запитань |
| Письмо | **три** різнотипні guided tasks у SOLKI; формальний email, думка, інші жанри | планувати 3 типи у повному mock; вимоги і контроль task completion; autocache чернетки | текстовий редактор, undo, word count, 3-task timing |
| Говоріння | монолог, audio-roleplay/dialogues, situational reactions; запис для оцінювачів | запит дозволу на mic, rehearsal prep/respond phase, evidence recording, self-check / human grading | чи є audio prompts, дозволені повтори й точні response gates |
| Весь день | ~5 год із перервами у загальній інструкції OPH | навчальний `micro`-mock на 9 завдань; довшу симуляцію будувати після калібрування й OPH уточнення | точний digital-2027 schedule |

## C. Реальні демонстрації SOLKI — приклади, без незаконного копіювання

**Аудіо** ([офіційна сторінка](https://ykitesti.solki.jyu.fi/tutustu-testiin/testifin/keskitaso-puheen-ymmartaminen/)):
- Інтерв'ю з вибором A/B/C, [MP3](https://ykitesti.solki.jyu.fi/wp-content/uploads/2016/06/suktpy083.mp3).
- Тема подорожей й екології, oikein/väärin, [MP3](https://ykitesti.solki.jyu.fi/wp-content/uploads/2016/06/suktpy069.mp3).
- Коротка реклама туристичної поїздки, відкриті відповіді, [MP3](https://ykitesti.solki.jyu.fi/wp-content/uploads/2016/06/Keskitaso_avoimet_kysymykset_2-1.mp3).
- [13 SOLKI MP3 URL (11 listening + 2 speaking) уже індексовані тут](../sources/audio/recording-sources.json); це **не** локальні мультимедійні файли й ліцензія на редистрибуцію не підтверджена.

**Говоріння** ([офіційні демо](https://ykitesti.solki.jyu.fi/tutustu-testiin/testifin/keskitaso-puhuminen/)):
- `kertominen`: 1 хв на підготовку + 1,5 хв відповіді у конкретному старому прикладі; говорити по суті весь час.
- `keskustelu`: умовна розмова телефоном, репліки співрозмовника звучать із запису, відповіді 10–25 с для різних turn.
- `tilanteita`: реакція на короткий практичний сценарій, з обмеженим часом на відповідь.

**Письмо** ([демо JYU](https://ykitesti2.solki.jyu.fi/ykitesti2/web/en/node/21)): e-mail керуючому будинку з деталями про ремонт і ввічливим проханням; аргументована думка на обрану тему. Не використовувати дослівні іспитові завдання як комерційний контент без прав.

**Читання** ([демо JYU](https://ykitesti.solki.jyu.fi/tutustu-testiin/testifin/keskitaso-tekstin-ymmartaminen/)): про користь гри у тварин і дорослих, а також питання до соціально-побутових повідомлень і текстів; відповіді формату A/B/C, O/V та open. Змістові висновки, не механічне word matching.

## D. Оцінювання taso 3 vs 4 — критично для прогресу

**Офіційні людські критерії** (не копіювати PDF до репозиторію без перевірки ліцензії):
- [Kirjoittamisen arviointikriteerit (JYU)](https://www.jyu.fi/fi/file-download/download/public/14097), **сторінка 2**: `taso 3` — загалом зв'язний, зрозумілий, простий текст про звичну тему, інколи незграбний і з помилками; структура, достатній побутовий словник, здатність розповісти й коротко обґрунтувати; `taso 4` — ширша аргументація, більше деталей, доречніший регістр.
- [Puhumisen arviointikriteerit (JYU)](https://www.jyu.fi/fi/file-download/download/public/14098), **сторінка 2**: `taso 3` — справляється зі звичними ситуаціями, зрозумілий навіть із паузами та помилками, має достатній словник побутових тем, може ініціювати діалог; `taso 4` — дещо вільніший і гнучкіший, краща зв'язність, регістр, граматика, вимова.

Кодова політика: `objective_correct/total` **тільки** для ключованих MCQ/O-V; free/open, writing, speaking -> `ungraded`; не конвертувати кількість правильних у `YKI 3`, B1 або «шанс скласти». Впроваджувати feedback за кожним параметром критеріїв окремо після створення human anchor corpus; розділяти зміст, зв'язність, граматику, лексику, вимову, стиль. Тільки людина або незалежно validated assessor може підтвердити продуктивний рівень.

## E. Реалізовано цією ітерацією

**[app/exam.html](../app/exam.html)** — окрема комп'ютерна репетиція:

- 2 незалежні оригінальні набори з `learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json` (кожен **9 завдань**: reading 3, listening 4, writing 1, speaking 1).
- Реалізовані **MCQ, O/V, open short, письмова відповідь, усна відповідь за бажанням**. Усі дані беруться з уже наявного `learning/exercises/b1`, не дублюються й не беруться з захищених SOLKI тестів.
- Навігація між завданнями (практичне UI-рішення, не офіційна специфікація); автоматичне локальне збереження відповідей, відновлення при повторному відкритті сторінки.
- **Opt-in** 15/30/60 хв — добровільні особисті ліміти, не офіційні; завершення при вичерпанні. Перший запуск за замовчуванням без таймера.
- Ключі й фідбек приховані до завершення **всієї** сесії; після — 4 окремі картки навичок з objective accuracy та чесними `ungraded`.
- Browser microphone permission only on user click; голос лише Blob/URL в пам'яті, **не** зберігається в localStorage чи на сервері. Якщо сторінку перезавантажити, усний доказ губиться і треба записати знову; текстовий fallback доступний.
- JSON export містить тільки збережені відповіді й об'єктивні навчальні результати, не аудіофайли.
- Чистий static hosting: `python3 -m http.server 8080` → `http://localhost:8080/app/exam.html`; `node --test app/tests/*.test.mjs`.

### Невиконані production gates (у пріоритетному порядку)

1. **P0 Real dialogue pack:** ≥12 сучасних записаних дво-/багатоголосих B1/B1+ діалогів, дозволені права, independent transcript proofing + VTT alignment, різні побутові ситуації, природна фінська, якісні gist/detail/inference questions.
2. **P0 Full-length content:** щонайменше **3 writing tasks** у повній симуляції і ширший speaking bank (монолог/діалог/situations), розподіл складності за S2-рецензуванням; багатотекстове reading і багатосюжетне listening; невідомий content для repeat.
3. **P0 Verify digitesti UI:** перевірити OPH постпілотне повідомлення **після 07/14.11.2026**, уточнити точну кількість/тривалість блоків, аудіо replay, порядок, контролі, екзаменаційний час. Записати `confirmed_by_source` для кожного параметра окремо.
4. **P1 Scoring:** людські anchor recordings/texts з анонімізацією й правами, міжекспертна узгодженість; суворе розділення task completion / linguistics / pronunciation і невизначеності.
5. **P1 Product QA:** Playwright mobile+desktop E2E, Safari/iOS media capabilities, voice lifecycle/privacy, keyboard labels, network failures and offline behavior, save partial during tab crash, real-user usability session, S2 language QA.

### Висновок

**Не можна чесно назвати нинішні 9 завдань «точною повною копією цифрового YKI 2027»**. Зате це справжня відтворювана, source-linked, конфіденційна **навчальна репетиція**, структурована за чотирма навичками, яку можна розвинути до повного каліброваного mock після OPH digital-2027 UX уточнень.

## Офіційний комплексний аудит v2 (21.10.2026) — канонічне доповнення

**Вивчено:** [20 — норма/правила/SOLKI зразки/рубрики](../research/yki/20-yki-official-complete-audit-2026-10.md); **нове інженерне ТЗ:** [21 — шість fidelity axes, state machine, 20 тести](21-digital-yki-exam-simulator-executable-spec.md); **40 source-linked claims і 15 невідомих**: [research/yki/official-yki-deep-audit-v2.json](../research/yki/official-yki-deep-audit-v2.json); **13 families × 12 demo specimens**: [research/yki/yki-official-patterns-v2.json](../research/yki/yki-official-patterns-v2.json).

**Важливе уточнення:** OPH сторінка підписує PDF як `perusteet 2026`, але пряме посилання фактично веде до наказу **30.11.2011**; підтвердження — Finlex. Усі paper-sheet/legacy timers з SOLKI є **лише historical samples**; заборонено вважати їх точними правилами computer-based 2027. Actual `official_2027_exact` = **false** до OPH/JYU post-pilot підтвердження.

**Acceptance:** реалізовувати `strict_verified` тільки після source-backed modules, durations, player, mic, writing UI, result validation; якщо `null` — training-only. Для письменного/усного YKI 3/4 потрібна людська калібровка. Нині 9-item мінірепетиція, не full mock.
