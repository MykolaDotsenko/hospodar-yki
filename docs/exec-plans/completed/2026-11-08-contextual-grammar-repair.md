# LEARN contextual, non-answer-leaking grammar repair (R03 / COG-05)

Date: 2026-11-08. Baseline: `e7e377939eecee62faccd4e3977e62cc3fc11bc8`. Status: DONE_TESTED for automated Web scope; human S2 and independent-learning outcome gates NOT RUN.

## Finding / learner risk
The existing live React `MissionScreen` always showed **"де? куди? звідки?"** after an incorrect first response, even for past/perfect tenses, negation, object, numerals, conditional, verb valency, passive, plural and verbs with changed stems. This is misleading instructional feedback, not merely a cosmetic issue. The UI was not diagnosing the cause of an error; the generic location question made that false impression.

## Research → Hospodar decision
- **ADAPT P0** using R03 Finnish morphology (research/pedagogy/30), COG-02/05 & PSY-02 (research/pedagogy/27), LEARN-07 (docs/15), QL-01. Context-sensitive short formative prompt is a safer starting point than generic location guidance. Feedback and real linguistic correctness require S2 reviewer approval; original content is still marked editorial draft, not published/certified.
- 28 existing original B1 cloze tasks / 25 grammar tags; a hand-curated Ukrainian question for each tag, *not* AI, not lexical parsing, not automatic error-source identification. `b1-g-005` asks about verb valency; `b1-g-007` asks about past tense/person instead of location; `b1-g-001` asks about motion toward a place. Questions never show the exact Finnish key.
- **Do not infer a language gain** until independent equal-time S2 day14/day30 novel Finnish production trial (R01) with blind scoring against an equally meaningful feedback/control. Human content/variants/rights review remains NOT RUN.

## Acceptance
1. At least 28/28 bundled items have a tagged prompt. A new tag without approved question falls back to a neutral meaning-based check, never a fabricated specific diagnosis. No correct answer leaks before the second attempt.
2. Frozen first independent answer, repair-before-key and novel free-production transfer retain current behavior. No extra learner data, storage schema, Android, EXAM, audio, AI or notifications.
3. Unit checks cover tag completeness, bounded prompts, no answer-key substring, tense/non-location category routing, unknown/prototype tags. Browser three-engine Playwright shows valency and motion routing, hides keys in repair, shows key only in feedback, axe.
4. Keep `S2 pending` draft labels, COG-05/PSY-02 traceability honest. Don't assert anything about observed Finnish outcomes.

## Evidence
- TypeScript / Web Vitest / build / 3-engine Playwright: DONE_TESTED. GitHub run [42429182549](https://github.com/MykolaDotsenko/hospodar-yki/actions/runs/42429182549), tested commit `47465042b1e548c43ffb17cdd0f085ca34658fa9`: **6/6 checks succeeded**, **147 browser cases passed / 6 skipped** (Chromium, Firefox, WebKit), no failures in final run. Valency and location repair E2E both passed in all three engines. New content/repair question tests and domain/TS/build succeeded.
- Teacher approval of the Ukrainian cues and Finnish task keys: NOT RUN.
- Controlled R01 day14/day30 novel transfer: NOT RUN.
- Manual mobile screen-reader: NOT RUN.

No DB migration; rollback by reverting PR. Errors in tag mapping are non-destructive and should be corrected with human S2 feedback before content publication.

## First CI run — documentation correction

GitHub PR #120 head `270a6948`: traceability and combined contract checks failed solely on a mistyped untracked requirement incorrectly transposed PSY code in this plan (correct canonical code: `PSY-02`). Domain parity, TypeScript, Web unit tests and build passed; the browser suite was still running when this correction was made. No pedagogical runtime failure was observed in that first completed CI segment. Recheck final HEAD before merging.

## Final test and release note

PR [#120](https://github.com/MykolaDotsenko/hospodar-yki/pull/120) implemented this slice. Initial traceability runs failed because a planning-note identifier was transposed; the note was corrected. The final commit passed all six CI checks on the same source/tests. The current original Finnish cloze bank and new Ukrainian questions remain **S2 editorial drafts**: automatic checks can establish key non-leakage, tag coverage and browser behavior, **not** correctness of every accepted Finnish variant nor a statistically demonstrated learning gain. No native Android build and no official YKI 2027 fidelity claim. Rollback requires no data migration.
