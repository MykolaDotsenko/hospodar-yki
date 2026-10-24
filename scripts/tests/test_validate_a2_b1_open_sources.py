import json
import shutil
import tempfile
import unittest
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from validate_a2_b1_open_sources import ROOT,CATALOG,PREVIOUS,check

class SourceIntegrity(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name)
        for p in [CATALOG,*PREVIOUS]:
            target=self.root/p
            target.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(ROOT/p,target)
    def edit(self,mutator):
        f=self.root/CATALOG
        data=json.loads(f.read_text(encoding="utf-8"))
        mutator(data)
        f.write_text(json.dumps(data,ensure_ascii=False),encoding="utf-8")
    def assertFailure(self,mutator,phrase):
        self.edit(mutator)
        errors=check(self.root)
        self.assertTrue(any(phrase in x for x in errors), errors)
    def test_original_pack(self):
        self.assertEqual(check(self.root),[])
    def test_rights_violation(self):
        self.assertFailure(lambda d:d["sources"][1].update(license="CC0"),"License/rights")
    def test_older_vierko_license_not_ignored(self):
        self.assertFailure(lambda d:d.update(license_caveat="All files completely open."),"license discrepancy")
    def test_no_false_audio_for_text_only_grammar(self):
        self.assertFailure(lambda d:d["items"][4]["reported_components"].update(type="audio"),"Fictitious publisher audio")
    def test_no_imported_binaries(self):
        self.assertFailure(lambda d:d["items"][0].update(media_binaries_imported=5),"Fabricated offline")
    def test_no_unverified_yki_grades(self):
        self.assertFailure(lambda d:d["items"][3].update(graded=True),"Fabricated offline")
    def test_no_mirrored_host(self):
        self.assertFailure(lambda d:d["sources"][1].update(url="https://aoe.fi.bad-host.test/materiaali/5839"),"Unsafe or noncanonical")
    def test_teacher_review_not_faked(self):
        self.assertFailure(lambda d:d["items"][5].update(teaching_review="reviewed"),"Fabricated offline")
    def test_collision_with_previous_wave(self):
        self.assertFailure(lambda d:d["items"][0].update(id="oph-health-doctor"),"Task duplicate")
    def test_mission_missing_delayed_recall(self):
        self.assertFailure(lambda d:d["items"][7]["mission"].update(delayed_recall_prompt_fi=""),"Missing independent")
    def test_no_premature_copied_answers(self):
        self.assertFailure(lambda d:d["items"][6].update(answer_key="yes"),"Unlicensed file")
if __name__=="__main__":unittest.main()
