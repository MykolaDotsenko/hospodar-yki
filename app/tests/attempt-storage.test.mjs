import test from "node:test";
import assert from "node:assert/strict";
import {
  createMemoryExamRepository,createAndroidExamRepository,assertCommit,
  newCommit,commitWithRecovery,PersistenceError
} from "../attempt-storage.mjs";

const make=(text="")=>({version:1,blueprintId:"yki-mini-1",startedAt:"2026-10-22T08:00:00Z",
  finishedAt:null,index:0,answers:{reading01:text},voiceRecorded:{}});
const uuid=i=>`sample-id-${String(i).padStart(9,"0")}`;
test("atomic response+snapshot commit and exactly-once retry",async()=>{
  const repo=createMemoryExamRepository();
  const first=newCommit(make("äiti"),0,"start",uuid(1));
  const saved=await repo.commit(first);
  assert.equal(saved.revision,1);assert.equal(saved.session.answers.reading01,"äiti");
  const repeat=await repo.commit(first);
  assert.equal(repeat.applied,false);assert.equal(repeat.revision,1);
  const next=await repo.commit(newCommit({...make("öljy"),index:1},1,"navigate",uuid(2)));
  assert.equal(next.revision,2);assert.equal((await repo.readCurrent()).session.index,1);
  assert.equal((await repo.readCurrent()).session.answers.reading01,"öljy");
});
test("reuse of event ID with different data is forbidden",async()=>{
  const repo=createMemoryExamRepository();
  const original=newCommit(make("moi"),0,"start",uuid(10));
  await repo.commit(original);
  await assert.rejects(
    ()=>repo.commit({...original,session:make("different")}),
    e=>e.code==="IDEMPOTENCY_CONFLICT");
  assert.equal((await repo.readCurrent()).session.answers.reading01,"moi");
});
test("stale revision rejected, current progress remains intact",async()=>{
  const repo=createMemoryExamRepository();
  await repo.commit(newCommit(make("a"),0,"start",uuid(3)));
  await assert.rejects(()=>repo.commit(newCommit(make("b"),0,"answer",uuid(4))),
    e=>e instanceof PersistenceError&&e.code==="REVISION_CONFLICT");
  assert.equal((await repo.readCurrent()).session.answers.reading01,"a");
});
test("disk failure rejects whole logical unit and retry is permitted",async()=>{
  let fail=true;
  const repo=createMemoryExamRepository({failWrite:()=>fail});
  const command=newCommit(make("perhe"),0,"answer",uuid(5));
  await assert.rejects(()=>repo.commit(command),e=>e.code==="SAVE_FAILED");
  assert.equal(await repo.readCurrent(),null);
  fail=false;
  assert.equal((await repo.commit(command)).revision,1);
});
test("invalid commands and oversized payload fail without mutation",async()=>{
  const repo=createMemoryExamRepository();
  for(const invalid of [
    {...newCommit(make(),0,"start",uuid(6)),eventId:"bad"},
    {...newCommit(make(),0,"start",uuid(6)),expectedRevision:-1},
    {...newCommit(make(),0,"start",uuid(6)),kind:"secret"},
    {...newCommit(make(),0,"start",uuid(6)),session:{...make(),answers:["bad"]}},
    {...newCommit(make(),0,"answer",uuid(7)),session:{...make(),answers:{long:"x".repeat(250001)}}}
  ]) await assert.rejects(()=>repo.commit(invalid),e=>e.code?.startsWith("INVALID")||e.code==="TOO_LARGE");
  assert.equal(await repo.readCurrent(),null);
});
test("Android bridge has identical command/result semantics, no callback transaction",async()=>{
  const store=createMemoryExamRepository();
  const native={
    readAttempt:async()=>store.readCurrent(),
    readEvent:async({eventId})=>store.readEvent(eventId),
    commitAttempt:async c=>store.commit(c),
    deleteAttempt:async()=>store.deleteLocal()
  };
  const android=createAndroidExamRepository(native);
  const command=newCommit(make("terve"),0,"start",uuid(8));
  assert.deepEqual(await android.commit(command),{applied:true,revision:1,session:make("terve")});
  assert.equal((await android.readCurrent()).revision,1);
  await android.deleteLocal();
  assert.equal(await android.readCurrent(),null);
  assert.throws(()=>createAndroidExamRepository({}),e=>e.code==="UNAVAILABLE");
});
test("read operations cannot mutate persisted state and deletion clears events",async()=>{
  const repo=createMemoryExamRepository();
  await repo.commit(newCommit(make("suomi"),0,"start",uuid(9)));
  const row=await repo.readCurrent();
  row.session.answers.reading01="modified";
  assert.equal((await repo.readCurrent()).session.answers.reading01,"suomi");
  await repo.deleteLocal();
  assert.equal(await repo.readCurrent(),null);
  assert.equal((await repo.commit(newCommit(make("uusi"),0,"start",uuid(9)))).applied,true);
});

