/**
 * R07 isolated pure research prototype — NOT connected to app/app.mjs.
 * User-driven audio, independent-first response, supported practice and novel transfer.
 * Only curated LEARN tasks. This is not a microphone, exam, CEFR or YKI grade.
 */
export const R07_STATUS="REFERENCE_ONLY_NOT_ACTIVE_UI";
export const R07_VERSION=1;
const SKILLS=["reading","listening","writing","speaking"];
const MAX_TEXT=1600;
const SUPPORT=["transcript","meaning","slow_audio","visual_cue"];

const safeText=(x)=>typeof x==="string"?x.trim().slice(0,MAX_TEXT):"";
const same=(a,b)=>String(a).normalize("NFC").trim().toLocaleLowerCase("fi-FI")===
  String(b).normalize("NFC").trim().toLocaleLowerCase("fi-FI");
function validTask(t){
  return t && typeof t==="object" && /^[a-z0-9_-]{1,100}$/i.test(t.id||"") &&
    SKILLS.includes(t.skill) && t.reviewStatus==="s2_approved" &&
    t.redistributionCleared===true &&
    typeof t.prompt_fi==="string" && t.prompt_fi.trim().length>0 &&
    typeof t.transfer_prompt_fi==="string" && t.transfer_prompt_fi.trim().length>0 &&
    t.prompt_fi.trim()!==t.transfer_prompt_fi.trim() &&
    (t.skill!=="listening" || t.audioAvailable===true);
}
function sealedPhase(phase){return ["feedback","repair","transfer","done"].includes(phase);}
function ensure(session,task) {
  if(!session || session.version!==R07_VERSION || session.taskId!==task?.id ||
    !validTask(task))throw new TypeError("Invalid R07 task/session");
}
export function createR07Session(task,mode="LEARN",settings={}) {
  if(mode!=="LEARN" || !validTask(task) || task.examOnly===true ||
    task.heldOut===true)throw new TypeError("Only approved, licensable LEARN practice tasks");
  return Object.freeze({
    version:R07_VERSION,taskId:task.id,skill:task.skill,phase:"ready",
    audioStarts:0,requestedSupports:[],firstResponse:null,
    feedbackStatus:null,transferResponse:null,
    reducedMotion:settings.reducedMotion!==false,
    soundEffects:false // R07 never starts sound on interface events
  });
}
export function transitionR07(session,task,event) {
  ensure(session,task);
  if(!event || typeof event.type!=="string") throw new TypeError("Event type required");
  const s={...session,requestedSupports:[...session.requestedSupports]};
  switch(event.type){
    case "START":
      if(s.phase!=="ready")break;
      s.phase="independent";return Object.freeze(s);
    case "PLAY_FINNISH_AUDIO":
      if(s.phase!=="independent" || task.skill!=="listening")break;
      s.audioStarts+=1;return Object.freeze(s);
    case "REQUEST_SUPPORT":
      if(s.phase!=="independent" || !SUPPORT.includes(event.support))break;
      if(!s.requestedSupports.includes(event.support))s.requestedSupports.push(event.support);
      return Object.freeze(s);
    case "SUBMIT_FIRST":{
      if(s.phase!=="independent")break;
      const response=safeText(event.answer);
      if(!response)throw new TypeError("Non-empty first response required");
      if(task.skill==="listening" && s.audioStarts===0 &&
        !s.requestedSupports.includes("transcript")) {
        throw new TypeError("Start Finnish audio or request accessible transcript before answering");
      }
      const independent=s.requestedSupports.length===0;
      // Only validated objective answers are machine scored.
      const objective=independent && ["reading","listening"].includes(task.skill) &&
        task.answerKeyApproved===true && typeof task.answer_fi==="string" &&
        task.answer_fi.length>0;
      const correct=objective?same(response,task.answer_fi):null;
      s.firstResponse={text:response,independent,
        evidenceKind:objective?"objective_scored":"ungraded",
        correct,requestedSupports:[...s.requestedSupports]};
      s.feedbackStatus=objective?(correct?"correct":"needs_repair"):"ungraded";
      s.phase="feedback";return Object.freeze(s);
    }
    case "BEGIN_REPAIR":
      if(s.phase!=="feedback")break;
      s.phase="repair";return Object.freeze(s);
    case "SUBMIT_REPAIR":
      if(s.phase!=="repair" || !safeText(event.answer))break;
      s.phase="transfer";return Object.freeze(s);
    case "SKIP_REPAIR":
      if(s.phase!=="feedback"&&s.phase!=="repair")break;
      s.phase="transfer";return Object.freeze(s);
    case "SUBMIT_TRANSFER":
      if(s.phase!=="transfer" || !safeText(event.answer))break;
      s.transferResponse={text:safeText(event.answer),evidenceKind:"ungraded",independent:true};
      s.phase="done";return Object.freeze(s);
    default:break;
  }
  throw new TypeError("R07 event not allowed for current phase");
}
/** Whitelisted presentational data. Never pass task answer key or private study/exam info. */
export function r07View(session,task){
  ensure(session,task);
  const phase=session.phase;
  const post=sealedPhase(phase);
  const result={
    phase,skill:session.skill,taskId:session.taskId,
    prompt_fi:phase==="ready"||phase==="independent"?task.prompt_fi:null,
    transfer_prompt_fi:phase==="transfer"?task.transfer_prompt_fi:null,
    canPlayAudio:task.skill==="listening" && phase==="independent",
    canAskSupport:phase==="independent",showCaption:post ||
      session.requestedSupports.includes("transcript"),
    caption_fi:(post || session.requestedSupports.includes("transcript"))?
      (task.caption_fi || null):null,
    visibleMeaningHint:phase==="independent" &&
      session.requestedSupports.includes("meaning") ? (task.meaning_uk || null):null,
    feedback_uk:phase==="feedback"||phase==="repair"?task.feedback_uk||null:null,
    answer_fi:(phase==="feedback"||phase==="repair") &&
      ["reading","listening"].includes(task.skill) && task.answerKeyApproved===true ?
      (task.answer_fi||null):null,
    firstEvidenceKind:post?session.firstResponse?.evidenceKind||null:null,
    soundEffectsEnabled:false,reducedMotion:session.reducedMotion
  };
  // During new-context independent transfer no old answer/transcript/feedback visible.
  if(phase==="transfer"){result.showCaption=false;result.caption_fi=null;}
  return result;
}
