import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from validate_visual_assets import check,ROOT

class VisualAssetTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name)
        for globpath in ("assets/images/illustrations/*.svg","assets/images/illustrations/library.json","assets/images/pictures/sources.json","learning/exercises/a1/image-led/lessons.json"):
            for p in ROOT.glob(globpath):
                target=self.root/p.relative_to(ROOT)
                target.parent.mkdir(parents=True,exist_ok=True)
                shutil.copy2(p,target)
    def test_five_real_svg_and_allowlist_valid(self):
        self.assertEqual(check(self.root),[])
    def test_photo_source_is_not_photo_binary(self):
        self.assertTrue(any("not all" in e.lower() or "missing" in e.lower()
                            for e in check(self.root,require_pictures=True)))
    def test_orphan_svg_detected(self):
        p=self.root/"assets/images/illustrations/unowned.svg"
        p.write_text("<svg/>")
        self.assertTrue(any("Unlisted" in e for e in check(self.root)))
    def test_missing_alt_detected(self):
        p=self.root/"assets/images/illustrations/library.json"
        x=json.loads(p.read_text())
        x["items"][0]["alt_fi"]=""
        p.write_text(json.dumps(x))
        self.assertTrue(any("description" in e for e in check(self.root)))
    def test_ungraded_picture_mission_cannot_reference_unknown_image(self):
        p=self.root/"learning/exercises/a1/image-led/lessons.json"
        data=json.loads(p.read_text())
        data["items"][0]["image_id"]="not-existing"
        p.write_text(json.dumps(data))
        self.assertTrue(any("unknown source ID" in e for e in check(self.root)))
    def test_svg_script_is_rejected(self):
        p=self.root/"assets/images/illustrations/clock-15-30.svg"
        text=p.read_text()
        p.write_text(text.replace("</svg>","<script>alert(1)</script></svg>"))
        self.assertTrue(any("Untrusted SVG" in e for e in check(self.root)))

if __name__=="__main__":
    unittest.main()
