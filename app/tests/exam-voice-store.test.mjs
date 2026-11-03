import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve,dirname,join} from "node:path";
import {createMemoryVoiceStore,saveVoiceClip,verifyVoiceClip,normalizeVoiceMime,voiceKey,
  sha256Hex,MAX_VOICE_BYTES} from "../exam-voice-store.mjs";
import {createSession,loadSession,attachVoiceReceipt,removeVoiceReceipt,setVoiceConsent,
  recordVoiceEvidence,voiceEvidenceOf,finishSession,scoreSession,buildItems,sessionIdOf,
  isDeadlineError} from "../exam-core.mjs";
import {speakingEvidenceStatus,E06_STAGE} from "../e06-speaking-evidence-policy.mjs";

const BASE=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const read=p=>JSON.parse(readFileSync(join(BASE,p),"utf8"));
const manifest=read("learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json");
const ids=manifest.blueprints.map(b=>b.id);
const items=buildItems(manifest.blueprints[0],{reading:read("learning/exercises/b1/contextual/reading-pack-v1.json"),
  listening:read("learning/exercises/b1/audio-long/lessons.json"),baseline:read("learning/exercises/b1/diagnostics/baseline-v1.json")});
const speaking=items.find(i=>i.skill==="speaking");
const now=new Date("2026-11-03T10:00:00Z");
const audio=new Uint8Array([26,69,223,163,1,2,3,4,5,6,7,8]);
const consented=()=>setVoiceConsent(createSession(manifest.blueprints[0].id,0,now,"s-test123"),true);
const save=(store,extra={})=>saveVoiceClip(store,{sessionId:"s-test123",taskId:speaking.id,data:audio,
  mimeType:"audio/webm;codecs=opus",durationMs:4321,revision:3,now,...extra});

