import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve,dirname,join} from "node:path";
import {
  EXAM_STORAGE_KEY,EXAM_STATE_VERSION,MAX_ANSWER_CHARS,buildItems,
  createSession,loadSession,remainingSeconds,writeAnswer,goToIndex,
  recordVoiceEvidence,finishSession,scoreSession
} from "../exam-core.mjs";

const BASE=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const read=p=>JSON.parse(readFileSync(join(BASE,p),"utf8"));
const manifest=read("learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json");
const data={
  reading:read("learning/exercises/b1/contextual/reading-pack-v1.json"),
  listening:read("learning/exercises/b1/audio-long/lessons.json"),
  baseline:read("learning/exercises/b1/diagnostics/baseline-v1.json")
};
const now=new Date("2026-10-21T13:00:00.000Z");
const items=buildItems(manifest.blueprints[0],data);

test("two original blueprints resolve four skills into nine exercises each",()=>{
  assert.equal(manifest.blueprints.length,2);
  for(const b of manifest.blueprints){
    const xs=buildItems(b,data);
    assert.equal(xs.length,9);
    assert.deepEqual(Object.fromEntries(["reading","listening","writing","speaking"]
      .map(s=>[s,xs.filter(i=>i.skill===s).length])),{
        reading:3,listening:4,writing:1,speaking:1
      });
    assert.equal(new Set(xs.map(x=>x.id)).size,9);
    assert.equal(xs.filter(x=>x.audioPath).length,4);
    assert.equal(xs.some(x=>x.kind==="boolean"),true);
    assert.equal(xs.some(x=>x.kind==="text"),true);
    assert.equal(xs.some(x=>x.kind==="choice"),true);
  }
});
test("all question keys are hidden behind finishSession in the scoring API",()=>{
  const s=createSession(manifest.blueprints[0].id,0,now);
  assert.throws(()=>scoreSession(items,s),/before finishing/);
  const finished=finishSession(s,now);
  assert.equal(finished.finishedAt,now.toISOString());
  const report=scoreSession(items,finished);
  assert.equal(report.officialGrade,null);
  assert.equal(report.ykiPassPrediction,null);
});
test("practice timer only accepts opt-in exercise limits and is nonofficial",()=>{
  const s=createSession(manifest.blueprints[0].id,15,now);
  assert.equal(remainingSeconds(s,now),900);
  assert.equal(remainingSeconds(s,new Date(now.getTime()+900000)),0);
  assert.equal(remainingSeconds(createSession(manifest.blueprints[0].id,0,now),now),null);
  assert.throws(()=>createSession(manifest.blueprints[0].id,42,now));
});
test("all objective choices score by source keys but open writing/speaking remain ungraded",()=>{
  let s=createSession(manifest.blueprints[0].id,0,now);
  for(const item of items){
    if(item.kind==="choice")s=writeAnswer(s,item.id,String(item.correct),now);
    else if(item.kind==="boolean")s=writeAnswer(s,item.id,item.correct,now);
    else s=writeAnswer(s,item.id,"Minä haluan keskustella tästä asiasta.",now);
  }
  const report=scoreSession(items,finishSession(s,now));
  assert.equal(report.bySkill.reading.objective,2);
  assert.equal(report.bySkill.reading.correct,2);
  assert.equal(report.bySkill.listening.objective,4);
  assert.equal(report.bySkill.listening.correct,4);
  assert.equal(report.bySkill.writing.ungraded,1);
  assert.equal(report.bySkill.speaking.ungraded,1);
  assert.equal(report.bySkill.reading.ungraded,1);
  assert.equal(report.bySkill.writing.objective,0);
  assert.equal(report.officialGrade,null);
});
test("incorrect and missing answers never receive automatic credit",()=>{
  let s=createSession(manifest.blueprints[0].id,0,now);
  const choice=items.find(x=>x.kind==="choice");
  s=writeAnswer(s,choice.id,"-100",now);
  let result=scoreSession(items,finishSession(s,now));
  assert.equal(result.details.find(x=>x.id===choice.id).status,"incorrect");
  assert.equal(result.bySkill.listening.unanswered+result.bySkill.reading.unanswered+
    result.bySkill.writing.unanswered+result.bySkill.speaking.unanswered,8);
});
test("local drafts survive reload, but voice evidence does not masquerade as persisted audio",()=>{
  let s=createSession(manifest.blueprints[0].id,30,now);
  s=writeAnswer(s,items[0].id,"0",now);
  s=recordVoiceEvidence(s,items.at(-1).id,true);
  const restored=loadSession(JSON.stringify(s),manifest.blueprints.map(b=>b.id));
  assert.equal(restored.recovered,false);
  assert.equal(restored.session.answers[items[0].id],"0");
  assert.deepEqual(restored.session.voiceRecorded,{});
  assert.equal(restored.session.timeLimitMinutes,30);
});
test("corrupt state and obsolete schema recover safely",()=>{
  assert.equal(loadSession("{broken",manifest.blueprints.map(b=>b.id)).recovered,true);
  assert.equal(loadSession('{"version":2}',manifest.blueprints.map(b=>b.id)).recovered,true);
  assert.equal(loadSession(null,manifest.blueprints.map(b=>b.id)).session,null);
  assert.ok(EXAM_STORAGE_KEY.length>0);
  assert.equal(EXAM_STATE_VERSION,1);
});
test("responses are capped and cannot be altered after closing",()=>{
  const t=items[0];
  let s=createSession(manifest.blueprints[0].id,0,now);
  s=writeAnswer(s,t.id,"a".repeat(MAX_ANSWER_CHARS+400),now);
  assert.equal(s.answers[t.id].length,MAX_ANSWER_CHARS);
  assert.throws(()=>writeAnswer(finishSession(s,now),t.id,"new"));
});
test("navigation prevents negative, missing and out-of-range indexes",()=>{
  const s=createSession(manifest.blueprints[0].id,0,now);
  assert.equal(goToIndex(s,8,9).index,8);
  assert.throws(()=>goToIndex(s,-1,9));
  assert.throws(()=>goToIndex(s,9,9));
});
test("evidence ledger is explicit about unsupported 2027 digitesti assumptions",()=>{
  const registry=read("research/yki/yki-digital-fidelity-evidence-2026-10.json");
  const IDs=new Set(registry.evidence.map(x=>x.id));
  assert.equal(IDs.size,registry.evidence.length);
  assert.ok(registry.evidence.length>=30);
  assert.ok(registry.evidence.some(x=>x.status==="unverified_2027"&&x.id==="DIG-006"));
  assert.ok(registry.evidence.some(x=>x.status==="historical_paper_only"&&x.id==="LIST-005"));
  for(const claim of registry.evidence){
    assert.ok(claim.source_urls.length>0);
    assert.ok(claim.source_urls.every(url=>url.startsWith("https://")));
    assert.ok(claim.simulator_policy);
  }
  assert.equal(registry.assessment_rubrics.grade_policy,"NO_AUTOMATIC_YKI_GRADE");
});
