# Execution plan: Hospodar YKI Web from tested build to production-ready release

- **Date / owner:** 2026-11-14, Claude Code (implementation) + repository owner (decisions, human gates)
- **Status:** IN_PROGRESS (PR 1)
- **Baseline main SHA / PR:** `06d51ee` (after #149)
- **Requirement / gates:** [RELEASE](../../RELEASE.md) go/no-go matrix, [SECURITY](../../SECURITY.md) release blockers, [roadmap G2/G6](../../25-implementation-vertical-slice-roadmap.md), `validate_design_traceability.py --human`
- **Scope:** `apps/web` only. Android (G3–G6) is a separate track; nothing here claims an Android build.

## Problem and acceptance

The Web app is tested in CI (domain, unit, Playwright on Chromium/Firefox/WebKit with axe) but there is no deployment, the legacy `app/` still coexists, the bundle is large, 0 of 452 learner items are S2-approved and the OPH 2027 demos have not been walked through by a person. Production-ready is two levels:

- **Public Web beta:** deployed build with a strict CSP, one product entry point, draft content honestly labelled, local error diagnostics, all CI green.
- **Release 1.0:** additionally S2-published content only, legal/privacy review, OPH demo walkthrough recorded, release gate passing.

## Implementation sequence

| PR | Change | Verification | Status |
| --- | --- | --- | --- |
| 1 | Opt-in GitHub Pages deploy workflow (pinned verified action SHAs, no source maps, publishing only with `DEPLOY_PAGES=true`); CSP + no-referrer `<meta>` in the built app; E2E for CSP presence and zero violations across screens; tests no longer inject `<style>` | `e2e/csp.spec.ts`, full Playwright run, `validate_doc_integrity.py` | IN_PROGRESS |
| 2 | One product: `apps/web` is the entry point; legacy `app/` only for progress import | E2E import + link check | PLANNED |
| 3 | Bundle budget: code-split screens, lazy media; size budget test in CI | build size check | PLANNED |
| 4 | Release mode for content: only S2-published items in a release build; beta build shows drafts with a label | test fails on an unpublished item in release build | PLANNED |
| 5 | Local error diagnostics the learner can copy (no telemetry) | E2E: failed write → message + copyable diagnostics | PLANNED |
| 6 | Keyword mnemonic on SRS cards (schema migration: card field, Dexie, export/restore) | migration + restore tests | PLANNED |
| 7 | Mediation after listening; graduated steps on dialogues/writing | E2E | PLANNED |
| 8 | First run: goal choice, modes explained, no invented level | E2E + axe | PLANNED |
| 9 | S2 reviewer tool for all content types (publish / return with reason) | E2E | PLANNED |
| 10 | Exam conditions: focus mode, per-parameter config model (EXAM-06), runtime fidelity status (YKI-FID-01) | E2E | PLANNED |
| 11 | Finnish pre-start instruction (draft, hidden until S2) | E2E | PLANNED |
| 12 | Full-form and sealed held-out bank loader (works when S2 forms exist) | unit + E2E | PLANNED |
| 13 | Freshness check for OPH-derived data (EXV-20, YKI-FID-10) | CI | PLANNED |
| 14 | Privacy/security: DPIA notes, consent texts, SECURITY update | doc + review markers | PLANNED |
| 15 | One `release-gate` script over content status, claims, budget, accessibility matrix | CI | PLANNED |

## Human gates (cannot be replaced by code)

S2 review (start with a ~150-item core set covering 9 themes × 4 skills); licensed multi-voice human audio; OPH 2027 demo walkthrough (G-EX-02); legal/privacy review of voice recording; two-rater writing/speaking anchors; consented learner pilot with day-14/30 delayed checks. Owner decisions: hosting/domain (PR 1 defaults to GitHub Pages), enabling publication.

## Observations and decisions

- 2026-11-14 — Hosting not chosen; PR 1 uses GitHub Pages because it needs no secrets. Publication stays off until the owner enables Pages (Settings → Pages → Source: GitHub Actions) and sets `DEPLOY_PAGES=true`.
- 2026-11-14 — Action SHAs resolved from the actions' own repositories with `git ls-remote`: `upload-pages-artifact` v5 = `fc324d35…`, `deploy-pages` v5.0.1 = `368f8252…`.
- 2026-11-14 — GitHub Pages cannot send headers: CSP is a `<meta>` (no `frame-ancestors`); dev server is exempt (Vite HMR inlines scripts).
- 2026-11-14 — The CSP blocked three tests that injected `<style>` for 200 % text; they now use CSSOM / constructed stylesheets (same effect, allowed by CSP). `bypassCSP` deliberately not used.
- 2026-11-14 — One offline WEB-06 failure traced to a test race (`waitForLoadState` resolved on the old page before the update reload); the test now waits for the new document's `load` event.

## Verification log

| Command or real-device scenario | Result | Evidence |
| --- | --- | --- |
| `E2E_BROWSERS=chromium pnpm exec playwright test` (apps/web) | see PR 1 | local |
| Real deployment on GitHub Pages | NOT RUN | needs owner to enable Pages + variable |
| Real phones / screen readers | NOT RUN | human |

## Risks and rollback

- Static rollback does not roll back IndexedDB data; schema changes (PR 6) need a tested forward path.
- Turning off `DEPLOY_PAGES` stops further publication; unpublishing an existing site is done in Settings → Pages.
