import assert from "node:assert/strict";
import test from "node:test";
import {PHASES,newSession,nextSession,currentTask,safePublisherUrl,combineVerifiedExternalLessons} from "../authentic-listening-core.mjs";
import {readFile} from "node:fs/promises";
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

test("all fifteen verified external lessons load without duplicating or copying media",async()=>{
 const old=JSON.parse(await readFile(new URL("../../sources/audio/authentic-dialogues-2026-10.json",import.meta.url),"utf8"));
 const newer=JSON.parse(await readFile(new URL("../../sources/learning/practical-s2-resources-2026-10.json",import.meta.url),"utf8"));
 const combined=combineVerifiedExternalLessons(old.items,newer.items);
 assert.equal(combined.length,15);
 assert.equal(new Set(combined.map(x=>x.id)).size,15);
 assert.equal(combined.filter(x=>x.source_page.includes("eira.clients.crasman.fi")).length,2);
 assert.equal(combined.filter(x=>x.source_page.includes("tasteoffinnish.fi")).length,2);
 assert.equal(combined.every(x=>x.access==="external_link_only"&&x.media_binaries_imported===0&&x.graded===false),true);
 const duplicated=[...newer.items];duplicated[0]={...duplicated[0],id:old.items[0].id};
 assert.throws(()=>combineVerifiedExternalLessons(old.items,duplicated),/Повторні/);
 const fake=[...newer.items];fake[0]={...fake[0],media_binaries_imported:5};
 assert.throws(()=>combineVerifiedExternalLessons(old.items,fake),/Неперевірений/);
});
test("vetted Eira and TasteOfFinnish publisher URLs allowed; spoofed/unsafe URLs rejected",()=>{
 const eira="https://eira.clients.crasman.fi/fi/tietoa-koulusta/hankkeet-ja-yhteistyo/kiitajat-kotopolulla/";
 const taste="https://tasteoffinnish.fi/about-this-course/";
 assert.equal(safePublisherUrl(eira),eira);
 assert.equal(safePublisherUrl(taste),taste);
 for(const bad of ["https://tasteoffinnish.fi.evil.com/about-this-course/","https://login@tasteoffinnish.fi/","https://eira.clients.crasman.fi:8443/fi/","https://evil.example","http://tasteoffinnish.fi"]){
  assert.throws(()=>safePublisherUrl(bad));
 }
});
