# ADR-027 — Hospodar YKI: стек × архітектура, єдині контракти та перевірювана реалізація

**Дата:** 22.10.2026 · **Статус:** ACCEPTED INTEGRATION PLAN / DOCUMENTATION ONLY.  
**База аудиту:** `main` @ `b276e7f94fc830db0b835eef99079c4dbfa8622f` (PR #27 merged).  
**Предмет:** повноцінний Web/PWA та Android 2D game, чотири навички фінської, LEARN / EXAM, навчальний прогрес, 2–3 GB *правомірно поширюваних* offline media у Play install-time packs. Цей документ **не реалізує** міграцію, нативний застосунок, AAB, офіційний цифровий YKI чи production SLO.

## 0. Пріоритет рішень і що цей ADR змінює

- [ADR-022](22-optimal-stack-and-architecture-adr-2026-10.md) — обґрунтування стеку та модульного моноліту.
- [ADR-023](23-android-offline-game-and-3gb-media-architecture.md) — 2D гра, рівноправний Web і Android, Play Asset Delivery та обмеження доставки.
- [ADR-024](24-reliability-hardened-architecture-web-android.md) — **чинне рішення щодо даних:** Web IndexedDB/Dexie, Android **Kotlin Room/SQLite** для важливого learner/exam стану. Рядок ADR-023 про Android IndexedDB/Dexie — історичний і **не є чинним рішенням**.
- [ADR-025](25-implementation-vertical-slice-roadmap.md) — контракти та послідовність впровадження; статус імплементації оновлюється цим ADR і roadmap.
- [Звіт реалізації](26-atomic-exam-and-media-implementation-2026-10.md) — що справді є в `app/` і `native/android/prototype/`.

**Нормативне уточнення ADR-027:** типізований домен та події повинні мати одне джерело істини; `ExamCheckpoint` (чернетка) і `FirstAttemptEvent` (навчальний факт) — **дві різні сутності**, не два альтернативні трактування одного запису. Платформні драйвери реалізують однакові команди, проте не поділяють один фізичний рушій БД. Це уточнення архітектурного контракту, **не твердження, що контракти вже уніфіковано в коді**.

## 1. Підтверджений baseline станом на вказаний commit

| Область | Реально є у `main` | Ще не реалізовано / не доведено |
| --- | --- | --- |
| Web | Запуск з `app/index.html`, `app/exam.html`; HTML/CSS + native ES Modules | React 19 / strict TS / Vite 8 shell, PWA service worker і Phaser-сцени |
| LEARN | `app/core.mjs`, місії, базовий SRS і `localStorage` | Транзакційне навчальне сховище, адаптивний 4-skill planner і review evidence |
| EXAM | Дев'ять завдань у чотирьох навичках; `app/attempt-storage.mjs` із IndexedDB atomic event + snapshot; recovery path | Повний digital-YKI profile, human-calibrated grading, recording durability |
| Contracts | `packages/contracts/src/index.mjs` first-answer events; `app/attempt-storage.d.ts` checkpoint protocol | Єдина TS schema + сумісна serialization semantics на Web/Android |
| Browser QA | Node unit tests; реальний Chromium IndexedDB concurrency/recovery smoke у CI | Повний Playwright/WebKit/mobile/permissions/quota/process-kill E2E набір |
| Android | Kotlin Room DAO + Capacitor persistence/media plugin **source prototypes** | Gradle/Capacitor app, компіляція, Android instrumentation, signed AAB/Play install |
| Media | JS rights/path/hash manifest contract; Android AssetManager/Media3 прототип | Перевірена маршрутизація до конкретного PAD pack, native video surface, packaged 2–3 GB |
| Backend | Не потрібен для локального core | Optional consent-based sync, secured AI feedback, cloud governance |

Не переносити статус `success` статичних ADR-перевірок на runtime. Chromium тест **доводить лише протестовані сценарії IndexedDB**. Android Kotlin-файли ще не скомпільовані. Автооціночні бали архітектури не є вимірюванням надійності.

## 2. Технологічне рішення та межі відповідальності

| Boundary | Цільовий вибір | Правило |
| --- | --- | --- |
| App shell | React 19 + strict TypeScript + Vite (підтверджена сумісна версія у lockfile) | Доступні DOM-форми/читання/письмо; без SSR requirement |
| Game scenes | Phaser 2D, ліниве завантаження | Canvas лише для світу, NPC, анімацій і мініігор; не для довгого YKI тексту |
| Domain | Pure TypeScript in `packages/domain` та залежні focused modules | Нуль імпортів React/Phaser/Capacitor/Room/Supabase у предметному домені |
| Exam | XState для складних переходів + окремі pure policies | Жодних навчальних підказок/ключів до submit; заморожений content snapshot |
| Web persistence | Dexie/IndexedDB + export + optional sync | Транзакції, обробка quota/eviction; Web не обіцяє абсолютної незнищуваності |
| Android persistence | Capacitor thin plugin → Kotlin Room/SQLite | Всі критичні записи в одній нативній транзакції; WebView IndexedDB не є source of truth |
| Web media | Streaming HTTPS + opt-in selected offline packs | Немає примусового 3GB download on first load; rights and checksum policy |
| Android media | Google Play AAB + install-time PAD + native Media3 | Встановлення перед першим запуском; не копіювати packs до SQLite, JS heap або WebView cache |
| Cloud later | Optional Supabase EU + thin TS gateway + durable worker | Офлайн LEARN/EXAM працює без акаунта; consent/RLS/secrets/server rate-limits перед увімкненням |
| QA/release | pnpm workspace, Vitest, Playwright, Android instrumentation + physical devices | Тільки після scaffold; нинішні Node/Python gates залишаються активними |

**Критерій сумісності:** один контентний ID, версія, hash і правила перевірки дають *той самий результат* на Android і Web; розходитися можуть лише presentation, I/O, codecs та platform lifecycle. Не вводити cloud-first або два незалежні ігрові/навчальні рушії.

## 3. Один registry подій; чітке розмежування чернетки й доказу

Поточні `app/attempt-storage.mjs` і `packages/contracts/src/index.mjs` мають різні схеми. Їх **не можна механічно ототожнювати**:

1. **`ExamCheckpoint`** — часті revisioned autosave команди: позиція, введений текст, стан таймера, UI-чернетка, без оцінки. Повторне редагування дозволене. `snapshot` підтримує відновлення.
2. **`FirstAttemptEvent`** — immutable факт **першої незалежної відповіді** на конкретне `itemId + itemVersion + contentHash` з підказками/exposure як окремими атрибутами; потрібен для SRS, навчальних метрик, захисту від повторної оцінки guided repair.
3. **`RepairEvent` / `TransferEvent`** — наступні спроби, ніколи не переписують `FirstAttemptEvent`. Для open writing/speaking зберігають статус `ungraded` без вигаданого B1/YKI grade.
4. **`MediaAsset`** — окремий immutable published manifest з `mediaId + assetVersion + sha256 + packId + relativePath + rights + codec`. Це не learner event.

### Цільова команда (концептуальна схема, НЕ поточний API)

```ts
type CommitSessionV2 = {
  protocolVersion: 2;
  commandId: string;             // globally unique; never silently reused
  sessionId: string;             // not only a singleton "current"
  expectedRevision: number;      // compare-and-swap
  event: CheckpointEvent | FirstAttemptEvent | RepairEvent | TransferEvent;
  content: { itemId: string; itemVersion: number; sha256: string };
  nextSnapshot: SessionSnapshot; // frozen content/profile references
};
type CommitResult = {
  commandId: string;
  revision: number;
  applied: boolean;
  duplicate: boolean;
  snapshot: SessionSnapshot;
};
```

`CommitSessionV2` — проєкт **наступного** протоколу. Доки є `EXAM_COMMIT_PROTOCOL=1`, додавати versioned adapters/migration; заборонено видавати V2 за сумісний із V1 без explicit negotiation. Один primary schema package із runtime validation (Zod після TS migration) та згенерованими fixture/DTO типами для Kotlin. Не тримати незалежні «канонічні» типи у `app/*.d.ts` і `packages/contracts`.

### Атомарність, конфлікти та recovery — MUST

- Web: одна IndexedDB `readwrite` transaction для `event + snapshot + derived progress/outbox`. Android: **один** Kotlin Room `@Transaction`, а не JS callback через bridge. Серверний sync (якщо увімкнено) тільки *після* локального durable commit.
- При повторі **того самого** `commandId` з тим самим canonical payload повернути підтвердження **оригінального** результату; інший payload за тим самим ID → `IDEMPOTENCY_CONFLICT`. Паралельні `expectedRevision` зіткнення → `REVISION_CONFLICT`.
- Для lost acknowledgment читати **збережений event/commandId та fingerprint** разом із snapshot/revision. **Однаковий snapshot сам по собі недостатній доказ**, що саме наша команда була записана: інша вкладка могла зберегти такий самий стан.
- Стабільний canonical serialization/hash має бути визначений один раз (порядок JSON полів, нормалізація тексту, encoding, відсутні/null значення) і перевірений на однакових Kotlin/JS fixtures. При checksum conflict — fail closed, без auto-merge під час іспиту.
- Формалізувати portable error codes: `INVALID_COMMAND`, `PROTOCOL_MISMATCH`, `IDEMPOTENCY_CONFLICT`, `REVISION_CONFLICT`, `QUOTA_OR_DISK_FULL`, `READ_FAILED`, `SAVE_FAILED`, `ASSET_UNAVAILABLE`, `HASH_MISMATCH`. Не маскувати усі Kotlin помилки як `SAVE_FAILED`.
- Блокувати Next/Finish/розкриття ключів до підтвердженого durable commit. Незбережений мікрофонний blob ніколи не позначати «голос збережено» після restart. Експорт, видалення, downgrade/upgrade migrations і recovery перевіряються тестами; Android не обіцяє відновлення після видалення даних додатка.

## 4. Мультимедіа / PAD contract та права

- Google Play path: **Android App Bundle + кілька install-time PAD packs**, не один `.apk` 3 GB. Плановий бюджет ADR-023 ~2.6 GB, **не виміряний**. Перевірити чинні межі Play, compressed download size/per-device size і запас диска в Play Console/bundletool перед release.
- Manifest стверджує `rights.redistributionAllowed` лише за фактичними дозволами; external-link-only матеріали, YouTube та офіційні записи без ліцензії не входять у пакунок. Перевіряти версію, підпис/sha256 джерела та asset after install/update.
- `packId` **повинен реально впливати на native lookup**, не бути лише аргументом перевірки: звіряти `packId/assetVersion/path/sha256` з Android pack index; не довіряти JS-supplied absolute/percent-encoded/double-encoded paths. Паритет path validation у Web і Kotlin.
- Відокремити **verification from playback**: один раз перевіряти asset із cache результату, прив'язаним до package signature/version + content hash, із invalidation після update; не хешувати багато сотень MB перед **кожним** натисканням Play. Security/integrity policy визначити й протестувати перед оптимізацією.
- Android Media3: довести `AssetManager`/seekable descriptor для реального `install-time` пакета, codec/seek/pause/headphones/background/rotation та `PlayerView`/surface для **відео**. Зараз native prototype не містить повного video surface.
- Web: відображати статус доступності офлайн-пакетів, cache quota/eviction/error, selective download і subtitles. Не кешувати 2–3 GB автоматично. В обох клієнтах — lazy playback, cleanup textures/player, доступний текстовий fallback.

## 5. Сумісність стеку й архітектури: оцінка, не сертифікація

Експертні **design-fit estimates** на 22.10.2026 для описаної мети:

| Критерій | Цільове рішення / 100 | Чому не 100 |
| --- | ---: | --- |
| Стек | **95** | Два storage adapters, Kotlin/native bridge, мобільна графіка та важкі pack integrations |
| Архітектура | **94** | Подієві контракти ще не об'єднані; потребує hard failure/recovery semantics |
| Fit стеку до архітектури | **95** | Реальна Web/Android native parity, PAD seeking і performance ще не доведені |

Оцінка **поточного end-to-end product readiness не виводиться математично** з цих балів і не є готовністю до релізу. Відсотки 95/94/95 описують *вибір рішення*, а не якість тестованого Android binary. Після physical device benchmark, contract parity, Web E2E та media gate оцінити повторно за вимірюваними результатами.

## 6. Execution gates / definition of done

| Gate | Обов'язковий результат | Тести / доказ | Не зараховувати |
| --- | --- | --- | --- |
| **G0 Baseline** | Зафіксувати поточну поведінку, golden fixtures, broken case inventory | Node + Chromium IDB, source-linked content smoke, CI run links | ADR-only green як app build |
| **G1 Contract unification** | `packages/contracts` — один registry; Checkpoint ≠ FirstAttempt; V1→V2 migration | JS/Kotlin serialization golden fixtures, conflict/idempotency/lost-ack tests | Тільки `.d.ts` interfaces |
| **G2 Web migration** | `apps/web` React/Vite/strict TS; learn/exam parity; progress із localStorage мігрує в IndexedDB/Dexie | Playwright Chromium + Firefox + WebKit, reload, multi-tab, quota, accessibility | Blank scaffold без перенесених місій |
| **G3 Android vertical slice** | Gradle + Capacitor plugin compile, Room migrations, одна спільна місія і exam checkpoint | Emulator + physical-device kill/restart, conflict, mic denial, airplane mode | Kotlin файли без build |
| **G4 Media delivery** | >1 GB synthetic install-time pack PoC; verified native seek/audio/video surface; права/hashes | Signed AAB/bundletool, Play internal testing, physical storage/memory/thermal logs | JSON manifest без Play install |
| **G5 Game & full product** | Phaser місто/quest, adaptive LEARN і суворий 4-skill EXAM | Web+Android parity, a11y/reduced-motion, 30 FPS sustained mid-tier Android, data integrity | Лише красива карта без навчального transfer |
| **G6 Release readiness** | Ліцензовані якісні медіа, human S2 editorial review, rollback/update/export/restore, privacy | Full release matrix, real devices, measured sizes, explicit uncertain YKI profile | Самооцінка 98/100 без вимірів |

**CI triggers:** поточний `.github/workflows/validate-app-mvp.yml` фокусується на `app/**` і частині content; Kotlin/native зміни та майбутні `apps/android/**` повинні запускати окрему Android Gradle + instrumentation матрицю. `validate-shared-contracts.yml` перевіряє контрактний пакет, **не доводить** паритет Kotlin/native автоматично. У release gate потрібні branch protection та required checks після створення real workflows.

### Мінімальні acceptance cases для наступного PR

1. **C-01:** Same `commandId`, same event → one persisted event, original ack; divergent payload → typed conflict.
2. **C-02:** Two writers, same revision → exactly one durable winner; after reconnect немає fabricated success.
3. **C-03:** Lost ACK → event-ID-based read-back; same snapshot від іншого commandId **не** вважається успіхом.
4. **C-04:** Crash між транзакційними кроками → або event + snapshot, або жодного; persist-before-navigation.
5. **C-05:** Existing Learn `localStorage` → IDB migration з no-loss/export і тестом idempotent retry.
6. **C-06:** Web/Room golden fixtures однаково нормалізують hashes та відхиляють malformed/versioned commands.
7. **C-07:** PAD pack A vs pack B реально розрізняються за `packId`; reject encoded traversal/path mismatch.
8. **C-08:** 1+ GB install-time pack, airplane-mode seek, video surface, low-storage і update тест на пристрої.
9. **C-09:** Unknown OPH YKI specifics не видаються за official; EXAM ізолює ключі/підказки.
10. **C-10:** Усі чотири навички, original responses і source rights мають повторювані editorial/testable checks.

## 7. Non-goals і безпечний rollout

**Не робити зараз:** глобальні мікросервіси/Kubernetes, повну заміну React на Unity/Godot, власну систему автентифікації, примусовий cloud account, AI-автоматичний «офіційний бал YKI», 3GB Git binary dumps, single 3GB APK promise. Supabase включати лише після реальної потреби у sync/AI.

**Rollout без big bang:** зберігати `app/` як runnable reference; extract pure domain/contracts → real Web migration з parity → native Android vertical slice → синтетичний large-media PoC → ліцензовані media/гра → production checks. Документувати backward compatibility для старих exports, невідновлюваних transient recordings і content-version pinning. Кожен gate — окремий PR з executable evidence; ніяких заяв «Android готовий» до перевіреної збірки.

## 8. Посилання для перевірки

- [Поточна реалізація браузерних checkpoint](../app/attempt-storage.mjs), [FirstAttemptEvent contract](../packages/contracts/src/index.mjs), [медіаконтракт](../app/media-platform.mjs).
- [Kotlin DAO](../native/android/prototype/ExamDatabase.kt), [Capacitor exam bridge](../native/android/prototype/HospodarExamStorePlugin.kt), [Media3 prototype](../native/android/prototype/HospodarMediaPlugin.kt).
- [CI real Chromium](../.github/workflows/validate-app-mvp.yml), [browser runner](../scripts/run-chromium-idb.mjs).
- [Google Play Asset Delivery](https://developer.android.com/guide/playcore/asset-delivery), [Play app size limits](https://support.google.com/googleplay/android-developer/answer/9859372), [Android Room](https://developer.android.com/training/data-storage/room), [MDN Storage quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).

**Documentation acceptance:** усі попередні ADR лишаються доступними як історія рішень; ADR-027 і [актуальний roadmap](25-implementation-vertical-slice-roadmap.md) однозначно відрізняють реалізований код від майбутньої системи.
