# LEARN Listening — durable supported/independent checkpoint

**Date:** 2026-11-10. **Baseline:** main@8ed493bd606bb5236f0d0eed62b30b4678387932 (Reading #125 merged, post-merge CI green). **Status:** CODED / CI PENDING; not a release.

## Problem and benefit (QL-08, IV-REQ-04)
React LEARN Listening used in-memory prediction, play count, support flags and first-choice answers; navigating away or reloading lost all unfinished answers. Worse, losing a transcript/slow-speed support flag could mislabel dependent answers as independent mastery. This change enables verified continuation **without changing EXAM** or promising improved Finnish proficiency.

## Implementation
- Add Dexie **v6 listeningDraft** table without rewriting v5 learner, cloze, writing-clinic or reading rows; independent of EXAM/voice.
- Persist input, phase and frozen answers; persist `support` (slow/transcript) and audio-start evidence prior to navigation and feedback. `listeningReducer` replay plus a content fingerprint rejects forged phase/keys or old editorial content. A persisted draft is **not** completed evidence.
- Queue draft writes; use CAS for both learner revision and draft revision plus readback. Show next stage only after ACK. Debounced typing and explicit Save & Exit checkpoint the exact current field. Stale tabs fail closed.
- Atomic completion: once feedback/review is durably checkpointed, commit exact LEARN diagnostics and remove the matching listeningDraft in one IndexedDB transaction with fresh readback. Support-assisted questions stay ungraded.
- Privacy inventory, protected LEARN erase, import and restore incorporate the listening draft. Portable JSON intentionally excludes **all** unfinished Web drafts, explicitly disclosed in UI. Physical storage eviction and immediate hard-kill before debounce remain unverified.

## Validation gates
| Evidence | Status |
| --- | --- |
| Pure reducer replay, fingerprint/forged phase tests | CODED, CI PENDING |
| Fake IndexedDB v5→v6, CAS/second tab, support attribution, atomic completion and privacy tests | CODED, CI PENDING |
| Playwright Chromium/Firefox/WebKit reload, support/grading, stale tabs, axe, erase | CODED, CI PENDING |
| TS, Vite build, domain parity, architecture, traceability and full PR/main CI | NOT YET CONFIRMED |
| Real devices, actual audio completion/interruptions, Web IDB eviction, Android Room, S2 review, official YKI 2027 | NOT RUN |

## Rollback and limits
Additive v6 schema preserves older tables. Reverting UI can strand an unfinished listening draft until reopened in a compatible version. Do not claim lossless process termination: a hard kill before debounce can lose the last edit, and the browser may evict local data. No exam-score approximation, native-build assertion, AI dependency or new licensed/S2-approved content.
