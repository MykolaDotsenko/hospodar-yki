# A1.3–A2.2: живе аудіо + фото

**Запуск інтерактивного прототипу:** [Web LEARN → Аудіо + фото](../../../../app/real-life.html) (з кореня репозиторію запустіть `python3 -m http.server 8080` і відкрийте `http://localhost:8080/app/real-life.html`).

[Канонічний JSON: 5 навчальних місій](lessons.json) використовує **наявні** 4 різні записи людського мовлення та **наявні** 5 ліцензованих JPEG (повторне використання не збільшує кількість медіафайлів). Є також 1 нова оригінальна SVG-схема для ввічливих уточнень, яку видно лише після першої відповіді.

| Рівень | Практична ситуація | Аудіо (у бібліотеці) | Фото |
| --- | --- | --- | --- |
| A1.3 | Цифри й ціни на ринку | `numbers_1_24` | `kauppatori-turku` |
| A1.3 | Попросити повторити | `en_ymmarra` | `s-market-kauppa` |
| A2.1 | Узгодити зустріч | `metro_dialogue` | `espoo-bussipysakki` |
| A2.1 | Не знаю і питаю поради | `en_tieda` | `turku-paakirjasto` |
| A2.2 | Змінити план поїздки | `metro_dialogue` | `intercity-junassa` |

Записи чисел і фраз **не є діалогами на фото**; діалог про метро навмисне переноситься на ситуації автобусу й потягу. Це відверто пояснено в UI, щоб не приписувати джерелу невідомого змісту.

**Метод:** спочатку відтворення людського мовлення та самостійна письмова/усна спроба; лише після її подання — зразки й самовиправлення; потім інша ситуація; рекомендація повторити через 1/7/14 днів. На цій сторінці нема локальної довготривалої бази, автоматичних нагадувань чи вимірювання spaced repetition. Відповіді не відправляються на сервер, не перевіряються автоматично та втрачаються при перезавантаженні. **Всі 5 завдань мають `teacher_review=pending` і не є офіційним YKI.**

Оригінальні сторінки перевірених записів: [числівники / CC BY-SA 3.0 / Suomipoika](https://commons.wikimedia.org/wiki/File:Fi-Numbers_1_to_24.ogg), [метро / PD-self / Vassilik і друзі](https://commons.wikimedia.org/wiki/File:Finnish_dialogue_-_Tapaaminen_metroasemalla.ogg), [En ymmärrä / PD-self / Jyri Leskinen](https://commons.wikimedia.org/wiki/File:Fi-en_ymm%C3%A4rr%C3%A4.ogg). Повні атрибуції, включно з `en_tieda`, фото й точними шляхами: [audio library](../../../../assets/audio/library.json), [audio available](../../../../assets/audio/available.json), [photo available](../../../../assets/images/pictures/available.json). Зображення походять з Commons CC BY-SA 4.0, у UI показано автора та оригінальне джерело.

Перевірки: `python3 scripts/validate_a1_audio_visual.py`, `python3 -m unittest discover -s scripts/tests -p 'test_validate_a1_audio_visual.py' -v`, `node --test app/tests/real-life-core.test.mjs`. Показані права і metadata мають пройти юридичну перевірку для дистрибуції Android офлайн.

## Наступна п'ятірка — джерела перевірені, медіа не імпортовано

Додано **5 окремих чернеток для майбутніх source-only аудіовправ** у `lessons.json → source_only_practice_drafts`: вітання `Hyvää päivää`, `Hyvää huomenta`, побутова ввічливість `Ole hyvä`, харчові обмеження та категорична/ввічлива відмова. Оригінальні сторінки та ліцензії Wikimedia зафіксовано у [головному каталозі джерел](../../../../sources/audio/recording-sources.json). Їх **немає** серед 85 локальних аудіофайлів, нова Web-сторінка відтворює лише попередні 5 уроків із фізично перевіреними медіа. Нові чернетки — не зібрані вправи, не автоматично оцінюються, S2/acoustic review pending. Валідатор: `python3 scripts/validate_a1_audio_candidates.py`.
