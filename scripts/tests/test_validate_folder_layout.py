"""Guard against broken Markdown navigation and code examples after folder moves."""
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from validate_folder_layout import check_links


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


if __name__ == "__main__":
    unittest.main()
