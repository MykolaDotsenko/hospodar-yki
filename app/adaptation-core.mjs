/** R06 RESEARCH PROTOTYPE: deterministic, unconnected to production app UX.
 * Explanations describe *observed* local signals, never CEFR/YKI certainty.
 * See research/pedagogy/33-r06-transparent-adaptive-finnish-learning-2026-10.md.
 */
export const R06_REFERENCE_STATUS = "PROTOTYPE_NOT_IN_ACTIVE_APP";
const SKILLS = Object.freeze(["reading","listening","writing","speaking"]);
const MAX_OVERDUE_DAYS = 365;
const MAX_TASK_MINUTES = 180;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function dayIndex(date) {
  if (typeof date !== "string" || !DATE_PATTERN.test(date)) return null;
  const [year,month,day] = date.split("-").map(Number);
  const milliseconds = Date.UTC(year,month-1,day);
  const check = new Date(milliseconds);
  if (check.getUTCFullYear()!==year || check.getUTCMonth()!==month-1 ||
      check.getUTCDate()!==day) return null;
  return Math.floor(milliseconds/86400000);
}
function clamped(value,lo,hi){return Math.min(hi,Math.max(lo,value));}
function observedFirstIndependentFailure(event) {
  if (!event || typeof event !== "object") return false;
  // Existing completeMission records firstAnswer + firstCorrect from an unassisted attempt.
  if (event.skill === "grammar" && typeof event.firstAnswer === "string" &&
      event.firstAnswer.trim() && event.firstCorrect === false) return true;
  // Future typed events: fail only on an explicitly independent objective response.
  return ["reading","listening"].includes(event.skill) &&
    event.evidenceKind === "objective_scored" &&
    event.independent === true && event.firstAttempt === true && event.correct === false;
}
function observedFirstIndependentSuccess(event) {
  return Boolean(event && (
    (event.skill === "grammar" && typeof event.firstAnswer === "string" &&
      event.firstAnswer.trim() && event.firstCorrect === true) ||
    (["reading","listening"].includes(event.skill) && event.evidenceKind === "objective_scored" &&
      event.independent === true && event.firstAttempt === true && event.correct === true)
  ));
}
function validTask(task,{availableMinutes,level,offlineIds,completedIds}) {
  if (!task || typeof task.id !== "string" || !/^[a-z0-9_-]{1,100}$/i.test(task.id)) return false;
  if (!SKILLS.includes(task.skill) || task.reviewStatus !== "s2_approved" ||
    task.redistributionCleared !== true || task.examOnly === true ||
    task.heldOut === true || task.offlineAvailable !== true) return false;
  if (!Number.isInteger(task.estimatedMinutes) || task.estimatedMinutes < 1 ||
    task.estimatedMinutes > MAX_TASK_MINUTES ||
    task.estimatedMinutes > availableMinutes) return false;
  if (level && task.level !== level) return false;
  if (offlineIds && !offlineIds.includes(task.id)) return false;
  if (Array.isArray(task.prerequisiteIds) &&
    !task.prerequisiteIds.every(id => completedIds.has(id))) return false;
  return true;
}
/**
 * @param {{tasks: Array, state?: object, today: string, availableMinutes: number,
 * level?: string, preferredSkills?: string[], preferredTopics?: string[],
 * offlineIds?: string[], mode?: string}} params
 * @returns {Array<{taskId:string,skill:string,score:number,reasons:string[],breakdown:object,status:string}>}
 */
export function rankR06Tasks(params={}) {
  const {tasks,state={},today,availableMinutes,level,
    preferredSkills=[],preferredTopics=[],offlineIds,mode="LEARN"}=params;
  if (mode !== "LEARN") return [];
  const todayIndex=dayIndex(today);
  if (todayIndex===null) throw new TypeError("R06 requires a valid explicit local date");
  if (!Number.isInteger(availableMinutes) || availableMinutes < 1 ||
      availableMinutes > MAX_TASK_MINUTES) throw new TypeError("Invalid session time");
  if (!Array.isArray(tasks) || !Array.isArray(preferredSkills) ||
    !Array.isArray(preferredTopics) || (offlineIds!==undefined&&!Array.isArray(offlineIds))) {
    throw new TypeError("Invalid R06 input");
  }
  const attempts=Array.isArray(state.attempts)?state.attempts:[];
  const diagnostics=Array.isArray(state.diagnostics)?state.diagnostics:[];
  const cards=(state.cards && !Array.isArray(state.cards) && typeof state.cards==="object")?state.cards:{};
  const completedIds=new Set(attempts.filter(observedFirstIndependentSuccess).map(a=>a.taskId));
  const skillCounts=Object.fromEntries(SKILLS.map(s=>[s,0]));
  for(const entry of [...attempts,...diagnostics]) {
    if(entry && SKILLS.includes(entry.skill)) skillCounts[entry.skill] += 1;
  }
  const least=Math.min(...Object.values(skillCounts));
  const result=[];
  const seenIds=new Set();
  for(const task of tasks) {
    if(!validTask(task,{availableMinutes,level,offlineIds,completedIds}) || seenIds.has(task.id)) continue;
    seenIds.add(task.id);
    const related=attempts.filter(a=>a && a.taskId===task.id);
    const diag=diagnostics.filter(a=>a && a.taskId===task.id);
    const evidence=[...related,...diag].filter(a=>
      observedFirstIndependentFailure(a) || observedFirstIndependentSuccess(a));
    // Most recent independently assessed result wins; stale failures never persist
    // after a later successful independent answer. Stable array order for undated mocks.
    evidence.sort((a,b)=>{
      const ai=Date.parse(a.completedAt || a.at || "");
      const bi=Date.parse(b.completedAt || b.at || "");
      return (Number.isFinite(ai)?ai:0)-(Number.isFinite(bi)?bi:0);
    });
    const latest=evidence.at(-1);
    const confirmedFailure=observedFirstIndependentFailure(latest);
    const seen=[...related,...diag].length>0;
    const dueDay=dayIndex(cards[task.id]?.due);
    const daysLate=dueDay===null ? null : todayIndex-dueDay;
    const overdue=(daysLate!==null && daysLate>=0) ?
      20 + Math.min(15,clamped(daysLate,0,MAX_OVERDUE_DAYS)*3) : 0;
    const error=confirmedFailure?22:0;
    const balance=clamped(15-(skillCounts[task.skill]-least)*5,0,15);
    const novelty=seen?0:6;
    const skillPreference=preferredSkills.includes(task.skill)?6:0;
    const topicPreference=typeof task.topic==="string" && preferredTopics.includes(task.topic)?2:0;
    const breakdown={overdue,confirmedError:error,skillExposureBalance:balance,
      newTask:novelty,chosenSkill:skillPreference,chosenTopic:topicPreference};
    const reasons=[];
    if(overdue) reasons.push("REVIEW_DUE");
    if(error) reasons.push("CONFIRMED_FIRST_ERROR");
    if(balance>0) reasons.push("SKILL_EXPOSURE_BALANCE");
    if(novelty) reasons.push("NEW_APPROVED_TASK");
    if(skillPreference) reasons.push("USER_CHOSEN_SKILL");
    if(topicPreference) reasons.push("USER_CHOSEN_TOPIC");
    result.push({taskId:task.id,skill:task.skill,
      score:Object.values(breakdown).reduce((a,b)=>a+b,0),breakdown,reasons,
      status:"FORMATIVE_RECOMMENDATION_ONLY"});
  }
  return result.sort((a,b)=>b.score-a.score || a.taskId.localeCompare(b.taskId,"en"));
}
