# 18 — Як дизайн, інтерфейс, кольори, аудіо та мультимедіа впливають на навчання фінської

**Дослідження:** 25.10.2026 · **Статус:** critical evidence-to-design synthesis / **RESEARCH + TARGET SPEC, NOT TESTED IN HOSPODAR**.  
**Аудиторія:** дорослі україномовні A1.3–B2.1; LEARN (навчання фінської), окремо EXAM (YKI keskitaso).  
**Обсяг:** вибрані рецензовані метааналізи, систематичні огляди, експерименти 2008–2026 і стандарти W3C. **Це не новий PRISMA systematic review, не власне дослідження і не підтвердження переваги над конкурентами.**  
**Канонічна база:** [візуальні сигнали та колір — №16](16-color-attention-memory-research-2026-10.md), [форма проти змісту — №17](17-color-attention-l2-deep-dive.md), [педагогіка/увага/звук — №22](../pedagogy/22-memory-attention-sensory-learning-evidence-2026-10.md), [методики та ratings](../pedagogy/learning-methods-v1.json), [експериментальний протокол](../ux/learning-impact-evaluation-protocol.md). **Не додає другу базу методів або нових методик:** нижче наведено лише дизайн-втручання на основі вже зареєстрованих механізмів.

## 1. Вердикт: чому багата сенсорика допомагає не завжди

**Рішення Hospodar:** красивий, емоційний, але **meaning-first** продукт; аудіо й ілюстрації допомагають сприйняти мовний зміст, один смисловий сигнал спрямовує увагу, активна відповідь/самовиправлення забезпечує навчальний механізм, а через 7/14/30 днів учень має впоратись **без** підказки.

- **Доведеніший клас ефектів:** сигналізація релевантних елементів, керовані L2 captions, відсутність зайвих деталей, відповідність графіки й слів, навчальні вправи з активною відповіддю.
- **Межові/суперечливі:** конкретні відтінки, емоційні палітри, більшість анімацій, фонова музика, соціальні cue з мультимедіа. Мотивація ≠ independent Finnish transfer.
- **Не підтверджено:** «синій/зелений/жовтий збільшує пам'ять на X%», кольоровий фон як надійний retrieval cue, бінауральні ритми чи частоти для B1, автоматичний звуковий ефект за кожен клік.
- **Педагогічна безпека:** до першої незалежної відповіді, під час переносу й EXAM — **жодних** кольорових суфіксів, транскриптів-відповідей чи сигналів, які видають ключ. Доступна навчальна підтримка на вимогу не прирівнюється до оціненого незалежного тесту.

## 2. Джерела: результати, контрдокази, зовнішня валідність

Ефект `g` або `d` — **стандартизована різниця**, не відсоток покращення запам'ятовування. Коли метааналізи використовують ті самі первинні дослідження, **не сумуємо ефекти**.

