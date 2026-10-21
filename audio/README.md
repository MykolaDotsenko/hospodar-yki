# 🎧 Hospodar YKI — реальна аудіотека

**Перевірено у GitHub main:** 21.10.2026  
**Мета:** слухання і говоріння A2.2 → B1+; матеріали не є офіційними тестами YKI.

## Що фактично є у репозиторії

| Тип | Кількість | Що відкрити |
|---|---:|---|
| Оригінальні аудіофайли | **14** | [audio/open/](open/) |
| Похідні короткі фрагменти | **12** | [audio/segments/](segments/) |
| **Усього реальних аудіофайлів** | **26** | [available.json](available.json) |

**Цифри перевірено за деревом GitHub.** `catalog.json` містить також ліцензовані *кандидати*, які Wikimedia могла заблокувати HTTP 429. **Не зараховувати ці URL як фізично завантажені записи.**

### Найкорисніші повні записи

- 🇫🇮 [Suomen kieli — johdanto (77 сек)](open/monologues/suomen_kieli_johdanto.ogg) — монолог про фінську мову (B1–B2), записав Vassilik, CC BY-SA 3.0.
- 🇫🇮 [Suomi — johdanto (129 сек)](open/monologues/suomi_johdanto.ogg) — про Фінляндію (B1–B2), Vassilik, CC BY-SA 3.0.
- 🔢 [Numerot 1–24 (50 сек)](open/listening/numerot_1_24.ogg) — сприйняття чисел на слух, Suomipoika, CC BY-SA 3.0.
- 🗣️ [Tapaaminen metroasemalla (51 сек)](open/dialogues/tapaaminen_metroasemalla.ogg) — реальна діалогова взаємодія, PD.
- 💬 [En tiedä](open/phrases/en_tieda.ogg), [En ymmärrä — інший диктор](open/phrases/en_ymmarra_alt.ogg), [Ei](open/phrases/ei.ogg) — короткі репліки для реакцій.
- 🎙️ [6 записів SKN](open/dialects/) — автентичні, але здебільшого **складніші за B1**, не основа YKI тренування.

### Короткі аудіофрагменти — нове

- [5 фрагментів Suomen kieli](segments/suomen_kieli_johdanto/) та [7 фрагментів Suomi](segments/suomi_johdanto/), підготовлені з використанням пауз у мовленні (переважно 15–20 сек).
- Для кожної частини є **джерело, автор, ліцензія, часові межі й SHA-256** у [segments/index.json](segments/index.json).
- Фрагменти — **похідні від двох оригіналів**, не окремі нові записи різних людей. Границі можуть потребувати людського аудіоредагування; транскрипти ще не підтверджені.

### Реальні навчальні сценарії

[learning-plan.json](learning-plan.json) — оригінальні інструкції фінською та рубрики українською для прослуховування, переказу, реакції й відтворення чисел. У подальшому застосунку ці завдання мають звертатися до [available.json](available.json), а не вважати будь-який запис у `catalog.json` доступним.

**Порада:** для YKI B1 тренувати розуміння суті й конкретних деталей, потім відповідати **без тексту** та повторити з іншою схожою ситуацією. Не показувати очікувану відповідь раніше першої самостійної спроби.

## Походження і ліцензії

| Джерело | Умови |
|---|---|
| Wikimedia Commons | Детальні file page / author / license — у [catalog.json](catalog.json); CC BY, CC BY-SA, CC0 чи public domain згідно з кожним **окремим** файлом. |
| SKN, Kotus/Kielipankki, GAIK | CC BY 4.0, авторство та специфіка — [GAIK NOTICE](https://github.com/GAIK-project/finnish-asr/blob/main/NOTICE.md) і [Kielipankki](https://urn.fi/urn:nbn:fi:lb-2020112937). |
| Нові 12 навчальних уривків | Від Vassilik / Wikimedia Commons; обрізання записів (зміна вказана в маніфесті); **CC BY-SA 3.0**: https://creativecommons.org/licenses/by-sa/3.0/. |
| Офіційні приклади YKI | 13 підтверджених прямих посилань у [catalog.json](catalog.json); **не копійовані**, бо немає дозволу на перепублікацію. |
| Yle / комерційні книги | Лише посилання, без незаконного завантаження. |
| Mozilla Common Voice | Хоча вказано CC0, поточні **умови набору забороняють re-host/re-share**, тому не копіювати. |

## Робочі скрипти

- [scripts/download_open_yki_audio.py](../scripts/download_open_yki_audio.py) — імпортує лише ліцензовані джерела; Wikimedia іноді відповідає HTTP 429.
- [scripts/build_listening_excerpts.py](../scripts/build_listening_excerpts.py) — створює уривки з локальних ліцензованих аудіо через `ffmpeg`/`ffprobe`, **без мережі**, з атрибуцією.
- [scripts/validate_audio_assets.py](../scripts/validate_audio_assets.py) — перевіряє фізичну наявність, формати, розмір, атрибуцію, батьківські записи та суми кількостей.

**Офіційні YKI listening / speaking:**
https://ykitesti.solki.jyu.fi/tutustu-testiin/testifin/keskitaso-puheen-ymmartaminen/  
https://ykitesti.solki.jyu.fi/tutustu-testiin/testifin/keskitaso-puhuminen/

Наша аудіотека — **навчальний ресурс**, а не копія нового цифрового іспиту 2027 року.
