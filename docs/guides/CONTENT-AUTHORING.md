# Guide — add a Finnish learning exercise or multimedia source

This is a **how-to**, not a new content index. Use the existing physical folders described in [CONTENT-ARCHITECTURE](../CONTENT-ARCHITECTURE.md). A human teacher/editor still owns Finnish pedagogy and assessment-grade quality.

## Choose exactly one physical owner

- New exercise, lesson, mini-mock or rubric: `learning/exercises/b1/`, under the appropriate skill/theme; keep permanent logical IDs and versioned task content.
- Reusable Finnish chunks/valency/frequency lookup: `knowledge/dictionaries/b1/`. A learner-specific weak-word list must not contain all imported words by default.
- Locally redistributable image/audio/video and subtitles/transcript: `assets/images/`, `assets/audio/` or `assets/video/`. Keep content hash, creator, source, media format, caption and license metadata.
- External YouTube, official YKI, publishers, educational corpora or courses: `sources/youtube/`, `sources/official/`, `sources/publishers/` or `sources/learning/` as appropriate. **Link-only is not permission to copy, record or bundle.**
- Research hypothesis, usability study and design/game mechanism: `research/pedagogy/`, `research/ux/`, `research/design/`, `research/gameplay/` or `research/user-cases/`; a study is not evidence that a feature ships.

## Authoring checklist

1. Select the skill, topic, intended CEFR level and user outcome. Use a new exercise ID, provenance URL, language, per-file license/rights scope, content version and review status.
2. Write **original Finnish content** or use a verified legally redistributable source with required attribution and license conditions. Do not copy third-party paid textbook tasks or protected official YKI recordings.
3. Verify meaning, spelling, grammar, diacritics, spoken register, options, feedback, transcription/caption alignment and accessibility. Retain `teacher_review=pending` until a qualified S2 reviewer checks it.
4. For LEARN: independent response → meaningful feedback → self-repair → different transfer task. For EXAM: freeze the test profile and reveal no hints/keys before submission; uncalibrated oral/written tasks remain ungraded.
5. Refer to real asset paths using existing lesson JSON fields; never duplicate binary media in every lesson directory. External YouTube stays URLs/timestamps with rights metadata.
6. Execute the related validator(s) in [TESTING](../TESTING.md), `python3 scripts/validate_folder_layout.py` and `python3 scripts/validate_doc_integrity.py`; include exact pass/fail/not-run evidence in PR.

## Review card — the only way to mark content as reviewed or published (03.11.2026)

An item may say it is approved/published **only** through a `review_card` object on the item itself. `python3 scripts/validate_content_publication.py` (CI: *Validate YKI educational content*) rejects any `*review*`/`*status*` field that claims approval without a valid card, and any reviewed card whose content changed afterwards. Everything else stays a draft, as today (0 published items).

```json
"review_card": {
  "schema": "hospodar-review-card-v1",
  "status": "draft | s2_reviewed | published | withdrawn",
  "level": "A1.3 | A2.1 | A2.2 | B1.1 | B1.2 | B2.1",
  "skills": ["reading"],
  "communicative_outcome_uk": "Що учень зможе зробити фінською після завдання",
  "source": {"kind": "project_original | licensed | public_domain", "license": "project_original | CC0-1.0 | CC-BY-4.0 | CC-BY-SA-4.0 | CC-BY-3.0 | CC-BY-SA-3.0 | public-domain", "url": "https://… (required unless project_original)"},
  "s2_review": {"decision": "approved", "reviewer_role": "S2_teacher", "reviewer_id": "pseudonymous-id", "reviewed_at": "YYYY-MM-DD"},
  "answer_variants_reviewed": true,
  "transcript_reviewed": true,
  "content_version": 1,
  "content_hash": "sha256:… (python3 scripts/validate_content_publication.py --hash FILE ITEM_ID)"
}
```

Rules: the reviewer is a qualified **human** S2 teacher (AI drafts never sign a card); `transcript_reviewed` is `null` only when the item has no audio; ND/NC/link-only sources can never be published as bundled content; a `published` item may not keep fields such as `pending…`, `script_only…`, `not_valid…`; editing a reviewed item changes its hash and requires a new review. No personal data in `reviewer_id`. The check is static: it cannot verify the reviewer's identity or Finnish quality.

**Source of truth:** [learning/CONTRIBUTING](../../learning/CONTRIBUTING.md), [source rights/verification](../../sources/learning/06-sources-and-verification.md), [YouTube rules](../../sources/youtube/README.md), [YKI evidence](../14-digital-yki-fidelity-spec.md), [W3C captions/transcripts](https://www.w3.org/WAI/media/av/).