| ID / Джерело | Що насправді досліджено | Результат та обмеження | Рішення для нас |
| --- | --- | --- | --- |
| **VD-01** [Schneider et al., 2018](https://doi.org/10.1016/j.edurev.2017.11.001) | 103 дослідження, N=12 201, signaling у мультимедіа (різні предмети) | Позитивні retention і transfer; **не ізольований ефект кольору** | Підсвічувати відповідність, а не прикрашати все |
| **VD-02** [Lee & Huang, 2008](https://doi.org/10.1017/S0272263108080479) | 16 L2-досліджень / 20 вибірок, виділення граматики | `d=+0.22` для граматики, `d=−0.26` для обробки змісту; різні L2 | Meaning-first, форми тільки у feedback після спроби |
| **VD-03** [Meusel et al., 2024](https://doi.org/10.1007/s10639-024-12460-1) | Рандомізоване 5-групове дослідження, N=191 (німецькомовні), фон як retrieval cue | Саме змістовне тло-кольорування **недостатнє** як memory retrieval cue; floor/ceiling limits | Не прив'язувати запам'ятовування фінських слів до background hue |
| **VD-04** [Ma et al., 2026](https://doi.org/10.3389/fpsyg.2026.1717604) | 40 online-education досліджень, N=5049; cues | Візуальні signals `g=0.261` (текст+колір+субтитри разом); social `g=0.634`; combined negative estimate має CI, що включає нуль, мала підгрупа | Одне чітке cue за раз; без висновку «соціальні сигнали завжди кращі» |
| **VD-05** [Cromley & Chen, 2025](https://doi.org/10.1016/j.edurev.2025.100730) | Метааналіз принципів мультимедіа в різних видах медіа | Ефекти неоднорідні; **активні навчальні втручання часто сильніші за косметичний редизайн**; деякі середні принципи незначущі | UX не повинен замінювати retrieval practice/transfer |
| **VD-06** [Cheng et al., 2026](https://doi.org/10.1007/s10648-025-10099-z) | 50 досліджень, 177 ефектів: *seductive details* | Зайві привабливі деталі дали `g=−0.16` загалом, comprehension `−0.19`, recall `−0.17`, transfer `−0.12`; ефект невеликий, є модератори | Забрати фоновий рух, «красиві безсенсові» звуки та декоративні пояснення |
| **VD-07** [Kurokawa, Hein & Uchihara, 2025](https://doi.org/10.1111/lang.12697) | 49 L2-експериментів, 89 ефектів: captions vs no captions під час **навчання лексики** | `g=0.56`, 95% CI [0.38, 0.73]; залежить від жанру та змісту, не оцінює точність цифрового YKI | Дати користувачеві фінські captions для навчання, відокремити від unseen listening |
| **VD-08** [Sutton & Webb, 2026](https://doi.org/10.1017/S0272263126101612) | 56 дослідів, n=1954, 75 within-group ефектів audiovisual L2 input без subtitles | Позитивні pre/post асоціації; **within-group**, не прямий причинний доказ, що відео краще за time-matched audio | Використовувати короткі тематичні відео, але перевіряти нове listening на нових голосах |
| **VD-09** [Cheah et al., 2022](https://doi.org/10.1177/20592043221134392) | Систематичний огляд 95 статей / 154 експерименти; background music та когнітивні задачі | Загалом ризик погіршення memory/language, особливо музика **зі словами** та складні завдання; результати неоднорідні | За замовчуванням тиша, без фонового звуку під час мовної продукції |
| **VD-10** [de la Mora Velasco et al., 2023](https://doi.org/10.1177/03057356231153070) | Метааналіз 47 досліджень / 71 ефект; background music у навчанні | Малий середній позитивний `d=0.314` за різних умов, потенційні модератори; **суперечить** частині висновків VD-09, не ізолює B1 Finnish production | Не оголошувати музику «шкідливою завжди» або «підсилювачем пам'яті», дати добровільну опцію |
| **VD-11** [Should We Turn off the Music?, 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10162369/) | Експеримент verbal/visual memory, reading, arithmetic під silence/instrumental/lyrics | Музика **зі словами** погіршувала verbal memory та reading (прибл. `d=−0.3`); instrumental не мав переконливого ефекту | Не накладати lyrics поверх фінського слухання, читання, письма |
| **VD-12** [Mutlu-Bayraktar, 2024](https://doi.org/10.1007/s10639-024-12823-8) | Систематичний огляд 51 роботи про emotional multimedia design | Часто позитивні мотивація/емоції; **суперечливі learning outcomes** | Енергійний бренд так; магічних «кольорів для пам'яті» ні |
| **VD-13** [Chen et al., 2024](https://doi.org/10.1007/s10648-024-09917-7) | 4 експерименти playback speed, slides/text та distractors, загальна освіта | Деякі швидкі записи не погіршили оцінок у конкретних задачах, **не** доказ безпечного 2× для початківця-фіномовця | User-controlled speech speed; primary 1×, slow option without pitch shift, test L2 comprehension |
| **VD-14** [Sailer & Homner, 2020](https://doi.org/10.1007/s10648-019-09498-w) | Метааналіз gamification у навчанні | Наявні позитивні середні ефекти, але компоненти та умови суттєві | Лише meaningful quests/mastery/choice, не примусові streaks |
| **VD-15** [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Норматив доступності, **не** дослідження пам'яті | Контраст, доступні форми, captions, sound/motion control; юридична/UX якість ≠ B1 evidence | WCAG 2.2 AA, user agency і перевірки на реальних пристроях |

**Критичні невідповідності:** стандартні multimedia-лекції інколи демонструють ефект зайвості субтитрів, **але** L2-лексика має окреме позитивне caption evidence (VD-07). Це не абсолютне «завжди показувати субтитри»: для **навчання** вони допоміжні й керовані; для **незалежної перевірки аудіювання** транскрипт приховують, якщо це відповідає завданню/дозволеним умовам. У W3C доступність і право на субтитри зберігаються; «відключити підказку в тесті» **не** означає позбавити людину необхідного доступного формату. EXAM відтворює лише **підтверджені OPH параметри** і не робить фіктивних accessibility заборон.

## 3. Рейтинг втручань для Hospodar — експертний, НЕ effect sizes

Дві незалежні осі `/100`: **Fit** = наскільки механіка відповідає продукту/ризику/вартості; **Expected learning usefulness** = оцінка ймовірної педагогічної корисності **на основі переносимості досліджень, а не спостережень у Hospodar**. Жодне число не є процентажем ефекту, гарантованим результатом або новим методом у канонічному реєстрі. Відбір контенту й retrieval важливіші за цей косметичний рейтинг.

| ID | Конкретна UI/медіамеханіка | Fit /100 | Expected usefulness /100 | Доказова впевненість для саме Finnish/YKI | План |
| --- | --- | ---: | ---: | --- | --- |
| **SENS-01** | Після змісту та first response показати **один** semantic cue «фраза ↔ форма/напрямок» | 97 | 88 | Помірна: meta signaling, але екстраполяція на Finnish | P0 |
| **SENS-02** | Зв'язане фото/короткий текст/ситуація без декоративної зайвості | 96 | 85 | Помірна: multimedia/cognitive load, мало Finnish RCT | P0 |
| **SENS-03** | Керовані Finnish captions та транскрипт, збереження доступності | 96 | 90 | Вища для L2 vocabulary, нижча для незалежного B1 listening | P0 |
| **SENS-04** | Реальна фінська з різними голосами, самостійне play/replay/speed | 99 | 94 | Висока предметна доцільність, точний UX-ефект не вивчений | P0 |
| **SENS-05** | Quiet-by-default; окремі sound/speech/music mute/pause | 98 | 86 | Висока accessibility; mixed effects BM on memory | P0 |
| **SENS-06** | Meaning-first feedback: переклад/ситуація → невелике граматичне виділення → fading | 96 | 89 | L2 форма/значення tradeoff; наш таймінг не перевірений | P0 |
| **SENS-07** | Контрастний semantic skill color + іконка/текст, не кольоровий-only | 95 | 76 | Достовірний usability/a11y принцип; memory не доведено | P0 |
| **SENS-08** | Коротка **керована** анімація фізичного руху (`-ssa/-sta/-Vn`) зі статичним дублем | 86 | 73 | Суперечливо для анімацій; перевіряти проти static | P1 |
| **SENS-09** | Гейміфіковані реальні місії зі свободою вибору + feedback компетенції | 93 | 82 | Позитивні, неоднорідні gamification studies; Finnish no trial | P1 |
| **SENS-10** | М'який короткий звук **після** відповіді, тільки opt-in, візуальний/текстовий еквівалент | 76 | 62 | Педагогічний uplift від sound effect не підтверджено | P2/experiment |
| **SENS-11** | Добровільна фонова інструментальна музика окремо від speech | 68 | 46 | Суперечливі результати, підвищений risk verbal tasks | P2/experiment |
| **SENS-12** | Binaural/frequency «memory audio», flashes, dopamine reward loops | 5 | 5 | Немає належного evidence для мети; ризик distraction | **DO NOT SHIP** |

**Не плутати:** VD-01/04 — метааналізи signaling, SENS-01 — запланований дизайн-вибір. Дані не доводять ефективність саме нашого `feedback-only` підсвічування або надійність частот SENS-12 у ширшій медицині; «DO NOT SHIP» — продуктове рішення за відсутності релевантних доказів і потенційним відволіканням.

## 4. Конкретний дизайн-контракт: чотири навички, два режими

| Задача | LEARN: дозволено, коли корисно | При independent try / unseen / EXAM | Технічний критерій |
| --- | --- | --- | --- |
| **Читання** | Структура оголошення, пояснення слова по tap після першої спроби, semantic arrows; читабельність 200% zoom | Без підкреслення рядка з правильною відповіддю; в EXAM лише підтверджені правила | Вправи з новим текстом і людська comprehension рубрика |
| **Аудіювання** | Озвучене Finnish audio; slow/replay, transcript toggle (за навчальною фазою), різні голоси | Спершу comprehension без наведеної відповіді; held-out audio новий голос; EXAM replay/seek за OPH evidence | Плеєр user-start, пауза, focus, капшени/транскрипт, caption QA |
| **Письмо** | Ситуація + релевантне фото, підказки після independent draft, 1–3 focal errors | Немає граматичного кольорового «ключа» у полі самостійної відповіді; writing `ungraded` без review | first attempt separate from corrected version; keyboard/touch/mobile |
| **Говоріння** | Приклади автентичної вимови, чітка довжина голосних/приголосних, waveform **тільки після** першої спроби як візуальна підказка | Немає нав'язаної «100% вимови» або ASR-yki grade, mic denied -> не оцінено | User permission, private local voice, no upload, accessible alternative |
| **LEARN ігрова карта** | Тихий дорослий стиль, progress показує **реальні** компетенції | Немає «відкрий щоденний streak» як умови доступу | Місії доступні без SFX/анімацій |
| **EXAM повний** | Ні: ніякої навчальної гейміфікації, музики, підказок чи fallback неправильних YKI-таймерів | Стримана відтворювана OPH-поведінка, verified-only items, original licensed stimuli | F1–F6 status, frozen profile, E2E, no answer leak |

**Токени бренду не міняти довільно:** [brand/tokens.json](../../brand/tokens.json) має navy/gold/paper і accent для reading/listening/writing/speaking. Чотири навички завжди мають **назву та іконку**, колір — **додатковий** сигнал. Не задавати окрему «нейропалітру» чи стверджувати, що якийсь відтінок універсально поліпшує пам'ять.

## 5. Audio / motion / captions: нефункціональні acceptance criteria

- **A11Y-01:** **ніяких автостартових** фонових ефектів чи музики; speech play — за дією користувача або іншим спеціально підтвердженим сценарієм. Автоматичний звук понад 3 секунди має механізм незалежної зупинки/керування згідно [WCAG 1.4.2, level A](https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html); наша суворіша ціль — звуки **off by default** навіть коротші.
- **A11Y-02:** навчальне озвучування й музика — окремі канали; регулювати/pause/mute без системної гучності, interrupt audio при navigation; звук не є єдиним feedback сигналом.
- **A11Y-03:** синхронізовані попередньо записані відео мають відповідні captions за [WCAG 1.2.2, level A](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html). Фінські L2 subtitles — user control; для learning listening інструкція про прихований на першій спробі transcript не скасовує вимог доступності/спеціальних accommodation.
- **A11Y-04:** рух/animation тільки user-triggered, **статичний еквівалент** показує весь зміст; `prefers-reduced-motion`, calm-mode. [WCAG 2.2.2 level A](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide) для довгих auto-moving content; [WCAG 2.3.3 level AAA](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions) — **наш добровільний додатковий орієнтир**, не вимога AA.
- **A11Y-05:** WCAG 2.2 AA: текст ≥4.5:1, великий ≥3:1, важливі нетекстові контроли ≥3:1, клавіатура й скрінрідер, 320/360/390px + 200% zoom, no information conveyed by color alone. Автоматичний лінтер кольорових токенів **не замінює** ручні mobile/contrast audits.
- **A11Y-06:** тихий режим, зменшення стимулів, UI preferences користувача переживають зміну між місіями; відмови мікрофона або офлайн не сприймаються як «погане знання».
- **RIGHTS-01:** ліцензія кожного голосу/треку/фото/анімації + consent/provenance; сторонній матеріал link-only до підтвердження права redistributing/offline. Audio pitch/time-stretch не змінює права на оригінал.

## 6. Чотири контрольовані перевірки: від теорії до доказу

**Загальне правило:** `research hypothesis → versioned UI variant + equal Finnish material/time → independent first try → 7/14/30-day new context → preregistered outcome`. Human S2 blind grading, randomized/matched assignment, dropout/CI/intention-to-treat; не підміняти тест кліками чи preference surveys. Усі **NOT RUN**, жодних учасників/оцінок поки немає.

| Експеримент | Експериментальна умова | Контроль за тієї самої дози | Primary і safety metric | Рішення |
| --- | --- | --- | --- | --- |
| **UX-S01 P0: color/form** | Meaning-first explanation + single semantic cue після independent response | Такий самий текст/feedback без кольорового виділення | day-14 independent new-context comprehension **і** appropriate Finnish case use; WCAG, burden | Adopt, тільки якщо перевага не знижує meaning |
| **UX-S02 P0: L2 captions** | Навчальні Finnish subtitles з дозволеним toggle/timing | Ідентичне аудіо/час; plain text or alternative caption arrangement залежно від accessibility | day-14 new-voice listening та незалежне L2 vocabulary recall; accessibility no disadvantage | Не оцінювати без-субтитрів проти доступної умови без accommodations |
| **UX-S03 P1: grammar motion** | User-triggered 2D рух в/із/до місця (`talossa/talosta/taloon`) + static fallback | Статичне зрозуміле фото зі стрілками + така сама практика | day-14 delayed transfer + task time, focus, nausea | Не додавати motion, якщо static не гірше |
| **UX-S04 P2: music and SFX** | Вибір добровільного тихого instrumental ambience / nonverbal feedback | Тиша, рівні час/контент; збереження право вимкнути sound | retention at day-14, writing comprehension + workload / dropouts | Музика off by default, no rolling out as pedagogical enhancer без реальних даних |

**Уточнення:** у музичних і caption експериментах завжди дозволені accessibility accommodations та opt-out. Не рандомізувати відсутність необхідних субтитрів для користувачів, яким вони потрібні. Усі експерименти плануються **лише для LEARN**, не змінюють EXAM до підтвердження OPH.

## 7. Перші інженерні вертикальні зрізи та критерії приймання

| № | Що зробити | Acceptance, який може перевірити reviewer |
| --- | --- | --- |
| **V1 P0 — accessible audio controller** | Спільний Web media UX: play/pause/replay, швидкість, окремий mute SFX/music, підписи; audio error/retry | Реальні кейси sound off, offline, focus/tab, paused navigation, mic denied; немає autoplay SFX |
| **V2 P0 — transcript gates** | Відкрити captions у LEARN відповідно до lesson phase; збережений first attempt | Unit/E2E: жодного автоматично видимого рішення до first answer, captions доступні для accommodations |
| **V3 P0 — semantic cue** | Значення ситуації перед формою; один колір+підкреслення **після** відповіді, з текстовим альтернативним маркером | S2 перевірка меж морфем, no answer leakage in transfer/exam, reduced color variant |
| **V4 P1 — semantic motion and visual grammar** | Один real-life Finnish case contrast + інтерактивна статична схема й optional animation | Visual/keyboard/screen reader tests, same lesson goal with motion off |
| **V5 P1 — learner-impact instrument** | Дозволені контрольні варіанти S01/S02 без нової телеметрії за замовчуванням | Добровільна згода, оновлювана версія content/variant, відкладені held-out responses, без raw voice upload |
| **V6 P2 — gentle mission audio** | Лише optional feedback chime, вимикається окремо, не відволікає від Finnish voice | A11Y-01…06, audio ducking, порівняння silent baseline |

**Дорожня карта та статус:** поточний `app/` — vanilla Web MVP; [app README](../../app/README.md). Web/Android/Phaser/Media3 — **лише заплановані або код-прототипні частини**, не готовий реліз. Жодне посилання на research або design contract не доводить встановлюваний Android/аудіо-плеєр/покращення пам'яті. Existing memory/cue grammar feature у MVP є частковою реалізацією; V1–V6 **не завершені**.

## 8. Межі чесного застосування

- Не extrapolate `g=0.56` captions до «56% кращої вимови/письма/YKI»; у VD-07 це **інша outcome metric** (incidental L2 vocabulary) та corpus.
- Не extrapolate `d=0.314` музики до «+31% пам'яті»; background music study conflicts with other literature, а verbal load Finnish має свої ризики.
- Не додавати одночасно новий фон, 3D-маскота, chimes, motion й нові граматичні підказки: експеримент не зможе встановити механізм, а cognitive load може зростати.
- Пріоритет має **людська S2-якість матеріалів, якість аудіо, активне пригадування, нові контексти, навчальна чесність і достовірність цифрового YKI**, а не retention clicks or animation wow.
- Контент, семантичні tokens, звукові файли, consent/storage privacy: наявні власники у `learning/`, `brand/`, `assets/`, `sources/` та `docs/`. **Не дублювати** бібліографічний registry або методи в іншій JSON-базі. Про новий **навчальний метод** йдеться лише коли реально відсутній у канонічних 70, тоді діє existing validator update policy.

**Головна ціль:** Hospodar YKI стає кращим не тоді, коли він красивіший і голосніший, а коли користувач через 14/30 днів **краще розуміє та самостійно говорить/пише фінською**, а режим EXAM чесно відтворює **лише перевірені** правила цифрового YKI.
