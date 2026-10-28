/**
 * R11 REFERENCE ONLY: non-destructive preflight for LEARN localStorage V1.
 * Does not read browser storage, write a new DB, export answers, or migrate.
 * Future migration requires explicit user-visible exact raw backup, mapping,
 * atomic destination commit, receipt check, and a verified rollback plan.
 */
import {readState,VERSION,INTERVAL_DAYS} from "./core.mjs";
export const R11_STATUS="REFERENCE_ONLY_NO_DATA_MIGRATION";
export const R11_PREVIEW_VERSION=1;
const MAX_LEGACY_CHARS=8_000_000;
const ALLOWED_ROOT=new Set(["version","attempts","cards","diagnostics","errors","retention"]);
const ALLOWED_CARD=new Set(["stage","due","reviews","failures","lastCorrect","lastReviewed"]);
const ENTRY_ID=/^[a-z\d_-]{1,100}$/i;
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const MAX_COUNTS=Object.freeze({attempts:120,diagnostics:120,errors:160,retention:120});
const plain=x=>x!==null&&typeof x==="object"&&!Array.isArray(x) &&
  (Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null);
const result=(status,reason,counts)=>Object.freeze({
  version:R11_PREVIEW_VERSION,status,reason,
  readonly:true,noStorageWrites:true,noAccountOrNetwork:true,
  mustBackupExactOriginalBytesBeforeImport:status==="ready",
  verifyDestinationReceiptAndKeepRollbackCopy:status==="ready",
  canStartMigrationWithoutSeparatePR:false,
  counts:counts?Object.freeze({...counts}):null
});
function validDate(s){
  if(typeof s!=="string"||!DATE.test(s))return false;
  const [y,m,d]=s.split("-").map(Number);
  const t=new Date(Date.UTC(y,m-1,d));
  return t.getUTCFullYear()===y&&t.getUTCMonth()+1===m&&t.getUTCDate()===d;
}
function count(shape){
  return {
    attempts:shape.attempts.length,diagnostics:shape.diagnostics.length,
    errors:shape.errors.length,retention:(shape.retention||[]).length,
    cards:Object.keys(shape.cards).length
  };
}
/**
 * Returns ONLY non-PII metadata. Use original raw string as exact backup,
 * never `JSON.stringify(parsed)` as a replacement for its original bytes.
 */
export function preflightLegacyLearnMigration(raw){
  if(raw===null||raw===undefined||raw==="")return result("empty","NO_OLD_STATE");
  if(typeof raw!=="string"||raw.length>MAX_LEGACY_CHARS)
    return result("blocked","NOT_STRING_OR_TOO_LARGE");
  let original;
  try{original=JSON.parse(raw);}catch{return result("blocked","INVALID_JSON");}
  if(!plain(original))return result("blocked","INVALID_ROOT");
  if(original.version!==VERSION)return result("blocked","UNSUPPORTED_VERSION");
  if(Object.keys(original).some(k=>!ALLOWED_ROOT.has(k)))
    return result("blocked","UNKNOWN_ROOT_FIELDS");
  if(!Array.isArray(original.attempts)||!Array.isArray(original.diagnostics)||
     !Array.isArray(original.errors)||!plain(original.cards)||
     (Object.hasOwn(original,"retention")&&!Array.isArray(original.retention)))
    return result("blocked","INVALID_LEGACY_SHAPE");
  const counts=count(original);
  for(const [name,max] of Object.entries(MAX_COUNTS))
    if(counts[name]>max)return result("blocked","HISTORY_WOULD_BE_TRUNCATED",counts);
  if(original.attempts.some(x=>!plain(x)||typeof x.taskId!=="string")||
     original.diagnostics.some(x=>!plain(x)||typeof x.skill!=="string")||
     original.errors.some(x=>!plain(x)||typeof x.taskId!=="string"))
    return result("blocked","INVALID_LEGACY_ENTRY",counts);
  if(Object.entries(original.cards).some(([id,card])=>
       !ENTRY_ID.test(id)||!plain(card)||
       Object.keys(card).some(k=>!ALLOWED_CARD.has(k))||
       !Number.isInteger(card.stage)||card.stage<0||card.stage>INTERVAL_DAYS.length||
       !validDate(card.due)||
       (card.reviews!==undefined&&(!Number.isInteger(card.reviews)||card.reviews<0))||
       (card.failures!==undefined&&(!Number.isInteger(card.failures)||card.failures<0))||
       (card.lastCorrect!==undefined&&typeof card.lastCorrect!=="boolean")||
       (card.lastReviewed!==undefined&&typeof card.lastReviewed!=="string")
     ))return result("blocked","INVALID_OR_UNRECOGNIZED_CARD",counts);
  // Use the currently shipping, actual V1 reader to detect any data silently
  // dropped by its filtering/retention rules. Do not mutate the original bytes.
  const parsed=readState(raw);
  if(parsed.recovered||!parsed.state)return result("blocked","LEGACY_READER_FAILED",counts);
  const actual=count(parsed.state);
  for(const key of Object.keys(counts))
    if(counts[key]!==actual[key])return result("blocked","LEGACY_READER_WOULD_DROP_DATA",counts);
  return result("ready","LOSSLESS_PREFLIGHT_ONLY",counts);
}
/** Deterministic user-facing recovery state; not proof of committed storage. */
export function r11SaveMessage(status){
  if(status==="confirmed")return Object.freeze({
    label_uk:"Відповідь збережена локально.",
    canAdvance:true,graded:false,
    caveat_uk:"Локальні дані все ще потребують резервної копії."
  });
  if(status==="uncertain")return Object.freeze({
    label_uk:"Збереження не підтверджено. Перевіряємо точну квитанцію запису.",
    canAdvance:false,graded:false,
    caveat_uk:"Не надсилати нову спробу та не показувати правильну відповідь."
  });
  if(status==="failed")return Object.freeze({
    label_uk:"Не вдалося зберегти відповідь. Не переходь далі без резервного збереження.",
    canAdvance:false,graded:false,
    caveat_uk:"Повтори запис або експортуй поточну чернетку вручну."
  });
  if(status==="media_missing")return Object.freeze({
    label_uk:"Для цього аудіозавдання немає перевіреного локального запису.",
    canAdvance:false,graded:false,
    caveat_uk:"Текстова альтернатива може бути навчальною, але не оцінкою аудіювання."
  });
  throw new TypeError("Unknown R11 UI state");
}
