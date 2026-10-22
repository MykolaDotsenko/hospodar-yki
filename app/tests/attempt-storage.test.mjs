import test from "node:test";
import assert from "node:assert/strict";
import {
  createMemoryExamRepository,createAndroidExamRepository,assertCommit,
  newCommit,PersistenceError
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
