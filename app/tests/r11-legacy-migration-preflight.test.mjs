import test from "node:test";
import assert from "node:assert/strict";
import {blankState} from "../core.mjs";
import {preflightLegacyLearnMigration,r11SaveMessage,R11_STATUS} from "../r11-legacy-migration-preflight.mjs";

const base=()=>JSON.stringify(blankState());
const from=x=>preflightLegacyLearnMigration(typeof x==="string"?x:JSON.stringify(x));
const copy=()=>JSON.parse(base());
const attempt=(n)=>({taskId:"g"+n,firstAnswer:"äiti",firstCorrect:true,
  transferText:"Olen kotona",transferScoring:"ungraded",completedAt:"2026-10-28T11:00:00Z"});
const retention=()=>({taskId:"g1",day:14,status:"ungraded",independent:true,
  actualAgeDays:14,lateByDays:0,response:"Ystävä soittaa huomenna",submittedAt:"2026-10-28T08:00:00Z"});
test("isolated reference status; empty localStorage is not treated as a migrated success",()=>{
  assert.match(R11_STATUS,/NO_DATA_MIGRATION/);
  const x=preflightLegacyLearnMigration(null);
  assert.equal(x.status,"empty");
  assert.equal(x.mustBackupExactOriginalBytesBeforeImport,false);
  assert.equal(x.noStorageWrites,true);
  assert.equal(x.canStartMigrationWithoutSeparatePR,false);
});
test("normal V1 blank-state preflight ready but never performs migration",()=>{
  const x=from(base());
  assert.equal(x.status,"ready");
  assert.equal(x.counts.attempts,0);
  assert.equal(x.verifyDestinationReceiptAndKeepRollbackCopy,true);
  assert.equal(x.canStartMigrationWithoutSeparatePR,false);
});
test("raw learner data remains byte-identical including original whitespace and Finnish diacritics",()=>{
  const x=copy();x.attempts.push(attempt(1));
  x.diagnostics.push({skill:"speaking",taskId:"sp1",status:"ungraded",
    response:"Minä rakastan äitiä, en aitiä.",completedAt:"2026-10-28T11:00:00Z"});
  x.cards.g1={stage:1,due:"2026-10-29",reviews:1,failures:0,lastCorrect:true,lastReviewed:"2026-10-28"};
  const raw="  "+JSON.stringify(x,null,2)+"\n";
  const frozenRaw=raw;
  const out=from(raw);
  assert.equal(out.status,"ready");
  assert.equal(raw,frozenRaw);
  assert.equal(out.counts.attempts,1);
  assert.equal(out.counts.diagnostics,1);
  assert.equal(out.counts.cards,1);
  assert.equal(JSON.stringify(out).includes("äiti"),false,"never print private answers");
});
test("a malformed or missing JSON object is blocked, not silently reset to blank",()=>{
  for(const x of ["{", "null","[]",JSON.stringify("x")]){
    assert.equal(from(x).status,"blocked");
  }
});
test("unsupported legacy schema v0/v2 refuses destructive upgrade",()=>{
  for(const version of [0,2,"1",null]){
    const x=copy();x.version=version;
    assert.equal(from(x).reason,"UNSUPPORTED_VERSION");
  }
});
test("unknown top-level progress fields block a silently lossy conversion",()=>{
  const x=copy();x.futureNotes=[{value:"keep original"}];
  assert.equal(from(x).reason,"UNKNOWN_ROOT_FIELDS");
});
test("unknown fields on per-card progress cannot be silently dropped",()=>{
  const x=copy();x.cards.g1={stage:1,due:"2026-10-29",privateReviewNotes:"critical"};
  assert.equal(from(x).reason,"INVALID_OR_UNRECOGNIZED_CARD");
});
test("invalid due date, stage and unexpected card id are separately unsafe",()=>{
  for(const [key,card] of [["g1",{stage:2,due:"2026-02-31"}],
    ["g1",{stage:7,due:"2026-10-30"}],
    ["invalid key!",{stage:1,due:"2026-10-30"}],
    ["g1",{stage:1,due:"2026-10-30",failures:-1}]]){
    const x=copy();x.cards[key]=card;
    assert.equal(from(x).reason,"INVALID_OR_UNRECOGNIZED_CARD");
  }
});
test("complete valid retention evidence preserved as one item",()=>{
  const x=copy();x.retention.push(retention());
  const out=from(x);
  assert.equal(out.status,"ready");
  assert.equal(out.counts.retention,1);
});
test("existing reader would drop invalid retention; preflight refuses to continue",()=>{
  for(const modified of [{status:"scored"},{independent:false},{day:3},
    {response:""},{actualAgeDays:10}]){
    const x=copy();x.retention.push({...retention(),...modified});
    assert.equal(from(x).reason,"LEGACY_READER_WOULD_DROP_DATA");
  }
});
test("legacy attempt and diagnostic filtering cannot silently drop existing items",()=>{
  const a=copy();a.attempts.push({completedAt:"2026-10-28"});
  assert.equal(from(a).reason,"INVALID_LEGACY_ENTRY");
  const b=copy();b.diagnostics.push({taskId:"a",status:"ungraded"});
  assert.equal(from(b).reason,"INVALID_LEGACY_ENTRY");
  const c=copy();c.errors.push({at:"2026-10-28"});
  assert.equal(from(c).reason,"INVALID_LEGACY_ENTRY");
});
test("retention is optional for original LEARN V1 profiles",()=>{
  const x=copy();delete x.retention;
  const preflight=from(x);
  assert.equal(preflight.status,"ready");
  assert.equal(preflight.counts.retention,0);
});
test("separate legacy history count caps prevent silent loss on migration preview",()=>{
  for(const [key,count] of [["attempts",121],["diagnostics",121],
    ["errors",161],["retention",121]]){
    const x=copy();
    if(key==="attempts")x.attempts=Array.from({length:count},(_,i)=>attempt(i));
    if(key==="diagnostics")x.diagnostics=Array.from({length:count},(_,i)=>({taskId:"d"+i,skill:"writing"}));
    if(key==="errors")x.errors=Array.from({length:count},(_,i)=>({taskId:"g"+i}));
    if(key==="retention")x.retention=Array.from({length:count},(_,i)=>({...retention(),taskId:"g"+i}));
    const y=from(x);
    assert.equal(y.reason,"HISTORY_WOULD_BE_TRUNCATED",key);
  }
});
test("EXAM IndexedDB payload is not accepted as a LEARN migration",()=>{
  const exam={version:1,blueprintId:"exam1",answers:{},startedAt:"2026-10-28T11:00:00Z"};
  assert.equal(from(exam).status,"blocked");
});
test("preflight rejects excessive raw bytes rather than blocking the UI",()=>{
  const out=preflightLegacyLearnMigration("a".repeat(8_000_001));
  assert.equal(out.reason,"NOT_STRING_OR_TOO_LARGE");
});
test("none of the result fields expose full answers, user text, or a mutable reference",()=>{
  const x=copy();x.attempts.push({...attempt(1),firstAnswer:"SALAINEN"});
  const out=from(x);
  assert.equal(out.status,"ready");
  assert.equal(JSON.stringify(out).includes("SALAINEN"),false);
  assert.equal(Object.isFrozen(out),true);
  assert.equal(Object.isFrozen(out.counts),true);
});
test("confirmed ACK UI can advance but is not an official grade or power-failure guarantee",()=>{
  const x=r11SaveMessage("confirmed");
  assert.equal(x.canAdvance,true);
  assert.equal(x.graded,false);
  assert.match(x.caveat_uk,/резервної копії/);
});
test("uncertain commit must not advance or reveal answers",()=>{
  const x=r11SaveMessage("uncertain");
  assert.equal(x.canAdvance,false);
  assert.match(x.caveat_uk,/Не надсилати нову спробу/);
});
test("failed write is visible and cannot be treated as success",()=>{
  const x=r11SaveMessage("failed");
  assert.equal(x.canAdvance,false);
  assert.match(x.label_uk,/Не вдалося/);
});
test("missing local audio cannot be graded as successful listening",()=>{
  const x=r11SaveMessage("media_missing");
  assert.equal(x.canAdvance,false);
  assert.equal(x.graded,false);
  assert.match(x.caveat_uk,/не оцінкою аудіювання/);
});
test("invalid UI states never default to saved state",()=>{
  assert.throws(()=>r11SaveMessage("maybe"),/Unknown R11/);
  assert.throws(()=>r11SaveMessage(""),/Unknown R11/);
});
test("untrusted mutation of input state cannot mutate the preview",()=>{
  const x=copy(),raw=JSON.stringify(x),out=from(raw);
  x.cards.g1={stage:1,due:"2026-10-29"};
  assert.equal(out.counts.cards,0);
  assert.equal(out.readonly,true);
});
