# E06 — Говоріння YKI 2027: перевірка реальної комунікації, надійний запис і навчальний feedback

**29.10.2026. Статус:** першоджерела, наукові дослідження та справжній код Web EXAM перевірені; підготовлено **reference-only** контракт перевірки аудіозапису. **НЕ зроблено:** людське S2-рецензування, запис нових фінських співрозмовників, інтеграція збереження аудіо в робочому EXAM, ручний огляд Inspera, реальні браузерні E2E та дослідження учнів.

**Документ не дублює [R04 дослідження людського оцінювання](../pedagogy/31-r04-speaking-writing-human-calibrated-assessment-2026-10.md).** Це E06 operational audit of speaking construct + capture reliability. Зв'язки: [E01–E16 programme](exam-e01-e16-research-validation-plan-2026-10.md), [E03](21-e03-construct-task-blueprint-2026-10.md), [E04](22-e04-digital-timing-session-policy-2026-10.md), [canonical 13 families](yki-official-patterns-v2.json), [EXAM engineering spec](../../docs/21-digital-yki-exam-simulator-executable-spec.md).

**Артефакти:** [machine-readable source and runtime ledger](e06-speaking-evidence-audit-2026-10.json), [isolated JS evidence reference](../../app/e06-speaking-evidence-policy.mjs), [automated Node contract tests](../../app/tests/e06-speaking-evidence-policy.test.mjs).

## 1. Мета та чотири історично підтверджені типи speaking

Мета — щоб користувач не просто відтворив завчений монолог, а виконав **ситуативну мовленнєву дію** фінською, зберіг її в цілісному аудіо, отримав перевірюваний зворотний зв'язок після іспиту й переніс знання до нової ситуації.

