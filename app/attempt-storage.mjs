/**
 * Transactional, append-only exam persistence. Same request/result contract on
 * Web (IndexedDB) and future Android (one Kotlin Room @Transaction call).
 * No secret answer keys, media blobs or transcript data in this store.
 */
export const EXAM_DB_NAME = "hospodar-yki:exam:v2";
export const EXAM_RECORD_KEY = "current";
export const EXAM_COMMIT_PROTOCOL = 1;
const EVENT_KINDS = new Set(["start","answer","navigate","finish","legacy-import"]);

export class PersistenceError extends Error {
  constructor(code, message) {super(message); this.name="PersistenceError"; this.code=code;}
}
export function assertCommit(command) {
  if (!command || typeof command!=="object" || command.protocol!==EXAM_COMMIT_PROTOCOL ||
      !/^[a-zA-Z0-9_-]{8,128}$/.test(command.eventId || "") ||
      !EVENT_KINDS.has(command.kind) ||
      !Number.isSafeInteger(command.expectedRevision) || command.expectedRevision<0 ||
      !command.session || command.session.version!==1 ||
      typeof command.session.answers!=="object" ||
      !command.session.answers || Array.isArray(command.session.answers) ||
      typeof command.session.blueprintId!=="string" ||
      typeof command.session.startedAt!=="string") {
    throw new PersistenceError("INVALID_COMMAND","Invalid or unsupported exam commit");
  }
  if (JSON.stringify(command.session).length>250_000) {
    throw new PersistenceError("TOO_LARGE","Exam state exceeds permitted size");
  }
  return command;
}
function fingerprint(cmd) {
  return JSON.stringify([cmd.kind,cmd.expectedRevision,cmd.session]);
}
function result(row, applied) {
  return {applied, revision:row.revision, session:structuredClone(row.session)};
}
function applyCommit(row,cmd) {
  if (row.revision!==cmd.expectedRevision) {
    throw new PersistenceError("REVISION_CONFLICT","Exam was modified in another tab or device");
  }
  return {key:EXAM_RECORD_KEY,revision:row.revision+1,session:structuredClone(cmd.session)};
}
export function createMemoryExamRepository({failWrite=()=>false}={}) {
  let current=null;
  const events=new Map();
  return {
    async readCurrent(){return current?structuredClone(current):null;},
    async readEvent(eventId){return structuredClone(events.get(eventId)||null);},
    async commit(command){
      const cmd=assertCommit(command);
      if(events.has(cmd.eventId)){
        if(events.get(cmd.eventId).fingerprint!==fingerprint(cmd))
          throw new PersistenceError("IDEMPOTENCY_CONFLICT","Event ID reused with different data");
        return result(current,false);
      }
      const next=applyCommit(current||{revision:0},cmd);
      if(failWrite(cmd))throw new PersistenceError("SAVE_FAILED","Simulated storage failure");
      current=next;
      events.set(cmd.eventId,{eventId:cmd.eventId,kind:cmd.kind,revision:next.revision,fingerprint:fingerprint(cmd)});
      return result(next,true);
    },
    async deleteLocal(){current=null;events.clear();},
    async close(){}
  };
}
function openDatabase(indexedDB,dbName) {
  if(!indexedDB)throw new PersistenceError("UNAVAILABLE","IndexedDB is unavailable");
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(dbName,1);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains("sessions"))db.createObjectStore("sessions",{keyPath:"key"});
      if(!db.objectStoreNames.contains("events"))db.createObjectStore("events",{keyPath:"eventId"});
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(new PersistenceError("UNAVAILABLE","Cannot open IndexedDB"));
    req.onblocked=()=>reject(new PersistenceError("BLOCKED","Old database connection blocks upgrade"));
  });
}
export function createIndexedDbExamRepository({indexedDB=globalThis.indexedDB,dbName=EXAM_DB_NAME}={}) {
  const opening=openDatabase(indexedDB,dbName);
  return {
    async readCurrent() {
      const db=await opening;
      return new Promise((resolve,reject)=>{
        const tx=db.transaction("sessions","readonly"),req=tx.objectStore("sessions").get(EXAM_RECORD_KEY);
        let row=null;
        req.onsuccess=()=>{row=req.result||null;};
        tx.oncomplete=()=>resolve(row?structuredClone(row):null);
        tx.onerror=()=>reject(new PersistenceError("READ_FAILED","Unable to read saved exam"));
        tx.onabort=()=>reject(new PersistenceError("READ_FAILED","Exam read aborted"));
      });
    },
    async readEvent(eventId) {
      const db=await opening;
      return new Promise((resolve,reject)=>{
        const tx=db.transaction("events","readonly");
        const req=tx.objectStore("events").get(eventId);
        let event=null;
        req.onsuccess=()=>{event=req.result||null;};
        tx.oncomplete=()=>resolve(event?structuredClone(event):null);
        tx.onabort=()=>reject(new PersistenceError("READ_FAILED","Unable to read event receipt"));
        tx.onerror=()=>{};
      });
    },
    async commit(command) {
      const cmd=assertCommit(command),db=await opening;
      return new Promise((resolve,reject)=>{
        const tx=db.transaction(["sessions","events"],"readwrite");
        const sessions=tx.objectStore("sessions"),events=tx.objectStore("events");
        let output=null,error=null;
        // All reads and writes are queued inside one active IndexedDB transaction.
        const dup=events.get(cmd.eventId);
        dup.onsuccess=()=>{
          const existing=Boolean(dup.result);
          if(existing&&dup.result.fingerprint!==fingerprint(cmd)){
            error=new PersistenceError("IDEMPOTENCY_CONFLICT","Event ID reused with different data");
            tx.abort();return;
          }
          const get=sessions.get(EXAM_RECORD_KEY);
          get.onsuccess=()=>{
            const row=get.result||{key:EXAM_RECORD_KEY,revision:0,session:null};
            try {
              if(existing){
                output=result(row,false);
              } else {
                const next=applyCommit(row,cmd);
                sessions.put(next);
                events.add({eventId:cmd.eventId,kind:cmd.kind,revision:next.revision,fingerprint:fingerprint(cmd)});
                output=result(next,true);
              }
            } catch(e){error=e;tx.abort();}
          };
        };
        tx.oncomplete=()=>resolve(output);
        tx.onabort=()=>reject(error instanceof PersistenceError?error:
          new PersistenceError("SAVE_FAILED","IndexedDB transaction failed; exam was not advanced"));
        tx.onerror=()=>{/* onabort provides one error result */};
      });
    },
    async deleteLocal(){
      const db=await opening;
      return new Promise((resolve,reject)=>{
        const tx=db.transaction(["sessions","events"],"readwrite");
        tx.objectStore("sessions").clear();
        tx.objectStore("events").clear();
        tx.oncomplete=()=>resolve();
        tx.onabort=()=>reject(new PersistenceError("SAVE_FAILED","Unable to clear local exam"));
        tx.onerror=()=>{};
      });
    },
    async close(){(await opening).close();}
  };
}
/** Native bridge must implement ONE atomic Room operation, never a JS callback transaction. */
export function createAndroidExamRepository(nativeBridge) {
  if(!nativeBridge || typeof nativeBridge.commitAttempt!=="function" ||
      typeof nativeBridge.readAttempt!=="function" || typeof nativeBridge.deleteAttempt!=="function"){
    throw new PersistenceError("UNAVAILABLE","HospodarExamStore native bridge not installed");
  }
  return {
    async readCurrent(){
      const row=await nativeBridge.readAttempt({key:EXAM_RECORD_KEY});
      return row?.session?row:null;
    },
    async readEvent(eventId){
      if(typeof nativeBridge.readEvent!=="function")return null; // fail closed on old Android plugins
      const event=await nativeBridge.readEvent({eventId});
      return event?.eventId===eventId?event:null;
    },
    async commit(command){
      const cmd=assertCommit(command);
      const answer=await nativeBridge.commitAttempt({...cmd,key:EXAM_RECORD_KEY});
      if(!answer || !Number.isSafeInteger(answer.revision) || typeof answer.applied!=="boolean" ||
         !answer.session)throw new PersistenceError("PROTOCOL_ERROR","Native Room response invalid");
      return answer;
    },
    async deleteLocal(){await nativeBridge.deleteAttempt({key:EXAM_RECORD_KEY});},
    async close(){}
  };
}
/**
 * If the native or IDB commit succeeded but its Promise rejected (lost ACK),
 * re-read the exact durable event receipt to avoid telling the learner that a saved
 * answer was lost. Conflicts NEVER auto-merge or overwrite another session.
 */
