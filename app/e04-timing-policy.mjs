/** E04 reference-only timing policy for Hospodar EXAM.
 * Not imported by the live EXAM: source-backed timer policy research, not 2027 implementation.
 * No actual digital YKI 2027 durations or behaviour have been verified.
 */
import {PRACTICE_LIMITS_MINUTES} from "./exam-core.mjs";

export const E04_POLICY_STAGE="REFERENCE_ONLY_NOT_LIVE";
export const E04_STRICT_2027_ENABLED=false;
export const E04_ACTIONS=Object.freeze(["answer","navigate","finish","deadline-finish","reveal-results"]);

/** Reject unverified 2027 timing profiles rather than substitute historical seconds. */
export function createTimingProfile({kind,minutes=null,verification=null}={}){
  if(kind==="verified-live-2027") {
    throw new Error("Official digital-2027 timing not confirmed; exact profile BLOCKED");
  }
  if(kind!=="practice" || !PRACTICE_LIMITS_MINUTES.includes(minutes))
    throw new Error("Only explicit 0/15/30/60-minute practice policy is supported");
  if(verification && verification.claimsOfficial===true)
    throw new Error("Practice duration is not official YKI evidence");
  return Object.freeze({kind:"practice",durationMs:minutes*60_000,official2027:false,
    provenance:"HOSPODAR_PRACTICE_ONLY"});
}
function nonnegative(value,label){
  if(typeof value!=="number" || !Number.isFinite(value) || value<0)
    throw new Error(label+" must be a finite nonnegative number");
  return value;
}
function finite(value,label){
  if(typeof value!=="number"|| !Number.isFinite(value))
    throw new Error(label+" must be finite");
  return value;
}
/** Conservative high-watermark: on an active tab, compare clock elapsed with monotonic elapsed.
 * Persisting a watermark helps same-browser restarts, but offline local clock cannot be
 * trusted against intentional changes. A clock anomaly is a warning, never an official score.
 */
export function observePracticeTime(profile,{
  startedAtWallMs,observedWallMs,elapsedMonotonicMs=null,highestElapsedMs=0
}={}){
  if(!profile||profile.kind!=="practice"||!Number.isFinite(profile.durationMs))
    throw new Error("Unverified or absent timing profile");
  finite(startedAtWallMs,"startedAtWallMs");
  finite(observedWallMs,"observedWallMs");
  nonnegative(highestElapsedMs,"highestElapsedMs");
  if(elapsedMonotonicMs!==null)nonnegative(elapsedMonotonicMs,"elapsedMonotonicMs");
  if(profile.durationMs===0)
    return Object.freeze({remainingSeconds:null,expired:false,highestElapsedMs:0,
      clockIntegrity:"NO_TIMER",official2027:false});
  const wallElapsed=observedWallMs-startedAtWallMs;
  const monotonic=elapsedMonotonicMs??0;
  const elapsed=Math.min(profile.durationMs,Math.max(0,wallElapsed,monotonic,highestElapsedMs));
  const discrepant=wallElapsed<0 || (elapsedMonotonicMs!==null &&
    Math.abs(wallElapsed-monotonic)>5_000);
  return Object.freeze({
    remainingSeconds:Math.max(0,Math.ceil((profile.durationMs-elapsed)/1000)),
    expired:elapsed>=profile.durationMs,
    highestElapsedMs:elapsed,
    clockIntegrity:discrepant?"CLOCK_ANOMALY_PRACTICE_ONLY":"PRACTICE_UNVERIFIED",
    official2027:false
  });
}
/** The currently live MVP does NOT use this gate. Future implementation must apply it
 * at each UI command, inside the persistence transaction before acknowledging the event.
 */
export function gatePracticeAction({observation,action,finishCommitted=false}={}){
  if(!observation||typeof observation.expired!=="boolean"||
    !E04_ACTIONS.includes(action))throw new Error("Invalid E04 action or clock observation");
  if(action==="reveal-results"){
    return Object.freeze({allowed:finishCommitted===true,
      reason:finishCommitted?"DURABLE_FINISH_REQUIRED_AND_PRESENT":"NO_FINISH_RECEIPT"});
  }
  if(action==="deadline-finish"){
    return Object.freeze({allowed:observation.expired && finishCommitted===true,
      reason:!observation.expired?"NOT_EXPIRED":
        finishCommitted?"COMMITTED_DEADLINE_FINISH":"DURABLE_FINISH_REQUIRED"});
  }
  if(observation.expired)
    return Object.freeze({allowed:false,reason:"DEADLINE_EXPIRED"});
  return Object.freeze({allowed:true,reason:"PRACTICE_ACTIVE"});
}
