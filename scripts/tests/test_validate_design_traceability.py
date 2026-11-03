"""Regression cases: the design traceability matrix cannot claim coverage it does not have."""
from pathlib import Path
import copy
import json
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from validate_design_traceability import ID, MATRIX, check  # noqa: E402

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



class IdPatternTests(unittest.TestCase):
    def test_research_track_ids_do_not_swallow_gate_ids(self):
        text = "R11 gates R11-01…R11-20; R08-MOT; R03-E01; R4-14, R7-18, SD-G12 (SD-01 is a source row), MOT-07, MOT-E01, PSY-E01, QL-09"
        self.assertEqual(sorted(set(ID.findall(text))), sorted({"R11", "R11-01", "R11-20", "R08", "R03", "R4-14", "R7-18", "SD-G12", "MOT-07", "QL-09"}))

    def test_nested_acceptance_ids_are_not_split(self):
        text = "IV2-AC-01, IV-AC-15, IV2-12, IV-07, IV-REQ-05, AC-04–07, EXV-20, A11Y-03, UIE-01, VD-07"
        self.assertEqual(sorted(set(ID.findall(text))), sorted({"IV2-AC-01", "IV-AC-15", "IV2-12", "IV-07", "IV-REQ-05", "AC-04", "EXV-20", "A11Y-03"}))

    def test_short_architecture_ids_are_not_found_inside_longer_ones(self):
        text = "UC-01, AC-01, IV2-AC-01, C-05, REL-16, R11-S03 (an R11 source row, so only the track R11), E04-C1, UX-L02, UX-03, A10-14, A10-15, G-EX-04"
        self.assertEqual(sorted(set(ID.findall(text))), sorted({"UC-01", "AC-01", "IV2-AC-01", "C-05", "REL-16", "R11", "UX-L02", "UX-03", "A10-14", "G-EX-04"}))

    def test_exam_pillar_is_not_read_as_exam(self):
        text = "EXAM-PILLAR-04 and EXAM-04, YKI-FID-09, LEARN-12, LE-08, SAMPLE-01, MVP-04, PER-07"
        self.assertEqual(sorted(set(ID.findall(text))), sorted({"EXAM-PILLAR-04", "EXAM-04", "YKI-FID-09", "LEARN-12", "LE-08", "MVP-04", "PER-07"}))

if __name__ == "__main__":
    unittest.main()
