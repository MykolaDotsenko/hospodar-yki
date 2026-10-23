# Реальні фінські фотографії для навчання A1.3–B1.1

**Бінарний імпорт завершено (4/4 JPG):** [SHA-256 та метадані фактичних файлів](available.json). Усього 726 187 байтів. Статус учительського рецензування — pending. Не плутати перевірку технічної цілісності з перевіркою мовного рівня.

Партія 1, 2026-10-23: чотири відокремлені сюжети — **kauppatori**, **kauppa/kassa**, **kerrostalo**, **bussipysäkki**. Джерело й ліцензію перевірено на сторінці Wikimedia Commons кожного оригіналу. Усі чотири — **CC BY-SA 4.0**. До появи фізичних JPG, маніфест [sources.json](sources.json) позначає тільки кандидатів, а [available.json](available.json) — лише перевірені файли. Для offline-ready потрібні Git blob, SHA256, розміри, manifest і реальна валідація.

| Навчальна ситуація | Знайдене джерело | Автор / ліцензія |
| --- | --- | --- |
| shopping | [Turun kauppatori / Market Square, Turku](https://commons.wikimedia.org/wiki/File:Market_Square,_Turku.jpg) | Elias Ojala, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| shopping | [S-market — supermarket in Finland](https://commons.wikimedia.org/wiki/File:Cashes_in_S-market.jpg) | Abel111222, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| housing | [Apartment building in Kerava, Finland](https://commons.wikimedia.org/wiki/File:Apartment_building_by_Porvoonkatu_in_Kerava,_Finland,_2022_April.jpg) | Simo Räsänen (Ximonic), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| travel | [Bus stop on Pohjantie in Espoo](https://commons.wikimedia.org/wiki/File:Pohjantie_with_bus_stop_on_a_sunny_afternoon_in_August_2025.jpg) | JIP, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |

**Правила:** зображення зберігаються як JPG-версія до 960 px, з відповідною ліцензією CC BY-SA 4.0 (у Wikimedia — перетворений thumbnail), обов'язковими credit + source URL і інформацією про зміни; не відривати attribution від відтворення картинки. Кожен сюжет має оригінальне фінське запитання в [image-led tasks](../../../learning/exercises/a1/image-led/lessons.json), alt для FI/UK та статус `teacher_review=pending`. Фото **не** є YKI завданнями й не використовуються як приховані відповіді в EXAM.

**Імпорт:** `python3 -m pip install 'Pillow==11.3.0'; python3 scripts/import_licensed_pictures.py; python3 scripts/validate_visual_assets.py --require-pictures`. Автоматизований GitHub Actions імпортер запускатиметься лише в цій внутрішній review-гілці з вузьким дозволом на коміт перевірених зображень.
