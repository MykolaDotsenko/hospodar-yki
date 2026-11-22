"""Single pre-release check (docs/29 stage 8; R11-20): never PASS without evidence; green tests alone never make a release ready."""
import copy
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import release_readiness as rr  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
DATA = json.loads((ROOT / rr.DATA).read_text(encoding="utf-8"))
PASSING = {"status": "PASS", "evidence": {"date": "2026-12-01", "role": "accessibility tester", "environment": "Pixel 7, Android 15, Chrome 131, TalkBack 15",
                                           "record": "docs/operations/release-readiness-v1.json"}}


class RowEvidence(unittest.TestCase):
    def row(self, **kw):
        r = copy.deepcopy(DATA["rows"][0]); r.update(kw); return r

    def test_repository_rows_are_valid_and_honestly_not_run(self):
        data, errs = rr.load_rows(ROOT)
        self.assertEqual(errs, [])
        self.assertTrue(all(r["status"] == "NOT_RUN" for r in data["rows"]))

    def test_pass_needs_a_dated_record_role_and_environment(self):
        self.assertTrue(rr.row_errors(self.row(status="PASS", evidence=None), ROOT))
        for missing in ("date", "role", "environment", "record"):
            ev = dict(PASSING["evidence"]); ev.pop(missing)
            self.assertTrue(rr.row_errors(self.row(status="PASS", evidence=ev), ROOT), missing)
        self.assertTrue(rr.row_errors(self.row(status="PASS", evidence={**PASSING["evidence"], "date": "1.12.2026"}), ROOT))
        self.assertTrue(rr.row_errors(self.row(status="PASS", evidence={**PASSING["evidence"], "record": "docs/no-such-session.md"}), ROOT))
        self.assertEqual(rr.row_errors(self.row(**PASSING), ROOT), [])
        self.assertEqual(rr.row_errors(self.row(status="PASS", evidence={**PASSING["evidence"], "record": "https://example.org/session"}), ROOT), [])

    def test_a_signoff_needs_no_device_but_still_a_record(self):
        signoff = next(r for r in DATA["rows"] if r["kind"] == "signoff")
        ev = {k: v for k, v in PASSING["evidence"].items() if k != "environment"}
        self.assertEqual(rr.row_errors({**signoff, "status": "PASS", "evidence": ev}, ROOT), [])
        self.assertTrue(rr.row_errors({**signoff, "status": "PASS", "evidence": {**ev, "record": ""}}, ROOT))

    def test_not_run_carries_no_evidence(self):
        self.assertTrue(rr.row_errors(self.row(status="NOT_RUN", evidence=PASSING["evidence"]), ROOT))


class BuildGate(unittest.TestCase):
    def build(self, files: dict) -> Path:
        d = Path(tempfile.mkdtemp())
        for name, text in files.items():
            (d / name).parent.mkdir(parents=True, exist_ok=True); (d / name).write_text(text, encoding="utf-8")
        return d

    def test_source_maps_and_size(self):
        ok = self.build({"index.html": "<html>", "assets/a.js": "console.log(1)"})
        self.assertEqual(rr.build_gate(ok, 10_000)["status"], "PASS")
        self.assertEqual(rr.build_gate(self.build({"index.html": "x", "assets/a.js.map": "{}"}), 10_000)["status"], "FAIL")
        self.assertEqual(rr.build_gate(self.build({"index.html": "x", "assets/a.js": "x\n//# sourceMappingURL=a.js.map"}), 10_000)["status"], "FAIL")
        self.assertEqual(rr.build_gate(ok, 5)["status"], "FAIL")
        self.assertEqual(rr.build_gate(self.build({"a.js": "x"}), 10_000)["status"], "FAIL")
        self.assertEqual(rr.build_gate(None, 10_000)["status"], "NOT_RUN")


class Verdict(unittest.TestCase):
    """R11-20: automated gates alone never make a release ready."""
    def run_with(self, rows_status: str):
        data = copy.deepcopy(DATA)
        for r in data["rows"]:
            r.update(PASSING if rows_status == "PASS" else {"status": "NOT_RUN", "evidence": None})
        passed = lambda gid: {"id": gid, "title": gid, "status": "PASS", "evidence": ["test"], "blocker": ""}  # noqa: E731
        with mock.patch.object(rr, "load_rows", return_value=(data, [])), \
             mock.patch.object(rr, "content_gate", return_value=passed("RG-CONTENT")), \
             mock.patch.object(rr, "claims_gate", return_value=passed("RG-CLAIMS")), \
             mock.patch.object(rr, "build_gate", return_value=passed("RG-BUILD")):
            return rr.evaluate(ROOT, True, Path("."))

    def test_green_automated_gates_with_unrun_human_rows_are_not_ready(self):
        gates, errs, verdict = self.run_with("NOT_RUN")
        self.assertEqual((errs, verdict), ([], "NOT_READY"))
        self.assertTrue(any(g["status"] == "BLOCKED" for g in gates))

    def test_ready_only_when_every_gate_in_scope_passes(self):
        gates, _, verdict = self.run_with("PASS")
        self.assertEqual(verdict, "READY")
        self.assertNotIn("A11Y-ANDROID-NATIVE", [g["id"] for g in gates])      # android rows are out of the web scope

    def test_today_the_repository_is_not_ready_and_strict_mode_fails(self):
        self.assertEqual(rr.evaluate(ROOT)[2], "NOT_READY")
        with mock.patch("builtins.print"):
            self.assertEqual(rr.main(["--strict"]), 1)
            self.assertEqual(rr.main([]), 0)


if __name__ == "__main__":
    unittest.main()
