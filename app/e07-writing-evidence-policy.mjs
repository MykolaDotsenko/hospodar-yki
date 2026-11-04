/** E07 editor/task/finalization policy. REFERENCE ONLY — never imported by the active EXAM.
 * No official YKI digital-2027 editor controls, word counts, or AI grades are asserted.
 */
export const E07_STAGE="REFERENCE_ONLY_NOT_LIVE";
export const E07_EXACT_DIGITAL_2027=false;
export const E07_WRITING_FAMILIES=Object.freeze([
  "WRITING_MESSAGE","WRITING_FORMAL","WRITING_OPINION"
]);
const ID=/^[a-z0-9][a-z0-9_-]{2,127}$/i;
const SHA256=/^[a-f0-9]{64}$/i;
const MILESTONES=Object.freeze(["draft","submitted","review"]);
export function createWritingPracticeProfile({kind="practice",maxCharacters=12000}={}){
  if(kind!=="practice")throw new Error("Official 2027 editor profile is unverified");
  if(!Number.isSafeInteger(maxCharacters)||maxCharacters<1||maxCharacters>12000)
    throw new Error("Invalid practice safety limit");
  return Object.freeze({kind:"practice",maxCharacters,official2027:false,
    officialWordCount:null,officialEditorFeatures:null});
}
/** Content requirements validate a potential original asset, NOT its true quality.
 * Reviewer IDs/provenance must be checked by real editors before publication.
 */
export function inspectWritingTask(task){
  const errors=[];
  if(!task||typeof task!=="object"||Array.isArray(task))
    return Object.freeze({eligible:false,errors:Object.freeze(["INVALID_TASK"])});
  if(!ID.test(task.id||""))errors.push("INVALID_TASK_ID");
  if(!E07_WRITING_FAMILIES.includes(task.patternId))errors.push("UNKNOWN_CANONICAL_FAMILY");
  if(typeof task.audience!=="string"||!task.audience.trim())errors.push("AUDIENCE_REQUIRED");
  if(typeof task.communicativeGoal!=="string"||!task.communicativeGoal.trim())
    errors.push("COMMUNICATIVE_GOAL_REQUIRED");
  if(!Array.isArray(task.requiredPoints)||task.requiredPoints.length<2||
      task.requiredPoints.some(p=>typeof p!=="string"||!p.trim()))
    errors.push("REQUIRED_POINTS_MISSING");
  if(task.rights?.status!=="original-authorized"||task.rights?.rehostAllowed!==true)
    errors.push("ORIGINAL_RIGHTS_REQUIRED");
  if(task.s2Review?.approved!==true||!Array.isArray(task.s2Review?.reviewerIds)||
      new Set(task.s2Review.reviewerIds).size<2)
    errors.push("TWO_INDEPENDENT_S2_REVIEWS_REQUIRED");
  if(task.exactDigital2027===true)errors.push("OFFICIAL_DIGITAL_EQUIVALENCE_UNVERIFIED");
  return Object.freeze({eligible:errors.length===0,errors:Object.freeze(errors)});
}
/** Only a byte/character-preserving durable readback is considered a saved draft.
 * A debounced timer, status message, UI keystroke count or a digest in JSON is NOT a receipt.
 */
export function inspectWritingDraftReceipt(receipt,{sessionId,taskId,visibleText,
  storedText=null}={}){
  const errors=[];
  if(!receipt||typeof receipt!=="object"||Array.isArray(receipt))
    return Object.freeze({saved:false,errors:Object.freeze(["MISSING_RECEIPT"])});
  if(!ID.test(receipt.sessionId||"")||(sessionId&&receipt.sessionId!==sessionId))
    errors.push("WRONG_SESSION");
  if(!ID.test(receipt.taskId||"")||(taskId&&receipt.taskId!==taskId))
    errors.push("WRONG_TASK");
  if(!Number.isSafeInteger(receipt.revision)||receipt.revision<1)
    errors.push("NO_DURABLE_REVISION");
  if(!SHA256.test(receipt.contentSha256||""))errors.push("DRAFT_SHA256_MISSING");
  if(receipt.writeCommitted!==true)errors.push("DRAFT_NOT_COMMITTED");
  if(typeof receipt.committedAt!=="string"||!Number.isFinite(Date.parse(receipt.committedAt)))
    errors.push("NO_COMMIT_TIMESTAMP");
  if(typeof visibleText!=="string"||storedText===null||typeof storedText!=="string"||
     visibleText!==storedText)errors.push("DRAFT_READBACK_MISMATCH");
  return Object.freeze({saved:errors.length===0,errors:Object.freeze(errors)});
}
export function canUnlockWritingReview({finishedCommitted=false,receipt=null,sessionId,
  taskId,visibleText,storedText=null,revisionCommitted=false,
  feedbackKind="formative"}={}){
  if(!["formative","official"].includes(feedbackKind))
    throw new Error("Invalid feedback mode");
  if(feedbackKind==="official")
    return Object.freeze({allowed:false,reason:"OFFICIAL_YKI_GRADE_UNAVAILABLE"});
  if(finishedCommitted!==true)
    return Object.freeze({allowed:false,reason:"SEALED_EXAM_NOT_FINISHED"});
  if(revisionCommitted!==true)
    return Object.freeze({allowed:false,reason:"FINISH_REVISION_UNVERIFIED"});
  const check=inspectWritingDraftReceipt(receipt,{sessionId,taskId,visibleText,storedText});
  return Object.freeze({allowed:check.saved,
    reason:check.saved?"POST_EXAM_FORMATIVE_ONLY":"NO_DURABLE_WRITING_DRAFT"});
}
export function canTransitionWriting({phase,compositionActive=false,unsavedDraft=false}={}){
  if(!MILESTONES.includes(phase))throw new Error("Invalid writing phase");
  if(phase!=="draft")return Object.freeze({allowed:false,reason:"FIRST_ATTEMPT_ALREADY_SEALED"});
  if(compositionActive===true)
    return Object.freeze({allowed:false,reason:"IME_COMPOSITION_UNFINISHED"});
  if(unsavedDraft===true)
    return Object.freeze({allowed:false,reason:"DURABLE_DRAFT_REQUIRED"});
  return Object.freeze({allowed:true,reason:"PRACTICE_DRAFT_COMMITTED"});
}
