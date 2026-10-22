"""Negative and positive regression tests for architecture boundaries."""
import pathlib
import sys
import tempfile
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from validate_architecture_boundaries import check_source, validate


class ArchitectureBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.work = tempfile.TemporaryDirectory()
        self.addCleanup(self.work.cleanup)
        self.root = pathlib.Path(self.work.name)
        for path in ("app/core.mjs", "app/exam-core.mjs",
                     "packages/contracts/src/index.mjs"):
            f = self.root / path
            f.parent.mkdir(parents=True, exist_ok=True)
            f.write_text("export const score = answer => answer === 'moi';\n")

    def test_pure_modules_and_reusable_package_pass(self):
        self.assertEqual(validate(self.root), [])

    def test_disallow_react_and_supabase(self):
        for module in ("react", "phaser", "@capacitor/core",
                       "dexie", "@supabase/supabase-js", "node:fs"):
            with self.subTest(module=module):
                self.assertTrue(check_source(
                    self.root, "app/core.mjs", f'import x from "{module}";'
                ))

    def test_disallow_dom_or_local_storage_in_domain(self):
        self.assertTrue(check_source(self.root, "app/core.mjs",
                                     "export const value = localStorage.getItem('x');"))
        self.assertTrue(check_source(self.root, "app/exam-core.mjs",
                                     "const el = document.querySelector('input');"))

    def test_domain_may_import_valid_relative_domain_file(self):
        file = self.root / "packages/contracts/src/support.mjs"
        file.write_text("export const value = true;\n")
        self.assertEqual(check_source(self.root, "packages/contracts/src/index.mjs",
                                      'import {value} from "./support.mjs";'), [])

    def test_reject_missing_relative_imports(self):
        self.assertTrue(any("unresolved" in e for e in check_source(
            self.root, "packages/contracts/src/index.mjs",
            'import {x} from "./does-not-exist.mjs";'
        )))

    def test_reject_reverse_import_into_ui(self):
        ui = self.root / "app/app.mjs"
        ui.write_text("export const side = 'UI';\n")
        self.assertTrue(any("imports UI" in e for e in check_source(
            self.root, "packages/contracts/src/index.mjs",
            'import "../fake.mjs" from "../../../app/app.mjs";'
        )))

    def test_reject_path_escape(self):
        self.assertTrue(any("escapes repository" in e for e in check_source(
            self.root, "packages/contracts/src/index.mjs",
            'import x from "../../../../outside.mjs";'
        )))

    def test_ignores_comment_mentions_of_browser_api(self):
        self.assertEqual(check_source(self.root, "app/core.mjs",
                                      "// localStorage.getItem('x')\n"
                                      "/* document.querySelector('x') */\n"
                                      "export const ok = true;"), [])


if __name__ == "__main__":
    unittest.main()
