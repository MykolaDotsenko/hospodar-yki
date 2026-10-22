"""Tests for documentation validator path safety, broken links and fence handling."""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import validate_ai_docs as validator


class DocValidatorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / "docs").mkdir()
        (self.root / "AGENTS.md").write_text("# Agents\n", encoding="utf-8")
        (self.root / "docs" / "target.md").write_text("# Target\n", encoding="utf-8")

    def test_relative_parent_and_anchor_resolve(self) -> None:
        for link in ("target.md", "../AGENTS.md", "target.md#part", "../docs/"):
            with self.subTest(link=link):
                self.assertIsNone(validator.check_link(self.root, "docs/source.md", link))

    def test_missing_link_is_reported(self) -> None:
        result = validator.check_link(self.root, "docs/source.md", "missing.md")
        self.assertIn("missing local link", result)

    def test_absolute_and_escape_are_rejected(self) -> None:
        for link in ("../../outside.md", "/etc/passwd", "file:///etc/passwd"):
            with self.subTest(link=link):
                self.assertIsNotNone(validator.check_link(self.root, "docs/source.md", link))

    def test_external_and_fragment_ignored(self) -> None:
        for link in ("https://example.org", "mailto:test@example.org", "#intro"):
            with self.subTest(link=link):
                self.assertIsNone(validator.check_link(self.root, "docs/source.md", link))

    def test_percent_encoded_path_checked(self) -> None:
        self.assertIsNone(validator.check_link(self.root, "docs/source.md", "target%2Emd"))
        self.assertIsNotNone(validator.check_link(self.root, "docs/source.md", "absent%2Emd"))

    def test_double_encoded_traversal_flagged(self) -> None:
        self.assertIn("double-encoded", validator.check_link(self.root, "docs/source.md", "%252e%252e/secrets"))

    def test_fenced_sample_links_ignored(self) -> None:
        fence = chr(96) * 3
        body = "# Title\n[real](target.md)\n" + fence + "md\n[fake](absent.md)\n" + fence
        self.assertEqual(validator.links_in(body), ["target.md"])

    def test_required_files_missing_produces_failure(self) -> None:
        errors = validator.check_docs(self.root)
        self.assertTrue(any("missing required file" in x for x in errors))

    def test_invariant_source_missing_produces_failure(self) -> None:
        errors = validator.check_invariants(self.root)
        self.assertTrue(any("documented source missing" in x for x in errors))


if __name__ == "__main__":
    unittest.main()
