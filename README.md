<p align="center">
  <img src="assets/images/brand/hospodar-yki-lockup.svg" alt="Hospodar YKI — logo concept" width="720" />
</p>

# Hospodar YKI

## 🗂️ Матеріали, дослідження й джерела — єдина структура (22.10.2026)

**[Загальна карта матеріалів](docs/CONTENT-ARCHITECTURE.md)** · **[Каталог із власниками](docs/FOLDER-STRUCTURE.md)** · **[Зображення/аудіо/відео](assets/README.md)** · **[Зовнішні джерела та YouTube](sources/README.md)** · **[Словники](docs/FOLDER-STRUCTURE.md)** · **[Вправи](learning/exercises/README.md)** · **[Педагогіка, дизайн, UX, геймплей і user cases](research/README.md)**.

Зараз **не переносимо** робочі файли з `audio/`, `video/`, `content/b1/` і `brand/logo/`: ці шляхи використовують застосунок та валідатори. Новий `docs/FOLDER-STRUCTURE.md` однозначно індексує існуючі оригінали без копій, а `docs/FOLDER-STRUCTURE.md` фіксує Git SHA/розміри 94 наявних бінарних файлів. **Git-хеш не є підтвердженням ліцензії.** Перевірка: `python3 scripts/validate_repository_taxonomy.py`. Великі майбутні медіапакети Android не додаємо без дозволів і реальної збірки PAD.


## 🧭 Розробка з AI: перевірені правила та документація (22.10.2026)

**[AGENTS.md](AGENTS.md)** — коротка інструкція для AI coding agents · **[Карта документів](docs/INDEX.md)** · **[Архітектура: факт vs план](docs/ARCHITECTURE.md)** · **[Запуск](docs/DEVELOPMENT.md)** · **[Тести](docs/TESTING.md)** · **[Контракти](docs/CONTRACTS.md)** · **[Робочий процес](docs/AI-WORKFLOW.md)** · **[Релізи](docs/RELEASE.md)**.

Для software PR — [CONTRIBUTING.md](CONTRIBUTING.md) і [PR template](.github/pull_request_template.md). Для контенту фінською — [learning/CONTRIBUTING.md](learning/CONTRIBUTING.md). Внутрішні посилання, policy markers та повнота документації перевіряються командою `python3 scripts/validate_ai_docs.py` і окремим CI workflow.

**Реальний статус:** Web `app/` — vanilla JS MVP; EXAM використовує IndexedDB, LEARN — localStorage. Android Kotlin, Phaser/React/Capacitor, Play Asset Delivery та 2–3GB офлайн-медіа **ще не підтверджені готовими продуктами**. Документація та її зелений CI **не означають готовність додатка до релізу**.


## 🎨 Впізнаваний і кольоровий Hospodar YKI v0.3 (21.10.2026)

**[Фірмова композиційна система: «Поріг → Маршрут → Дія»](brand/identity-v03-screen-system.md)** · **[Логотип H-поріг](assets/images/brand/hospodar-yki-mark.svg)** · **[Дизайн-токени v0.3](brand/tokens.json)** · **[ТЗ DESIGN-01…16 та AC-25…32](docs/15-two-modes-skill-scopes.md)**.

Одна айдентика в двох режимах: **01 Навчання** та **02 Симуляція**. Впізнаваність не лише в логотипі, а й у сегментованому маршруті поступу, золотому «кроці», особливій геометрії, авторському editorial-стилі та практичних фінських завданнях. Насичені кольори дозволені для meaningful акцентування й чотирьох навичок (teal/plum/terracotta/green), але фінський текст і активний тест залишаються спокійними та доступними. Відхиляємо AI sameness: фіолетові градієнтні blobs, glassmorphism, однакові dashboard cards і беззмістовні маскоти.

У навчальному прототипі нова **threshold-route** показує справжні етапи місії, у пробному іспиті — чотири модулі. **Немає доказів**, що сама палітра підвищує навчальні результати; потрібні user testing, WCAG-перевірки та PRH/EUIPO clearance.

## 🧠 Доказовий колір для пам'яті — research (21.10.2026)

**[Огляд досліджень: сигналізація, увага, L2, збереження знань](research/design/16-color-attention-memory-research-2026-10.md)** · **[15 наукових і нормативних джерел, JSON](research/design/color-memory-evidence-v1.json)**.

Головне правило: **спочатку власна відповідь → одна контрастна кольорова підказка тільки у feedback → нова ситуація без підказок → відкладене пригадування**. У поточному MVP еталонна фінська форма після відповіді показується на доступному золотистому фоні з підкресленням; симуляція YKI залишається без такого підсвічування під час спроби. Ефект нашої конкретної палітри на пам'ять ще **не вимірювали**; заплановані 7/14-day unseen tests.

