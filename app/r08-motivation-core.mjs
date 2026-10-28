/**
 * R08-MOT reference prototype: autonomy-first study planning and honest progress.
 * NOT imported by current app, no notifications, behavioral tracking or gamification.
 * Sources and caveats: research/gameplay/02-r08-motivation-autonomy-habits-2026-10.md
 */
export const R08_MOT_STATUS = "ISOLATED_REFERENCE_NOT_ACTIVE_APP";
const SKILLS = Object.freeze(["reading","listening","writing","speaking"]);
const MINUTES = Object.freeze([5,10,20]);
const MAX_ENTRIES = 500;
const DAY_MS = 86400000;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
function text(x,max=90){ return typeof x==="string" ? x.trim().replace(/\s+/gu," ").slice(0,max) : ""; }
function day(date){
  if(typeof date!=="string"||!DATE.test(date))return null;
  const [y,m,d]=date.split("-").map(Number);
  const time=Date.UTC(y,m-1,d);
  const check=new Date(time);
  return check.getUTCFullYear()===y&&check.getUTCMonth()+1===m&&check.getUTCDate()===d?
    Math.floor(time/DAY_MS):null;
}
function safeSkill(skill){return SKILLS.includes(skill);}
function validMode(mode){return mode==="LEARN";}
function objectiveIndependentSuccess(e){
  if(!e||!e.taskId||typeof e.taskId!=="string")return false;
  // Legacy cloze evidence is grammar domain, with independent firstAnswer (even
  // after guided repair). Do not reinterpret it as formal writing competence.
  if(e.skill==="grammar" && typeof e.firstAnswer==="string" &&
    e.firstAnswer.trim() && e.firstCorrect===true)return true;
  // Approved explicit objective evidence from real reading/listening. A raw
  // ungraded diagnostic or a simulated voice score must never count as mastery.
  return ["reading","listening"].includes(e.skill) &&
    e.evidenceKind==="objective_scored" && e.firstAttempt===true &&
    e.independent===true && e.correct===true;
}
function reviewedHumanSuccess(e){
  return e&&["speaking","writing"].includes(e.skill) &&
    e.evidenceKind==="human_reviewed" && e.independent===true &&
    e.firstAttempt===true && e.reviewedByQualifiedHuman===true &&
    e.outcome==="met_task_objective";
}
/**
 * A voluntary if-then study plan. Offline-first: no alarm, account or automatic reminder.
 */
export function createR08StudyPlan({mode="LEARN",skill,minutes,whenCue,topic,reminders=false}={}){
  if(!validMode(mode)||!safeSkill(skill)||!MINUTES.includes(minutes)||
    typeof whenCue!=="string"||!whenCue.trim()||whenCue.length>150||
    typeof topic!=="string"||!topic.trim()||topic.length>90||
    reminders!==false)throw new TypeError("R08 requires explicit LEARN skill, time and personal cue; reminders off");
  const cue=text(whenCue,150),chosenTopic=text(topic);
  return Object.freeze({
    status:"VOLUNTARY_LOCAL_PLAN_ONLY",mode,skill,minutes,whenCue:cue,topic:chosenTopic,
    sentence_uk:`Коли ${cue}, я добровільно потреную ${skill} на тему «${chosenTopic}» протягом ${minutes} хв.`,
    remindersEnabled:false,requiredStreak:false,skippingAllowed:true,
    soundEffectsEnabled:false,serverSync:false
  });
}
/**
 * Count PRACTICE separately from successfully verified independent answers.
 * One response cannot become fake CEFR score or "days learned".
 */
export function r08PracticeSummary(events=[]){
  if(!Array.isArray(events))throw new TypeError("R08 events must be an array");
  const counts=Object.fromEntries(SKILLS.map(k=>[k,{practiceExposures:0,verifiedIndependentSuccess:0,ungradedExposures:0}]));
  let grammarIndependentSuccesses=0,unknownCount=0;
  const usedIds=new Set();
  for(const e of events.slice(-MAX_ENTRIES)){
    if(!e||typeof e!=="object"||typeof e.taskId!=="string"||!e.taskId)continue;
    if(typeof e.eventId==="string"){
      if(usedIds.has(e.eventId))continue;
      usedIds.add(e.eventId);
    }
    if(e.skill==="grammar"){
      if(objectiveIndependentSuccess(e))grammarIndependentSuccesses+=1;
      continue;
    }
    if(!safeSkill(e.skill)){unknownCount++;continue;}
    const count=counts[e.skill];
    count.practiceExposures+=1;
    if(e.evidenceKind==="ungraded"||e.status==="ungraded"||
      // Existing MVP diagnostic writing/speaking always ungraded.
      (["writing","speaking"].includes(e.skill)&&!reviewedHumanSuccess(e))){
      count.ungradedExposures+=1;
    }
    if(objectiveIndependentSuccess(e)||reviewedHumanSuccess(e)){
      count.verifiedIndependentSuccess+=1;
    }
  }
  return {skills:counts,grammarIndependentSuccesses,unknownCount,
    noOfficialYkiScore:true,strictlyNoProficiencyPercent:true,streakCount:null};
}
/**
 * Durable no-punishment return copy from an explicit day and last event.
 * A pause is not failure. No notifications, guilt copy, or purchase prompts.
 */
export function r08ReturnMessage({mode="LEARN",today,lastPracticeDay,plan=null}={}){
  if(!validMode(mode))return null;
  const current=day(today);
  if(current===null)throw new TypeError("Explicit valid local day required");
  const past=lastPracticeDay===undefined||lastPracticeDay===null?
    null:day(lastPracticeDay);
  if(lastPracticeDay!=null&&past===null)throw new TypeError("Invalid practice day");
  const age=past===null?null:current-past;
  if(age!==null&&age<0)throw new TypeError("Future practice day invalid");
  const resumedAfterPause=age!==null&&age>1;
  const chosenPlan=plan&&plan.status==="VOLUNTARY_LOCAL_PLAN_ONLY"?plan:null;
  const message_uk=age===null?
    "Почни з короткої фінської ситуації на свій вибір.":
    resumedAfterPause?
      "Можна просто продовжити з однієї короткої вправи. Нічого надолужувати не потрібно.":
      "Обери наступну корисну ситуацію фінською у своєму темпі.";
  return {
    status:"CHOICE_NOT_PRESSURE",message_uk,
    suggestedMinutes:chosenPlan?.minutes??5,
    chosenSkill:chosenPlan?.skill??null,
    chosenTopic:chosenPlan?.topic??null,
    gapDays:age,displayMissedStreak:false,imposeCatchUp:false,
    autoRemind:false,displayComparisonRank:false,forceCompletion:false
  };
}
