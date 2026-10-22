/** Shared domain contracts: no browser, React, Capacitor or DB dependency. */
export const CONTRACT_VERSION = 1;
export const assertId = (id, field = "id") => {
  if (typeof id !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,127}$/.test(id)) throw new TypeError("Invalid " + field);
  return id;
};
export function validateAttempt(command) {
  if (!command || typeof command !== "object") throw new TypeError("Invalid attempt");
  for (const field of ["eventId","sessionId","itemId","contentHash"]) assertId(command[field], field);
  if (!Number.isSafeInteger(command.expectedRevision) || command.expectedRevision < 0) throw new TypeError("Invalid revision");
  if (!Number.isSafeInteger(command.itemVersion) || command.itemVersion < 1) throw new TypeError("Invalid item version");
  if (!["answered","skipped"].includes(command.outcome)) throw new TypeError("Invalid outcome");
  if (command.outcome === "answered" && !Object.hasOwn(command,"response")) throw new TypeError("Missing response");
  return Object.freeze({...command, contractVersion: CONTRACT_VERSION});
}
export class RevisionConflictError extends Error { constructor(){super("Session revision conflict");this.name="RevisionConflictError";} }
export class IdempotencyConflictError extends Error { constructor(){super("Event ID reused with different payload");this.name="IdempotencyConflictError";} }
/** Atomic semantics: append event and advance snapshot or do neither. */
export class InMemoryAttemptRepository {
  #events = new Map(); #sessions = new Map();
  async commitAttempt(input) {
    const command = validateAttempt(input);
    const serialized = JSON.stringify(command);
    const previous = this.#events.get(command.eventId);
    if (previous) {
      if (previous.serialized !== serialized) throw new IdempotencyConflictError();
      return {...previous.result, duplicate:true};
    }
    const revision = this.#sessions.get(command.sessionId)?.revision ?? 0;
    if (revision !== command.expectedRevision) throw new RevisionConflictError();
    const result = Object.freeze({eventId:command.eventId,sessionId:command.sessionId,revision:revision+1,duplicate:false});
    this.#events.set(command.eventId,{serialized,result});
    this.#sessions.set(command.sessionId,{revision:revision+1,lastEventId:command.eventId});
    return result;
  }
  async readSession(sessionId) {assertId(sessionId);return this.#sessions.get(sessionId) ?? null;}
  async countEvents(){return this.#events.size;}
}
/** The platform implementation MUST perform the entire command in one DB transaction. */
export function createRepository(adapter) {
  if (!adapter || typeof adapter.commitAttempt !== "function" || typeof adapter.readSession !== "function") throw new TypeError("Invalid repository adapter");
  return Object.freeze({commitAttempt:async(command)=>adapter.commitAttempt(validateAttempt(command)),readSession:async(id)=>adapter.readSession(assertId(id))});
}

/** V2 session protocol: checkpoint vs independently recalled first-answer evidence. */
export {SESSION_PROTOCOL_VERSION,EVENT_TYPES,CommandError,canonicalJson,
  assertSessionCommand,InMemorySessionRepository,commitSessionWithRecovery} from "./session-v2.mjs";
