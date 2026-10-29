# 20 — Повний аудит офіційної структури YKI suomi keskitaso та зразків (2026→2027)

**Перевірено 21.10.2026, версія 1.0.0.** Об'єкт: **suomi / keskitaso / чотири навички**. Мета: доказова основа для максимально точної репетиції **цифрового YKI весни 2027** в Hospodar YKI.  
**Не є:** офіційним збірником екзаменаційних завдань, розкриттям секретного test bank, копією UI, затвердженим прогнозом оцінки або підтвердженням параметрів ПЗ 2027.  
**Зв'язки:** [13 — попередній огляд](13-yki-exam-format-and-real-examples-2027.md) · [14 — digital fidelity v1](../../docs/14-digital-yki-fidelity-spec.md) · [21 — runtime state machine v2](../../docs/21-digital-yki-exam-simulator-executable-spec.md) · [JSON evidence+source register](official-yki-deep-audit-v2.json) · [JSON task-pattern catalogue](yki-official-patterns-v2.json).

## 1. КЛАСИ ДОКАЗІВ — обов'язково

| Клас | Що означає | Що дозволено в застосунку |
|---|---|---|
| **OFFICIAL_CURRENT** | OPH сторінка 2026 + календар spring 2027 | Відтворювати *факт*, без удавання що знаємо невідомий UI |
| **LEGAL_FOUNDATION_2011** | Офіційні `Yleisten kielitutkintojen perusteet`, постанова **30.11.2011**, чинність від 01.12.2011 згідно архіву Finlex | Контентна модель: функції мови, 4 навички, типи текстів, B1/B2, загальне оцінювання |
| **HISTORICAL_OFFICIAL_SAMPLE** | Університетські SOLKI демонстрації 2016-era із **паперовими** вказівками, аудіо та конкретними прикладами секунд | Копіювати **структуру вправ як оригінальні власні задачі**; час на *прикладі* тільки як демо з написом «історичний зразок» |
| **OFFICIAL_RUBRIC** | OPH PDF rubrics для speaking/writing, окремо `taso 3` і `taso 4` | Калібрувати критерії та hand-review; не конвертувати в готовий автоматичний YKI grade |
| **THIRD_PARTY_TRAINING** | Yle, курси, підручники, відео | Практика і натхнення, **не** доказ формату |
| **UNVERIFIED_DIGITAL_2027** | OPH не оприлюднила точний параметр у доступному джерелі | `null` у `official_profile`, UX *practice only*, активна переперевірка |

### Знайдена невідповідність року нормативного PDF

