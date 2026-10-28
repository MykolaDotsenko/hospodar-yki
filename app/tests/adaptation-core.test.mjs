import test from "node:test";
import assert from "node:assert/strict";
import {rankR06Tasks,R06_REFERENCE_STATUS} from "../adaptation-core.mjs";

const task=(id,skill,extra={})=>({
  id,skill,reviewStatus:"s2_approved",redistributionCleared:true,
  offlineAvailable:true,estimatedMinutes:5,level:"A2.2",topic:"asuminen",...extra
});
const sample=[task("listening-home","listening"),task("writing-letter","writing"),
  task("reading-notice","reading"),task("speaking-call","speaking")];
const ctx=(override={})=>({tasks:sample,today:"2026-10-28",availableMinutes:10,level:"A2.2",mode:"LEARN",...override});

test("reference R06 is explicit prototype, not an active app feature",()=>{
  assert.match(R06_REFERENCE_STATUS,/PROTOTYPE/);
});
test("cold start has no invented mastery: independent deterministic sorted output",()=>{
  const r=rankR06Tasks(ctx());
  assert.equal(r.length,4);
  assert.ok(r.every(x=>x.status==="FORMATIVE_RECOMMENDATION_ONLY"));
  assert.ok(r.every(x=>!Object.keys(x).some(k=>/mastery|yki|proficiency|probability/i.test(k))));
  assert.deepEqual(r,rankR06Tasks(ctx()));
  assert.deepEqual(r.map(x=>x.taskId),["listening-home","reading-notice","speaking-call","writing-letter"]);
});
test("user preference skill and topic help, but not hidden guessed ability",()=>{
  const r=rankR06Tasks(ctx({preferredSkills:["writing"],preferredTopics:["asuminen"]}));
  assert.equal(r[0].taskId,"writing-letter");
  assert.deepEqual(r[0].reasons.filter(x=>x.startsWith("USER_")),["USER_CHOSEN_SKILL","USER_CHOSEN_TOPIC"]);
});
test("due review and true first independent error take priority",()=>{
  const state={cards:{"reading-notice":{due:"2026-10-26"}},attempts:[
    {taskId:"reading-notice",skill:"reading",firstAttempt:true,independent:true,evidenceKind:"objective_scored",correct:false,completedAt:"2026-10-27T10:00:00Z"}
  ],diagnostics:[]};
  const ranked=rankR06Tasks(ctx({state}));
  assert.equal(ranked[0].taskId,"reading-notice");
  assert.equal(ranked[0].breakdown.overdue,26);
  assert.equal(ranked[0].breakdown.confirmedError,22);
  assert.ok(ranked[0].reasons.includes("CONFIRMED_FIRST_ERROR"));
});
test("ungraded speaking/writing neither error nor mastery",()=>{
  const state={diagnostics:[
    {taskId:"speaking-call",skill:"speaking",status:"ungraded",response:"Hei",correct:false},
    {taskId:"writing-letter",skill:"writing",status:"ungraded",response:"Hei",correct:false}
  ],attempts:[]};
  const ranks=rankR06Tasks(ctx({state}));
  assert.equal(ranks.find(x=>x.taskId==="speaking-call").breakdown.confirmedError,0);
  assert.equal(ranks.find(x=>x.taskId==="writing-letter").breakdown.confirmedError,0);
  assert.equal(ranks.find(x=>x.taskId==="speaking-call").breakdown.newTask,0);
});
test("guided repair and unsupported automated language score never create verified failure",()=>{
  const state={attempts:[
    {taskId:"speaking-call",skill:"speaking",status:"ungraded",repairCorrect:false},
    {taskId:"writing-letter",skill:"writing",firstAttempt:false,evidenceKind:"objective_scored",correct:false},
    {taskId:"reading-notice",skill:"reading",firstAttempt:true,independent:false,evidenceKind:"objective_scored",correct:false}
  ]};
  const ranks=rankR06Tasks(ctx({state}));
  assert.equal(ranks.reduce((x,r)=>x+r.breakdown.confirmedError,0),0);
});
test("filter nonapproved, rights-blocked, exam and held-out tasks, unavailable offline files and time",()=>{
  const bad=[
    task("a","reading",{reviewStatus:"draft"}),
    task("b","reading",{redistributionCleared:false}),
    task("c","reading",{examOnly:true}),
    task("d","reading",{heldOut:true}),
    task("e","reading",{offlineAvailable:false}),
    task("f","reading",{estimatedMinutes:30}),
    task("g","reading",{level:"B2.1"}),
    task("h","reading",{prerequisiteIds:["prior"]})
  ];
  assert.deepEqual(rankR06Tasks(ctx({tasks:[...bad,task("okay","reading")]})).map(x=>x.taskId),["okay"]);
  assert.deepEqual(rankR06Tasks(ctx({tasks:[task("a","reading")],offlineIds:[]})),[]);
});
test("successful independently logged prerequisite unlocks dependent task",()=>{
  const dependent=task("partitive","reading",{prerequisiteIds:["entry"]});
  const state={attempts:[{taskId:"entry",skill:"reading",firstAttempt:true,independent:true,evidenceKind:"objective_scored",correct:true}]};
  assert.deepEqual(rankR06Tasks(ctx({tasks:[dependent],state})).map(x=>x.taskId),["partitive"]);
});
test("EXAM mode never receives personalization or keys",()=>{
  assert.deepEqual(rankR06Tasks(ctx({mode:"EXAM"})),[]);
  const ranks=rankR06Tasks(ctx({tasks:[task("safe","reading",{answer_fi:"secret",prompt_fi:"Classified"})]}));
  assert.ok(!JSON.stringify(ranks).includes("secret"));
  assert.ok(!JSON.stringify(ranks).includes("Classified"));
});
test("invalid dates / times fail closed, future reviews do not score",()=>{
  assert.throws(()=>rankR06Tasks(ctx({today:"2026-02-30"})),/valid explicit local date/);
  assert.throws(()=>rankR06Tasks(ctx({availableMinutes:0})),/Invalid session time/);
  const ranks=rankR06Tasks(ctx({state:{cards:{"reading-notice":{due:"2026-11-01"}}}}));
  assert.equal(ranks.find(x=>x.taskId==="reading-notice").breakdown.overdue,0);
});
test("overdue score capped; DST handled with UTC civil-day arithmetic",()=>{
  const state={cards:{"reading-notice":{due:"2026-10-24"}}};
  assert.equal(rankR06Tasks(ctx({state})).find(x=>x.taskId==="reading-notice").breakdown.overdue,32);
  const aged=rankR06Tasks(ctx({state:{cards:{"reading-notice":{due:"2020-01-01"}}}}));
  assert.equal(aged.find(x=>x.taskId==="reading-notice").breakdown.overdue,35);
});
test("duplicated IDs cannot inflate rankings; no mutation of supplied inputs",()=>{
  const state={attempts:[],cards:{}},tasks=[task("same","reading"),task("same","reading")];
  const before=JSON.stringify({tasks,state});
  assert.equal(rankR06Tasks(ctx({tasks,state})).length,1);
  assert.equal(JSON.stringify({tasks,state}),before);
});

test("old error is superseded by later independently observed success",()=>{
  const state={attempts:[
    {taskId:"reading-notice",skill:"reading",evidenceKind:"objective_scored",independent:true,firstAttempt:true,correct:false,completedAt:"2026-10-22T10:00:00Z"},
    {taskId:"reading-notice",skill:"reading",evidenceKind:"objective_scored",independent:true,firstAttempt:true,correct:true,completedAt:"2026-10-27T10:00:00Z"}
  ]};
  const result=rankR06Tasks(ctx({state})).find(x=>x.taskId==="reading-notice");
  assert.equal(result.breakdown.confirmedError,0);
});
test("even forged objective result on speaking is not reliable for machine scoring",()=>{
  const state={attempts:[
    {taskId:"speaking-call",skill:"speaking",evidenceKind:"objective_scored",independent:true,firstAttempt:true,correct:false}
  ]};
  assert.equal(rankR06Tasks(ctx({state})).find(x=>x.taskId==="speaking-call").breakdown.confirmedError,0);
});
