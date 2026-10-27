# Hospodar YKI — evidence-to-learning research program

> **Follow-up 24.10.2026:** [controlled form-meaning grammar practice and AI-feedback syntheses](pedagogy/25-pragmatics-processing-notes-finnish-2026-10.md#8-доказовий-follow-up-24102026-контрольоване-граматичне-навчання-та-ai-feedback), now **70 canonical methods / 80 bibliography IDs (78 unique scientific/official URLs; 2 historical aliases retained)**, expert /100 values unchanged; implementation still unvalidated.

> **Оновлено 24.10.2026:** [глибинний аудит 3 нових доказових підходів](pedagogy/25-pragmatics-processing-notes-finnish-2026-10.md); актуальні канонічні **70 методик і 77 джерел** (не другий реєстр). Продуктові бали ≠ measured outcomes, перевірка unseen через 7/14/30 днів — майбутній експеримент.

**Статус:** ACTIVE RESEARCH PROCESS / NOT AN IMPLEMENTED FEATURE. **Започатковано:** 2026-10-22.
**Мета:** підвищувати **самостійну комунікативну компетентність фінською** у дорослих україномовних учнів від ~A2.2 до стабільного B1/B1+, окремо у 4 навичках YKI. Ми не маємо доказів, що Hospodar уже є «найефективнішим застосунком світу».

## Обов'язковий прикладний висновок із КОЖНОГО дослідження — Research → Hospodar YKI (26.10.2026)

**Завжди застосовувати:** незалежно від теми пошуку (когнітивна психологія, лінгводидактика, кольори, звук, увага, мотивація, gamification, YKI, доступність, нові технології), **не зупинятися на переказі джерел**. Для кожного нового огляду та кожної суттєвої знахідки **явно обміркувати, що саме і як покращить Hospodar YKI**. Якщо релевантного застосування немає — **пояснити чому** й обрати `REJECT`/`RECHECK`, а не створювати декоративну або небезпечну функцію.

### Обов'язковий research-to-product блок

1. **Що встановлено?** Точне джерело, дата, population, intervention/comparator, outcome, limitations, contradictory/null evidence, causality status; не трактувати `g/d` як %.
2. **Наскільки це переноситься на Hospodar?** Україномовні дорослі A1.3–B2.1, контекст фінської, `kirjakieli/puhekieli`, чотири навички, телефон/offline та LEARN vs EXAM. Окремо позначити `DIRECT_FINNISH` / `L2_GENERAL` / `INDIRECT` / `HYPOTHESIS`.
3. **Яке рішення?** Назвати конкретну **навчальну проблему** (наприклад, плутання `-ssa/-sta/-Vn`, недостатнє слухання іншого мовця), запропонувати **мінімальний** lesson/mechanic/UI/content change, показати один фінський приклад та learner action.
4. **Що зберігаємо й чим ризикуємо?** Чітка first-independent-answer/fidelity межа; S2-редактура й права; доступність, user choice, low distraction, privacy; жодних витоків EXAM-підказок або фіктивних YKI grade.
5. **Як зрозуміємо, що стало краще?** Сильний time/content-matched control, видима версія функції й тест/QA, **новий** independent communicative task через 7/14/30 днів (за придатності), baseline та чотири навички окремо. Для exam fidelity — джерела OPH + відтворювані E2E-умови; не вимірювати YKI схожість retention metric.
6. **Що робимо далі?** `ADOPT`, `ADAPT`, `EXPERIMENT`, `REJECT` або `RECHECK`; пріоритет P0/P1/P2 (лише обґрунтований), фізичний owner (`learning/`, `app/`, `assets/`, `brand/`, `docs/`), залежності, acceptance criterion і посилання на task/PR після появи. **Результат research може бути "не впроваджувати".**

**Короткий формат для кожного відкриття:**
`Finding + source → applicability/uncertainty → learner problem → Hospodar implementation/example → LEARN/EXAM & safety → testable outcome → decision/owner/priority`.

**Принцип вибору:** користь користувачеві (самостійне розуміння, говоріння, письмо, читання, запам'ятовування, довіра), а не кількість фіч/балів/кольорів. Дотримуватися [гейта реалізації](../docs/guides/EVIDENCE-TO-UX.md) і [UX-протоколу](ux/learning-impact-evaluation-protocol.md). Огляд → специфікація → код → доказ на учнях **мають різні статуси**; research-PR сам по собі не впроваджує або не доводить ефекту.

## 12 напрямів у затвердженому порядку (28.10.2026)

**Єдина програмна черга для реалізації [29 — 12 дослідницьких напрямів: джерела, Finnish/YKI реалізація, завершення і контроль](29-twelve-product-research-studies-execution-2026-10.md)**: **R01 реальні delayed LEARN outcomes → R02 official digital YKI fidelity → R03 Finnish L2 morphology → R04 human-calibrated speaking/writing → R05 multi-talker audio → R06 transparent adaptation → R07 meaningful interactive UX → R08 case/stem/feedback transfer → R09 intrinsic motivation → R10 accessibility → R11 offline/durable state → R12 fair competitor evaluation**. Всі 12 **desk reviews/source synthesis documented**, учасницькі дослідження **0/12 NOT RUN**, manual OPH digital demo та pilot 7.11/14.11 **не верифіковані**. Це один **план координації** існуючих власників, не другий методичний каталог; зберегти 70 canonical methods/ratings.

**Не переходити від літератури до фрази «функція працює» без коду/CI/S2 та реальної participant-validation.** Для R01 протокол готовності деталізовано в [існуючому UX evaluation owner](ux/learning-impact-evaluation-protocol.md); для R02 першоджерела мають вищий пріоритет, ніж наші mock screenshots.

## 1. Три незалежні перевірки кожної ідеї

1. **Science / істинність:** що точно виміряно, з яким контролем, для кого, протягом якого терміну? Чи це causal L2/Finnish evidence, інша мова/вік, загальна психологія або припущення?
2. **Learning & UX / механізм:** що конкретно має *зробити учень* фінською, яка роль звуку/зображення/жесту/гри, який ризик зайвого когнітивного навантаження, яку доступну альтернативу матиме користувач?
3. **Engineering & impact / доказ у продукті:** де буде реалізовано механіку, як ізольовано EXAM, який baseline/контроль, яка метрика незалежного відкладеного відтворення і переносу, чи зберігаємо приватність?

**Правило:** спочатку навчальна функція, потім аудіовізуальний ефект. Не приймати метод за кількістю лайків, маркетингових тверджень, immediate multiple-choice accuracy або 100-бальним експертним score.

## 2. Реальні власники матеріалів — без нових реєстрів

| Тип роботи | Де фізично зберігати | Що вже існує / куди посилатися |
| --- | --- | --- |
| Когнітивна психологія, пам'ять, увага, L2/CEFR, SRS, feedback, AI tutor | [pedagogy/](pedagogy/README.md) | 67 методик, 69 cited sources у [08](pedagogy/08-learning-methods-evidence-2026-10.md); [12 ефективність](pedagogy/12-finnish-yki-learning-effectiveness-2026-10.md), [existing JSON](pedagogy/learning-methods-v1.json) |
| Інтерактивність, accessibility, multimodal UI, cognitive load, experimental UX | [ux/](ux/README.md) | [IV2](ux/20-multimodal-interactive-learning-2026-10.md), [UX-backlog](ux/ux-research-backlog-v1.md), [evaluation protocol](ux/learning-impact-evaluation-protocol.md) |
| Кольори, visual cues, typography, animation, perceptual attention | [design/](design/README.md) | [17 color evidence](design/17-color-attention-l2-deep-dive.md), production brand tokens elsewhere |
| NPC, reward design, quests, serious games | [gameplay/](gameplay/README.md) | [gameplay loops](gameplay/gameplay-learning-loops-v1.md) |
| Real-world journeys, low-energy sessions, accessibility and failure cases | [user-cases/](user-cases/README.md) | [UC flows](user-cases/core-flows-v1.md) |
| YKI/OPH/CEFR claims and examination fidelity | [yki/](yki/README.md) | Existing official-vs-assumed review; never treat predictions about 2027 UX as official |
| Approved app requirements, ADR, accepted UI/UX implementation contracts | [../docs/](../docs/INDEX.md) | [research-to-product handoff](../docs/guides/EVIDENCE-TO-UX.md); no second research registry |
| Actual exercises, local media, sources | [../learning/](../learning/README.md), [../assets/](../assets/README.md), [../sources/](../sources/README.md) | Do not copy externally protected media; content ownership and attribution remain there |

**Останнє доповнення (24.10.2026):** [світова порівняльна синтеза ефективності фінської A2.2→B1+](pedagogy/24-global-best-methods-finnish-2026-10.md). Історичний source count того огляду був **70**, methods count **67**; актуально **77/70**; додано новий extensive-reading L2 meta до існуючого методу, без створення дубльованого реєстру чи нових вигаданих балів.

**Не робити:** нового \`research/catalog\`, загального \`evidence-registry\`, копій наявних JSON, другого «рейтингу методів» або кількох файлів для однієї й тієї самої знахідки. Нова стаття → доповнення тематичного огляду; нова самостійна тема → один тематичний Markdown із посиланням у відповідному README. Старі огляди не переписувати без traceable correction.

## 3. Методологія дослідження (repeatable protocol)

1. **Question (PICO/PICOT):** Population (дорослий україномовний A2–B1); Intervention (конкретна механіка); Comparator (активний baseline з еквівалентними часом/контентом); Outcome (4 навички, 7/14/30-day delayed *unseen* transfer), Time (тривалість), context/device. Фіксувати наперед.
2. **Search & triangulate:** офіційні стандарти + DOI/peer-reviewed primary research + meta-analysis/systematic review + незалежні реплікації; шукати **негативні** та null effects, невідомі популяції, публікаційне зміщення. Дати публікації/перевірки, DOI, inclusion/exclusion, exact intervention, measures й limitations.
3. **Evidence status:** \`REVIEWED_PRIMARY\`, \`META_REVIEWED\`, \`EXTRAPOLATED\`, \`CONFLICTING\`, \`HYPOTHESIS_ONLY\`, \`INSUFFICIENT\`. Окремий \`implementation_status\`: \`RESEARCH_ONLY\`, \`SPEC_DRAFT\`, \`PROTOTYPE\`, \`IMPLEMENTED_TESTED\`, \`PRODUCT_VALIDATED\`. \`CONFLICTING\` не видаляти, а документувати.
4. **Fidelity:** по можливості вказати population, n, control, delayed follow-up, effect size (назва шкали, довірчий інтервал), bias limitations і оцінку applicability до **Finnish/YKI**. Не копіювати чужу стандартизовану величину як «+40% у нас».
5. **Prioritize:** спочатку evidence of real learning, fit to YKI, reversibility, accessibility, cost and user agency. Дозволений **engineering priority score /100**, але без підміни виміряного навчального ефекту чи шансу скласти YKI.
6. **Translate:** кожна прийнята механіка описується як learner action → bounded UI behavior → consent/a11y/sensory fallback → necessary domain event → cross-platform owner → acceptance test → experiment plan. Далі [handoff](../docs/guides/EVIDENCE-TO-UX.md).
7. **Pre-register evaluation:** baseline, target skill, control, primary metric, analysis/decision threshold, subgroup accessibility, competing explanation, negative outcomes і stop conditions **до** збору даних. Не видавати QA/mock учасників за реальних досліджуваних.
8. **Decide:** \`ADOPT\` / \`ADAPT\` / \`EXPERIMENT\` / \`REJECT\` / \`RECHECK\`. Зміни вимог — PR до **канонічного** документа й тестів, не мовчазна зміна на основі дослідницького Markdown.
9. **Maintenance:** перевіряти офіційні стандарти/нові огляди під час нового feature-PR і при змінах суттєвого доказу; зберігати дату перегляду й provenance. Відкриті питання передавати до власника теми.

## 4. Картка нового дослідження (вставляти у тематичний Markdown, не окремий registry)

\`\`\`text
Question / research ID: (e.g. AUD-01; stable ID unique within its topic)
Evidence status / checked date:
Population, context, level and tasks:
Intervention vs matched baseline:
Primary sources: DOI/official links, publication dates
Study type, n, measures, delayed interval, effect estimates and limitations:
Independent / conflicting / null findings:
How far evidence transfers to adult Finnish A2.2→B1+:
Design hypothesis: exact learner action and relevant visual/audio cue
LEARN vs EXAM boundary, teacher review and feedback leakage risks:
Accessibility, autonomy, reduced-motion/sound-off/captions and privacy:
Implementation owner / minimal experiment scope:
Primary delayed unseen language outcome, guardrails and failure criteria:
Decision and status: EXPERIMENT / ADOPT / REJECT / RECHECK; never invented outcome
Hospodar YKI practical benefit OR explicit reason to reject application:
Evidence applicability: DIRECT_FINNISH / L2_GENERAL / INDIRECT / HYPOTHESIS
Example Finnish learner action, before/after and target skill:
Concrete change proposal, physical owner, P0/P1/P2 + dependencies:
Strong comparator / independent deferred measure / acceptance criteria:
Link to relevant UX study/PR/actual test when available:
\`\`\`

## 5. Research tracks and staged priority

| Priority | Track | First concrete research question / primary measure |
| --- | --- | --- |
| P0 | Retrieval, spacing, interleaving, durable memory | Which independently recalled *Finnish chunks* survive 7–14-day unseen transfer versus equally timed rereading? |
| P0 | Meaning-first L2 task learning and corrective feedback | Does prompt-to-self-repair → unseen production reduce repeated errors in YKI-like speaking/writing? |
| P0 | Listening and speaking with human Finnish audio | With/without transcript, segmenting and slowed audio, does unaided gist/detail comprehension improve later on new recordings? |
| P0 | Cognitive load / visual attention | Do semantic cues or clean screen layouts improve new-task reading/production compared with extra animation/color? |
| P0 | Measurement, CEFR/YKI and exam integrity | Do independent outcomes align with four competencies, without bogus YKI grade prediction or leaked answers? |
| P1 | Multisensory design, captioning, sound cues | Does user-controlled cueing beat silence/clean baseline **without** slowing reading, accessibility or comprehension? |
| P1 | Adaptive scheduling / personalization / metacognition | Is adaptive targeted retrieval better than an equally timed fixed curriculum on unseen outcomes? |
| P1 | Attention/fatigue/goal setting and self-regulation | Does task-length choice and one-goal focus improve completed **independent** tasks without pressure? |
| P1 | Gamification, NPC quests, social/AI dialogue | Does a quest or dialogue cause better delayed oral/written transfer than matched plain tasks, rather than clicks alone? |
| P1 | Finnish phonology and pronunciation feedback | Improve Finnish vowel/consonant quantity (e.g. \`tuli–tuuli–tulli\`) using high-quality recordings and human-validated assessment; no score from ASR transcript alone. |
| P2 | Background music, binaural beats, rhythmic effects, haptics | Is there reliable L2-specific benefit beyond expectancy/silence controls? Default OFF; never medical/brainwave enhancement claims. |
| P2 | Comparative competitor UX and motivation | Benchmark workflows and transparent outcomes, not copy designs or claim causal superiority from marketing screenshots. |

## 6. Gates that protect the product

- **Research gate:** relevant evidence + contradiction search + negative/null outcomes + rights review; a product-fit /100 is not a learning outcome.
- **UX gate:** mapped mechanism, user-control and WCAG/UDL compatible fallback; separate concentration (self-report/observable task interruptions) from true memory/language evidence.
- **Engineering gate:** production state unchanged until a scoped ADR/spec PR and tests; React/Vite/Phaser/Room/PAD are TARGET until built.
- **Outcome gate:** human-reviewed Finnish accuracy, timed and delayed unseen tasks with active comparator, attrition/ceiling effects, and trust/comfort trade-offs. Progress metrics cannot be manufactured.

**Starting evidence:** [initial sensory/cognitive critical synthesis](pedagogy/22-memory-attention-sensory-learning-evidence-2026-10.md), [evaluation protocol](ux/learning-impact-evaluation-protocol.md). These are initial research documents, **not** a systematic review or data proving Hospodar is better than competitors.

## 7. Evolution without frozen counts

The current 67 reviewed methods and 69 cited sources are **a historical minimum, not a lifetime upper bound**. When a genuinely distinct, source-backed method is added, update the existing [canonical method records](pedagogy/learning-methods-v1.json), [one-to-one effectiveness ratings](pedagogy/learning-effectiveness-ratings-v1.json), [method cards](pedagogy/08-learning-methods-evidence-2026-10.md), [analysis report](pedagogy/12-finnish-yki-learning-effectiveness-2026-10.md) and any affected blueprint. All references must resolve, priority/rating model remain explicit and review/unknown efficacy must not be invented. The [validator](../scripts/validate_learning_methods.py) permits growth while failing on dropped IDs below the baseline, missing citations, unsorted ratings or mismatched counts; historical summaries may retain dated counts when clearly labeled. No new central method registry is created.

**Architecture gate:** [cross-platform pure-domain boundaries](../docs/architecture/MODULE-BOUNDARIES.md) protect implementation from coupling to the visual/auditory technology under study.

## Scope extension noted 2026-10-23

This research program initially studied the **A2.2 → B1/B1+** population. The **product** has expanded to [A1.3 → B2.1](../learning/curriculum/README.md). Do not generalize the old A2→B1 intervention scores or user-study effects to A1.3 and B2.1 without new baseline/retention studies stratified by level. Reuse the existing research library rather than creating a second evidence registry.
