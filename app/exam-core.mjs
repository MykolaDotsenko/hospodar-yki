/** Pure and browser-independent model for independent YKI-pattern rehearsals.
 * It is NOT official YKI software and never emits YKI grades.
 */
export const EXAM_STORAGE_KEY = "hospodar-yki:digitesti-rehearsal:v1";
export const EXAM_STATE_VERSION = 1;
export const MAX_ANSWER_CHARS = 12000;
export const PRACTICE_LIMITS_MINUTES = [0, 15, 30, 60];

export function buildItems(blueprint, content) {
  if (!blueprint || !Array.isArray(blueprint.skill_blocks) || blueprint.skill_blocks.length !== 4) {
    throw new Error("Expected one source-linked item for each of four skills");
  }
  const items=[];
  for (const block of blueprint.skill_blocks) {
    if (block.skill === "reading") {
      const original = content.reading.items.find(item=>item.id===block.item_id);
      if (!original) throw new Error(`Missing reading source ${block.item_id}`);
      for (const qid of block.question_ids) {
        const q = original.questions.find(x=>x.id===qid);
        if(!q) throw new Error(`Missing question ${qid}`);
        const kind=q.type==="single_choice"?"choice":q.type==="true_false"?"boolean":"text";
        items.push({
          id:qid,skill:"reading",kind,sourceId:original.id,heading:original.title_fi,
          passage:original.text_fi,
          prompt:q.prompt_fi||q.statement_fi,
          ...(kind==="choice"?{options:q.options_fi,correct:q.correct_index}:{}),
          ...(kind==="boolean"?{options:["Oikein","Väärin"],correct:q.answer===true?"true":"false"}:{})
        });
      }
    } else if(block.skill==="listening") {
      const original=content.listening.lessons.find(item=>item.id===block.item_id);
      if(!original) throw new Error(`Missing audio source ${block.item_id}`);
      for (const qid of block.question_ids) {
        const q=original.questions.find(x=>x.id===qid);
        if(!q) throw new Error(`Missing audio question ${qid}`);
        items.push({
          id:qid,skill:"listening",kind:"choice",
          sourceId:original.id,heading:original.title_fi,prompt:q.prompt_fi,
          audioPath:original.path,audioOrigin:original.synthetic_audio?"synthetic":"human",
          options:q.options_fi,correct:q.correct_index
        });
      }
    } else if(["writing","speaking"].includes(block.skill)){
      const original=content.baseline[block.skill].find(x=>x.id===block.item_id);
      if(!original) throw new Error(`Missing productive prompt ${block.item_id}`);
      items.push({id:original.id,skill:block.skill,kind:"text",sourceId:original.id,
        prompt:original.prompt_fi,requiredPoints:original.required_points_fi||[]});
    } else throw new Error("Unexpected skill");
  }
  if(new Set(items.map(x=>x.id)).size!==items.length)throw new Error("Duplicate item ID");
  return items;
}

