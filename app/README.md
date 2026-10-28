# Hospodar YKI — runnable browser MVP

**Active Web LEARN backup/restore (28.10.2026, post-R12):** The real Progress screen now accepts earlier exported local V1 JSON and restores only after [R11 fail-closed validation](r11-legacy-migration-preflight.mjs), record-count preview and explicit prior-backup confirmation. [Restore module](learn-backup.mjs), [19 Node tests](tests/learn-backup.test.mjs), [real Chromium UI test](tests/learn-backup-browser.html). Export now preserves exact stored raw V1 bytes where safe; restore checks the previous value against competing tabs and verifies readback, attempting rollback after failure. **No V1-to-V2 migration, Android build, cloud upload, S2 content approval, EXAM change or durability guarantee.** Prior R11 reference-only note below describes the earlier state; that preflight is now indirectly used by this explicit active feature.

**R12 competitive snapshot 28.10.2026:** [source-based comparative research](../research/benchmark/r12-fair-finnish-yki-comparative-study-2026-10.md), [nine-product dated machine evidence](../research/benchmark/r12-competitor-evidence-snapshot-2026-10.json) and [21 Node anti-hype tests](tests/r12-benchmark-evidence.test.mjs). These tests validate documentation accuracy only and **do not modify the active app**. Hospodar Web 9-task EXAM and mixed current content must not be advertised as fully authentic, S2-approved or the official 2027 digital exam; Android 3–4GB remains unbuilt; no comparative learning outcomes exist.

**R11 safe migration research reference (28.10.2026):** [r11-legacy-migration-preflight.mjs](r11-legacy-migration-preflight.mjs) + [22 tests](tests/r11-legacy-migration-preflight.test.mjs) check whether old V1 LEARN localStorage would be silently filtered or truncated on reading and describe accurate not-saved / uncertain ACK / media-missing states; [R11 source analysis](../research/architecture/r11-offline-integrity-resilience-2026-10.md). **NOT imported into app.mjs, DOES NOT access storage, export, migrate, or delete data.** Existing EXAM V1 IndexedDB and experimental V2 and current browser progress unchanged. Android 3–4GB install-time asset packs not built.

**R10 accessibility source audit and limited real CSS improvements (28.10.2026):** high-contrast navy keyboard focus instead of insufficient-gold border, 44px controls, narrow 2-row threshold/one-column exam modules; [12 regression tests](tests/r10-accessibility-contract.test.mjs) and [UX R10 science/manual mobile matrix](../research/ux/22-r10-accessibility-mobile-qa-2026-10.md). Source tests ≠ WCAG AA certification: **rendered 320/360/390px mobile, TalkBack/VoiceOver, soft keyboard/mic denial, real Android PAD and users are NOT YET TESTED**. LEARN+EXAM original pedagogy/data unchanged.

**R08 canonical grammar research reference (28.10.2026):** [r08-grammar-core.mjs](r08-grammar-core.mjs) and [16 unit tests](tests/r08-grammar-core.test.mjs) model two independent decisions (case meaning then Finnish changed stem) and after-answer S2-keyed feedback/unguided new-context transfer. [Research №34](../research/pedagogy/34-r08-finnish-case-stems-meaning-transfer-2026-10.md) owns decisions; [14 original draft exercises](../learning/exercises/b1/grammar/r08-meaning-stems-original-drafts.json) deliberately **CANNOT** run in this engine until human S2 approval. **NOT imported into active app.mjs or Web/Android production and no data migration.** No algorithm generates arbitrary Finnish forms, and no YKI score is inferred.

**R08-MOT research reference (28.10.2026):** [r08-motivation-core.mjs](r08-motivation-core.mjs) with [16 Node tests](tests/r08-motivation-core.test.mjs), [gameplay evidence dossier №02](../research/gameplay/02-r08-motivation-autonomy-habits-2026-10.md). Opt-in 5/10/20-minute personalized if–then planning, local calm return after a break and honest skill-specific observed outcomes; no streak or notifications, no cloud or AI, strict EXAM exclusion. **NOT imported into app.mjs, not a rendered feature, not human-validated.** Existing saved progress untouched.

