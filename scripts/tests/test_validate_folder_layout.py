"""Guard against broken Markdown navigation and code examples after folder moves."""
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from validate_folder_layout import (
    check_links, check_local_media_ownership, check_tree,
    check_operational_json_references, check_youtube_link_only,
)


class MarkdownLinks(unittest.TestCase):
    def setUp(self):
        self.context = tempfile.TemporaryDirectory()
        self.addCleanup(self.context.cleanup)
        self.root = Path(self.context.name)
        (self.root / "research" / "ux").mkdir(parents=True)
        (self.root / "research" / "design").mkdir(parents=True)
        (self.root / "research" / "design" / "colors.md").write_text("# Colors\n")

    def test_valid_relative_link(self):
        (self.root / "research" / "ux" / "README.md").write_text(
            "# UX\n[design](../design/colors.md)\n"
        )
        self.assertEqual(check_links(self.root), [])

    def test_missing_file_rejected(self):
        (self.root / "research" / "ux" / "README.md").write_text(
            "# UX\n[missing](../design/unknown.md)\n"
        )
        self.assertTrue(any("broken link" in x for x in check_links(self.root)))

    def test_escaped_root_rejected(self):
        (self.root / "README.md").write_text("# Root\n[escape](../../etc/passwd)\n")
        self.assertTrue(any("out-of-tree" in x for x in check_links(self.root)))

    def test_fenced_example_ignored(self):
        fence = chr(96) * 3
        (self.root / "README.md").write_text(
            "# Root\n" + fence + "md\n[illustrative](missing.md)\n" + fence + "\n"
        )
        self.assertEqual(check_links(self.root), [])



class LocalMediaOwnership(unittest.TestCase):
    def setUp(self):
        import json
        self.json = json
        self.context = tempfile.TemporaryDirectory()
        self.addCleanup(self.context.cleanup)
        self.root = Path(self.context.name)
        (self.root / "assets/audio/tts/harri").mkdir(parents=True)
        (self.root / "assets/video/open").mkdir(parents=True)
        (self.root / "assets/audio/tts/harri/lesson.ogg").write_bytes(b"one")
        (self.root / "assets/video/open/scene.webm").write_bytes(b"video")
        self.audio = {
            "entries": [{"id": "lesson-one", "path": "assets/audio/tts/harri/lesson.ogg"}]
        }
        self.video = {
            "assets": [{"id": "scene-one", "path": "assets/video/open/scene.webm"}]
        }
        self.save()

    def save(self):
        (self.root / "assets/audio/library.json").write_text(self.json.dumps(self.audio))
        (self.root / "assets/video/open/available.json").write_text(self.json.dumps(self.video))

    def test_exact_membership_is_valid(self):
        self.assertEqual(check_local_media_ownership(self.root), [])

    def test_old_source_catalog_location_is_rejected(self):
        (self.root / "assets/audio/catalog.json").write_text("{}")
        errors, _ = check_tree(self.root)
        self.assertTrue(any("noncanonical duplicate research/plan" in e
                            for e in errors))

    def test_orphan_audio_is_rejected(self):
        (self.root / "assets/audio/tts/harri/duplicate.ogg").write_bytes(b"two")
        self.assertTrue(any("unreferenced media file" in e
                            for e in check_local_media_ownership(self.root)))

    def test_unregistered_other_audio_format_is_rejected(self):
        (self.root / "assets/audio/tts/harri/accidental.wav").write_bytes(b"wav")
        self.assertTrue(any("unreferenced media file" in e
                            for e in check_local_media_ownership(self.root)))

    def test_missing_video_is_rejected(self):
        (self.root / "assets/video/open/scene.webm").unlink()
        self.assertTrue(any("manifest points to missing media" in e
                            for e in check_local_media_ownership(self.root)))

    def test_duplicate_audio_record_is_rejected(self):
        self.audio["entries"].append(dict(self.audio["entries"][0]))
        self.save()
        errors = check_local_media_ownership(self.root)
        self.assertTrue(any("duplicate media ID" in e for e in errors))
        self.assertTrue(any("duplicate media path" in e for e in errors))

    def test_outside_folder_and_traversal_rejected(self):
        self.audio["entries"][0]["path"] = "../private.ogg"
        self.save()
        self.assertTrue(any("unsafe/wrong-root media path" in e
                            for e in check_local_media_ownership(self.root)))

    def test_corrupt_manifest_fails_safely(self):
        (self.root / "assets/audio/library.json").write_text("{not json}")
        self.assertTrue(any("invalid media manifest" in e
                            for e in check_local_media_ownership(self.root)))


class OperationalReferences(unittest.TestCase):
    def setUp(self):
        import json
        self.json = json
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root / "learning/exercises/b1").mkdir(parents=True)
        (self.root / "assets/audio/open").mkdir(parents=True)
        (self.root / "sources/youtube").mkdir(parents=True)
        (self.root / "assets/audio/open/lesson.ogg").write_bytes(b"fixture")

    def write(self, obj):
        (self.root / "learning/exercises/b1/test.json").write_text(
            self.json.dumps(obj), encoding="utf-8"
        )

    def test_nested_valid_path_and_fragment(self):
        self.write({"lessons": [{"variants": [
            {"audio_path": "assets/audio/open/lesson.ogg"},
            {"transcript_ref": "learning/exercises/b1/test.json#my-id"},
        ]}]})
        errors, count = check_operational_json_references(self.root)
        self.assertEqual(errors, [])
        self.assertEqual(count, 2)

    def test_missing_nested_binary_fails(self):
        self.write({"lessons": [{"audio_versions": [
            {"path": "assets/audio/open/missing.ogg"}
        ]}]})
        errors, count = check_operational_json_references(self.root)
        self.assertEqual(count, 1)
        self.assertTrue(any("missing referenced resource" in x for x in errors))

    def test_unsafe_path_fails_closed(self):
        self.write({"path": "assets/audio/../../private.ogg"})
        errors, _ = check_operational_json_references(self.root)
        self.assertTrue(any("unsafe resource path" in x for x in errors))

    def test_external_urls_are_not_local_paths(self):
        self.write({"source_page": "https://youtube.com/watch?v=test",
                    "preview": "link-only",
                    "note": "assets/audio/future target TBD"})
        errors, count = check_operational_json_references(self.root)
        self.assertEqual(errors, [])
        self.assertEqual(count, 0)

    def test_external_audio_candidate_is_not_installed_media(self):
        (self.root / "sources/audio").mkdir(parents=True)
        (self.root / "sources/audio/recording-sources.json").write_text(
            self.json.dumps({"open_licensed_downloads": [{
                "relative_path": "assets/audio/open/not-downloaded-yet.ogg"
            }]}), encoding="utf-8"
        )
        self.write({"lessons": [{"audio_path": "assets/audio/open/lesson.ogg"}]})
        errors, count = check_operational_json_references(self.root)
        self.assertEqual(errors, [])
        self.assertEqual(count, 1)

    def test_binary_inside_youtube_sources_is_rejected(self):
        (self.root / "sources/youtube/copied.mp4").write_bytes(b"not permitted")
        self.assertTrue(any("downloaded media" in x
                            for x in check_youtube_link_only(self.root)))

    def test_json_in_youtube_sources_is_allowed(self):
        (self.root / "sources/youtube/links.json").write_text("{}")
        self.assertEqual(check_youtube_link_only(self.root), [])

if __name__ == "__main__":
    unittest.main()