export function createSession(blueprintId,minutes=0,now=new Date()){
  if(!/^yki-mini-[a-z0-9-]+$/.test(blueprintId))throw new Error("Unknown blueprint id");
  if(!PRACTICE_LIMITS_MINUTES.includes(minutes))throw new Error("Unsupported practice timer");
  if(Number.isNaN(now.getTime()))throw new Error("Invalid now");
  return {version:EXAM_STATE_VERSION,blueprintId,timeLimitMinutes:minutes,
    startedAt:now.toISOString(),finishedAt:null,
    index:0,answers:{},voiceRecorded:{},lastSavedAt:now.toISOString()};
}
export function loadSession(raw,blueprintIds) {
  if(!raw)return {session:null,recovered:false};
  try {
    const s=JSON.parse(raw);
    if(!s || s.version!==EXAM_STATE_VERSION || !blueprintIds.includes(s.blueprintId) ||
      !PRACTICE_LIMITS_MINUTES.includes(s.timeLimitMinutes) ||
      typeof s.startedAt!=="string" || Number.isNaN(Date.parse(s.startedAt)) ||
      !(s.finishedAt===null || typeof s.finishedAt==="string") ||
      !Number.isInteger(s.index)||s.index<0||s.index>100||
      typeof s.answers!=="object" || !s.answers || Array.isArray(s.answers) ||
      typeof s.voiceRecorded!=="object" || !s.voiceRecorded || Array.isArray(s.voiceRecorded)){
      throw new Error("Invalid state");
    }
    const answers={};
    for(const [id,answer] of Object.entries(s.answers)){
      if(/^[a-z0-9_-]{1,110}$/i.test(id) && typeof answer==="string")
        answers[id]=answer.slice(0,MAX_ANSWER_CHARS);
    }
    const voiceRecorded={};
    for(const [id,v] of Object.entries(s.voiceRecorded)){
      if(/^[a-z0-9_-]{1,110}$/i.test(id))voiceRecorded[id]=v===true;
    }
    return {session:{...s,answers,voiceRecorded},recovered:false};
  }catch{
    return {session:null,recovered:true};
  }
}
export function remainingSeconds(session,now=new Date()) {
  if(!session || !session.timeLimitMinutes)return null;
  const end=Date.parse(session.startedAt)+session.timeLimitMinutes*60_000;
  return Math.max(0,Math.ceil((end-now.getTime())/1000));
}
export function writeAnswer(session,itemId,answer,now=new Date()) {
  if(session.finishedAt)throw new Error("Rehearsal finished");
  if(!/^[a-z0-9_-]{1,110}$/i.test(itemId))throw new Error("Invalid task ID");
  if(typeof answer!=="string")throw new Error("Invalid response");
  return {...session,answers:{...session.answers,[itemId]:answer.slice(0,MAX_ANSWER_CHARS)},
    lastSavedAt:now.toISOString()};
}
export function goToIndex(session,index,itemCount) {
  if(session.finishedAt)throw new Error("Finished");
  if(!Number.isInteger(index)||index<0||index>=itemCount)throw new Error("Invalid task index");
  return {...session,index};
}
export function recordVoiceEvidence(session,itemId,hasAudio) {
  if(session.finishedAt)throw new Error("Finished");
  return {...session,voiceRecorded:{...session.voiceRecorded,[itemId]:hasAudio===true}};
}
export function finishSession(session,now=new Date()) {
  return {...session,finishedAt:session.finishedAt||now.toISOString(),lastSavedAt:now.toISOString()};
}
export function scoreSession(items,session) {
  if(!session.finishedAt)throw new Error("Cannot reveal assessment before finishing");
  const bySkill={reading:{correct:0,objective:0,ungraded:0,unanswered:0},
    listening:{correct:0,objective:0,ungraded:0,unanswered:0},
    writing:{correct:0,objective:0,ungraded:0,unanswered:0},
    speaking:{correct:0,objective:0,ungraded:0,unanswered:0}};
  const details=[];
  for(const t of items){
    const answer=String(session.answers[t.id]??"").trim();
    const recorded=session.voiceRecorded[t.id]===true;
    const hasAnswer=answer.length>0||recorded;
    if(!hasAnswer){bySkill[t.skill].unanswered++;details.push({id:t.id,skill:t.skill,status:"unanswered"});continue;}
    if(t.kind==="choice"||t.kind==="boolean"){
      const correct=t.kind==="choice" ? answer===String(t.correct) : answer===t.correct;
      bySkill[t.skill].objective++;
      if(correct)bySkill[t.skill].correct++;
      details.push({id:t.id,skill:t.skill,status:correct?"correct":"incorrect",correct:t.correct});
    }else{
      bySkill[t.skill].ungraded++;
      details.push({id:t.id,skill:t.skill,status:"ungraded"});
    }
  }
  return {bySkill,details,officialGrade:null,ykiPassPrediction:null,
    qualification:"Objective-key accuracy only; open responses not assessed; no YKI grade."};
}
