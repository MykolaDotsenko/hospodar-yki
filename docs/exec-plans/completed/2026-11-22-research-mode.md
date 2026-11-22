# Execution plan: research mode — consent, study time, de-identified export (R01, docs/29 stage 6)

- **Date / owner:** 22.11.2026, coding agent
- **Status:** DONE_TESTED (code); pilot NOT RUN
- **Baseline main SHA / PR:** a2f06fd (+ PR #192)
- **Requirement / gates:** [R01 pilot dossier](../../../research/29-twelve-product-research-studies-execution-2026-10.md#r01-primary-pilot-research-dossier); [docs/29 stage 6](../../29-tz-development-plan.md#етап-6-доказ-ефекту) row «Режим дослідження»; QL-03/QL-04; R01 (traceability).
- **Scope:** apps/web only (legacy `app/` unchanged). Opt-in enrolment with a researcher-given study code and explicit consent; on-device count of active LEARN/EXAM time per screen area; a downloadable de-identified export of first attempts, delayed checks and study time. **Excluded:** sending anything anywhere, randomisation/arm assignment, questionnaires, the pilot itself (human, NOT RUN), voice, any learner text.

## Problem and acceptance

R01 needs equal learning time between arms and day-14/30 outcomes tied to actual elapsed days; today the app records first attempts and delayed checks but not time on task, and has no consented, de-identified way to hand data to a researcher.

Acceptance (each guarded by a test):
1. Nothing is counted or exported before the learner enrols; enrolment needs a study code that cannot be a name or e-mail and three explicit consent ticks.
2. Time counts only while a LEARN or EXAM screen is visible and the learner was active in the last 2 minutes, or audio/video is playing; long gaps (sleep, background tab) are never counted.
3. The export contains no learner text (answers, notes, cues, plans, reflections), no voice, no calendar dates, no name — only content ids, skills, scored/ungraded status, first-answer correctness, days relative to enrolment and seconds per area. Evidence before enrolment is included and flagged (prior exposure).
4. Only first answers per task count as first attempts; spaced reviews and supported answers stay ungraded.
5. Withdrawing deletes the enrolment and the time log (verified by readback); erasing LEARN data does the same; learning progress is untouched by withdrawal.
6. Nothing leaves the device without the learner pressing «Завантажити».

## Implementation sequence

| Milestone | Change | Verification | Status |
| --- | --- | --- | --- |
| 1 | `packages/domain/src/research.ts`: enrolment, consent, study-time log, active-time step, export builder | `pnpm --filter @hospodar/domain test` (research.test.ts) | DONE_TESTED |
| 2 | `apps/web/src/storage/research.ts` (localStorage + readback, clear) and the study-time meter in App | `apps/web/src/storage/research.test.ts` (4) | DONE_TESTED |
| 3 | «Участь у дослідженні» on the data screen: enrol, see counted time, download, withdraw | `apps/web/e2e/research.spec.ts` (3, Chromium) | DONE_TESTED |
| 4 | Traceability (R01 evidence/gap), docs/29 row, this plan → completed | validators | DONE_TESTED |

## Observations and decisions

- 22.11.2026 — Separate store like goals/deeds (not inside `LearnerState`): no V1 schema change, no effect on backup/restore of progress; erased with LEARN data.
- 22.11.2026 — Areas are screen areas (grammar missions, practice, reading, listening, writing, dialogue, pictures, masterclass, external, media, diagnostic, delayed checks, exam), not inferred skills: the researcher decides what counts as dose.

## Verification log

| Command or real-device scenario | Result (PASS/FAIL/NOT RUN) | Evidence/log/URL |
| --- | --- | --- |
| `pnpm --filter @hospodar/domain exec vitest run test/research.test.ts` | PASS | 12 tests |
| `pnpm --filter @hospodar/web exec vitest run src/storage/research.test.ts` | PASS | 4 tests |
| `pnpm exec playwright test e2e/research.spec.ts --project=chromium` | PASS | 3 tests: opt-in + export without text + withdrawal; LEARN erase removes research data; idle stops after 2 min |
| Same E2E on Firefox / WebKit | NOT RUN locally | browsers not installed in the agent container; CI runs them |
| R01 pilot with participants | NOT RUN | human study; protocol not approved |

## Risks and rollback

- Privacy: a study code could be personal if the researcher chooses one — the code pattern refuses e-mail/spaces/lowercase names and the screen says to use only the code the researcher gave.
- Time-on-task is an approximation (activity heuristic), not proof of attention; documented in the export.
- Rollback: revert; the two localStorage keys are ignored by older builds.

## Completion / follow-up

- **Result:** opt-in enrolment, active study-time meter and de-identified export built and tested on Web (Chromium); erasing LEARN data and withdrawal remove research data.
- **Still missing:** arm assignment, questionnaires, consent text review by a privacy owner (human), the pilot.
- **PR / CI:** branch `ccr-04ae9bfe-qogfn5` (follow-up PR after #192)
