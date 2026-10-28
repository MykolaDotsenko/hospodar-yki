import test from "node:test";
import assert from "node:assert/strict";
import {createR07Session,transitionR07,r07View,R07_STATUS} from "../r07-interaction-core.mjs";
const task=(skill="listening",more={})=>({
  id:"r07-house-1",skill,reviewStatus:"s2_approved",redistributionCleared:true,
  audioAvailable:true,answerKeyApproved:true,answer_fi:"torstaina",
  prompt_fi:"Milloin huoltaja tulee?",transfer_prompt_fi:"Milloin sähköasentaja voi tulla?",
  caption_fi:"Huoltaja tulee torstaina.",meaning_uk:"Вибери день",
  feedback_uk:"Пояснення про huoltaja",...more
});
const start=t=>transitionR07(createR07Session(t),t,{type:"START"});
const act=(s,t,type,props={})=>transitionR07(s,t,{type,...props});
test("isolated prototype is not active UI, not a real exam scorer",()=>{
  assert.equal(R07_STATUS,"REFERENCE_ONLY_NOT_ACTIVE_UI");
  assert.throws(()=>createR07Session(task(),"EXAM"),/Only approved/);
});
test("unreviewed, nonredistributable, held-out and exam-only content fail closed",()=>{
  for(const diff of [{reviewStatus:"draft"},{redistributionCleared:false},
    {examOnly:true},{heldOut:true},{audioAvailable:false},{transfer_prompt_fi:"Milloin huoltaja tulee?"}]){
    assert.throws(()=>createR07Session(task("listening",diff)),/Only approved/);
  }
});
test("no autoplay: Finnish audio user-started; answer and caption sealed before independent answer",()=>{
  const t=task(),s=start(t),view=r07View(s,t);
  assert.equal(view.canPlayAudio,true);
  assert.equal(view.showCaption,false);
  assert.equal(view.caption_fi,null);
  assert.equal(view.answer_fi,null);
  assert.equal(view.feedback_uk,null);
  assert.equal(s.audioStarts,0);
  assert.deepEqual(Object.keys(view).filter(k=>/key|correct|exam/i.test(k)),[]);
});
test("listening must be started or accessible transcript requested before answer",()=>{
  const t=task(),s=start(t);
  assert.throws(()=>act(s,t,"SUBMIT_FIRST",{answer:"torstaina"}),/Start Finnish audio/);
  const heard=act(s,t,"PLAY_FINNISH_AUDIO");
  assert.equal(heard.audioStarts,1);
  const answered=act(heard,t,"SUBMIT_FIRST",{answer:"torstaina"});
  assert.equal(answered.firstResponse.independent,true);
  assert.equal(answered.firstResponse.correct,true);
  assert.equal(answered.firstResponse.evidenceKind,"objective_scored");
  assert.equal(r07View(answered,t).answer_fi,"torstaina");
});
test("meaning/caption access never penalized, but evidence accurately marked assisted ungraded",()=>{
  const t=task(),s=act(start(t),t,"REQUEST_SUPPORT",{support:"transcript"});
  assert.equal(r07View(s,t).caption_fi,t.caption_fi);
  const answered=act(s,t,"SUBMIT_FIRST",{answer:"torstaina"});
  assert.equal(answered.firstResponse.independent,false);
  assert.equal(answered.firstResponse.evidenceKind,"ungraded");
  assert.equal(answered.firstResponse.correct,null);
});
test("writing and speaking are always ungraded even if a fake answer key is supplied",()=>{
  for(const skill of ["writing","speaking"]){
    const t=task(skill),s=start(t),answer=act(s,t,"SUBMIT_FIRST",{answer:"torstaina"});
    assert.equal(answer.firstResponse.correct,null);
    assert.equal(answer.firstResponse.evidenceKind,"ungraded");
    assert.equal(r07View(answer,t).answer_fi,null);
  }
});
test("reading answer comparison preserves Finnish diacritics",()=>{
  const t=task("reading",{answer_fi:"äiti"}),s=start(t);
  const wrong=act(s,t,"SUBMIT_FIRST",{answer:"aiti"});
  assert.equal(wrong.firstResponse.correct,false);
  assert.equal(wrong.feedbackStatus,"needs_repair");
});
test("cannot reveal feedback before first nonempty independent response",()=>{
  const t=task("reading"),s=start(t);
  assert.throws(()=>act(s,t,"BEGIN_REPAIR"),/not allowed/);
  assert.throws(()=>act(s,t,"SUBMIT_FIRST",{answer:"  "}),/Non-empty/);
  assert.equal(r07View(s,t).answer_fi,null);
});
test("guided self-repair never overwrites initial independent failure",()=>{
  const t=task("reading");
  const failed=act(start(t),t,"SUBMIT_FIRST",{answer:"maanantaina"});
  assert.equal(failed.firstResponse.correct,false);
  const repair=act(failed,t,"BEGIN_REPAIR");
  const fixed=act(repair,t,"SUBMIT_REPAIR",{answer:"torstaina"});
  assert.equal(fixed.firstResponse.correct,false);
  assert.equal(fixed.phase,"transfer");
});
test("new situation transfer has no old key or hint in UI",()=>{
  const t=task(),s0=act(start(t),t,"PLAY_FINNISH_AUDIO");
  const first=act(s0,t,"SUBMIT_FIRST",{answer:"torstaina"});
  const transfer=act(first,t,"SKIP_REPAIR"),v=r07View(transfer,t);
  assert.equal(transfer.phase,"transfer");
  assert.equal(v.answer_fi,null);
  assert.equal(v.caption_fi,null);
  assert.equal(v.feedback_uk,null);
  assert.equal(v.prompt_fi,null);
  assert.equal(v.transfer_prompt_fi,"Milloin sähköasentaja voi tulla?");
  const done=act(transfer,t,"SUBMIT_TRANSFER",{answer:"perjantaina"});
  assert.equal(done.transferResponse.evidenceKind,"ungraded");
  assert.equal(done.phase,"done");
});
test("no sounds or required animations under any settings",()=>{
  const t=task(),s=createR07Session(t,"LEARN",{reducedMotion:true,soundEffects:true});
  assert.equal(s.soundEffects,false);
  assert.equal(r07View(s,t).reducedMotion,true);
  assert.equal(r07View(s,t).soundEffectsEnabled,false);
});
test("illegal transitions rejected and original session remains immutable",()=>{
  const t=task(),s=start(t);
  assert.throws(()=>act(s,t,"SUBMIT_REPAIR",{answer:"x"}),/not allowed/);
  assert.throws(()=>act(s,t,"REQUEST_SUPPORT",{support:"answer"}),/not allowed/);
  assert.equal(s.phase,"independent");
});
test("you cannot render a different task through an existing session",()=>{
  const t=task("reading"),s=start(t);
  assert.throws(()=>r07View(s,task("reading",{id:"different"})),/Invalid R07/);
});
test("deterministic response handling with no DOM/browser/storage",()=>{
  const t=task("reading"),s=start(t);
  assert.deepEqual(act(s,t,"SUBMIT_FIRST",{answer:"Torstaina"}),act(s,t,"SUBMIT_FIRST",{answer:"Torstaina"}));
});

test("unapproved reading answer key never leaks and does not score",()=>{
  const t=task("reading",{answerKeyApproved:false});
  const s=act(start(t),t,"SUBMIT_FIRST",{answer:"torstaina"});
  assert.equal(s.firstResponse.evidenceKind,"ungraded");
  assert.equal(r07View(s,t).answer_fi,null);
});
