"""s2_reviewed -> published (scripts/publish_reviewed.py; docs/29 stage 1, QL-01, GL-01)."""
from pathlib import Path
import json
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from apply_review_decisions import apply  # noqa: E402
from publish_reviewed import publish  # noqa: E402
from validate_content_publication import check, content_hash  # noqa: E402

FILE = "learning/exercises/b1/grammar/test-bank.json"
ITEMS = [
    {"id": "cloze-1", "prompt_fi": "Asun ___ (Helsinki).", "answer_fi": "Helsingissä", "meaning_review_status": "editorial_draft_pending_S2_review"},
    {"id": "r08-1", "prompt_fi": "Olen ___ (kauppa).", "review_status": "editorial_draft_pending_S2_review", "answerKeyReviewed": False},
    {"id": "dlg-1", "title_fi": "Kielikahvila", "quality_status": "pending_S2_teacher_review", "audio_status": "script_only_no_recording_yet"},
]


def approve(item):
    return {"file": FILE, "item_id": item["id"], "content_hash": content_hash(item), "decision": "approve",
            "reviewer_id": "s2-rev-01", "reviewed_at": "2026-11-14",
            "approval": {"level": "B1.1", "skills": ["grammar"], "communicative_outcome_uk": "Сказати, де я живу, з правильним відмінком.",
                         "source": {"kind": "project_original", "license": "project_original"},
                         "answer_variants_reviewed": True, "transcript_reviewed": None, "content_version": 1}}


class PublishReviewedTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.path = self.root / FILE
        self.path.parent.mkdir(parents=True)
        self.path.write_text(json.dumps({"exercises": ITEMS}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        errors, _ = apply({"schema": "hospodar-review-decisions-v1", "decisions": [approve(i) for i in ITEMS]}, root=self.root)
        self.assertEqual(errors, [])
        self.reviewed = self.path.read_text(encoding="utf-8")

    def tearDown(self):
        self.tmp.cleanup()

    def items(self):
        return {i["id"]: i for i in json.loads(self.path.read_text(encoding="utf-8"))["exercises"]}

    def test_publishing_approves_the_markers_and_keeps_the_reviewed_hash(self):
        errors, skipped, summary = publish(None, root=self.root)
        self.assertEqual(errors, [], summary)
        it = self.items()
        self.assertEqual((it["cloze-1"]["review_card"]["status"], it["cloze-1"]["meaning_review_status"]), ("published", "approved_S2"))
        self.assertEqual((it["r08-1"]["review_status"], it["r08-1"]["answerKeyReviewed"]), ("approved_S2", True))
        for i in ("cloze-1", "r08-1"):
            self.assertEqual(it[i]["review_card"]["content_hash"], content_hash(it[i]))      # still the reviewed content
            self.assertEqual(it[i]["prompt_fi"], next(x for x in ITEMS if x["id"] == i)["prompt_fi"])
        self.assertEqual(check({FILE: json.loads(self.path.read_text(encoding="utf-8"))})[0], [])

    def test_an_item_no_review_can_lift_is_not_published(self):
        errors, _, _ = publish([f"{FILE}#cloze-1", f"{FILE}#dlg-1"], root=self.root)     # explicit: all or nothing
        self.assertTrue(any("dlg-1" in e and "audio_status" in e for e in errors), errors)
        self.assertEqual(self.path.read_text(encoding="utf-8"), self.reviewed)
        errors, skipped, _ = publish(None, root=self.root)                               # default: the eligible ones
        self.assertEqual(errors, [])
        self.assertTrue(any("dlg-1" in s and "audio_status" in s for s in skipped), skipped)
        self.assertEqual(self.items()["dlg-1"]["review_card"]["status"], "s2_reviewed")
        self.assertEqual(self.items()["cloze-1"]["review_card"]["status"], "published")

    def test_an_item_edited_after_review_is_not_published(self):
        data = json.loads(self.reviewed)
        data["exercises"][0]["answer_fi"] = "Helsinkissä"
        self.path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        before = self.path.read_text(encoding="utf-8")
        errors, skipped, _ = publish(None, root=self.root)
        self.assertTrue(errors and "publication gate already fails" in errors[0], errors)          # nothing else is published either
        self.assertTrue(any("cloze-1" in s and "changed after the S2 review" in s for s in skipped), skipped)
        self.assertEqual(self.path.read_text(encoding="utf-8"), before)

    def test_markers_are_not_content_but_everything_else_is(self):
        a = {"id": "x", "prompt_fi": "Asun ___.", "teacher_review": "pending"}
        self.assertEqual(content_hash(a), content_hash({**a, "teacher_review": "approved"}))
        self.assertEqual(content_hash(a), content_hash({**a, "answerKeyReviewed": True}))
        self.assertNotEqual(content_hash(a), content_hash({**a, "prompt_fi": "Asun ___!"}))
        self.assertNotEqual(content_hash(a), content_hash({**a, "audio_status": "recorded"}))

    def test_marker_list_is_the_same_in_the_browser_workspace(self):
        import re
        from validate_content_publication import REVIEW_MARKER_KEYS
        src = (Path(__file__).resolve().parents[2] / "packages/domain/src/review.ts").read_text(encoding="utf-8")
        body = re.search(r"export const REVIEW_MARKER_KEYS = \[(.*?)\] as const", src, re.S).group(1)
        self.assertEqual(tuple(re.findall(r'"([^"]+)"', body)), REVIEW_MARKER_KEYS)

    def test_dry_run_and_unknown_items_write_nothing(self):
        errors, _, summary = publish(None, root=self.root, dry_run=True)
        self.assertEqual(errors, [])
        self.assertIn("2 item(s) to publish", summary)
        self.assertTrue(publish([f"{FILE}#missing"], root=self.root)[0])
        self.assertTrue(publish(["learning/exercises/none.json#cloze-1"], root=self.root)[0])
        self.assertEqual(self.path.read_text(encoding="utf-8"), self.reviewed)


if __name__ == "__main__":
    unittest.main()
