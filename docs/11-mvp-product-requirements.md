# Hospodar YKI — ТЗ: інтерактивний MVP, персоналізація, голос та YKI digitesti

**Версія:** 1.0 · **Дата:** 2026-10-21 · **Статус:** approved for incremental implementation (not an assertion that every requirement is built).
**Ціль:** незалежна підготовка дорослих A2.2 → стабільний B1/B1+ до YKI suomi keskitaso. Пояснення українською; завдання фінською. Навчальні оцінки не є офіційними YKI-оцінками.

## 0. Ключова обов'язкова продуктова вимога: ДВА режими × ЧОТИРИ навички — P0

**Канонічне детальне ТЗ:** [15 — два режими й усі варіанти модулів](15-two-modes-skill-scopes.md). **Машинозчитуваний контракт:** [product-session-modes-v1.json](../research/user-cases/product-session-modes-v1.json).

- **MODE-01:** рівно **два зрозумілих верхньорівневих режими**: `learn` — суперефективна персоналізована підготовка; `exam` — максимально правдоподібна самостійна репетиція YKI. Їхню поведінку й індикатори режиму не плутати.
- **MODE-02:** **learn** пропонує `adaptive_mix` (усі чотири навички вперемішку з педагогічно обґрунтованим чергуванням, рекомендований), `structured_all` (усі чотири за планом), **кожну з 4 окремо** (`single_skill`) і, як додаткову опцію, користувацький `custom_mix`.
- **MODE-03:** **exam** пропонує `full_exam` (усі 4 разом), **кожний з 4 модулів окремо** (`single_subtest`), за бажанням `practice_subset` (довільні навчальні комбінації) і `official_partial_profile` тільки за підтвердженим дозволеним набором навичок конкретного дня OPH.
- **MODE-04:** підказки, teaching-feedback, пояснення, SRS, самовиправлення дозволені в **learn**; в **exam** усі підказки та ключі приховані до завершення, оцінка кожного вибраного модуля окремо, продуктивні відповіді не оцінювати фіктивним YKI-балом.
- **MODE-05:** обраний режим і навички зберігаються; можна змінювати фокус навчання без втрати попереднього прогресу. Єдині ID 4 skills та розділена аналітика `Навчання | Пробні іспити`.
- **MODE-06:** **не змішувати** випадкове чергування в навчанні з офіційним порядком 4 іспитових модулів; **не стверджувати** точну цифрову fidelity до перевірки параметрів OPH. Навчальний `single_subtest` можливий для кожної навички, але це **не** доказ доступності офіційної дати для неї.
- **MODE-07:** кожне меню (включно з 4 single-skill виборами в обох режимах) має бути функціональним, протестованим та доступним із клавіатури. **Наявний MVP усе це ще не реалізує.**

