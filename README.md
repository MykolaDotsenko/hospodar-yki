<p align="center">
  <img src="assets/images/brand/hospodar-yki-lockup.svg" alt="Hospodar YKI — логотип" width="640" />
</p>

# Hospodar YKI

**Фінська для життя. Впевненість для YKI.** Навчальний застосунок для україномовних дорослих: від A2.2 до B1/B1+ через практичні ситуації, активне пригадування й тренувальні завдання YKI.

> **Поточний стан:** робочий браузерний MVP на JavaScript із режимами **LEARN** і **EXAM**. Прогрес LEARN поки в `localStorage`; чернетки EXAM — в IndexedDB. React, Phaser, Android/Room, Play Asset Delivery і 2–3 GB офлайн-медіа залишаються планами або прототипами, **не готовими релізами**. Це не офіційний тест YKI.

## 🚀 Запустити Web MVP

Від кореня репозиторію:

```sh
python3 -m http.server 8080
# http://localhost:8080/app/      — навчання
# http://localhost:8080/app/exam.html — тренувальний іспит
```

Тести і перевірка розташування файлів:

```sh
node --test app/tests/*.test.mjs
node --test packages/contracts/tests/*.test.mjs
python3 scripts/validate_folder_layout.py
```

Повний порядок розробки — у [DEVELOPMENT](docs/DEVELOPMENT.md), тестові докази — у [TESTING](docs/TESTING.md).

## 🗂️ Де лежать **самі матеріали**

| Що потрібно | Фізична папка |
| --- | --- |
| 🖼️ Ілюстрації, фірмові SVG | [`assets/images/`](assets/images/README.md) |
| 🎧 Реальні й синтетичні аудіофайли, транскрипти, субтитри | [`assets/audio/`](assets/audio/README.md) |
| 🎬 Збережені ліцензовані відео | [`assets/video/`](assets/video/README.md) |
| ▶️ Посилання YouTube (без копіювання роликів) | [`sources/youtube/`](sources/youtube/README.md) |
| 🔗 Зовнішні аудіоджерела, видавці, офіційні демо | [`sources/`](sources/README.md) |
| 📚 Словники, chunks, граматичне керування | [`knowledge/dictionaries/`](knowledge/dictionaries/README.md) |
| 📖 Книги, курси, корпуси, зовнішні знання | [`knowledge/`](knowledge/README.md) |
| ✍️ Тематичні вправи, діалоги, YKI-практика | [`learning/exercises/`](learning/exercises/README.md) |
| 🗓️ Навчальні плани | [`learning/plans/`](learning/plans/README.md) |
| 🔬 Педагогіка, дизайн, UX, gameplay, user cases | [`research/`](research/README.md) |
| 🎨 Дизайн-токени, бренд і візуальні вимоги | [`brand/`](brand/README.md) |
| 💻 Вебзастосунок, Android-прототип, спільні контракти | [`app/`](app/README.md), [`native/`](native/android/prototype/README.md), [`packages/`](packages/contracts/package.json) |
| 🛠️ Архітектура, продуктове ТЗ, правила розробки | [`docs/`](docs/INDEX.md) |

[Повне дерево та правила розміщення файлів](docs/FOLDER-STRUCTURE.md) · [архітектура контенту](docs/CONTENT-ARCHITECTURE.md). **Додаткових реєстрів матеріалів немає:** тематичні папки — основний спосіб навігації. Робочі JSON навчальних даних і маніфести доступності медіа залишаються там, де їх використовує застосунок.

## 🧪 Якість і джерела

Оригінальні навчальні матеріали відрізняються від зовнішніх джерел. YouTube та офіційні приклади без окремих прав — **лише посилання**. Автоматично згенеровані фінські тексти й оцінювання вільного мовлення/письма потребують перевірки викладачем; тренувальні оцінки не рівнозначні офіційному результату YKI. Перевірки папок, контенту та медіа працюють у GitHub Actions, але не доводять Android production readiness.

[Як додавати уроки](learning/CONTRIBUTING.md) · [правила медіа](docs/SECURITY.md) · [джерела YKI](sources/official/README.md) · [дослідження методик](research/pedagogy/README.md).

## 🤖 Для розробників та AI-агентів

Спочатку [AGENTS.md](AGENTS.md), далі [карта документації](docs/INDEX.md), [архітектура](docs/ARCHITECTURE.md), [контракти](docs/CONTRACTS.md) і [тести](docs/TESTING.md). Для змін потрібні коректні шляхи, реальні тести, перевірка прав на медіа та PR-review; див. [CONTRIBUTING.md](CONTRIBUTING.md).

Попередні детальні огляди й хронологія впровадження збережені в [історичному архіві](docs/PROJECT-HISTORY-2026-10.md). Для актуального стану **відкривайте файли у відповідних папках**, а не старі датовані повідомлення.