[Офіційні університетські приклади SOLKI для середнього рівня](https://ykitesti.solki.jyu.fi/en/tutustu-testiin/testifin/keskitaso-puhuminen/) та [загальний опис тесту Jyväskylän yliopisto](https://www.jyu.fi/fi/hytk/solki/tutkimus/yleiset-kielitutkinnot-yki) підтверджують чотири historical construct families. Використовуємо канонічні ID, НЕ створюємо паралельну таксономію:

| Canonical ID | Форма | Комунікативна вимога |
| --- | --- | --- |
| SPEAKING_NARRATIVE | Kertominen, розповідь | Зв'язно описати події, причини/наслідки, уточнити деталі |
| SPEAKING_DIALOGUE | Keskustelu, діалог | Реагувати на **реально озвучені репліки іншого мовця**, просити уточнення, домовлятися |
| SPEAKING_SITUATIONS | Tilanteita, ситуації | Ввічливо попросити, відповісти, пояснити проблему, відмовити, вибачитись |
| SPEAKING_OPINION | Mielipide, думка | Обґрунтувати позицію, навести приклади, логічно пов'язати аргументи |

**Важливе обмеження:** старі приклади описують студію, магнітофонні сигнали, окремі вікна (наприклад, підготовка 60 с і розповідь 90 с в одному конкретному зразку). Це **НЕ доводить** цифрові таймери, сигнали й роботу мікрофона в Inspera 2027. [OPH оголосив цифровий фінський пілот на 7.11.2026](https://www.oph.fi/fi/uutiset/2026/yki-digitestia-kokeillaan-marraskuussa-2026); на дату E06 він ще попереду. Реальний software profile 2027 — UNKNOWN, exact mode OFF.

## 2. Рубрика YKI — що потрібно вимірювати

[OPH: як відбувається оцінювання](https://www.oph.fi/fi/koulutus-ja-tutkinnot/yki-testin-jalkeen) — мову оцінюють підготовлені спеціалісти, SOLKI підтримує узгодженість оцінок, кожна навичка має окремий результат. [Офіційна таблиця критеріїв говоріння, PDF сторінка 2](https://www.jyu.fi/fi/file-download/download/public/14098):

- **Taso 3 / B1**: загалом зрозуміле виконання звичайних побутових і комунікативних ситуацій; паузи, помилки й іншомовний акцент допускаються, поки зміст зрозумілий адресатові.
- **Taso 4 / B2**: гнучкіша комунікація та регістр, аргументація, ширша/точніша лексика, відносна плавність, краще пов'язування думок у менш знайомих ситуаціях.
- Виміри: **sujuvuus, joustavuus, koherenssi/sidosteisuus, ilmaisun tarkkuus/laajuus/idiomaattisuus, ääntäminen/fonologinen hallinta, rakenteiden tarkkuus**. OPH оцінює **цілісний рівень**, а не арифметичну суму помилок і пауз.

**Отже:** якщо людина зрозуміло вирішила питання телефоном, окремі помилки у відмінках не повинні автоматично нівелювати комунікативний результат. Інтерпретація B1/B2 потребує **людської калібровки** — два незалежні Finnish S2 raters, документування розбіжностей і adjudication, blind review нових завдань. Наявні внутрішні [teaching weights](../../learning/exercises/b1/feedback-rubrics.json) — навчальна евристика, не формула OPH.

## 3. Докази щодо ASR та AI-feedback: корисно, але не офіційно

| Робота | Результат | Обмеження / Hospodar рішення |
| --- | --- | --- |
| [Wang & Min 2026, 67 studies / 392 effects](https://doi.org/10.1177/02655322251387816) | Загальний human-machine correlation r=.654, відмінності між delivery/fluency/pronunciation/content | Кореляція **не є** agreement на порозі YKI 3/4; автоматичний grade заборонений |
| [ASR meta on ESL/EFL pronunciation, 15 studies](https://www.cambridge.org/core/journals/recall/article/effectiveness-of-automatic-speech-recognition-in-eslefl-pronunciation-a-metaanalysis/A915444CF252B61D14961D2FE733822D) | Вказує на користь вимовної практики з правильним feedback (g=.69 в аналізі) | Англійська й фонетична accuracy ≠ фінська комунікативна успішність або YKI grade |
| [Inclusive ASR 2024](https://doi.org/10.1016/j.csl.2023.101567) | Мовні системи ASR можуть мати зміщення за акцентом, віком і регіоном | Не карати за «невпізнаний ASR» звук, fairness і людський контроль |
| [Nelson/Cardoso 2025, English L2 1000 responses](https://doi.org/10.37213/cjal.2025.35706) | Зафіксовано вікові відмінності точності кількох диктувальних ASR | Не переносити величини на фінську, провести власний bias audit |
| [Hilden et al 2025, Finnish/Swedish L2 prototype](https://doi.org/10.58379/ROXO3257) | Вивчаються обмежені акустичні сигнали оцінювання нерідного мовлення | Калібрувати для фінської й конкретного завдання, не продавати «AI = екзаменатор» |

**Рішення:** під час EXAM не показувати ASR transcript чи live correction. Після завершення, за бажанням, модель може пропонувати **неофіційні, перевірені на прикладах, uncertainty-labeled підказки**, а не сертифікований рівень. Результати гетерогенних або частково перекриваних meta не складаємо у фіктивний відсоток покращення.

## 4. Перевірений аудит live EXAM — P0 дефекти

Статично перевірені [app/exam.mjs](../../app/exam.mjs), [app/exam-core.mjs](../../app/exam-core.mjs), [app/attempt-storage.mjs](../../app/attempt-storage.mjs) та [2 mini blueprints](../../learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json).

1. **Охоплення:** дві мінісимуляції мають **по одному** speaking: d-s1 — коротка ситуація; d-s2 — думка. Окремих повноцінних багатокрокових діалогів з аудіорепліками та тривалих розповідей **немає**.
2. **Запис:** браузер отримує дозвіл через getUserMedia, записує MediaRecorder chunks, створює Blob ObjectURL лише в пам'яті. **Не записує Blob у IndexedDB**.
3. **Перехід/кінець:** stopAudio() зупиняє MediaRecorder і перед цим обнуляє onstop, тож обробка фінальних chunks може не відбутися. Є реальний ризик втрати єдиної усної відповіді.
4. **Відновлення:** loadSession() навмисно скидає voiceRecorded після перезавантаження: маркер не вважається стійким аудіодоказом. Це запобігає фальшивому підтвердженню, але не рятує звук.
5. **Текст:** користувач може ввести усний план; він **не має** зараховуватися як успішний speaking evidence.
6. **Завершення:** snapshot та факт завершення мають чергу локальних транзакцій, проте немає атомарного протоколу збереження аудіобайтів і підтвердження checksum для оцінювання.
7. **Privacy/consent та audio QA:** відсутній окремий процес згоди/видалення/експорту довговічного голосового файлу, немає тестування відсутності звуку, кодеків чи міків у різних браузерах.

**Окремий P0 для найближчого кодового PR:** серіалізувати stop → final dataavailable/stop → nonempty Blob → persist → readback/hash → audio receipt → finish → results. Ніяке натискання «Записати» чи наявність ObjectURL не доводить мовлення. В поточній E06 ітерації **це ще не виправлено в живому UI**.

## 5. Reference-only контракт: fail-closed speaking evidence

Додано [app/e06-speaking-evidence-policy.mjs](../../app/e06-speaking-evidence-policy.mjs) — **ізольований модуль, не імпортований активним EXAM**. Він демонструє безпечні інваріанти, а не реалізує сховище.

- Practice policy приймає лише явно тренувальні (неофіційні) фази; тривалості можуть бути UNKNOWN і не підміняються архівними 60/90 секундами.
- Receipt вимагає session/task, локального durable key, SHA-256, обсягу >0 байт, додатної тривалості, MIME, revision, явної згоди та блокування першої спроби.
- Існування одних тільки полів receipt не достатнє: **фактично прочитані байти та їхній незалежно перевірений SHA-256** потрібні для статусу REVIEWABLE_AUDIO_UNGRADED.
- Фідбек заборонено до durable finish. Навіть за ідеально перевіреного запису grade 3/4 залишається null до незалежної S2-калібровки.
- Прапорці storedBytesVerified і storedHashVerified в unit-фікстурах — **стенд**, а не доказ виконаного storage. Лише runtime-інтеграція може ставити їх на основі реального зчитування.

Усе це — Hospodar design safety gates, не параметри офіційного software YKI.

## 6. Пропонована state machine для практики (не правила 2027)

MIC_PREFLIGHT → READY → PREP (optional) → STIMULUS → RECORDING → STOP_REQUESTED → FINALIZING_BLOB → PERSISTING_BYTES → READBACK_VERIFY → SEALED_AUDIO_RECEIPT → EXAM_FINISH_COMMIT → RESULTS_UNLOCK → LEARN_REVIEW.

**Інваріанти:** idempotent stop/submit; нульові/перервані записи НЕ позначати виконаними; не переходити й не відкривати результати під час finalization; повторне відкриття сторінки зберігає вже отримані байти або чесно повідомляє про втрату; не дозволяти підказок і ключів під час sealed EXAM.

**Privacy:** голосовий файл є персональними даними. Потрібні прозора мета обробки, права на видалення/експорт, контроль терміну зберігання й заборона прихованого upload до ASR/хмари. Сам звук не є автоматично спеціальною біометричною категорією GDPR: юридична класифікація залежить від способу й мети обробки; cloud-архітектура вимагає окремої перевірки.

**Реальний browser QA, ще не виконаний:** denied mic, revoked permission mid-recording, 0 bytes, codec invalid/unsupported, laptop vs cheap phone mic, тихий звук, clipping, background tab, double click stop, reload before/on storage ack, two-tab concurrency, deadline exactly while onstop, corrupted blob, full storage/quota, consent withdrawal and deletion, accessibility/focus.

## 7. Чотири оригінальні scenario briefs (не готові tasks)

В [E06 JSON](e06-speaking-evidence-audit-2026-10.json) описані постановки для **S2-авторів**, а не скопійовані SOLKI задачі:

| Патерн | Напрям нового сюжету | Пріоритетне мовне вміння |
| --- | --- | --- |
| Situations | Побутове звернення щодо ремонтного візиту | ввічливе пояснення, чітке прохання |
| Dialogue | Телефонна зміна часу домовленості, аудіорепліки співрозмовника | почути й доречно відреагувати, уточнити |
| Narrative | Опис проблеми, як вона виникла і що змінилося | зв'язність, наслідки та зрозуміла історія |
| Opinion | Порівняння повсякденних послуг, аргументи | позиція, обґрунтування й приклад |

Для кожного — незалежний human S2 review, оригінальний контент, дозволене аудіо співрозмовника, first-attempt sealed, подальший незнайомий transfer. Не вигадуємо офіційні кількості tasks або час 2027.

## 8. Як EXAM допомагає вчитися без невалідного результату

**EXAM:** тільки нове комунікативне завдання й незмінний перший аудіозапис, без підказок і транскрипту. **RESULT:** підтвердження наявності bytes; human review можлива лише після sealed finish; speaking ungraded до калібровки.

**LEARN:** пояснити чи досягнута комунікативна мета, підсвітити 1–3 перевірені помилки за змістом, зв'язністю, регістром або фонетичною зрозумілістю; попросити користувача **самому переформулювати**, а не просто повторити готовий розв'язок.

**TRANSFER day14/day30:** інший голос співрозмовника/нова ситуація/той самий навик. Порівняльний дизайн з якісним часово еквівалентним навчанням і blind S2 scoring. Метрика — **комунікативна зрозумілість і успіх у новій ситуації**, не ASR transcription WER або тривалість запису. Жодних реально проведених людських досліджень у цьому PR немає.

## 9. Release gates і точний engineering backlog

У машинному [E06 source ledger](e06-speaking-evidence-audit-2026-10.json): **12 ризиків і 9 gates**, усі відкриті/blocked. Найближчі кроки:

| Work contract | Acceptance | Зараз |
| --- | --- | --- |
| E06-C1: реальне durable recording | Blob, hash, verified readback, linked revision, export/delete, graceful restore | NOT DONE |
| E06-C2: device/browser fault injection | permission denied, codec, silence, tab close, simultaneous save, deadline | NOT RUN |
| E06-C3: 4 original task families | natural multi-turn voice, two S2 reviewers, rights + QA | NOT DONE |
| E06-C4: official 2027 interaction policy | manual Inspera 4 demos + OPH production confirmation | BLOCKED E02 |
| E06-C5: human formative assessment | calibrated judges, no accent penalty, disagreement reconciliation | NOT DONE |
| E06-C6: real transfer study | blind day14/day30 new speaking outcomes | NOT RUN |

**Завершено тут:** датоване джерельне дослідження, live-source code review, ризик/реліз ledger, pure JS reference safety gate та тести. Немає production recording fix, human approval або оцінювання YKI 3/4. Наступний етап E07 — жанри письма, але **E06-C1 (збереження реального голосу)** залишається критичним технічним боргом.
