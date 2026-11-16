"""S2 reviewer workspace → repository: scripts/apply_review_decisions.py (docs/29 stage 1, QL-01)."""
from pathlib import Path
import copy
import json
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from apply_review_decisions import apply  # noqa: E402
from validate_content_publication import check, content_hash  # noqa: E402

FILE = "learning/exercises/b1/grammar/test-cloze.json"
DATA = {"schema_version": "1.0.0", "exercises": [
    {"id": "c1", "prompt_fi": "Asun ___ (Helsinki).", "answer_fi": "Helsingissä", "duration": 143.0,
     "teacher_review": "pending_S2_teacher"},
    {"id": "c2", "prompt_fi": "Menen ___ (kauppa).", "answer_fi": "kauppaan"}]}


def approve(item, **over):
    d = {"file": FILE, "item_id": item["id"], "content_hash": content_hash(item), "decision": "approve",
         "reviewer_id": "s2-rev-01", "reviewed_at": "2026-11-14",
         "approval": {"level": "B1.1", "skills": ["grammar"],
                      "communicative_outcome_uk": "Сказати, де я живу, з правильним відмінком.",
                      "source": {"kind": "project_original", "license": "project_original"},
                      "answer_variants_reviewed": True, "transcript_reviewed": None, "content_version": 1}}
    d.update(over)
    return d


def give_back(item, **over):
    d = {"file": FILE, "item_id": item["id"], "content_hash": content_hash(item), "decision": "return",
         "reviewer_id": "s2-rev-01", "reviewed_at": "2026-11-14", "return_categories": ["key"],
         "reason_uk": "Прийнятний також варіант «kauppaan asti»."}
    d.update(over)
    return d


def doc(*decisions):
    return {"schema": "hospodar-review-decisions-v1", "created_at": "2026-11-14T10:00:00Z", "decisions": list(decisions)}


class ApplyReviewDecisionsTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.path = self.root / FILE
        self.path.parent.mkdir(parents=True)
        self.raw = json.dumps(DATA, ensure_ascii=False, indent=2) + "\n"
        self.path.write_text(self.raw, encoding="utf-8")
        self.c1, self.c2 = copy.deepcopy(DATA["exercises"])

    def tearDown(self):
        self.tmp.cleanup()

    def stored(self):
        return json.loads(self.path.read_text(encoding="utf-8"))

    def test_approval_writes_an_s2_reviewed_card_and_leaves_the_item_untouched(self):
        errors, summary = apply(doc(approve(self.c1)), root=self.root)
        self.assertEqual(errors, [], summary)
        item = self.stored()["exercises"][0]
        card = item.pop("review_card")
        self.assertEqual(item, self.c1)                                   # item bytes unchanged → reviewed hash holds
        self.assertEqual(card["status"], "s2_reviewed")
        self.assertEqual(card["content_hash"], content_hash(self.c1))
        self.assertEqual(card["s2_review"], {"decision": "approved", "reviewer_role": "S2_teacher",
                                             "reviewer_id": "s2-rev-01", "reviewed_at": "2026-11-14"})
        self.assertEqual(check({FILE: self.stored()})[0], [])
        self.assertTrue(self.path.read_text(encoding="utf-8").endswith("}\n"))

    def test_return_records_who_when_why_and_passes_the_gate(self):
        errors, _ = apply(doc(give_back(self.c2)), root=self.root)
        self.assertEqual(errors, [])
        card = self.stored()["exercises"][1]["review_card"]
        self.assertEqual((card["status"], card["s2_review"]["decision"], card["s2_review"]["return_categories"]),
                         ("draft", "returned", ["key"]))
        self.assertEqual(check({FILE: self.stored()})[0], [])

    def test_approval_without_a_required_card_field_is_refused_and_nothing_is_written(self):
        a = approve(self.c1)["approval"]
        broken = [
            {**a, "level": ""}, {**a, "skills": []}, {**a, "communicative_outcome_uk": "ok"},
            {**a, "source": {"kind": "licensed", "license": "CC-BY-ND-4.0", "url": "https://x.fi"}},
            {**a, "source": {"kind": "licensed", "license": "CC-BY-4.0"}},
            {**a, "answer_variants_reviewed": False}, {**a, "content_version": 0}, None,
        ]
        for approval in broken:
            errors, _ = apply(doc(approve(self.c1, approval=approval)), root=self.root)
            self.assertTrue(errors, approval)
            self.assertEqual(self.path.read_text(encoding="utf-8"), self.raw)
        for over in ({"reviewer_id": "Anna Virtanen"}, {"reviewer_id": ""}, {"reviewed_at": "14.11.2026"}):
            self.assertTrue(apply(doc(approve(self.c1, **over)), root=self.root)[0], over)
        self.assertTrue(apply(doc(give_back(self.c2, reason_uk="ні")), root=self.root)[0])
        self.assertTrue(apply(doc(give_back(self.c2, return_categories=[])), root=self.root)[0])
        self.assertEqual(self.path.read_text(encoding="utf-8"), self.raw)

    def test_an_item_edited_after_review_must_be_reviewed_again(self):
        seen = dict(self.c1, answer_fi="Helsinkissä")
        errors, _ = apply(doc(approve(self.c1, content_hash=content_hash(seen))), root=self.root)
        self.assertTrue(any("changed after the reviewer saw it" in e for e in errors))
        self.assertEqual(self.path.read_text(encoding="utf-8"), self.raw)

    def test_all_or_nothing_unknown_files_duplicates_and_dry_run(self):
        good = approve(self.c1)
        for bad in (give_back(self.c2, reason_uk="x"), approve(self.c2, file="apps/web/src/App.tsx"),
                    approve(self.c2, file="learning/exercises/../../secret.json"), approve(self.c2, item_id="nope"),
                    good):
            self.assertTrue(apply(doc(good, bad), root=self.root)[0], bad)
            self.assertEqual(self.path.read_text(encoding="utf-8"), self.raw)
        self.assertEqual(apply({"schema": "other", "decisions": [good]}, root=self.root)[0], ["not a hospodar-review-decisions-v1 file"])
        errors, summary = apply(doc(good), root=self.root, dry_run=True)
        self.assertEqual(errors, [])
        self.assertIn("dry run", summary)
        self.assertEqual(self.path.read_text(encoding="utf-8"), self.raw)

    def test_hash_is_shared_with_the_browser_workspace(self):
        self.assertEqual(content_hash({"id": "x", "d": 143.0}), content_hash({"id": "x", "d": 143}))
        self.assertEqual(content_hash({"id": "x", "review_card": {"status": "draft"}}), content_hash({"id": "x"}))
        with self.assertRaises(ValueError):
            content_hash({"id": "x", "d": 0.00001})

    def test_mission_catalogs_in_sources_are_reviewable_other_sources_files_are_not(self):
        mission_file = "sources/audio/authentic-dialogues-2026-10.json"
        mission = {"id": "m1", "title_fi": "Suomea julkisissa", "mission": {"independent_prompt_fi": "Kuuntele yksi äänite."}}
        (self.root / mission_file).parent.mkdir(parents=True)
        (self.root / mission_file).write_text(json.dumps({"items": [mission]}, ensure_ascii=False), encoding="utf-8")
        other = "sources/publishers/publisher-series-catalog.json"
        (self.root / other).parent.mkdir(parents=True)
        (self.root / other).write_text(json.dumps({"sources": [{"id": "s1"}]}), encoding="utf-8")
        errors, _ = apply(doc(approve(mission, file=mission_file, approval={**approve(mission)["approval"], "skills": ["listening"]})), self.root)
        self.assertEqual(errors, [])
        stored = json.loads((self.root / mission_file).read_text(encoding="utf-8"))
        self.assertEqual(stored["items"][0]["review_card"]["status"], "s2_reviewed")
        errors, summary = apply(doc(approve({"id": "s1"}, file=other)), self.root)
        self.assertTrue(errors)
        self.assertEqual(summary, "nothing written")

    def test_reviewable_source_catalogs_agree_with_the_web_reviewer_registry(self):
        import re
        from validate_content_publication import REVIEWABLE_SOURCE_CATALOGS
        web = (Path(__file__).resolve().parents[2] / "apps/web/src/content/reviewBanks.ts").read_text(encoding="utf-8")
        block = web.split("export const REVIEWABLE_SOURCE_CATALOGS = [", 1)[1].split("];", 1)[0]
        self.assertEqual(sorted(re.findall(r'"([^"]+)"', block)), sorted(REVIEWABLE_SOURCE_CATALOGS))

    def test_gate_rejects_an_incomplete_return_written_by_hand(self):
        item = dict(self.c2, review_card={"schema": "hospodar-review-card-v1", "status": "draft",
                                          "s2_review": {"decision": "returned", "reviewer_role": "S2_teacher",
                                                        "reviewer_id": "s2-rev-01", "reviewed_at": "2026-11-14"},
                                          "content_hash": content_hash(self.c2)})
        errors, _ = check({FILE: {"exercises": [item]}})
        self.assertTrue(any("return_categories" in e for e in errors) and any("reason_uk" in e for e in errors))


if __name__ == "__main__":
    unittest.main()
