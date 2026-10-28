/**
 * Live Web LEARN V1 manual JSON backup restoration (NOT V1→V2 migration).
 * Validation reuses the strictly read-only R11 preflight; writes go only to
 * the existing LEARN localStorage key after explicit caller confirmation.
 * No uploads, voice data, EXAM IndexedDB, auto-sync, or teacher grading.
 */
import {STORAGE_KEY,readState} from "./core.mjs";
import {preflightLegacyLearnMigration} from "./r11-legacy-migration-preflight.mjs";

export const LEARN_BACKUP_RESTORE_VERSION=1;
export const LEARN_BACKUP_MAX_FILE_BYTES=8_000_000;

export function inspectLearnBackup(raw) {
  const checked=preflightLegacyLearnMigration(raw);
  if(checked.status!=="ready") return Object.freeze({
    status:"blocked",reason:checked.reason,counts:checked.counts,
    safeToOverwrite:false,requiresConfirmation:true
  });
  // Legacy readState accepts some malformed history records that later
  // renderers expect to have dates/skills. Reject instead of crashing after a
  // confirmed restore. Preserve valid existing V1 records unchanged.
  const parsed=JSON.parse(raw);
  const validDate=x=>typeof x==="string"&&!Number.isNaN(Date.parse(x));
  if(parsed.errors.some(e=>!validDate(e.at)) ||
     parsed.attempts.some(e=>typeof e.firstAnswer!=="string"||
       typeof e.firstCorrect!=="boolean"||
       typeof e.transferText!=="string"||!validDate(e.completedAt)) ||
     parsed.diagnostics.some(e=>!["reading","listening","writing","speaking"].includes(e.skill)||
       !["scored","ungraded"].includes(e.status)||
       !validDate(e.completedAt)||
       (e.status==="scored"&&(!["reading","listening"].includes(e.skill)||
       typeof e.correct!=="boolean"))||
       (e.status==="ungraded"&&e.correct!==undefined))) {
    return Object.freeze({status:"blocked",reason:"INVALID_HISTORY_FOR_ACTIVE_UI",
      counts:checked.counts,safeToOverwrite:false,requiresConfirmation:true});
  }
  return Object.freeze({
    status:"ready",reason:"READY_FOR_EXPLICIT_RESTORE",
    counts:checked.counts,safeToOverwrite:false,requiresConfirmation:true
  });
}
function fail(status,reason,rollbackVerified=null){
  return Object.freeze({status,reason,rollbackVerified});
}
/** Call ONLY after reviewing preview with the learner and getting confirmation.
 * expectedStoredRaw is a mandatory optimistic concurrency token (exact bytes).
 * setItem is synchronous but can throw: never mutate app.state on failure.
 */
export function restoreLearnBackup({storage,raw,expectedStoredRaw}={}) {
  if(!storage||typeof storage.getItem!=="function"||
     typeof storage.setItem!=="function"||
     expectedStoredRaw===undefined ||
     (expectedStoredRaw!==null&&typeof expectedStoredRaw!=="string"))
    return fail("blocked","INVALID_STORAGE_OR_CONCURRENCY_TOKEN");
  const preview=inspectLearnBackup(raw);
  if(preview.status!=="ready")return fail("blocked",preview.reason);
  let before;
  try{before=storage.getItem(STORAGE_KEY);}
  catch{return fail("failed","STORAGE_READ_FAILED");}
  if(before!==expectedStoredRaw)return fail("conflict","STORAGE_CHANGED_SINCE_PREVIEW");
  // The reader is known to be lossless in item counts for accepted input.
  const parsed=readState(raw);
  if(parsed.recovered)return fail("blocked","STATE_READER_REJECTED");
  if(before===raw)return Object.freeze({status:"restored",state:parsed.state,
    counts:preview.counts,changed:false});
  try {
    storage.setItem(STORAGE_KEY,raw);
    if(storage.getItem(STORAGE_KEY)!==raw)throw Error("READBACK_MISMATCH");
  }catch{
    // Attempt rollback and verify it. If we cannot verify, report uncertainty,
    // do not update app.state or claim rollback succeeded.
    try{
      if(before===null) {
        if(typeof storage.removeItem!=="function")throw Error("NO_REMOVE");
        storage.removeItem(STORAGE_KEY);
      }else storage.setItem(STORAGE_KEY,before);
      if(storage.getItem(STORAGE_KEY)!==before)throw Error("ROLLBACK_NOT_VERIFIED");
      return fail("failed","WRITE_FAILED_ROLLED_BACK",true);
    }catch{return fail("uncertain","WRITE_FAILED_ROLLBACK_UNVERIFIED",false);}
  }
  return Object.freeze({status:"restored",state:parsed.state,
    counts:preview.counts,changed:true});
}
