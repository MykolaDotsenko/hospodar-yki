# Execution plan: repository content and knowledge taxonomy

- **Date:** 2026-10-22 · **Owner:** repository AI architecture/content agent
- **Baseline:** `main@0f7cbb2dc2e06c68a2fe6007ed3f5abe6a82d25c`
- **Status:** IN_PROGRESS (mark DONE_TESTED only after PR checks actually pass)
- **User outcome:** consistently discover media, YouTube, sources, knowledge, dictionaries, exercises, methods, design, UX, gameplay and user cases.
- **Non-goal:** destructive runtime path moves, fake licenses, 3GB video imports, Web/Android new binaries, unofficial YKI grading.

## Work sequence

| Step | Acceptance | Evidence |
| --- | --- | --- |
| Inventory | Audit existing owner paths and binary Git blobs | `catalog/media-inventory-v1.json` 94 entries, unchanged blobs |
| Ownership | Group all requested domains without duplicate content payloads | `catalog/registry.v1.json`, index/readmes and taxonomy validator |
| Resource metadata | Schema captures provenance/rights/skill/review/delivery, link-only YT | `catalog/schemas/resource.v1.schema.json`; existing content not falsely schema-certified |
| User research | Distinct design, UX, pedagogy, gameplay, and use-case hubs | `research/*/README.md` and concrete study/flow documents |
| Compatibility | Existing Web paths/audio/videos intact | Diff audit: no binary deletion/move; existing CI + new validator |
| Proof | Fail on broken links, missing binaries, changed SHA, duplicate owner | Python unit tests, new GitHub Actions workflow |

## Risk and rollback

- Existing scripts load precise `audio/`, `video/`, `research/` and `content/b1` paths. Keep these paths canonical until explicit consumer parity; avoid a big-bang reorganization.
- A Git SHA identifies bytes but does **not** establish media rights. Correct rights metadata requires separate human review; `unknown` cannot be packaged.
- Catalog/schema is governance metadata, not a complete new content engine. This refactor neither migrates learner data nor changes YKI scoring.

## Verification log

| Check | Status | Evidence |
| --- | --- | --- |
| Taxonomy Python unit tests | NOT RUN | Await PR workflow result |
| Binary/hash/category/links validator | NOT RUN | Await PR workflow result |
| Existing Web/architecture tests | NOT RUN | Await PR workflow result |
| Real Android pack delivery | NOT APPLICABLE | No Android AAB in repo |

**Completion:** update with real PR/CI URL and close after tests and review.
