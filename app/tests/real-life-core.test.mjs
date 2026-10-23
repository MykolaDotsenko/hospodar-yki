import test from "node:test";
import assert from "node:assert/strict";
import {newSession,visibleStage,submitStage} from "../real-life-core.mjs";

const lesson={first_task_fi:"Independent",repair_task_fi:"Repair",transfer_task_fi:"Transfer",delayed_prompt_fi:"Next week",model_after_attempt_fi:["Answer 1","Answer 2"],scaffold_illustration_id:"hint-image"};
test("first attempt has zero hints, diagrams or grades",()=>{
 const session=newSession();const view=visibleStage(lesson,session);
 assert.equal(view.independent,true);
 assert.deepEqual(view.models,[]);
 assert.equal(view.illustration_id,null);
 assert.equal(view.score,null);
});
test("empty submissions never reveal the model",()=>{
 const session=newSession();
 assert.throws(()=>submitStage(session,"  "),/own answer/);
 assert.equal(session.phase,"attempt");
});
test("scaffold is visible only after first independent submission",()=>{
 const s1=submitStage(newSession(),"initial answer");
 assert.equal(s1.initial,"initial answer");
 assert.equal(s1.phase,"repair");
 assert.deepEqual(visibleStage(lesson,s1).models,["Answer 1","Answer 2"]);
 assert.equal(visibleStage(lesson,s1).illustration_id,"hint-image");
 const s2=submitStage(s1,"my own correction");
 assert.deepEqual(visibleStage(lesson,s2).models,[]);
 assert.equal(visibleStage(lesson,s2).illustration_id,null);
 const s3=submitStage(s2,"new context");
 assert.equal(s3.phase,"done");
 assert.equal(s3.score,undefined);
 assert.throws(()=>submitStage(s3,"another"),/No active/);
});
test("failed input doesn't overwrite the first attempt",()=>{
 const s=submitStage(newSession(),"first");
 assert.throws(()=>submitStage(s,""),/own answer/);
 assert.equal(s.initial,"first");
});
