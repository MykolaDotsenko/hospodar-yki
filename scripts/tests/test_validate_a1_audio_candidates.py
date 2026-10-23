import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from validate_a1_audio_candidates import check,ROOT,SOURCE,LESSONS,AUDIO,AVAILABLE,PICTURES

class CandidateTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)
        for relative in (SOURCE,LESSONS,AUDIO,AVAILABLE,PICTURES):
            path=self.root/relative
            path.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(ROOT/relative,path)
    def change(self,relative,mutate):
        path=self.root/relative
        value=json.loads(path.read_text(encoding="utf8"))
        mutate(value)
        path.write_text(json.dumps(value,ensure_ascii=False),encoding="utf8")
    def test_sources_are_unique_and_source_only(self):
        self.assertEqual(check(self.root),[])
    def test_license_drift_is_caught(self):
        self.change(SOURCE,lambda x:x["open_licensed_downloads"][-1].update(license="all-rights-reserved"))
        self.assertTrue(any("licensing drift" in s for s in check(self.root)))
    def test_forged_audio_availability_rejected(self):
        self.change(SOURCE,lambda x:x["open_licensed_downloads"][-2].update(offline_ready=True))
        self.assertTrue(any("masquerades" in s for s in check(self.root)))
    def test_duplicate_page_rejected(self):
        self.change(SOURCE,lambda x:x["open_licensed_downloads"][-1].update(source_page=x["open_licensed_downloads"][-2]["source_page"]))
        self.assertTrue(any("Duplicate" in s for s in check(self.root)))
    def test_fake_official_score_rejected(self):
        self.change(LESSONS,lambda x:x["source_only_practice_drafts"][0].update(response_status="official_YKI"))
        self.assertTrue(any("Unsafe grading" in s for s in check(self.root)))
    def test_missing_transfer_caught(self):
        self.change(LESSONS,lambda x:x["source_only_practice_drafts"][2].update(transfer_prompt_fi=""))
        self.assertTrue(any("Missing task sequence" in s for s in check(self.root)))
    def test_fake_local_audio_entry_rejected(self):
        self.change(AUDIO,lambda x:x["entries"].append({"id":"ole_hyva_2026","path":"assets/audio/open/phrases/ole_hyva.ogg"}))
        self.assertTrue(any("referenced as actual local" in s for s in check(self.root)))

if __name__=="__main__":unittest.main()
