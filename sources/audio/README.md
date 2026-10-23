# 🔊 Зовнішні аудіоджерела та дослідження слухання

Тут зберігаються **посилання, права, дослідження і кандидати для імпорту**, не локальні записи. Файли OGG/MP3 з підтвердженими правами лежать виключно в [assets/audio](../../assets/audio/README.md).

- [oph-adult-spoken-finnish-2026-10.json](oph-adult-spoken-finnish-2026-10.json) — 6 chapter pages from OPH adult textbooks *Päivää!* (2015) and *Palataan!* (2018), **12 original source-linked ungraded LEARN listening/role-play missions**; original OPH audio playlists linked, teacher answers hidden until first response in the Web app. Publisher copyright: NO downloaded MP3/transcripts; chapter track audio resolution unverified, companion books sold separately. [Web practice](../../app/authentic-listening.html), [CI rights/answer integrity](../../scripts/validate_oph_spoken_finnish_sources.py).
- [authentic-dialogues-2026-10.json](authentic-dialogues-2026-10.json) — 7 перевірених сторінок Kielibuusti з автентичними або навчальними діалогами, зовнішніми аудіо/відео й текстовими рольовими іграми (27 оголошених аудіо/відеоодиниць, не завантажених); новий [інтерактивний LEARN-розділ](../../app/authentic-listening.html), права та provenance;
- [WAVE6-LICENSED-AUDIO-CANDIDATES-2026-10.md](WAVE6-LICENSED-AUDIO-CANDIDATES-2026-10.md) — сім нових, не дубльованих у поточному каталозі, Wikimedia Commons аудіоджерел для A1.3–B2.1, ще не імпортованих;
- [recording-sources.json](recording-sources.json) — початкові відкрито ліцензовані кандидати, офіційні демонстрації YKI (лише URL), платні й захищені джерела (лише URL); метадані про авторів та умови.
- [yki-targeted-sources-2026-10.json](yki-targeted-sources-2026-10.json) — добірка 16 додаткових джерел слухання, їхня користь, верифікація та заборони на локальне копіювання.
- [YKI-LISTENING-RESEARCH-2026-10.md](YKI-LISTENING-RESEARCH-2026-10.md) — методичне обґрунтування добірки, рівні та обмеження.

**Різниця між джерелом і файлом:** URL/кандидат не означає, що MP3 завантажено. Права на прослуховування сторінки не рівнозначні дозволу включати аудіо до Android/офлайн-пакета. Офіційні YKI записи й захищені курси — посилання, поки немає окремої згоди правовласника.

Для імпорту дозволених файлів використовується [скрипт](../../scripts/download_open_yki_audio.py), а справжню наявність визначають [локальний аудіоконтент](../../assets/audio/README.md) і його manifests. Перед імпортом знову перевірити ліцензію, джерело та формат; не позначати файли `reviewed` без перевірки.

## Додаткові короткі фрази — 23.10.2026, наступна добірка

У [канонічному `recording-sources.json`](recording-sources.json) додано **5 нових, не повторених серед 28 попередніх кандидатів** записів Wikimedia Commons із перевірених сторінок авторів та ліцензій: `Ole hyvä` (Suomipoika, CC BY 3.0), `Hyvää päivää` (Vassilik, CC BY-SA 3.0), `Hyvää huomenta` (Vassilik, CC BY-SA 3.0), `Minä en syö mitään, mikä tulee eläimestä` (Vassilik, CC BY-SA 3.0) і `Ei missään tapauksessa` (Jyri Leskinen, PD-self). Рівні A1.3–A2.2, тривалість приблизно 1.4–4.0 с. **Оригінальні сторінки перевірено, але звукові байти НЕ скачано й НЕ прослухано тут, а педагогічну S2-перевірку не проведено.** Це окремі звукові фрази, не діалоги й не нові локальні аудіофайли.

[5 пов'язаних чернеток вправ](../../learning/exercises/a1/audio-visual/lessons.json) розміщено в `source_only_practice_drafts`, окремо від 5 уже працюючих Web-уроків. Спочатку незалежне слухання/переказ, потім приклади, виправлення і нова ситуація; до фізичного імпорту вони не додаються до програвача та не оцінюються автоматично. [Перевірка прав і меж статусу](../../scripts/validate_a1_audio_candidates.py) запускається в CI із негативними тестами. Для діалогів із кількома дикторами наступний пріоритет — інші джерела; не слід видавати коротку фразу за природну розмову.