**Definition of Done для двох режимів:** [AC-01 … AC-24](15-two-modes-skill-scopes.md#7-критерії-приймання-матриця-тестування-не-декларація-виконання) покриті E2E / інтеграційними тестами й перевірені на реальному мобільному браузері; `exact_official_fidelity` можлива тільки за підтвердженою цифровою специфікацією OPH.

### DESIGN-RECOGNITION — кольоровий, авторський дизайн, без AI sameness
**Поглиблений дизайн-реліз v0.3:** [H-поріг → маршрут → дія](../brand/identity-v03-screen-system.md), вимоги [DESIGN-08…16, AC-25…32](15-two-modes-skill-scopes.md). Фірмовий знак залишається, а впізнаваність має бути в **композиції кожного екрана** (signature progress route, стриманий золотий діагональний крок, власний ритм заголовків, сценарії Фінляндії).


**Обов'язково:** дизайн може бути **яскравим, кольоровим і більш емоційним**, якщо це допомагає привертати/тримати увагу, робить навігацію ясною та створює впізнавану айдентику. Заборонено копіювати типовий вигляд AI-generated apps (default gradients, glass cards, фіолетові blobs, випадковий робот-маскот). Чотири навички мають відмінні смислові акценти, але одне лого та один бренд в обох режимах. Фокусна дія чітка, контраст відповідає WCAG 2.2 AA, колір не є єдиним маркером результату. Вимірювати usability й brand recall, а не приписувати кольору магічний вплив на пам'ять.

**Докладні вимоги й acceptance criteria:** [15 — DESIGN-01…DESIGN-07](15-two-modes-skill-scopes.md#51-впізнаваний-сміливо-кольоровий-дизайн-без-ai-sameness--обовязкова-вимога) та [brand/recognition-strategy-v02.md](../brand/recognition-strategy-v02.md). Поточний стан — документовано/частково реалізовано, не підтверджено користувацькими тестами.

### COLOR-MEMORY — evidence-based увага та пам'ять

**Нове наукове підґрунтя:** [research/design/16-color-attention-memory-research-2026-10.md](../research/design/16-color-attention-memory-research-2026-10.md) і [15 джерел у реєстрі](../research/design/color-memory-evidence-v1.json). Підкреслення ключа допускається **лише після першої незалежної відповіді** у навчальному feedback. У фазах `answer`, `repair`, `transfer`, unseen SRS і digital `exam` ніяких підказок правильної форми. На сильні механізми color-coded signaling можна спиратися, але ефекти досліджень мультимедійної сигналізації **не можна приписувати кольору самому по собі**. Див. [COLOR-01…10, AC-33…38](15-two-modes-skill-scopes.md).

### COLOR-ATTENTION-L2 — пріоритет розуміння над граматичним підсвічуванням

[Дослідження №17](../research/design/17-color-attention-l2-deep-dive.md) і [policy v2](../research/design/color-attention-design-policy-v2.json). Нове P0: **допомагати помітити мовну форму, не втрачаючи змісту висловлювання**. У feedback за наявності ручного `meaning_uk` показувати сенс перед кольоровим граматичним cue. `repair`, `answer`, `transfer`, `exam` — без граматичного ключа до відповіді. Перевіряти comprehension як окрему метрику: метааналіз L2 повідомив `d=+0.22` grammar і `d=−0.26` meaning при visual input enhancement. Без заяв про percent boost від барв. [COLOR-11…20, AC-39…46](15-two-modes-skill-scopes.md).

## 1. Вертикальний MVP — P0

Користувач проходить цілісний сценарій **завдання → самостійна відповідь → перевірка → самовиправлення → перенос у новий контекст → повторення → збережений прогрес**.

### Функціональні вимоги

- **MVP-01:** вибір реального завдання зі збережених `learning/exercises/b1/grammar/contextual-cloze.json`; стабільний ID, походження, граматичний тег, рівень та пояснення.
- **MVP-02:** до першої відповіді неможливо побачити еталон / ключ; порожню відповідь не приймати.
- **MVP-03:** детермінована перевірка структурованих cloze-форм, з нормалізацією регістру та пробілів; альтернативи використовувати лише явно прийняті контентом. Відкриті продуктивні відповіді **не** оцінювати простим exact match.
- **MVP-04:** після помилки спершу запропонувати одну контрольовану самокорекцію **без розкриття ключа**; після другої спроби показати еталон і пояснення.
- **MVP-05:** перенесення на нову ситуацію — власна письмова відповідь без зразка; зберігати факт виконання, **не** приписувати автоматичного B1-бала.
- **MVP-06:** зберігати дату, результат незалежної першої спроби, факт самовиправлення, текст перенесення, ID завдання, відкладене повторення та журнал помилок; обмежити обсяг і надати експорт/повне очищення.
- **MVP-07:** після повернення в застосунок прогрес і картки повторення доступні; при недоступному сховищі — чесно попередити про volatile mode.
- **MVP-08:** доступний mobile-first UI, клавіатура, зрозумілі статуси, без автозапуску аудіо, без шумних раптових ефектів.

### Acceptance criteria

- Неправильна 1-ша відповідь → ключ лишається прихованим → 2-га спроба → пояснення → transfer → completed → запис у localStorage.
- Вірна 1-ша відповідь → пояснення → transfer → completed → SRS інтервал збільшується; помилка залишає коротку затримку, навіть якщо guided self-repair вдалася.
- Перезавантаження не стирає завершені місії; експорт і повне видалення працюють; введена відповідь не відправляється на сервер.
- Структурні тести перевіряють нормалізацію, SRS, повторне завантаження та відхилення некоректного сховища.

## 2. Персоналізація — P0 → P1

- **PER-01:** базова діагностика **чотирьох навичок окремо**: `tekstin ymmärtäminen`, `puheen ymmärtäminen`, `kirjoittaminen`, `puhuminen`. Не зводити до однієї гарантованої CEFR оцінки.
- **PER-02:** reading/listening scored **лише якщо існує перевірений текст/аудіо і однозначні ключі**. Зокрема, `learning/exercises/b1/diagnostics/baseline-v1.json` містить `script_only` listening: **заборонено** зараховувати це як аудіодіагностику.
- **PER-03:** продуктивні writing/speaking у першій версії — чернетка або запис + rubric/self-check, статус `ungraded` до людської/контрольованої перевірки; не оцінювати вимову з транскрипту ASR.
- **PER-04:** адаптивний початковий SRS за поведінкою першої незалежної спроби та часом відкладеного пригадування; початкова шкала 1/3/7/14/30 днів — **евристика**, не FSRS і не оптимальний науковий календар.
- **PER-05:** журнал повторних помилок: grammar tag, input, первинний результат, guided repair, наступна дата; only confirmed errors enter active weakness queue.
- **PER-06:** не винагороджувати запам'ятовування тих самих питань як загальний прогрес B1; незалежні unseen завдання для 7-/14-денних контрольних перевірок, окремо від навчального повтору.
- **PER-07:** зберігання за замовчуванням **локально на пристрої**, без логіна, аналітики, передачі мікрофонних записів чи прихованої синхронізації. Для кроспристроєвої синхронізації — окреме ТЗ із згодою, GDPR і політикою retention.

## 3. Природне аудіо й голос — P1

- **AUD-01:** нові **сучасні побутові 2–3-хвилинні діалоги** різних дикторів, B1/B1+, із текстом, питаннями gist/details/inference та source/consent/license атрибуцією.
- **AUD-02:** точна транскрипція з ручною звіркою (verbatim; фінська вимова, числа, puhekieli); для субтитрів — WebVTT timestamps перевірені прослуховуванням. Перевіряти **права на переробку/розповсюдження** кожного запису, не імпортувати сторонні MP3 лише тому, що є вбудований плеєр.
- **AUD-03:** плеєр із play/pause/replay, швидкістю за запитом; за замовчуванням transcript/subtitles hidden until first independent attempt; доступний alternative text, keyboard control.
- **AUD-04:** speaking roleplay: запит у фінській, явна згода на мікрофон, запис/відтворення тільки на пристрої для MVP; як нема дозволу — текстовий fallback. Відсутність дозволу на мікрофон не дорівнює навчальній помилці.
- **AUD-05:** зворотний зв'язок розмежовує content/task success, fluency, grammar, pronunciation; останнє **лише** при придатному аудіосигналі й validated human anchors. Без цього — `not assessed`.
- **AUD-06:** живе аудіо відрізняти від Piper TTS і історичної літературної фінської; сучасні багатоголосі діалоги **не вважати готовими**, поки не імпортовані й не перевірені.

### Готовність аудіо

Вхідний критерій — два різні реальні голоси в одному сучасному діалозі, чітко підтверджені права, транскрипт і синхронізація перевірені S2-рецензентом, 4+ перевірених comprehension item, ніяких auto-claims про офіційний YKI.

## 4. Цифрова симуляція YKI 2027 — P1 → P2

Офіційне джерело OPH: https://www.oph.fi/fi/koulutus-ja-tutkinnot/sopivan-yki-testin-valinta-ja-testipaivat

**Підтверджено станом на 21.10.2026:** усі тести **фінської** навесні 2027 — цифрові. Повний **YKI suomi keskitaso 10.04.2027**, реєстрація **08–25.03.2027**, старт реєстрації згідно OPH о **10:00 (Finland time)**. Дати можуть змінюватися: показувати source + checked_at, підтвердити перед реєстрацією.

- **SIM-01:** окремий **training rehearsal** із чотирма навичками, навігацією, незалежною відповіддю, відсутністю підказок/миттєвого фідбеку, завершальним summary.
- **SIM-02:** official exact task counts, timer, screen format, playback limits, pause rules та доступність вводити **лише після** публікації/перевірки конкретної цифрової специфікації OPH; не вигадувати.
- **SIM-03:** режим learning (feedback після задачі) і exam-like rehearsal (feedback тільки в кінці), обоє явно позначені як **неофіційні**.
- **SIM-04:** самостійне введення з клавіатури, аудіоплеєр, запис говоріння за явним дозволом, завершення і відновлення без втрати навчальних даних.
- **SIM-05:** оцінювання за 4 навичками окремо; open writing/speaking залишати `ungraded` поки не оцінено компетентним рецензентом; внутрішні 0–100 не конвертувати в YKI 3/4.
- **SIM-06:** попередити, що продукт незалежний від OPH / JYU і не реплікує офіційний програмний інтерфейс.

## 5. Non-functional / Definition of Done

- **Privacy:** browser-local by default; don't upload raw audio, token, free-text answers; local export/delete, clear disclosure. Never commit learner data in Git.
- **Reliability:** deterministic evaluation, schema-versioned state, corrupt-state fallback, accessible status feedback, tests on Chrome Android + Firefox/Safari, mobile narrow viewport.
- **Content integrity:** repo's JSON is source of truth; no answer keys displayed before first try. Content with `teacher_review=pending` is visibly training-only.
- **Observability:** local event log counts without remote analytics; developer console only on explicit troubleshooting; no sensitive payloads in CI logs.
- **Reproducibility:** runnable static prototype with built-in browser features; automated core tests on push and PR; deployments are a distinct stage.
- **Release gates:** independent S2 editing, modern human-audio pack, calibration of subjective feedback, and verified official exam-format details must be complete before describing the app as exam-ready.

## 6. Status matrix (initial delivery)

| Scope | State |
|---|---|
| Requirements, architecture, official dates | documented |
| Vertical cloze practice, guided repair, transfer, local SRS | MVP implementation |
| Four-skill diagnostic | first diagnostic UI; speaking/writing ungraded |
| Adaptive 7/14-day unseen task bank, teacher calibrated | planned |
| Existing linked audio, browser speaking recording | prototype |
| New modern two-voice recorded dialogues + S2 transcriptions | **not delivered** |
| Digital 2027 rehearsal | independent training approximation; **not official replica** |
| Server accounts, cloud sync, production deployment | not delivered |

**Контентне джерело:** `learning/exercises/b1/**` і `assets/audio/library.json`. Заплановане розширення не повинне видавати незавершені можливості за готові.

## 7. INTERACTIVE-VISUAL — науково обґрунтовані інтерактивні вправи та візуальний UX (P0→P2)

**Розгорнута специфікація:** [18 — інтерактивні вправи, візуальні сигнали, докази та acceptance criteria](../research/ux/18-interactive-visual-learning-evidence-2026-10.md). **Реєстр реалізації:** [research/ux/interactive-visual-learning-v1.json](../research/ux/interactive-visual-learning-v1.json). **Сполучення з двома режимами:** [15 — §9](15-two-modes-skill-scopes.md#9-interactive-visual-науково-обґрунтований-інтерактивний-шар).

- **IV-REQ-01 / P0 — generate before reveal:** пріоритет самостійної `typed/open/voice` відповіді. Лише вибір із варіантів, перетягування чи повторне читання не мають монополізувати навчання. Ключ не відображати до відповіді.
- **IV-REQ-02 / P0 — feedback+repair:** змістовий результат → обмежені навідні підказки → власне виправлення → короткий feedback з однією смисловою підсвіткою; не зараховувати assisted success як незалежне знання.
- **IV-REQ-03 / P0 — delayed unseen transfer:** для кожної цільової мовної навички передбачити новий контекст, а потім незалежний 7/14-денний retest. Інтервали лише стартовий план, адаптувати за перевіреними результатами.
- **IV-REQ-04 / P0 — audio listening UX:** `prediction → first uncued audio → gist → details/evidence → optional transcript/VTT after submit → new audio without text`. Усі ліцензії, timestamp, S2 review перевіряються окремо.
- **IV-REQ-05 / P0 — interactive reading:** справжні оголошення, листи, графіки та завдання на практичне рішення. Після відповіді дозволено показати лише схвалений `evidence_span`; до відповіді — не сигналізувати правильне місце.
- **IV-REQ-06 / P1 — multimedia for chunks:** змістовна ілюстрація + українська gloss лише в навчальній фазі; наступна самостійна продуктивна дія без фото/перекладу. Не обіцяти довготривалий ефект лише від картинки.
- **IV-REQ-07 / P1 — meaningful agency:** розгалужені побутові діалоги, information-gap, власні мінісхеми/обґрунтування, draft → feedback → rewrite → new task. Виділяти семантику, а не випадкові кольори.
- **IV-REQ-08 / P0 — accessibility / distraction:** WCAG 2.2 AA; високий контраст, клавіатура, доступні альтернативи перетягуванню, текст і іконка разом із кольором, calm/reduced-motion, ніяких distractor animation при відповіді.
- **IV-REQ-09 / P0 — honest mastery:** dashboard на основі `unassisted_first_attempt` та перевірених 4-skill результатів, окремо `hint_used`, `transfer`, `review`. Ніяких псевдонаукових «+X% пам'яті» або оцінювання CEFR за автоматичними кліками.
- **IV-REQ-10 / P0 — mode isolation:** у `exam` нуль додаткового trainer feedback, підсвічування ключа, мультимедійних підказок, маскота й навчальної гейміфікації до завершення. Для exact fidelity лише офіційно підтверджені параметри.
- **IV-REQ-11 / P1–P2 — optional gamification:** короткі місії, добровільні неманіпулятивні винагороди; маскот і випадкові звуки — opt-in експеримент, вимкнути одним натисканням. Не використовувати під час навчальної відповіді й симуляції.
- **IV-REQ-12 / P0 — evidence audit:** дата/тип дослідження, прямий L2 vs transfer із загальної психології, обмеження й data version в документації. Оцінка /100 — лише експертний product-fit, не величина навчального приросту.

**Критерій готовності:** виконані [IV-AC-01…15](../research/ux/18-interactive-visual-learning-evidence-2026-10.md#7-критерії-приймання-нові-iv-ac-0115-planned), є автоматичні + мобільні/accessibility тести й S2 перевірка завдань. **Наразі це формалізовані вимоги; не стверджувати, що всі 14 патернів реалізовані.**

**План доказової перевірки:** A/B `text-based retrieval+feedback+SRS` проти `same + meaningful multimedia cues`, збалансовані завдання; primary = перша незалежна відповідь на unseen task через 7 днів, secondary = 14 днів, comprehension gist без VTT, коректність і доступність. Жодних причинних висновків без належного експерименту.

## Новий фундамент навчального двигуна — LE-01…13 (21.10.2026)

**Детальне ТЗ / технічна придатність книг:** [19 — science books → engineering](../research/pedagogy/19-learning-books-to-engineering-2026-10.md); [машинозчитувана черга](../research/pedagogy/learning-blueprints-books-v1.json); [AC-47…59](15-two-modes-skill-scopes.md).

Ціль **не** «пройти 100 карток», а повернути користувача до фінської в новій ситуації через 7–14 днів: `retrieval → meaning-first input → independent task → informative feedback → self-repair → unseen transfer → next SRS`.

**P0:** first-attempt immutable ledger, комунікативна задача/genre, capped diagnostic feedback, reviewed content+rights, held-out independent skill evidence.  
**P1:** responsive SRS, novice fading, contrastive interleaving (після базової практики), language-specific audio+pronunciation і teacher-anchored writing/speaking.  
**Поведінкова межа:** не робити тести «візуалів/аудіалів»; не підміняти практику підсвічуванням, великою кількістю анімацій, незнайомими слівцями без контексту чи стріками. Ні книги, ні дослідження не гарантують особистий YKI 3.

**Не реалізовано автоматично:** документування цих вимог **не** означає готовий 4-skill adaptive engine.

## 8. SECOND-WAVE MULTIMODAL EVIDENCE → build requirements

**Research:** [20 — 14 нових статей, реальні фінські сценарії](../research/ux/20-multimodal-interactive-learning-2026-10.md) · [14 evidence sources, 12 patterns, 18 IV2-AC у JSON](../research/ux/multimodal-interaction-evidence-v2.json) · [головне ТЗ §10](15-two-modes-skill-scopes.md#10-multimodal-interaction--новий-шар-керованої-мультимодальності-p0p2).

**P0 (backlog):** додаємо ступінчастий gloss без зайвих медіа, `discover` vs `first_uncued` gating, аудіо/відео caption-after-submit only, `calm/rich` media policy, доступну proximity text+diagram, held-out audio-only та unseen production. Перевіряти 18 IV2-AC, правовий статус усіх media, verified timestamps та S2 review.

**P1:** semantic gesture short loops (optional), video semantic-boundary questions із guardrail cognitive load, Finnish quantity lab без необґрунтованого score, AI рольові діалоги з human-reviewed anchor і `abstain`, learner-generated visual maps замість декоративних діаграм, м'яку гейміфікацію лише за комунікативну дію.

**Evidence caveat:** 2024 second-order gloss meta схиляється до single-mode для recognition/beginners, 2025 L1+picture meta схиляється до combined inputs для immediate vocabulary tests. Це **не** помилка: різні comparisons/tests. Контракт підтримує альтернативні дизайни й оцінку на 7-day uncued transfer. 2025 video meta показав можливі benefits, а time-controlled experiment 2024/2025 знайшов **no performance improvement + higher load** від додаткових prompts; тестувати ефективність, не кількість кліків.

**Статус:** вимоги **погоджені до поетапної розробки, не виконано**; (відсутність) точного official OPH 2027 UI і каліброваного Finnish speech/writing grader позначати явно. Рекламні «+X% запам'ятовування» заборонені без власної пререгістрованої перевірки.
