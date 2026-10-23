import json
import shutil
import tempfile
import unittest
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from validate_practical_s2_sources import issues,ROOT,CATALOG,PREVIOUS

class PracticalSources(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)
        for rel in (CATALOG,PREVIOUS):
            target=self.root/rel
            target.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(ROOT/rel,target)
    def mutate(self,fn):
        target=self.root/CATALOG
        data=json.loads(target.read_text(encoding="utf-8"))
        fn(data)
        target.write_text(json.dumps(data,ensure_ascii=False),encoding="utf-8")
    def test_valid_source_only_pedagogy(self):
        self.assertEqual(issues(self.root),[])
    def test_license_forgery_rejected(self):
        self.mutate(lambda d:d["external_sources"][0].update(licence="CC0"))
        self.assertTrue(any("Incorrect author or license" in x for x in issues(self.root)))
    def test_local_media_forgery_rejected(self):
        self.mutate(lambda d:d["items"][1].update(media_binaries_imported=5))
        self.assertTrue(any("Fake local media" in x for x in issues(self.root)))
    def test_false_publisher_audios_rejected(self):
        self.mutate(lambda d:d["external_sources"][1]["reported_components"].update(publisher_reported_count=30))
        self.assertTrue(any("30 lessons falsely" in x for x in issues(self.root)))
    def test_missing_transfer_is_rejected(self):
        self.mutate(lambda d:d["items"][4]["mission"].update(transfer_prompt_fi=""))
        self.assertTrue(any("Missing meaningful" in x for x in issues(self.root)))
    def test_unknown_mirror_host_rejected(self):
        self.mutate(lambda d:d["external_sources"][1].update(url="https://login.example.net/proxy"))
        self.assertTrue(any("Untrusted publisher" in x for x in issues(self.root)))
    def test_wrong_worksheet_type_rejected(self):
        self.mutate(lambda d:d["external_sources"][0]["reported_components"].update(type="audio"))
        self.assertTrue(any("PDF worksheets falsely" in x for x in issues(self.root)))
    def test_duplicate_mission_rejected(self):
        self.mutate(lambda d:d["items"][1].update(id=d["items"][0]["id"]))
        self.assertTrue(any("duplicate mission" in x.lower() or "new task count" in x for x in issues(self.root)))
    def test_fabricated_exam_key_rejected(self):
        self.mutate(lambda d:d["items"][7].update(answer_key=["sure"]))
        self.assertTrue(any("Unreviewed media/download/key" in x for x in issues(self.root)))

if __name__=="__main__":unittest.main()
