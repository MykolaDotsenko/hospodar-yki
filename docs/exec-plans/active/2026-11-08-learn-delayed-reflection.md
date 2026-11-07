# LEARN delayed retrieval: learner-owned reflection & consecutive due reviews

**Baseline:** `main@59977cd79da8301cd971dca4d09fa49e5e904fa7` (PR #117/#118 merged).
**Date:** 2026-11-08. **Status:** IMPLEMENTED / CI PENDING.
**Owners:** `packages/domain/src/retention.ts`, `apps/web/src/screens/RetentionScreen.tsx`, Web tests.

## Scientific evidence → Hospodar
**ADAPT P0**: R01 learning-impact protocol, cognitive review research/pedagogy/27 (COG-02/08, PSY-04), product LE-10/LEARN-05/07, QL-08. A learner should answer a novel Finnish prompt after seven days without seeing their previous response. Only after the independently produced response is durably stored should the app show side-by-side THEIR OWN original and current sentences and ask them to reflect on meaning. Self-reflection is **not** a language grade, S2 correction or demonstrated learning effect.

**Proposed independent measure (NOT RUN):** day-14/30 unseen transfer with blind teacher rating versus equal-time active learning with S2 meaning-focused feedback. No human causal study or S2 approval exists.

## Acceptance
1. Pure `completedTransferReflection` returns null until a valid saved independent ungraded 7/14/30 entry exists. It uses the earliest original learner sentence and exact submitted text; no answer key or guessed correctness.
2. Disable double submit and leaving while saving. Fresh full learner-state/revision readback before "saved" or revealing the prior sentence. On ambiguous readback, show uncertainty, retain typed answer, advise reload before retry.
3. After a valid save, let the learner continue another *different* due checkpoint without returning Home, retaining first attempt isolation and ungraded history across reload.
4. Stay inside LEARN; EXAM/voice/Android/storage schemas untouched. Current four transfer-bank drafts still need two S2 editors, so content must remain marked as editorial draft.

## Verification
| Gate | Status |
| --- | --- |
| Domain unit + TS / Web unit / Vite build | CI PENDING |
| Playwright Chromium/Firefox/WebKit E2E and axe | CI PENDING |
| Traceability/source/docs contract | CI PENDING |
| Real S2 calibration, mobile assistive QA, R01 day14/30 trial | NOT RUN |

Rollback: additive pure selector and UI, no IndexedDB migration. Revert this PR only; existing delayed records remain intact.

## CI correction (first run)

Run `42427608220` stopped in domain tests: 100 passed / 1 failed. The failing test searched JSON text for `/B1/i`, which falsely matched the legitimate task ID `b1-g-001`. This was a **test assertion bug**, not observed grading. Replaced it with an exact whitelist of reflection fields. Web E2E and build were skipped due to the earlier stop; rerun pending.
