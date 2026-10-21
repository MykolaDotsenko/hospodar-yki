# 15 — Головне ТЗ Hospodar YKI: два режими × чотири навички

**Версія:** 1.0.0 • **Дата:** 2026-10-21 • **Статус:** затверджена цільова поведінка продукту, **не** твердження про вже реалізовані функції.  
**Пріоритет:** P0 (основна концепція, навігація, вибір навичок, ізоляція поведінки режимів).  
**Пов'язані документи:** [продуктове ТЗ MVP](11-mvp-product-requirements.md) · [архітектура](12-mvp-architecture.md) · [доказові методики](08-learning-methods-evidence-2026-10.md) · [digital exam fidelity](14-digital-yki-fidelity-spec.md) · [офіційні приклади](13-yki-exam-format-and-real-examples-2027.md).  
**Контракт конфігурації:** [research/product-session-modes-v1.json](../research/product-session-modes-v1.json).

## 0. Одне речення про продукт

**Hospodar YKI — застосунок із двома незалежними режимами: (1) надзвичайно ефективне персоналізоване навчання фінської та підготовка до YKI на підставі перевірених методик; (2) максимально достовірна репетиція реального YKI keskitaso. У КОЖНОМУ режимі можна обрати всі чотири навички або окремий модуль; у навчанні всі навички можна свідомо перемішувати.**

Назви режимів на головному екрані:
- **🧠 Підготовка до YKI — Opi & harjoittele.** Тут можна експериментувати, помилятися, отримувати підказки, виправлятися й адаптивно вчитися.
- **🎓 Симуляція YKI — Kokeile YKI-testiä.** Тут є самостійна спроба без відповідей/підказок, екзаменаційні типи завдань і режим відкладеної перевірки. Повна офіційна fidelity залежить від підтвердженої специфікації OPH digitesti 2027; поки невідомі правила не вигадувати.

**UX:** два режими — дві великі виразні картки на першому екрані. Назви чотирьох навичок уніфіковані у всій системі: `reading` / **Lukeminen — Tekstin ymmärtäminen**; `listening` / **Kuunteleminen — Puheen ymmärtäminen**; `writing` / **Kirjoittaminen**; `speaking` / **Puhuminen**. Завдання та ключові інструкції іспиту — фінською; українські пояснення є в навчальному режимі, але не втручаються в екзаменаційні завдання.

## 1. Дерево вибору користувача

```text
Hospodar YKI
├── 🧠 ПІДГОТОВКА
│   ├── 🎯 Усі навички — адаптивно вперемішку (default recommendation)
│   ├── 📚 Усі навички — послідовний структурований курс
│   ├── 📖 Тільки читання
│   ├── 🎧 Тільки аудіювання
│   ├── ✍️ Тільки письмо
│   └── 🗣️ Тільки говоріння
│       └── [Тривалість: 10/20/30 хв або власна]
│            [Інтенсивність: нові / повторення / слабкі місця / змішано]
│            → завдання → самостійна відповідь → фідбек
│              → самовиправлення → перенос → SRS / збереження
│
└── 🎓 СИМУЛЯЦІЯ
    ├── 🏁 ПОВНИЙ YKI — усі 4 навички (default recommendation)
    ├── 📖 Тільки читання
    ├── 🎧 Тільки аудіювання
    ├── ✍️ Тільки письмо
    ├── 🗣️ Тільки говоріння
    └── 🔗 Комбінація модулів (окремий тип тренувальної спроби)
        └── [Точний екзаменаційний профіль, якщо ОПH підтвердив]
             або [Явно позначена навчальна репетиція]
             → інструктаж → незалежна відповідь → завершення
               → результати КОЖНОГО складеного модуля окремо
```

**Не плутати:** «Усі навички вперемішку» — це **навчання**, не офіційний порядок іспиту. «Повний YKI» — **симуляція**, що має відтворювати підтверджений порядок частин і їхній зміст, а не випадково перемішувати екзаменаційні модулі.

## 2. Обов'язкова матриця можливостей