На сторінці OPH **Ennen YKI-testiä** додаток підписаний `Yleisten kielitutkintojen perusteet 2026`, але пряме PDF посилання веде до файлу [yleisten-kielitutkintojen-perusteet-2011.pdf](https://www.oph.fi/sites/default/files/documents/yleisten-kielitutkintojen-perusteet-2011.pdf), документ `DNO 24/011/2011`, наказ **30.11.2011** із чинністю від **01.12.2011**, як підтверджено [Finlex](https://www.finlex.fi/fi/viranomaiset/maarayskokoelmat/opetushallitus/2011/39607). **Не** документ 2026-видання; відображати `source_document_year=2011`, `link_label_on_OPH=2026`, `verification=follow_up_if_amended`. PDF описує *історичну студійну/паперову процедуру*, що може не відповідати digital-2027.

**Ліцензійна політика:** зберігаємо самостійні конспекти, коротку метаінформацію та **прямі URL** на офіційні приклади і MP3. Не копіюємо у відкритий Git чужі тексти, повні аудіозаписи, screenshot exam UI чи закриті пробні завдання без дозволу. Розміщення у відкритому доступі ≠ ліцензія на перепублікацію.

## 2. ВСТАНОВЛЕНІ ОФІЦІЙНІ ФАКТИ

1. Усі YKI для фінської мають 4 окремі навички: **Puheen ymmärtäminen**, **Puhuminen**, **Tekstin ymmärtäminen**, **Kirjoittaminen**. Кожна отримує окрему оцінку, **немає офіційного загального 100-бального результату**. [OPH](https://www.oph.fi/fi/koulutus-ja-tutkinnot/kieli-ja-kaantajatutkinnot/yleiset-kielitutkinnot-yki).
2. `keskitaso` 3 = **B1**, 4 = **B2**. Сертифікат може також містити `alle 3` або `ei voida arvioida` для відповідного модуля. Це **не** математична межа % MCQ. [OPH selection](https://www.oph.fi/fi/koulutus-ja-tutkinnot/sopivan-yki-testin-valinta-ja-testipaivat) та [OPH 2011 basis §8](https://www.oph.fi/sites/default/files/documents/yleisten-kielitutkintojen-perusteet-2011.pdf).
3. Усі **весняні 2027 тести фінської — цифрові** (у тому числі 10.04.2027, всі 4 модулі). [Календар OPH](https://www.oph.fi/en/education-and-qualifications/selecting-right-yki-test-test-days).
4. За [OPH пілотом 18.09.2026](https://www.oph.fi/fi/uutiset/2026/yki-digitestia-kokeillaan-marraskuussa-2026), екзамен на **комп'ютері в центрі**, учаснику **не потрібен власний комп'ютер**. Завдання **аналогічні за суттю** паперовим. Листопад 2026 — пілот, результати/точний UX після пілота ще не оприлюднені станом на 21.10.
5. **Завдання, інструкції фінського YKI — фінською**. Українські пояснення тільки в навчальному режимі. [OPH](https://www.oph.fi/fi/koulutus-ja-tutkinnot/sopivan-yki-testin-valinta-ja-testipaivat).
6. У нормативному PDF §6 описано: **listening** (дискусії, інтерв'ю, авто-відповідач, оголошення, новини, реклама; gist/details/global), **speaking** (симульовані діалоги, реакції, думка, розповідь), **reading** (листи, повідомлення, оголошення, реклама, новини, розповіді; тексти різних довжин), **writing** (три різножанрові тексти — повідомлення, лист, думка, скарга, заява; завдання керовані й можуть мати допоміжні матеріали). [§6, нормативний документ 2011](https://www.oph.fi/sites/default/files/documents/yleisten-kielitutkintojen-perusteet-2011.pdf).
7. §7: завдання на розуміння оцінюються **балами**, потім інтерпретуються в `taitotaso`; продуктивні — **критеріально** підготовленими оцінювачами. Немає опублікованої стабільної універсальної шкали `MCQ 65%=YKI3`. [2011 §7](https://www.oph.fi/sites/default/files/documents/yleisten-kielitutkintojen-perusteet-2011.pdf).
8. Порушення оцінювання: відсутній осмислений speaking response, ігнорування теми або невиконані частини можуть перешкодити валідній оцінці. Не рахувати порожнє аудіо/ASR success як proficiency.
9. Не ототожнювати OPH загальну сторінку, що досі описує **оптичні бланки, олівець** і паперові зошити, із фактичним 2027 digitesti.

## 3. ОФІЦІЙНІ ТЕМИ Й КОМУНІКАТИВНІ ФУНКЦІЇ (з нормативних §§4–5 / додатків 2–3)

| Topic ID | Фінська назва | Практичні жанри для оригінального YKI bank |
|---|---|---|
| T01 | **Minä ja taustani** | знайомство, родина, навчання, робота, хобі; важливі події/мотиви |
| T02 | **Koti ja asuminen** | житло, оренда, ремонт, домоуправитель, проблеми вдома, район |
| T03 | **Kauppa ja palvelut** | покупки, банк, пошта, рахунок, повернення, скарга, платежі |
| T04 | **Kulttuuri** | бібліотека, театр, кіно, медіа, спортивні події, хобі |
| T05 | **Matkustaminen** | квитки, затримки, транспорт, готель, план маршруту, загублені речі |
| T06 | **Terveys ja hyvinvointi** | самопочуття, аптека, лікар, інструкція, відпустка за хворобою |
| T07 | **Työ** | умови, графік, колеги, зарплата, завдання, вакансія, робочий лист |
| T08 | **Ympäristö** | природа, погода, сортування сміття, довкілля, клімат |
| T09 | **Yhteiskunta** | школа, послуги міста, громадське життя, базові суспільні питання |

**Це тематична рамка**, а не дев'ять тем у кожному окремому тесті. З нормативного документа §4, додаток 2 (PDF сторінки 10–13; завдання різної складності на різних рівнях).

6 функцій мови з §5 / додатка 3:
- **F01 Tietojen antaminen, selostaminen ja kysyminen** — описати, повідомити, уточнити, запитати.
- **F02 Mielipiteiden ja asenteiden ilmaiseminen** — погодитися/заперечити, аргументувати, оцінити.
- **F03 Tunteiden ilmaiseminen ja kysyminen** — реакції, задоволення, подяка, занепокоєння.
- **F04 Asioiden hoitaminen** — попросити, замовити, поскаржитися, домовитися, дати пораду.
- **F05 Sosiaalisten käytänteiden ja normien mukaan toimiminen** — ввічливість, вибачення, привітання, початок/кінець розмови.
- **F06 Viestinnän säätely** — просити повторити, уточнити, перевірити розуміння, відреагувати природно.

**Content rule:** збирати банк за матрицею `topic × communicative_function × genre × skill × difficulty_hint`, **не** генерувати лише граматичні cloze; одна ситуація може повторюватися в різних навичках навчання, але **unseen exam bank ізольований**.

## 4. READING — офіційні SOLKI приклади

**Джерело:** https://ykitesti.solki.jyu.fi/tutustu-testiin/testifin/keskitaso-tekstin-ymmartaminen/ (історичне SOLKI demo; **НЕ** офіційний екзаменаційний банк).

**Форми відповіді**: `multiple_choice_one_correct` (у зразках 3 варіанти A/B/C), `true_false_one_correct`, `open_short_response`. За історичними правилами: помилки в MCQ не штрафувалися, правильна лише одна відповідь, open відповіді писали в зошит. **Не моделювати паперовий зошит та оптичну форму в digitesti 2027**.

**Виявлені конкретні приклади/жанри:**
- `R-EX1`: **«Eläimet harjoittelevat elämää varten»** — новинно-популярний текст про гру тварин, 4 MCQ (вміти знаходити gist, причинний зв'язок і detail).
- `R-EX2`: **«Talkoisiin!»** — суспільний коментар про волонтерство, 7 MCQ, синонімічні варіанти й висновки.
- `R-EX3`: коментар/листа до редакції, інформативні тексти, MCQ/T-F/open у демо-колекції — перевіряти конкретний item layout на оригіналі.
- `R-EX4`: **«Veroilmoitus»** — повідомлення про податкову декларацію, зразок 2, 4 MCQ (читати інструкцію/умови, inference у побутовій бюрократії).
- Не усереднювати кількість 4/7 по усіх майбутніх тестах; `reading_items_count_official_2027=null`.

**Fidelity model:** завдання показує фрагмент тексту з відповідними питаннями й дистракторами; відповіді зберігаються локально, навіть якщо користувач пропускає. Навмисно не додавати «переклад українською» чи кольорову граматику в exam, навіть якщо в learn це корисно.

## 5. LISTENING — офіційні SOLKI приклади, аудіо та послідовність

**Джерело:** https://ykitesti.solki.jyu.fi/tutustu-testiin/testifin/keskitaso-puheen-ymmartaminen/

Історична демонстрація: відповісти на всі завдання; MCQ та true/false мають один правильний варіант, штраф за неправильний не зазначено. Зразок прямо каже, що на *тому паперовому форматі* аудіювання keskitaso слухали **двічі**, існував час на підготовку та відповіді, а наприкінці **10 хв на перенесення відповідей у бланк**. **Це НЕ підтверджені правила цифрового 2027**.

| Каталог | Що зафіксовано у SOLKI зразку | Правило в майбутньому коді |
|---|---|---|
| `L-EX1` | Interview **Yksityisetsivä**, **4 MCQ**, audio file [suktpy083.mp3](https://ykitesti.solki.jyu.fi/wp-content/uploads/2016/06/suktpy083.mp3); опис: повністю, потім дві частини, в окремому зразку `30s` на відповіді частини | `play_sequence=[full,segment1,segment2]` лише для **legacy demo profile**, не глобальний digital |
| `L-EX2` | Interview / report **Jumbo-Roope** про утилізацію/сміття, **6 MCQ**, [suktpy109.mp3](https://ykitesti.solki.jyu.fi/wp-content/uploads/2016/06/suktpy109.mp3) | Два різні способи перевірки gist/detail/inference, не підставляти TTS замість оригіналу без маркування |

**Інженерно:** першокласні об'єкти `AudioAsset` (source URL, rights status, speakers, duration verified/unknown, language register, checksum if licensed), `PlaybackPolicy` (legacy/demo/digital_verified), `QuestionWindow`, `Transcript` (learn-only, provenance). Усі цифрові правила playback, auto-next, auto-repeat, scrubbing мають `OFFICIAL_CONFIRMED` або вимкнений `strict` прапорець. Модель не може вважати TTS з однією особою еквівалентом реального багатоголосого B1.

## 6. SPEAKING — найкорисніші виміряні зразки SOLKI

**Джерело:** https://ykitesti.solki.jyu.fi/tutustu-testiin/testifin/keskitaso-puhuminen/  
Демо містить 4 сімейства. Усі наступні секунди — **тільки для конкретних історичних прикладів**, а не загальний fixed таймінг YKI-2027.

1. **Kertominen:** про важливу людину. Зразок дає **60 секунд підготовки**, **90 секунд розповіді**, починати після аудіо-сигналу. Audio [Kertominen-1-KT-PU.mp3](https://ykitesti.solki.jyu.fi/wp-content/uploads/2016/06/Kertominen-1-KT-PU.mp3).
2. **Keskustelu (1):** телефонна розмова про оренду зали для свята; репліки іншої людини в аудіо, власні часові вікна `[20,20,10,15,20,10,10]` секунд. [Keskustelu-1-KT-PU.mp3](https://ykitesti.solki.jyu.fi/wp-content/uploads/2016/06/Keskustelu-1-KT-PU.mp3). Для точного clip windows не вигадувати, де саме в audio починається відповідь: потрібна timing annotation.
3. **Keskustelu (2):** телефонний дзвінок щодо продажу речі, зразкові reply windows `[10,20,20,20,20,25,10]`, [Keskustelu-2-KT-PU.mp3](https://ykitesti.solki.jyu.fi/wp-content/uploads/2016/06/Keskustelu-2-KT-PU.mp3).
4. **Tilanteita:** п'ять життєвих ситуацій, demo **20 секунд підготовки на ситуацію**; відповіді: `[20,30,30,30,30]` секунд. Приклади: недавня погода; поїзд; запізнення на свято; попросити препарат в аптеці; поскаржитися на ремонт. Офіційні audio links на [сторінці SOLKI](https://ykitesti.solki.jyu.fi/tutustu-testiin/testifin/keskitaso-puhuminen/).
5. **Mielipide / puheenvuoro:** вибір однієї з **двох тем** (сімейні фінанси / реклама ліків), **120 секунд відповіді**, аргументувати вибір. [Puheenvuoro-KT-PU.mp3](https://ykitesti.solki.jyu.fi/wp-content/uploads/2016/06/Puheenvuoro-KT-PU.mp3).

Під час діалогу важливе **turn-taking**: не лише «говорити 2 хвилини», а реагувати на аудіо-репліку іншої особи, уточнювати, підтримувати тему, змінювати тон. Для voice simulator `intro→listen_peer→beep→record_window→listen_peer...`, permission first, microphone test, consent, dropouts/recording recover, no AI grading solely from ASR.

**Не переносити** твердження «kielistudio», «те саме beep», «точно така послідовність і довжина» у непідтверджений digitesti 2027.

## 7. WRITING — три тексти за нормативним документом, конкретні SOLKI зразки

**Джерела:** [SOLKI intermediate writing current demo](https://ykitesti.solki.jyu.fi/tutustu-testiin/testifin/keskitaso-kirjoittaminen/) та [альтернативний офіційний інтерфейс архіву](https://ykitesti2.solki.jyu.fi/ykitesti2/web/en/node/21).

- Нормативний §6.4: **три різні керовані письмові тексти**; можливі жанри **viesti, kirje, mielipide, valitus, hakemus**. Це **reference construct**, не твердження що digital-2027 має ті самі 3 екранні форми/час.
- **Офіційний demo W-EX1 — formal email про ремонт ванної:** звернення до `isännöitsijä`, пояснити поточний стан, потрібні зміни/причину, планований графік, контакти, ще 2 додаткових пункти, відповідний початок/кінець. Це **особливо корисний genre template** (правильність — чи виконав комунікативне завдання, ввічливість, зв'язність, доречний стиль), не зберігати повний prompt.
- **W-EX2 — opinion post:** вибрати **одну з двох тем** (догляд за малою дитиною вдома/садок; сучасна мода), висловити чітку позицію та щонайменше **три обґрунтування** у прикладі.
- На сторінці SOLKI є вказівка **зробити всі завдання** та **писати розбірливо від руки** — друге є **legacy paper-only**.
- **Не вигадувати** мінімальний/максимальний word count, перехід назад, autosave, spellcheck, character limits, копіювання/вставлення в digitesti; в mock ці параметри **practice defaults з маркуванням**.

## 8. ASSESSMENT — окремі рубрики B1 (taso 3) / B2 (taso 4)

**Джерела:** [OPH speaking rubric PDF](https://www.oph.fi/sites/default/files/documents/Puhumisen_arviointikriteerit.pdf), [OPH writing rubric PDF](https://www.oph.fi/sites/default/files/documents/Kirjoittamisen_arviointikriteerit.pdf), §7 [основи 2011](https://www.oph.fi/sites/default/files/documents/yleisten-kielitutkintojen-perusteet-2011.pdf). Власний переказ, **не** копіювання всієї таблиці критеріїв.

**Speaking domains:** `sujuvuus` (плавність), `joustavuus` (гнучкість і відповідність ситуації), `koherenssi/sidosteisuus`, `ilmaisun tarkkuus/laajuus/idiomaattisuus`, `ääntäminen/fonologinen hallinta`, `rakenteiden tarkkuus`.

- **Taso 3 (B1):** зрозуміле повсякденне висловлювання, здатність ініціювати базове спілкування; паузи допустимі; лексика й вимова можуть мати відхилення, якщо адресат розуміє. Структура не має бути ідеальною.
- **Taso 4 (B2):** ширша, точніша й незалежніша мова, краща зв'язність, **офіційний/неофіційний регістр** і відповідне переключення.
- Підсумок — **цілісне критеріальне судження**, а не середнє арифметичне від шести полів і не ASR word error rate.

**Writing domains:** `joustavuus`, `koherenssi/sidosteisuus`, `ilmaisun tarkkuus/laajuus/idiomaattisuus`, `rakenteiden tarkkuus`, `tiedon välittäminen`, `luova kirjoittaminen`, `raportti/essee/mielipide`.

- **Taso 3 (B1):** прості зв'язні тексти на знайомі теми, загалом зрозумілий намір; неточності й нестандартні мовні структури можуть переривати читання.
- **Taso 4 (B2):** більша точність і зв'язність, гнучкіше налаштування під адресата, більше впорядкованої аргументації.
- Окремо `task_completion`, `must_include_points`, `register` і фактична цілісність повідомлення. **Жодних «3 граматичні помилки = YKI3» чи «180 слів = B2».**
- AI може сформувати **рекомендаційний feedback з uncertainty / needs_human_review**, не офіційний `taitotaso`. Для confidence-level потрібні калібровані людські anchors та validation study.

**Reading/listening:** кілька типів питань можуть бути автоматично перевірені за авторським ключем; free text потребує списку допустимих варіантів і ручного аудиту, якщо meaning-based. **Немає** підтвердженої універсальної official cut-score таблиці `score%→3/4`.

## 9. ПРАВИЛА ЕКЗАМЕНАЦІЙНОГО ДНЯ — не плутати з інтерфейсом

[OPH Ennen YKI-testiä](https://www.oph.fi/fi/koulutus-ja-tutkinnot/ennen-yki-testia) публікує:

- тестовий центр повідомляє **точну адресу й час** окремо, не виводити час старту з дати у календарі;
- **запізнення** означає недопуск на повний тест або вже розпочатий осакое;
- потрібен **оригінал чинного ID**, наприклад паспорт, національна ID-картка, картка дозволу на проживання. **Водійське посвідчення не приймається, фотографії ID не вистачає**;
- на загальній сторінці `perus/keskitaso` день приблизно **5 годин із перервами**, проте сторінка включає паперову процедуру. Для точного дня **цифрового 2027** — отримати локальні інструкції;
- електронні пристрої заборонені під час тестового дня, включно з паузами (телефон, годинник та інші), їжа на перерві дозволена, користування словником і матеріалами заборонено;
- учасник має виконувати інструкції, не знімати/копіювати завдання, не забирати матеріали.
- OPH пояснює, що **екзаменаційні приклади SOLKI — приклади типів завдань**, не справжні іспитові тестові завдання.
- [OPH results](https://www.oph.fi/fi/koulutus-ja-tutkinnot/yki-testin-jalkeen): приблизно **2 місяці** до результату; оцінка незалежна за чотирма навичками. Цифровий сертифікат у Oma Opintopolku за окремих умов.

## 10. ЩО САМЕ ЗАЛИШАЄТЬСЯ НЕВІДОМИМ НА 21.10.2026

| ID | Не підтверджено цифровими документами OPH | Дозволене тимчасове рішення |
|---|---|---|
| U01 | вигляд та порядок screens, location nav/back/forward | original UI, чесне маркування `training approximation` |
| U02 | час **кожного** digital subtest, preps, breaks, auto submit | nullable official timers, `training timer` добровільний |
| U03 | кількість і порядок питань на 2027 | adjustable practice bank; офіційний count `null` |
| U04 | digital listening: кількість прослуховувань, сегментація, перемотування, автоматичний запуск, навушники | sample-specific legacy preview, digital policy unknown |
| U05 | digital speaking: мікрофон/навушники, audio cue, permission, автоматична фіксація, replay | local user permission + recording practice; digital match unverified |
| U06 | writing editor: чернетки, word counter, save, copy/paste, spellcheck, keyboard | simple original keyboard input, avoid verified claim |
| U07 | таймер на одному екрані/вгорі, збереження при network loss | robust autosave тільки наша **implementation practice** |
| U08 | accuracy weights, scoring thresholds, exact B1/B2 cutoffs | `not official grade`; рубрика-подібний coaching/human calibration |
| U09 | special arrangements як працюють у digitesti UI | refer OPH application; simulate optional accessibility profile only |
| U10 | точний 2027 тест-центр hardware/setup, перехід між модулями | center-specific instructions, no assumptions |

**Post-pilot watcher:** після **07.11.2026** (suomi pilot) відкрити OPH новини, офіційний лист учаснику/інструкцію центру, demo platform release; кожен підтверджений параметр перетворити з `null` у `confirmed` із URL, датою і CI fixtures. Якщо такого матеріалу немає — залишити `null` навіть після 01.01.2027. Питання про точні UI rule можна адресувати OPH / SOLKI, але **не** приписувати їм неотриману відповідь.

## 11. COPYRIGHT, ПРОВІРКА ДЖЕРЕЛ І ЯКІСТЬ ЗРАЗКІВ

- **OFFICIAL demo** ≠ official live exam questions; джерело стає `historical_sample`, задачі з нього **не** входять у наш власний scoring bank.
- У repo — посилання та короткий аналіз метаданих і типів, **не** mass download копій SOLKI/Yle MP3 чи цілих текстів; авторські права перевіряти перед використанням у продукті.
- Банк оригінальних вправ — два набори: `calibration/rehearsal` і **held-out independent evaluation**. Якщо користувач бачив задачу, `unseen=false`, навіть якщо змінилася назва кнопки.
- Голос: розпізнавання відповіді ≠ оцінка інтонації, плавності, достатності комунікативного наміру; потрібен 2-оцінювачний calibration.
- Скрипти мають відхиляти `official_2027_exact`, якщо `unverified` field у profile не `confirmed`. Детальні контрактні стани, mock UX, тестові сценарії: [21 — implementation spec](../../docs/21-digital-yki-exam-simulator-executable-spec.md).

### Висновок

**У нас є підтверджений предмет іспиту, типи завдань, історичні зразки та критерії рівнів 3/4, але немає відкритої точної інструкції керування цифровим ПЗ після ще майбутнього листопадового пілоту.** Побудувати **достовірний за навичками/жанрами** симулятор можливо зараз; назвати його **ідентичним official 2027 digital YKI** поки неможливо, і це має контролювати код, а не маркетинг.


---

## R02 deep follow-up — 28.10.2026: OPH digital YKI 2027, eight dates, demos and fail-closed quality gate

**Scope and status:** **FIRST-PARTY WEB RESEARCH COMPLETED; FOUR INS PERA DEMO LINKS VERIFIED ON OPH; DEMO UI NOT OBSERVED; PILOT NOT YET OCCURRED; LIVE 2027 F4/F5/F6 NOT VERIFIED.** Це предметна робота з [послідовної програми R01→R12](../29-twelve-product-research-studies-execution-2026-10.md), а не створення нового набору методів чи затвердження сертифікації. Дата фактичної перевірки офіційних джерел: **28 жовтня 2026**. Тексти/медіа реальних демозавдань не копіювались.

### R02-01 — Чітко підтверджені факти OPH

| Факт | Що саме підтверджує першоджерело | Що це дозволяє впровадити |
| --- | --- | --- |
| [OPH — пілот 18.09.2026](https://www.oph.fi/fi/uutiset/2026/yki-digitestia-kokeillaan-marraskuussa-2026) | **07.11.2026** — цифровий *suomi keskitaso* у 4 центрах (Helsinki / Rovaniemi / Pori / Espoo); **14.11.2026** — *ruotsi keskitaso* у 3 центрах. Комп'ютер **в тестовому центрі**, власний не потрібен. Завдання за типом **подібні** до паперового формату, але **не** тотожний екран. Можна просити спеціальні умови. | Підтвердити комп'ютерну платформу й комунікативні task families, **не** точний UI/таймер. Зберегти доступність, окремі модулі. |
| [OPH — календар suomi весна 2027](https://www.oph.fi/fi/koulutus-ja-tutkinnot/sopivan-yki-testin-valinta-ja-testipaivat) | **Всі весняні фінські YKI цифрові. Вісім дат**, із них **5 повних та 3 дати часткових модулів** (10.03, 12.05, 02.06). Реєстрація починається **о 10:00** за часом Фінляндії. | Full + module-only training, коректний календар у двох JSON файлах з regression gate. Не переносити аудіо- або UI-правила. |
| [OPH — digital practice demos](https://www.oph.fi/fi/koulutus-ja-tutkinnot/ennen-yki-testia) | Відкрито перелік **4 зовнішніх Inspera тренувальних демо**: reading, listening, writing, speaking. OPH прямо попереджає: **це не справжній екзамен; відповіді не оцінюють**. | Користувачеві давати **зовнішні посилання** для звикання до digital інструмента. Не писати `official mock grade`/не дублювати контент. |
| [OPH — результат після YKI](https://www.oph.fi/fi/koulutus-ja-tutkinnot/yki-testin-jalkeen) | Кожна навичка має **власний результат** `alle 3 / 3 / 4` на keskitaso; це **не** одна офіційна сума /100. | 4 окремі підсистеми оцінювання; якщо немає human-validated rubric — `ungraded`. |

**Критичне виправлення календаря:** попередні [`official-yki-deep-audit-v2.json`](official-yki-deep-audit-v2.json) та [`yki-exam-examples-2026-10.json`](yki-exam-examples-2026-10.json) містили **шість** замість **восьми** дат. R02 додає **24.04.2027 і 22.05.2027** та перевіряє повний перелік тестами. Не перезаписувати історичні `checked_at` на рівні всього каталогу: дослідницька версія 21.10 збережена, нова перевірка дат позначена явно 28.10. Календар OPH може змінитися: перед бронюванням перевірити саму OPH сторінку.

| Тестова дата 2027 | Реєстрація | Модулі | Джерело |
| --- | --- | --- | --- |
| **16.01** | 04–07.01 | 4 модулі | OPH |
| **13.02** | 18–28.01 | 4 модулі | OPH |
| **10.03** | 08–22.02 | **читання + говоріння** | OPH |
| **10.04** | 08–25.03 | **усі 4**, основна ціль користувача | OPH |
| **24.04** | 22.03–08.04 | 4 модулі | OPH |
| **12.05** | 12–26.04 | **аудіювання + письмо** | OPH |
| **22.05** | 20.04–06.05 | 4 модулі | OPH |
| **02.06** | 03–17.05 | **читання + говоріння** | OPH |

**Застереження:** це календар **офіційних тестів**, не гарантія конкретного місця, оплаченого бронювання чи однакового екзаменаційного досвіду в кожному місті.

### R02-02 — Знайдені чотири точні демопосилання

Усі наведені URL походять **із чинного OPH розділу «Harjoittele digitaalista YKI-testiä»**. При автоматичному переході до `yki-uat.inspera.com/player/` дослідницький текстовий доступ 28.10.2026 повернув **HTTP 403 Forbidden для всіх 4**, тому **не спостережено** реальну сесію, кнопки чи поведінку запису. Помилка автоматизованого клієнта **не доводить**, що демо не відкриється у браузері звичайного користувача.

| Навичка | Пряма зовнішня демосторінка (OPH → Inspera) | Перевірено фактично |
| --- | --- | --- |
| Reading — текст | [Tekstin ymmärtäminen](https://yki-uat.inspera.com/player/?assessmentRunId=556943021&context=exam) | OPH посилається ✅; автоматичний 403; **UI UNOBSERVED** |
| Listening — аудіо | [Puheen ymmärtäminen](https://yki-uat.inspera.com/player/?assessmentRunId=562180026&context=exam) | OPH посилається ✅; автоматичний 403; **UI UNOBSERVED** |
| Writing — письмо | [Kirjoittaminen](https://yki-uat.inspera.com/player/?assessmentRunId=561868854&context=exam) | OPH посилається ✅; автоматичний 403; **UI UNOBSERVED** |
| Speaking — говоріння | [Puhuminen](https://yki-uat.inspera.com/player/?assessmentRunId=562180811&context=exam) | OPH посилається ✅; автоматичний 403; **UI UNOBSERVED** |

**Що ще треба дослідити власноруч у дозволеному веббраузері:** (1) start/instructions & device permissions, (2) media controls, autoplay, seek/replay, (3) Back/Next та irreversible transitions, (4) spellcheck/copy-paste/text autosave, (5) mic permission/recording duration/stop flow, (6) break timers, timeouts, submit/finish, (7) keyboard/focus/contrast/accessibility accommodations. Для кожного тесту — skill, date, browser/device, **дослівно тільки назви дозволених UI controls**, короткі власні спостереження без копіювання чужого контенту, `digital_demo_observed` статус. І навіть це **не** є підтвердженням ідентичності live 2027. Перевірені production-правила потребують **окремого OPH/JYU підтвердження**.

### R02-03 — Найнебезпечніша суперечність: на OPH-сайті є старі паперові інструкції

На нинішній [«Ennen YKI-testiä»](https://www.oph.fi/fi/koulutus-ja-tutkinnot/ennen-yki-testia) поруч із цифровими demo все ще є загальні вказівки про **олівець/гумку, мовну студію, заповнення паперового бланка**, загальний день «5 годин». Не переносити ці рядки у новий digital UI без нового first-party підтвердження: сторінка змішує історичну процедуру з новою цифровою.

Додаток, який на сторінці OPH позначено `Yleisten kielitutkintojen perusteet 2026`, **фактично відкриває PDF `yleisten-kielitutkintojen-perusteet-2011.pdf`**. Перевірено сторінки **3 і 6** PDF через скриншоти: важливі для **конструкту** функціональна комунікація/4 модулі/середній рівень 3–4; на стор. 6 наведено **історичні** правила «аудіо 1–2 рази», «писати 3 різні тексти» та studio. **Не** робити з цього автоматичне правило для software 2027. Як і раніше: документаційний клас `LEGAL_FOUNDATION_2011`, не `LIVE_DIGITAL_2027_UI`.

### R02-04 — F1–F6: які завдання це створює для Hospodar

| Код | Що вже можна розробляти | Що ще закрито / acceptance |
| --- | --- | --- |
| **F1 Construct** | Чотири незалежні мовні навички, дев'ять тем, комунікативні цілі B1/B2 | Рецензування S2, змістові outcome не дорівнюють формату UI |
| **F2 Item families** | Оригінальні MCQ/T-F/open, листи/скарги, діалоги, реакції та монологи за історичним JYU/SOLKI | Не перепубліковувати захищені task stimuli; 2027 exact item count `unknown` |
| **F3 Prompt realism** | Живі людські голоси, оригінальний сучасний Finnish, puhekieli, справжні комунікативні ролі | Ліцензії, аудіозвіряння, naturalness та independent S2 review |
| **F4 Timing** | Лише чесний `practice_timer` або вимкнений таймер з попередженням | `official_2027_timing = null`; потрібен датований OPH доказ + E2E |
| **F5 Interaction** | Доступний original exam-like UI з durable recording; link to external OPH demos | `replay, seek, back, mic, autosave, spellcheck, breaks = null` як **офіційний профіль**, доки не підтверджено |
| **F6 Scoring** | Змістові відповіді з author-verified answer variants; продукція з `ungraded` + human S2 rubric pilot | Без калібрування та documented agreement немає автоматичної оцінки 3/4 або офіційної еквівалентності |

**Policy:** ніякого «1:1 exact digital YKI 2027» до закриття всіх критичних `unknowns` та підтвердженого release testing. **Ігровий LEARN** і **тихий EXAM** не змішуються: навчальні кольори, підказки, повтори, rewards не проникають в екзаменаційну спробу. Продуктна цінність сьогодні — чесне digital keyboard/mic readiness training і 4 skills без фальшивої екзаменаційної точності.

### R02-05 — Ready-to-run validation і наступні точки оновлення

**Канонічні доказові дані без другого registry:**
- [33 original claim records + dated R02 follow-up](yki-digital-fidelity-evidence-2026-10.json); `r02_2026_10_28_official_update` фіксує 4 Inspera URL, HTTP 403 тільки для crawler, `ui_observed=false`, 15 незмінних unknowns і blocked status.
- [40 classified claims + 15 fail-closed digital unknowns](official-yki-deep-audit-v2.json) тепер містить **усі 8 дат**.
- [historical samples + YKI dates](yki-exam-examples-2026-10.json) теж містить **усі 8 дат**, з тим самим регистраційним вікном й набором навичок.
- [source and calendar cross validator](../../scripts/validate_yki_deep_fidelity.py) та [exam research validator](../../scripts/validate_yki_exam_research.py) повинні пройти CI. Заборонено додавати `ui_observed=true` без підтвердженого ручного дослідження.

**План перевірок за тригером подій, не фіктивний background-run:**
1. **Вже зараз:** дати можливість учневі перейти з Hospodar до кожного з 4 офіційних зовнішніх демо за прямим посиланням; позначити їх як `practice demo, ungraded`. Фактичне додавання кнопок — **окремий code PR**, цього тут не реалізовано.
2. **07–14.11.2026 і пізніше:** перевірити лише нові повідомлення OPH/JYU після пілотів; **не** вважати пілотний день автоматичним оприлюдненням UI специфікації.
3. **Перед кожним strict release:** independent source reviewer має вручну підтвердити F4/F5/F6 з OPH/JYU; тільки тоді оновити canonical versioned profile, юніт+E2E та status. Якщо параметр не встановлено — `UNKNOWN`, no release as exact.
4. **2027 exam scheduling:** повторно перевірити OPH календар безпосередньо перед реєстрацією; цей snapshot має дату, не live availability.

**Критерій завершення R02:** нині **source audit / calendar reconciliation / regression contracts COMPLETED IN PR**; **manual demo session & real 2027 production rules remain NOT VERIFIED**. Дослідження продовжується тільки на основі нової першоджерельної інформації; не виводити її зі скриншотів третіх осіб, старих паперових інструкцій чи рекламних копій.


---

## E01/E02 execution cycle — 29.10.2026: official-source recheck and reproducible digital-demo audit

**Report type:** first-party web source recheck + automated Inspera access attempt; **not a manual Inspera UI inspection**, not full E02 completion, not a 2027 production examination. Canonical machine record: [E01/E02 recheck in the existing digital ledger](yki-digital-fidelity-evidence-2026-10.json). Executed against OPH 29.10.2026; prior R02 28.10 evidence is preserved unchanged.

### E01 — findings and implementation consequences

| Parameter | First-party observation as of 29.10 | Confidence and classification | EXAM implementation implication |
| --- | --- | --- | --- |
| Digital venue | [OPH pilot announcement](https://www.oph.fi/fi/uutiset/2026/yki-digitestia-kokeillaan-marraskuussa-2026): test centre provides a computer; participant need not bring one | CONFIRMED / current OPH | Desktop keyboard/headphones/microphone readiness is more representative than smartphone layout; do not imply user-owned devices on exam day |
| Finland pilot | OPH gives 7.11.2026 for Finnish intermediate pilot, with feedback to be collected afterwards | CONFIRMED scheduled, **still future on 29.10.2026** | Recheck after the pilot; event alone does not prove a 2027 production UI parameter |
| Digital spring 2027 | [OPH exam schedule](https://www.oph.fi/fi/koulutus-ja-tutkinnot/sopivan-yki-testin-valinta-ja-testipaivat) confirms all advertised spring 2027 Finnish sittings are digital; 10.04 full four modules | CONFIRMED dated current OPH schedule, not live availability | Keep existing 8-date calendar, no change to module time/count/order |
| Four ungraded demo links | [OPH before-test page](https://www.oph.fi/fi/koulutus-ja-tutkinnot/ennen-yki-testia) links four external Inspera demonstrations and says answers are **not assessed** | CONFIRMED links and non-scoring disclaimer only | Add four **welcome-only, external** links. No copying official content into Hospodar |
| Paper/digital ambiguity | Same OPH before-test page also contains pencil, optical-form and language-studio procedural instructions | CONFIRMED mixed source; NOT evidence for 2027 controls | Do not implement paper-form transitions as mandatory digitesti features |
| Exact 2027 UI: F4/F5 | No accessible OPH/JYU first-party documentation verifying module durations, counts, back/replay/seek, recorder workflow, writing editor, breaks or locking; all 4 automated Inspera page fetches responded HTTP 403 | **UNKNOWN**: no authorized manual observations; HTTP 403 applies only to our automated reader | Keep all 15 existing unknown fields NULL, strict exact-2027 BLOCKED. No invented times, screenshot claims, save/replay promises |
| Assessment: F6 | Published official rubrics characterize human performance, not automated scoring equivalence | OFFICIAL RUBRIC, MODEL UNVALIDATED | Reading/listening keyed practice only; writing/speaking UNGRADED until human calibration |

**Progress audit:** E01 public-source review **done this cycle, not permanently complete** (future official updates pending); E02 demo *link verification and fetch attempts* **done**, **manual walkthrough 0/4**, F4/F5 **not validated**, human outcome research **not done**. Do not mislabel this as a completed E02 study.

### E02 — lawful manual four-demo walkthrough protocol (to run in a permitted browser)

**Inputs:** the four unchanged links under the OPH before-test page. A tester may open them in an ordinary browser, without bypassing controls. No automated scraping, content redistribution, credentials, answer-key extraction or protected media collection. Avoid documenting copyrighted task sentences and examiner audio verbatim. Store only original **interaction observations** and identifiers in the existing evidence ledger.

**Minimum protocol, repeated for each of reading, listening, writing and speaking:**

1. **Reproducibility:** date and local timezone, browser/version, desktop OS, screen resolution, keyboard language, headset/mic, demo skill, official OPH referring page, external Inspera URL, exact access outcome.
2. **Before start:** visible exam/demo branding and disclaimer, candidate identification/login if present, instructions, start/ready buttons, permission requests, keyboard focus order, accessibility affordances.
3. **Task presentation:** number of visible items (only if observed), instruction placement, question-to-question navigation, whether an unanswered question can be skipped, whether backward navigation and editing appear possible.
4. **Timing:** distinguish on-screen countdown from possible elapsed counter; per-skill and per-item timing, preparation and answer windows, breaks/locks; record what was **observed**, not a speculative timing rule.
5. **Listening:** player/autoplay, exact ability to replay/seek/pause, audio startup after navigation, repeat count if *directly observed*, recovery when no audio; do not copy transcript or media.
6. **Writing:** text field/editor, input of ä/ö, copy/paste behavior (where lawful), word/character counter, spell-check state, draft recovery, accidental reload and focus order.
7. **Speaking:** headset and microphone check, permission prompt, recording indicator, preparation/answer stages, any signal before recording, response lock, consent/denied-mic/error behavior; avoid recording copyrighted demo audio and sharing user voice.
8. **End:** submit confirmation, incomplete-answer handling, finish/restart policy, what if a tab closes or network fails; never treat a practice demo's behavior as live exam policy without OPH corroboration.
9. **Evidence for each field:** \`observed_value|null\`, \`observation_method\`, \`source_url\`, \`observed_on\`, \`browser_version\`, \`applies_to=OPH_DEMO\`, \`live_2027_status=UNVERIFIED\`, \`confidence\`, \`reviewer\`, \`copyright_status\`, \`suggested_e2e_fixture\`.
10. **Conflict handling:** if demo contradicts legacy OPH prose, write both observations and mark conflict. If the demo cannot be opened, record only access outcome and leave UI fields null; do not guess.

**Module-specific acceptance checklist:**

| Demo | Crucial interactive controls to observe | What is actually known now |
| --- | --- | --- |
| **Tekstin ymmärtäminen (reading)** | Navigation/back/edit, keyboard options, text scroll/viewport, answer state, timer, finish | **NOT OBSERVED**; OPH link only |
| **Puheen ymmärtäminen (listening)** | Play/autoplay, repeat/seek/pause, prompt visibility, transitions, headphones/error paths | **NOT OBSERVED**; OPH link only |
| **Kirjoittaminen (writing)** | Finnish diacritics, editor/word counter/spellcheck, save/back, time, finish | **NOT OBSERVED**; OPH link only |
| **Puhuminen (speaking)** | Mic/permission/test, preparation, recording, audible cues, transitions, finish | **NOT OBSERVED**; OPH link only |

**Suggested assessor-specific E2E cases once a field is verified:** Back allowed/forbidden, listen seek allowed/forbidden, timer deadline boundary, failed/denied microphone, autosave explicit/implicit, answer present before and after navigation, contrast/focus/keyboard, interrupted test. Keep existing EXAM practice defaults only where strict mode is explicitly disabled.

### Hospodar code comparison — baseline 29.10

- Existing [app/exam.mjs](../../app/exam.mjs) renders **two nine-question mini-rehearsals**, intentionally uses synthetic listening and practice-only 0/15/30/60-minute timers, provides own navigation, stores text locally, and does not durably retain spoken audio across reload. These are current **practice** affordances, **not** evidence of live YKI UX.
- Existing [app/exam-core.mjs](../../app/exam-core.mjs) provides separate per-skill outcome data and explicitly declines to emit official B1/YKI grades. No full-length calibrated exam or sealed multi-form psychometrics.
- E02 handoff adds four official **external** demo links in the **welcome state only**. Never include external demo links, sample solutions or OPH demo content inside active attempt UI (avoid testing contamination).

### Next falsifiable decision gate

**E02 cannot be marked REVIEWED** until at least one authorized observer supplies skill-by-skill real browser observations with date, browser and provenance. **F4/F5 strict mode cannot be enabled** until OPH confirms that each critical observed demo parameter applies to the actual 2027 test, and E2E tests reproduce it. If public guidance is still incomplete after the November pilot, remain PRACTICE_ONLY; report unknowns rather than pretending fidelity.

No 2027 exam UI “replica” or performance uplift has been produced by this source-check cycle.
