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
| G2-c (design) | Calm mode (DESIGN-16, COLOR-07/18), focus-budget E2E on every mission step, design traceability matrix + CI gate | `validate_design_traceability.py` (8 tests), Playwright `calm.spec.ts`, `focus.spec.ts` | DONE_TESTED |
| G2-c (part 2a) | 7/14/30 delayed transfer (TS port of retention-core, parity) + «Мій прогрес» (Learn/Exam tabs, 4 skills separately, ≤2 actionable steps, no %/level) | domain parity (3 tests, days 0…40 incl. DST); Playwright `retention-progress.spec.ts` (clock-controlled) | DONE_TESTED (Chromium local) |
| G2-c (part 2b) | Listening mission: prediction → learner-started audio → gist → details → keys → transcript/subtitles only after answering; slow speed / transcript as accessibility support → saved ungraded; synthetic voice labelled | domain 5 tests; Playwright `listening.spec.ts` 3 E2E incl. axe | DONE_TESTED (Chromium local) |
| G2-c (part 3a) | Starting diagnostic from `diagnostics/baseline-v1.json`: reading (frozen first answers, keys after all) → writing (own text → self-check, ungraded) → speaking (consented in-tab voice or text plan, ungraded; audio never stored) → summary (counts + next steps, no % / level); each step committed before moving on; listening not probed (script-only item) | domain 6 tests; Playwright `diagnostic.spec.ts` 2 E2E incl. axe; UX-06 → PARTIAL | DONE_TESTED (Chromium local) |
| G2-c (part 3b) | Writing clinic (IV-REQ-07): own draft → self-check → spot issues in a weak draft → model after attempt → rewrite own text (word diff) → new task without model; all ungraded, labelled independent/guided; draft persisted before moving on, final save advances only after commit | domain 5 tests; Playwright `writing-clinic.spec.ts` 2 E2E incl. axe + save conflict; IV-REQ-07 → PARTIAL | DONE_TESTED (Chromium local) |
| G2-c (part 3c) | Dialogues (9 scripts): learner as speaker A, reply first → script line as one variant; open answer → model + evidence cue (COLOR-14) → self-judgement; role-play plan; all ungraded, saved only after commit | domain 4 tests; Playwright `dialogue.spec.ts` 1 E2E incl. axe; COLOR-14 → PARTIAL | DONE_TESTED (Chromium local) |
| G2-c (part 3d) | Licensed repo media in apps/web: domain rights gate (`media.ts`), Медіатека (LibriVox two-voice text, Commons recordings + time-cut parts, SKN dialects, 3 open videos, 8 CC photos with situation prompt, 6 SVGs, 64 YouTube link-only cards), human-read story as a listening mission with option shuffle (source had every key first) | domain 4 tests; Playwright `media.spec.ts` 5 E2E incl. axe + 320 px; SENS-02 → PARTIAL | DONE_TESTED (Chromium local) |
| G2-c (part 3e) | Picture missions (IV-REQ-06): 8 image-led lessons on admitted photos — unassisted first → models + Ukrainian scene gloss → new situation without photo/translation; ungraded | domain 3 tests; Playwright `picture-mission.spec.ts` 1 E2E incl. axe; IV-REQ-06 → PARTIAL | DONE_TESTED (Chromium local) |
| G2-c (part 3f) | Semantic-boundary pauses (needs verified segment boundaries + per-segment questions), branching dialogues, then EXAM engine (XState) | Parity with legacy tests and EXV cases | PLANNED |
| G2-d | PWA shell + explicit offline packs; SW never activates during an exam | Playwright offline + update tests | PLANNED |
| G2-e | Route cut-over: legacy `app/` behind `legacy` link only after parity + migration | Full legacy suite green on new app | PLANNED |

## Observations and decisions

- 2026-11-03 — TypeScript pinned to 5.9.3 (not 7.x native compiler) for tooling maturity; all versions ≥2 weeks old and exact-pinned; `@playwright/test` 1.63.0 matches the environment's installed Chromium.
- 2026-11-03 — Tailwind deferred: tokens are consumed as CSS custom properties from the single generated `app/tokens.css`; `validate_design_tokens.py` now also scans `apps/web/src/styles.css`.
- 2026-11-03 — axe found a real contrast defect (step index at opacity .8 → 4.47:1) and 320 px/200 % overflow of route labels; both fixed before merge.
- New Web DB `hospodar-yki:web:v1` is separate from legacy storage; no learner data is moved in G2-a.
- 2026-11-03 — R06 extension `allowLabelledDrafts` (default off) is used only for legacy cloze items that the live MVP already shows labelled as unreviewed; R08 drafts stay reviewer-only because AGENTS forbids shipping them before S2 approval.
- 2026-11-03 — Items practised today are excluded from immediate re-recommendation (spacing instead of massed repetition); R06 weights unchanged.
- 2026-11-03 — DEC-02 DECIDED: R08 now follows MVP-04/COLOR-02 (repair without key, then key); reference module keeps first-attempt evidence parity only.

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
