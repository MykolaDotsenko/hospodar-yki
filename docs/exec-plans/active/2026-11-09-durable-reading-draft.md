# LEARN Reading — durable checkpoint, verified resume and atomic evidence

**Date:** 2026-11-09 · **Base:** `main@15dc1a6da36e96590b5a1b125c26dff9204c8a8b` (PR #124 merged). **Status:** CODED / CI PENDING; no release claim.

## Why / learner value
The React Reading screen previously kept its first choices, open Finnish answers, self-judgements and transfer text only in component memory; only completed evidence was committed. Page reload, navigation or accidental closing lost unfinished work. This adds recoverability to existing **LEARN** IV-REQ-05 / QL-08, not EXAM/YKI scoring or a claim of better measured Finnish competence.

## Implementation (Web only)
- Increment Dexie schema additively to **v5** with a distinct `readingDraft` store. Preserve existing learner, cloze, writing and EXAM histories. Drafts never count as completed mastery.
- Store frozen first attempts, self-judgements, current editable input and a fingerprint of the item, question keys/evidence and transfer prompts. Reconstruct phases strictly through `readingReducer` before displaying highlights or keys. Corrupt, mismatched, old-content or cross-revision rows **block** opening; discard is explicit and CAS guarded.
- Serialize writes; a short idle debounce saves typed input, and **Зберегти та вийти** explicitly flushes and checks a fresh stored row before navigating away. Every `ANSWER`, `JUDGE`, and `TO_TRANSFER` awaits a checked IndexedDB checkpoint before exposing the next question or feedback. Two-tab stale writes and deletes are refused via learner and draft revisions.
- Finish saves the exact transfer input first, then writes completed diagnostics and removes the matching checkpoint **within one transaction**, followed by a fresh readback. Failed/unacknowledged commits never claim completion. Pending clinic/cloze drafts are independent.
- LEARN erase includes reading drafts with a revision check. Legacy import and empty-profile JSON restore refuse to overwrite a reading draft. Privacy inventory counts paused Reading but Web JSON export **does not include any unfinished drafts**; UI explicitly says so.

## Tests and evidence gates
| Check | Status until workflow proves otherwise |
| --- | --- |
| Pure validator reducer-replay, edited content/forged reveal | CODED, NOT RUN LOCALLY |
| fake-indexeddb migration v4→v5, recovery, CAS, atomic finish and data deletion | CODED, NOT RUN LOCALLY |
| Playwright Chromium/Firefox/WebKit: reload at question, feedback, judgement and transfer; stale tabs; axe; erase | CODED, CI PENDING |
| strict TypeScript, domain tests, Vite build, all repository CI checks | CI PENDING |
| Actual tab kill before debounce, OS low-disk and IndexedDB eviction | NOT RUN; **no lossless crash promise** |
| Human Finnish S2 review, phone accessibility, Android parity and independent learning-effect study | NOT RUN |

**Rollback / known limitation:** Additive v5 table is independent; reverting its UI leaves older learner records intact, but users should finish their Reading draft before rollback or browser migration. Browser data can be removed by the user, storage pressure or browser policy. An edit made immediately before a hard tab kill may not reach IndexedDB. Portable JSON cannot restore unfinished drafts.

**Boundaries:** No changes to EXAM machine or its isolated DB, official YKI content, Android runtime, learning claims, or third-party media. Compare practical continuation with an equal-time baseline before claiming retention outcomes.
