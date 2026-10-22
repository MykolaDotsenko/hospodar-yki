# 20 — Другий раунд досліджень: інтерактивні мультимодальні завдання, відео, жести, голос та візуальна економія

**Перевірено:** 2026-10-21. **Статус:** дослідження → вимоги продукту, **не реалізація**.  
**Мета:** доповнити [18 — інтерактивний UX](18-interactive-visual-learning-evidence-2026-10.md), [19 — learning engine](../../pedagogy/19-learning-books-to-engineering-2026-10.md) і [17 — color attention](../../design/17-color-attention-l2-deep-dive.md) **новими, не дубльованими** результатами; навчати дорослих A2.2→B1/B1+ для фінської й YKI.  
**JSON для розробників:** [research/ux/multimodal-interaction-evidence-v2.json](multimodal-interaction-evidence-v2.json). *Цільовий, критичний огляд selected sources; не systematic PRISMA review. Числові g — стандартизовані ефекти оригінальних досліджень, не % поліпшення нашого застосунку.*

## 1. Executive decision — головна зміна дизайну

**Інтерактивність має ціну:** кожне запитання, жест, звуковий сигнал, вибір підказки або діаграма забирає частину робочої пам'яті. Варто зберегти лише те, що **допомагає вивести зміст, сформувати власну відповідь або виправити підтверджену помилку**. «Більше медіа» ≠ «краще навчання».

**Три режими подання в межах LEARN** (не створюють третього верхньорівневого product mode):
1. `discover` — короткий новий матеріал: один релевантний візуальний/словесний приклад, *один* on-demand gloss, чітка навчальна мета. Можна надати фото+переклад початківцю, але не виводити фото, переклад, анімацію та морфологічний розбір одночасно.
2. `practice` — самостійна відповідь, запитання по змісту, feedback → repair. Якщо завдання складне, поетапне розкриття допоміжної опори *після* першої незалежної спроби; response typed/voice, не лише tap.
3. `prove` — нове завдання без кольорової підказки/субтитрів/глянцю/жесту: лише independent uncued performance + delayed transfer. Це навчальна незалежна перевірка, а **не** YKI official score.

**Два продуктні режими незмінні:** `learn` підтримує discover/practice/prove; `exam` не має жодних навчальних cue всередині спроби. В обох — чотири навички й окремі результати.

## 2. Нові наукові роботи, конкретні результати та сумніви

