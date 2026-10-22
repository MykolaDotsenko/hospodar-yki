import test from "node:test";
import assert from "node:assert/strict";
import {InMemoryAttemptRepository,RevisionConflictError,IdempotencyConflictError,createRepository} from "../src/index.mjs";
const attempt=(overrides={})=>({eventId:"event-1",sessionId:"session-1",itemId:"item-1",contentHash:"sha256:abcdef",itemVersion:1,expectedRevision:0,outcome:"answered",response:"Hei!",...overrides});
test("atomic commit and idempotent retry",async()=>{const repo=createRepository(new InMemoryAttemptRepository());assert.equal((await repo.commitAttempt(attempt())).revision,1);assert.equal((await repo.commitAttempt(attempt())).duplicate,true);assert.equal((await repo.readSession("session-1")).revision,1);});
test("optimistic concurrency prevents lost updates",async()=>{const repo=createRepository(new InMemoryAttemptRepository());await repo.commitAttempt(attempt());await assert.rejects(repo.commitAttempt(attempt({eventId:"event-2"})),RevisionConflictError);});
test("event id collision rejects altered payload",async()=>{const repo=createRepository(new InMemoryAttemptRepository());await repo.commitAttempt(attempt());await assert.rejects(repo.commitAttempt(attempt({response:"Changed"})),IdempotencyConflictError);});
test("invalid response and ids rejected before persistence",async()=>{const repo=createRepository(new InMemoryAttemptRepository());await assert.rejects(repo.commitAttempt(attempt({eventId:"bad id"})),TypeError);await assert.rejects(repo.commitAttempt(attempt({outcome:"answered",response:undefined,itemVersion:0})),TypeError);});
