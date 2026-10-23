import json
import shutil
import tempfile
import unittest
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from validate_authentic_dialogue_sources import check,ROOT,SOURCE,OTHER

class ExternalDialogueSources(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)
        for path in (SOURCE,OTHER):
            f=self.root/path
            f.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(ROOT/path,f)
    def update(self,fn):
        f=self.root/SOURCE
        data=json.loads(f.read_text(encoding="utf8"))
        fn(data)
        f.write_text(json.dumps(data,ensure_ascii=False),encoding="utf8")
    def test_real_sources(self):
        self.assertEqual(check(self.root),[])
    def test_fabricated_local_file(self):
        self.update(lambda d:d["items"][0].update(media_binaries_imported=6))
        self.assertTrue(any("Unsupported offline" in p for p in check(self.root)))
    def test_nd_cannot_become_available_offline(self):
        self.update(lambda d:d["items"][2].update(access="offline"))
        self.assertTrue(any("Unsupported offline" in p for p in check(self.root)))
    def test_external_url_restricted(self):
        self.update(lambda d:d["items"][0].update(source_page="https://evil.example/data.mp3"))
        self.assertTrue(any("Untrusted publisher" in p for p in check(self.root)))
    def test_spurious_graded_exam(self):
        self.update(lambda d:d["items"][1].update(graded=True))
        self.assertTrue(any("Unsupported offline" in p for p in check(self.root)))
    def test_text_not_promoted_to_audio(self):
        self.update(lambda d:d["items"][5]["reported_components"].update(type="audio"))
        self.assertTrue(any("Misreported source type" in p for p in check(self.root)))
    def test_missing_independent_attempt(self):
        self.update(lambda d:d["items"][3]["mission"].update(independent_prompt_fi=""))
        self.assertTrue(any("Missing meaningful stage" in p for p in check(self.root)))
    def test_hidden_source_duplicate(self):
        self.update(lambda d:d["items"][4].update(source_page=d["items"][3]["source_page"]))
        self.assertTrue(any("Duplicate page" in p for p in check(self.root)))

if __name__=="__main__":unittest.main()
