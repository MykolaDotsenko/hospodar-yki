# Execution plan: G2 — React/TypeScript Web app beside the legacy MVP

- **Date / owner:** 2026-11-03, coding agent (Claude Code) with repository owner review
- **Status:** IN_PROGRESS
- **Baseline main SHA / PR:** `76d21d6` (after #90)
- **Requirement / gates:** ADR-022 §8 phases 1–2, ADR-025 G2, ADR-027 C-05, ARCH-01/04/13/14, WEB-01/07, UX-01…08, UIO-01/03, COLOR-02/03/11, DESIGN-01a/08/14
- **Scope:** pnpm workspace; `packages/domain` (pure TS); `apps/web` (React 19 + Vite 8 + Dexie). Legacy `app/` stays the running reference until parity + migration. Exclusions this plan: Android, Phaser, cloud, PWA offline packs.

## Problem and acceptance

The accepted stack exists only on paper. Acceptance per slice: domain behaviour is byte-identical to `app/core.mjs` (parity tests); the new UI keeps first-attempt integrity (no key before repair), saves only after an IndexedDB transaction, never shows a fake "saved", meets WCAG 2.2 AA checks (axe, keyboard, 320 px/200 %), and runs on Chromium, Firefox and WebKit in CI.

## Implementation sequence

| Milestone | Change | Verification | Status |
| --- | --- | --- | --- |
| G2-a | Workspace, `@hospodar/domain` port + mission phase machine, `apps/web` home gateway + cloze mission, Dexie repository (CAS), tokens from `app/tokens.css`, CI `validate-web-app.yml` | `pnpm --filter @hospodar/domain test` (parity, TZ Helsinki), `pnpm -r typecheck`, `pnpm --filter @hospodar/web test`, `playwright test` (axe, keyboard, 320 px, two-tab conflict) | DONE_TESTED (Chromium local; FF/WebKit in CI) |
| G2-b | Explicit, consented import of legacy V1 progress (file or same-origin localStorage, read-only) via a TS port of R11 preflight + learn-backup checks; exact-original download + confirmation; one Dexie transaction with receipt (SHA-256, counts); readback; refuses a non-empty destination; V1 never modified | domain parity on 20 fixtures; 4 Dexie tests; 3 Playwright E2E (device, blocked files, file import) | DONE_TESTED (Chromium local; FF/WebKit CI) |
| G2-c (part 1) | R06 transparent selection (reasons + manual choice, no same-day re-serve) and R03/R08 meaning→form mission (S2 reviewer preview; learner use only after `published`) | domain parity vs `adaptation-core.mjs`/`r08-grammar-core.mjs` (7 tests); Playwright 4 new E2E incl. axe | DONE_TESTED (Chromium local; FF/WebKit CI) |
| G2-c (part 2) | Port diagnostics, audio, 7/14/30 retention and progress screens; then EXAM engine (XState) | Parity with legacy tests and EXV cases | PLANNED |
| G2-d | PWA shell + explicit offline packs; SW never activates during an exam | Playwright offline + update tests | PLANNED |
| G2-e | Route cut-over: legacy `app/` behind `legacy` link only after parity + migration | Full legacy suite green on new app | PLANNED |

## Observations and decisions

- 2026-11-03 — TypeScript pinned to 5.9.3 (not 7.x native compiler) for tooling maturity; all versions ≥2 weeks old and exact-pinned; `@playwright/test` 1.63.0 matches the environment's installed Chromium.
- 2026-11-03 — Tailwind deferred: tokens are consumed as CSS custom properties from the single generated `app/tokens.css`; `validate_design_tokens.py` now also scans `apps/web/src/styles.css`.
- 2026-11-03 — axe found a real contrast defect (step index at opacity .8 → 4.47:1) and 320 px/200 % overflow of route labels; both fixed before merge.
- New Web DB `hospodar-yki:web:v1` is separate from legacy storage; no learner data is moved in G2-a.
- 2026-11-03 — R06 extension `allowLabelledDrafts` (default off) is used only for legacy cloze items that the live MVP already shows labelled as unreviewed; R08 drafts stay reviewer-only because AGENTS forbids shipping them before S2 approval.
- 2026-11-03 — Items practised today are excluded from immediate re-recommendation (spacing instead of massed repetition); R06 weights unchanged.
- OPEN — R08 reference shows the key before its optional repair, while docs/11 MVP-04 / COLOR-02 put repair before the key; kept as in the reference module (parity) pending a pedagogy decision.

## Verification log

| Command or real-device scenario | Result | Evidence |
| --- | --- | --- |
| `pnpm --filter @hospodar/domain test` | PASS | 12 tests (9 parity incl. all 28 cloze items, DST/year boundaries; 3 mission) |
| `pnpm -r typecheck` | PASS | strict, `noUncheckedIndexedAccess` |
| `pnpm --filter @hospodar/web test` | PASS | 3 Dexie tests (fake-indexeddb) |
| `E2E_BROWSERS=chromium pnpm exec playwright test` | PASS | 5/5 |
| Firefox / WebKit E2E | NOT RUN locally | runs in CI workflow |
| Real phones, screen readers | NOT RUN | |

## Risks and rollback

- Two Web apps coexist; learners could create progress in both. Mitigation: new app says progress is separate until G2-b; no deletion of legacy data.
- Rollback: revert the PR; `app/` untouched; the new DB can be cleared by the browser without affecting legacy data.

## Completion / follow-up

- **Result:** G2-a only.
- **Still missing:** G2-b…e above; EXAM, audio, diagnostics, retention in the new app; PWA; real-device a11y.
