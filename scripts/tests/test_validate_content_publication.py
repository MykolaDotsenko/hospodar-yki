"""Regression cases for the content publication gate (review_card v1)."""
from pathlib import Path
import copy
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from validate_content_publication import check, content_hash, load_files  # noqa: E402


def item(**extra):
    base = {"id": "b1-cloze-001", "prompt_fi": "Asun ___ (Helsinki).", "answer_fi": "Helsingissä",
            "teacher_review": "pending_S2_teacher"}
    base.update(extra)
    return base


def card_for(it, **over):
    card = {"schema": "hospodar-review-card-v1", "status": "published", "level": "B1.1",
            "skills": ["grammar"], "communicative_outcome_uk": "Сказати, де я живу, з правильним місцевим відмінком.",
            "source": {"kind": "project_original", "license": "project_original"},
            "s2_review": {"decision": "approved", "reviewer_role": "S2_teacher", "reviewer_id": "s2-rev-01",
                          "reviewed_at": "2026-11-03"},
            "answer_variants_reviewed": True, "transcript_reviewed": None, "content_version": 1}
    card.update(over)
    published = dict(it, teacher_review="s2_approved")
    published["review_card"] = card
    card.setdefault("content_hash", content_hash(published))
    if "content_hash" not in over:
        card["content_hash"] = content_hash(published)
    return published


def run(*items):
    return check({"learning/exercises/test.json": {"exercises": list(items)}})


class PublicationGateTests(unittest.TestCase):
    def test_repository_has_no_unbacked_claims(self):
        errors, stats = check(load_files())
        self.assertEqual(errors, [])
        self.assertGreater(stats["files"], 30)

    def test_pending_drafts_pass(self):
        self.assertEqual(run(item())[0], [])

    def test_approval_claim_without_card_fails(self):
        for value in ("approved", "s2_approved", "published"):
            errors, _ = run(item(teacher_review=value))
            self.assertTrue(errors and "without an s2_reviewed/published review_card" in errors[0], value)

    def test_negated_values_are_not_claims(self):
        for value in ("pending_S2_teacher", "not_approved", "original_source_text_draft_pending_editorial_approval"):
            self.assertEqual(run(item(review_status=value))[0], [], value)

    def test_complete_card_passes(self):
        self.assertEqual(run(card_for(item(teacher_review=None)))[0], [])

    def test_edit_after_review_breaks_hash(self):
        published = card_for(item(teacher_review=None))
        published["answer_fi"] = "Helsinkissä"
        errors, _ = run(published)
        self.assertTrue(any("content_hash does not match" in e for e in errors))

    def test_non_redistributable_or_missing_url_fails(self):
        it = item(teacher_review=None)
        for src, needle in (({"kind": "licensed", "license": "CC-BY-ND-4.0", "url": "https://x"}, "redistributable"),
                            ({"kind": "licensed", "license": "CC-BY-4.0"}, "source.url")):
            errors, _ = run(card_for(it, source=src))
            self.assertTrue(any(needle in e for e in errors), needle)

    def test_ai_or_missing_human_reviewer_fails(self):
        it = item(teacher_review=None)
        for rev in ({"decision": "approved", "reviewer_role": "AI", "reviewer_id": "model", "reviewed_at": "2026-11-03"},
                    {"decision": "pending", "reviewer_role": "S2_teacher", "reviewer_id": "x1", "reviewed_at": "2026-11-03"},
                    {"decision": "approved", "reviewer_role": "S2_teacher", "reviewed_at": "2026-11-03"}):
            self.assertTrue(run(card_for(it, s2_review=rev))[0], rev)

    def test_incomplete_card_fields_fail(self):
        it = item(teacher_review=None)
        for over in ({"level": "B1"}, {"skills": []}, {"communicative_outcome_uk": ""},
                     {"answer_variants_reviewed": False}, {"transcript_reviewed": False}, {"content_version": 0},
                     {"schema": "v0"}):
            self.assertTrue(run(card_for(it, **over))[0], over)

    def test_published_with_pending_or_script_only_field_fails(self):
        published = card_for(item(teacher_review=None, audio_status="script_only_no_recording_yet"))
        errors, _ = run(published)
        self.assertTrue(any("still says audio_status" in e for e in errors))

    def test_draft_card_may_be_partial_but_cannot_back_a_claim(self):
        draft = item(review_card={"schema": "hospodar-review-card-v1", "status": "draft"})
        self.assertEqual(run(draft)[0], [])
        claim = item(teacher_review="approved", review_card={"schema": "hospodar-review-card-v1", "status": "draft"})
        self.assertTrue(run(claim)[0])


if __name__ == "__main__":
    unittest.main()
