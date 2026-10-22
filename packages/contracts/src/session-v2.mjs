/** One portable V2 command model, without UI, database, browser or native deps.
 * EXPERIMENTAL V2: the existing Web exam remains on protocol V1 until an
 * explicit import/migration with successful on-device tests is provided.
 */
export const SESSION_PROTOCOL_VERSION = 2;
export const EVENT_TYPES = Object.freeze(["checkpoint","first-attempt","repair","transfer"]);
const id = value => typeof value==="string" && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(value);
const plain = value => value !== null && typeof value==="object" &&
  (Object.getPrototypeOf(value)===Object.prototype || Object.getPrototypeOf(value)===null);

export class CommandError extends Error {
  constructor(code,message=code){super(message);this.name="CommandError";this.code=code;}
}
export function canonicalJson(value) {
  // Never reorder arrays, normalize learner's Finnish text or convert undefined
  // to null. Reject ambiguous/unrepresentable JSON before fingerprinting.
  const walk = (v,stack) => {
    if(v===null || typeof v==="string" || typeof v==="boolean")return v;
    if(typeof v==="number" && Number.isFinite(v) && Number.isSafeInteger(v))return v;
    if(Array.isArray(v)){
      if(stack.has(v))throw new CommandError("INVALID_COMMAND","Circular data");
      stack.add(v);const x=v.map(item=>walk(item,stack));stack.delete(v);return x;
    }
    if(plain(v)){
      if(stack.has(v))throw new CommandError("INVALID_COMMAND","Circular data");
      stack.add(v);
      const x={};
      for(const key of Object.keys(v).sort())x[key]=walk(v[key],stack);
      stack.delete(v);
      return x;
    }
    throw new CommandError("INVALID_COMMAND","Non-JSON or unsafe numeric value");
  };
  return JSON.stringify(walk(value,new Set()));
}
export function assertSessionCommand(input) {
  if(!plain(input)||input.protocolVersion!==SESSION_PROTOCOL_VERSION||
     !id(input.commandId)||!id(input.sessionId)||
     !Number.isSafeInteger(input.expectedRevision)||input.expectedRevision<0||
     !plain(input.event)||!EVENT_TYPES.includes(input.event.type)||
     !plain(input.nextSnapshot))
    throw new CommandError("INVALID_COMMAND","Invalid V2 envelope");
  const event=input.event;
  if(event.type==="first-attempt"){
    if(!id(event.itemId)||!Number.isSafeInteger(event.itemVersion)||event.itemVersion<1||
       !/^sha256:[a-f0-9]{64}$/.test(event.contentHash||"")||
       !["answered","skipped"].includes(event.outcome)||
       event.hintUsed!==false||
       (event.outcome==="answered" && !Object.hasOwn(event,"response")))
      throw new CommandError("INVALID_COMMAND","First attempt requires stable content and no hints");
  }else if(event.type==="repair"||event.type==="transfer"){
    if(!id(event.itemId)||!id(event.sourceAttemptId)||
       event.assessmentStatus!=="ungraded")
      throw new CommandError("INVALID_COMMAND","Repair/transfer must link first attempt and remain ungraded");
  }else if(event.type==="checkpoint" && event.assessmentStatus!==undefined){
    throw new CommandError("INVALID_COMMAND","Checkpoint cannot claim assessment");
  }
  const serialized=canonicalJson(input);
  if(serialized.length>250_000)throw new CommandError("TOO_LARGE");
  return JSON.parse(serialized);
}
const firstKey=(session,event)=>canonicalJson([session,event.itemId,event.itemVersion,event.contentHash]);
/** In-memory REFERENCE only, not a durable IndexedDB/Room implementation. */
export class InMemorySessionRepository {
  #sessions=new Map(); #commands=new Map(); #firstAttempts=new Map();
  async readSession(sessionId){
    if(!id(sessionId))throw new CommandError("INVALID_COMMAND");
    return structuredClone(this.#sessions.get(sessionId)||null);
  }
  async readReceipt(commandId){
    if(!id(commandId))throw new CommandError("INVALID_COMMAND");
    return structuredClone(this.#commands.get(commandId)?.receipt||null);
  }
  async countCommands(){return this.#commands.size;}
  async commit(input){
    const command=assertSessionCommand(input),fingerprint=canonicalJson(command);
    const previous=this.#commands.get(command.commandId);
    if(previous){
      if(previous.fingerprint!==fingerprint)throw new CommandError("IDEMPOTENCY_CONFLICT");
      return {...structuredClone(previous.receipt),applied:false,duplicate:true};
    }
    const current=this.#sessions.get(command.sessionId);
    const revision=current?.revision??0;
    if(revision!==command.expectedRevision)throw new CommandError("REVISION_CONFLICT");
    const event=command.event;
    if(event.type==="first-attempt"){
      const key=firstKey(command.sessionId,event);
      if(this.#firstAttempts.has(key))throw new CommandError("FIRST_ATTEMPT_EXISTS");
    }else if(event.type==="repair"||event.type==="transfer"){
      if(!this.#commands.has(event.sourceAttemptId) ||
         this.#commands.get(event.sourceAttemptId)?.eventType!=="first-attempt" ||
         this.#commands.get(event.sourceAttemptId)?.sessionId!==command.sessionId)
        throw new CommandError("INVALID_COMMAND","Missing source first attempt");
    }
    const receipt={protocolVersion:2,commandId:command.commandId,
      sessionId:command.sessionId,revision:revision+1,fingerprint,applied:true,duplicate:false};
    const next={revision:revision+1,snapshot:structuredClone(command.nextSnapshot)};
    // All preconditions checked before atomic in-memory updates. Persisted
    // platform adapters MUST transact command/receipt, event and snapshot together.
    this.#sessions.set(command.sessionId,next);
    this.#commands.set(command.commandId,{fingerprint,receipt,eventType:event.type,
      sessionId:command.sessionId});
    if(event.type==="first-attempt")this.#firstAttempts.set(firstKey(command.sessionId,event),command.commandId);
    return structuredClone(receipt);
  }
}
/** Reconciliation is id-based; matching snapshots are NEVER proof of a command. */
export async function commitSessionWithRecovery(repository,input){
  const cmd=assertSessionCommand(input),fingerprint=canonicalJson(cmd);
  try{return await repository.commit(cmd);}
  catch(error){
    if(["REVISION_CONFLICT","IDEMPOTENCY_CONFLICT","INVALID_COMMAND",
        "PROTOCOL_MISMATCH","FIRST_ATTEMPT_EXISTS","TOO_LARGE"].includes(error?.code))throw error;
    let receipt=null;
    try{receipt=await repository.readReceipt(cmd.commandId);}catch{}
    if(receipt?.commandId===cmd.commandId &&
       receipt?.sessionId===cmd.sessionId &&
       receipt?.revision===cmd.expectedRevision+1 &&
       receipt?.fingerprint===fingerprint)
      return {...receipt,applied:false,duplicate:true,reconciled:true};
    throw error;
  }
}
