import json
import pathlib
import shutil
import sys
import tempfile
import unittest

sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]))
from validate_curriculum_coverage import validate, ROOT


class CurriculumCoverageTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = pathlib.Path(self.tmp.name)
        for file in (
            "learning/curriculum/levels-a1.3-b2.1.json",
            "learning/exercises/grammar/tenses/lessons.json",
            "learning/exercises/grammar/time-and-clock/lessons.json",
            "learning/curriculum/README.md",
            "learning/exercises/grammar/tenses/README.md",
            "learning/exercises/grammar/time-and-clock/README.md",
            "assets/images/illustrations/README.md",
            "assets/images/pictures/README.md",
        ):
            dest = self.root / file
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(ROOT / file, dest)

    def test_normal_curriculum(self):
        self.assertEqual(validate(self.root), [])

    def test_cannot_silently_drop_A1_3(self):
        file = self.root/"learning/curriculum/levels-a1.3-b2.1.json"
        data = json.loads(file.read_text())
        data["levels"] = data["levels"][1:]
        file.write_text(json.dumps(data))
        self.assertTrue(any("A1.3" in x for x in validate(self.root)))

    def test_missing_image_owner(self):
        (self.root/"assets/images/pictures/README.md").unlink()
        self.assertTrue(any("visual asset" in x for x in validate(self.root)))

    def test_wrong_grammar_key_rejected(self):
        file = self.root/"learning/exercises/grammar/tenses/lessons.json"
        data = json.loads(file.read_text())
        data["exercises"][0]["answer"] = "nonexistent"
        file.write_text(json.dumps(data))
        self.assertTrue(any("alignment" in x for x in validate(self.root)))

    def test_open_transfer_cannot_claim_grade(self):
        file = self.root/"learning/exercises/grammar/tenses/lessons.json"
        data = json.loads(file.read_text())
        data["exercises"][-1]["assessment_status"] = "B2"
        file.write_text(json.dumps(data))
        self.assertTrue(any("cannot be graded" in x for x in validate(self.root)))


if __name__=="__main__":
    unittest.main()
