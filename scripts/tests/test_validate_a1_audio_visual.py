import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from validate_a1_audio_visual import check,ROOT,LESSONS

class AudioVisualTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)
        files=[LESSONS,"assets/audio/library.json","assets/audio/available.json","assets/images/pictures/available.json","assets/images/illustrations/library.json"]
        rows=json.loads((ROOT/LESSONS).read_text())["items"]
        audio={x["id"]:x for x in json.loads((ROOT/"assets/audio/library.json").read_text())["entries"]}
        pictures={x["id"]:x for x in json.loads((ROOT/"assets/images/pictures/available.json").read_text())["assets"]}
        svg={x["id"]:x for x in json.loads((ROOT/"assets/images/illustrations/library.json").read_text())["items"]}
        files+=list({audio[r["audio_id"]]["path"] for r in rows})
        files+=list({pictures[r["image_id"]]["path"] for r in rows})
        files+=list({svg[r["scaffold_illustration_id"]]["path"] for r in rows if r.get("scaffold_illustration_id")})
        for rel in files:
            dst=self.root/rel
            dst.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(ROOT/rel,dst)
    def change(self,f):
        path=self.root/LESSONS
        data=json.loads(path.read_text())
        f(data)
        path.write_text(json.dumps(data,ensure_ascii=False))
    def test_live_assets_resolve(self):
        self.assertEqual(check(self.root),[])
    def test_unknown_audio_rejected(self):
        self.change(lambda x:x["items"][0].update(audio_id="imaginary"))
        self.assertTrue(any("audio" in x.lower() for x in check(self.root)))
    def test_unknown_photo_rejected(self):
        self.change(lambda x:x["items"][0].update(image_id="imaginary"))
        self.assertTrue(any("photo" in x.lower() for x in check(self.root)))
    def test_no_fabricated_grades(self):
        self.change(lambda x:x["items"][0].update(response_status="official_YKI_score"))
        self.assertTrue(any("ungraded" in x.lower() for x in check(self.root)))
    def test_no_fabricated_srs(self):
        self.change(lambda x:x["items"][0].update(review_status="scheduled"))
        self.assertTrue(any("Delayed review" in x for x in check(self.root)))
    def test_missing_real_audio_rejected(self):
        (self.root/"assets/audio/open/listening/numerot_1_24.ogg").unlink()
        self.assertTrue(any("binary missing" in x for x in check(self.root)))
    def test_duplicate_rejected(self):
        self.change(lambda x:x["items"][1].update(lesson_id=x["items"][0]["lesson_id"]))
        self.assertTrue(any("Duplicate" in x for x in check(self.root)))

if __name__=="__main__":unittest.main()
