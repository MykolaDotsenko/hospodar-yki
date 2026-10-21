import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve, dirname, join} from "node:path";
import {
  VERSION, blankState, readState, normalizeFinnish, checkCloze, localDate,
  plusLocalDays, updateCard, dueCards, completeMission, addDiagnostic, skillSummary
} from "../core.mjs";

const here=dirname(fileURLToPath(import.meta.url));
const ROOT=resolve(here, "../..");
const json=p=>JSON.parse(readFileSync(join(ROOT,p),"utf8"));
const task=json("content/b1/grammar/contextual-cloze.json").exercises[0];
const at=new Date("2026-10-21T12:00:00+03:00");

test("state is versioned and starts with no private learning data",()=>{
  assert.equal(blankState().version,VERSION);
  assert.deepEqual(blankState().attempts,[]);
});
test("normalization preserves meaningful Finnish vowel distinctions",()=>{
  assert.equal(normalizeFinnish("  KIRJASTOON.  "),"kirjastoon");
  assert.equal(normalizeFinnish("ÄITI"),"äiti");
  assert.notEqual(normalizeFinnish("äiti"),normalizeFinnish("aiti"));
});
test("cloze matches declared correct form only (not near miss)",()=>{
  assert.equal(checkCloze(task," kirjastoon! ").correct,true);
  assert.equal(checkCloze(task,"kirjasto").correct,false);
  assert.equal(checkCloze(task,"").valid,false);
  assert.equal(checkCloze({...task,accepted_alternatives_fi:["kirjastohon"]},"kirjastohon").correct,true);
});
test("first correct result advances provisional SRS 1/3/7 days",()=>{
  const one=updateCard(null,true,at);
  assert.equal(one.stage,1);
  assert.equal(one.due,"2026-10-22");
  const two=updateCard(one,true,at);
  assert.equal(two.stage,2);
  assert.equal(two.due,"2026-10-24");
  const three=updateCard(two,true,at);
  assert.equal(three.due,"2026-10-28");
});
test("independent failure resets SRS even after successful guided repair",()=>{
  const before=updateCard(updateCard(null,true,at),true,at);
  const after=updateCard(before,false,at);
  assert.equal(after.stage,0);
  assert.equal(after.failures,1);
  assert.equal(after.due,"2026-10-22");
});
test("local date arithmetic handles Finnish DST transition",()=>{
  const before=new Date("2026-10-24T12:00:00+03:00");
  assert.equal(localDate(before),"2026-10-24");
  // Date operations use runtime local timezone. This assertion checks calendar-day arithmetic,
  // and does not require Node CI to run in Europe/Helsinki.
  assert.equal(plusLocalDays(new Date(2026,9,24,12,0,0),3),"2026-10-27");
});
test("completed mission is saved with explicit ungraded transfer and weakness",()=>{
  const s=completeMission(blankState(),{
    taskId:"b1-g-001",grammarTag:"illatiivi",firstAnswer:"kirjasto",
    firstCorrect:false,secondAnswer:"kirjastoon",repairCorrect:true,
    transferText:"Huomenna menen kirjastoon."
  },at);
  assert.equal(s.attempts.length,1);
  assert.equal(s.attempts[0].transferScoring,"ungraded");
  assert.equal(s.errors.length,1);
  assert.equal(s.errors[0].resolution,"guided_repair");
  assert.equal(s.cards["b1-g-001"].stage,0);
  assert.equal(readState(JSON.stringify(s)).state.attempts.length,1);
  assert.equal(blankState().attempts.length,0);
});
test("empty user answer or transfer must not be accepted",()=>{
  assert.throws(()=>completeMission(blankState(),{taskId:"b1-g-001",firstAnswer:"",firstCorrect:true,transferText:"Hei"}));
  assert.throws(()=>completeMission(blankState(),{taskId:"b1-g-001",firstAnswer:"yes",firstCorrect:true,transferText:" "}));
});
test("corrupt and unknown future state recover without crash",()=>{
  assert.equal(readState("{oops").recovered,true);
  assert.equal(readState('{"version":99,"cards":{}}').recovered,true);
  assert.equal(readState(null).recovered,false);
});
test("dated review cards sorted chronologically",()=>{
  const s=blankState();
  s.cards.x=updateCard(null,true,new Date(2026,9,20,12));
  s.cards.y=updateCard(null,true,new Date(2026,9,19,12));
  assert.deepEqual(dueCards(s,"2026-10-22").map(x=>x.id),["y","x"]);
});
test("diagnostics never auto grade writing or speaking",()=>{
  let s=addDiagnostic(blankState(),{skill:"reading",taskId:"d-r1",status:"scored",correct:true},at);
  s=addDiagnostic(s,{skill:"writing",taskId:"d-w1",status:"ungraded",response:"Moi, haluan kysyä kurssista."},at);
  assert.throws(()=>addDiagnostic(s,{skill:"speaking",taskId:"d-s1",status:"scored",correct:true},at));
  assert.throws(()=>addDiagnostic(s,{skill:"writing",taskId:"d-w1",status:"ungraded",correct:false},at));
  assert.equal(skillSummary(s).reading.correct,1);
  assert.equal(skillSummary(s).writing.ungraded,1);
});
test("limits prevent unbounded private history growth",()=>{
  let s=blankState();
  for(let i=0;i<130;i++) s=completeMission(s,{
    taskId:"b1-g-001",firstAnswer:"hi",firstCorrect:false,transferText:"Kokeilen uudestaan.",
    grammarTag:"illatiivi"
  },at);
  assert.equal(s.attempts.length,120);
  assert.equal(s.errors.length,130);
});
test("app exercises and audio paths come from actual repo manifests",()=>{
  const grammar=json("content/b1/grammar/contextual-cloze.json");
  const baseline=json("content/b1/diagnostics/baseline-v1.json");
  const readings=json("content/b1/contextual/reading-pack-v1.json");
  const audio=json("content/b1/audio-long/lessons.json");
  const human=json("content/b1/audio-long/human-stories.json");
  assert.ok(grammar.exercises.length>0);
  assert.ok(baseline.reading.questions.length>0);
  assert.ok(readings.items.length>=2);
  assert.ok(audio.lessons.length>=2);
  assert.ok(human.items.length>=1);
  for(const lesson of audio.lessons) {
    for(const key of ["path","transcript_path","subtitles_path"])
      assert.ok(existsSync(join(ROOT,lesson[key])),`Missing ${lesson[key]}`);
  }
  assert.ok(existsSync(join(ROOT,human.items[0].audio_path)));
});
