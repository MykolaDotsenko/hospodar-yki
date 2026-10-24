import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve,dirname} from "node:path";
import {blankState,completeMission,readState} from "../core.mjs";
import {TRANSFER_DAYS,delayedTransferQueue,recordDelayedTransfer} from "../retention-core.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const bank=JSON.parse(readFileSync(resolve(root,"learning/exercises/b1/grammar/delayed-transfer-v1.json"),"utf8"));
const at=d=>new Date("2026-10-"+String(d).padStart(2,"0")+"T12:00:00+03:00");
const seed=()=>completeMission(blankState(),{
  taskId:"b1-g-001",grammarTag:"illatiivi",firstAnswer:"kirjastoon",
  firstCorrect:true,transferText:"Menen illalla kirjastoon."
},at(21));

test("original licensed prompts with distinct 7/14/30-day situations",()=>{
  assert.deepEqual(TRANSFER_DAYS,[7,14,30]);
  assert.equal(bank.items.length,4);
  const ids=bank.items.map(i=>i.task_id);
  assert.equal(new Set(ids).size,4);
  for(const item of bank.items){
    assert.deepEqual(item.checkpoints.map(c=>c.day),TRANSFER_DAYS);
    assert.equal(new Set(item.checkpoints.map(c=>c.prompt_fi)).size,3);
    assert.ok(item.checkpoints.every(c=>c.prompt_fi.length>30));
  }
  assert.equal(bank.is_official_exam_content,false);
});
test("never exposes a delayed prompt before day 7",()=>{
  assert.equal(delayedTransferQueue(seed(),bank,at(22))[0].due,null);
  assert.equal(delayedTransferQueue(seed(),bank,at(28))[0].due.day,7);
});
test("accept first independent day-7 response but never auto-grades Finnish writing",()=>{
  const start=seed();
  const result=recordDelayedTransfer(start,bank,{taskId:"b1-g-001",day:7,response:"Menen huomenna museoon."},at(28));
  assert.equal(result.retention[0].status,"ungraded");
  assert.equal(result.retention[0].independent,true);
  assert.equal(readState(JSON.stringify(result)).state.retention.length,1);
  assert.equal(start.retention.length,0);
  assert.equal(delayedTransferQueue(result,bank,at(28))[0].due,null);
  assert.throws(()=>recordDelayedTransfer(result,bank,{taskId:"b1-g-001",day:7,response:"Uusi."},at(28)));
});
test("missed day 7 cannot be passed as day 7 on day 14",()=>{
  const q=delayedTransferQueue(seed(),bank,new Date("2026-11-04T12:00:00+02:00"))[0];
  assert.equal(q.due.day,14);
  assert.deepEqual(q.missed,[7]);
  assert.throws(()=>recordDelayedTransfer(seed(),bank,{taskId:"b1-g-001",day:7,response:"Menen kirjastoon."},new Date("2026-11-04T12:00:00+02:00")));
});
test("day 30 is a new distinct prompt; duplicate and future submission fail",()=>{
  const november20=new Date("2026-11-20T12:00:00+02:00");
  const q=delayedTransferQueue(seed(),bank,november20)[0];
  assert.equal(q.due.day,30);
  assert.deepEqual(q.missed,[7,14]);
  assert.notEqual(q.due.prompt_fi,bank.items[0].checkpoints[0].prompt_fi);
  assert.throws(()=>recordDelayedTransfer(seed(),bank,{taskId:"b1-g-001",day:30,response:"  "},november20));
  assert.throws(()=>recordDelayedTransfer(seed(),bank,{taskId:"b1-g-001",day:30,response:"x".repeat(1601)},november20));
  assert.throws(()=>recordDelayedTransfer(seed(),bank,{taskId:"unknown",day:30,response:"Menen."},november20));
});
test("legacy V1 profile without retention is accepted with no loss",()=>{
  const s=seed();delete s.retention;
  assert.deepEqual(readState(JSON.stringify(s)).state.retention,[]);
  assert.equal(readState(JSON.stringify(s)).state.cards["b1-g-001"].stage,1);
});
test("invalid or future check-ins are rejected even for a completed mission",()=>{
  assert.throws(()=>recordDelayedTransfer(seed(),bank,{taskId:"b1-g-001",day:7,response:"Lähden pian."},at(22)));
  assert.throws(()=>recordDelayedTransfer(seed(),bank,{taskId:"b1-g-001",day:10,response:"Lähden pian."},at(28)));
});
