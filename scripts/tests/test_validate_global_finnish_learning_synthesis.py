import json
import shutil
import tempfile
import unittest
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from validate_global_finnish_learning_synthesis import ROOT, METHODS, RATINGS, REPORT, INDEX, STUDY, audit

RELATED=["research/pedagogy/08-learning-methods-evidence-2026-10.md",
         "research/pedagogy/12-finnish-yki-learning-effectiveness-2026-10.md"]

class RatingAndScienceSynthesis(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name)
        for p in [METHODS,RATINGS,REPORT,INDEX,STUDY,*RELATED]:
            target=self.root/p
            target.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(ROOT/p,target)
    def mutate_json(self,path,fn):
        f=self.root/path
        d=json.loads(f.read_text(encoding="utf-8"))
        fn(d)
        f.write_text(json.dumps(d,ensure_ascii=False),encoding="utf-8")
    def mutate_md(self,path,find,replace):
        f=self.root/path
        c=f.read_text(encoding="utf-8")
        self.assertIn(find,c)
        f.write_text(c.replace(find,replace,1),encoding="utf-8")
    def must_fail(self,needle):
        result=audit(self.root)
        self.assertTrue(any(needle in x for x in result),result)
    def test_synthesis_is_consistent(self):
        self.assertEqual(audit(self.root),[])
    def test_cannot_invent_scientific_95_100_ranking(self):
        self.mutate_md(REPORT,"| \`task-based\` | **97** | **93** |","| \`task-based\` | **99** | **99** |")
        self.must_fail("mismatches canonical")
    def test_new_l2_meta_source_cannot_disappear(self):
        self.mutate_json(METHODS,lambda d:d["source_register"].pop("extensive2025"))
        self.must_fail("baseline drifted")
    def test_method_and_effectiveness_citations_must_agree(self):
        self.mutate_json(RATINGS,lambda d:next(x for x in d["ratings"] if x["id"]=="extensive-reading")["source_ids"].remove("extensive2025"))
        self.must_fail("BOTH canonical")
    def test_misinformation_in_negative_table_fails(self):
        self.mutate_md(REPORT,"| \`instant-answer\` —", "| \`instant-answer-fake\` —")
        self.must_fail("Invented second-registry")
    def test_study_link_must_be_indexed(self):
        self.mutate_md(INDEX,"24-global-best-methods-finnish-2026-10.md","lost-research-2026.md")
        self.must_fail("not discoverable")
    def test_scientific_source_should_not_be_replaced(self):
        self.mutate_md(REPORT,"10.1016/j.jslw.2025.101255","bad-source-2025")
        self.must_fail("Missing critical primary")
if __name__=="__main__":unittest.main()
