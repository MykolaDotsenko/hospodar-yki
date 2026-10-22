"""Regression cases for GitHub Actions filter and active-path drift."""
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from validate_doc_integrity import (
    workflow_paths, check_workflow_paths, check_active_content_paths,
    ACTIVE_CONTENT_FILES,
)


class WorkflowPathTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / ".github/workflows").mkdir(parents=True)
        (self.root / "learning/exercises/b1/themes").mkdir(parents=True)
        (self.root / "learning/exercises/b1/themes/sample.json").write_text("{}")

    def workflow(self, value):
        (self.root / ".github/workflows/test.yml").write_text(value)

    def test_filter_parsing_ignores_job_items(self):
        self.assertEqual(list(workflow_paths(
            "on:\n  pull_request:\n    paths:\n"
            "      - 'learning/exercises/**'\n"
            "jobs:\n  test:\n    steps:\n      - uses: actions/checkout@v4\n"
        )), [("pull_request", "learning/exercises/**")])

    def test_valid_active_paths_pass(self):
        self.workflow("on:\n  push:\n    paths:\n"
                      "      - 'learning/exercises/**'\n"
                      "  pull_request:\n    paths:\n"
                      "      - 'learning/exercises/**'\n")
        self.assertEqual(check_workflow_paths(self.root), [])

    def test_obsolete_paths_fail(self):
        self.workflow("on:\n  pull_request:\n    paths:\n"
                      "      - 'content/b1/themes/**'\n")
        self.assertTrue(any("obsolete" in item for item in check_workflow_paths(self.root)))

    def test_nonexistent_patterns_fail(self):
        self.workflow("on:\n  pull_request:\n    paths:\n"
                      "      - 'learning/exercises/b1/does-not-exist/**'\n")
        self.assertTrue(any("matches no current files" in item
                            for item in check_workflow_paths(self.root)))

    def test_planned_web_scaffold_explicitly_exempt(self):
        self.workflow("on:\n  pull_request:\n    paths:\n"
                      "      - 'apps/web/**'\n")
        self.assertEqual(check_workflow_paths(self.root), [])

    def test_duplicate_patterns_fail_even_if_valid(self):
        self.workflow("on:\n  push:\n    paths:\n"
                      "      - 'learning/exercises/**'\n"
                      "      - 'learning/exercises/**'\n")
        self.assertTrue(any("duplicate" in item for item in check_workflow_paths(self.root)))


class ActiveContentTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for path in ACTIVE_CONTENT_FILES:
            f = self.root / path
            f.parent.mkdir(parents=True, exist_ok=True)
            f.write_text("Uses learning/exercises/b1/themes/ now\n", encoding="utf-8")

    def test_canonical_docs_pass(self):
        self.assertEqual(check_active_content_paths(self.root), [])

    def test_stale_path_inside_json_fails(self):
        f = self.root / "research/pedagogy/yki-methodology-implementation-v1.json"
        f.write_text('{"reads":["content/b1/themes/"]}')
        self.assertTrue(any("old physical content" in e for e in check_active_content_paths(self.root)))

    def test_missing_active_document_fails(self):
        (self.root / ACTIVE_CONTENT_FILES[0]).unlink()
        self.assertTrue(any("absent" in e for e in check_active_content_paths(self.root)))


if __name__ == "__main__":
    unittest.main()
