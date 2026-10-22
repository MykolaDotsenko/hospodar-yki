import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {CommandError,canonicalJson,assertSessionCommand,
  InMemorySessionRepository,commitSessionWithRecovery} from "../src/session-v2.mjs";

const input={
 protocolVersion:2,commandId:"cmd-001",sessionId:"session-001",expectedRevision:0,
 event:{type:"first-attempt",itemId:"fin-001",itemVersion:1,
   contentHash:"sha256:"+"a".repeat(64),hintUsed:false,outcome:"answered",
   response:"tuli"},nextSnapshot:{progress:1,assessmentStatus:"ungraded"}
};
const loadFixture=()=>JSON.parse(readFileSync(fileURLToPath(new URL("../fixtures/v2-golden.json",import.meta.url)),"utf8"));
test("canonical encoding is stable under object-key permutation and preserves Finnish Unicode",()=>{
 assert.equal(canonicalJson({b:1,a:{z:"äiti",a:"tulli"}}),
   '{"a":{"a":"tulli","z":"äiti"},"b":1}');
 assert.equal(canonicalJson({name:"äiti"}),canonicalJson({name:"äiti"}));
 assert.notEqual(canonicalJson({name:"äiti"}),canonicalJson({name:"aiti"}));
 assert.throws(()=>canonicalJson({v:undefined}),e=>e.code==="INVALID_COMMAND");
 assert.throws(()=>canonicalJson({v:Infinity}),e=>e.code==="INVALID_COMMAND");
});
test("portable golden fixture freezes canonical bytes and semantic types",()=>{
 const f=loadFixture();
 for(const row of f.valid){
   assert.equal(canonicalJson(assertSessionCommand(row.command)),row.canonical);
 }
 for(const row of f.invalid){
   assert.throws(()=>assertSessionCommand(row.command),e=>e.code==="INVALID_COMMAND");
 }
});
test("checkpoint is mutable but does not count as first independent response",async()=>{
 const r=new InMemorySessionRepository();
 const cp={...input,commandId:"checkpoint-001",event:{type:"checkpoint",index:0}};
 await r.commit(cp);
 const cp2={...cp,commandId:"checkpoint-002",expectedRevision:1,
   nextSnapshot:{progress:2,assessmentStatus:"ungraded"}};
 await r.commit(cp2);
 assert.equal((await r.readSession(input.sessionId)).revision,2);
 const first={...input,expectedRevision:2};
 await r.commit(first);
 assert.equal(await r.countCommands(),3);
 await assert.rejects(r.commit({...first,commandId:"second-first",expectedRevision:3}),
   e=>e.code==="FIRST_ATTEMPT_EXISTS");
 assert.equal(await r.countCommands(),3);
});
test("first answer retry returns exact original receipt, not newer snapshot",async()=>{
 const r=new InMemorySessionRepository();
 const original=await r.commit(input);
 await r.commit({...input,commandId:"checkpoint-003",expectedRevision:1,event:{type:"checkpoint"}});
 const retry=await r.commit(input);
 assert.equal(retry.revision,original.revision);
 assert.equal(retry.duplicate,true);
 assert.equal((await r.readSession(input.sessionId)).revision,2);
});
test("first answer cannot include hints or fabricate assessment",()=>{
 assert.throws(()=>assertSessionCommand({...input,event:{...input.event,hintUsed:true}}),
   e=>e.code==="INVALID_COMMAND");
 assert.throws(()=>assertSessionCommand({...input,event:{type:"checkpoint",assessmentStatus:"B1"}}),
   e=>e.code==="INVALID_COMMAND");
});
test("revision conflict and payload collision fail without mutating storage",async()=>{
 const r=new InMemorySessionRepository();
 await r.commit(input);
 await assert.rejects(r.commit({...input,commandId:"cmd-002"}),e=>e.code==="REVISION_CONFLICT");
 await assert.rejects(r.commit({...input,nextSnapshot:{progress:999}}),
   e=>e.code==="IDEMPOTENCY_CONFLICT");
 assert.equal((await r.readSession(input.sessionId)).snapshot.progress,1);
});
test("repair event must link prior first answer and remain ungraded",async()=>{
 const r=new InMemorySessionRepository();
 await r.commit(input);
 const repair={...input,expectedRevision:1,commandId:"repair-001",
   event:{type:"repair",itemId:"fin-001",sourceAttemptId:"cmd-001",
   assessmentStatus:"ungraded",response:"tuuli"}};
 await r.commit(repair);
 assert.equal((await r.readSession(input.sessionId)).revision,2);
 await assert.rejects(r.commit({...repair,commandId:"repair-wrong-item",expectedRevision:2,
   event:{...repair.event,itemId:"unrelated-lesson"}}),e=>e.code==="INVALID_COMMAND");
 await assert.rejects(r.commit({...repair,commandId:"repair-002",expectedRevision:2,
   event:{...repair.event,sourceAttemptId:"missing"}}),
   e=>e.code==="INVALID_COMMAND");
});
test("lost ACK uses command receipt fingerprint, never identical snapshot alone",async()=>{
 const r=new InMemorySessionRepository();
 const uncertain={commit:async cmd=>{await r.commit(cmd);throw Object.assign(Error("ACK lost"),{code:"SAVE_FAILED"})},
   readReceipt:id=>r.readReceipt(id)};
 const confirmed=await commitSessionWithRecovery(uncertain,input);
 assert.equal(confirmed.reconciled,true);
 const hostile={commit:async()=>{throw Object.assign(Error("Lost"),{code:"SAVE_FAILED"})},
   readReceipt:async()=>({...confirmed,commandId:"other-command"})};
 await assert.rejects(commitSessionWithRecovery(hostile,input),e=>e.code==="SAVE_FAILED");
});
