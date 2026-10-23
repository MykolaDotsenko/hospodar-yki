# Реальні фінські фотографії для навчання A1.3–B1.1

**Бінарний імпорт завершено (8/8 JPG):** [SHA-256 та метадані фактичних файлів](available.json). Усього 1 564 380 байтів (усі вісім файлів). Статус учительського рецензування — pending. Не плутати перевірку технічної цілісності з перевіркою мовного рівня.

Партія 1, 2026-10-23: чотири відокремлені сюжети — **kauppatori**, **kauppa/kassa**, **kerrostalo**, **bussipysäkki**. Джерело й ліцензію перевірено на сторінці Wikimedia Commons кожного оригіналу. Усі чотири — **CC BY-SA 4.0**. До появи фізичних JPG, маніфест [sources.json](sources.json) позначає тільки кандидатів, а [available.json](available.json) — лише перевірені файли. Для offline-ready потрібні Git blob, SHA256, розміри, manifest і реальна валідація.

| Навчальна ситуація | Знайдене джерело | Автор / ліцензія |
| --- | --- | --- |
| shopping | [Turun kauppatori / Market Square, Turku](https://commons.wikimedia.org/wiki/File:Market_Square,_Turku.jpg) | Elias Ojala, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| shopping | [S-market — supermarket in Finland](https://commons.wikimedia.org/wiki/File:Cashes_in_S-market.jpg) | Abel111222, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| housing | [Apartment building in Kerava, Finland](https://commons.wikimedia.org/wiki/File:Apartment_building_by_Porvoonkatu_in_Kerava,_Finland,_2022_April.jpg) | Simo Räsänen (Ximonic), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| travel | [Bus stop on Pohjantie in Espoo](https://commons.wikimedia.org/wiki/File:Pohjantie_with_bus_stop_on_a_sunny_afternoon_in_August_2025.jpg) | JIP, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |

**Правила:** зображення зберігаються як JPG-версія до 960 px, з відповідною ліцензією CC BY-SA 4.0 (у Wikimedia — перетворений thumbnail), обов'язковими credit + source URL і інформацією про зміни; не відривати attribution від відтворення картинки. Кожен сюжет має оригінальне фінське запитання в [image-led tasks](../../../learning/exercises/a1/image-led/lessons.json), alt для FI/UK та статус `teacher_review=pending`. Фото **не** є YKI завданнями й не використовуються як приховані відповіді в EXAM.

**Імпорт:** `python3 -m pip install 'Pillow==11.3.0'; python3 scripts/import_licensed_pictures.py; python3 scripts/validate_visual_assets.py --require-pictures`. Автоматизований GitHub Actions імпортер запускатиметься лише в цій внутрішній review-гілці з вузьким дозволом на коміт перевірених зображень.

## Партія 2 — чотири нові сюжети (23.10.2026)

**Фактичний результат PR:** усі 4 нові фото збережені як JPEG у Git та перевірені за SHA-256 і розмірами; у [available.json](available.json) рівно 8 записів зі станом `verified_binary`. Джерельний список ніколи сам по собі не є доказом фізичного файлу.

| Рівень | Фото (точна сторінка Commons) | Автор, ліцензія | Сценарій уроку |
| --- | --- | --- | --- |
| A2.1–B1.1 | [Головна бібліотека Турку, всередині](https://commons.wikimedia.org/wiki/File:Turun_kaupunginkirjasto_sis%C3%A4lt%C3%A4_2018.jpg) | Vilho Verkkotoimitus, CC BY-SA 4.0 | Пошук книги, прострочення позики, запит на допомогу |
| A2.2–B1.1 | [Салон поїзда InterCity](https://commons.wikimedia.org/wiki/File:Interior_of_InterCity_train_from_Helsinki_to_H%C3%A4meenlinna.jpg) | JIP, CC BY-SA 4.0 | Місце у вагоні, запізнення, повідомлення другові |
| B1.1 | [Медичний центр Maunula](https://commons.wikimedia.org/wiki/File:Maunulan_terveysasema.jpg) | Ppntori, CC BY-SA 4.0 | Попросити запис, пояснити симптоми, перенести час прийому |
| A1.3–A2.1 | [Кафе Qwensel, Турку](https://commons.wikimedia.org/wiki/File:Qwenselin_kahvila.jpg) | Vilho Verkkotoimitus, CC BY-SA 4.0 | Замовлення, ввічливе прохання, виправлення замовлення |

**Ліцензія кожної фотографії:** [Creative Commons Attribution–ShareAlike 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Права не поширюються автоматично на сторонні матеріали. У застосунку показувати автора, першоджерело, ліцензію й повідомлення, що наявний JPEG є зменшеним thumbnail без інших змін.

Усі чотири [нові завдання](../../../learning/exercises/a1/image-led/lessons.json) — авторські, зі спершу незалежною відповіддю, відкладеними підказками, письмовим/усним перенесенням у нову ситуацію. **Викладацька перевірка не проведена; автоматичне оцінювання письма/говоріння заборонено.**
