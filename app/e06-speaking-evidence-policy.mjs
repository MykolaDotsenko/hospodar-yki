/** E06 speaking evidence gate: pure, reference-only contract.
 * NOT imported by the live EXAM; does not save an actual audio blob, claim consent,
 * provide grade 3/4, or reproduce unverified digital-2027 YKI speaking timings.
 */
export const E06_STAGE="REFERENCE_ONLY_NOT_LIVE";
export const E06_EXACT_2027_SPEAKING=false;
export const E06_RESULT_STATE=Object.freeze({
  NO_AUDIO:"NO_AUDIO_EVIDENCE",UNVERIFIED:"UNVERIFIED_AUDIO_REFERENCE",
  READY:"REVIEWABLE_AUDIO_UNGRADED"
});
const ID=/^[a-zA-Z0-9_-]{3,128}$/;
const SHA256=/^[a-f0-9]{64}$/i;
const AUDIO_MIMES=new Set(["audio/webm","audio/ogg","audio/mp4","audio/wav"]);

export function createSpeakingPracticePolicy({kind="practice",prepSeconds=null,responseSeconds=null}={}){
  if(kind!=="practice")throw new Error("Only explicitly-labelled practice sessions are supported");
  for(const seconds of [prepSeconds,responseSeconds]){
    if(seconds!==null && (!Number.isSafeInteger(seconds)||seconds<=0))
      throw new Error("Practice phase must be a positive whole number of seconds or null");
  }
  return Object.freeze({kind:"practice",prepSeconds,responseSeconds,official2027:false,
    source:"CUSTOM_HOSPODAR_TRAINING_ONLY"});
}
/** This validates *metadata*. It cannot prove that audio bytes actually exist.
 * Real release needs an atomic file/blob transaction and independently checked hash.
 */
export function inspectSpeakingReceipt(receipt,{sessionId,taskId}={}){
  const errors=[];
  if(!receipt||typeof receipt!=="object"||Array.isArray(receipt))
    return Object.freeze({valid:false,errors:Object.freeze(["MISSING_RECEIPT"])});
  if(!ID.test(receipt.sessionId||"") || (sessionId && receipt.sessionId!==sessionId))
    errors.push("WRONG_SESSION");
  if(!ID.test(receipt.taskId||"") || (taskId && receipt.taskId!==taskId))
    errors.push("WRONG_TASK");
  if(typeof receipt.storageKey!=="string" || !/^local-audio:[a-zA-Z0-9_-]{3,128}$/.test(receipt.storageKey))
    errors.push("NO_DURABLE_STORAGE_REFERENCE");
  if(!SHA256.test(receipt.sha256||""))errors.push("AUDIO_HASH_MISSING");
  if(!Number.isSafeInteger(receipt.bytes)||receipt.bytes<=0)errors.push("AUDIO_BYTES_MISSING");
  if(!Number.isFinite(receipt.durationMs)||receipt.durationMs<=0)errors.push("POSITIVE_DURATION_REQUIRED");
  if(!AUDIO_MIMES.has(receipt.mimeType))errors.push("UNSUPPORTED_OR_UNVERIFIED_AUDIO_FORMAT");
  if(!Number.isSafeInteger(receipt.revision)||receipt.revision<1)errors.push("NO_COMMIT_REVISION");
  if(receipt.consentToLocalStorage!==true)errors.push("CONSENT_TO_STORAGE_MISSING");
  if(receipt.firstAttemptSealed!==true)errors.push("FIRST_ATTEMPT_NOT_SEALED");
  if(typeof receipt.committedAt!=="string"||!Number.isFinite(Date.parse(receipt.committedAt)))
    errors.push("NO_COMMIT_TIMESTAMP");
  return Object.freeze({valid:errors.length===0,errors:Object.freeze(errors)});
}
/** Audio evidence is recognized only after actual store readback AND byte digest match.
 * A text plan or browser object URL is never equivalent to a captured spoken answer.
 */
export function speakingEvidenceStatus({
  receipt=null,sessionId,taskId,storedBytesVerified=false,storedHashVerified=false
}={}){
  if(!receipt)return Object.freeze({state:E06_RESULT_STATE.NO_AUDIO,reviewable:false,
    officialYkiGrade:null});
  const check=inspectSpeakingReceipt(receipt,{sessionId,taskId});
  if(!check.valid||storedBytesVerified!==true||storedHashVerified!==true)
    return Object.freeze({state:E06_RESULT_STATE.UNVERIFIED,reviewable:false,
      errors:Object.freeze([...check.errors,
        ...(storedBytesVerified===true?[]:["DURABLE_BYTES_NOT_VERIFIED"]),
        ...(storedHashVerified===true?[]:["DURABLE_SHA256_NOT_VERIFIED"])]),
      officialYkiGrade:null});
  return Object.freeze({state:E06_RESULT_STATE.READY,reviewable:true,
    grading:"HUMAN_S2_REVIEW_REQUIRED",officialYkiGrade:null});
}
export function authorizeSpeakingFeedback({finishedCommitted=false,feedbackKind="training",receipt=null,
  sessionId,taskId,storedBytesVerified=false,storedHashVerified=false}={}){
  if(!["training","official"].includes(feedbackKind))throw new Error("Invalid feedback kind");
  if(feedbackKind==="official")return Object.freeze({allowed:false,reason:"NO_OFFICIAL_YKI_GRADING"});
  if(finishedCommitted!==true)return Object.freeze({allowed:false,reason:"SEALED_EXAM_NOT_FINISHED"});
  const evidence=speakingEvidenceStatus({receipt,sessionId,taskId,storedBytesVerified,storedHashVerified});
  return Object.freeze({allowed:evidence.reviewable,reason:evidence.reviewable?
    "POST_EXAM_HUMAN_OR_FORMATIVE_REVIEW_ONLY":"NO_VERIFIED_AUDIO_EVIDENCE"});
}
