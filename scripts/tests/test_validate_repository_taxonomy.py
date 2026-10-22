"""Unittest negative cases: media file identity, duplicate ownership, link-only boundary."""
from __future__ import annotations

import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import validate_repository_taxonomy as taxonomy


def store(file: Path, value: dict) -> None:
    file.parent.mkdir(parents=True, exist_ok=True)
    file.write_text(json.dumps(value), encoding="utf-8")


class TaxonomyTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        for category, subdir in (
            ("images", "assets/images"), ("audio", "assets/audio"),
            ("video", "assets/video"), ("youtube", "sources/youtube"),
            ("external_sources", "sources"), ("knowledge", "knowledge"),
            ("dictionaries", "knowledge/dictionaries"),
            ("exercises", "learning/exercises"),
            ("pedagogy", "research/pedagogy"),
            ("design", "research/design"), ("ux", "research/ux"),
            ("gameplay", "research/gameplay"),
            ("user_cases", "research/user-cases"),
            ("architecture", "docs"),
        ):
            (self.root / subdir).mkdir(parents=True, exist_ok=True)
        (self.root / "sources/youtube/README.md").write_text("# YouTube\n", encoding="utf-8")
        (self.root / "sources/youtube/catalog.json").write_text("{}", encoding="utf-8")
        self.registry = {
            "schema_version": "1.0.0",
            "rights_default": "unknown_not_redistributable_without_item_level_evidence",
            "root_directories": {
                "images": "assets/images", "audio": "assets/audio",
                "video": "assets/video", "youtube": "sources/youtube",
                "external_sources": "sources", "knowledge": "knowledge",
                "dictionaries": "knowledge/dictionaries",
                "exercises": "learning/exercises",
                "pedagogy": "research/pedagogy", "design": "research/design",
                "ux": "research/ux", "gameplay": "research/gameplay",
                "user_cases": "research/user-cases", "architecture": "docs",
            },
            "collections": [{
                "id": "sources.youtube", "category": "youtube", "status": "curated_link_only",
                "owner": "sources/youtube/README.md",
                "canonical_paths": ["sources/youtube/catalog.json"],
                "references": [],
            }],
        }
        store(self.root / "catalog/registry.v1.json", self.registry)

    def test_valid_registry_passes(self) -> None:
        self.assertEqual(taxonomy.check_registry(self.root), [])

    def test_duplicate_owner_or_identifier_fails(self) -> None:
        self.registry["collections"].append(dict(self.registry["collections"][0]))
        store(self.root / "catalog/registry.v1.json", self.registry)
        errors = taxonomy.check_registry(self.root)
        self.assertTrue(any("duplicate collection" in x for x in errors))
        self.assertTrue(any("canonically owned" in x for x in errors))

    def test_missing_canonical_file_fails(self) -> None:
        self.registry["collections"][0]["canonical_paths"] = ["sources/youtube/gone.json"]
        store(self.root / "catalog/registry.v1.json", self.registry)
        self.assertTrue(any("missing canonical" in x for x in taxonomy.check_registry(self.root)))

    def test_youtube_binary_rejected(self) -> None:
        f = self.root / "sources/youtube/video.mp4"
        f.touch()
        self.registry["collections"][0]["canonical_paths"] = ["sources/youtube/video.mp4"]
        store(self.root / "catalog/registry.v1.json", self.registry)
        self.assertTrue(any("YouTube catalog cannot" in x for x in taxonomy.check_registry(self.root)))

    def test_youtube_cannot_claim_redistributable_status(self) -> None:
        self.registry["collections"][0]["status"] = "implemented_source"
        store(self.root / "catalog/registry.v1.json", self.registry)
        self.assertTrue(any("YouTube must always" in x for x in taxonomy.check_registry(self.root)))

    def test_binary_inventory_detects_mutation_and_unregistered_asset(self) -> None:
        binary = self.root / "audio/open/demo.ogg"
        binary.parent.mkdir(parents=True, exist_ok=True)
        binary.write_bytes(b"original")
        item = {
            "path": "audio/open/demo.ogg", "kind": "audio",
            "size_bytes": 8, "git_blob_sha": taxonomy.git_blob_sha(binary),
            "rights_state": "verify_in_source_manifest_before_redistribution",
        }
        inv = {
            "schema_version": "1.0.0", "sha_type": "git_blob_sha1_not_sha256",
            "totals": {"files": 1, "bytes": 8}, "entries": [item],
        }
        store(self.root / "catalog/media-inventory-v1.json", inv)
        self.assertEqual(taxonomy.check_media_inventory(self.root), [])
        binary.write_bytes(b"replaced")
        self.assertTrue(any("inventory git blob changed" in x for x in taxonomy.check_media_inventory(self.root)))
        (self.root / "audio/open/new.mp3").write_bytes(b"new")
        self.assertTrue(any("unregistered binary" in x for x in taxonomy.check_media_inventory(self.root)))

    def test_rights_status_never_claims_verified_by_filename(self) -> None:
        binary = self.root / "video/open/test.webm"
        binary.parent.mkdir(parents=True, exist_ok=True)
        binary.write_bytes(b"x")
        store(self.root / "catalog/media-inventory-v1.json", {
            "schema_version": "1.0.0", "sha_type": "git_blob_sha1_not_sha256",
            "totals": {"files": 1, "bytes": 1},
            "entries": [{
                "path": "video/open/test.webm", "kind": "video",
                "size_bytes": 1, "git_blob_sha": taxonomy.git_blob_sha(binary),
                "rights_state": "licensed",
            }],
        })
        self.assertTrue(any("not a license assertion" in x for x in taxonomy.check_media_inventory(self.root)))


if __name__ == "__main__":
    unittest.main()
