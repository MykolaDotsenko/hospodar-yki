# Developer guide — reproducible development without invented toolchains

**Scope:** currently runnable **plain-JS Web MVP**. The React/Vite/Capacitor/Phaser/TypeScript monorepo described by ADR-027 is a **future integration**, not the command set in this document.

## Prerequisites

- Node.js **22** (matches current GitHub Actions jobs; a compatible Node 20+ may run parts of the MVP).
- Python **3.12** recommended for validators and a local stdlib HTTP server.
- Chrome/Chromium only for the real-browser IndexedDB test; not required for Node/Python unit checks.
- No package install, Supabase key, native Android SDK or cloud account is required for current Web MVP.

## Work locally (repository root)

```sh
git clone https://github.com/MykolaDotsenko/hospodar-yki.git
cd hospodar-yki
python3 -m http.server 8080
```

Then open `http://localhost:8080/app/` for LEARN or `http://localhost:8080/app/exam.html` for the EXAM mini rehearsal. Use `http://` rather than `file://` so browser `fetch` can read JSON. The server is a development convenience, **not a production deploy**.

In a second terminal:

```sh
node --check app/core.mjs
node --check app/app.mjs
node --check app/exam-core.mjs
node --check app/exam.mjs
node --check app/attempt-storage.mjs
node --test app/tests/*.test.mjs
node --test packages/contracts/tests/*.test.mjs
python3 scripts/validate_ai_docs.py
```

Full validation by affected area is in [TESTING.md](TESTING.md). Do **not** run `pnpm build`, `gradlew` or Android release commands today: no corresponding buildable project or root lockfile has been established.

## Working on a change

1. Use [INDEX](INDEX.md) to find the owning requirement and accepted architecture policy. Inspect actual code and closest tests before editing.
2. Write a small acceptance checklist including failure paths. For material multi-file work use an [execution plan](exec-plans/README.md).
3. Edit the **smallest layer**; add tests before widening abstractions. Preserve `app/` UX while moving to a future Web scaffold.
4. Run the affected unit checks, then all directly related validators and, when persistence changes, the actual Chromium IndexedDB test (see [TESTING](TESTING.md)).
5. Update canonical docs, explicit target/implemented status, migrations/compatibility and known limitations with the same PR.
6. Fill [PR template](../.github/pull_request_template.md) with exact commands and result evidence; never mark unexecuted checks as green.

## Content authoring vs code

- Curriculum, human Finnish, keys, subtitles and media rights: follow [learning/CONTRIBUTING.md](../learning/CONTRIBUTING.md) and validations; do not let AI-generated text bypass language review.
- Official YKI exactness is not proven by a plausible-looking UI. Separate confirmed OPH evidence from simulations and unverified format assumptions.
- Secrets, personal voice recordings, consent data and unknown-license media must not be committed.

## Debugging and rollback

Reproduce with a minimal browser/test fixture. For IndexedDB changes, first export/backup available learner data, preserve stable keys and support idempotent migration. If an update fails, retain the working `app/` implementation and revert/redeploy the narrow PR rather than rewriting persistent data blindly. No browser backup guarantees apply after site data deletion or eviction.

## Future build-tool adoption (gated)

The Web migration adds a lockfile, strict TypeScript, scripts, package boundaries and E2E test runner **in a dedicated PR**; update this guide only after successful CI proves exact commands. Android Gradle/Capacitor and Play internal testing similarly require a real scaffold and device logs, not a copied command snippet.

## Practical guides for the next engineering steps

- [Current architectural decisions](architecture/README.md), including Room replacing early Android WebView IndexedDB ideas.
- [G1–G6 Web and native migration](guides/WEB-ANDROID-MIGRATION.md), with real test gates and no fake build commands.
- [Add licensed Finnish source content](guides/CONTENT-AUTHORING.md), including required attribution and S2 review.
- [CI path filter verification](operations/CI-QUALITY-GATES.md) and [licensing](../LICENSING.md).
