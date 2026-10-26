# 27 — Психологія пам'яті та уваги: доказові рішення для вивчення фінської

**Перевірено:** 26.10.2026 · **Тип:** критичний тематичний огляд вибраних експериментів, метааналізів і систематичних оглядів (2006–2026). **Не PRISMA systematic review**, не власне дослідження Hospodar.
**Аудиторія:** дорослі україномовні учні фінської A1.3–B2.1, незалежна підготовка YKI keskitaso.
**Статус:** **RESEARCH + PROPOSED PRODUCT GATES**, не впроваджена функція, не виміряна ефективність або підтверджений конкурентний uplift.
**Канонічні власники:** [наші 70 методик](learning-methods-v1.json), [рейтинги з окремими expected-impact та product-fit](learning-effectiveness-ratings-v1.json), [дослідницька програма](../RESEARCH-PROGRAM.md), [UX-протокол вимірювання](../ux/learning-impact-evaluation-protocol.md), [global-methods review #26](26-global-effective-language-learning-2026-10.md), [візуально-звуковий review #18](../design/18-multisensory-learning-interface-evidence-2026-10.md). **Немає другого реєстру наукових методик; нових method IDs чи рейтингових чисел не вводимо.**

## 1. Ключове розмежування: увага, кодування, згадування та перенос

1. **Увага** = людина зосереджено сприймає релевантний сигнал і не відволікається. Навіть якщо час на екрані великий, він не доводить увагу; фізіологічні/camera-метрики тим більше не є надійною оцінкою навчання.
2. **Encoding/comprehension** = зрозуміла форма та значення нового вислову в контексті. Часті анімації або одночасний голос/музика можуть **забирати** ресурси.
3. **Retrieval** = учень дістає з пам'яті значення та сам **формулює** відповідь до ключа. Утримання у відповідях із підказкою — інша метрика.
4. **Consolidation** = збереження/перетворення знань у часі; між сесіями важливі час і сон. Жоден додаток не має права «лікувати» дефіцит сну або навчати під час сну.
5. **Transfer** = нове завдання / нові диктори / нова ситуація. **Лише independent 7/14/30-day task** відрізняє опанування від повторення завченого прикладу.

**Рішення Hospodar:** короткі значущі інформаційні блоки, перша незалежна відповідь, точний фідбек, самовиправлення, варіативна друга задача, належно рознесені повтори, відкладений невідомий матеріал. В EXAM — жодних навчальних втручань, таймінги та повтори лише за підтвердженим OPH профілем.

## 2. Наукова доказова база: підтримка і контрдокази

Порівнювати `g` / `d` як стандартизовані **різниці результатів**, **не відсотки**, не продуктову результативність. Метааналізи можуть мати спільні первинні експерименти — ефекти/вибірки не додавати. Перенесення зі студентів STEM, робочих перерв та загальних когнітивних тестів на **фінську як L2** потребує контрольного дослідження.

| ID / Першоджерело | Дизайн, наслідок, межа | Наслідок для Hospodar |
| --- | --- | --- |
| **COG-01** [Roediger & Karpicke 2006 — testing effect](https://doi.org/10.1111/j.1467-9280.2006.01693.x) | Два експерименти: повторне тестування дало кращу пам'ять через 2 дні/тиждень, ніж повторне перечитування; на негайному тесті перечитування іноді виграє. Загальноосвітні тексти, не фінська. | Перша відповідь без зразка, не підмінювати знання «легкістю уроку». |
| **COG-02** [Gonçalves et al. 2025 — retrieval vs elaboration](https://doi.org/10.1007/s10648-025-10076-6) | 44 дослідження, 142 порівняння; retrieval над **якісним elaboration** лише `g=0.14` загалом; перевага retrieval залежить від feedback; без нього elaboration іноді кращий. Різні галузі навчання. | Retrieval **разом із зрозумілим feedback**, осмисленням/контекстом. Контрольні тести — проти сильного elaboration+feedback, не лише reread. |
| **COG-03** [Szpunar, Khan & Schacter 2013 — mind wandering](https://doi.org/10.1073/pnas.1221764110) | 2 рандомізовані експерименти, `n=80`, онлайн-лекція зі статистики 21 хв: короткі тести між ~5.5-хв секціями зменшували mind wandering, допомагали нотаткам та результату. Малий campus sample, не буквальний рецепт 5 хв для всіх. | 2–5-хв смислові блоки + коротке *незалежне питання*; **без** примусового тесту після кожних 15 секунд. |
| **COG-04** [Zhang et al. 2025 — active video learning](https://doi.org/10.1016/j.edurev.2025.100708) | 46 статей / 54 дослідження: активні дії у відео проти пасивного перегляду; retention `g=0.33`, comprehension `g=0.28`, transfer `g=0.43`, збільшення cognitive load `g=0.19`. 75% STEM і не про фінську. | Між короткими audio/video-фрагментами питання gist/decision + реальна репліка, але слідкувати за навантаженням. |
| **COG-05** [Thomann & Deutscher 2025 — instructional prompts](https://doi.org/10.1016/j.edurev.2025.100686) | 68 експериментів; prompts `d=.394`, поправка на publication bias `d=.220`. Функціональні/спрямовані підказки варіюють за середовищем. Дослідження містить rule-based «AI», але **не потребує LLM**. | 1 контекстна запитальна дія за тригером («Що попросиш?», «Чому саме цей відмінок?»), не спам generic badges/toasts. |
| **COG-06** [Shen 2025 — digital reading distraction](https://doi.org/10.3389/fpsyg.2025.1671214) | 32 дослідження, 124 effects; attentional interference `g≈−0.64`, **I²≈88% (висока неоднорідність)**. Різні віки/типи дистракторів, не UI-тест Hospodar. | Не накладати popup, самовільні відео, звуки, notification overlays на читання/письмо. |
| **COG-07** [Cheng et al. 2026 — seductive details](https://doi.org/10.1007/s10648-025-10099-z) | 50 studies/177 effects; зайві розважальні деталі `g=−0.16` overall; recall `−.17`, comprehension `−.19`, transfer `−.12`, модератори. | Сюжет і графіка лише якщо вони несуть смисл. Позбавити фонової декоративної анімації уроки. |
| **COG-08** [Kim & Webb 2022 — spacing L2](https://doi.org/10.1111/lang.12479) | 48 L2 експериментів, 3 411 учнів; distributed practice покращує delayed outcomes; **немає магічно найкращого** fixed чи expanding pattern. | Deterministic SRS із 7/14/30 контрольними точками як **пілотний протокол**, а не «науково найкращий календар». |
| **COG-09** [Soderstrom 2026 — variable foreign-language retrieval](https://doi.org/10.3390/bs16091705) | 2 експерименти Lithuanian↔English слова, variable vs constant directions, 10-хв і 24-годинні delayed outcomes; змінні напрямки дали перевагу, особливо в складному напрямі. **Новий невеликий прямий L2 дизайн**, не доводить 30-денну перевагу. | Чергувати `FI→UA comprehension` і `UA situation→FI production`; не вважати двобічний переклад доказом вільного діалогу. |
| **COG-10** [Brunmair & Richter 2019 — interleaving](https://doi.org/10.1037/bul0000209) | 59 studies/238 effects, overall `g=.42`, сильніший ефект для певних *схожих* категорій; **для study lists of words blocking був кращий** `g=−.39`. Не універсальна перевага змішування. | Навчити форму початково блоками, а потім чергувати **схожі фінські відмінки** або типи задач тільки там, де є корисне розрізнення. |
| **COG-11** [Albulescu et al. 2022 — microbreaks](https://doi.org/10.1371/journal.pone.0272460) | 22 independent samples / N=2 335; vigor `d=.36`, fatigue `d=.35`, overall performance `d=.16`, **p=.116 (незначущий)**. Дослідження переважно про працю, не засвоєння L2. | Опційна пауза після складної задачі чи на прохання; 25/5 **не універсальна норма**, перерва не має обривати flow. |
| **COG-12** [Newbury et al. 2021/2022 — sleep deprivation](https://doi.org/10.1037/bul0000348) | Два meta-analyses повної гострої депривації сну: до learning `g=.621`, після `g=.277` шкідливих наслідків; зміщення публікацій і низька статистична потужність. Не вимірює ефекти «навчання за 5 хв до сну». | Не заохочувати нічні марафони; дати гнучкі нагадування/повторення, **без** порад «обов'язково вчи перед сном». |
| **COG-13** [Zainal & Newman 2024 — mindfulness & attention](https://doi.org/10.1080/17437199.2023.2248222) | 111 RCT / N=9 538, attention-related cognitive gains від mindfulness проти active controls приблизно `g=.192–.394` для окремих піддоменів; **episodic memory і verbal fluency не покращилися**. Це multi-session interventions, не одноразова дихальна кнопка. | Optional short focus-reset, **не** обов'язковий «brain booster» і не заявляти лікувальні ефекти. |
| **COG-14** [Jong et al. 2025 — student mindfulness](https://doi.org/10.1002/acp.70056) | 26 RCTs/17 pooled, орієнтування уваги та episodic memory іноді виграли, але **overall GRADE low**, risk of bias. Відрізняється від COG-13 популяцією. | Комфортний спокійний режим за бажанням, не вимірювати B1 за «самопочуттям». |
| **COG-15** [Ma et al. 2026 — cueing online education](https://doi.org/10.3389/fpsyg.2026.1717604) | 40 studies / N=5 049: позитивні середні ефекти конкретних signals, але **не** кожного color hue або більшої кількості cue. Можлива overlap з іншими сигналізаційними оглядами. | Один семантичний акцент на фазі пояснення **після першої спроби**, доступна текстова альтернатива. |
| **COG-16** [Dunlosky et al. 2013 — 10 techniques](https://doi.org/10.1177/1529100612453266) | Критичний огляд: practice testing/distributed practice зазвичай high utility, highlighting/rereading generally weak as standalone. Не означає, що базове читання «шкідливе». | Не рахувати «я підсвітив/прочитав» за mastering; використовувати через meaningful production. |

### Інтерпретація неоднозначних результатів

- **Attention ≠ delayed mastery:** mind-wandering study має сильні внутрішні дані, але `n=80` студентів статистики; інша мова, рівень і формат.
- **Microbreaks ≠ guaranteed better grades:** покращення самопочуття у COG-11 надійніше, ніж overall productivity/learning. Не створювати примусові перерви у тесті.
- **Mindfulness ≠ instant focus hack:** meta RCT про *тренувальні програми*, не кнопку на 30 секунд.
- **Interleaving ≠ завжди краще:** категорії, подібність і етап засвоєння важливі; `blocking` первинних слів іноді вигравав.
- **Retrieval + feedback beats dogma:** без корекції помилкові відновлення можуть закріплювати помилки; загальний ефект проти якісного elaboration малий.
- **Sleep:** важливий життєвий фактор і доступність гнучких сесій, а не задача «аналізувати здоров'я» чи моніторити сон користувача.
- **Форма vs значення:** підсвічування фінських морфем у LEARN **лише після першої незалежної відповіді**, як передбачає [design #17](../design/17-color-attention-l2-deep-dive.md). Контекст «що людина хоче сказати» важливіший за кольорову закінцівку.

## 3. Матриця рішень для Hospodar: увага → пам'ять → новий контекст

| Requirement | UX-поведінка в LEARN | Приймальний тест і вимірюваний результат | Пріоритет |
| --- | --- | --- | --- |
| **PSY-01 Attention recovery** | Короткий meaningful input у контексті → одне запитання без підказки → дія фінською; **не** штучні popup quizzes після кожного кліка | E2E: completed independent attempt, відсутні overlay/ілюзорні progress cues; trial: mind-wandering self-report **secondary**, day-14 unseen meaning/production **primary** | P0 |
| **PSY-02 Feedback** | Перша спроба незмінна; короткий змістовий, потім граматичний feedback → самовиправлення → новий персонаж/ситуація | first attempt ≠ edited attempt; unit no leakage, S2-reviewed correct/acceptable variants; novel transfer at 14/30 days | P0 |
| **PSY-03 Focus mode** | Інформація і фінське завдання у центрі; зайві sound/motion/badges відсутні, optional calm UI без graded penalty | Keyboard/mobile/screenreader and 200% zoom; 4-skill success, no background autoplay; matched-design comprehension trial | P0 |
| **PSY-04 Time spacing** | Детерміноване повторення реально проблемних chunks, варіативні контексти; missed/late повернення без штрафу | Versioned schedule; незалежний recall at real elapsed day 7/14/30, item freeze, exposure tracking | P0 |
| **PSY-05 Variable direction** | Comprehension (`fi→meaning`) і production (`meaning/goal→Finnish`), складність за успішністю, не бездумне чергування | Продукція вимірюється письмом/усною відповіддю, не MCQ; novel task / new dialogue delayed | P1 |
| **PSY-06 Precision interleaving** | Після першого пояснення у змішаному режимі розрізняти `talossa/talosta/taloon`, близькі часові й фонетичні конструкції | Порівняти blocked initial vs targeted later interleaving із **рівним часом**; помилки типу й день 14 | P1 |
| **PSY-07 Recovery without coercion** | Pause/continue в будь-який момент; добровільна short break/focus reset; зберегти чернетку й не штрафувати паузи | Save/recovery success, voluntary stop + resume; fatigue/burden secondary; нема forced Pomodoro | P1 |
| **PSY-08 Sleep-respecting learning** | Гнучкий час/короткі завершувані місії, opt-in reminders, без нічного streak pressure | User can disable reminders, return after missed days, no health monitoring, study hours respected | P1 |
| **PSY-09 EXAM isolation** | Реальні екзаменаційні завдання без самостійних breaks/feedback/timers, яких OPH не підтвердило; аудіо/переходи за verified evidence | Екзаменаційні state-machine tests, no hint leakage, four skills; `ungraded` speaking/writing until human-calibrated | P0 |

**Не використовувати** camera-based attention surveillance, eye-tracking, brainwave/Binaural hype, заборону accommodations, «неактивний учень = лінивий», примусові streaks чи медичні опитування; зберегти local/offline-first, privacy, accessibility, human S2 quality.

## 4. Приклад 20 хвилин: як психологія перетворюється на навчання

**Навчальний концепт:** `Kadotin puhelimeni bussiin` — загубив телефон в автобусі. Це **не** опублікований перевірений lesson item.

| Етап | Час лише як UX-орієнтир | Психологічний механізм | Що робить учень |
| --- | --- | --- | --- |
| Real context | 2 хв | relevance, focus/task goal | Розуміє ситуацію та мету |
| Input | 3 хв | meaningful encoding | Слухає живий фрагмент і визначає gist |
| Independent response | 3 хв | retrieval + attention reset | Сам каже/пише «Я загубив… Що мені робити?» без ключа |
| Feedback / self-repair | 4 хв | diagnostic feedback + elaboration | Виправляє одну помилку керування/минулого часу |
| Transfer | 4 хв | novel context | Дзвонить про загублені ключі іншому співрозмовнику |
| Choice and review | 4 хв | learner agency + scheduling | Вибирає наступну коротку місію, зберігає потрібні chunks |
| Later day 7/14/30 | окремий тест | spaced independent retention | Нова проблема/голос, S2 rubric, **без підказки** |

**Рекомендація:** не зашивати універсально 5- чи 25-хвилинний таймер. Когнітивний блок адаптувати до складності, уваги, доступності та добровільних пауз; задані вище хвилини — **проектний приклад**, не лабораторно оптимальний timing.

## 5. П'ять фальсифікованих перевірок для майбутньої розробки

Всі дослідження **PLANNED/NOT RUN**; власник загального протоколу — [learning impact evaluation](../ux/learning-impact-evaluation-protocol.md). До набору учасників зафіксувати гіпотезу, primary metric, min meaningful difference, recruitment/power feasibility, baseline CEFR, дозу/час, consent, blinded S2 rubric, dropout/missingness, confidence interval, негативні/нульові результати.

| ID | Рандомізована/збалансована умова A | Сильний контроль B | Primary (не vanity) та вторинні |
| --- | --- | --- | --- |
| **PSY-E01** | 3–5-хв meaningful chunks + retrieval between segments | Same Finnish content and exposure, equal-time coherent explanation + active elaboration **with feedback** | Day-14 new-context independent comprehension/production, burden + mind-wandering secondary |
| **PSY-E02** | Targeted after-error feedback, self-repair, new-context task | Same time/amount of meaningful elaboration and comparable feedback but no explicit self-repair | Day-14 functional Finnish task success and form control separate |
| **PSY-E03** | Calm focused UI | Equally accessible and meaningful, more decorative study UI (without confounding study time) | Day-14 transfer + comprehension, eye/attention comfort and a11y |
| **PSY-E04** | Later interleave similar Finnish case contrasts after initial teaching | Blocking of the same contrasts, comparable instruction and practice | Day-14 novel-context case discrimination + production |
| **PSY-E05** | Optional voluntary pause/focus reset | No prompted break, ability to pause remains for everyone | Task completion + perceived fatigue, **no forced exposure**; true language gains secondary |

**Правило:** швидкість проходження, таймери в UI, satisfaction і «кількість запущених вправ» **не є доказом** кращої довготривалої пам'яті. Дані уваги/самопочуття мінімізувати й не збирати без добровільної згоди; для EXAM ці умови **не застосовувати**.

## 6. З чого починати реалізацію

1. **P0 — коротка керована LEARN-сесія** з першою відповіддю, feedback/self-repair і новим контекстом. Усе S2-reviewed/rights-cleared і без LLM у learner runtime.
2. **P0 — no-distraction дизайн** у reading, listening, writing, speaking, ніякого auto-music або misleading progress. Результат/підказки EXAM ізольовані.
3. **P0 — реальний delayed recall** 7/14/30 та грамотне `missed`/`not_yet`/`ungraded` для письмо/говоріння, а не «готовий B1» за кліки.
4. **P1 — opt-in pause і концентрація**, збереження прогресу, відсутність штрафу за пропущені дні.
5. **P1 — тестувати targeted interleaving, variable retrieval і відео-питання** проти сильних time-matched controls.
6. **P2 — оцінити mindfulness як добровільну wellness-опцію**, **не** як обіцяну функцію навчання чи обов'язкову вимогу.
7. **Окремо EXAM:** лише підтверджена OPH-поведінка, original legally licensed item bank, four subtests, no cues, no estimated official YKI results.

**Канонічний код/статус:** поточний браузерний [Web MVP](../../app/README.md) і наявні редакторські/дизайн прототипи. Цей документ **не додає імплементацію**. Якість треба довести робочим кодом, QA і чесними дослідженнями на користувачах.

**Висновок:** найбільший потенціал має зв'язка **прибрати відволікання → дати коротку змістовну задачу → змусити згадати самостійно → точно виправити → застосувати у новому контексті → повернутися після паузи**. Пауза, сон та mindfulness можуть підтримувати умови навчання, але не підмінюють навчальних механізмів і не гарантують B1/YKI.
