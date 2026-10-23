import assert from "node:assert/strict";
import test from "node:test";
import {PHASES,newSession,nextSession,currentTask,safePublisherUrl} from "../authentic-listening-core.mjs";
const lesson={mission:{independent_prompt_fi:"Mistä puhutaan?",reflection_uk:"Звірити розуміння",transfer_prompt_fi:"Kysy uudelleen",delayed_recall_prompt_fi:"Muista huomenna"}};
test("three-stage progression preserves first independent answer and never grades",()=>{
 let s=newSession();assert.equal(currentTask(lesson,s).phase,"attempt");
 s=nextSession(s,"  En ymmärrä  ");assert.deepEqual(s.answers,["En ymmärrä"]);assert.equal(currentTask(lesson,s).phase,"repair");
 s=nextSession(s,"Voin kysyä uudelleen");assert.equal(s.phase,"transfer");
 s=nextSession(s,"Voisitko auttaa?");assert.equal(s.phase,"done");
 assert.equal(currentTask(lesson,s).feedbackIsGraded,false);assert.equal(s.answers.length,3);
 assert.throws(()=>nextSession(s,"hi"),/завершене/);
});
test("empty, whitespace, overly long and inconsistent progression rejected",()=>{
 assert.throws(()=>nextSession(newSession(),"  "),/Введи/);
 assert.throws(()=>nextSession(newSession(),"a".repeat(4001)),/Введи/);
 assert.throws(()=>nextSession({phase:"repair",answers:[]},"hi"),/послідовність/);
});
test("publisher link whitelist rejects credential injection and remote links",()=>{
 const valid="https://www.kielibuusti.fi/fi/suomenopettajat/opetusmateriaalipankki/suomea-julkisissa";
 assert.equal(safePublisherUrl(valid),valid);
 for(const bad of ["http://www.kielibuusti.fi/fi/a","https://evil.example","https://www.kielibuusti.fi.evil.example/fi/a","https://user@www.kielibuusti.fi/fi/a","javascript:alert(1)","https://www.kielibuusti.fi/fi/a#fragment"]){
  assert.throws(()=>safePublisherUrl(bad));
 }
});
test("unknown view is rejected, done phase has delayed recall",()=>{
 assert.throws(()=>currentTask(lesson,{phase:"rubric"}),/Неправильний/);
 assert.equal(currentTask(lesson,{phase:"done",answers:["1","2","3"]}).prompt,"Muista huomenna");
 assert.deepEqual(PHASES,["attempt","repair","transfer","done"]);
});
