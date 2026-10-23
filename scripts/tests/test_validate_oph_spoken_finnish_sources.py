import json
import shutil
import tempfile
import unittest
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from validate_oph_spoken_finnish_sources import ROOT,CATALOG,PRIOR_AUDIO,PRIOR_PRACTICE,check

class NewOphSourceTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name)
        for path in [CATALOG,PRIOR_AUDIO,PRIOR_PRACTICE]:
            target=self.root/path
            target.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(ROOT/path,target)
    def update(self,fn):
        path=self.root/CATALOG
        data=json.loads(path.read_text(encoding="utf8"))
        fn(data)
        path.write_text(json.dumps(data,ensure_ascii=False),encoding="utf8")
    def test_good_data(self):
        self.assertEqual(check(self.root),[])
    def test_unverified_audio_count(self):
        self.update(lambda x:x["items"][0]["reported_components"].update(publisher_reported_count=10))
        self.assertTrue(any("Unverified track" in x for x in check(self.root)))
    def test_licensing_cannot_be_upgraded_to_cc(self):
        self.update(lambda x:x["sources"][0].update(license="CC BY 4.0"))
        self.assertTrue(any("copyright" in x for x in check(self.root)))
    def test_teacher_page_leak_blocked(self):
        self.update(lambda x:x["items"][0].update(first_attempt_url_policy="chapter_always"))
        self.assertTrue(any("answer key leaked" in x for x in check(self.root)))
    def test_forged_local_asset(self):
        self.update(lambda x:x["items"][0].update(media_binaries_imported=1))
        self.assertTrue(any("False media" in x for x in check(self.root)))
    def test_external_host_spoof(self):
        self.update(lambda x:x["sources"][1].update(audio_playlist_url="https://www.oph.fi.attacker.example/fi/oppimateriaali/"))
        self.assertTrue(any("Unapproved publisher" in x for x in check(self.root)))
    def test_repeated_id(self):
        self.update(lambda x:x["items"][1].update(id=x["items"][0]["id"]))
        self.assertTrue(any("identity collision" in x for x in check(self.root)))
    def test_missing_transfer(self):
        self.update(lambda x:x["items"][2]["mission"].update(transfer_prompt_fi=""))
        self.assertTrue(any("Missing independent" in x for x in check(self.root)))
    def test_forged_answer_key(self):
        self.update(lambda x:x["items"][3].update(answer_key=["I guessed"]))
        self.assertTrue(any("Unverified answer/media leak" in x for x in check(self.root)))
if __name__=="__main__":unittest.main()
