import test from "node:test";
import assert from "node:assert/strict";
import {R08_MOT_STATUS,createR08StudyPlan,r08PracticeSummary,r08ReturnMessage} from "../r08-motivation-core.mjs";

const plan=()=>createR08StudyPlan({
  skill:"listening",minutes:5,whenCue:"завершу обід",topic:"asuminen"
});
test("reference prototype not active or sending notifications",()=>{
  assert.match(R08_MOT_STATUS,/NOT_ACTIVE_APP/);
  const p=plan();
  assert.equal(p.remindersEnabled,false);
  assert.equal(p.serverSync,false);
  assert.equal(p.requiredStreak,false);
  assert.equal(p.skippingAllowed,true);
});
test("explicit goal, time, situational cue and topic needed, no inferred personal routine",()=>{
  assert.throws(()=>createR08StudyPlan({skill:"listening",minutes:5,topic:"work"}),/requires explicit/);
  assert.throws(()=>createR08StudyPlan({skill:"reading",minutes:0,whenCue:"x",topic:"work"}));
  assert.throws(()=>createR08StudyPlan({skill:"reading",minutes:500,whenCue:"x",topic:"work"}));
  assert.throws(()=>createR08StudyPlan({skill:"writing",minutes:5,whenCue:"x",topic:"work",reminders:true}));
  assert.throws(()=>createR08StudyPlan({mode:"EXAM",skill:"speaking",minutes:5,whenCue:"x",topic:"work"}));
});
test("user chooses all four skills and 5/10/20-minute schedules",()=>{
  for(const skill of ["reading","listening","writing","speaking"])
    for(const minutes of [5,10,20]){
      const p=createR08StudyPlan({skill,minutes,topic:"Kauppa",whenCue:"kahvin jälkeen"});
      assert.equal(p.skill,skill);assert.equal(p.minutes,minutes);
      assert.match(p.sentence_uk,/Kauppa/);
    }
});
test("plan is deterministic and sanitized, cannot mutate preferences",()=>{
  const p=createR08StudyPlan({skill:"speaking",minutes:10,whenCue:"  після  чаю  ",topic:"  Робота "});
  assert.equal(p.whenCue,"після чаю");
  assert.equal(p.topic,"Робота");
  assert.equal(Object.isFrozen(p),true);
  assert.deepEqual(p,createR08StudyPlan({skill:"speaking",minutes:10,whenCue:"  після  чаю  ",topic:"  Робота "}));
});
test("cold start displays zero factual success, never a made-up B1 estimate",()=>{
  const r=r08PracticeSummary();
  for(const x of Object.values(r.skills))assert.deepEqual(x,{
    practiceExposures:0,verifiedIndependentSuccess:0,ungradedExposures:0
  });
  assert.equal(r.streakCount,null);
  assert.equal(r.noOfficialYkiScore,true);
});
test("ungraded writing/speaking count exposure but never verified competence",()=>{
  const events=[
    {taskId:"w1",skill:"writing",status:"ungraded",response:"Hei"},
    {taskId:"s1",skill:"speaking",evidenceKind:"ungraded",response:"Hei"},
    {taskId:"s2",skill:"speaking",evidenceKind:"objective_scored",firstAttempt:true,independent:true,correct:true}
  ];
  const r=r08PracticeSummary(events);
  assert.equal(r.skills.writing.practiceExposures,1);
  assert.equal(r.skills.writing.verifiedIndependentSuccess,0);
  assert.equal(r.skills.speaking.practiceExposures,2);
  assert.equal(r.skills.speaking.verifiedIndependentSuccess,0);
});
test("only independently verified human productive task success is counted",()=>{
  const r=r08PracticeSummary([
    {taskId:"s",skill:"speaking",evidenceKind:"human_reviewed",independent:true,firstAttempt:true,reviewedByQualifiedHuman:true,outcome:"met_task_objective"},
    {taskId:"w",skill:"writing",evidenceKind:"human_reviewed",independent:true,firstAttempt:true,outcome:"met_task_objective"},
    {taskId:"w2",skill:"writing",evidenceKind:"human_reviewed",independent:true,firstAttempt:true,reviewedByQualifiedHuman:true,outcome:"not_met"}
  ]);
  assert.equal(r.skills.speaking.verifiedIndependentSuccess,1);
  assert.equal(r.skills.writing.verifiedIndependentSuccess,0);
});
test("legacy grammar is domain-specific: not YKI written production score",()=>{
  const r=r08PracticeSummary([
    {taskId:"g1",skill:"grammar",firstAnswer:"kirjastoon",firstCorrect:true},
    {taskId:"g2",skill:"grammar",firstAnswer:"väärin",firstCorrect:false,repairCorrect:true}
  ]);
  assert.equal(r.grammarIndependentSuccesses,1);
  assert.equal(r.skills.writing.verifiedIndependentSuccess,0);
});
test("objectively scored read/listen require first independent evidence",()=>{
  const r=r08PracticeSummary([
    {taskId:"r1",skill:"reading",evidenceKind:"objective_scored",firstAttempt:true,independent:true,correct:true},
    {taskId:"l1",skill:"listening",evidenceKind:"objective_scored",firstAttempt:false,independent:true,correct:true},
    {taskId:"l2",skill:"listening",evidenceKind:"objective_scored",firstAttempt:true,independent:false,correct:true},
    {taskId:"l3",skill:"listening",status:"ungraded",correct:true}
  ]);
  assert.equal(r.skills.reading.verifiedIndependentSuccess,1);
  assert.equal(r.skills.listening.verifiedIndependentSuccess,0);
});
test("duplicate persistent event IDs never double count",()=>{
  const e={eventId:"same-id",taskId:"r1",skill:"reading",evidenceKind:"objective_scored",firstAttempt:true,independent:true,correct:true};
  const r=r08PracticeSummary([e,{...e}]);
  assert.equal(r.skills.reading.practiceExposures,1);
});
test("untrusted records cannot create scores",()=>{
  const r=r08PracticeSummary([null,0,{}, {taskId:"x",skill:"CEFR",correct:true},
    {taskId:"",skill:"writing",correct:true}]);
  assert.equal(r.unknownCount,1);
  assert.equal(r.skills.writing.practiceExposures,0);
});
test("after a break, nonjudgmental comeback; no penalty or streak pressure",()=>{
  const r=r08ReturnMessage({today:"2026-10-28",lastPracticeDay:"2026-10-20",plan:plan()});
  assert.equal(r.gapDays,8);
  assert.match(r.message_uk,/Нічого надолужувати не потрібно/);
  assert.equal(r.displayMissedStreak,false);
  assert.equal(r.imposeCatchUp,false);
  assert.equal(r.autoRemind,false);
  assert.equal(r.suggestedMinutes,5);
});
test("same day, yesterday, new user all work without streak tracking",()=>{
  const today="2026-10-28";
  assert.equal(r08ReturnMessage({today,lastPracticeDay:today}).gapDays,0);
  assert.equal(r08ReturnMessage({today,lastPracticeDay:"2026-10-27"}).gapDays,1);
  assert.equal(r08ReturnMessage({today}).gapDays,null);
  assert.match(r08ReturnMessage({today}).message_uk,/Почни/);
});
test("civil date difference is DST-safe and refuses invalid/future dates",()=>{
  assert.equal(r08ReturnMessage({today:"2026-10-28",lastPracticeDay:"2026-10-24"}).gapDays,4);
  assert.throws(()=>r08ReturnMessage({today:"2026-02-30"}),/valid local day/);
  assert.throws(()=>r08ReturnMessage({today:"2026-10-20",lastPracticeDay:"2026-10-28"}),/Future/);
  assert.throws(()=>r08ReturnMessage({today:"2026-10-28",lastPracticeDay:"2026-10-32"}),/Invalid practice day/);
});
test("exam mode has no habits/summary nudges",()=>{
  assert.equal(r08ReturnMessage({mode:"EXAM",today:"2026-10-28"}),null);
});
test("a large events array is bounded to the latest 500, not all history",()=>{
  const ev=Array.from({length:501},(_,i)=>({
    taskId:"r"+i,skill:"reading",evidenceKind:"objective_scored",firstAttempt:true,
    independent:true,correct:true
  }));
  assert.equal(r08PracticeSummary(ev).skills.reading.verifiedIndependentSuccess,500);
});
