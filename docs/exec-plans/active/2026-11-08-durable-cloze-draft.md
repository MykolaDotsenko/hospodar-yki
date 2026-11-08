# Durable LEARN cloze draft, independent attempt and safe resume

**Date:** 2026-11-08. **Baseline:** `main@1f783ca3c00664bcb7c449bf606552fb4d99d8b7`. **PR:** #121. **Status:** CODED / CI PENDING.

## Why / evidence
R11 (research/architecture/r11-offline-integrity-resilience-2026-10.md), PSY-07, R7-02 and QL-08 support safe local recovery without inventing learner success. Former React MissionScreen kept its answer, self-repair and transfer in RAM and counted nothing until the last commit: a reload between phases erased them. **Decision: ADAPT P0**, one Web cloze path first; no assumption that autosave improves YKI result. Outcome would be higher successful task continuation/reduced lost attempts; human day14/30 Finnish competence needs an independent equal-time trial.

## Implementation and verification
- Add one versioned Dexie `missionDraft` store (v3) separate from completed LearnerState, EXAM and voice. Draft has task fingerprint, first/repair state, editable input, updatedAt and independent CAS revision.
- Validate phase/state by replaying pure domain events, NOT trusting stored `feedback`/key-visible phase; reject malformed, wrong-content or completed drafts. A persisted draft is **not** an independent scored attempt/CEFR grade.
- Serialize writes and commit the new submitted phase before showing feedback, with short-idle input autosave; explicit Save & Exit flushes text. On race conflicts, refuse progression. Final LEARN history+draft deletion is one Dexie transaction followed by readback, guarding duplicate completion.
- Integrate paused drafts into LEARN erase and empty-profile import/restore checks; do not change JSON export format. Clearly disclose that unfinished drafts remain device-local and are excluded from exports. Android and EXAM remain unchanged.
- Runnable: Web Vitest (new pure replay + fake-indexeddb); 3-engine Playwright including wrong answer/reload/transfer, two-tab conflict, LEARN erase, axe; TS/build and architecture/design/traceability CI.

## Evidence
| Gate | Status |
|---|---|
| TypeScript and Web/unit/IndexedDB tests | CI PENDING |
| Browser Chromium, Firefox, WebKit / axe | CI PENDING |
| Six GitHub checks | CI PENDING |
| Physical phone / simulated process kill / storage eviction | NOT RUN |
| Human S2 content review and independent day14/30 learning trial | NOT RUN |

## Rollback
Additive v3 schema: reverting the feature leaves the original v2 learner/imports tables intact. Completed data never depends on draft. A rollback does not restore unfinished typed text from a backup; no claims of indefinite local storage or full crash recovery.