test("E06-C1: saved clip yields a complete receipt that the E06 contract accepts as REVIEWABLE (still ungraded)",async()=>{
  const store=createMemoryVoiceStore();
  const receipt=await save(store);
  assert.equal(receipt.storageKey,"local-audio:s-test123_"+speaking.id);
  assert.equal(receipt.sha256,await sha256Hex(audio));
  assert.equal(receipt.bytes,audio.byteLength);
  assert.equal(receipt.mimeType,"audio/webm");
  assert.equal(receipt.consentToLocalStorage,true);
  const check=await verifyVoiceClip(store,receipt);
  assert.equal(check.storedHashVerified,true);
  const status=speakingEvidenceStatus({receipt,sessionId:"s-test123",taskId:speaking.id,
    storedBytesVerified:check.storedBytesVerified,storedHashVerified:check.storedHashVerified});
  assert.equal(status.state,"REVIEWABLE_AUDIO_UNGRADED");
  assert.equal(status.officialYkiGrade,null);
});
test("E06-C1: empty, oversized, unknown-format, zero-duration and bad-id recordings are refused",async()=>{
  const store=createMemoryVoiceStore();
  await assert.rejects(save(store,{data:new Uint8Array(0)}),{code:"NO_AUDIO_BYTES"});
  await assert.rejects(save(store,{data:new Uint8Array(MAX_VOICE_BYTES+1)}),{code:"TOO_LARGE"});
  await assert.rejects(save(store,{mimeType:"video/x-matroska"}),{code:"UNSUPPORTED_AUDIO_FORMAT"});
  await assert.rejects(save(store,{durationMs:0}),{code:"NO_DURATION"});
  await assert.rejects(save(store,{revision:0}),{code:"NO_REVISION"});
  await assert.rejects(save(store,{taskId:"x"}),{code:"INVALID_KEY"});
  assert.equal(store._rows.size,0,"nothing persisted for refused clips");
  assert.equal(normalizeVoiceMime("audio/ogg; codecs=opus"),"audio/ogg");
  assert.throws(()=>voiceKey("s 1","t1"));
});
test("E06-C1: write failure surfaces a typed error and issues no receipt",async()=>{
  const store=createMemoryVoiceStore({failPut:()=>true});
  await assert.rejects(save(store),{code:"QUOTA_OR_DISK_FULL"});
});
test("E06-C1: tampered, truncated or deleted bytes fail verification (never claimed as evidence)",async()=>{
  const store=createMemoryVoiceStore();
  const receipt=await save(store);
  const key=receipt.storageKey.slice("local-audio:".length);
  const row=store._rows.get(key);
  const tampered=new Uint8Array(row.bytes);tampered[0]^=1;row.bytes=tampered.buffer;
  assert.deepEqual(await verifyVoiceClip(store,receipt),{storedBytesVerified:true,storedHashVerified:false,data:null,mimeType:"audio/webm"});
  row.bytes=new Uint8Array(3).buffer;
  assert.equal((await verifyVoiceClip(store,receipt)).storedBytesVerified,false);
  await store.delete(key);
  assert.equal((await verifyVoiceClip(store,receipt)).storedHashVerified,false);
  assert.equal((await verifyVoiceClip(store,null)).storedHashVerified,false);
});
test("E06-C1: receipt requires consent, survives reload; ephemeral recording does not",async()=>{
  const store=createMemoryVoiceStore();
  const receipt=await save(store);
  const noConsent=createSession(manifest.blueprints[0].id,0,now,"s-test123");
  assert.throws(()=>attachVoiceReceipt(noConsent,speaking.id,receipt,now),/consent/);
  const s=attachVoiceReceipt(consented(),speaking.id,receipt,now);
  assert.equal(voiceEvidenceOf(s,speaking.id),"stored");
  const restored=loadSession(JSON.stringify(s),ids).session;
  assert.equal(voiceEvidenceOf(restored,speaking.id),"stored");
  assert.equal(restored.voiceConsent,true);
  const ephemeral=recordVoiceEvidence(createSession(manifest.blueprints[0].id,0,now,"s-test123"),speaking.id,true,now);
  assert.equal(voiceEvidenceOf(ephemeral,speaking.id),"ephemeral");
  assert.equal(voiceEvidenceOf(loadSession(JSON.stringify(ephemeral),ids).session,speaking.id),null);
});
test("E06-C1: forged or mismatched receipts are dropped on load and refused on attach",async()=>{
  const store=createMemoryVoiceStore();
  const receipt=await save(store);
  const s=attachVoiceReceipt(consented(),speaking.id,receipt,now);
  for(const forged of [{...receipt,sha256:"abc"},{...receipt,bytes:0},{...receipt,taskId:"other-task"},
    {...receipt,sessionId:"s-someoneelse"},{...receipt,consentToLocalStorage:false}]){
    const raw=JSON.stringify({...s,voiceReceipts:{[speaking.id]:forged}});
    assert.equal(voiceEvidenceOf(loadSession(raw,ids).session,speaking.id),null);
    assert.throws(()=>attachVoiceReceipt(consented(),speaking.id,forged,now));
  }
  assert.equal(voiceEvidenceOf(removeVoiceReceipt(s,speaking.id),speaking.id),null);
});
test("E06-C1: stored speaking answer counts as answered but stays ungraded; deadline still applies",async()=>{
  const store=createMemoryVoiceStore();
  const receipt=await save(store);
  const s=attachVoiceReceipt(consented(),speaking.id,receipt,now);
  const report=scoreSession(items,finishSession(s,now));
  const d=report.details.find(x=>x.id===speaking.id);
  assert.deepEqual([d.status,d.voice],["ungraded","stored"]);
  assert.equal(report.bySkill.speaking.unanswered,0);
  assert.equal(report.officialGrade,null);
  const timed=setVoiceConsent(createSession(manifest.blueprints[0].id,15,now,"s-test123"),true);
  assert.throws(()=>attachVoiceReceipt(timed,speaking.id,receipt,new Date(now.getTime()+900_000)),isDeadlineError);
});
test("E06-C1: legacy sessions without sessionId get a stable derived id",()=>{
  const legacy=createSession(manifest.blueprints[0].id,0,now);
  delete legacy.sessionId;delete legacy.voiceReceipts;delete legacy.voiceConsent;
  const loaded=loadSession(JSON.stringify(legacy),ids).session;
  assert.equal(loaded.sessionId,sessionIdOf(legacy));
  assert.match(loaded.sessionId,/^legacy-\d+$/);
  assert.deepEqual(loaded.voiceReceipts,{});
  assert.equal(loaded.voiceConsent,false);
});
test("E06-C1: live EXAM wiring — consent gate, readback verification, no upload, navigation blocked while recording",()=>{
  const app=readFileSync(join(BASE,"app/exam.mjs"),"utf8");
  assert.equal(E06_STAGE,"PARTIAL_LIVE_LOCAL_AUDIO_RECEIPT");
  for(const needle of ['from "./exam-voice-store.mjs"',"data-voice-consent","saveVoiceClip(","verifyVoiceClip(",
    "dropUnverifiedVoice(","recordingInProgress()","voiceStore.deleteSession(","ніколи не надсилається"])
    assert.ok(app.includes(needle),needle);
  assert.ok(!/fetch\([^)]*(voice|audio|blob)/i.test(app),"no network upload of recordings");
});
