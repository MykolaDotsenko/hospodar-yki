# Browser MVP — task-scoped agent instructions

Read [root policy](../AGENTS.md), [actual architecture](../docs/ARCHITECTURE.md), and [tests](../docs/TESTING.md) before touching working browser code. These short notes do **not** replace the canonical documents.

- **Present state:** \`app/app.mjs\` and \`app/exam.mjs\` are the plain-JavaScript user interface. \`core.mjs\` and \`exam-core.mjs\` are pure domain; \`attempt-storage.mjs\` is a browser IndexedDB adapter. LEARN still uses localStorage and EXAM uses checkpoint events; React/Vite/Phaser/Capacitor are target, not shipped.
- **Boundary:** never import React, Phaser, storage globals, DOM, or native adapters into pure core. Run [architecture boundary check](../scripts/validate_architecture_boundaries.py) plus [app unit tests](tests/core.test.mjs) after edits.
- **Learning integrity:** LEARN first independent answer is not assisted repair; EXAM must not leak solutions before submission. Do not report unreviewed Finnish speaking/writing as an official YKI score.
- **Data safety:** failed IndexedDB commit must not show success or allow unsafe next/finish; preserve event identity, export/migration semantics, privacy and browser recovery. Real Chromium integration is required for persistence changes.
- **UX changes:** cite [evidence-to-UX](../docs/guides/EVIDENCE-TO-UX.md), human language review and accessible audio/visual alternatives; no mandatory decorative sound.

## Experimental G1 browser storage

`session-v2-idb.mjs` demonstrates an isolated atomic V2 IndexedDB transaction with unique first-attempt evidence and durable receipts, tested in `tests/atomic-idb-browser.html`. **Do not** switch existing LEARN or EXAM to this database without explicit version negotiation, data export/migration tests and approved UI behavior. See [G1 evidence](../docs/architecture/G1-IMPLEMENTATION.md).
