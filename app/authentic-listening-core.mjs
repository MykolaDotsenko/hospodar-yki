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
 if(parsed.protocol!=="https:"||!["www.kielibuusti.fi","eira.clients.crasman.fi","tasteoffinnish.fi","www.oph.fi"].includes(parsed.hostname)||parsed.username||parsed.password||parsed.port||parsed.hash)throw new Error("Недозволене посилання на джерело.");
 return parsed.href;
}

export function combineVerifiedExternalLessons(original,additional,oph=[]){
 if(!Array.isArray(original)||original.length!==7||!Array.isArray(additional)||additional.length!==8||!Array.isArray(oph)||![0,12].includes(oph.length))throw new Error("Неповний список перевірених джерел.");
 const combined=[...original,...additional,...oph];
 if(new Set(combined.map(x=>x.id)).size!==combined.length)throw new Error("Повторні ідентифікатори уроків.");
 for(const x of combined){
  safePublisherUrl(x.source_page);
  if(x.audio_index_url){
    safePublisherUrl(x.audio_index_url);
    if(x.teacher_page_contains_answers!==true||x.first_attempt_url_policy!=="audio_index_only_hide_teacher_answer_page_until_attempt"||x.source_page===x.audio_index_url)throw new Error("Сторінка з відповідями не захищена від першого перегляду.");
  }
  if(!x.mission||x.media_binaries_imported!==0||x.access!=="external_link_only"||x.graded!==false||x.is_official_yki!==false)throw new Error("Неперевірений зовнішній матеріал або неправильний режим.");
  if(!["audio","video","text"].includes(x.reported_components?.type))throw new Error("Неправильно позначено вид матеріалу.");
 }
 return combined;
}

export function sourceUrlForStage(item,session){
 if(!session||!PHASES.includes(session.phase))throw new Error("Неправильна навчальна фаза.");
 const first=session.phase==="attempt";
 if(item?.audio_index_url){
  if(item.teacher_page_contains_answers!==true||item.first_attempt_url_policy!=="audio_index_only_hide_teacher_answer_page_until_attempt")throw new Error("Відповіді можуть відкритися завчасно.");
  return safePublisherUrl(first?item.audio_index_url:item.source_page);
 }
 return safePublisherUrl(item.source_page);
}
