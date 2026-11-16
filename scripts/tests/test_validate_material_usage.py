"""CURATED-09/10: every saved material is used by the app or registered with a reason; new-material search is logged."""
import json
import sys
import tempfile
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import validate_material_usage as v  # noqa: E402


def repo(tmp: Path, register_items: list, log: list | None = None) -> Path:
    (tmp / "apps/web/src/content").mkdir(parents=True)
    (tmp / "apps/web/src/content/media.ts").write_text('import m from "../../../../assets/audio/available.json";\n', encoding="utf-8")
    (tmp / "assets/audio").mkdir(parents=True)
    (tmp / "assets/audio/available.json").write_text(json.dumps({"items": [{"path": "audio/used.ogg"}]}), encoding="utf-8")
    for n in ("used.ogg", "idle.ogg"):
        (tmp / "assets/audio" / n).write_bytes(b"OggS")
    (tmp / "docs").mkdir()
    (tmp / "sources").mkdir()
    (tmp / "sources/round.md").write_text("round", encoding="utf-8")
    (tmp / v.REGISTER).write_text(json.dumps({"search_every_days": 28, "search_log": log or [], "items": register_items}), encoding="utf-8")
    return tmp


IDLE = {"path": "assets/audio/idle.ogg", "reason": "TO_CONNECT", "note_uk": "готовий запис", "plan_uk": "етап 2: аудіювання"}


class MaterialUsage(unittest.TestCase):
    def test_material_usage_an_unused_saved_file_must_be_used_or_registered_with_a_reason(self):
        with tempfile.TemporaryDirectory() as t:
            root = repo(Path(t), [])
            errors = v.check(root)
            self.assertTrue(any("assets/audio/idle.ogg" in e and "not used by the app" in e for e in errors), errors)
            self.assertFalse(any("used.ogg" in e and "idle" not in e for e in errors), errors)   # the manifest's file counts as used
        with tempfile.TemporaryDirectory() as t:
            self.assertEqual(v.check(repo(Path(t), [IDLE])), [])

    def test_material_usage_the_register_stays_honest_used_or_deleted_items_and_missing_reasons_fail(self):
        with tempfile.TemporaryDirectory() as t:
            root = repo(Path(t), [IDLE, {"path": "assets/audio/used.ogg", "reason": "TO_CONNECT", "note_uk": "x", "plan_uk": "y"}])
            self.assertTrue(any("used.ogg is used by the app now" in e for e in v.check(root)))
        with tempfile.TemporaryDirectory() as t:
            root = repo(Path(t), [IDLE, {"path": "assets/audio/gone.ogg", "reason": "TO_CONNECT", "note_uk": "x", "plan_uk": "y"}])
            self.assertTrue(any("gone.ogg does not exist" in e for e in v.check(root)))
        with tempfile.TemporaryDirectory() as t:
            root = repo(Path(t), [{**IDLE, "plan_uk": ""}])
            self.assertTrue(any("TO_CONNECT needs plan_uk" in e for e in v.check(root)))
        with tempfile.TemporaryDirectory() as t:
            root = repo(Path(t), [{**IDLE, "reason": "LATER"}])
            self.assertTrue(any("reason must be one of" in e for e in v.check(root)))

    def test_material_search_is_logged_with_a_record_and_reported_when_due_never_failing_ci_for_time(self):
        log = [{"date": "2026-10-28", "scope_uk": "аудіо", "found": None, "added": None, "record": "sources/round.md"}]
        with tempfile.TemporaryDirectory() as t:
            root = repo(Path(t), [IDLE], log)
            self.assertEqual(v.check(root), [])
            self.assertIn("next in 9 days", v.search_status(root, date(2026, 11, 16)))
            self.assertIn("DUE NOW", v.search_status(root, date(2026, 12, 1)))      # reported, not an error
            self.assertEqual(v.check(root), [])
        with tempfile.TemporaryDirectory() as t:
            root = repo(Path(t), [IDLE], [{**log[0], "record": "sources/missing.md"}])
            self.assertTrue(any("does not exist" in e for e in v.check(root)))
        with tempfile.TemporaryDirectory() as t:
            self.assertIn("none recorded yet", v.search_status(repo(Path(t), [IDLE]), date(2026, 11, 16)))

    def test_material_usage_the_real_repository_passes(self):
        self.assertEqual(v.check(), [])


if __name__ == "__main__":
    unittest.main()