| ID | Перевірене джерело | Що показано | Чому не можна надмірно узагальнювати |
|---|---|---|---|
| **V01** | [Mahdi, Mohsen & Almanea, 2024, Acta Psychologica](https://doi.org/10.1016/j.actpsy.2024.104341), **second-order meta-analysis 7 meta-analyses / 136 original studies** | Візуальні/мультимедійні glosses корисні, особливо для beginner/recognition; **single-mode gloss** у їхніх аналізах був кращий за multi-mode | Second-order overlapping studies; recognition не = продуктивна B1; інші умови [Zhang et al. 2025](interactive-visual-learning-v1.json) показали перевагу L1+picture на immediate tests. Ніякої універсальної формули «завжди одна підказка» |
| **V02** | [Kurokawa, Hein & Uchihara, Language Learning, 2025 issue/first online 2024](https://doi.org/10.1111/lang.12697), **49 L2 captioned-viewing experiments / 89 effect sizes** | Captioned viewing давало середній позитивний ефект на **incidental vocabulary**: g=0.56 | Vocabulary from viewing не тотожне самостійному сприйманню на YKI: separate audio-only transfer потрібен |
| **V03** | [Li, Chatain, Wang & Kapur, 2026, Educational Psychology Review](https://doi.org/10.1007/s10648-026-10194-9), **52 studies / 442 analyzed effect sizes** | Embodied vocabulary training: між групами g=0.65, у межах учасників g=0.27; **movement–meaning congruence** — найстійкіший moderator | Виявлено publication bias, отже сумарні ефекти могли бути завищені; не всі слова потребують руху |
| **V04** | [Benefits of Enacting and Observing Gestures, 2023](https://doi.org/10.3390/bs13110920), **7 L2 studies / N=309** | Спостереження за змістовним жестом виявилося не гіршим за власний жест на вибраних словникових тестах | Мала база, переважно знайомі конкретні дії; не вимагати «рухай телефоном» |
| **V05** | [Leutner & Biele, 2025, Educational Psychology Review](https://doi.org/10.1007/s10648-025-10067-7), **14 studies / N=1213** | Підтримка generative drawing загалом не допомагала; допомога в **інтеграції змісту та схеми** була корисною для comprehension (g=0.35), неінтегруюча — ні (g=-0.15) | Переважно science learning; графічні карти для фінської — продуктова гіпотеза, не validated L2 effect |
| **V06** | [Zhang, Li, Pi & Yang, 2025, Educational Research Review](https://doi.org/10.1016/j.edurev.2025.100708), **46 articles / 54 studies** | Active video strategies: retention g=0.33; comprehension g=0.28; transfer g=0.43; також зростає cognitive load g=0.19 | 75% STEM, 93% adults; це не доказ, що будь-який `pause+quiz` покращить фінську |
| **V07** | [Beege & Ploetzner, online 2024/issue 2025, Instructional Science](https://doi.org/10.1007/s11251-024-09693-5), **контрольований експеримент N=128** | За **однакової тривалості** навчання додаткові self-explanation prompts / навігація **не** покращили результати; prompts збільшили cognitive load | Один STEM експеримент; служить сильним контрприкладом до «interactive always better» |
| **V08** | [Liu, Zhang & Dai, 2025, CALL](https://doi.org/10.1080/09588221.2025.2528786), **38 mobile game experiments / N=4102** | Overall pooled g=0.962; більш переконливі outcomes для vocabulary/pronunciation, недостатньо визначені speaking/writing/reading/grammar | Переважає **англійська (30/38 studies)**, велика гетерогенність, різні контрольні умови; не перетворювати в «+96%» |
| **V09** | [Y. Zhou & M. Zhou, 2025 online/2026 issue, ReCALL](https://doi.org/10.1017/S0958344025100335), **65 studies** | Мобільне вивчення лексики в довгих втручаннях (10+ тижнів) дало позитивні узагальнені результати, reported effect 1.28 в обраному long-treatment аналізі | Не переносити підгруповий ефект на будь-який мобільний застосунок; відділяти навчання form-meaning від collocations/production |
| **V10** | [Almusharraf et al., 2024, Journal of Computer Assisted Learning](https://doi.org/10.1111/jcal.12974), **31 CAPT experiments / 42 effects** | Комп'ютерні інструменти для вимови в середньому ефективні, відео теж перспективне | Без валідованої Finnish phonetic scoring system: waveform — візуальна підказка, не доказ вимови |
| **V11** | [Li, Wang & Yang, 2025, Journal of Computer Assisted Learning](https://doi.org/10.1111/jcal.70060), **41 GenAI chatbot studies / N=3515** | GenAI chatbot intervention у середньому показав позитивний L2-ефект (ES=0.576) | Генерація може бути граматично/прагматично хибною; модель не екзаменатор YKI |
| **V12** | [Wang et al., online 2024 / issue 2025, Review of Educational Research](https://doi.org/10.3102/00346543241255621), **28 studies / 70 effects** | Метааналіз чатботів: g=0.484; effect moderators включали дизайн інтерфейсу та interaction capability | Порівняння відрізнялися; product UX повинен оцінювати якість відповідей, не кількість повідомлень |
| **V13** | [Zhang et al., 2024, Applied Cognitive Psychology](https://doi.org/10.1002/acp.4223), **N=146** | Вивчає розділену vs інтегровану подачу тексту та графіки, а також ефект розміру екрана | Це загальний експеримент, не правило конкретного CSS; коли схема використовується, помітні відповідності повинні бути поруч |
| **V14** | [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/), **стандарт, не педагогічна ефективність** | Керування рухом, текстові альтернативи, видимий focus, pointer/drag alternatives і достатній target size | Розрізняти AA та AAA; наприклад interaction-triggered animation 2.3.3 є AAA, але наша stronger product policy має підтримувати reduced motion |

**Особлива суперечність V01 vs [Zhang, Sala & Gobet 2025](https://doi.org/10.1016/j.edurev.2025.100681):** single-mode gloss іноді виграє у метааналізі, але L1+picture у спеціалізованому іншому метааналізі виграє на immediate tests. Не можна оголосити переможця незалежно від prior knowledge, UI clutter, type of test. **ТЗ:** візуальні опори дозувати, дозволити порівняння варіантів, вимірювати 7-/14-day uncued transfer.

## 3. Нові патерни функцій IV2-01…12 — доповнення, не заміна IV-01…14

| ID | Ідея + UI-механіка | Експертний пріоритет /100 | Evidence | Scope |
|---|---|---:|---|---|
| **IV2-01** | **Gloss-on-demand і анти-перевантаження**: лише один первинний gloss, toggle «показати ще», окрема реєстрація `gloss_exposure` | **96** | V01, V13 | P0 |
| **IV2-02** | **Caption ladder**: з відео/аудіо спочатку незалежний gist, потім FI captions/слова/повтор після submit, наприкінці audio-only новий уривок | **95** | V02, V06, V07 | P0 |
| **IV2-03** | **Semantic gestures**: 2–4 секунди чистої іконічної дії для конкретного дієслова `avata, sulkea, nostaa, kaataa`; необов'язково повторити жест | **85** | V03, V04 | P1 |
| **IV2-04** | **Visual explanation builder**: з готових карток ситуації скласти зв'язок `mihin → minne → kirjasto → kirjastoon`, а потім написати нове речення без карток | **88** | V05, V13 | P1/experiment |
| **IV2-05** | **Video decision points**: не «клікни кожні 10 секунд», а 1–2 запитання на **смислових межах** із незалежною відповіддю; опційно replay | **93** | V06, V07 | P1 |
| **IV2-06** | **Game layer without grade inflation**: інформаційна мікромісія (знайти адресу, уточнити оренду), badge тільки за виконану реальну комунікативну мету, без streak shame | **88** | V08, V09 | P1 |
| **IV2-07** | **Audio quantity lab**: слухове порівняння `tuli–tuuli`, `muta–mutta`; після слухової відповіді — опційний rhythm/timeline, *без* фальшивої ASR-оцінки | **92** | V10 | P1 |
| **IV2-08** | **AI partner with guardrails**: обмежені побутові ролі, уточнення/перефразування, диференційований зміст/форма feedback, `abstain` при невпевненості; перевірені сценарії S2 | **93** | V11, V12 | P1 |
| **IV2-09** | **Autonomy + accessibility media preferences**: `simple / rich` media-density control, calm, keyboard-equivalent to gestures, reduced motion | **94** | V01, V07, V13, V14 | P0 |
| **IV2-10** | **Screen-fit text+diagram proximity**: у малому viewport відповідності поруч у вертикальному stack без горизонтального стрибання між графікою і текстом | **90** | V05, V13, V14 | P0 |
| **IV2-11** | **Multimodal anti-cue assessment**: unseen retest **без** підтримувального відео, фото, жесту, кольору або caption; отделити `recognition` від `production` | **98** | V01, V02, V03, V09 | P0 |
| **IV2-12** | **Quality gate for interactive media**: не додавати video prompts, візуальні карти, мультимодальні glosses без teacher-approved tasks, прав на assets та відкладеного тесту | **97** | V05, V07, V11, V12 | P0 |

*Усі /100 — внутрішня суб'єктивна пріоритизація, не метааналітичний результат і не прогноз балів YKI. V14 нормативне, а не експериментальне джерело.*

## 4. Реальні протоколи фінських мікромісій

### 4.1. «Запитай, о котрій автобус» — interactive information gap

- **Input:** читабельна схема маршруту з фінською лексикою й валідним розкладом, але учень спочатку не бачить відповіді на `Milloin bussi lähtee?`.
- **Action:** сам формулює питання фінською або вибирає коректну *мовленнєву стратегію*, а не кольоровий варіант; аудіорепліка співрозмовника відповідає на уточнення.
- **Review:** після відповіді показати одне відповідне місце на схемі й причину; `help_used=true` не підмішується до independent mastery.
- **Transfer:** новий маршрут та інші часи без іконок-підказок. У `exam` — суворо approved practice format, не публікувати закладених ключів до завершення.

### 4.2. «Що відбулося в магазині?» — коротке відео

- **Discover:** 20–45 s **оригінального й ліцензованого** відео або статична сцена + recorded dialogue з правами, без тексту аудіо; без forcing head/camera movement.
- **Comprehend:** питання `Miksi asiakas palauttaa tuotteen?` (зміст) → `Mitä myyjä ehdottaa?` (рішення), не більше двох interruptions на short scene як **початкова UX-евристика**, не науковий оптимум.
- **Explain:** після submit користувач може увімкнути FI captions і перевірити `evidence_span`; змістовне підсвічування тільки за `timecoded_segment`.
- **Prove:** інший запис — лише audio з новим діалогом, незнайомою деталлю та independent question; 7/14-day retention без підтримки.
- **Abstention:** якщо VTT не перевірено або права на video/audio нечіткі, video UI не має статусу ready; fallback до оригінального plain text/task.

### 4.3. «Відчиніть двері / Зачиніть двері» — semantic gesture

- Спочатку показати **коротке натуральне** `avaa ovi / sulje ovi` разом із іконічним рухом; можливість просто подивитися **рівноправна** власному виконанню.
- Через хвилину і через 7 днів — **незалежне** `Mitä hän tekee?` із іншим контекстом без жесту; задача — згенерувати `Hän avaa oven`.
- Заборонити оцінку «відтворив жест» як `learned Finnish`; врахувати physical limitations і user preference.

### 4.4. «Поясни маршрут» — карта, яка змушує думати

- Показати спрощену карту `kotona → kauppaan → kaupasta → kotiin`, але не автопідсвічувати правильні закінчення.
- Учень власноруч вибудовує послідовність і **пояснює фінською**, не лише перетягує.
- На постфактум review на схемі з'являються `mistä? / mihin? / missä?` як **пояснення змісту**; далі — нова карта без кольору.
- Діаграма — можливість, не requirement to draw; поява випадкових красивих стрілок без незалежної production = анти-патерн.

### 4.5. «Обговори повернення посилки» — AI conversation

- Сценарій з `goal, allowed_intents, Finnish_approved_example_chunks, escalation, prompt_version`; AI співрозмовник слухає питання, може уточнити або попросити перефразувати, але не підказує готову репліку до першої відповіді.
- Відгук: `goal_achieved`, `meaning_understood`, `grammar_form`, `appropriateness`, `needs_human_review`; для відкритої відповіді/вимови не робити вигаданих `YKI=3` оцінок.
- Моделі не дозволяти **самостійно** вигадувати екзаменаційні параметри, виправляти «помилки» без пояснення та логувати приватне аудіо без згоди.

## 5. Технічний policy/data contract v2

**One scene model**: `id, skill, mode, task_type, language_level, media[{kind,src,license,attribution,timing_verified,review_status}], text_alternative, teacher_review_status, source_version, goal, semantic_targets, learner_actions, feedback_gate, transfer_item_id, assessment_eligibility`.

**Runtime:** `phase = discover | first_uncued | optional_support | self_repair | transfer_uncued | delayed_unseen | done`. Перехід `first_uncued → optional_support` **тільки після submit**. `exam` має окрему policy; interactive overlays, feedback, captions/glossary, mascots disabled while attempting.

**Telemetry by default local**: `first_attempt_correct, prompt_seen_at, assistance_requested, caption_enabled_after_submit, gesture_seen, multimodal_setting, response_type, content_version, delayed_first_uncued, time_on_task`. No raw private voice/video telemetry. Зберігати аудіо лише opt-in/ephemeral; ті самі task IDs, що були підказані, **не** використовувати для independent holdout.

**Moderation/quality:** `generated` feedback і video scripts мають S2 review та evidence for factual grammar decisions; `human_review_pending` не можна віддавати як авторитетну корекцію чи official exam. Video/audio licenses — не виводити assets із сторонніх сервісів без права копіювати/поширювати.

## 6. Нові критерії приймання — IV2-AC-01…18 (planned)

1. **IV2-AC-01:** для нового слова обидва варіанти gloss `single` і `combined` підтримані як різні **контрольовані навчальні варіанти**; немає анімаційного інформаційного шуму.
2. **IV2-AC-02:** до `first_uncued.submit` не можна викликати `reveal answer`, `show hint`, `show captions` у independent tasks.
3. **IV2-AC-03:** у `learn` FI caption після submit лише з `timing_verified && teacher_reviewed && licensed`; non-captioned holdout залишається ізольованим.
4. **IV2-AC-04:** якщо captions не існують — стабільний no-captions fallback, не автоматичні фейкові слова.
5. **IV2-AC-05:** відеозапитання прикріплені до **scene boundaries**, переривання не ламає player/focus/history/keyboard; free-flow default для екзамену.
6. **IV2-AC-06:** `gesture_enactment` необов'язковий; відео можна дивитися, пропустити і повністю пройти без камери.
7. **IV2-AC-07:** жести обрані лише для семантично співвідносних target-дій; інші `abstract` слова не отримують випадкових рухів.
8. **IV2-AC-08:** кожна interactive diagram має альтернативу list/select і вимагає незалежної пояснювальної відповіді, а не лише drag.
9. **IV2-AC-09:** графіка/фінські підписи залишаються логічно близькими в mobile 320px і при 200% zoom, screenreader reading order правильний.
10. **IV2-AC-10:** однаковий task outcome у rich і calm mode, усі обов'язкові контрольні елементи keyboard-operable.
11. **IV2-AC-11:** reduced motion й pause/stop/hide прибирають рухливий контент; не заважати слуханню чи запису.
12. **IV2-AC-12:** аудіолаб показує `ungraded pronunciation`, поки нема каліброваної Finnish phonetic оцінки; не виводить числового «акцент score».
13. **IV2-AC-13:** AI dialogue при низькій впевненості виявляє `human_review_required` або `not_assessed`, не підтверджує вигадану граматику.
14. **IV2-AC-14:** після допомоги, captions або gesture результат позначений `assisted` й не підвищує `unassisted mastery`.
15. **IV2-AC-15:** 7/14-day `unseen` використовують нові `assessment_eligible` items та прибирають усі медіапідказки за заздалегідь заданою policy.
16. **IV2-AC-16:** екзаменаційний тест без trainer gloss, prompts, hints, gestures, pause interruption/animations і AI auto-score письма/говоріння.
17. **IV2-AC-17:** privacy + right-to-use media + S2 correction status перевіряються перед увімкненням мультимодальної вправи.
18. **IV2-AC-18:** у продуктового експерименту реєструють обидва `immediate` й `delayed` outcomes та drop-off/cognitive-load; без них **не** стверджувати перевагу rich media.

## 7. Пререгистраційний план оцінки (розробка, не виконано)

**Окремі гіпотези, не змішувати в одному тесті:**
- **H1 / gloss density:** `single contextual gloss` vs `L1+picture`, equal media exposure, same Finnish chunks, controlled baseline vocabulary; **primary 7-day unseen production**, secondary immediate recognition. Не робити загального висновку «комбінація завжди краща».
- **H2 / short video prompts:** `one meaning-based question at logical boundary` vs `zero prompts`; **тотожний перегляд/контактний час**, record task interruptions; primary uncued new-clip gist, cognitive overload/abandonment guardrails.
- **H3 / embodied verbs:** `short meaningful gesture clip` vs `semantic still image` з однаковою лексичною інструкцією; 7-day independent action-verb production; opt-out from movement.
- **H4 / AI feedback:** `teacher-reviewed structured correction` vs `AI-dialogue with validator/human anchors`; blind Finnish S2 scoring, measure incorrect corrections, not conversation length.

Метрики: `day7_unseen_first_uncued_accuracy`, `day14_transfer`, `listening_gist_without_text`, `productive_recall`, `cognitive_load`, `accessibility_success`, `incorrect_ai_feedback_rate`, `time_to_correct_response`, `task_abandonment`. Уточнити потужність/мінімальний значущий effect до запуску; поки немає достатньої вибірки — лише UX-пілот. Не включати familiarized items в незалежний контроль.

## 8. Готовність до імплементації

**P0**, наступна вертикальна реалізація: `IV2-01, 02, 09, 10, 11, 12`, local honest evidence record, teacher/licensing gates і IV2-AC-01…05/09…18. Частина IV-18 уже прототипована, але нові gates **не вважати виконаними**, поки немає тестів і QA.

**P1:** `IV2-03…08`: semantic gesture library, video decision point, інтерактивні діаграми, calibrated CAPT/AI conversation. Починати з оригінального легального assets, не з high-cost AR/VR.

**P2 / experimental:** gesture animations beyond concrete verbs, video gamification, rich avatar, physiological/neurological claims. Використовувати лише після доведення ефекту над текстовою альтернативою, без зниження comprehension.

**Фінальний принцип:** якісний екран Hospodar YKI = один виразний контекст + одна осмислена мовна дія + незалежна перевірка. Візуальний дизайн може бути яскравим у навігації, але *стриманим там, де мозок працює над фінською*.
