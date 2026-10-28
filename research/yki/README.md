# YKI — офіційні відомості, джерела й дослідження формату

Ця папка містить **доказові дослідження YKI**, а не несанкціоновану копію офіційного іспиту.

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
