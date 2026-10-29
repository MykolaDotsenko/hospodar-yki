/** E06 — speaking evidence and official-grade boundary tests.
 * Synthetic receipts only; no actual microphone/media bytes or production E2E tested.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname,resolve,join} from "node:path";
import {fileURLToPath} from "node:url";
import {createSpeakingPracticePolicy,inspectSpeakingReceipt,speakingEvidenceStatus,
  authorizeSpeakingFeedback,E06_STAGE,E06_EXACT_2027_SPEAKING,E06_RESULT_STATE}
  from "../e06-speaking-evidence-policy.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const read=p=>JSON.parse(readFileSync(join(root,p),"utf8"));
const audit=read("research/yki/e06-speaking-evidence-audit-2026-10.json");
const patterns=read("research/yki/yki-official-patterns-v2.json");
const mini=read("learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json");
const receipt=(overrides={})=>({
  sessionId:"exam-session-123",taskId:"speaking-task-123",
  storageKey:"local-audio:blob-123",sha256:"f".repeat(64),
  bytes:12000,durationMs:61000,mimeType:"audio/webm",revision:2,
  consentToLocalStorage:true,firstAttemptSealed:true,committedAt:"2026-10-29T11:12:00.000Z",
  ...overrides
});
const context={sessionId:"exam-session-123",taskId:"speaking-task-123"};
test("E06 research ledger is dated and never declares an operational speaking grader",()=>{
  assert.equal(audit.research_id,"E06");
  assert.equal(audit.checked_at,"2026-10-29");
  assert.equal(audit.live_web_exam_baseline.human_review_run,false);
  assert.equal(audit.user_trials_run,0);
  assert.equal(audit.independent_s2_reviewers_confirmed,0);
  assert.equal(audit.live_audio_persistence_implemented,false);
  assert.equal(audit.official_yki_grade_prediction_allowed,false);
  assert.equal(E06_STAGE,"REFERENCE_ONLY_NOT_LIVE");
  assert.equal(E06_EXACT_2027_SPEAKING,false);
});
test("E06 canonical four families are mapped without creating a second taxonomy",()=>{
  const ids=patterns.patterns.filter(x=>x.skill==="speaking").map(x=>x.id).sort();
  assert.deepEqual(audit.speaking_families.slice().sort(),ids);
  assert.equal(mini.blueprints.length,2);
  assert.deepEqual(audit.live_web_exam_baseline.spoken_task_ids,["d-s1","d-s2"]);
  assert.ok(mini.blueprints.every(x=>x.skill_blocks.filter(b=>b.skill==="speaking").length===1));
  assert.equal(audit.example_studies.length,4);
  assert.ok(audit.example_studies.every(x=>x.media_status==="NOT_RECORDED"));
});
test("E06 sources, twelve risks and nine release gates remain clearly unvalidated",()=>{
  assert.equal(audit.source_evidence.length,12);
  assert.ok(audit.source_evidence.every(s=>s.url.startsWith("https://")));
  assert.equal(audit.risks.length,12);
  assert.equal(new Set(audit.risks.map(r=>r.id)).size,12);
  assert.ok(audit.risks.every(r=>r.current_state==="OPEN"));
  assert.equal(audit.gates.length,9);
  assert.equal(new Set(audit.gates.map(g=>g.id)).size,9);
  assert.ok(audit.gates.every(g=>g.status!=="PASSED"));
});
test("Practice speech phases are explicit; no historic seconds become 2027 rules",()=>{
  const unverified=createSpeakingPracticePolicy();
  assert.equal(unverified.prepSeconds,null);
  assert.equal(unverified.responseSeconds,null);
  assert.equal(unverified.official2027,false);
  const custom=createSpeakingPracticePolicy({kind:"practice",prepSeconds:60,responseSeconds:90});
  assert.equal(custom.responseSeconds,90);
  assert.equal(custom.official2027,false);
  assert.throws(()=>createSpeakingPracticePolicy({kind:"verified-live-2027",prepSeconds:60}));
  for(const seconds of [0,-5,1.2,"60",NaN,Infinity])
    assert.throws(()=>createSpeakingPracticePolicy({prepSeconds:seconds}));
});
test("Receipt schema accepts only complete plausible metadata without falsely proving audio bytes",()=>{
  const ok=inspectSpeakingReceipt(receipt(),context);
  assert.equal(ok.valid,true);
  assert.deepEqual(ok.errors,[]);
  assert.equal(speakingEvidenceStatus({receipt:receipt(),...context}).reviewable,false);
});
test("Missing or wrong session/task, no durable path, hash, duration and bytes all fail",()=>{
  const invalid=inspectSpeakingReceipt(receipt({
    sessionId:"some-other-session",taskId:"some-other-task",
    storageKey:"blob:http://example.org/file",sha256:"not-sha",bytes:0,durationMs:0,
  }),context);
  for(const expected of ["WRONG_SESSION","WRONG_TASK","NO_DURABLE_STORAGE_REFERENCE",
    "AUDIO_HASH_MISSING","AUDIO_BYTES_MISSING","POSITIVE_DURATION_REQUIRED"])
    assert.ok(invalid.errors.includes(expected),expected);
  assert.equal(invalid.valid,false);
});
test("Missing consent, revision, accepted MIME, sealed first attempt and commit date fail",()=>{
  const invalid=inspectSpeakingReceipt(receipt({
    revision:0,consentToLocalStorage:false,firstAttemptSealed:false,
    mimeType:"application/json",committedAt:"yesterday"
  }),context);
  for(const expected of ["NO_COMMIT_REVISION","CONSENT_TO_STORAGE_MISSING",
    "FIRST_ATTEMPT_NOT_SEALED","UNSUPPORTED_OR_UNVERIFIED_AUDIO_FORMAT",
    "NO_COMMIT_TIMESTAMP"])
    assert.ok(invalid.errors.includes(expected),expected);
});
test("Typed notes alone are not speaking evidence and no official grade is emitted",()=>{
  const fakeTyped=speakingEvidenceStatus({...context,textPlan:"Puhuisin tästä huomenna"});
  assert.equal(fakeTyped.state,E06_RESULT_STATE.NO_AUDIO);
  assert.equal(fakeTyped.reviewable,false);
  assert.equal(fakeTyped.officialYkiGrade,null);
  assert.equal(inspectSpeakingReceipt(null,context).valid,false);
});
test("Cannot review an object URL/metadata unless stored bytes and hash were verified",()=>{
  const r=receipt();
  const onlyBytes=speakingEvidenceStatus({receipt:r,...context,storedBytesVerified:true});
  const onlyHash=speakingEvidenceStatus({receipt:r,...context,storedHashVerified:true});
  assert.equal(onlyBytes.reviewable,false);
  assert.ok(onlyBytes.errors.includes("DURABLE_SHA256_NOT_VERIFIED"));
  assert.equal(onlyHash.reviewable,false);
  assert.ok(onlyHash.errors.includes("DURABLE_BYTES_NOT_VERIFIED"));
});
test("Valid synthetic receipt plus separately attested bytes and checksum stays UNGRADED",()=>{
  const status=speakingEvidenceStatus({
    receipt:receipt(),...context,storedBytesVerified:true,storedHashVerified:true});
  assert.equal(status.state,E06_RESULT_STATE.READY);
  assert.equal(status.reviewable,true);
  assert.equal(status.grading,"HUMAN_S2_REVIEW_REQUIRED");
  assert.equal(status.officialYkiGrade,null);
});
test("EXAM feedback remains sealed until a durable finish; grade is never authorized",()=>{
  const opts={receipt:receipt(),...context,storedBytesVerified:true,storedHashVerified:true};
  assert.deepEqual(authorizeSpeakingFeedback({...opts,finishedCommitted:false}),
    {allowed:false,reason:"SEALED_EXAM_NOT_FINISHED"});
  assert.deepEqual(authorizeSpeakingFeedback({...opts,finishedCommitted:true,feedbackKind:"official"}),
    {allowed:false,reason:"NO_OFFICIAL_YKI_GRADING"});
  assert.deepEqual(authorizeSpeakingFeedback({...opts,finishedCommitted:true}),
    {allowed:true,reason:"POST_EXAM_HUMAN_OR_FORMATIVE_REVIEW_ONLY"});
  assert.deepEqual(authorizeSpeakingFeedback({...context,finishedCommitted:true}),
    {allowed:false,reason:"NO_VERIFIED_AUDIO_EVIDENCE"});
});
test("Current exam retains ephemeral-only recording; E06 module is not imported by UI",()=>{
  const app=readFileSync(join(root,"app/exam.mjs"),"utf8");
  const core=readFileSync(join(root,"app/exam-core.mjs"),"utf8");
  assert.ok(app.includes("exam.recorder.onstop=null"));
  assert.ok(app.includes("URL.createObjectURL(new Blob(chunks"));
  assert.ok(app.includes("Голосовий файл не зберігається"));
  assert.ok(!app.includes('from "./e06-speaking-evidence-policy.mjs"'));
  assert.ok(core.includes("voiceRecorded:{}"));
  assert.ok(core.includes("raw audio is ephemeral"));
  assert.equal(audit.reference_only_not_live,true);
});
