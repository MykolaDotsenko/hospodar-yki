# CI and release evidence — real stack, real gates

The repository contains the legacy local Web MVP **and** a buildable React/Vite Web app with automated Chromium/Firefox/WebKit E2E. It has **not** been verified as a production deployment or Android AAB. A green CI run is not a physical-device, Room runtime or install-time PAD test.

## Today — executable checks

| Changed area | Required evidence |
| --- | --- |
| Docs, ADR, research content paths | `python3 scripts/validate_doc_integrity.py`, folder and AI-document validators, Markdown links |
| Current Web / contracts | `node --test app/tests/*.test.mjs`, `node --test packages/contracts/tests/*.test.mjs` |
| EXAM persistence | Real Chromium IndexedDB concurrency/recovery smoke from [TESTING](../TESTING.md); fail-closed/no fake success |
| Any doc, research, test or app change | `python3 scripts/validate_design_traceability.py` ([validate-traceability](../../.github/workflows/validate-traceability.yml)): every requirement ID in docs/research has an honest status, every cited evidence test still exists, and no new requirement family is left untraced (completeness gate). Static — not a learning-effect claim |
| Educational content / media | Specific Python/Node validators, per-asset rights and Finnish human review; no official YKI grade inference |

**GitHub Actions filters must point to real tracked paths.** Changes in `learning/exercises/`, `assets/audio/`, `sources/` and contract packages must trigger the corresponding tests; [documentation integrity validator](../../scripts/validate_doc_integrity.py) checks path filters and rejects extinct content roots, duplicate/nonmatching filters and unpinned external actions. Web source filters are now active (not a future scaffold); retain only explicit, documented path exceptions in validators. Update this safeguard in the same PR if a new approved future build path is added.

## Future deployment and release — blocked until implemented

- React/Vite Web: lockfile reproducibility, TypeScript typecheck/build, unit, Playwright all three browser engines, a11y, PWA cache/version lifecycle and IndexedDB migration/restore, mobile microphone and offline checks.
- Android: compiling Gradle/Capacitor app, Room migration/instrumentation tests, native media player controls, physical-device process-kill/disk pressure, signed AAB and Play-installed asset packs with verified licenses.
- Optional Supabase: consent and privacy/data-flow mapping, EU regional configuration, RLS cross-user/tenant tests, token security, rate limits, event idempotency and deletion/export checks.

Keep branch protections and required checks aligned with the actual workflows. In PR evidence always show specific SHA, test environment, PASS / FAIL / NOT RUN per command and blockers. Documentation-only assertions can never promote implementation status.

## Supply-chain and contribution policy

GitHub workflows are maintained with least-privilege `permissions: contents: read` unless a job requires narrowly scoped write permission. Reusable actions should be pinned to verified immutable commit SHAs (or a workflow dependency lockfile under current GitHub guidance), with a human-readable major-version comment. Review updates to action pins as dependency upgrades; never copy unverified SHAs.

Do not add a code LICENSE covering third-party books/audio by accident. [Project licensing boundaries](../../LICENSING.md) distinguish original software and educational materials from external content. Keep secret keys and learner voice/answers out of git and CI logs.

**References:** [GitHub path filter semantics](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow), [GitHub secure use](https://docs.github.com/en/actions/reference/security/secure-use), [Android Room migration tests](https://developer.android.com/training/data-storage/room/migrating-db-versions), [Play Asset Delivery](https://developer.android.com/guide/playcore/asset-delivery).
