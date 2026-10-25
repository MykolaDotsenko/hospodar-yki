# 22 — Пам'ять, увага, звук, візуальні ефекти та реальне навчання L2

**Дата оцінки:** 2026-10-22. **Тип:** preliminary critical synthesis із вибірки оглядів, метааналізів і нормативних стандартів; **не** повний систематичний PRISMA review, **не** експеримент Hospodar YKI.
**Population target:** дорослі україномовні A2.2→B1+, фінська мова/YKI, Web/Android.
**Діє в межах:** [research program](../RESEARCH-PROGRAM.md); продовжує [67 методик](08-learning-methods-evidence-2026-10.md), [діючий learning-engine design](yki-methodology-implementation-v1.json), [visual L2 review](../design/17-color-attention-l2-deep-dive.md) і [multimodal UX review](../ux/20-multimodal-interactive-learning-2026-10.md). **Нічого не дублює в їхніх машинних даних.**

**Новий critical design/audio follow-up (25.10.2026):** [18 — L2 captions, music contradictions, emotional design, visual signaling and sound/motion safeguards](../design/18-multisensory-learning-interface-evidence-2026-10.md). Огляд продовжує MEM/ATT/AUD, не додає нові learning methods або другий бібліографічний JSON. Спеціально враховано 2025 L2-captioning meta-analysis, 2026 audiovisual L2 study, 2026 seductive-details meta-analysis і конфлікт 2022/2023 background-music reviews. `SENS`/UX tests — **design interventions/targets, not measured outcomes**.

## Еvidence-to-product: сім перевірених напрямків

