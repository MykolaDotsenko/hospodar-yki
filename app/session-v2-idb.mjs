/** Experimental DURABLE V2 IndexedDB adapter.
 * Separate DB from production Web EXAM V1. No auto-migration or live UI switch.
 * One readwrite transaction commits snapshot, command receipt, and immutable
 * first-attempt uniqueness. Android Room must prove identical semantics later.
 */
import {assertSessionCommand,canonicalJson,CommandError} from "../packages/contracts/src/session-v2.mjs";
export const SESSION_DB_V2="hospodar-yki:session:v2:experimental";
const KEY_RE=/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const firstKey=(sessionId,event)=>canonicalJson([sessionId,event.itemId,event.itemVersion,event.contentHash]);
function open(indexedDB,dbName){
 if(!indexedDB)throw new CommandError("UNAVAILABLE","IndexedDB missing");
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(dbName,1);
  req.onupgradeneeded=()=>{
   const db=req.result;
   for(const [name,key] of [["sessions","sessionId"],["commands","commandId"],["firstAttempts","identity"]]){
    if(!db.objectStoreNames.contains(name))db.createObjectStore(name,{keyPath:key});
   }
  };
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(new CommandError("UNAVAILABLE","V2 IndexedDB open failed"));
  req.onblocked=()=>reject(new CommandError("BLOCKED","V2 upgrade blocked"));
 });
}
export function createIndexedDbSessionRepository({indexedDB=globalThis.indexedDB,dbName=SESSION_DB_V2}={}){
 const opening=open(indexedDB,dbName);
 function read(store,key,project){
  if(!KEY_RE.test(key))return Promise.reject(new CommandError("INVALID_COMMAND"));
  return opening.then(db=>new Promise((resolve,reject)=>{
   const tx=db.transaction(store,"readonly"),req=tx.objectStore(store).get(key);
   let data=null;
   req.onsuccess=()=>{data=req.result||null;};
   tx.oncomplete=()=>resolve(data?structuredClone(project(data)):null);
   tx.onabort=()=>reject(new CommandError("READ_FAILED"));
   tx.onerror=()=>{};
  }));
 }
 return {
  readSession(sessionId){return read("sessions",sessionId,row=>({revision:row.revision,snapshot:row.snapshot}));},
  readReceipt(commandId){return read("commands",commandId,row=>row.receipt);},
  async commit(input){
   const cmd=assertSessionCommand(input),fingerprint=canonicalJson(cmd),db=await opening;
   return new Promise((resolve,reject)=>{
    const tx=db.transaction(["sessions","commands","firstAttempts"],"readwrite");
    const sessions=tx.objectStore("sessions"),commands=tx.objectStore("commands");
    const first=tx.objectStore("firstAttempts");
    let output=null,failure=null;
    function abort(code){
     failure=new CommandError(code);
     tx.abort();
    }
    function write(nextRev){
     const receipt={protocolVersion:2,commandId:cmd.commandId,
      sessionId:cmd.sessionId,revision:nextRev,fingerprint,applied:true,duplicate:false};
     sessions.put({sessionId:cmd.sessionId,revision:nextRev,snapshot:cmd.nextSnapshot});
     commands.add({commandId:cmd.commandId,sessionId:cmd.sessionId,
      fingerprint,eventType:cmd.event.type,itemId:cmd.event.itemId||null,receipt});
     if(cmd.event.type==="first-attempt")
      first.add({identity:firstKey(cmd.sessionId,cmd.event),commandId:cmd.commandId});
     output=receipt;
    }
    const prior=commands.get(cmd.commandId);
    prior.onsuccess=()=>{
     if(prior.result){
      if(prior.result.fingerprint!==fingerprint){abort("IDEMPOTENCY_CONFLICT");return;}
      output={...prior.result.receipt,applied:false,duplicate:true};return;
     }
     const state=sessions.get(cmd.sessionId);
     state.onsuccess=()=>{
      const actual=state.result?.revision??0;
      if(actual!==cmd.expectedRevision){abort("REVISION_CONFLICT");return;}
      const e=cmd.event;
      if(e.type==="first-attempt"){
       const dup=first.get(firstKey(cmd.sessionId,e));
       dup.onsuccess=()=>{
        if(dup.result){abort("FIRST_ATTEMPT_EXISTS");return;}
        write(actual+1);
       };
      }else if(e.type==="repair"||e.type==="transfer"){
       const source=commands.get(e.sourceAttemptId);
       source.onsuccess=()=>{
        if(source.result?.eventType!=="first-attempt"||
           source.result?.sessionId!==cmd.sessionId ||
           source.result?.itemId!==e.itemId){
          abort("INVALID_COMMAND");return;
        }
        write(actual+1);
       };
      }else write(actual+1);
     };
    };
    tx.oncomplete=()=>resolve(structuredClone(output));
    tx.onabort=()=>reject(failure||new CommandError("SAVE_FAILED","V2 transaction aborted"));
    tx.onerror=()=>{};
   });
  },
  async deleteLocal(){
   const db=await opening;
   return new Promise((resolve,reject)=>{
    const tx=db.transaction(["sessions","commands","firstAttempts"],"readwrite");
    for(const name of ["sessions","commands","firstAttempts"])tx.objectStore(name).clear();
    tx.oncomplete=()=>resolve();
    tx.onabort=()=>reject(new CommandError("SAVE_FAILED"));
    tx.onerror=()=>{};
   });
  },
  async close(){(await opening).close();}
 };
}