test("lost acknowledgement reconciles committed state, real failed write does not",async()=>{
  const repository=createMemoryExamRepository();
  const tricky={
    readCurrent:()=>repository.readCurrent(),
    readEvent:id=>repository.readEvent(id),
    commit:async cmd=>{await repository.commit(cmd);throw Object.assign(new Error("Lost ACK"),{code:"SAVE_FAILED"});}
  };
  const c=newCommit(make("asunut"),0,"answer",uuid(11));
  const recovered=await commitWithRecovery(tricky,c);
  assert.equal(recovered.reconciled,true);assert.equal(recovered.revision,1);
  const impossible={
    readCurrent:async()=>null,
    commit:async()=>{throw Object.assign(new Error("Disk full"),{code:"SAVE_FAILED"});}
  };
  await assert.rejects(()=>commitWithRecovery(impossible,newCommit(make(),0,"answer",uuid(12))),
    e=>e.code==="SAVE_FAILED");
});

test("matching snapshot from another event is NEVER a lost-ACK receipt",async()=>{
  const repo=createMemoryExamRepository();
  const winner=newCommit(make("sama"),0,"answer",uuid(22));
  await repo.commit(winner);
  const failed=newCommit(make("sama"),0,"answer",uuid(23));
  const collision={
    readCurrent:()=>repo.readCurrent(),
    readEvent:id=>repo.readEvent(id),
    commit:async()=>{throw Object.assign(Error("ACK lost"),{code:"SAVE_FAILED"})}
  };
  await assert.rejects(commitWithRecovery(collision,failed),e=>e.code==="SAVE_FAILED");
});
test("tampered event fingerprint never reconciles",async()=>{
  const repo=createMemoryExamRepository();
  const cmd=newCommit(make("äiti"),0,"start",uuid(24));
  await repo.commit(cmd);
  const forged={
    readCurrent:()=>repo.readCurrent(),
    readEvent:async id=>({...await repo.readEvent(id),fingerprint:"wrong"}),
    commit:async()=>{throw Object.assign(Error("ACK lost"),{code:"SAVE_FAILED"})}
  };
  await assert.rejects(commitWithRecovery(forged,cmd),e=>e.code==="SAVE_FAILED");
});
test("old native plugin without receipt API cannot claim recovered durable write",async()=>{
  const r=createMemoryExamRepository();
  const native={
    readAttempt:()=>r.readCurrent(),
    commitAttempt:async cmd=>{await r.commit(cmd);throw Object.assign(Error("ack lost"),{code:"SAVE_FAILED"})},
    deleteAttempt:()=>r.deleteLocal()
  };
  const command=newCommit(make("yksi"),0,"start",uuid(25));
  await assert.rejects(commitWithRecovery(createAndroidExamRepository(native),command),
    e=>e.code==="SAVE_FAILED");
});
