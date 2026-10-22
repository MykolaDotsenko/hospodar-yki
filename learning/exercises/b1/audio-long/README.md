# B1–B1+ — шість повних аудіоуроків по 2–3 хв

**Повноцінний оригінальний навчальний контент, а не каталог посилань.**

## ✅ Фактично збережені довгі треки — 21.10.2026

Перевірено в гілці `main`: **6 синтетичних сучасних уроків по 2 хв 23 с із повними TXT-транскриптами, 12-блоковими WebVTT субтитрами та 24 питаннями**. Всі OGG, TXT і VTT фізично присутні в GitHub.

| Фінська історія | Аудіо | Транскрипт | Субтитри |
|---|---|---|---|
| Vesikatko ja huoltokäynti | [OGG](../../../../assets/audio/long/b1/b1long-01-vesikatko-ja-huoltokaynti.ogg) | [TXT](../../../../assets/audio/long/b1/b1long-01-vesikatko-ja-huoltokaynti.txt) | [VTT](../../../../assets/audio/long/b1/b1long-01-vesikatko-ja-huoltokaynti.vtt) |
| Kurssi, joka sopii työvuoroihin | [OGG](../../../../assets/audio/long/b1/b1long-02-kurssi-ja-tyovuorot.ogg) | [TXT](../../../../assets/audio/long/b1/b1long-02-kurssi-ja-tyovuorot.txt) | [VTT](../../../../assets/audio/long/b1/b1long-02-kurssi-ja-tyovuorot.vtt) |
| Kun verkkokaupan tilaus meni pieleen | [OGG](../../../../assets/audio/long/b1/b1long-03-verkkokaupan-palautus.ogg) | [TXT](../../../../assets/audio/long/b1/b1long-03-verkkokaupan-palautus.txt) | [VTT](../../../../assets/audio/long/b1/b1long-03-verkkokaupan-palautus.vtt) |
| Muuttunut bussireitti | [OGG](../../../../assets/audio/long/b1/b1long-04-muuttunut-bussireitti.ogg) | [TXT](../../../../assets/audio/long/b1/b1long-04-muuttunut-bussireitti.txt) | [VTT](../../../../assets/audio/long/b1/b1long-04-muuttunut-bussireitti.vtt) |
| Yhteinen piha, yhteinen päätös | [OGG](../../../../assets/audio/long/b1/b1long-05-taloyhtion-pihatalkoot.ogg) | [TXT](../../../../assets/audio/long/b1/b1long-05-taloyhtion-pihatalkoot.txt) | [VTT](../../../../assets/audio/long/b1/b1long-05-taloyhtion-pihatalkoot.vtt) |
| Uusi harrastus ja parempi arki | [OGG](../../../../assets/audio/long/b1/b1long-06-uimahallin-uusi-ryhma.ogg) | [TXT](../../../../assets/audio/long/b1/b1long-06-uimahallin-uusi-ryhma.txt) | [VTT](../../../../assets/audio/long/b1/b1long-06-uimahallin-uusi-ryhma.vtt) |

**Також 1 повний людський MP3 2:38,6:** [Todellinen prinsessa](../../../../assets/audio/human/short-stories/todellinen-prinsessa-cygnaeus.mp3), диктор Cygnaeus, і [повний фінський друкований текст](../../../../assets/audio/human/short-stories/todellinen-prinsessa-original-text-fi.txt) за Project Gutenberg. Запис історичної казки — **B1+/B2, літературна фінська**, не приклад сучасного YKI. Друкований текст не є синхронізованими субтитрами; можливий вступ/відмінності в читанні.

**Поточна загальна бібліотека: 85 реальних аудіофайлів** — [assets/audio/library.json](../../../../assets/audio/library.json). Перевірка тривалості та хешів 6 нових OGG пройшла в workflow збірки.



- [source-lessons.json](source-lessons.json): 6 повних фінських сценаріїв, 24 запитання з правильними відповідями й українськими поясненнями.
- [lessons.json](lessons.json) створюється після успішного аудіоімпорту: реальна тривалість, пов'язані файли й контрольні суми. Поки не створений, фізичні файли не зараховувати.
- [assets/audio/long/b1](../../../../assets/audio/long/b1): кожна історія у форматі **OGG**, точний **.txt транскрипт**, **.vtt субтитри**, часові межі яких взято з фактично згенерованих сегментів.
- [scripts/render_b1_long_audio.py](../../../../scripts/render_b1_long_audio.py) та [QA](../../../../scripts/validate_b1_long_audio.py): відтворювана збірка й автоматична перевірка.

**Теми:** несподівана відсутність води; курси та зміни; повернення неправильного замовлення; змінений маршрут автобуса; сусідська толока; спортивна група. Тексти написано спеціально під функціональну B1–B1+ фінську. 24 питання перевіряють причини, часові умови, вибір рішення і зміст.

**Точність субтитрів:** скрипти — первинний текст, який озвучує Piper; кожен блок синтезується окремо, а часові мітки обчислюються на основі реальної довжини кожного блоку. Це набагато надійніше, ніж машинне розпізнавання без перевірки, але **не гарантує природної вимови/оцінювання YKI**. Позначення: `synthetic_audio=true`, `teacher_review=pending`, `not_official_YKI`.

**Режим:** 1) слухання без субтитрів; 2) письмова відповідь на запитання; 3) повторне прослуховування; 4) субтитри + аналіз помилок; 5) переказ нової спорідненої ситуації. Результат можна оцінювати лише на новому записі без підказок.

Принципи доступності: WebVTT можна підключити до HTML5 `<track kind="subtitles" srclang="fi" />` у майбутньому застосунку. Ліцензії текстів — оригінальний контент Hospodar YKI; голос — Piper Harri. Аудіозаписи не є офіційними файлами іспиту.
