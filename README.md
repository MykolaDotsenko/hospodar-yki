<p align="center">
  <img src="assets/images/brand/hospodar-yki-lockup.svg" alt="Hospodar YKI" width="560" />
</p>

# Hospodar YKI

**Фінська для життя. Впевненість для YKI.** Навчальний застосунок для дорослих українців, які прагнуть перейти від **A2.2 до B1/B1+** і підготуватися до **YKI keskitaso**.

Є два режими: **LEARN** (практика з поясненнями й виправленнями) та **EXAM** (самостійна репетиція без підказок до завершення). Обидва охоплюють читання, аудіювання, письмо й говоріння. Цей проєкт **не є офіційним застосунком YKI**.

## 🚀 Запуск локального Web MVP

Потрібні Python 3.12+ та Node.js 22 (для тестів). Із кореня репозиторію:

```sh
python3 -m http.server 8080
```

Відкрити **[LEARN](http://localhost:8080/app/)** або **[EXAM](http://localhost:8080/app/exam.html)** у браузері. В іншому терміналі:

```sh
node --test app/tests/*.test.mjs
node --test packages/contracts/tests/*.test.mjs
python3 scripts/validate_folder_layout.py
python3 scripts/validate_ai_docs.py
```

Деталі: [запуск і внесення змін](docs/DEVELOPMENT.md), [тести та перевірки](docs/TESTING.md), [контракти збереження](docs/CONTRACTS.md).

## 🗂️ Де лежать справжні файли

| Папка | Що знайдете |
| --- | --- |
| [`app/`](app/README.md) | Працюючий Web MVP і unit/browser-тести |
| [`assets/images/`](assets/images/README.md) | SVG-логотипи; місце для майбутніх ілюстрацій |
| [`assets/audio/`](assets/audio/README.md) | Фінське OGG/MP3, транскрипти й субтитри |
| [`assets/video/`](assets/video/README.md) | Реально збережені ліцензовані WebM |
| [`sources/youtube/`](sources/youtube/README.md) | YouTube-посилання й таймкоди, **без завантажених відео** |
| [`sources/audio/`](sources/audio/README.md), [`sources/official/`](sources/official/README.md), [`sources/publishers/`](sources/publishers/README.md) | Зовнішні аудіо, офіційні демонстрації, видавці та права |
| [`knowledge/dictionaries/`](knowledge/dictionaries/README.md) | Контекстні chunks, частотність слів, rektio |
| [`knowledge/books/`](knowledge/books/README.md) | Локальні PDF із правами використання |
| [`sources/learning/`](sources/learning/README.md) | Джерела знань, підручники, курси й корпуси |
| [`learning/exercises/`](learning/exercises/README.md) | Теми, діалоги, граматика, чотири навички, іспитові репетиції |
| [`learning/plans/`](learning/plans/README.md) | Навчальні послідовності, плани аудіювання |
| [`research/`](research/README.md) | Дослідження педагогіки, дизайну, UX, геймплею, user cases, YKI й архітектури |
| [`brand/`](brand/README.md) | Візуальні правила, тексти, токени та позиціонування |
| [`docs/`](docs/INDEX.md) | Продуктові вимоги, технічні рішення, стандарти розробки |
| [`scripts/`](scripts/validate_folder_layout.py) | Генератори, імпортери й валідатори |
| [`native/android/prototype/`](native/android/prototype/README.md) | **Лише вихідні Kotlin-прототипи**, не зібраний APK/AAB |

**[Повне дерево папок і правила розміщення](docs/FOLDER-STRUCTURE.md).** Кожен матеріал зберігається в одній тематичній папці. Додаткового глобального реєстру немає; JSON-файли поруч з уроками/аудіо — потрібні застосунку для завантаження матеріалів.

## 🔎 Реальний стан функціональності

| Реалізовано частково | Ще не реалізовано / не підтверджено |
| --- | --- |
| Vanilla JavaScript Web LEARN/EXAM MVP | React/Vite/Phaser повноцінний клієнт |
| EXAM IndexedDB checkpoints і тести браузерного збереження | Спільний production-ready Web/Android протокол першої спроби |
| LEARN зі збереженням у `localStorage` | Durable Web LEARN storage та міграція |
| Локальне фінське аудіо, окремі WebM і вправи | Готовий встановлюваний Android AAB, Play Asset Delivery, 2–3 GB офлайн |
| Курований YouTube URL-каталог | Автоматична оцінка незрецензованих письмових/усних відповідей як офіційний YKI результат |

**Мовна якість та права:** частина вправ і відеозавдань потребує S2/редакторської перевірки. Джерело, доступність посилання та право на копіювання — різні речі. Зовнішні матеріали не включаємо в офлайн-пакети без права на поширення.

## 📋 Швидкі інструкції за завданням

- [Чинна й цільова архітектура / рішення ADR](docs/architecture/README.md) — що реально працює та які рішення діють.
- [Безпечна міграція React/Vite/TypeScript → Android Room/PAD](docs/guides/WEB-ANDROID-MIGRATION.md) — покрокові gates без удаваної готовності.
- [Як додавати вправи, словники та медіа](docs/guides/CONTENT-AUTHORING.md) — права, якість фінської й тести.
- [CI, безпека змін і release evidence](docs/operations/CI-QUALITY-GATES.md) · [межі ліцензування](LICENSING.md).

## 🧠 Наукові методики → результат навчання

[Програма дослідження методів, пам'яті та уваги](research/RESEARCH-PROGRAM.md) · [Критичний огляд звуку, візуальних ефектів і когнітивного навчання](research/pedagogy/22-memory-attention-sensory-learning-evidence-2026-10.md) · [Як вимірювати реальне запам'ятовування](research/ux/learning-impact-evaluation-protocol.md) · [Як переносити докази в UI/UX](docs/guides/EVIDENCE-TO-UX.md).

Мета — відкладене самостійне використання фінської, а не декоративна гейміфікація чи неперевірені твердження «найкращий у світі». Поки що це **дослідження та процес**, а не підтверджена ефективність нашого застосунку.

## 🛠️ Документація для розробника й AI

[AGENTS.md](AGENTS.md) — головні правила роботи агентів · [внесення змін](CONTRIBUTING.md) · [документація](docs/INDEX.md) · [архітектура](docs/ARCHITECTURE.md) · [політика контенту й папок](docs/CONTENT-ARCHITECTURE.md) · [тести](docs/TESTING.md) · [privacy/security](docs/SECURITY.md) · [випуск і відкат](docs/RELEASE.md).

Основні архітектурні рішення: [**Optimal stack / Architecture Decision Record**](docs/22-optimal-stack-and-architecture-adr-2026-10.md) ([`research/architecture/architecture-decision-v1.json`](research/architecture/architecture-decision-v1.json)); [**Android game with all offline multimedia**](docs/23-android-offline-game-and-3gb-media-architecture.md) ([`research/architecture/android-game-distribution-v1.json`](research/architecture/android-game-distribution-v1.json)); [**Reliability-first architecture ADR-024**](docs/24-reliability-hardened-architecture-web-android.md); [**Evidence-to-engineering**](research/pedagogy/19-learning-books-to-engineering-2026-10.md) ([`research/pedagogy/learning-blueprints-books-v1.json`](research/pedagogy/learning-blueprints-books-v1.json)); [**Повний офіційний аудит YKI**](research/yki/20-yki-official-complete-audit-2026-10.md).

[Історія досліджень та оновлень за жовтень 2026](docs/history/2026-10-product-development-log.md) збережена окремо, щоб не перевантажувати головну сторінку.

**Правило:** документація описує ціль, але готовність функції доводять тільки реальний код, тести, браузерні/Android-перевірки й ліцензійні дозволи.

## G1 implementation status (2026-10-23)

The current browser YKI exam still uses V1 local IndexedDB; ambiguous lost acknowledgments now require an exact saved event receipt. A **separate** [experimental V2 IndexedDB implementation](app/session-v2-idb.mjs) and [portable command fixtures](packages/contracts/fixtures/v2-golden.json) demonstrate durable first-attempt uniqueness and revision/duplicate handling in Chromium. **No automatic data migration, active learning UI switch or compiled Android parity** is claimed. See [G1 evidence](docs/architecture/G1-IMPLEMENTATION.md) and [AST architecture gate](tools/architecture/check-boundaries.mjs).
