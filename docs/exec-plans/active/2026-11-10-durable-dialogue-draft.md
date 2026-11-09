# LEARN Dialogue — durable reply-before-script checkpoints

**Date:** 2026-11-10. **Base:** `main@31b8e3231a3168a6d145383d88129f2630569e1d`. **Status:** PR validation pending. Scoped G2/Web LEARN; not a completed G2 or Android release.

## Learner problem and user-value gate (QL-08, UIO-03, IV-REQ-07)

A learner's own Finnish replies and comprehension judgements in Dialogue were RAM-only until the final role-play submission. Reloading, navigation or tab discard could silently discard them. If the app incorrectly restored a stage, it could show the script or model answer before the independent response. The change supports pause/reload/recovery without turning self-judgement into an automatic YKI score.

## Code and boundaries

- Additive Dexie **v7** `dialogueDraft`, independent from v6 listening, reading, cloze, writing clinic, EXAM and browser microphone recordings. Existing stored rows are not migrated or overwritten.
- A content fingerprint and strict reducer replay validate every prior reply/skip, question first response, self-judgement, stage, and current text. On mismatched content or stale learner revision, keep the draft intact and block reveals; discarding requires deliberate action and CAS.
- Dialogue transitions advance UI only after a serialized write plus fresh IndexedDB readback. Typing is debounced; **Save & Exit** explicitly checkpoints the exact field before returning home. A hard kill before debounce can still lose the last characters.
- Final role-play is ungraded: save the actual first attempts and transfer once, atomically with deletion of matching unfinished checkpoint, then independently readback. Concurrent tab revision conflicts fail closed.
- LEARN privacy inventory, typed-confirmation erase and empty-profile import/restore checks include Dialogue; JSON backup intentionally **does not** contain unfinished Dialogue draft. Tell the learner to finish before moving devices.

## Acceptance evidence and nonclaims

- Pure replay/changed-content tests: `apps/web/src/storage/dialogueDraft.test.ts`.
- fake-indexeddb CAS/second-tab/atomic completion and privacy: `apps/web/src/storage/dialogueDraft.repository.test.ts`.
- Real browser Playwright Chromium/Firefox/WebKit, axe and reload/privacy: `apps/web/e2e/dialogue-restore.spec.ts`; baseline `apps/web/e2e/dialogue.spec.ts`.
- Confirm TypeScript, Vitest, production build, three-engine E2E, all workflow checks **before** merge. Do not label these green until actual CI results.
- No actual browser data-eviction/power-loss guarantees, Android native Room/voice, licensed reviewed Finnish S2 content, independently measured learning improvement or official YKI 2027 fidelity.
