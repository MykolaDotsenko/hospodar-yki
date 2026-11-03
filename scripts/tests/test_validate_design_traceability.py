"""Regression cases: the design traceability matrix cannot claim coverage it does not have."""
from pathlib import Path
import copy
import json
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from validate_design_traceability import MATRIX, check  # noqa: E402

DOC = json.loads(MATRIX.read_text(encoding="utf-8"))


def find(doc, rid):
    return next(r for r in doc["requirements"] if r["id"] == rid)


class TraceabilityTests(unittest.TestCase):
    def setUp(self):
        self.doc = copy.deepcopy(DOC)

    def test_repository_matrix_passes(self):
        self.assertEqual(check(self.doc), [])

    def test_missing_requirement_fails(self):
        self.doc["requirements"] = [r for r in self.doc["requirements"] if r["id"] != "COLOR-02"]
        self.assertTrue(any("missing from the matrix" in e and "COLOR-02" in e for e in check(self.doc)))

    def test_invented_requirement_fails(self):
        self.doc["requirements"].append({"id": "COLOR-99", "source": self.doc["sources"][0], "summary": "x", "status": "NOT_YET", "plan": "x"})
        self.assertTrue(any("not defined in any source" in e for e in check(self.doc)))

    def test_enforced_without_evidence_fails(self):
        r = find(self.doc, "UIO-01"); r.pop("evidence")
        self.assertTrue(any("UIO-01: ENFORCED needs at least one evidence" in e for e in check(self.doc)))

    def test_evidence_pointing_to_a_test_that_does_not_exist_fails(self):
        find(self.doc, "UIO-01")["evidence"] = [{"file": "apps/web/e2e/focus.spec.ts", "contains": "a test nobody wrote"}]
        self.assertTrue(any("evidence text not found" in e for e in check(self.doc)))
        find(self.doc, "UIO-01")["evidence"] = [{"file": "apps/web/e2e/missing.spec.ts", "contains": "x"}]
        self.assertTrue(any("evidence file missing" in e for e in check(self.doc)))

    def test_not_yet_cannot_carry_evidence_and_needs_plan(self):
        r = find(self.doc, "UIO-02"); r["evidence"] = [{"file": "README.md", "contains": "Hospodar"}]
        self.assertTrue(any("must not list evidence" in e for e in check(self.doc)))
        r.pop("evidence"); r.pop("plan")
        self.assertTrue(any("UIO-02: NOT_YET needs a plan" in e for e in check(self.doc)))

    def test_partial_needs_gap_and_status_must_be_known(self):
        find(self.doc, "DESIGN-02").pop("gap")
        find(self.doc, "DESIGN-04")["status"] = "DONE"
        errors = check(self.doc)
        self.assertTrue(any("DESIGN-02: PARTIAL needs a gap" in e for e in errors))
        self.assertTrue(any("DESIGN-04: unknown status" in e for e in errors))

    def test_decisions_need_options_and_known_requirements(self):
        self.doc["decisions"][0]["options"] = ["only one"]
        self.doc["decisions"][1]["affects"] = ["NOPE-01"]
        self.doc["decisions"][2].update(status="DECIDED"); self.doc["decisions"][2].pop("decided", None)
        errors = check(self.doc)
        self.assertTrue(any("≥2 options" in e for e in errors))
        self.assertTrue(any("affects unknown requirement NOPE-01" in e for e in errors))
        self.assertTrue(any("DECIDED needs the chosen option" in e for e in errors))


if __name__ == "__main__":
    unittest.main()
