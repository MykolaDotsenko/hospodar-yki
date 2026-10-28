# Граматика — авторські вправи та відкриті корпусні приклади

**R08 canonical case/meaning/stem 28.10.2026:** [14 оригінальних навчальних ЧЕРНЕТОК](r08-meaning-stems-original-drafts.json) розділяють вибір семантичного відмінка/рекції і творення словоформи (`vesi→vedessä`, `käsi→kädessä`, місце/напрямок/звідки, заперечений/цілісний об'єкт). **Усі 14 `editorial_draft_pending_S2_review` і `answerKeyReviewed=false`: не підключати до учня/іспиту.** Треба перевірити кожен ключ, альтернативи/діалекти, природність ситуації, відмінкову семантику й авторські права. [Науковий протокол №34](../../../../research/pedagogy/34-r08-finnish-case-stems-meaning-transfer-2026-10.md), [ізольований прототип перевірки](../../../../app/r08-grammar-core.mjs), [16 тестів схем/відповідей](../../../../app/tests/r08-grammar-core.test.mjs). Не є реплікою офіційного YKI; повні незалежні writing/speaking відповіді не оцінюються автоматично.

| Файл | Для чого | Правовий статус |
|---|---|---|
| [contextual-cloze.json](contextual-cloze.json) | Наші оригінальні YKI-подібні граматичні вправи | `project_original`, перевірка викладачем потрібна |
| [rektio-v1.json](../../../../knowledge/dictionaries/b1/rektio-v1.json) | 40 наші моделі дієслівного керування і речень | `project_original`, teacher pending |
| [ftb-frequency-cloze-v1.json](ftb-frequency-cloze-v1.json) | 120 справжніх корпусних речень/пропусків із граматичними тегами | **FIN-CLARIN, CC BY 4.0**, див. нижче; teacher pending |

## Attribution notice: FinnTreeBank

**FinnTreeBank 1 (FTB1U / UD Finnish-FTB)**, copyright FIN-CLARIN / University of Helsinki; dual license LGPLv3+ **or CC BY 4.0**, цього разу обрано **CC BY 4.0**. Ліцензія: https://creativecommons.org/licenses/by/4.0/ ; джерело: https://github.com/UniversalDependencies/UD_Finnish-FTB та оригінальний `LICENSE.txt`: https://github.com/UniversalDependencies/UD_Finnish-FTB/blob/master/LICENSE.txt. Official license registry: https://www.kielipankki.fi/lic/finntreebank-eng/finntreebank1-dual-license-eng/

Матеріал базується на FIN-CLARIN-анотаціях і прикладах **Iso suomen kielioppi (VISK)** — Auli Hakulinen, Maria Vilkuna, Riitta Korhonen, Vesa Koivisto, Tarja Riitta Heinonen, Irja Alho (2004). **Внесені зміни:** автоматично відібрано 120 речень із `fi_ftb-ud-test.conllu` з урахуванням частотності слів, нормалізовано пробіли перед пунктуацією, приховано одну словоформу, додано метадані та еталон із морфологічної анотації. Всі первинні речення та `source_sent_id` збережені в JSON.

Допоміжний частотний словник — **Daniel Radice, Yle Uutisten taajuussanakirja, CC BY 4.0**, на основі Yle Finnish News Archive 2011–2024 (© Yle / Kielipankki) і Kotus Nykysuomen sanalista (© Kotus): [права](../../../../knowledge/dictionaries/b1/frequency/README.md).

Речення не мають перевіреного рівня B1, деякі містять книжну лексику або незвичний контекст. Кожне — тільки **кандидат**, `assessment_eligible=false`, `teacher_review=pending_S2_teacher`. Перш ніж показувати його як якісний YKI-тренажер, потрібна редактура S2 і перевірка альтернативних правильних відповідей.

[Технічна перевірка](../../../../scripts/validate_ftb_corpus_bank.py) гарантує структуру, 8 категорій по 15, незмінність correct answer, ліцензійні поля, **не** мовну природність.
