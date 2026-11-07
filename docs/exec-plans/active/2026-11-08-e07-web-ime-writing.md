# E07 Web EXAM writing: composition-safe drafts and verified readback

- **Date:** 2026-11-08
- **Baseline main:** `eca0ca2dd76a193ae61fea91fc67eddd444ba662` (PR #117 merged)
- **Status:** IMPLEMENTED, CI PENDING
- **Requirements:** research/yki/25 E07 P0-2, docs/15 EXAM, docs/21 E04/E07, QL-07/08, C-04.
- **Scope:** only `apps/web` EXAM writing input / XState and Dexie checkpoint readback. No changes to legacy app, S2 content, YKI profile, native or DB schemas.

## Acceptance
1. In-progress composition cannot autosave an intermediate draft, move forward, or finish; all keyboard interactions remain usable.
2. Final compositionend/blur sends exact text (including decomposed combining characters) to the machine and flags it dirty.
3. Pending autosave cannot erase the final composition. Finish/history is acknowledged only after exact stored readback.
4. Reload after successful save restores exact text. Corrupt/mismatched data never receives a fake success claim.
5. No official YKI 2027 editor, word count, grade or language review claim.

## Execution and evidence
| Step | Evidence | Status |
|---|---|---|
| React controlled textarea + XState composition guard | E07 machine tests, Playwright | IMPLEMENTED; CI PENDING |
| Fresh IndexedDB checkpoint/history readback | EXAM storage tests, Playwright | IMPLEMENTED; CI PENDING |
| Regression and 3-engine browsers | GitHub `validate-web-app.yml` | NOT RUN |

## Rollback / risks
Additive UI+state guard, no IndexedDB schema change. Abort/revert without migration. A crash before final composition commit may lose unsaved, locally composed keystrokes; do not promise lossless abrupt process termination. Browser IME simulation is not proof of actual Android/Finnish keyboard behavior. Official 2027 input rules and S2-reviewed texts remain separate release blockers.
