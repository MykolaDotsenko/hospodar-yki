import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname,resolve,join} from "node:path";
import {fileURLToPath} from "node:url";
import {createTimingProfile,observePracticeTime,gatePracticeAction,
  E04_STRICT_2027_ENABLED,E04_POLICY_STAGE} from "../e04-timing-policy.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const read=(path)=>JSON.parse(readFileSync(join(root,path),"utf8"));
const evidence=read("research/yki/e04-timing-evidence-2026-10.json");
const start=1_700_000_000_000;
const profile=createTimingProfile({kind:"practice",minutes:15});
const clock=(ms,extra={})=>observePracticeTime(profile,{startedAtWallMs:start,observedWallMs:start+ms,...extra});
test("E04 source provenance: 15 unresolved digital fields and historic samples stay legacy",()=>{
  const canonical=read("research/yki/official-yki-deep-audit-v2.json");
  assert.equal(evidence.research_id,"E04");
  assert.equal(evidence.checked_at,"2026-10-29");
  assert.equal(evidence.observed_live_digital_2027_ui,false);
  assert.equal(evidence.official_verified_2027_timing,null);
  assert.equal(evidence.official_verified_2027_replay_policy,null);
  assert.equal(canonical.unknowns.length,15);
  assert.deepEqual(evidence.official_2027_unknown_ids,canonical.unknowns.map(x=>x.id));
  assert.equal(evidence.historic_examples_not_production_rules.length,4);
  assert.ok(evidence.historic_examples_not_production_rules.every(x=>/historical|Historical|NOT 2027/i.test(x.context)));
});
test("Only explicit practice timers are allowed and no official claim sneaks in",()=>{
  assert.equal(E04_STRICT_2027_ENABLED,false);
  assert.equal(E04_POLICY_STAGE,"REFERENCE_ONLY_NOT_LIVE");
  for(const minutes of [0,15,30,60]){
    const policy=createTimingProfile({kind:"practice",minutes});
    assert.equal(policy.durationMs,minutes*60_000);
    assert.equal(policy.official2027,false);
    assert.equal(Object.isFrozen(policy),true);
  }
  for(const minutes of [1,20,45,NaN,undefined]){
    assert.throws(()=>createTimingProfile({kind:"practice",minutes}));
  }
  assert.throws(()=>createTimingProfile({kind:"verified-live-2027",minutes:60}));
  assert.throws(()=>createTimingProfile({kind:"practice",minutes:15,verification:{claimsOfficial:true}}));
});
test("No-timer mode yields null time, not zero or expired",()=>{
  const policy=createTimingProfile({kind:"practice",minutes:0});
  const observed=observePracticeTime(policy,{startedAtWallMs:start,observedWallMs:start+1000000});
  assert.equal(observed.remainingSeconds,null);
  assert.equal(observed.expired,false);
  assert.equal(observed.clockIntegrity,"NO_TIMER");
});
test("Boundary clock: 1ms before, exactly at, after deadline; never negative",()=>{
  assert.equal(clock(0).remainingSeconds,900);
  assert.equal(clock(899999).remainingSeconds,1);
  assert.equal(clock(899999).expired,false);
  assert.equal(clock(900000).remainingSeconds,0);
  assert.equal(clock(900000).expired,true);
  assert.equal(clock(900001).remainingSeconds,0);
  assert.equal(clock(900001).expired,true);
});
test("Delayed interval cannot authorize late commands: deadline is observed on event",()=>{
  const expired=clock(940000);
  assert.equal(gatePracticeAction({observation:expired,action:"answer"}).allowed,false);
  assert.equal(gatePracticeAction({observation:expired,action:"navigate"}).allowed,false);
  assert.equal(gatePracticeAction({observation:expired,action:"finish"}).allowed,false);
});
test("Monotonic elapsed wins against backwards wall clock, with explicit anomaly",()=>{
  const obs=clock(300000,{elapsedMonotonicMs:420000});
  assert.equal(obs.remainingSeconds,480);
  assert.equal(obs.clockIntegrity,"CLOCK_ANOMALY_PRACTICE_ONLY");
  const rollback=clock(-100000,{elapsedMonotonicMs:420000});
  assert.equal(rollback.remainingSeconds,480);
  assert.equal(rollback.clockIntegrity,"CLOCK_ANOMALY_PRACTICE_ONLY");
});
test("Wall clock jump forward is conservative expiry but flagged, never official proof",()=>{
  const obs=clock(950000,{elapsedMonotonicMs:100000});
  assert.equal(obs.expired,true);
  assert.equal(obs.clockIntegrity,"CLOCK_ANOMALY_PRACTICE_ONLY");
  assert.equal(obs.official2027,false);
});
test("Persisted highest elapsed prevents a restart/clock rollback from regaining time",()=>{
  const first=clock(600000);
  const resumed=clock(100000,{highestElapsedMs:first.highestElapsedMs});
  assert.equal(resumed.remainingSeconds,300);
  assert.equal(resumed.highestElapsedMs,600000);
  const end=clock(100000,{highestElapsedMs:900000});
  assert.equal(end.expired,true);
});
test("Reference rejects invalid state, malformed clock readings and actions",()=>{
  for(const value of [NaN,Infinity,-1,"1000",undefined]){
    assert.throws(()=>clock(0,{highestElapsedMs:value}));
  }
  assert.throws(()=>clock(0,{elapsedMonotonicMs:-1}));
  assert.throws(()=>observePracticeTime({kind:"official",durationMs:1},{
    startedAtWallMs:start,observedWallMs:start
  }));
  assert.throws(()=>gatePracticeAction({observation:clock(0),action:"unknown"}));
});
test("Active practice writes can proceed but no result key without committed finish",()=>{
  const active=clock(400000);
  for(const action of ["answer","navigate","finish"])
    assert.equal(gatePracticeAction({observation:active,action}).allowed,true);
  assert.equal(gatePracticeAction({observation:active,action:"reveal-results",finishCommitted:false}).allowed,false);
  assert.equal(gatePracticeAction({observation:active,action:"reveal-results",finishCommitted:true}).allowed,true);
});
test("Deadline finish requires commit receipt; no early reveal",()=>{
  const expired=clock(900000);
  assert.equal(gatePracticeAction({observation:expired,action:"deadline-finish",finishCommitted:false}).allowed,false);
  assert.equal(gatePracticeAction({observation:expired,action:"deadline-finish",finishCommitted:true}).allowed,true);
  assert.equal(gatePracticeAction({observation:clock(1000),action:"deadline-finish",finishCommitted:true}).allowed,false);
});
test("Reference policy is not imported into live Web EXAM, nor certified browser tested",()=>{
  const live=readFileSync(join(root,"app/exam.mjs"),"utf8");
  assert.ok(!live.includes('from "./e04-timing-policy.mjs"'));
  assert.ok(live.includes("window.setInterval(clock,1000)"));
  assert.ok(live.includes("remainingSeconds(exam.session"));
  assert.equal(evidence.reference_only_not_imported_in_live_app,true);
  assert.equal(evidence.implementation_status.live_timer_fixes,"NOT_DONE");
  assert.equal(evidence.implementation_status.learner_validation,"NOT_DONE");
  assert.equal(evidence.gaps.length,10);
  assert.equal(evidence.gaps.filter(x=>x.severity==="P0").length,5);
});
