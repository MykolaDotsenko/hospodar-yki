import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {join,dirname,resolve} from "node:path";
import {validateR08Task,createR08Trial,advanceR08,r08View,R08_GRAMMAR_STATUS} from "../r08-grammar-core.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const bank=JSON.parse(readFileSync(join(root,"learning/exercises/b1/grammar/r08-meaning-stems-original-drafts.json"),"utf8"));
const approve=(it=bank.exercises[0])=>({...it,review_status:"approved_S2",answerKeyReviewed:true});
const action=(s,t,type,rest={})=>advanceR08(s,t,{type,...rest});
test("new 14 original items have stable unique IDs and are DRAFT, not active user assets",()=>{
  assert.equal(bank.count,14);
  assert.equal(bank.exercises.length,14);
  assert.equal(new Set(bank.exercises.map(x=>x.id)).size,14);
  assert.equal(bank.review_status,"editorial_draft_pending_S2_review");
  assert.match(R08_GRAMMAR_STATUS,/NOT_ACTIVE_APP/);
  for(const t of bank.exercises){
    assert.equal(validateR08Task(t),true);
    assert.equal(t.review_status,"editorial_draft_pending_S2_review");
    assert.equal(t.answerKeyReviewed,false);
    assert.equal(t.is_official_exam_content,false);
    assert.throws(()=>createR08Trial(t),/S2-approved/);
  }
});
test("explicit approved-only local LEARN mode and rejection of hidden exam items",()=>{
  const t=approve();
  assert.equal(validateR08Task(t,{requireApproved:true}),true);
  assert.throws(()=>createR08Trial(t,"EXAM"));
  assert.throws(()=>createR08Trial({...t,heldOut:true}));
  assert.throws(()=>createR08Trial({...t,examOnly:true}));
  assert.throws(()=>createR08Trial({...t,review_status:"editorial_draft_pending_S2_review"}));
  assert.throws(()=>createR08Trial({...t,origin:"external_unlicensed"}));
});
test("semantic stage hides correct option and answer key before first response",()=>{
  const t=approve(),s=createR08Trial(t);
  const v=r08View(s,t);
  assert.equal(v.phase,"meaning");
  assert.equal(v.semanticQuestionUk,t.semantic_question_uk);
  assert.ok(v.options.includes(t.semantic_relation));
  assert.ok(!JSON.stringify(v).includes(t.answer_fi));
  assert.ok(!Object.prototype.hasOwnProperty.call(v,"correctAnswer"));
  assert.equal(v.noAudioAutoplay,true);
});
test("meaning first; form answer separate, feedback only after first independent response",()=>{
  const t=approve();
  const s0=createR08Trial(t);
  const s1=action(s0,t,"CHOOSE_MEANING",{choice:"location"});
  assert.equal(s1.firstMeaning.correct,true);
  assert.equal(s1.phase,"form");
  assert.ok(!JSON.stringify(r08View(s1,t)).includes(t.answer_fi));
  const s2=action(s1,t,"SUBMIT_FORM",{answer:"KAUPASSA"});
  assert.equal(s2.firstForm.correct,true);
  assert.equal(s2.firstMeaning.correct,true);
  assert.equal(s2.formEvidence,"formative_independent_objective_only");
  assert.equal(r08View(s2,t).answerFi,t.answer_fi);
});
test("wrong semantic selection does not get magically repaired by right form",()=>{
  const t=approve(),wrong=t.semantic_options.find(c=>c!==t.semantic_relation);
  const s=action(createR08Trial(t),t,"CHOOSE_MEANING",{choice:wrong});
  const a=action(s,t,"SUBMIT_FORM",{answer:t.answer_fi});
  assert.equal(a.feedback.meaningCorrect,false);
  assert.equal(a.feedback.formCorrect,true);
});
test("only editor-tagged specific wrong form receives cause; otherwise unclassified",()=>{
  const t=approve();
  const before=action(createR08Trial(t),t,"CHOOSE_MEANING",{choice:t.semantic_relation});
  const known=action(before,t,"SUBMIT_FORM",{answer:"kaupasta"});
  assert.equal(known.feedback.editorialErrorFamily,"case_selection");
  const unknown=action(before,t,"SUBMIT_FORM",{answer:"kauppe"});
  assert.equal(unknown.feedback.editorialErrorFamily,"unclassified");
});
test("Finnish diacritics and consonant changes are meaningful, never generic suffix guessing",()=>{
  const t=approve(bank.exercises[3]),s=action(createR08Trial(t),t,"CHOOSE_MEANING",{choice:"location"});
  assert.equal(t.lemma_fi,"käsi");
  assert.equal(t.answer_fi,"kädessä");
  assert.equal(action(s,t,"SUBMIT_FORM",{answer:"kädessä"}).firstForm.correct,true);
  const error=action(s,t,"SUBMIT_FORM",{answer:"käsessä"});
  assert.equal(error.firstForm.correct,false);
  assert.equal(error.feedback.editorialErrorFamily,"stem_allomorphy");
});
test("meaning support marks evidence assisted, not a proven wrong answer",()=>{
  const t=approve();
  const hinted=action(createR08Trial(t),t,"REQUEST_HELP",{kind:"meaning"});
  const selected=action(hinted,t,"CHOOSE_MEANING",{choice:t.semantic_relation});
  const answered=action(selected,t,"SUBMIT_FORM",{answer:t.answer_fi});
  assert.equal(answered.firstMeaning.correct,null);
  assert.equal(answered.firstForm.correct,null);
  assert.equal(answered.formEvidence,"supported_ungraded");
});
test("form support marks assessment evidence assisted; never lower aptitude",()=>{
  const t=approve();
  const selected=action(createR08Trial(t),t,"CHOOSE_MEANING",{choice:t.semantic_relation});
  const hinted=action(selected,t,"REQUEST_HELP",{kind:"form"});
  const submitted=action(hinted,t,"SUBMIT_FORM",{answer:t.answer_fi});
  assert.equal(submitted.firstMeaning.correct,true);
  assert.equal(submitted.firstForm.correct,null);
  assert.equal(submitted.formEvidence,"supported_ungraded");
});
test("repair is separately ungraded, never overwrites first independent mistake",()=>{
  const t=approve();
  const s=action(createR08Trial(t),t,"CHOOSE_MEANING",{choice:t.semantic_relation});
  const bad=action(s,t,"SUBMIT_FORM",{answer:"kaupasta"});
  const repaired=action(bad,t,"SUBMIT_REPAIR",{answer:t.answer_fi});
  assert.equal(repaired.firstForm.correct,false);
  assert.equal(repaired.repair.status,"guided_ungraded");
  assert.equal(repaired.phase,"transfer");
});
test("novel scenario is displayed without original key or visual assistance",()=>{
  const t=approve();
  let s=createR08Trial(t);
  s=action(s,t,"CHOOSE_MEANING",{choice:t.semantic_relation});
  s=action(s,t,"SUBMIT_FORM",{answer:t.answer_fi});
  s=action(s,t,"SKIP_REPAIR");
  const v=r08View(s,t);
  assert.equal(v.phase,"transfer");
  assert.equal(v.transferPromptFi,t.transfer_prompt_fi);
  assert.equal(v.noHints,true);
  assert.ok(!JSON.stringify(v).includes(t.answer_fi));
  const done=action(s,t,"SUBMIT_TRANSFER",{answer:"Odotan asemalla."});
  assert.equal(done.transfer.status,"ungraded_new_context");
  assert.equal(done.transfer.independent,true);
  assert.equal(r08View(done,t).noOfficialYkiGrade,true);
});
test("safety: no guided feedback before meaningful choice and nonempty form",()=>{
  const t=approve(),start=createR08Trial(t);
  assert.throws(()=>action(start,t,"SUBMIT_FORM",{answer:t.answer_fi}),/not permitted/);
  assert.throws(()=>action(start,t,"CHOOSE_MEANING",{choice:"magic"}),/Semantic option/);
  const chosen=action(start,t,"CHOOSE_MEANING",{choice:t.semantic_relation});
  assert.throws(()=>action(chosen,t,"SUBMIT_FORM",{answer:" "}),/needs a Finnish/);
  assert.throws(()=>action(chosen,t,"SUBMIT_REPAIR",{answer:t.answer_fi}),/not permitted/);
});
test("no fake accepted case variants can enter task via unsupported mode or malformed metadata",()=>{
  const t=approve();
  assert.equal(validateR08Task({...t,semantic_relation:"fake"}),false);
  assert.equal(validateR08Task({...t,semantic_options:["location","location"]}),false);
  assert.equal(validateR08Task({...t,answerKeyReviewed:false}),false);
  assert.equal(validateR08Task({...t,mode:"EXAM"}),false);
  assert.equal(validateR08Task({...t,stem_transparency:"guess"}),false);
});
test("all draft prompts have distinct transfer situations and teacher-gated keys",()=>{
  for(const t of bank.exercises){
    assert.notEqual(t.prompt_fi,t.transfer_prompt_fi);
    assert.equal(t.known_wrong_forms?.some(w=>w.form===t.answer_fi)??false,false);
    assert.equal(validateR08Task(t),true);
  }
});
test("immutable state and deterministic transitions given same local input",()=>{
  const t=approve();
  const s=createR08Trial(t),s1=action(s,t,"CHOOSE_MEANING",{choice:t.semantic_relation});
  const s2=action(s,t,"CHOOSE_MEANING",{choice:t.semantic_relation});
  assert.deepEqual(s1,s2);
  assert.equal(s.phase,"meaning");
  assert.equal(Object.isFrozen(s1),true);
});
test("task ID mismatch cannot display another task answer, nor progress on stale session",()=>{
  const t=approve(),s=createR08Trial(t);
  const other=approve(bank.exercises[1]);
  assert.throws(()=>r08View(s,other),/Invalid R08/);
  assert.throws(()=>advanceR08(s,other,{type:"CHOOSE_MEANING",choice:"toward"}),/Invalid R08/);
});