### MEM-01 — Retrieval + spaced repetition: пріоритет P0
- **Докази:** Dunlosky et al. (2013) узагальнюють високий general utility для practice testing та distributed practice; Kim et al. (2022), *Language Learning*, meta-analysis 48 L2 experiments, 3,411 learners, підтверджує переваги spaced L2 practice, особливо на delayed tests. Equal vs expanding intervals не показали статистично надійної переваги одного над іншим.
- **Межі:** meta-analysis не задає магічний «ідеальний 1/3/7/14/30» календар для кожного фінського слова. UI успіх одразу після підказки не дорівнює довгостроковій пам'яті.
- **Пропозиція:** здогадатися/самостійно відтворити \`chunk\` → targeted feedback → повторне застосування в *новій* ситуації; scheduled due items без нескінченного бездумного кліку. Вести exposure, first independent response та повторні перевірки окремо.
- **Тест:** 7/14/30-day delayed unseen production/reading/listening; comparison with time-matched rereading; no EXAM hint leakage. \`EXPERIMENT\` для вибору оптимальних scheduler parameters.
- **Джерела:** [Dunlosky 2013, DOI](https://doi.org/10.1177/1529100612453266); [Kim et al. 2022 L2 spacing meta-analysis, DOI](https://doi.org/10.1111/lang.12479); [Carpenter et al. 2022 review, DOI](https://doi.org/10.1038/s44159-022-00089-1).

### MEM-02 — Meaningful production, elaboration and feedback: P0
- **Докази:** Rice & Tokowicz (2020), adult L2 vocabulary review: isolated massed L1↔L2 form drills are limited unless combined with form-meaning connections, spaced retrieval and elaboration. Це L2-огляд, не пряма перевірка нашого Finnish/YKI UX.
- **Пропозиція:** навчання через комунікативну задачу (орендодавець/магазин/робота), спочатку зміст → самостійна відповідь → помилка по суті/формі → prompted self-correction → transfer task із новими словами/контекстом.
- **Тест:** оцінювати значеннєву адекватність та граматичний контроль **окремо**, з blind scoring human Finnish reviewer where applicable; не рахувати copying/model rewrite як independent competence.
- **Джерело:** [Rice & Tokowicz 2020, ERIC](https://eric.ed.gov/?id=EJ1251020).

### FEED-01 — Письмо: глибокий зміст + корекція форми, не тільки граматика (P0)
- **Доказ:** meta-analysis у *Learning and Instruction* (2024) порівняв типи письмового фідбеку; surface-level feedback може допомагати поверхневим помилкам, deep-level — ідейному змісту, а комбінований — обом вимірам. У різних групах L1/L2/FL ефекти відрізнялися, тому жодне абсолютне правило для Finnish не виводимо.
- **Дизайн:** у LEARN оцінювати виконання завдання та зрозумілість до виправлення відмінків; 1–3 пріоритетні feedback points, self-repair, unseen rewriting; human-review productive rubric у graded flows.
- **Тест:** зміна communicative success, coherence і form control на новому письмовому завданні через 7–14 днів, blind rating, не кількість AI-підказок.
- **Джерело:** [2024 feedback meta-analysis, DOI](https://doi.org/10.1016/j.learninstruc.2024.101961).

### ATT-01 — Visual signaling, coherence and cognitive-load protection: P0
- **Докази:** Fiorella & Mayer (2021) принципи coherence, signaling, spatial/temporal contiguity зменшують зайву обробку; Noetel et al. (2022) overview of 29 systematic reviews / 1,189 studies finds benefits from signaling, spatial/temporal alignment and **captioning second-language videos**. Це не схвалення довільної анімації на кожній кнопці.
- **Пропозиція:** **одна основна ціль на екран**; релевантна ілюстрація поруч із текстом; semantic highlighting для пошуку конкретного правила, який згасає перед незалежною спробою; одна керована action за раз. Усі key cues мають текстову/формальну альтернативу, не тільки колір.
- **Ризик:** яскрава анімація / декоративні звуки можуть підвищувати excitement, але забирати робочу пам'ять та погіршувати language transfer.
- **Тест:** matched condition з еквівалентним змістом/часом; delayed comprehension/production, error rate, reading time, sensory-discomfort reports.
- **Джерела:** [Cambridge Handbook 2021](https://doi.org/10.1017/9781108894333.019); [Noetel et al. 2022, systematic-review overview](https://doi.org/10.3102/00346543211052329).

### AUD-01 — Finnish audio + captions/transcripts, without untested audio tricks: P0/P1
- **Evidence transfer:** огляди multimedia design підтримують доступність і корисність L2 captions, але **оптимальна послідовність** «перший прохід без тексту» vs «текст одразу» для Finnish/YKI потребує окремого A/B і врахування рівня/слухових потреб.
- **Пропозиція:** якісний природний фінський голос, явний play/replay, optional slower segment, phrase-level transcript/captions, meaningful pauses, visible audio progress, simple alternative when audio denied. У LEARN учень може сам керувати підказками; у EXAM політика надання субтитрів/повторів визначається *перевіреним* профілем симуляції та доступністю, без вигаданих правил OPH.
- **Захист:** не ховати субтитри/транскрипцію від учнів, яким вони потрібні як доступність; фіксувати їхній вплив на валідність оцінки, не «караючи» за користування функцією.
- **Тест:** gist/details on *new* Finnish speakers/audio at 7–14 days, accessibility and mic-denial fallback.
- **Джерела:** [Noetel et al. 2022](https://doi.org/10.3102/00346543211052329); [W3C accessible audio/video](https://www.w3.org/WAI/media/av/); [CAST UDL v3](https://udlguidelines.cast.org/).

### AUD-02 — Background music, binaural beats and frequency claims: P2 / NO DEFAULT ACTIVATION
- **Докази:** Cheah et al. (2022), systematic review of 95 studies (154 experiments), reports heterogeneous methods/inconclusive effects of background music on cognition. A 2022 meta-analysis on binaural beats reported a pooled effect in memory/attention, **but also conflicting frequency-specific findings and explicitly called for stronger studies**. Neither establishes reliable YKI learning gains, «alpha/theta brain tuning», or a universal background soundtrack.
- **Продуктова позиція:** sound off by default during reading/writing/EXAM; never mix background audio with Finnish prompts; optional **user-initiated** ambient audio only after privacy/a11y/performance consideration and robust controlled evaluation. No medical or brainwave-performance claims.
- **Тест:** quiet vs instrumental vs speech/lyrics vs optional binaural beats (only if ethically justified) matched time/content, headphone/use baseline, participant preference/expectancy, delayed unseen performance and adverse distraction. Reject if objective language gains absent or distraction increases.
- **Джерела:** [Cheah et al. 2022, DOI](https://doi.org/10.1177/20592043221134392); [binaural beats systematic review/meta-analysis, PubMed](https://pubmed.ncbi.nlm.nih.gov/35842538/).

### UX-01 — Accessible, controllable multisensory UI rather than compulsory effects: P0
- **Нормативне джерело:** W3C WCAG 2.2 **1.4.2 Audio Control** addresses automatic audio; **2.2.2 Pause Stop Hide** addresses distracting auto-moving content; **2.3.3 Animation from Interactions** concerns motion reduction; CAST UDL 3.0 recognizes variability and multiple ways to engage, represent, and respond.
- **Дизайн-правила:** no autoplay decorative sound; reduce-motion defaults from OS, no flashing/attention traps; silent/reduced-effects switch, descriptive text control, keyboard/screen-reader paths, controllable captions, optional Finnish listening. **Не створювати фіксованих типів «аудіал/візуал/кінестетик».**
- **Джерела:** [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [W3C audio control](https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html), [W3C pause/stop/hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html), [CAST UDL](https://udlguidelines.cast.org/), [Pashler et al. 2008 learning styles review](https://pubmed.ncbi.nlm.nih.gov/26162104/).

### GAM-01 — Interactive mechanics must preserve learning objective: P1
- **Поточна база:** [existing task/IV2 evidence](../ux/20-multimodal-interactive-learning-2026-10.md) і [gameplay loops](../gameplay/gameplay-learning-loops-v1.md) вже містять конкретні механіки; тут **немає** нового каузального твердження про перевагу конкретної гри.
- **Пропозиція:** NPC interaction як meaningful information gap, not a click quest; choice requires producing Finnish, future recall in new contexts, non-game accessible alternative; no XP reward for guessed multiple choice as independent language mastery.
- **Тест:** matched game-vs-form instructional content, delayed independent L2 transfer, frustration/distraction/equity guardrails; actual Web+Android evidence before adoption.
- **Статус:** \`EXPERIMENT\`, not \`PROVEN_FOR_YKI\`.

## Контрдокази і ризики, які **заборонено приховувати**
- Рейтинги existing methods /100 — **експертна придатність**, не standardized g, відсоток покращення або доказ «найкращого застосунку».
- Тест без повторення самостійної відповіді в *новій* ситуації може переоцінювати лише впізнавання.
- Кольори, музика, капшени, анімації — **не інтервенція самі по собі**; результат залежить від завдання, модальності, досвіду, слухових і когнітивних потреб.
- Відкинути «learning-style matching» як непідтверджену основу персоналізації; натомість user choice, observable performance, required skill and accessibility.
- Звукові/візуальні ефекти не повинні знижувати доступність, викликати сенсорне перевантаження або руйнувати контроль EXAM.

## Наступні конкретні перевірки (ще не проведені)

1. Retrieval vs equivalent rereading, tested at day 7 / day 14 on **new Finnish situations**, separate recognition/production.
2. Caption placement/timing + learner choice vs audio-only baseline; controlled delay; accessibility exception preserved.
3. Meaningful focus cue vs plain layout vs decorative-animation layout; delayed meaning and grammar outcomes.
4. Plain-task vs NPC quest with matched item exposure/time; participant pre-registration.
5. Silent by default vs optional neutral sounds **only if there is a credible targeted use case** and privacy/a11y guardrails.
6. Speaking rhythm and Finnish quantity minimal pairs with human reviewer; don't infer native pronunciation quality from ASR text.

**How to measure:** [UX research impact protocol](../ux/learning-impact-evaluation-protocol.md); **How to implement after validation:** [EVIDENCE-TO-UX](../../docs/guides/EVIDENCE-TO-UX.md). **All experiment results remain NOT RUN until actual evidence is committed.**
