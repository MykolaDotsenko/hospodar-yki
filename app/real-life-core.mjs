/** Ephemeral independent LEARN practice; does NOT emit exam/SRS evidence. */
export const PHASES=Object.freeze(["attempt","repair","transfer","done"]);
export function newSession(){return {phase:"attempt",initial:"",repair:"",transfer:""};}
export function visibleStage(lesson,session){
  if(!lesson||!session||!PHASES.includes(session.phase))throw new TypeError("Unknown lesson/phase");
  const p=session.phase;
  return {
    phase:p,
    prompt:p==="attempt"?lesson.first_task_fi:p==="repair"?lesson.repair_task_fi:p==="transfer"?lesson.transfer_task_fi:lesson.delayed_prompt_fi,
    models:p==="repair"?lesson.model_after_attempt_fi:[],
    illustration_id:p==="repair"?lesson.scaffold_illustration_id:null,
    independent:p==="attempt",
    score:null
  };
}
export function submitStage(session,raw){
  if(!session||session.phase==="done"||!PHASES.includes(session.phase))throw new Error("No active learning stage");
  const value=typeof raw==="string"?raw.trim():"";
  if(!value)throw new Error("Write your own answer before continuing");
  if(value.length>4000)throw new Error("Answer exceeds 4000 characters");
  if(session.phase==="attempt")return {...session,phase:"repair",initial:value};
  if(session.phase==="repair")return {...session,phase:"transfer",repair:value};
  return {...session,phase:"done",transfer:value};
}
