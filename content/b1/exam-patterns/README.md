# YKI keskitaso — two original four-skill mini-rehearsal blueprints

**[Machine-readable two mock compositions](mini-rehearsals-v1.json)** · **[official format & example research](../../../docs/13-yki-exam-format-and-real-examples-2027.md)** · **[direct official + Yle links](../../../research/yki-exam-examples-2026-10.json)**.

Both packages are **mini practice sequences**, not completed exam papers or validated digital 2027 mock exams:

- **A · житло і побут:** 1 reading item with 3 questions, 1 real locally stored **synthetic** 2:23 listening exercise with 4 objective questions, a writing prompt and a speaking situation.
- **B · робота і суспільство:** analogous four-skill series, using different existing reading, listening, writing and speaking content.
- Source files referenced by stable IDs instead of embedding duplicate texts. They use Hospodar YKI original drafts from `content/b1`, with **pending S2 review**; no SOLKI task text or broadcaster MP3 has been copied.
- These JSON objects describe task selection and sequencing for a **future** app iteration. The existing `app/` UI has its own simple diagnostic and digitesti view; **these two new blueprints are not yet wired into that UI**.
- Initial attempt → delayed feedback at series end; no official timing constraints. Objective answer keys may be scored; open answers and speaking/writing remain `ungraded` until reliable human review.
- For listening, each blueprint points to a **Piper Harri single-speaker synthesized** OGG, **not** a modern native-dialogue item. A true multi-voice audio pack must be independently sourced, recorded or licensed, and transcribed.
- No combined "passed YKI" verdict or automatically issued B1/level 3. For readiness, assess four skills independently on unseen items and only after teacher calibration.

**Validate:** from repository root run `python3 scripts/validate_yki_exam_research.py`.

**License distinction:** original local training data stay within the repository; external official and Yle samples are stored **as links only** with provenance and rights metadata in `research/yki-exam-examples-2026-10.json`.
