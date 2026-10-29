# E04 — Таймінги, аудіопослідовності та переходи цифрового YKI 2027

**Дата:** 29.10.2026 · **Статус:** досліджено офіційні доступні джерела та поточний код; **точний цифровий таймінг 2027 НЕ ВСТАНОВЛЕНО**. Додано **ізольований, тестований еталон політики часу**, **не підключений** до робочого EXAM. Реального ручного проходження чотирьох демо Inspera поки **не було**, E2E на пристрої та досліджень з учнями також не було.

**Зв'язки:** [E01–E16 план](exam-e01-e16-research-validation-plan-2026-10.md) · [E01/E02 аудит](20-yki-official-complete-audit-2026-10.md) · [E03 завдання](21-e03-construct-task-blueprint-2026-10.md) · [канонічні UNKNOWN параметри](official-yki-deep-audit-v2.json) · [E04 машинний реєстр доказів і ризиків](e04-timing-evidence-2026-10.json) · [EXAM F1–F6](../../docs/21-digital-yki-exam-simulator-executable-spec.md) · [ізольована JS політика](../../app/e04-timing-policy.mjs) · [12 Node-тестів](../../app/tests/e04-timing-policy.test.mjs).

## 1. Що підтвердили першоджерела

1. **OPH, 18.09.2026:** фінський пілот цифрового YKI keskitaso заплановано на **7.11.2026**. На пілоті використовуватиметься **комп'ютер тестового центру**. Оголошення не встановлює тривалості чотирьох підчастин, правила плеєра, підготовки, запису та переходів. [Офіційне оголошення](https://www.oph.fi/fi/uutiset/2026/yki-digitestia-kokeillaan-marraskuussa-2026).
2. **OPH «Ennen YKI-testiä»:** офіційна сторінка дає **чотири Inspera-демонстрації** для ознайомлення із системою; відповіді в них **не оцінюють**. На тій самій сторінці досі є загальне «5 годин із перервами» та інструкції про олівець, бланки й студію. Це **змішані загальні/історичні процедурні відомості**, НЕ перевірений модульний цифровий розклад. [OPH](https://www.oph.fi/fi/koulutus-ja-tutkinnot/ennen-yki-testia).
3. **SOLKI, історичне speaking demo:** *лише в конкретному зразку розповіді* є 60 с підготовки + 90 с відповіді; у зразку *tilanteita* — підготовка 20 с та показані в прикладах короткі вікна; діалог містить послідовні репліки **20/20/10/15/20/10/10 с**. Вони не доводять тривалість майбутнього цифрового 2027. [Університетські приклади](https://ykitesti.solki.jyu.fi/en/tutustu-testiin/testifin/keskitaso-puhuminen/).
4. **SOLKI, історичне listening demo:** паперова/студійна інструкція говорить про двократне прослуховування на середньому рівні та 10 хв перенесення відповідей у бланк. Це НЕ означає, що користувач зможе двічі натиснути Play чи взагалі перемотувати в цифровому тесті. [Історична інструкція](https://ykitesti.solki.jyu.fi/tutustu-testiin/testifin/keskitaso-puheen-ymmartaminen/).
5. **Весна 2027:** OPH підтверджує цифровий формат фінської та оприлюднює дати, але календар не є специфікацією таймерів. [Офіційний календар](https://www.oph.fi/en/education-and-qualifications/selecting-right-yki-test-test-days).

**Висновок E04:** немає підстав встановлювати «офіційний YKI 2027 = 60/90 с» або «аудіо рівно двічі». Усі 15 канонічних digital UNKNOWN, зокрема module_order, module_durations_seconds, listening_replays, back_navigation, automatic_audio_start, speaking_beeps, writing_autosave, breaks_and_locking, залишаються невизначеними. **F4 Timing / F5 Interaction strict mode = BLOCKED.**

## 2. Аудит справжнього коду Hospodar, а не тільки архітектурного ТЗ

Код оглянуто 29.10.2026: [app/exam-core.mjs](../../app/exam-core.mjs), [app/exam.mjs](../../app/exam.mjs), [app/attempt-storage.mjs](../../app/attempt-storage.mjs). Це **статичний огляд**, не діагностика браузером.

| Елемент | Що реально є зараз | Проблема для достовірної практики |
| --- | --- | --- |
| Практичні ліміти | 0, 15, 30, 60 хв (користувач вибирає явно) | **Коректно марковані неофіційними**; не перевірені для цифрового YKI |
| Відлік | \`remainingSeconds\`: початок із ISO + обрані хвилини, порівняння із \`Date\`, округлення вгору | Зміна системного часу назад/уперед може спотворити час; відсутній monotonic/high-water |
| Вичерпання часу | \`window.setInterval(clock,1000)\` викликає \`conclude()\` при 0; після reload є boot-перевірка | У прихованій вкладці інтервал може затримуватися; **немає перевірки дедлайну всередині кожного writeAnswer/goToIndex/finishSession** |
| Збереження | Черга IndexedDB із підтвердженням переходів перед показом результату | Є корисний atomic-save принцип, але в race «останній input → debounce → expiry» потрібні чіткі гарантії |
| Слухання | HTML \`audio controls\` | Repeat/seek доступні як **practice UX**, невідомо, чи відповідають OPH 2027 |
| Говоріння | \`MediaRecorder\` + тимчасовий \`ObjectURL\`; стоп при переході | Голосове аудіо втрачається при перезавантаженні та не є доказом для каліброваного speaking |
| Навігація | Кнопки «назад/далі» активні | Practice-only, офіційні правила 2027 невідомі |
| Результати | \`scoreSession\` після \`finishedAt\`, продуктивні навички ungraded | Немає офіційного YKI 3/4, і це правильно |

**Новий головний P0:** звичайний візуальний таймер не повинен бути єдиним охоронцем дедлайну. У майбутньому живому коді **кожна** подія відповіді, переходу чи запису має перевіряти своє допустиме часовe вікно до durable commit. Якщо інтервал не виконався після спливу часу, це не дозволяє додаткові секунди. **Цей P0 поки НЕ виправлено у live EXAM**.

## 3. Еталонний контракт часу — що побудовано в цій ітерації

Додано **[app/e04-timing-policy.mjs](../../app/e04-timing-policy.mjs)** як чистий, *не підключений до UI* reference module. Він потрібен для обговорення та перевірки алгоритму, а не для заяви про готовність іспиту.

- **Fail closed:** \`createTimingProfile({kind:"verified-live-2027"})\` завжди відхиляється, доки перші джерела не підтверджують real production.
- **Practice-only:** допускаються 0/15/30/60 хв, позначені як наша практика.
- **Відлік:** використовується максимальний уже спостережений час між локальним wall clock, monotonic elapsed від старту та high-watermark. Зворотна зміна годинника не відновлює вже втрачений час при наявному високому watermark. При розбіжності годинників видається \`CLOCK_ANOMALY_PRACTICE_ONLY\`, не «офіційно точний час».
- **Дедлайн:** pure gate відхиляє звичайну відповідь/навігацію, якщо час минув. Операція відкриття результатів потребує \`finishCommitted=true\`; «завершено» не виводиться тільки тому, що інтервал дійшов до нуля.
- **Межа довіри:** при відсутності server-backed trusted clock і в умовах offline не можна гарантувати захист від навмисної зміни системного часу. Зберігання high-watermark — метод уникнути випадкового подовження часу, не криптографічний захист.

**Чим еталон не є:** не запобігає зміні робочого EXAM прямо зараз; не встановлює модульні таймінги 2027; не створює фазу «підготовка/мовлення»; не перевіряє браузерне відновлення. Для будь-яких суворих часових заяв потрібна інтеграція в транзакційну модель та справжні browser E2E.

## 4. Інженерні фази EXAM і critical timing events (пропозиція, НЕ чинне OPH правило)

Майбутня **конфігурована** машина станів:

\`READY → MODULE_START → INSTRUCTIONS → TASK_PREP (where verified) → AUDIO_OR_STIMULUS → RESPONSE_WINDOW → TASK_SUBMIT → NEXT_TASK → MODULE_COMPLETE → SESSION_COMPLETE → REVIEW_UNLOCK\`.

**Обов'язкові інваріанти реалізації**, незалежно від того, які офіційні секунди будуть оприлюднені:

1. \`ANSWER_ACCEPTED\` фіксує \`task_id\`, \`first_attempt_hash\`, \`observed_deadline_evidence\`, \`content_version\`, \`session_revision\` та час; захищає immutability першої спроби.
2. \`DEADLINE_REACHED\` має один ідентифікатор, повторні сигнали таймера і подій після відновлення **ідемпотентні**.
3. У будь-якій часовій точці \`t>=deadline\` *нові* \`ANSWER/NAVIGATE\` відхиляються до DB commit, навіть якщо UI таймер ще показує останню секунду.
4. Обробка черги редагування тексту, \`compositionend\`, дебаунсу, \`visibilitychange\` і пізніх мережевих/браузерних подій має визначений порядок; час події та час durable commit зберігаються окремо, без «дописування» після дедлайну.
5. Якщо \`MediaRecorder\` дав zero bytes або браузер перервав запис, це \`NO_AUDIO_EVIDENCE\`, а не \`SPEAKING_COMPLETE\`.
6. На \`expired\` і \`manual finish\` **тільки перевірений durable finish receipt** дозволяє \`REVIEW_UNLOCK\`; збій DB блокує результати й показує контрольоване відновлення.
7. Пауза, дозволена офіційним тестом, модульні перерви, audio repeat/seek і Back мають **версійні, першоджерельно підтверджені policy fields**; до того вони practice-only.
8. **Жодних підказок та ключів у діючій сесії.** Перенесення до LEARN відбувається після confirmed finish, під час іншого процесу.

## 5. Risk register — 10 конкретних проблем

Детальні машинні записи: [E04 JSON](e04-timing-evidence-2026-10.json).

| Пріоритет | ID | Практичний ризик | Прийняття рішення |
| --- | --- | --- | --- |
| P0 | R01 | Стрибок системного часу | monotonic + persisted high-water, explicit anomaly |
| P0 | R02 | Пізній \`setInterval\`; post-deadline answer | deadline guard at each transaction |
| P0 | R03 | Показ ключів після невизначеного завершення | idempotent durable finish receipt |
| P0 | R04 | Втрата запису голосу | persistent consented audio evidence або UNGRADED |
| P0 | R05 | Невідомі правила OPH 2027 | strict exact profile OFF; no historical defaults |
| P1 | R06 | Неконтрольовані replay/seek | конфігураційна політика тільки після підтвердження |
| P1 | R07 | IME, debounce і гонки запису | deterministic boundary event tests |
| P1 | R08 | Sleep, tab pause, reload, DST | lifecycle+clock anomaly tests |
| P1 | R09 | Непідтверджені speaking prep/answer phases | source-linked per-task phase engine |
| P1 | R10 | Offline clock не є екзаменаційним таймсервером | не рекламувати proctor-grade certification |

## 6. Acceptance tests і реальні дослідні питання

**Додано 12 Node unit-тестів reference policy:**
- 0 хв без таймера; дозволені/заборонені профілі;
- \`deadline-1ms\`, \`deadline\`, \`deadline+1ms\`; затриманий interval;
- rollback/forward системного часу, monotonic elapsed та durable high-water;
- невірний стан часу; недозволена навігація/відповідь після дедлайну;
- відсутній durable finish receipt ⇒ не показувати результати;
- контроль, що це *reference* модуль, якого поки не імпортує active UI.

**Не виконані, але обов'язкові real-browser/physical tests:** background throttling 1–10 хв, manual wall-clock manipulation, DST/timezone switch, reload між \`compositionend\` і IndexedDB ack, збій commit у останню секунду, одночасні дві вкладки, запис із мікрофона до/під час/після expiry, screen reader timer announcement і focus recovery. Тести мають бути виконані на Chromium і принаймні ще одному браузері; Android — після реального APK/AAB.

**Розмовна частина (найскладніша):** як саме запускається audio stimulus, який \`recording_start\` після звукового сигналу, чим закінчується \`prep\`, чи можна повернутися до репліки, що робить система при відсутності мікрофона? **Кожна відповідь поки UNKNOWN до E02 authorized manual Inspera observation + first-party OPH relevance confirmation.**

## 7. Порядок наступної реалізації та межа доведеного

| Sprint contract | DoD / необхідний доказ | Стан |
| --- | --- | --- |
| E04-C1 | Підключити чисті часові інваріанти до \`app/exam.mjs\` та atomic IndexedDB state transitions, зафіксувати cutoffs | **NOT DONE** |
| E04-C2 | Відтворити sleep/reload/clock skew, concurrency та \`t±1ms\` у реальному браузері | **NOT RUN** |
| E04-C3 | Зберігати recorded voice та обробляти permission/zero bytes без фальшивого speaking success | **NOT DONE** |
| E04-C4 | Провести ручний Inspera аудит F4/F5 для 4 skills, запросити підтвердження OPH/пілотних матеріалів | **NOT DONE** |
| E04-C5 | Налаштувати **тільки підтверджені** цифрові speaking/listening navigation+timing parameters і E2E | **BLOCKED на OPH confirmation** |

**Оцінка важливості E04:** **99/100 (експертна пріоритетність), НЕ оцінка якості нашого продукту.** Деякі ризики (пізні відповіді, втрата голосу) можна й треба виправляти, не очікуючи пілоту. Натомість конкретні «офіційні» секунди, повтори й навігацію не можна встановлювати без джерел.

**Результат цієї ітерації:** датований доказовий аудит + десять P0/P1 ризиків + ізольований fail-closed контракт + 12 unit tests. Реальний EXAM ще не використовує цей контракт. **Strict 2027 digital exact залишено вимкненим.**