| Вибір навички | 🧠 Навчання: адаптивні місії | 🎓 Симуляція: незалежний мінітест/модуль |
|---|---|---|
| **Усі 4 вперемішку** | **так**: обґрунтоване чергування, адаптивні теми, SRS | ні для «офіційного порядку»: лише окремий *practice remix* із маркуванням, без статусу YKI replica |
| **Усі 4 послідовно** | так: structured plan / milestones | **так**: повний тест із 4 модулів, підтверджений порядок/таймінги лише за специфікацією OPH |
| **Лише читання** | так: тексти, вправи, paraphrase, лексика | **так**: reading-only independent subtest |
| **Лише аудіювання** | так: природне мовлення, gist/details, transcript after attempt | **так**: listening-only independent subtest |
| **Лише письмо** | так: guided writing, feedback, rewrite, transfer | **так**: writing-only independent subtest |
| **Лише говоріння** | так: roleplay, voice, repair, повторення | **так**: speaking-only independent subtest |
| **Довільна пара/підмножина (опційно)** | так: користувацький баланс | так **лише як тренувальна комбінація**, якщо вона не є конкретною оголошеною офіційною конфігурацією |
| **Офіційні часткові дні 2027** | можна тренувати потрібну пару | **лише** конкретні OPH pair-профілі, прив'язані до календаря, не довільні два модулі |

### Важливе розрізнення для часткових іспитів

OPH дозволяє записуватися на **конкретні** модулі на оголошених `osakoepäivä`, але не означає, що будь-яка довільна комбінація доступна в будь-яку дату. Навесні 2027 для фінського keskitaso:
- **10.03.2027** та **02.06.2027** — оголошені **reading + speaking**.
- **12.05.2027** — оголошені **listening + writing**.
- **10.04.2027** — повний чотиримодульний день, реєстрація **08–25.03.2027**.