**R07 reference-only UX (28.10.2026):** [r07-interaction-core.mjs](r07-interaction-core.mjs) and [its unit tests](tests/r07-interaction-core.test.mjs) define LEARN-only user-driven Finnish audio/independent-first/feedback/repair/novel transfer and accessibility support. **NOT imported into app.mjs or active Web/Android learner, not a rendered screen or speech grader**. Related [UX R07 research #21](../research/ux/21-r07-meaningful-interactive-finnish-ux-2026-10.md); run node --test app/tests/r07-interaction-core.test.mjs. Current persistence unchanged.

**R06 RESEARCH PROTOTYPE (28.10.2026):** [adaptation-core.mjs](adaptation-core.mjs) + [isolated deterministic/negative-case tests](tests/adaptation-core.test.mjs). Ranks already human-approved local LEARN tasks by due review, first independent verified error, four-skill exposure and explicit preferences; **NOT imported into current app.mjs or active mission selection**, not a calibrated recommendation engine, not validated with real Finnish learners. See [research dossier №33](../research/pedagogy/33-r06-transparent-adaptive-finnish-learning-2026-10.md). Run node --test app/tests/adaptation-core.test.mjs. Existing SRS/progress state unchanged.

**Status:** independently runnable local prototype, not deployed, not officially calibrated. Built on the project's existing Finnish JSON content and OGG/MP3 files.

## Start

From the repository **root**:

```bash
python3 -m http.server 8080
```

Open **http://localhost:8080/app/** in a browser. Do not use `file://` because the browser blocks source JSON fetches. No installation, build, tokens or external API is needed.

**Tests** (Node >= 20): `node --test app/tests/*.test.mjs`; syntax `node --check app/app.mjs`.

## Впізнавана UI-граматика v0.3

Спільний SVG H-поріг на двох сторінках та gateway вибору режимів. **Новий фірмовий ThresholdLine** у навчальній місії показує етапи «Спроба → Перевірка → Контекст → Збережено», а у симуляції — чотири модулі в поточній тренувальній послідовності. Завдання й відповіді залишаються найважливішими, без AI-шаблонних декоративних карток і градієнтів. Малий екран ≤380px використовує вертикальний вибір режиму й 2-колонкові мітки навичок. Активна екзаменаційна спроба приховує gateway.

**Колір дозволено**, якщо він допомагає ієрархії/орієнтації; семантична палітра чотирьох навичок із явними підписами. Додаткові вимоги, включно з calm mode та UX-тестами: [Brand v0.3](../brand/identity-v03-screen-system.md) і [ТЗ](../docs/15-two-modes-skill-scopes.md). Точна симуляція OPH та повний окремий 4-skill роутинг ще не реалізовані.

## ⭐ Новий реалістичніший режим Digitesti (21.10.2026)

**[▶️ Запустити окрему репетицію `exam.html`](exam.html)** — або напряму `http://localhost:8080/app/exam.html`.

Використовує **обидва оригінальні 4-навичкові набори**, `9` завдань на один (3 reading, 4 listening, 1 writing, 1 speaking). Зрозумілий послідовний UI, відповіді/чернетки зберігаються локально, необов'язкові **навчальні** таймери 15/30/60 хв, відкладені ключі після завершення, результати окремо за навичками, `ungraded` для open/writing/speaking, локальний голосовий запис зі згодою, експорт JSON.

Це **не** повна достовірна копія цифрового YKI 2027: офіційні exact UI/timers/audio-replay не опубліковані в перевірених джерелах, speaking needs human review, аудіо поточних наборів синтетичне. Повний план і критерії — [docs/14-digital-yki-fidelity-spec.md](../docs/14-digital-yki-fidelity-spec.md); кожна деталь підтвердження — [33 evidence claims](../research/yki/yki-digital-fidelity-evidence-2026-10.json).

Тести включені в `node --test app/tests/*.test.mjs`.

## Evidence-based visual feedback cue

**Source-reviewed proposal:** [research/design/16-color-attention-memory-research-2026-10.md](../research/design/16-color-attention-memory-research-2026-10.md).

Implemented: **one non-animated `learning-cue`** with high contrast and underline around the *correct answer* in the `feedback` phase of the current grammar mission, **after** independent answer. Initial `answer` and `repair` do not contain solution cue; `transfer` removes it. The separate `exam.html` mock is unaffected. This does not create verified automatic Finnish morphological highlighting, VTT karaoke or a demonstrated long-term memory effect.

## Meaning-first color-cue pilot (21.10.2026)

Complementary [17 L2/color/attention study](../research/design/17-color-attention-l2-deep-dive.md) and [machine policy](../research/design/color-attention-design-policy-v2.json). The existing 28-item cloze bank now carries **three** `meaning_uk` + `semantic_relation_uk` **editorial drafts pending S2 review** for common local cases (illatiivi, elatiivi, inessiivi). Only **after** the first response, the feedback displays neutral **meaning first**, then the single color+underline form cue. Initial, repair, transfer and exam views **do not** display those correct-answer signals. Other tasks fall back to original feedback without inventing translations.

No claims are made about improved memory percentages, complete teacher-reviewed Finnish, or official YKI certification.

## Working now

1. **Місія:** load `learning/exercises/b1/grammar/contextual-cloze.json` → first attempt (answer hidden) → guided repair (if wrong) → reveal answer/explanation → own unseen transfer sentence → save. SRS records **first independent** recall, not success after a hint.
2. **4 навички:** one short baseline probe per skill. Reading uses genuine test text and objective choices; listening uses an **existing real OGG file** of synthetic speech, not the script-only diagnostic; writing and speaking save ungraded work. This is a smoke-test of assessment UX, **not an adequate CEFR diagnostic**.
3. **Аудіо:** six existing long synthetic lessons in the repository; MVP demonstrates one long original story, comprehension, and transcript reveal after the response. Extra real human voice is a historical LibriVox story, not the planned modern two-speaker dataset.
4. **Digitesti:** four-step, feedback-delayed digital rehearsal based on existing independent training content. **No claims** about the exact OPH digital test screens, number/timing of tasks, permitted audio replay or official scoring.
5. **Прогрес:** dated review cards, repeated errors, first-attempt results, four-skill counts; local JSON export and irreversible local clear. No learner login, server sync or collection.

## Privacy and accurate feedback

- Responses stay in **localStorage on the current browser profile** and are capped in the model; localStorage is neither encrypted nor shared across devices.
- Microphone requires browser permission; audio is held in a temporary Blob URL **in memory only**, not persisted or uploaded. Text fallback works if mic denied. A secure context (HTTPS/localhost) is typically necessary.
- Speech pronunciation, writing quality and overall B1/YKI outcome are **not auto-scored**. Speaking/writing appear as `ungraded`, even when the user recorded a voice note.
- Automatic cloze checking is deterministic; only source-declared alternatives are accepted, so genuine alternative answers require teacher review. The corpus is `teacher_review=pending` or an equivalent draft status.
- Existing audio TTS labels remain accurate. New natural multi-speaker recordings **have not been produced** by this MVP.

## Structure

```
app/
  index.html        # static semantic UI
  styles.css        # brand-aligned responsive styles
  app.mjs           # browser routing, rendering, media and persistence
  core.mjs          # pure model: checking, SRS, bounded progress and 4 skills
  tests/core.test.mjs
```

Specs: [product requirements](../docs/11-mvp-product-requirements.md) · [architecture](../docs/12-mvp-architecture.md).

## Known limitations and next milestones

- Current SRS is an interval **heuristic**, not learner-calibrated FSRS; independent 7/14-day unseen checks and cross-task adaptation are upcoming.
- The baseline diagnostic uses too few independently calibrated items; add sufficient item pools, human anchors and difficulty controls before claiming a level.
- Record and license modern contemporary **two+ voice** Finnish conversations with exact transcripts and manually checked WebVTT; involve an S2 editor.
- Improve browser E2E tests (keyboard/mobile/permissions), autosave of in-progress stages, offline caches, accessibility audit, and real GDPR/legal review before production.
- Verify exact digital-YKI user experience from OPH before shipping exam-like timers and instruction claims.

**Official 2027 dates source:** https://www.oph.fi/fi/koulutus-ja-tutkinnot/sopivan-yki-testin-valinta-ja-testipaivat — 10.04.2027 intermediate full Finnish digital test; registration 08–25.03.2027, subject to changes.

## ✅ Transactional browser exam checkpoint (22.10.2026, implemented slice)

`exam.html` now uses **IndexedDB**, not `localStorage`, for active exam answers/session snapshots. The *learning mission page* `index.html` **still uses `localStorage`** and is not yet migrated. The exam imports its previous `localStorage` session once after a successful IndexedDB commit.

- Every autosave appends a unique event and updates the current snapshot in **one IDB readwrite transaction**. Revision checks prevent stale-tab overwrites; exact event-ID retry is idempotent and divergent reuse is rejected.
- Short input bursts are coalesced. Navigation and report reveal **wait for a durable write**; after a save failure, the user stays on the question and can use **JSON export + Retry saving**.
- A completed commit with a lost acknowledgment is reconciled against the saved snapshot, not a guess.
- `app/tests/atomic-idb-browser.html` + `scripts/run-chromium-idb.mjs` provide the real Chromium IndexedDB integration check.
- `app/attempt-storage.d.ts` and `app/media-platform.d.ts` define platform protocols. `native/android/prototype` contains Kotlin/Room and Media3 sources **not yet compiled**. No Android release or 2–3GB media packs exist yet.

**Privacy:** text and metadata remain local to the browser profile; IndexedDB is not encrypted by this application and can be evicted. Voice recordings stay ephemeral and are not claimed to survive reload. Export important writing before relying on browser storage alone.

[Implementation record](../docs/26-atomic-exam-and-media-implementation-2026-10.md).

## Architecture integration plan (22.10.2026)

The current browser MVP remains the compatibility baseline. [ADR-027](../docs/27-stack-architecture-compatibility-and-implementation-gates.md) records the design-fit audit, unification requirements for exam checkpoints vs immutable first attempts, Android Room/PAD integration, and test cases C-01…C-10. [G0–G6 roadmap](../docs/25-implementation-vertical-slice-roadmap.md) distinguishes implemented behavior from target releases. The app is **not** a React/Phaser/Capacitor build; the learning page still uses `localStorage`, and an Android AAB has not been built.

## Нові A1.3–A2.2 аудіо+фото (чернетка)

[Реальні інтерактивні ситуації](real-life.html) використовують 4 існуючі живі аудіозаписи, 5 атрибутованих фото й 1 оригінальну SVG-підказку, яку показано лише після першої відповіді. На новій сторінці три етапи відповіді, без оцінювання/мікрофона/постійного збереження та без автоматичного SRS; [джерела й перевірки](../learning/exercises/a1/audio-visual/README.md).

## 🇫🇮 Живі розмовні джерела A2–B2.1 (23.10.2026)

**[Відкрити нову Web-сторінку `authentic-listening.html`](authentic-listening.html)** через `http://localhost:8080/app/authentic-listening.html`. Це функціональний **LEARN-перехід до семи незалежних зовнішніх ресурсів**, не «пакет 27 локальних записів»: джерела відкриваються в окремій вкладці на Kielibuusti, а після самостійного слухання/читання можна написати відповідь → самоперевірити → виконати перенесення у нову ситуацію. Текст зберігається **лише в пам'яті вкладки**; не збирається сервером і не проходить автоматичної оцінки. Застосунок не перепубліковує чужі відео, аудіо чи тексти.

Відповідні [7 верифікованих сторінок першоджерел](../sources/audio/authentic-dialogues-2026-10.json) описують **6 зовнішніх транспортних MP3 + 4 діалоги стоматолога + 8 відео з рецепції + 9 епізодів подкасту = 27 згаданих видавцями медіаодиниць**; також 8 текстових діалогів із догляду (не аудіо), сценарії про емоції (не аудіо), курс про puhekieli (неповний поштучний облік відео). Два ресурси мають CC BY-ND, де редагування/похідні медіа заборонені; окремі права на файли, декомпозицію й офлайн-Android усе ще потрібно перевіряти. **0 нових локальних файлів; 85 уже наявних аудіофайлів не змінюються**.

Перевірки: `python3 scripts/validate_authentic_dialogue_sources.py`, `python3 -m unittest discover -s scripts/tests -p 'test_validate_authentic_dialogue_sources.py' -v`, `node --test app/tests/authentic-listening-core.test.mjs` — автоматично в [GitHub Actions](../.github/workflows/validate-authentic-dialogues.yml). Це unit/content QA, не незалежний live-browser E2E-тест.

## 🗣️ Додаткові практичні джерела A1.3–B2.1 (24.10.2026)

На [сторінці «Живі діалоги»](authentic-listening.html) тепер **15 доступних зовнішніх LEARN-місій**: 7 попередніх і 8 нових. Нові завдання спираються на **4 додаткові сторінки видавців**: Eiran aikuislukio (PDF listening worksheets, 2 місії), A Taste of Finnish (курс із 10 розділів і 30 уроків із записаними діалогами, 2 місії), Kielibuusti Tutustuminen työpaikalla (4 текстові сценки, 2 місії) та Kielibuusti Kielitehtäviä työharjoitteluun (мовний щоденник, 2 місії). Усі мають незалежну відповідь → усвідомлену перевірку → нову ситуацію. Для PDF робиться читання й говоріння, **НЕ фальшиве аудіопрослуховування**. Усі нові завдання без оцінювання.

**Ніяких нових завантажень:** PDF, аудіо й відео відкриваються лише на сторінках видавців; CC BY-NC-ND матеріали не змінюються, на A Taste of Finnish права републікації не підтверджені. Попередні 85 локальних аудіофайлів і 3 WebM не змінюються. Перевірка прав, дублювання та педагогічної структури — [новий CI-gate](../.github/workflows/validate-practical-s2-materials.yml) і [валідація](../scripts/validate_practical_s2_sources.py). Реальні браузерні та викладацькі тестування нових місій ще потрібні.

## 🗣️ Opetushallitus — 12 нових source-only вправ (24.10.2026)

В [інтерактивному розділі «Діалоги + практика»](authentic-listening.html) уже **27 зовнішніх навчальних місій**: 7 Kielibuusti + 8 Eira/Taste/Kielibuusti + 12 OPH. Остання партія спирається на 6 розділів двох фінських серій для дорослих: *Päivää!* — **Elämää Suomessa, Mennään bussilla**; *Palataan!* — **Uusi naapuri, Erilaisia viestejä, Tehdään kaupat, Hyvinvointi ja terveys**. *Palataan!* застосовується приблизно від A2.2. Автор підручників Minna Intke Hernández, видавець Opetushallitus.

**Суттєва дидактична безпека:** у OPH на сторінках викладачів є готові відповіді. До першої незалежної письмової відповіді UI показує **лише офіційний плейлист** із варіантами мовлення; після першої спроби відкривається сторінка розділу для самоперевірки, потім нова ситуація для transfer. Вибір точного запису з плейлиста залишається дією користувача; **перевірених прямих media URL/хешів/тривалостей поки немає**. Не стверджувати, що для кожної з 12 місій є окремий офлайн-файл. Власні питання не є копією завдань/ключів/субтитрів OPH та не є офіційними YKI. Якість кожного уроку потребує S2-рецензування.

Джерела й обмеження права: [каталог OPH](../sources/audio/oph-adult-spoken-finnish-2026-10.json). **0 нових скачаних аудіо/відео**; ліцензія повторного поширення відсутня. Видавець відкриває записи для прослуховування онлайн, але це не право офлайн-пакування Android. Тести [Python](../scripts/validate_oph_spoken_finnish_sources.py) + [Node](tests/authentic-listening-core.test.mjs) і [окремий CI](../.github/workflows/validate-oph-spoken-finnish.yml).

## 📘 Чотири нові джерела — 8 авторських завдань (24.10.2026, наступна хвиля)

[Практика з реальними першоджерелами](authentic-listening.html) тепер показує **35 доступних LEARN-місій**: 27 попередніх + 8 нових. Нові джерела: *Helppoa suomea* (OPH, аудіоплейлист для бази до A2.1), **VIERKO 2 S2 4 osp, 2026** (новий курс A2.2: vuorovaikutus, tekstit, kirjoittaminen), **Kielibuusti Verbejä hoitotyöhön** (граматика B1/B2, три презентації й текстові вправи, **не аудіо**) та **VIERKO 2 Yhteiskunnassa ja kansalaisena toimiminen** (selkokieli й мова суспільних/побутових послуг).

Власні міні-місії мають незалежну відповідь, самоперевірку, іншу ситуацію та рекомендацію відкладеного повторення. Вони не є офіційними зразками YKI й потребують перевірки фінської S2-викладачем; збереження в цьому розділі — тільки під час поточної вкладки. **Ні один новий медіафайл або PDF фізично не імпортовано.** У [каталозі з правами](../sources/learning/a2-b1-verified-source-missions-2026-10.json) окремо зафіксовано конфлікт ліцензій VIERKO 2 2026 (старе CC BY-NC-SA vs нове CC BY-SA за метаданими Finna); у VIERKO2 civic файлова ліцензія не підтверджена. Не копіювати медіа/похідні до завершення правового аудиту. Структурні тести — [окремий CI](../.github/workflows/validate-a2-b1-open-sources.yml).

## Independent delayed Finnish transfer (Web pilot, 24.10.2026)

**PARTIAL / IMPLEMENTED IN WEB SOURCE, NOT LEARNING-VALIDATED.** The LEARN-only `7/14/30 днів` tab uses [original Finnish writing prompts](../learning/exercises/b1/grammar/delayed-transfer-v1.json) and [pure scheduling model](retention-core.mjs) to offer a **new contextual prompt** on day 7, 14 and 30 measured from the earliest eligible grammatical mission. There are presently four pilot task families (illative, elative, inessive, allative/rektio). A missed checkpoint is not backdated as successful; only the latest elapsed checkpoint may be answered. The user writes before seeing any model answer. Writing responses remain `ungraded`; no CEFR/YKI score, teacher assessment, or statistically demonstrated learning benefit is implied. No audio is generated or recorded.

**Storage:** old LEARN localStorage V1 profiles are accepted unchanged; `retention[]` is a backwards-compatible optional field with 120-entry cap, available in the existing export and erase controls. localStorage quota/private-mode errors explicitly state that the answer is in-memory only. EXAM and IndexedDB checkpoints are unchanged. Changing browsers or clearing local storage loses this work unless the learner exports it.

**Quality blockers:** native Android/Room implementation, human S2 editorial review of 12 Finnish prompts, verified browser UX/a11y checks and a preregistered matched-control independent scoring study at 7/14/30 days. The written response is only a self-produced *observation*, not verified correctness. Tests: `node --test app/tests/retention-core.test.mjs` and full `node --test app/tests/*.test.mjs`.
