# Web LEARN Picture Mission — verified independent-answer durability

**Date:** 2026-11-10. **Baseline:** `main@a86144f6894a1c223b916a4b05f00741aed5485e`. **Status:** CODED / PR CI PENDING. G2 partial implementation only; not Android or full release.

## Problem, learner benefit and ownership

Picture Mission previously kept the Finnish independent description and phase in React memory and committed both descriptions only at the end. A reload could silently erase a learner's first attempt and allow a second "first" attempt. Lost state also risked revealing model sentences or Ukrainian translation out of sequence. Under **QL-08 / IV-REQ-06 / UIO-03**, this slice preserves the learner's own words and the prerequisite attempt before model-based repair, without labeling open production as an automatic language grade.

## Implementation and invariants

- Additive Dexie **v8** `pictureDraft`, not a rewrite of earlier learner/EXAM, cloze, Writing Clinic, Reading, Listening or Dialogue rows.
- Bind checkpoint to exact original lesson **and licensed picture metadata** via a non-cryptographic editorial fingerprint; replay strictly through `startPicture` and `pictureReducer`, rejecting forged `support` / `transfer` phases and impossible or extra fields before showing models, glosses or transferring without a photo.
- Persist exact working text on a bounded idle debounce and on explicit **Зберегти та вийти**. Sequence stage changes behind queued optimistic learner/draft revision checks and a fresh database readback (only then show the next stage). Read and revalidate on reload; incompatible or stale row blocks instead of overwriting. A conflicting tab cannot discard a newer revision.
- Finish both ungraded production events atomically with removal of the matching transfer checkpoint, then reread. The stored draft is **not** completed evidence and does not become a YKI proficiency prediction.
- LEARN data inventory, deliberate scoped wipe, legacy import and LEARN-only JSON restore include v8 draft in their fail-closed protections. Existing portable export **excludes incomplete Picture Mission**, visibly disclosed. Do not confuse portable export with backup of unfinished work.

## Acceptance and limitations

| Gate | Location | Status |
| --- | --- | --- |
| First-answer/phase pure replay, content changes and early hints | `apps/web/src/storage/pictureDraft.test.ts` | CODED; CI PENDING |
| fake IndexedDB v7→v8, second tab CAS, exactly-once ungraded finish and privacy | `apps/web/src/storage/pictureDraft.repository.test.ts` | CODED; CI PENDING |
| Browser reload/early-hint/transfer, stale-tab, erase/export, axe | `apps/web/e2e/picture-mission-restore.spec.ts` | CODED; 3-engine CI PENDING |
| Whole repo strict TS, Vitest, build, all PR + post-merge checks | GitHub checks | PENDING |

**Not proved:** power kill before debounce, browser storage eviction/disk-quota in real device, offline photo pack device availability, Android Room, teacher S2 final approval, causal language-learning improvement or exact 2027 official YKI. The existing legacy `app/` is not modified.

## Rollback

The Dexie v8 migration is additive; reverting the UI may leave a v8 unfinished row until a compatible version resumes it or an explicit LEARN wipe removes it. Do not drop stores or rewrite user history in a rollback.
