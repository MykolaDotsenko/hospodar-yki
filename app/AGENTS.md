# Browser MVP — task-scoped agent instructions

**R07 independent answer-first interaction guard (28.10.2026):** [isolated r07-interaction-core.mjs](r07-interaction-core.mjs) + [tests](tests/r07-interaction-core.test.mjs), UX [#21 evidence and test plan](../research/ux/21-r07-meaningful-interactive-finnish-ux-2026-10.md). Prototype forbids premature answer/caption, forced audio, fake speaking/writing grading or EXAM import. Not active in app.mjs; production UI integration needs S2-reviewed content/rights, durable state, W3C and Android tests. Keep current SRS and R06 reference separate.

**R06 isolated reference-only scorer:** [adaptation-core.mjs](adaptation-core.mjs) + [tests](tests/adaptation-core.test.mjs) provide pure deterministic local LEARN *ranking* with no cloud/DOM/storage and strict S2/offline/EXAM/ungraded guards. **Not used by app.mjs**; never swap it in without dedicated S2, persistence migration, focus/choice UI, fairness, delay-14 human trial and E2E. See [research №33](../research/pedagogy/33-r06-transparent-adaptive-finnish-learning-2026-10.md).

Read [root policy](../AGENTS.md), [actual architecture](../docs/ARCHITECTURE.md), and [tests](../docs/TESTING.md) before touching working browser code. These short notes do **not** replace the canonical documents.

- **Present state:** \`app/app.mjs\` and \`app/exam.mjs\` are the plain-JavaScript user interface. \`core.mjs\` and \`exam-core.mjs\` are pure domain; \`attempt-storage.mjs\` is a browser IndexedDB adapter. LEARN still uses localStorage and EXAM uses checkpoint events; React/Vite/Phaser/Capacitor are target, not shipped.
- **Boundary:** never import React, Phaser, storage globals, DOM, or native adapters into pure core. Run [architecture boundary check](../scripts/validate_architecture_boundaries.py) plus [app unit tests](tests/core.test.mjs) after edits.
- **Learning integrity:** LEARN first independent answer is not assisted repair; EXAM must not leak solutions before submission. Do not report unreviewed Finnish speaking/writing as an official YKI score.
- **Data safety:** failed IndexedDB commit must not show success or allow unsafe next/finish; preserve event identity, export/migration semantics, privacy and browser recovery. Real Chromium integration is required for persistence changes.
- **UX changes:** cite [evidence-to-UX](../docs/guides/EVIDENCE-TO-UX.md), human language review and accessible audio/visual alternatives; no mandatory decorative sound.

## Experimental G1 browser storage

`session-v2-idb.mjs` demonstrates an isolated atomic V2 IndexedDB transaction with unique first-attempt evidence and durable receipts, tested in `tests/atomic-idb-browser.html`. **Do not** switch existing LEARN or EXAM to this database without explicit version negotiation, data export/migration tests and approved UI behavior. See [G1 evidence](../docs/architecture/G1-IMPLEMENTATION.md).
