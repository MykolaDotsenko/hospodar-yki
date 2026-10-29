# YKI — офіційні відомості, джерела й дослідження формату

Ця папка містить **доказові дослідження YKI**, а не несанкціоновану копію офіційного іспиту.

**E06 speaking fidelity research (29.10.2026):** [historical SOLKI speaking families, official OPH/JYU level 3/4, real Web EXAM microphone/durability code risks, human-calibrated feedback and privacy gates](24-e06-speaking-recording-assessment-2026-10.md), [E06 dated evidence with 12 risks / 9 release gates](e06-speaking-evidence-audit-2026-10.json), [reference-only receipt gate](../../app/e06-speaking-evidence-policy.mjs), [12 Node unit cases](../../app/tests/e06-speaking-evidence-policy.test.mjs). **Not wired into live EXAM**: no durable audio file, Inspera UI inspection, original partner voice or human-rated YKI scores. E05 audio PR remains independent.

**E04 timing/source audit (29.10.2026):** [research on historic SOLKI timings vs unknown digital 2027 rules, code risk analysis and required timing state machine](22-e04-digital-timing-session-policy-2026-10.md), [evidence/risk ledger (10 gaps; 15 canonical unknowns)](e04-timing-evidence-2026-10.json), [reference-only pure timing policy](../../app/e04-timing-policy.mjs) and [12 unit tests](../../app/tests/e04-timing-policy.test.mjs). **No active EXAM runtime integration, browser E2E, official 2027 seconds or Inspera observation.** Exact mode remains blocked.

**E03 source-backed construct audit (29.10.2026):** [Research report on YKI item families and communicative validity](21-e03-construct-task-blueprint-2026-10.md) + [13-family derived content gap matrix](e03-construct-task-coverage-audit-2026-10.json). Measured **catalog structure only**: 6 present, 2 partial, 5 absent from current 2×9 minis; NO independent S2 approvals, full 2027 digital item count, human study or official grade. Reuses canonical [13 patterns](yki-official-patterns-v2.json), 9 themes and 6 functions; [Node audit regression](../../app/tests/e03-construct-task-coverage.test.mjs).

**Новий план реалізації EXAM (29.10.2026):** [E01–E16 — дослідження цифрової достовірності, оцінювання та навчального ефекту](exam-e01-e16-research-validation-plan-2026-10.md). Це 16 запланованих work packages із власниками, deliverables та release gates; **не 16 виконаних досліджень, не ручний Inspera-аудит і не готовий full YKI**. Використовує існуючі R01–R12 та F1–F6, не створює паралельного реєстру.

- [01-official-yki-2027.md](01-official-yki-2027.md) — перевірені офіційні анонси й невизначеність формату;
- [13-yki-exam-format-and-real-examples-2027.md](13-yki-exam-format-and-real-examples-2027.md) — типи завдань і джерела прикладів;
- [20-yki-official-complete-audit-2026-10.md](20-yki-official-complete-audit-2026-10.md) — аудит офіційних матеріалів;
- [yki-digital-fidelity-evidence-2026-10.json](yki-digital-fidelity-evidence-2026-10.json) — джерела для claims про цифровий іспит;
- [yki-exam-examples-2026-10.json](yki-exam-examples-2026-10.json), [yki-official-patterns-v2.json](yki-official-patterns-v2.json) — приклади та класифікація;
- [official-yki-deep-audit-v2.json](official-yki-deep-audit-v2.json), [yki-content-sources-2026-10.json](yki-content-sources-2026-10.json) — аудити та метадані.

**R02 official digital 2027 investigation, 28.10.2026:** [розділ R02](20-yki-official-complete-audit-2026-10.md#r02-deep-follow-up--28102026-oph-digital-yki-2027-eight-dates-demos-and-fail-closed-quality-gate) перевіряє 4 прямі Inspera demo URL з OPH, доступність з автоматизованого клієнта (403; **не** доказ реальної недоступності), змішані paper/digital інструкції й повний **8-денний** весняний календар 2027. Реальні поведінка демо/точні digital UI, replay, timer — **не спостережені/не підтверджені**. Датований audit та 15 `unknown` у [канонічному ledger](yki-digital-fidelity-evidence-2026-10.json), перехресні regression checks у [validator](../../scripts/validate_yki_deep_fidelity.py). Жоден JSON-ключ не є доказом відвідування демо; strict 2027 mode лишається blocked.

Реальні зовнішні сторінки/відео YKI/SOLKI знаходяться як **посилання**, не завантажені ролики, у [sources/official/](../../sources/official/README.md). Тренувальні вправи — у [learning/exercises/](../../learning/exercises/README.md).

**Правило:** без офіційного підтвердження не видавати тренувальний симулятор за точну цифрову версію YKI 2027; не оголошувати оцінку B1 офіційною без каліброваного оцінювання.