[Офіційний календар OPH](https://www.oph.fi/fi/koulutus-ja-tutkinnot/sopivan-yki-testin-valinta-ja-testipaivat) (перевірено 21.10.2026). На сайті може бути доступне *окреме оцінювання лише одного модуля*, проте **продукт не повинен стверджувати**, що для вибраної користувачем пари/одного модуля існує місце/реєстрація у зазначену дату без перевірки OPH.

**Вимога до інтерфейсу:** «Тренувальний іспит із говоріння» ≠ «запис на офіційний іспит тільки з говоріння». Кнопки реєстрації та офіційні обмеження — окремий інформаційний шар.

## 3. Режим A — максимально ефективна підготовка (LEARN-*)

Використовувати найкращі методики з наявного evidence registry (сотня балів — **оцінка відповідності методики продукту**, не підтверджена універсальна ефективність).

| ID | Вимога | Практична реалізація |
|---|---|---|
| **LEARN-01** | Режим **Adaptive Mix** як рекомендований | Планувальник чергує всі 4 навички з урахуванням реальних прогалин, близькості іспиту, днів SRS, втоми та `coverage` (не ігнорувати сильні/складні навички) |
| **LEARN-02** | Режим **Structured Course** для всіх 4 | Послідовні компетенції A2.2→B1→B1+ за темами; регулярне повернення до повторів |
| **LEARN-03** | **Skill Focus** | Чіткий вибір однієї навички, усі дії в місії залишаються в межах вибраної навички; контекстна граматика/лексика може підтримувати мету, але не перетворювати speaking-only на reading exam |
| **LEARN-04** | Диференційована діагностика | Чотири окремі початкові профілі, невизначеність, показати слабкі місця без фейкової конвертації 0–100 у YKI 3 |
| **LEARN-05** | Retrieval + SRS | Своєчасне пригадування, паузи, частіша перевірка підтверджених помилок, відкладена незалежна перевірка новими завданнями |
| **LEARN-06** | Task-based learning | Реальні життєві сценарії житла, праці, лікаря, сервісів, транспорту, суспільства з практичною комунікативною метою |
| **LEARN-07** | Feedback → guided self-repair → transfer | Спочатку власна відповідь; конкретний зворотний зв'язок; контрольоване самовиправлення; нова ситуація; наступна перевірка без підказок |
| **LEARN-08** | Interleaving, contextual chunks, grammar focus | Варіативність тем, collocations/rektion, морфології, швидке застосування в контексті, без ізольованого зубріння |
| **LEARN-09** | Інтенсивне аудіювання | Різні людські голоси, puhekieli, gist/details/inference, прихований до відповіді transcript, дозовані повтори й ручна звірка записів |
| **LEARN-10** | Інтерактивне говоріння | Roleplay/turn-taking/short reaction/monologue, диктофон за явним дозволом, ASR лише допоміжний, feedback з оцінкою впевненості |
| **LEARN-11** | Письмо з адаптивним feedback | Типи повідомлення/e-mail/opinion, реєстр змістових, лексичних і граматичних прогалин, guided rewrite + unseen transfer |
| **LEARN-12** | Маленькі зрозумілі сесії | 10/20/30 хв, велика кнопка «Продовжити», чіткий next best mission, без forced streak / startling distractions |
| **LEARN-13** | Довести засвоєння | 7-/14-денні unseen перевірки й подальший transfer; не вважати правильний повтор одного й того самого ключа доказом B1 |
| **LEARN-14** | Вільний вибір та адаптація | Користувач може перейти з «усе вперемішку» до одного модуля, а потім назад **без втрати прогресу**; система не нав'язує лише один шлях |
| **LEARN-15** | Персональна прозорість | Для кожної рекомендації: «Чому це завдання зараз?», напр. due SRS, багато помилок у listening, мало speaking практики |
| **LEARN-16** | Приватність і контроль | Профіль навичок, помилки, повторення і raw answers зберігаються за діючими privacy-правилами, доступні export / delete |

**Adaptive Mix не означає бездумний random:** алгоритм підтримує coverage, використовує обмежені випадкові перестановки й interleaving після перевірки навчальної мети; має бути відтворюваний для QA. Система може виділити слабкій навичці більше часу, але не перестати тренувати інші.

## 4. Режим B — максимально достовірна симуляція (EXAM-*)

| ID | Вимога | Прийняття |
|---|---|---|
| **EXAM-01** | Повноцінний окремий режим | «Скласти пробний YKI» не містить SRS, навідних правил чи підказок до завершення |
| **EXAM-02** | **Full YKI** | Усі 4 модулі в належній структурі; типи/розподіл/час лише після офіційного підтвердження; до того явно «навчальна репетиція» |
| **EXAM-03** | **Individual subtests** | Кожен із reading/listening/writing/speaking можна пройти *незалежно*, без інших модулів |
| **EXAM-04** | Окрема пара модулів | Опційна `custom practice`; називати «офіційний partial YKI» лише для підтвердженої OPH конфігурації та дати |
| **EXAM-05** | Екзаменаційна дисципліна | Перед стартом інструкції фінською; завдання/вибір/введення/голос; ключі/пояснення приховані; під час спроби немає педагогічних втручань |
| **EXAM-06** | Строга fidelity конфігурацій | `official_verified` на рівні КОЖНОГО параметра (порядок, час, кількість завдань, audio replay, pause, navigation, recording), з датою й джерелом; непідтверджене — лише навчальна UX-імітація |
| **EXAM-07** | Адекватний обсяг і складність | Повна симуляція потребує достатньої кількості **унікальних**, S2-рецензованих завдань чотирьох навичок, listening різних живих голосів, writing різних жанрів, speaking монолог/діалог/реакції |
| **EXAM-08** | **Окреме оцінювання** | Результат за кожним обраним модулем, objective key accuracy окремо; open/writing/speaking `ungraded`, якщо немає каліброваного рецензента |
| **EXAM-09** | Порівняння репетицій | Історія спроб із незнайомим item bank, версією завдань, датою, часом, обраним scope; динаміка без хибної «гарантії складання» |
| **EXAM-10** | Відновлення/переривання | Не втрачати написане; невідома поведінка офіційного тесту **не** видається за відтворену; технічне переривання позначається `interrupted`, не `failed` |
| **EXAM-11** | Без витоку відповідей між режимами | Два пули: `learn` (видимий фідбек) та `held_out_exam` (нові задачі без попереднього exposure); використані тестові питання не видавати за unseen assessment |
| **EXAM-12** | Підтримка навичок із мікрофоном | Speaking-only mock запускається і зберігає спробу без необов'язкових reading/listening; при відсутності mic — чесне `not_assessed`, текстовий fallback не оцінює вимову |
| **EXAM-13** | Неофіційний статус | Кожен mock clearly marked `independent practice`, OPH/JYU не пов'язані з продуктом, реальна офіційна оцінка не обчислюється з відсотка |
| **EXAM-14** | Офіційні конфігурації позначаються окремо | `official_partial_day` містить лише OPH-confirmed allowed modules; `single_skill_practice` **не** приписувати офіційній даті |
| **EXAM-15** | Обмеження екзаменаційного таймера | Доки точні обмеження OPH не підтверджено — таймер тільки як явно налаштований `practice_timer`, не «YKI 2027 official timing» |

**Успіх в окремому модулі** не дає автоматично оцінку в непрохідних модулях. **Full** не об'єднує чотири навички в один «відсоток складання»; відображення — чотири незалежні результати з позначкою валідності.

## 5. Єдина інформаційна архітектура і навігація (UX-*)

```text
Головний екран
  "Що сьогодні робимо?"
  [ 🧠 Ефективна підготовка ]   [ 🎓 Скласти пробний YKI ]

Після натискання ПІДГОТОВКА
  "Що тренуємо?"
  [ 🔀 Усі навички вперемішку — рекомендовано ]
  [ 📚 Усі навички за програмою ]
  [ 📖 Читання ] [ 🎧 Аудіювання ] [ ✍️ Письмо ] [ 🗣️ Говоріння ]
  [ ⏱ 10 / 20 / 30 хв ] [ ▶ Почати місію ]

Після натискання СИМУЛЯЦІЯ
  "Який пробний тест складаємо?"
  [ 🏁 Повний YKI — усі 4 навички — рекомендовано ]
  [ 📖 Читання ] [ 🎧 Аудіювання ] [ ✍️ Письмо ] [ 🗣️ Говоріння ]
  [ ⚙ Комбінація модулів ] (опційно)
  [ ⓘ Офіційний digital-формат: confirmed / not yet confirmed ]
  [ ▶ Почати екзамен ]
```

- **UX-01:** однакова ідентичність модулів скрізь (ідентичні ID, назви й іконки).
- **UX-02:** користувач завжди знає **режим** і **scope** — бейдж/назва у верхній частині екрана.
- **UX-03:** default має вести до корисного результату за 1–2 дії; відобразити останній scope, кнопку «Продовжити».
- **UX-04:** у кожної кнопки є реальна дія; недоступні модулі пояснені як «в розробці», не створюють порожніх вікон.
- **UX-05:** єдиний «Мій прогрес»: 4 навички окремо; перемикач `Навчання | Пробні іспити`; збереження навчання і сесій у різних namespace, без змішування метрик.
- **UX-06:** adaptive mix не змушує користувача робити speech з увімкненим мікрофоном; пауза/зміна scope без втрати завершених завдань.
- **UX-07:** коротка допомога «Навчання дозволяє підказки — Симуляція приховує підказки» під час першого входу, без багатокрокової реєстрації.
- **UX-08:** доступність mobile-first, клавіатура/скрінрідер, статуси без покладання лише на колір; no autoplay/startling animations.

## 6. Архітектурний контракт і захист валідності

### 6.1. Тип сесії

```ts
type Skill = "reading" | "listening" | "writing" | "speaking";
type MainMode = "learn" | "exam";
type LearnScope = "adaptive_mix" | "structured_all" | "single_skill" | "custom_mix";
type ExamScope = "full_exam" | "single_subtest" | "practice_subset" | "official_partial_profile";
type Session = {
  id: string;
  mainMode: MainMode;
  scope: LearnScope | ExamScope;
  selectedSkills: Skill[];             // non-empty, unique, valid
  isExam: boolean;                    // must agree with mainMode
  userPracticeTimeMinutes?: number;   // not an OPH timer
  examProfileId?: string;             // versioned fidelity policy
  contentVersion: string;
  taskIds: string[];
  state: "new" | "active" | "paused" | "finished" | "interrupted";
};
```

- `learn/adaptive_mix` та `learn/structured_all` **вимагають усі 4** skills.
- `learn/single_skill` і `exam/single_subtest` **вимагають рівно одну** skill.
- `exam/full_exam` **вимагає 4** і **не перемішує** порядок модулів наосліп.
- `exam/practice_subset` вимагає 2–3 skills (або інше явно задокументоване `practice` scope), **не** називається офіційним parcial test.
- `exam/official_partial_profile` прив'язаний до конкретного `date` + `allowedSkills` з OPH і не дозволяє іншу комбінацію.
- Всі контентні записи мають `skill`, `task_type`, `difficulty_hint`, `teacher_review_status`, `provenance`, `content_version`, `training_exposure_count`, `assessment_eligibility`.
- Єдиний `task engine`, **різна policy**: у learn hints/repair/SRS **on**, у exam **off**, feedback **delayed**, only eligible held-out content.
- Не допускається `answer_key` у клієнтському екзаменаційному завданні до завершення, коли є server exam mode. У поточному static client **повна технічна ізоляція ключів не гарантується**; це прототип, про це повідомляти чесно.

### 6.2. Шари

1. **Content registry:** `content/b1/**`, four-skill normalized tasks, verified source/rights, item version.
2. **Session planner:** створити валідний skill-filtered план, coverage, anti-repetition, seedable practice selection, blueprints for exam.
3. **Learning engine:** adaptive diagnostics, SRS, feedback, self-repair, transfer.
4. **Exam engine:** policy-driven test assembly, exam UI, delayed per-skill result, verified fidelity flags, no intervention.
5. **Learner record:** окремі `learningAttempts`, `spacedReviews`, `practiceExamAttempts` і `skillEvidence`; export/delete.
6. **Validated assessment adapters:** exact key for objective, human / quality-controlled feedback for productive, no CEFR inference from single item.
7. **Cross-mode progress:** after finishing exam may recommend training weak skills, **але не показувати тестові еталони наперед**, не переносити відкритий test bank у learning bank без exposure flags.

**Non-goal MVP:** жодна з нових вимог не означає, що поточний прототип `app/index.html` або `app/exam.html` уже вміє повний селектор чи повний YKI. Після реалізації інтерфейс можна позначити `implemented` тільки за відповідним acceptance test.

## 7. Критерії приймання (матриця тестування, не декларація виконання)

| № | Сценарій перевірки | Очікувана поведінка |
|---|---|---|
| **AC-01** | Відкрити застосунок | Дві чітко відокремлені картки `Навчання` / `Симуляція` |
| **AC-02** | Learning → all/mix | У навчальній сесії можуть з'являтися **всі 4** навички, адаптивне чергування, без blind random |
| **AC-03** | Learning → all/structured | 4 навички, зрозумілий тематичний/компетентнісний план |
| **AC-04–07** | Learning → each single skill | Тренуються лише reading / listening / writing / speaking відповідно |
| **AC-08** | Learning → first wrong response | Підказка → guided self-repair → transfer → SRS, прогрес зберігається |
| **AC-09** | Learning → switch scope mid-day | Історія не втрачається, next mission враховує новий вибір |
| **AC-10** | Exam → full | Показані всі 4 модулі, умовний порядок тільки якщо офіційно підтверджений, допоміжних підказок до кінця немає |
| **AC-11–14** | Exam → each single subtest | Можна стартувати/закінчити будь-який один модуль **без решти трьох** |
| **AC-15** | Exam → user chosen practice subset | Можна обрати 2–3 модулі; чітке `practice` позначення, без фейкової доступності офіційної реєстрації |
| **AC-16** | Exam → official partial date | Пропонуються тільки офіційні підтверджені конкретною датою `allowedSkills` |
| **AC-17** | Exam → answering | Відсутні навчальні hints, SRS, repair і зразкові відповіді до завершення |
| **AC-18** | Exam → finish | **Окремі результати тільки обраних модулів**: objective accuracy, open/writing/speaking `ungraded` без калібрування |
| **AC-19** | Resume after reload | Exam progress повертається; голосовий файл не вважається збереженим, якщо його немає |
| **AC-20** | Completed exam → practice recommendation | Є пояснений план на слабкі навички, екзаменаційні test items не повторюються без `exposed` flag |
| **AC-21** | Repeated mocks | Невідомі задачі, content version, порівнювані реальні skill metrics; не прогнозувати офіційний YKI бал |
| **AC-22** | Unverified OPH timer/replay/navigation | Параметри маркуються `practice`, не видаються за офіційні |
| **AC-23** | App without microphone permission | Текстова альтернатива і ясне `speaking not assessed`, **не** автоматична помилка |
| **AC-24** | Порожній або недостатній банк вправ | Чесний блокер «недостатньо перевірених завдань», не циклічне повторення під виглядом нового mock |

## 8. Пріоритет реалізації та вимірювання якості

- **P0 — Product foundation:** home mode cards, one shared 4-skill taxonomy, training/exam selection, full vs one-module mock, persistence of selections, strict no-hint exam policy, accurate results by skill, automated acceptance tests.
- **P0 — Training value:** довести `adaptive_mix`, `single_skill`, confirmation of gaps, real-time feedback/retrieval/SRS, four-skill coverage; speaking/writing participation without false grading.
- **P1 — Authenticity:** four-skill exam blueprints with independent item banks and enough **teacher-approved** content, multi-speaker Finnish, verified audios, 3-writing-task full rehearsal, real speaking task families.
- **P1 — Post-pilot OPH verification:** лише офіційно підтверджені параметри вводити як hardcoded exam-profile requirements; provenance stored in machine-readable ledger.
- **P2 — Validated assessment:** calibrated human-anchor writing/speaking feedback, confidence and abstention; analytics of true delayed transfer, not only superficial engagement.

**Метрики успіху:** completion of study mission; 7/14-day independent retention; balanced 4-skill coverage; decrease in repeated errors; time-to-first-correct on unseen transfer; completion/resumption of mock; screen-reader/keyboard E2E. Жодна цифра тут не є гарантією складання державного іспиту.

**Висновок:** два режими мають спільний контент і профіль, але різні правила навчального втручання та оцінювання. В обох обов'язкові **all skills** і **кожна skill окремо**; `adaptive mixed all` притаманний передусім навчанню, а `full YKI` — строго керована симуляція, наскільки це дозволяють перевірені специфікації.