## 🔬 Нова наука про колір, увагу й вивчення фінської (2026)

**[Поглиблений науковий аналіз із ризиками L2 form-vs-meaning](research/design/17-color-attention-l2-deep-dive.md)** · **[20 верифікованих джерел](research/design/color-memory-evidence-v1.json)** · **[дизайн-policy v2](research/design/color-attention-design-policy-v2.json)**.

У навчальному feedback на трьох простих граматичних ситуаціях з'являється **«Спочатку зміст → потім форма»**, із підкресленням/кольором лише після першої незалежної відповіді. На transfer, retest і YKI-симуляції жодних підказок правильних форм. Мета — орієнтувати увагу, але не жертвувати розумінням заради візуального ефекту; змістовні переклади ще мають пройти S2 review.


## 🎯 Справжні YKI mock-відео — окрема перевірена класифікація (21.10.2026)

**[3 наявні пробні speaking-відео, 5 офіційних деморозділів SOLKI, ризики прихованих відповідей](sources/official/yki-mock-simulation-sources.json)** · **[Аудит і ТЗ: MOCK-VID-01…08](sources/official/YKI-MOCK-VIDEO-SOURCES-2026-10.md)**.

Відео [YKI Harjoitus speaking mock](https://www.youtube.com/watch?v=htrQhR-HGM4) дає **самостійні завдання 0:00–16:22**, приклади тільки після **16:22**. Офіційні [SOLKI/Jyväskylä зразки говоріння](https://ykitesti.solki.jyu.fi/tutustu-testiin/testifin/keskitaso-puhuminen/) й [аудіювання](https://ykitesti.solki.jyu.fi/tutustu-testiin/testifin/keskitaso-puheen-ymmartaminen/) — найкраще джерело старих демонстраційних типів задач. **Це не 100% копія цифрового YKI 2027**, і матеріали не копіюються без прав. Зберігаємо `seen/unseen` та timestamp витікання авторських відповідей.

## ▶️ YouTube як навчальна бібліотека — 47 відео з прямими посиланнями (21.10.2026)

**[Каталог 47 YouTube-відео зі 182 часовими сегментами](sources/youtube/youtube-catalog.json)** · **[Новий ретельний відбір: 3 YouTube B1/B2, 8 прямих Yle-епізодів, професійні відеосерії](sources/youtube/YOUTUBE-AND-YLE-B1-HIGH-VALUE-ROUND5-2026-10.md)** · **[Каталог конкретних Yle Areena відео](sources/publishers/publisher-episode-catalog.json)** · **[6 найкращих нових B1/B2-відео (аудіювання, YKI письмо/говоріння, puhekieli)](sources/youtube/YOUTUBE-B1PLUS-HIGH-VALUE-ROUND4-2026-10.md)** · **[9 професійних відеосерій видавців](sources/publishers/publisher-series-catalog.json)** · **[Новий відбір: оренда, лікар, робота, puhekieli, офіційне Yle B1](sources/youtube/YOUTUBE-AND-PUBLISHERS-HIGH-VALUE-ROUND3-2026-10.md)** · **[Найцінніші 16 нових — діалоги, говоріння, письмо](sources/youtube/YOUTUBE-HIGH-VALUE-ROUND2-2026-10.md)** · **[Добірка, пріоритети 0–100 і ТЗ YouTube-плеєра](sources/youtube/YOUTUBE-LEARNING-CATALOG.md)** · **[ТЗ YTP-01…14](docs/15-two-modes-skill-scopes.md)**.

Бібліотека зосереджена на корисних для YKI видах практики: **B1 listening, puhekieli/kirjakieli, діалоги про роботу, speaking ситуації й аргументація, writing, illatiivi/partitiivi**. Для YouTube в Git зберігаємо **тільки прямі посилання та авторські навчальні метадані**; відеобінарники залишаються на YouTube. Майбутній інтегрований плеєр — офіційний YouTube embed зі збереженням керування та attribution; `caption/embeddable` поки `pending`. Відеозразки із відповідями — **не** held-out exam assessment. Детальний review учителем S2 — наступний етап.


**Другий раунд:** п'ять професійних A2–B1 відеодіалогів Kielibuusti / Haaga-Helia (CC BY-ND 4.0, без субтитрів), фінські двоголосі подкасти й 2026 puhekieli, practice-first YKI email, стратегії. Усі відео — **посилання, без копіювання з YouTube**; `teacher_review`, `embeddable` та незалежна перевірка субтитрів поки не виконані.

**Новий якісний відбір (раунд 4):** B1/B2-аудіювання про витрати на житло із шістьма питаннями, два спеціальні YKI B1–B2 speaking/writing уроки, 15 тематичних сегментів професійної `puhekieli` від Kielibuusti, природний темп KatChats і фінські новини з дискусіями. **Тільки посилання, без копіювання відео; teacher S2 і embed permission ще не перевірені.**

## 🎬 3 справжні відкрито ліцензовані відео фінською (21.10.2026)

**[Відеобібліотека та авторські права](assets/video/README.md)** · **[Каталог матеріалів](assets/video/catalog.json)** · **[Підтверджені файли, тривалість та SHA-256](assets/video/open/available.json)** · **[9 оригінальних питань, очікують S2](learning/exercises/video/exercises.json)**.

У Git збережено **три реальні компактні 360p WebM**: `assets/video/open/jenni-puhekieli.webm` (3:11, 10.5 MB, CC BY 3.0), `assets/video/open/kinola-helsinki.webm` (1:35, 3.4 MB, CC BY-SA 4.0), `assets/video/open/claes-esittely.webm` (1:17, 3.5 MB, CC BY-SA 3.0). Перевірено `ffprobe`, SHA-256 та збережено attribution/provenance. Справжні голоси, **монологи, не офіційний YKI**. Для Jenni транскрипція є на сторінці джерела; перевірених локальних FI VTT та українських транскриптів до відео **поки немає**. Автоматичне завантаження з дозволених Wikimedia Commons джерел: [імпортер](scripts/import_open_finnish_videos.py).

## 🧠🎬 Другий науковий раунд: мультимодальність, жести, відео, AI-діалоги (21.10.2026)

**[14 додаткових наукових/нормативних джерел і рішення для інтерфейсу](research/ux/20-multimodal-interactive-learning-2026-10.md)** · **[12 патернів / 18 acceptance checks у JSON](research/ux/multimodal-interaction-evidence-v2.json)** · **[нові вимоги MULTI-01…10 до головного ТЗ](docs/15-two-modes-skill-scopes.md)**.

Уточнення попередньої моделі: **не більше мультимедіа, а краща інтерактивна дія**. `discover` дає дозовані підказки; `first_uncued` вимагає відповіді без опор; `review` допомагає виправити; `transfer` і 7/14-day retest перевіряють незалежну production/comprehension. Відеозапитання на смислових межах, captions після submit, meaningful gestures лише для конкретних слів, простий/calm режим та відповідальні AI-діалоги. **Це оновлення ТЗ, а не готові функції.**

## 🧩 Науково обґрунтовані інтерактивні задачі й візуальний UX (21.10.2026)

**[Повний огляд і UX-рецепти (14 патернів, 14 дослідницьких та нормативних джерел)](research/ux/18-interactive-visual-learning-evidence-2026-10.md)** · **[Машинозчитуваний контракт та 15 acceptance criteria](research/ux/interactive-visual-learning-v1.json)** · **[Доповнення до головного ТЗ](docs/15-two-modes-skill-scopes.md#9-interactive-visual-науково-обґрунтований-інтерактивний-шар)**.

`самостійна відповідь → feedback/самовиправлення → один змістовний візуальний сигнал → новий контекст без опори → 7/14-day retest`. Для слухання: `prediction → gist/details → captions після спроби → uncued transfer`; для лексики — предметне фото + український gloss, який згодом зникає; для читання — реальні повідомлення та evidence spans. **Рейтинги /100 — наш пріоритет, не відсотки поліпшення пам'яті.** Мета — незалежна правильна дія й розуміння фінської, не кількість кліків. Це **ТЗ і план тестів**, а не твердження про готовність усіх інтерактивних компонентів.

## 🧠🎓 Цільовий продукт — 2 режими × 4 навички (ТЗ, 21.10.2026)

**[Головна продуктова специфікація: два режими та всі варіанти навичок](docs/15-two-modes-skill-scopes.md)** · **[Деталі MVP](docs/11-mvp-product-requirements.md)** · **[JSON-контракт вибору режиму/модуля](research/user-cases/product-session-modes-v1.json)**.

**🧠 Ефективна підготовка:** всі 4 навички **адаптивно вперемішку**, всі 4 структуровано або **тільки читання / аудіювання / письмо / говоріння**. Evidence-based retrieval, SRS, task-based activities, feedback, guided self-repair, transfer та адаптивна діагностика.

**🎓 Реалістична симуляція:** **повний пробний YKI з 4 модулів** або **будь-який 1 модуль окремо**, а також тренувальні комбінації чи конкретні дозволені часткові дні OPH. До завершення тесту немає підказок, після — оцінка окремо за навичками; writing/speaking не отримують вигаданого YKI-бала.

**Важливо:** це **оновлене ТЗ**, а не заявка, що всі селектори та повний іспит вже реалізовано. Наявні вебпрототипи охоплюють лише частину цільових можливостей.

## 💻 Незалежна цифрова репетиція YKI — 9 завдань (21.10.2026)

**[Відкрити тренажер](app/exam.html)** · **[Інструкції для запуску](app/README.md)** · **[Технічна специфікація максимальної достовірності](docs/14-digital-yki-fidelity-spec.md)** · **[33 підтверджені/непідтверджені деталі, JSON](research/yki/yki-digital-fidelity-evidence-2026-10.json)**.

Два оригінальні 4-skill **міні-екзамени**: послідовні завдання, локальне автозбереження, відновлення, добровільний навчальний таймер, відкладений показ ключів, оцінка читання/аудіювання лише за однозначними ключами; письмо, говоріння й open — **без автоматичного YKI бала**. Голосовий запис — опційний і тимчасовий, не відправляється на сервер. **Не офіційне цифрове ПЗ 2027 року:** exact таймінги/повтори аудіо/інтерфейс OPH ще не підтверджені; сучасні записані багатоголосі діалоги й повний тест ще потрібні.

## 🎓 Як проходить YKI: офіційні приклади та цифровий формат 2027 (21.10.2026)

**[Повний український довідник: екзаменаційний день, 4 навички, приклади й ризики digitesti](research/yki/13-yki-exam-format-and-real-examples-2027.md)** · **[Перевірений каталог офіційних демо SOLKI та 9 пакетів Yle B1 (JSON)](research/yki/yki-exam-examples-2026-10.json)** · **[Дві міні-репетиції з наших матеріалів](learning/exercises/b1/exam-patterns/README.md)**.

Старі офіційні демо SOLKI містять реальні **приклади типів завдань** і аудіо, але **не** описують точний комп'ютерний інтерфейс весни 2027. OPH підтверджує цифровий формат усіх фінських тестів весни 2027, повний keskitaso **10.04.2027**, реєстрацію **08–25.03.2027**. Зовнішні офіційні/телевізійні тексти й MP3: **тільки посилання**, без копіювання в Git. У двох нових локальних міні-пакетах — **наш тренувальний контент**, ще не перевірений викладачем і ще не підключений до UI як окремий режим.

## 🧪 Новий інтерактивний MVP (21.10.2026)

**[▶️ Запуск локального вебпрототипу](app/README.md)** · **[Інтерфейс](app/index.html)** · **[ТЗ чотирьох напрямів](docs/11-mvp-product-requirements.md)** · **[Архітектура](docs/12-mvp-architecture.md)**.

Реалізовано перший наскрізний цикл: `завдання → відповідь → перевірка → самовиправлення → новий контекст → SRS → локально збережений прогрес`. У браузерному MVP також є короткі проби 4 навичок, використання наявного аудіо, опційний локальний запис голосу та неофіційна 4-крокова digital rehearsal. **Поки немає** виробничого деплою, сучасних багатоголосих записів із ручною звіркою, людського калібрування відповідей та підтвердженої точної симуляції екранів OPH. Усі продуктивні writing/speaking залишаються `ungraded`.

Для запуску з кореня: `python3 -m http.server 8080` → `http://localhost:8080/app/`. Тести: `node --test app/tests/*.test.mjs`.


<p align="center"><strong>Real Finnish. Ready for YKI.</strong></p>

**Фінська для життя. Впевненість для YKI.**

Evidence-informed навчання живої фінської: реалістичні ситуації, корекція помилок, повторення та незалежна перевірка прогресу. Ми створюємо **оригінальні матеріали**, а не переписуємо підручники чи продаємо ілюзію успіху.

**[18 нових тем для аргументації та transfer](learning/exercises/b1/high-yield/opinion-argumentation-v1.json)** — дев'ять тематичних напрямів, дві ситуації на кожен; це оригінальні навчальні теми, не офіційний тест, S2-редактура очікується.


## 🎧 Нові YKI-орієнтовані аудіоджерела (21.10.2026)

**[Добірка 16 навчальних аудіоджерел із рейтингами](assets/audio/YKI-LISTENING-RESEARCH-2026-10.md)** · **[JSON-каталог посилань для застосунку](assets/audio/yki-targeted-sources-2026-10.json)**.

У добірці офіційні YKI-демо (11 listening аудіо, вже у старому каталозі), природна фінська A2.2–B1, телефонні діалоги VIERKO, 2 багатоголосні Sitra MP3 із опублікованим текстом і Selkosanomat із вебозвученням. **Нових MP3 у GitHub не імпортовано:** права та фактична доступність окремих файлів потребують перевірки.

## 🔬 Нова корпусна граматика для YKI — 120 реальних прикладів (21.10.2026)

**[120 вправ із відкритого FinnTreeBank](learning/exercises/b1/grammar/ftb-frequency-cloze-v1.json)** · **[Дослідження 12 нових джерел та висновки](knowledge/sources/10-open-corpora-yki-2026-10.md)** · **[Атрибуція CC BY 4.0 і використання](learning/exercises/b1/grammar/README.md)**.

По 15 вправ на Genetiivi, Partitiivi, Illatiivi, Elatiivi, Allatiivi, Adessiivi, Konditionaali, Passiivi. Для добору речень використано збережений news-frequency словник (не CEFR-рейтинг). Вправи — **кандидати до S2-редактури**, не сертифікований набір YKI, не озвучені.

## 📦 Нова бібліотека матеріалів YKI (21.10.2026)

**[Аудит 65 джерел і ліцензій](knowledge/sources/09-yki-content-materials-2026-10.md)** · **[Реєстр для застосунку](research/yki/yki-content-sources-2026-10.json)** · **[Контекстні завдання](learning/exercises/b1/contextual/README.md)**.

У репозиторії тепер також фізично збережені **10 000 лем із CC BY 4.0 частотного словника** (це не готові YKI картки), **132 оригінальні контекстні chunks**, **40 rektio-конструкцій**, **9 нових коротких текстів / 27 питань**, **9 діалогів / 18 питань**. Авторські тексти позначені як чернетки до S2-редактури; діалоги не зараховуються як аудіювання до озвучення.

[Частотний словник та атрибуція](knowledge/dictionaries/b1/frequency/README.md) · [Перевірка структури](scripts/validate_contextual_content.py).

## 🧪 Світові методики для майбутнього застосунку (21.10.2026)

**[67 методик фінської та YKI](research/pedagogy/08-learning-methods-evidence-2026-10.md)** · **[Експертна оцінка ефективності кожної (0–100)](research/pedagogy/12-finnish-yki-learning-effectiveness-2026-10.md)** · **[69 наукових та офіційних джерел](research/pedagogy/learning-methods-v1.json)** · **[JSON-рейтинги для майбутнього застосунку](research/pedagogy/learning-effectiveness-ratings-v1.json)** · **[11 навчальних модулів і 4 A/B-гіпотези](research/pedagogy/yki-methodology-implementation-v1.json)** · [Автоматична перевірка](scripts/validate_learning_methods.py).

Першочергові методи: spaced retrieval, task-based communication, explicit grammar in context, metacognitive listening, writing feedback із самовиправленням, а також нові guided corpus discovery, multimedia UA+image, peer writing і gradual task sequencing. **Два різні рейтинги:** product-fit (корисність інтеграції/реалізації) і learning effectiveness (експертна оцінка очікуваного приросту навички). Жоден із них не є доведеним відсотком покращення, лабораторним effect size або шансом скласти YKI. Методи та реалізаційні критерії збережені для майбутньої розробки: **цей коміт не додає інтерфейс**. Нові висновки: AI-тренування не дорівнює офіційному оцінюванню; фінську довжину звуків перевіряти окремо на слух і у вимові; активне самовиправлення та оцінку на незнайомих завданнях вважати обов'язковими вимогами.

**[🎨 Бренд](brand/README.md)** · [💬 Позиціонування й місія](brand/brand-platform.md) · [🎛️ Візуальна система](brand/visual-system.md) · [📣 Маркетинг](brand/marketing.md) · [📚 Навчальний контент](learning/README.md)

> Незалежний освітній проєкт. Не є офіційним продуктом YKI, Opetushallitus чи University of Jyväskylä. Оцінки тренувань не є офіційними результатами іспиту.

**Мета:** YKI suomi, **keskitaso**, оцінка **3 / B1** (робоча ціль — стабільний B1+) на **10.04.2027**. Додаткові можливості — окремі модулі у травні/червні 2027. Початкова робоча гіпотеза рівня: приблизно **A2.2**, ще не підтверджена стандартизованою діагностикою.

Це **навчальна контентна база** для майбутнього застосунку (оригінальні вправи, ключі, тексти та аудіо) + довідкова документація. **Не** офіційний матеріал OPH. Основна мова пояснень — українська, вправи — фінською.

## 🆕 Свіжі повні матеріали: YKI B1 / A2.2 → B1

- **[High-yield B1 — реальні оригінальні завдання](learning/exercises/b1/high-yield/README.md):** 24 вправи на перефразування, 18 усних ситуацій з моделями і transfer, 6 письмових вправ з розбором типових помилок, 5 текстів із 20 запитаннями на зміст та логіку.
- **[VIERKO S2 — 3 повні PDF (125 сторінок)](knowledge/books/VIERKO-2024/README.md):** оригінальні відкриті матеріали про спілкування, інформаційні тексти і написання власних текстів. Перевірено, що всі 3 PDF **фізично є у `main`**. Ліцензія **CC BY-SA 4.0**, авторство VIERKO збережене.
- **[Audio library](assets/audio/README.md):** незалежні відкрито ліцензовані записи; офіційне YKI аудіо — як посилання, без несанкціонованих копій.

> Це навчальна база незалежного проєкту: оригінальні вправи не є офіційними питаннями YKI, а PDF VIERKO не є екзаменаційними збірниками. Вправи потребують teacher-level мовної редактури перед використанням для високовпливових рішень.


## 🎧 Новий пріоритет — довге аудіювання B1–B1+ (2–3 хвилини)

**85 фізично збережених аудіофайлів.** Найновіший комплект — **6 оригінальних сучасних B1/B1+ історій по 2:23** з точними фінськими TXT-транскриптами, WebVTT-субтитрами й **24 питаннями** із ключами. Окремо — **ціла аудіоказка живим фінським голосом 2:38** і повний друкований текст Project Gutenberg.

**[🎧 Відкрити всі 7 довгих треків і тексти](learning/exercises/b1/audio-long/README.md)** · [Аудіотеки й ліцензії](assets/audio/README.md) · [Усі 85 файлів](assets/audio/library.json)

Шість сучасних історій озвучені **синтетичним фінським голосом Piper Harri**, а казка — **людиною (Cygnaeus)**, однак літературною історичною мовою. Рівень оцінений попередньо, педагогічна перевірка носієм потрібна. Матеріали незалежні від офіційних іспитів YKI.

## 🚀 Відкрий самі навчальні матеріали

**Головний продукт цього репозиторію — [content/](learning/README.md), а не список джерел.** Перший самостійно створений банк: **9 тем / 54 комунікативні активності / 36 питань із відповідями / 54 chunks / 28 контекстних граматичних вправ / 8 діагностичних пунктів**. Вправи, тексти, сценарії та ключі доступні у [content/b1/](learning/exercises/b1/index.json). Для роботи застосунку — машинозчитувані JSON. Сценарії аудіювання потребують озвучення; вони чесно позначені як `script_only`.

**Поточна аудіотека:** [assets/audio/library.json](assets/audio/library.json) — **85 перевірених файлів**: 14 відкритих оригіналів, 12 нарізок, 15 інших людських уривків, 37 коротших синтетичних уроків, **6 нових довгих сучасних B1 аудіо** й **1 нова аудіоказка**. Сторонні офіційні MP3 YKI зберігаємо лише як посилання без права на копіювання.

[Реальні завдання](learning/README.md) · [Маніфест тем](learning/exercises/b1/index.json) · [Граматичні вправи](learning/exercises/b1/grammar/contextual-cloze.json) · [Стартова діагностика](learning/exercises/b1/diagnostics/baseline-v1.json) · [Правила перевірки](learning/CONTRIBUTING.md)

## 📚 Довідкова документація — правила й дослідження

| Порядок | Документ | Призначення |
|---|---|---|
| 1 | [Офіційні правила YKI 2027](research/yki/01-official-yki-2027.md) | Дати, формати, оцінки, реєстрація, громадянство |
| 2 | [Компетенції B1 і типи завдань](docs/02-b1-competencies.md) | Чотири навички, 9 тем, граматика, критерії |
| 3 | [Книги, курси, ресурси](knowledge/sources/03-resources-books-courses.md) | Перевірені посібники, курси, рекомендації закупівлі |
| 4 | [Наукові докази](research/pedagogy/04-evidence-and-learning-science.md) | Метааналізи, методики, межі доказовості |
| 5 | [Протокол підготовки](docs/05-study-system.md) | Щоденні місії, повторення, перевірка, симуляції |
| 6 | [Джерела і правила підтримки](knowledge/sources/06-sources-and-verification.md) | Канонічні URL, статуси перевірки, ризики |
| 7 | [Додаткові знахідки, 21.10.2026](knowledge/sources/07-new-yki-resources-2026-10.md) | Нові університетські курси, 70 безкоштовних завдань, розмовна фінська, додатки та застереження |
| 8 | [🎧 Аудіотека YKI](assets/audio/README.md) | Локальні відкрито-ліцензовані MP3/OGG, 13 офіційних демопосилань, атрибуція, імпорт |

## 🎯 Найближчі дії

1. Провести стартову **діагностику за всіма 4 навичками** без підказок.
2. Почати **20-хвилинні місії** щодня + один довший блок щотижня.
3. Вести реєстр **лише підтверджених проблемних слів, chunks і помилок**, повторювати адаптивно.
4. Навчатися через практичні ситуації, корекцію і перенесення навичок у **нову** задачу.
5. **08.03.2027 о 10:00 за Фінляндією:** реєстрація на повний YKI 10.04.2027 — зареєструватися відразу, якщо є місце.

## ⚖️ Правила достовірності

- **OFFICIAL** — вимоги OPH/Migri, документальна першість.
- **EVIDENCE** — висновки з наукових досліджень; дані про інші мови не прирівнювати до доказу успіху саме на YKI.
- **RECOMMENDATION** — педагогічні висновки / розклад / оцінки 0–100; це не офіційні критерії чи гарантії.
- **TO RECHECK** — ціни, доступність курсів, деталі цифрового інтерфейсу, які змінюються.
- Матеріали захищені авторським правом: зберігаємо власні конспекти й посилання, **не копіюємо** повні книги, платні вправи чи інструкції в репозиторій.

**Стан перевірки:** 2026-10-21. Повний текст платних книжок і закритих курсів не читався: висновки побудовано на доступних описах, офіційних фрагментах і відкритих джерелах.

## 📚 Evidence-to-engineering: книги + наука навчання (21.10.2026)

**[11 книжок, 13 наукових/практичних джерел → 13 конкретних рішень для застосунку](research/pedagogy/19-learning-books-to-engineering-2026-10.md)** · **[JSON реєстр із трасованістю до наявних 67 методик](research/pedagogy/learning-blueprints-books-v1.json)** · **[ТЗ LE-01…13 і AC-47…59](docs/15-two-modes-skill-scopes.md)**.

Нове рішення — не дублювати поради, а реалізувати **session engine**, який веде учня від незалежного retrieval через **meaning-first feedback** і guided self-repair до **нової ситуації без підказок і delayed review**. SRS 1/3/7/14/30 — прозорий тимчасовий baseline, не «оптимальна нейроформула». Книжки перевірені за відкритими дозволеними описами/авторськими уривками, повні захищені тексти не копіювалися. Новий full adaptive scheduler — **план**, не готова функція.

## 🔬 Повний офіційний аудит YKI → точна імітація (2026-10-21)

**[20 — OPH, Finlex, 4 SOLKI skill demos, B1/B2 рубрики, 9 тем і 6 мовних функцій](research/yki/20-yki-official-complete-audit-2026-10.md)** · **[21 — цифровий simulator state machine, 6 fidelity axes та EXV-01..20](docs/21-digital-yki-exam-simulator-executable-spec.md)** · **[40 доказово пов'язаних claims/15 невідомих](research/yki/official-yki-deep-audit-v2.json)** · **[13 форм завдань + 12 історичних зразків](research/yki/yki-official-patterns-v2.json)**.

У 2027 тест цифровий, але точні OPH UI/timers/audio/record/editing правила станом на жовтень 2026 ще **не публічно підтверджені**. Попередні SOLKI/2011 відповіді на паперових бланках — **legacy**, не digital-2027. Не заявляти «100% точна симуляція», доки evidence ledger + developer tests + teacher calibration це не підтвердять. Повних офіційних задач чи MP3 без прав у Git не копіюємо.

## 🏗️ Optimal stack / Architecture Decision Record (21.10.2026)

**[22 — повне 3-кратне архітектурне рішення](docs/22-optimal-stack-and-architecture-adr-2026-10.md)** · **[машинозчитуваний ADR](research/architecture/architecture-decision-v1.json)** · [ARCH-01…14](docs/15-two-modes-skill-scopes.md).

Рекомендований цільовий стек: **React 19 + TypeScript strict + Vite 8, Dexie/IndexedDB, XState v5 для екзамену та аудіо, PWA/Workbox, pnpm monorepo**. Пізніше за потреби: **Supabase PostgreSQL/Auth/Storage у конкретному регіоні ЄС + захищений AI gateway і durable long-job worker**. **Статус: спроєктовано, НЕ впроваджено**; нинішній working MVP лишається HTML/CSS/JS у `app/`. Переносити поетапно без втрати даних, аудіо, JSON контенту та достовірності екзаменаційного режиму.

## 🎮 Android game with all offline multimedia (ADR-023)

**[23 — повне ТЗ Android гри на 2–3GB, Play Asset Delivery, Phaser та Capacitor](docs/23-android-offline-game-and-3gb-media-architecture.md)** · **[машинозчитуваний контракт](research/architecture/android-game-distribution-v1.json)**.

Ціль: **дві платформи (Web PWA + Android гра)** зі спільними TypeScript навчальними/екзаменаційними алгоритмами, `Phaser` 2D story, NPC і місії, `Capacitor + Kotlin` native bridge, `AAB + install-time packs` для **всього ліцензованого релізного медіа** без дозавантажень після встановлення Google Play. Розмір **планується** ~2.6GB (не виміряний). Це **одна дія встановлення у Play**, не один інсталюємий APK на 3GB. Неліцензовані офіційні MP3/YouTube не включати. Поточна реалізація — лише веб-MVP; Android-сцени й AAB **ще не створені**.

### 🌐 Web/PWA — так само повноцінний продукт

Android із 2–3GB встановленого ліцензованого медіа **доповнює**, а не замінює Web: браузер і installable PWA підтримують ті самі **4 skills, адаптивне навчання, YKI exam mock, Phaser 2D NPC quests, словник, SRS, speaking і progress**. На Web мультимедіа — HTTPS stream і **обрані offline packs**, а **не обов'язкове початкове завантаження 3 GB**. Shared TypeScript content/domain, різні media providers, optional consented Web↔Android progress sync. [Повний контракт WEB-01…10](docs/23-android-offline-game-and-3gb-media-architecture.md#9-повний-вебзастосунок--та-сама-гра-а-не-скорочена-demo-версія-web-0110). **Це запланована архітектура**, поточний web MVP досі vanilla JS.

### 🔐 Reliability-first architecture ADR-024

[Production-ready target design: Room on Android, Dexie on Web, immutable exam attempts, crash recovery, native Play Asset Delivery, strict media rights](docs/24-reliability-hardened-architecture-web-android.md). **Це цільовий ADR, не готовий продукт**. Для критичних відповідей Android рекомендована Room/SQLite із Kotlin bridge; Web використовує IndexedDB/Dexie. Обидва мають один TypeScript event/content contract. Медіа 2–3GB не дублювати у БД, а Google Play може вимагати щонайменше подвійний запас місця для install-time packs.

## ✅ First implemented reliability slice — 22.10.2026

**[Implementation report: durable browser exam, typed storage/media contracts, Android Kotlin prototypes](docs/26-atomic-exam-and-media-implementation-2026-10.md)**

The working `app/exam.html` mini rehearsal now persists its answers and session in **transactional IndexedDB**; it blocks next/finish on failed writes, offers retry/export, handles legacy `localStorage` migration and detects stale or duplicate commands. Real Chromium IndexedDB integration and Node suites run in [CI](.github/workflows/validate-app-mvp.yml). `app/index.html` learning progress is still the original `localStorage` MVP.

Native [Kotlin Room and Media3 prototype](native/android/prototype/README.md) is source only and has **not** been compiled into an Android app; full Phaser/React migration, Play-installed 2–3GB packs, video native surface and YKI 2027 exact fidelity remain work to do. This is **actual incremental code progress**, not a claim of 95+ measured production readiness.

## 🧭 Stack × architecture integration plan — ADR-027 (22.10.2026)

**[ADR-027: verified baseline, cross-platform contract unification, compatibility ratings and release gates](docs/27-stack-architecture-compatibility-and-implementation-gates.md)** · **[G0–G6 implementation roadmap](docs/25-implementation-vertical-slice-roadmap.md)** · **[actual browser checkpoint implementation](docs/26-atomic-exam-and-media-implementation-2026-10.md)**.

**Target design-fit (editorial, not measured):** stack **95/100**, architecture **94/100**, compatibility **95/100**. Existing runnable UI is **vanilla JS**, not React/Phaser. Current exam drafts use IndexedDB; Learn still uses localStorage. Cross-platform Android Kotlin/Room and Media3 sources are **uncompiled prototypes**. The Android architecture uses **Room for valuable learner/exam data** (not the early Android Dexie choice in ADR-023); Web uses IndexedDB/Dexie. Distinguish `ExamCheckpoint` from immutable `FirstAttemptEvent` and prove parity via actual Android/Browser checks.

**Documentation is not implementation.** The next milestones require shared serializable commands, safe failure/recovery, runnable Web+Android vertical slice, real Play install-time >1GB media tests, editorially licensed Finnish lessons, then measured release QA. No Android AAB, bundled 2–3GB offline course or official YKI grading is claimed by these documents.
