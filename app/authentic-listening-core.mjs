export const PHASES=Object.freeze(["attempt","repair","transfer","done"]);
export function newSession(){return {phase:"attempt",answers:[]};}
export function nextSession(session,input){
 if(!session||!PHASES.includes(session.phase)||session.phase==="done")throw new Error("Завдання вже завершене.");
 if(typeof input!=="string"||!input.trim()||input.trim().length>4000)throw new Error("Введи власну відповідь (до 4000 символів).");
 const expected=["attempt","repair","transfer"];
 if(session.answers.length!==expected.indexOf(session.phase))throw new Error("Порушено послідовність етапів.");
 const answers=[...session.answers,input.trim()];
 return {phase:PHASES[answers.length],answers};
}
export function currentTask(item,session){
 if(!item||!item.mission||!PHASES.includes(session?.phase))throw new Error("Неправильний урок.");
 const prompts={attempt:item.mission.independent_prompt_fi,repair:item.mission.reflection_uk,transfer:item.mission.transfer_prompt_fi,done:item.mission.delayed_recall_prompt_fi};
 return {phase:session.phase,prompt:prompts[session.phase],firstAttemptRecorded:session.answers.length>=1,feedbackIsGraded:false};
}
export function safePublisherUrl(url){
 if(typeof url!=="string")throw new Error("Некоректний URL.");
 const parsed=new URL(url);
 if(parsed.protocol!=="https:"||parsed.hostname!=="www.kielibuusti.fi"||parsed.username||parsed.password||parsed.port||parsed.hash)throw new Error("Недозволене посилання на джерело.");
 return parsed.href;
}
