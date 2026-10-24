import json,shutil,tempfile,unittest
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from validate_finnish_method_extension import ROOT,M,E,A,D,T,OTHER,verify

class ResearchIntegrity(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name)
        for path in [M,E,A,D,T,*OTHER]:
            to=self.root/path
            to.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(ROOT/path,to)
    def change_json(self,path,fn):
        target=self.root/path
        d=json.loads(target.read_text(encoding="utf8"))
        fn(d)
        target.write_text(json.dumps(d,ensure_ascii=False),encoding="utf8")
    def change_text(self,path,old,new):
        target=self.root/path
        s=target.read_text(encoding="utf8")
        self.assertIn(old,s)
        target.write_text(s.replace(old,new,1),encoding="utf8")
    def fail(self,keyword):
        problems=verify(self.root)
        self.assertTrue(any(keyword in x for x in problems),problems)
    def test_all_invariants(self):
        self.assertEqual(verify(self.root),[])
    def test_new_score_cannot_be_forged(self):
        self.change_json(M,lambda d:next(x for x in d["methods"] if x["id"]=="pragmatic-speech-acts").update(score=99))
        self.fail("Incorrect added expert product")
    def test_impact_score_cannot_be_forged(self):
        self.change_json(E,lambda d:next(x for x in d["ratings"] if x["id"]=="structured-input-grammar").update(learning_effectiveness_0_to_100=100))
        self.fail("Incorrect added expert impact")
    def test_source_must_exist(self):
        self.change_json(M,lambda d:d["source_register"].pop("pi-review26"))
        self.fail("Canonical 70 scored")
    def test_correct_review_authors(self):
        self.change_json(M,lambda d:d["source_register"]["pi-review26"].update(title="Benati 2026"))
        self.fail("Wrong authors")
    def test_product_table_tampering(self):
        self.change_text(A,"| **98** |","| **99** |")
        self.fail("Complete 70-entry product")
    def test_impact_table_tampering(self):
        self.change_text(D,"| **96** | 98 |","| **100** | 98 |")
        self.fail("Complete 70-entry learning")
    def test_report_must_have_negative_findings(self):
        self.change_text(T,"d=0.25","not reported")
        self.fail("Incomplete review")
    def test_report_links_must_match_verified_science(self):
        self.change_text(T,"https://doi.org/10.1093/applin/amac055","https://invalid.example")
        self.fail("Scientific source omitted")
    def test_index_link_unchanged(self):
        self.change_text(OTHER[0],"25-pragmatics-processing-notes-finnish-2026-10.md","lost-study.md")
        self.fail("New research not discoverable")

if __name__=="__main__":unittest.main()
