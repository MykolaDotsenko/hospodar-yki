## Outcome and scope

<!-- One user-visible change and why. Link issue / acceptance IDs (G0–G6, C-01…C-10) and source spec. -->
- Goal:
- Scope / explicit non-goals:
- Baseline commit:
- Status: <!-- TARGET / SOURCE_PROTOTYPE / PARTIAL / IMPLEMENTED_TESTED / RELEASE_VERIFIED -->

## Changes and contracts

- Code/behavior:
- Data schemas, migration/export and rollback:
- Web / Android parity (or NOT APPLICABLE):
- Official YKI fidelity and learning/first-attempt semantics (or NOT APPLICABLE):

## Verification evidence

<!-- Report every meaningful command as PASS / FAIL / NOT RUN, with actual logs or Actions URL. Never infer Android device verification from a Kotlin source file. -->

| Check / command | PASS / FAIL / NOT RUN | Evidence / reason |
| --- | --- | --- |
| `node --test app/tests/*.test.mjs` | NOT RUN | |
| `node --test packages/contracts/tests/*.test.mjs` | NOT RUN | |
| `python3 scripts/validate_ai_docs.py` | NOT RUN | |
| Relevant Python architecture/content validation | NOT RUN | |
| Chromium IndexedDB / Web E2E / Android device as applicable | NOT RUN | |

## Safety and quality checklist

- [ ] No silent data loss; error/retry/idempotency or migration behavior addressed where relevant.
- [ ] No pre-submit exam answer leakage, fabricated YKI grades or mislabelled first attempts.
- [ ] Privacy/consent/security risks checked; no secrets, private learner data or voice in Git/logs.
- [ ] Media source, license, redistribution permission and human Finnish review checked when applicable.
- [ ] Accessibility and offline behavior considered; not claimed verified without tests.
- [ ] Canonical docs/status updated with working relative links; no conflicting duplicated rule.
- [ ] Changed code has tests or explicit justification and residual risk.
- [ ] No Android APK/AAB, PAD install or production claim without corresponding build/device evidence.

## Remaining risks and review requests

- Known gaps:
- Follow-up plan / rollback:
- Reviewer attention:

## Documentation and supply-chain gate

- [ ] Checked `python3 scripts/validate_doc_integrity.py` and the folder validator after changing docs, workflows or content paths.
- [ ] Existing ADR decision was preserved; any replacement has an explicit superseding ADR link and actual implementation status.
- [ ] GitHub Actions versions are pinned to reviewed upstream commit SHAs, and changed paths trigger their respective validations.
- [ ] [LICENSING.md](../LICENSING.md) respected: licensed source assets remain separate from project-authored code.
