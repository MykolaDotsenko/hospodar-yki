import json,shutil,tempfile,unittest
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from validate_finnish_2026_followup import ROOT,M,E,REPORT,INDEX,DOC,audit

class FollowupIntegrity(unittest.TestCase):
 def setUp(self):
    self.tmp=tempfile.TemporaryDirectory()
    self.addCleanup(self.tmp.cleanup)
    self.root=Path(self.tmp.name)
    for path in (M,E,REPORT,INDEX,DOC):
      target=self.root/path
      target.parent.mkdir(parents=True,exist_ok=True)
      shutil.copy2(ROOT/path,target)
 def change(self,path,edit):
    target=self.root/path
    if path.endswith(".json"):
      v=json.loads(target.read_text(encoding="utf8"))
      edit(v)
      target.write_text(json.dumps(v,ensure_ascii=False),encoding="utf8")
    else:
      s=target.read_text(encoding="utf8")
      target.write_text(edit(s),encoding="utf8")
 def fail(self,reason):
    errors=audit(self.root)
    self.assertTrue(any(reason in x for x in errors),errors)
 def test_valid(self):
    self.assertEqual(audit(self.root),[])
 def test_source_doi_guard(self):
    self.change(M,lambda d:d["source_register"]["pi-online-rct26"].update(url="https://example.org/fake"))
    self.fail("Incorrect verified DOI")
 def test_false_audio_grammar_score_guard(self):
    self.change(M,lambda d:next(x for x in d["methods"] if x["id"]=="structured-input-grammar").update(score=99))
    self.fail("Fabricated/overwritten")
 def test_ai_impact_score_guard(self):
    self.change(E,lambda d:next(x for x in d["ratings"] if x["id"]=="hybrid-ai-teacher-loop").update(learning_effectiveness_0_to_100=96))
    self.fail("Fabricated/overwritten")
 def test_data_provenance_link(self):
    self.change(E,lambda d:next(x for x in d["ratings"] if x["id"]=="human-anchor-calibration")["source_ids"].remove("ai-human-comparison25"))
    self.fail("Source not linked")
 def test_keep_nonsignificant_PI_SI(self):
    self.change(REPORT,lambda s:s.replace("не була статистично значущою","доведено величезну перевагу"))
    self.fail("epistemic caution")
 def test_source_no_duplication(self):
    self.change(M,lambda d:d["source_register"]["ai-human-comparison25"].update(url=d["source_register"]["ai-aif-writing26"]["url"]))
    self.fail("Scholarly source duplicate URL")
 def test_learner_docs_indexed(self):
    self.change(INDEX,lambda s:s.replace("25-pragmatics-processing-notes-finnish-2026-10.md","untracked-topic.md"))
    self.fail("not accessible")
 def test_anti_YKI_grade(self):
    self.change(E,lambda d:next(x for x in d["ratings"] if x["id"]=="structured-input-grammar").update(not_yki_pass_probability=False))
    self.fail("False YKI")
if __name__=="__main__":unittest.main()
