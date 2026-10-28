import test from "node:test";
import assert from "node:assert/strict";
import {blankState,completeMission,addDiagnostic,STORAGE_KEY} from "../core.mjs";
import {inspectLearnBackup,restoreLearnBackup,LEARN_BACKUP_MAX_FILE_BYTES} from "../learn-backup.mjs";
import {preflightLegacyLearnMigration} from "../r11-legacy-migration-preflight.mjs";

const old=()=>JSON.stringify(blankState());
const backup=()=>{
  let s=blankState();
  s=completeMission(s,{taskId:"b1-g-001",grammarTag:"illatiivi",
    firstAnswer:"kirjasto",firstCorrect:false,secondAnswer:"kirjastoon",
    repairCorrect:true,transferText:"Menen kirjastoon huomenna."},
    new Date("2026-10-28T10:00:00Z"));
  s=addDiagnostic(s,{skill:"writing",taskId:"w1",status:"ungraded",
    response:"Hyvää huomenta. Haluaisin tietää..."},new Date("2026-10-28T10:00:00Z"));
  return JSON.stringify(s);
};
function mem(initial=null){
  const data=new Map();
  if(initial!==null)data.set(STORAGE_KEY,initial);
  const trace=[];
  return {
    trace,data,
    getItem(key){trace.push(["get",key]);return data.has(key)?data.get(key):null;},
    setItem(key,val){trace.push(["set",key]);data.set(key,val);},
    removeItem(key){trace.push(["remove",key]);data.delete(key);}
  };
}
test("real current V1 progress with independent errors and ungraded writing passes R11 preflight",()=>{
  const p=inspectLearnBackup(backup());
  assert.equal(p.status,"ready");
  assert.deepEqual(p.counts,{attempts:1,diagnostics:1,errors:1,retention:0,cards:1});
  assert.equal(p.safeToOverwrite,false);
  assert.equal(p.requiresConfirmation,true);
});
test("current R11 fail-closed logic reused, not a blind JSON.parse",()=>{
  assert.equal(inspectLearnBackup("{oops").status,"blocked");
  assert.equal(inspectLearnBackup('{"version":99}').reason,"UNSUPPORTED_VERSION");
  const p=JSON.parse(old());p.cards.g={stage:99,due:"2026-10-28"};
  assert.equal(inspectLearnBackup(JSON.stringify(p)).status,"blocked");
  assert.equal(inspectLearnBackup(null).status,"blocked");
  assert.equal(inspectLearnBackup(JSON.stringify({...p,unexpected:true})).status,"blocked");
});
test("legacy reader would silently drop invalid retention, restore blocks",()=>{
  const x=JSON.parse(old());
  x.retention=[{taskId:"r1",day:14,independent:false,status:"ungraded",
    response:"test",submittedAt:"2026-10-28T12:00:00Z"}];
  assert.equal(inspectLearnBackup(JSON.stringify(x)).reason,"LEGACY_READER_WOULD_DROP_DATA");
});
test("current memory unchanged and never written until restore called",()=>{
  const store=mem(old()),before=store.data.get(STORAGE_KEY);
  const inspected=inspectLearnBackup(backup());
  assert.equal(inspected.status,"ready");
  assert.equal(store.data.get(STORAGE_KEY),before);
  assert.equal(store.trace.length,0);
});
test("restore exact raw string on first import and preserve Finnish Unicode",()=>{
  const s=mem(),raw="  "+JSON.stringify(JSON.parse(backup()),null,2)+"\n";
  const out=restoreLearnBackup({storage:s,raw,expectedStoredRaw:null});
  assert.equal(out.status,"restored");
  assert.equal(out.changed,true);
  assert.equal(s.data.get(STORAGE_KEY),raw);
  assert.equal(out.state.attempts[0].firstAnswer,"kirjasto");
  assert.equal(out.state.attempts[0].secondAnswer,"kirjastoon");
  assert.equal(out.state.diagnostics[0].status,"ungraded");
  assert.equal(out.state.cards["b1-g-001"].stage,0);
});
test("restoring same source is no-op but correctly reports original data",()=>{
  const raw=backup(),s=mem(raw);
  const out=restoreLearnBackup({storage:s,raw,expectedStoredRaw:raw});
  assert.equal(out.status,"restored");
  assert.equal(out.changed,false);
  assert.equal(s.trace.filter(x=>x[0]==="set").length,0);
});
test("explicit exact previous-value token mandatory, null is valid for empty storage",()=>{
  const s=mem(old());
  for(const x of [
    {storage:s,raw:backup()},
    {storage:s,raw:backup(),expectedStoredRaw:undefined},
    {storage:s,raw:backup(),expectedStoredRaw:[]}
  ])assert.equal(restoreLearnBackup(x).reason,"INVALID_STORAGE_OR_CONCURRENCY_TOKEN");
  assert.equal(s.data.get(STORAGE_KEY),old());
});
test("another tab changing old data between preview and restore causes conflict",()=>{
  const before=old(),s=mem(before),newer=backup();
  s.setItem(STORAGE_KEY,newer);
  const o=restoreLearnBackup({storage:s,raw:before,expectedStoredRaw:before});
  assert.equal(o.status,"conflict");
  assert.equal(o.reason,"STORAGE_CHANGED_SINCE_PREVIEW");
  assert.equal(s.data.get(STORAGE_KEY),newer);
});
test("a malformed file cannot overwrite existing progress",()=>{
  const before=backup(),s=mem(before);
  const out=restoreLearnBackup({storage:s,raw:"{oops",expectedStoredRaw:before});
  assert.equal(out.status,"blocked");
  assert.equal(s.data.get(STORAGE_KEY),before);
  assert.equal(s.trace.filter(x=>x[0]==="set").length,0);
});
test("failed browser localStorage.setItem leaves previous progress unchanged",()=>{
  const prev=old(),s=mem(prev);
  s.setItem=()=>{throw Error("quota");};
  const o=restoreLearnBackup({storage:s,raw:backup(),expectedStoredRaw:prev});
  assert.equal(o.status,"failed");
  assert.equal(o.rollbackVerified,true);
  assert.equal(s.getItem(STORAGE_KEY),prev);
});
test("if write partially happens but read-back fails, rollback restores exact previous bytes",()=>{
  const oldRaw=" "+old()+" ",s=mem(oldRaw),base=s.getItem.bind(s);
  let reads=0;
  s.getItem=key=>{reads++;return reads===2?"MISMATCH":base(key);};
  const out=restoreLearnBackup({storage:s,raw:backup(),expectedStoredRaw:oldRaw});
  assert.equal(out.status,"failed");
  assert.equal(out.rollbackVerified,true);
  assert.equal(s.data.get(STORAGE_KEY),oldRaw);
});
test("unverifiable rollback is never mislabeled successful",()=>{
  const oldRaw=old(),s=mem(oldRaw);
  let sets=0;
  s.setItem=(key,val)=>{sets++;if(sets===1)throw Error("no space");throw Error("rollback failure");};
  const out=restoreLearnBackup({storage:s,raw:backup(),expectedStoredRaw:oldRaw});
  assert.equal(out.status,"uncertain");
  assert.equal(out.rollbackVerified,false);
});
test("when first import failed, rollback removes partial new record",()=>{
  const s=mem(),base=s.getItem.bind(s);
  let n=0;s.getItem=(k)=>{n++;return n===2?"incorrect":base(k);};
  const o=restoreLearnBackup({storage:s,raw:backup(),expectedStoredRaw:null});
  assert.equal(o.status,"failed");
  assert.equal(o.rollbackVerified,true);
  assert.equal(s.data.has(STORAGE_KEY),false);
});
test("storage read permission denial fails closed",()=>{
  const s=mem(old());s.getItem=()=>{throw Error("blocked");};
  const out=restoreLearnBackup({storage:s,raw:backup(),expectedStoredRaw:old()});
  assert.equal(out.status,"failed");
  assert.equal(out.reason,"STORAGE_READ_FAILED");
});
test("only exact LEARN key is ever written; unrelated EXAM data untouched",()=>{
  const s=mem(old()),other="hospodar-yki:exam:v2";
  s.data.set(other,"SECRET_EXAM_UNMODIFIED");
  restoreLearnBackup({storage:s,raw:backup(),expectedStoredRaw:old()});
  assert.equal(s.data.get(other),"SECRET_EXAM_UNMODIFIED");
  assert.deepEqual(s.trace.filter(x=>x[0]==="set").map(x=>x[1]),[STORAGE_KEY]);
});
test("no first-answer correctness regraded by import, guided repair remains separate",()=>{
  const raw=backup(),o=restoreLearnBackup({storage:mem(),raw,expectedStoredRaw:null});
  assert.equal(o.state.attempts[0].firstCorrect,false);
  assert.equal(o.state.attempts[0].repairCorrect,true);
  assert.equal(o.state.cards["b1-g-001"].lastCorrect,false);
  assert.equal(o.state.attempts[0].transferScoring,"ungraded");
});
test("no output preview exposes raw free-text learner answers",()=>{
  const s=JSON.parse(backup());s.diagnostics[0].response="ПРИВАТНИЙ-ФАЙЛ äiti";
  const p=inspectLearnBackup(JSON.stringify(s));
  assert.equal(p.status,"ready");
  assert.equal(JSON.stringify(p).includes("ПРИВАТНИЙ"),false);
});
test("strict file size limit is an explicit guard, not a claim of unlimited backup restore",()=>{
  assert.equal(LEARN_BACKUP_MAX_FILE_BYTES,8_000_000);
  assert.equal(preflightLegacyLearnMigration(" ".repeat(8_000_001)).reason,"NOT_STRING_OR_TOO_LARGE");
});
test("unknown storage adapter or token never writes",()=>{
  assert.equal(restoreLearnBackup({}).status,"blocked");
  assert.equal(restoreLearnBackup({storage:{},raw:backup(),expectedStoredRaw:null}).status,"blocked");
});