export async function commitWithRecovery(repository,command){
  const cmd=assertCommit(command);
  try{return await repository.commit(cmd);}
  catch(error){
    if(["REVISION_CONFLICT","IDEMPOTENCY_CONFLICT","INVALID_COMMAND","TOO_LARGE"].includes(error?.code))
      throw error;
    // Durable evidence is the exact command receipt. A coincidentally identical
    // snapshot from another tab is NOT an acknowledgment of this event ID.
    let receipt=null,persisted=null;
    try{receipt=await repository.readEvent?.(cmd.eventId);}catch{}
    if(receipt?.eventId===cmd.eventId &&
       receipt?.revision===cmd.expectedRevision+1 &&
       receipt?.fingerprint===fingerprint(cmd)){
      try{persisted=await repository.readCurrent();}catch{}
      if(persisted?.revision===receipt.revision &&
         JSON.stringify(persisted.session)===JSON.stringify(cmd.session))
        return {applied:false,reconciled:true,revision:receipt.revision,session:persisted.session};
    }
    throw error;
  }
}
export function newCommit(session,expectedRevision,kind,uuid=globalThis.crypto?.randomUUID?.()){
  return assertCommit({protocol:EXAM_COMMIT_PROTOCOL,eventId:uuid,expectedRevision,kind,session});
}
