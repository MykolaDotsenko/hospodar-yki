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
    def test_real_svg_and_eight_photo_sources_valid(self):
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
    def test_all_new_photo_ids_have_ungraded_lessons(self):
        data=json.loads((self.root/"assets/images/pictures/sources.json").read_text())
        lessons=json.loads((self.root/"learning/exercises/a1/image-led/lessons.json").read_text())
        self.assertEqual(len(data["items"]),8)
        self.assertEqual(len(lessons["items"]),8)
        self.assertEqual(set(x["id"] for x in data["items"]),
                         set(x["image_id"] for x in lessons["items"]))
        self.assertTrue(all(x["response_status"]=="ungraded" for x in lessons["items"]))

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

    def test_photo_license_cannot_be_silently_changed(self):
        path=self.root/"assets/images/pictures/sources.json"
        data=json.loads(path.read_text())
        data["items"][4]["license"]="all-rights-reserved"
        path.write_text(json.dumps(data))
        self.assertTrue(any("license" in e.lower() for e in check(self.root)))

    def test_image_missions_never_auto_grade_speaking(self):
        path=self.root/"learning/exercises/a1/image-led/lessons.json"
        data=json.loads(path.read_text())
        data["items"][7]["response_status"]="official_YKI_B1"
        path.write_text(json.dumps(data))
        self.assertTrue(any("assessment" in e.lower() for e in check(self.root)))

if __name__=="__main__":
    unittest.main()
