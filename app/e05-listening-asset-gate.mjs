/** E05 isolated listening-asset release policy.
 * REFERENCE ONLY — not imported by active EXAM. Never proves any YKI 2027 equivalence.
 * A human recording is a necessary preference for authentic multi-talker exam work,
 * but not proof of a native speaker, B1/2 difficulty, OPH validity or licensing.
 */
export const E05_STAGE="REFERENCE_ONLY_NOT_LIVE";
export const E05_ALLOWED_POOLS=Object.freeze(["learn","practice-exam","held-out-transfer"]);
export const E05_REVIEW_STATES=Object.freeze(["pending","approved","rejected"]);
const HEX64=/^[a-f0-9]{64}$/i;
const ID=/^[a-z0-9][a-z0-9_-]{3,127}$/i;
const uniq=a=>new Set(a).size===a.length;

/** Asset metadata are explicit, independent attestations — never guessed from synthetic=false. */
export function evaluateListeningAsset(asset,{mode="practice-exam"}={}){
  const failures=[];
  if(!E05_ALLOWED_POOLS.includes(mode))throw new Error("Invalid listening release mode");
  if(!asset||typeof asset!=="object"||Array.isArray(asset))
    return Object.freeze({eligible:false,failures:["INVALID_ASSET"],mode});
  if(!ID.test(asset.id||""))failures.push("INVALID_ID");
  if(typeof asset.path!=="string"||!/^assets\/audio\/.+\.(ogg|mp3|wav)$/i.test(asset.path)
     ||asset.path.includes(".."))failures.push("LOCAL_AUDIO_PATH_REQUIRED");
  if(!HEX64.test(asset.sha256||""))failures.push("FILE_SHA256_REQUIRED");
  if(typeof asset.durationSeconds!=="number"||!Number.isFinite(asset.durationSeconds)
     ||asset.durationSeconds<=0)failures.push("POSITIVE_DURATION_REQUIRED");
  if(!["human-original","human-licensed","tts"].includes(asset.voiceOrigin))
    failures.push("VOICE_ORIGIN_UNKNOWN");
  if(!Array.isArray(asset.speakerIds)||!asset.speakerIds.length||
     asset.speakerIds.some(x=>typeof x!=="string"||!ID.test(x))||!uniq(asset.speakerIds))
    failures.push("VERIFIED_SPEAKERS_REQUIRED");
  if(!["announcement","message","conversation","interview","story","report"].includes(asset.genre))
    failures.push("GENRE_NOT_REVIEWED");
  if(!["standard","colloquial","mixed"].includes(asset.register))
    failures.push("REGISTER_NOT_REVIEWED");
  if(!["gist","detail","inference"].some(x=>Array.isArray(asset.comprehensionTargets)&&
     asset.comprehensionTargets.includes(x)))
    failures.push("MEANING_CONSTRUCT_REQUIRED");
  if(!asset.rights||asset.rights.rehostAllowed!==true||
     typeof asset.rights.sourceUrl!=="string"||
     !asset.rights.sourceUrl.startsWith("https://")||
     !["granted","public-domain-confirmed","original-with-consent"].includes(asset.rights.status))
    failures.push("REDISTRIBUTION_RIGHTS_MISSING");
  if(asset.contentReview?.s2Status!=="approved"||
     !Array.isArray(asset.contentReview?.reviewerIds)||
     !uniq(asset.contentReview.reviewerIds)||
     asset.contentReview.reviewerIds.length<2)
    failures.push("INDEPENDENT_S2_APPROVAL_REQUIRED");
  if(asset.acousticReview?.status!=="approved")
    failures.push("AUDIBLE_QUALITY_NOT_VERIFIED");
  if(asset.cefrDemand?.validated!==true)
    failures.push("LEVEL_DEMAND_NOT_CALIBRATED");
  if(mode!=="learn"){
    if(asset.voiceOrigin==="tts")failures.push("TTS_NOT_AUTHENTIC_EXAM_STIMULUS");
    if(asset.genre==="conversation" && (asset.speakerIds?.length||0)<2)
      failures.push("DIALOGUE_REQUIRES_DISTINCT_VOICES");
    if(asset.testUse?.showTranscriptBeforeSubmission!==false)
      failures.push("EXAM_TRANSCRIPT_LEAKAGE");
    if(asset.testUse?.showAnswerKeyBeforeSubmission!==false)
      failures.push("EXAM_ANSWER_LEAKAGE");
  }
  if(asset.testUse?.pool!==mode)failures.push("POOL_MISMATCH");
  return Object.freeze({eligible:failures.length===0,failures:Object.freeze(failures),mode});
}

/** Never use same waveform/content hash in training/held-out test pools. */
export function validateListeningPoolSeparation(assets){
  if(!Array.isArray(assets))throw new Error("Invalid asset collection");
  const seen=new Map(),violations=[];
  for(const asset of assets){
    if(!asset||typeof asset.id!=="string"||!HEX64.test(asset.sha256||"")||
       !E05_ALLOWED_POOLS.includes(asset.testUse?.pool)){
      violations.push("INVALID_POOL_ASSET");continue;
    }
    const prior=seen.get(asset.sha256);
    if(prior && prior.pool!==asset.testUse.pool)
      violations.push("AUDIO_HASH_CROSSES_POOLS:"+prior.id+":"+asset.id);
    else if(prior&&prior.id!==asset.id)
      violations.push("DUPLICATE_AUDIO_HASH:"+prior.id+":"+asset.id);
    else seen.set(asset.sha256,{id:asset.id,pool:asset.testUse.pool});
  }
  return Object.freeze({isolated:violations.length===0,violations:Object.freeze(violations)});
}
