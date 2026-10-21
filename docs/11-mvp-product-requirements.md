# Hospodar YKI — ТЗ: інтерактивний MVP, персоналізація, голос та YKI digitesti

**Версія:** 1.0 · **Дата:** 2026-10-21 · **Статус:** approved for incremental implementation (not an assertion that every requirement is built).
**Ціль:** незалежна підготовка дорослих A2.2 → стабільний B1/B1+ до YKI suomi keskitaso. Пояснення українською; завдання фінською. Навчальні оцінки не є офіційними YKI-оцінками.

## 1. Вертикальний MVP — P0

Користувач проходить цілісний сценарій **завдання → самостійна відповідь → перевірка → самовиправлення → перенос у новий контекст → повторення → збережений прогрес**.

### Функціональні вимоги

- **MVP-01:** вибір реального завдання зі збережених `content/b1/grammar/contextual-cloze.json`; стабільний ID, походження, граматичний тег, рівень та пояснення.
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
- **PER-02:** reading/listening scored **лише якщо існує перевірений текст/аудіо і однозначні ключі**. Зокрема, `content/b1/diagnostics/baseline-v1.json` містить `script_only` listening: **заборонено** зараховувати це як аудіодіагностику.
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

**Контентне джерело:** `content/b1/**` і `audio/library.json`. Заплановане розширення не повинне видавати незавершені можливості за готові.
