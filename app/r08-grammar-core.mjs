/** R08 grammar research reference — no runtime integration or learner state storage.
 * No universal Finnish word-form generator: teacher-approved items+forms only.
 */
export const R08_GRAMMAR_STATUS="RESEARCH_PROTOTYPE_NOT_ACTIVE_APP";
const MAX_TEXT=1600;
const CHOICES=["location","toward","from","negated_object","completed_object","valency","change_state"];
const EVIDENCE="formative_independent_objective_only";
const str=x=>String(x??"").normalize("NFC").trim();
const norm=x=>str(x).replace(/\s+/gu," ").toLocaleLowerCase("fi-FI");
const safe=x=>str(x).slice(0,MAX_TEXT);
const hasOwn=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
export function validateR08Task(task,{requireApproved=false}={}){
  if(!task||typeof task!=="object"||!/^r08-g-\d{3}$/.test(task.id||"")||
    task.mode!=="LEARN"||task.examOnly===true||task.heldOut===true||
    task.origin!=="original_draft"||!["editorial_draft_pending_S2_review","approved_S2"].includes(task.review_status)||
    (requireApproved&&task.review_status!=="approved_S2")||
    task.answerKeyReviewed!== (task.review_status==="approved_S2")||
    typeof task.prompt_fi!=="string"||!task.prompt_fi.includes("___")||
    typeof task.lemma_fi!=="string"||!str(task.lemma_fi)||
    typeof task.semantic_question_uk!=="string"||!str(task.semantic_question_uk)||
    !CHOICES.includes(task.semantic_relation)||!Array.isArray(task.semantic_options)||
    task.semantic_options.length<2||
    new Set(task.semantic_options).size!==task.semantic_options.length||
    !task.semantic_options.every(x=>CHOICES.includes(x))||
    !task.semantic_options.includes(task.semantic_relation)||
    typeof task.answer_fi!=="string"||!str(task.answer_fi)||
    !Array.isArray(task.accepted_alternatives_fi)||
    !task.accepted_alternatives_fi.every(x=>typeof x==="string"&&
      !!str(x)&&norm(x)!==norm(task.answer_fi))||
    new Set(task.accepted_alternatives_fi.map(norm)).size!==task.accepted_alternatives_fi.length||
    typeof task.transfer_prompt_fi!=="string"||!str(task.transfer_prompt_fi)||
    task.transfer_prompt_fi===task.prompt_fi||
    typeof task.explanation_uk!=="string"||!str(task.explanation_uk)||
    !["case_choice","stem_change","valency","object_case"].includes(task.learning_focus)||
    !["transparent","semitransparent"].includes(task.stem_transparency)||
    (task.known_wrong_forms!==undefined && (
      !Array.isArray(task.known_wrong_forms)||
      !task.known_wrong_forms.every(x=>x&&typeof x.form==="string"&&
        x.form.trim()&&x.form!==task.answer_fi&&
        ["case_selection","stem_allomorphy","valency","object_boundedness"].includes(x.error_family))
    )))return false;
  return true;
}
export function createR08Trial(task,mode="LEARN"){
  if(mode!=="LEARN"||!validateR08Task(task,{requireApproved:true}))
    throw new TypeError("R08 requires S2-approved, original, LEARN-only task");
  return Object.freeze({version:1,taskId:task.id,phase:"meaning",supportUsed:[],
    firstMeaning:null,firstForm:null,formEvidence:null,feedback:null,
    repair:null,transfer:null});
}
function ensure(session,task){
  if(!session||session.version!==1||session.taskId!==task?.id||
    !validateR08Task(task,{requireApproved:true}))throw new TypeError("Invalid R08 trial/task");
}
function frozen(s){return Object.freeze({...s,supportUsed:Object.freeze([...s.supportUsed])});}
export function advanceR08(session,task,event){
  ensure(session,task);
  if(!event||typeof event.type!=="string")throw new TypeError("R08 event required");
  const s={...session,supportUsed:[...session.supportUsed]};
  if(event.type==="REQUEST_HELP"&&["meaning","form"].includes(s.phase)){
    if(!["meaning","form"].includes(event.kind))throw new TypeError("Unknown help");
    if(!s.supportUsed.includes(event.kind))s.supportUsed.push(event.kind);
    return frozen(s);
  }
  if(event.type==="CHOOSE_MEANING"&&s.phase==="meaning"){
    if(!task.semantic_options.includes(event.choice))throw new TypeError("Semantic option not available");
    s.firstMeaning={choice:event.choice,independent:s.supportUsed.length===0,
      correct:s.supportUsed.length===0 ? event.choice===task.semantic_relation:null};
    s.phase="form";return frozen(s);
  }
  if(event.type==="SUBMIT_FORM"&&s.phase==="form"){
    const answer=safe(event.answer);
    if(!answer)throw new TypeError("R08 needs a Finnish first answer");
    const independent=s.supportUsed.length===0;
    const accepted=[task.answer_fi,...(task.accepted_alternatives_fi||[])];
    const correct=independent?accepted.some(x=>norm(x)===norm(answer)):null;
    let errorFamily=null;
    if(independent&&correct===false){
      // Labels are editorial keys, never guessed by regex.
      errorFamily=task.known_wrong_forms?.find(x=>norm(x.form)===norm(answer))?.error_family||"unclassified";
    }
    s.firstForm={answer,independent,correct};
    s.formEvidence=independent?EVIDENCE:"supported_ungraded";
    s.feedback={meaningCorrect:s.firstMeaning.correct,formCorrect:correct,
      editorialErrorFamily:errorFamily};
    s.phase="feedback";return frozen(s);
  }
  if(event.type==="SUBMIT_REPAIR"&&s.phase==="feedback"){
    const answer=safe(event.answer);
    if(!answer)throw new TypeError("R08 needs nonempty repair");
    s.repair={answer,status:"guided_ungraded"};
    s.phase="transfer";return frozen(s);
  }
  if(event.type==="SKIP_REPAIR"&&s.phase==="feedback"){
    s.phase="transfer";return frozen(s);
  }
  if(event.type==="SUBMIT_TRANSFER"&&s.phase==="transfer"){
    const answer=safe(event.answer);
    if(!answer)throw new TypeError("R08 needs independent new context response");
    s.transfer={answer,status:"ungraded_new_context",independent:true};
    s.phase="done";return frozen(s);
  }
  throw new TypeError("R08 event not permitted in this phase");
}
/** Return only what a learner can see. Do not render task answer/keys before feedback. */
export function r08View(session,task){
  ensure(session,task);
  const phase=session.phase;
  if(phase==="meaning")return {phase,semanticQuestionUk:task.semantic_question_uk,
    options:[...task.semantic_options],contextFi:task.prompt_fi,
    supportVisible:session.supportUsed.includes("meaning")?(task.meaning_hint_uk||null):null,
    noAudioAutoplay:true};
  if(phase==="form")return {phase,promptFi:task.prompt_fi,lemmaFi:task.lemma_fi,
    supportVisible:session.supportUsed.includes("form")?(task.form_hint_uk||null):null,
    noAudioAutoplay:true};
  if(phase==="feedback")return {phase,meaningRelation:task.semantic_relation,
    answerFi:task.answer_fi,explanationUk:task.explanation_uk,
    meaningCorrect:session.firstMeaning?.correct??null,
    formCorrect:session.firstForm?.correct??null,
    errorFamily:session.feedback?.editorialErrorFamily||null,
    evidence:session.formEvidence,
    // Any visual stem cue belongs AFTER independent form.
    stemCue:task.stem_transparency==="semitransparent"?
      (task.stem_visual_after_answer||null):null};
  if(phase==="transfer")return {phase,transferPromptFi:task.transfer_prompt_fi,
    evidence:"ungraded_new_context",noHints:true};
  return {phase,complete:true,independentForm:session.formEvidence===EVIDENCE,
    transferUngraded:true,noOfficialYkiGrade:true};
}
