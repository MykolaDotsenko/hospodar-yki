# Частотний словник — зовнішні ліцензовані дані

**Файл:** [yle-news-top10000-v1.1.1.tsv](yle-news-top10000-v1.1.1.tsv) — 10 000 записів (9 986 різних лем, оскільки окремі омоніми мають кілька POS-записів) фінської мови з класами слів та частотністю в корпусі новин 2011–2024.

**Завдання:** вихідний сигнал частотності для побудови персональних B1-словників Hospodar YKI. **Не** 10 000 готових навчальних карток; немає перекладів, рівнів CEFR, контекстів або teacher-approved прикладів. Частотність новин **не репрезентує** живу розмовну фінську; ранжувати практичні chunks окремо.

## Права, авторство та незмінність

Файл скопійовано **без модифікацій**, крім формату доставки GitHub як UTF-8 TSV, 21.10.2026 із фіксованого upstream commit `2def71452ca16b2f8861dfab015a22e3bead3673`.

> **Required attribution:** Yle Uutisten taajuussanakirja — a news-based Finnish frequency dictionary, Daniel Radice, CC BY 4.0. Derived from the Yle Finnish News Archive 2011–2024 (© Yle, CC BY 4.0, via Kielipankki) and the Kotus Nykysuomen sanalista (© Kotus, CC BY 4.0).

- **Ліцензія:** https://creativecommons.org/licenses/by/4.0/
- **Репозиторій і текст NOTICE:** https://github.com/danradice/yle-uutiset-taajuussanakirja/blob/main/NOTICE
- **Pin:** https://github.com/danradice/yle-uutiset-taajuussanakirja/tree/v1.1.1
- **DOI:** https://doi.org/10.5281/zenodo.22162057
- **Джерела:** Kotus — https://kotus.fi/sanakirjat/kielitoimiston-sanakirja/nykysuomen-sana-aineistot/nykysuomen-sanalista/ ; Yle News Archive через Kielipankki — https://www.kielipankki.fi/corpora/

**Перед продуктом:** source credit в UI/атрибуціях дистрибутиву, CEFR-рівні визначати окремо, відсіювати абревіатури/власні назви/рідкісну новинну лексику, не вигадувати перекладів для омонімів. Не копіювати текст статей Yle із цього словника (він містить тільки леми і статистику).

## Імпорт у застосунок

UTF-8 TSV, колонки `Hakusana`, `Sanaluokat`, `count`; `count` — ціла кількість вживань у корпусі, а не універсальна ймовірність чи рівень CEFR. Нормалізовані `lemma` і `pos` в окремій сховищній таблиці; ранги розраховувати з цього version-pinned джерела.
