# Execution plan: optional confidence before the first answer (LE-11, AC-57)

- **Date / owner:** 27.11.2026, coding agent
- **Status:** DONE_TESTED (code); effect NOT measured
- **Baseline main SHA / PR:** 60a1478
- **Requirement / gates:** [docs/15 LE-11, AC-57](../../15-two-modes-skill-scopes.md); [research #19 LE-11](../../../research/pedagogy/19-learning-books-to-engineering-2026-10.md); evidence and limits in [research #27 §LE-11](../../../research/pedagogy/27-cognitive-memory-attention-psychology-2026-10.md).
- **Scope:** apps/web LEARN cloze missions (the main keyed first-answer loop). Not in EXAM, not in free production. Legacy `app/` unchanged.

## Problem and acceptance

Learners cannot see where their sense of knowing and their real first answers part ways, and a lucky guess counts as a confident recall in the review schedule.

Acceptance (each guarded by a test):
1. Before checking the first answer the learner MAY mark «Знаю» / «Не впевнений(а)» / «Вгадую»; skipping changes nothing. The mark is frozen with the first answer.
2. After the answer a short, non-shaming note relates the mark to the answer (a confident miss is framed as worth a careful look; a guess that was right is named as luck to check again).
3. A correct answer marked «Вгадую» is not treated as a confident recall: it returns the next day without counting a failure.
4. «Мій прогрес» shows per mark how many first answers were right — counts only, never a %, level or YKI score; nothing when no mark was used.
5. Saved progress, backup export/restore and the mission draft accept the optional field; older data and the legacy reader stay valid.

## Implementation sequence

| Milestone | Change | Verification | Status |
| --- | --- | --- | --- |
| 1 | Domain: `Confidence`, mission event/state, `completeMission`, `calibrationSummary`, `confidenceNote`, restore admission | `packages/domain/test/confidence.test.ts` (9) | DONE_TESTED |
| 2 | Web: mission screen choice + note, draft validation, progress line | `e2e/mission.spec.ts` (2 LE-11 tests, Chromium) | DONE_TESTED |
| 3 | Research #27 section, traceability (LE-11, AC-57), docs | validators | DONE_TESTED |

## Observations and decisions

- Retrospective confidence (about the answer just written, before feedback) is used, not a prospective rating before reading the task: it is what the hypercorrection literature measures and it cannot change the first answer.
- No new learning-method id: this extends the existing `self-regulation` line (LE-11 is an existing requirement).

## Verification log

| Command or real-device scenario | Result (PASS/FAIL/NOT RUN) | Evidence/log/URL |
| --- | --- | --- |
| `pnpm --filter @hospodar/domain test` | PASS | incl. confidence.test.ts |
| `pnpm exec playwright test --project=chromium` (full) | PASS | see PR |
| Firefox / WebKit E2E | NOT RUN locally | not installed in the container; CI runs them |
| Effect on delayed Finnish outcomes | NOT RUN | needs the R01 pilot; no effect claim |

## Risks and rollback

- Rating reactivity: asking for confidence can itself change learning (both directions in the literature) — kept optional and one tap.
- Rollback: revert; stored attempts with `confidence` are still read by older builds (the reader keeps unknown attempt fields), and a backup with the field is refused by an older restore (exact-key check) — documented.

## Completion / follow-up

- **Result:** optional mark on cloze missions, calm note after the key, guessed-right answers reviewed the next day, counts in progress; schema change safe for old data, backup and legacy reader.
- **Still missing:** effect evidence (R01); marks on other keyed tasks (reading/listening questions, practice choices) — deliberately not added until there is evidence it helps.
- **PR / CI:** branch `ccr-04ae9bfe-qogfn5` (follow-up PR after #201)
