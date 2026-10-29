/** E05: rights, independent S2 review, waveform identity and EXAM separation.
 * All positive objects below are SYNTHETIC TEST FIXTURES, never published audio.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname,resolve,join} from "node:path";
import {fileURLToPath} from "node:url";
import {E05_STAGE,evaluateListeningAsset,validateListeningPoolSeparation} from "../e05-listening-asset-gate.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const read=path=>JSON.parse(readFileSync(join(root,path),"utf8"));
const audit=read("research/yki/e05-authentic-listening-audit-2026-10.json");
const lessons=read("learning/exercises/b1/audio-long/lessons.json");
const library=read("assets/audio/library.json");
const patterns=read("research/yki/yki-official-patterns-v2.json");
const manifest=read("learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json");

const mock=(changes={})=>({
 id:"test-fi-interview",
 path:"assets/audio/fictional/fixture.ogg",
 sha256:"a".repeat(64),durationSeconds:120,
 voiceOrigin:"human-original",speakerIds:["voice-a1","voice-b2"],
 genre:"conversation",register:"mixed",
 comprehensionTargets:["gist","detail"],
 rights:{rehostAllowed:true,status:"original-with-consent",sourceUrl:"https://example.org/fixture"},
 contentReview:{s2Status:"approved",reviewerIds:["reviewer-a","reviewer-b"]},
 acousticReview:{status:"approved"},cefrDemand:{validated:true},
 testUse:{pool:"practice-exam",showTranscriptBeforeSubmission:false,showAnswerKeyBeforeSubmission:false},
 ...changes
});
test("E05 audit is a dated 2026 source/repository snapshot, NOT certified audio",()=>{
 assert.equal(audit.research_id,"E05");assert.equal(audit.checked_at,"2026-10-29");
 assert.equal(audit.implementation_scope.new_audio_files,0);
 assert.equal(audit.implementation_scope.live_exam_audio_player_changes,0);
 assert.equal(audit.implementation_scope.human_review_completed,false);
 assert.equal(audit.implementation_scope.live_2027_exact_status,"BLOCKED");
 assert.equal(E05_STAGE,"REFERENCE_ONLY_NOT_LIVE");
});
test("Library and six B1 long lessons have real pending synthetic provenance",()=>{
 assert.equal(library.entries.length,85);
 assert.equal(library.counts.total_files,85);
 assert.equal(lessons.lessons.length,6);
 assert.equal(manifest.blueprints.length,2);
 assert.equal(audit.baseline.long_b1_lessons,6);
 assert.equal(audit.baseline.long_b1_synthetic_count,6);
 assert.equal(audit.baseline.long_b1_distinct_voices,1);
 const voices=new Set();
 for(const item of lessons.lessons){
  assert.equal(item.synthetic_audio,true);
  assert.equal(item.voice_count,1);
  assert.equal(item.teacher_review,"pending");
  assert.equal(item.teacher_audio_review,"pending");
  assert.equal(item.cefr_level_verified,false);
  assert.equal(item.training_only,true);
  assert.equal(item.official_yki,false);
  assert.ok(Number.isFinite(item.duration_seconds));
  assert.match(item.sha256,/^[a-f0-9]{64}$/);
  assert.equal(item.questions.length,4);
  assert.ok(item.questions.every(q=>typeof q.correct_index==="number"));
  voices.add(item.speaker);
 }
 assert.deepEqual([...voices],["Piper fi_FI-harri-medium"]);
 for(const b of manifest.blueprints){
  const block=b.skill_blocks.find(x=>x.skill==="listening");
  assert.equal(block.question_ids.length,4);
  assert.ok(lessons.lessons.some(x=>x.id===block.item_id));
 }
});
test("Canonical listening family coverage comes from existing YKI source taxonomy",()=>{
 const ids=patterns.patterns.filter(p=>p.skill==="listening").map(p=>p.id).sort();
 assert.deepEqual(ids,["LISTENING_MCQ","LISTENING_OPEN","LISTENING_TF"]);
 assert.equal(audit.baseline.current_listening_task_family,"3-option multiple choice only");
 assert.equal(audit.candidate_original_scenario_briefs.length,6);
 assert.ok(audit.candidate_original_scenario_briefs.every(x=>x.draft_status==="NOT_SCRIPTED_NOT_RECORDED"));
});
test("Human metadata fixture is eligible after all attestations, but not a real recording",()=>{
 const result=evaluateListeningAsset(mock());
 assert.equal(result.eligible,true);
 assert.deepEqual(result.failures,[]);
 assert.equal(result.mode,"practice-exam");
});
test("Missing file identity or duration fails closed",()=>{
 const a=evaluateListeningAsset(mock({sha256:"not-sha",durationSeconds:0,path:"../secret.wav",id:"?"}));
 assert.equal(a.eligible,false);
 for(const issue of ["FILE_SHA256_REQUIRED","POSITIVE_DURATION_REQUIRED","LOCAL_AUDIO_PATH_REQUIRED","INVALID_ID"])
  assert.ok(a.failures.includes(issue));
});
test("TTS, missing authentic dialogue voices and leaked key or transcript fail exam",()=>{
 const o=evaluateListeningAsset(mock({
  voiceOrigin:"tts",speakerIds:["voice-a1"],
  testUse:{pool:"practice-exam",showTranscriptBeforeSubmission:true,showAnswerKeyBeforeSubmission:true}
 }));
 for(const issue of ["TTS_NOT_AUTHENTIC_EXAM_STIMULUS","DIALOGUE_REQUIRES_DISTINCT_VOICES",
                     "EXAM_TRANSCRIPT_LEAKAGE","EXAM_ANSWER_LEAKAGE"])
  assert.ok(o.failures.includes(issue),issue);
});
test("Rights, speaker provenance, language and actual acoustic/S2 review are mandatory",()=>{
 const r=evaluateListeningAsset(mock({
  rights:{status:"unknown",rehostAllowed:false,sourceUrl:""},
  speakerIds:[],genre:"mystery",register:"unknown",comprehensionTargets:[],
  contentReview:{s2Status:"pending",reviewerIds:["a"]},
  acousticReview:{status:"pending"},cefrDemand:{validated:false}
 }));
 for(const key of ["REDISTRIBUTION_RIGHTS_MISSING","VERIFIED_SPEAKERS_REQUIRED","GENRE_NOT_REVIEWED",
  "REGISTER_NOT_REVIEWED","MEANING_CONSTRUCT_REQUIRED","INDEPENDENT_S2_APPROVAL_REQUIRED",
  "AUDIBLE_QUALITY_NOT_VERIFIED","LEVEL_DEMAND_NOT_CALIBRATED"])
  assert.ok(r.failures.includes(key),key);
});
test("Practice/learn pools must be explicit; TTS may be labelled LEARN-only",()=>{
 const learn=mock({voiceOrigin:"tts",testUse:{pool:"learn",showTranscriptBeforeSubmission:true,
  showAnswerKeyBeforeSubmission:true}});
 assert.equal(evaluateListeningAsset(learn,{mode:"learn"}).eligible,true);
 assert.ok(evaluateListeningAsset(learn).failures.includes("POOL_MISMATCH"));
 assert.throws(()=>evaluateListeningAsset(learn,{mode:"official-yki-2027"}));
});
test("Content SHA separates training and held-out pools, independent of different IDs",()=>{
 const sameHashInOtherPool=mock({id:"test-other-fi",testUse:{pool:"held-out-transfer",
  showTranscriptBeforeSubmission:false,showAnswerKeyBeforeSubmission:false}});
 const result=validateListeningPoolSeparation([mock(),sameHashInOtherPool]);
 assert.equal(result.isolated,false);
 assert.ok(result.violations.some(v=>v.startsWith("AUDIO_HASH_CROSSES_POOLS")));
});
test("Independent asset hashes may occupy separate pools",()=>{
 const a=mock(),b=mock({id:"test-other-fi",sha256:"b".repeat(64),testUse:{pool:"held-out-transfer",
  showTranscriptBeforeSubmission:false,showAnswerKeyBeforeSubmission:false}});
 const r=validateListeningPoolSeparation([a,b]);
 assert.equal(r.isolated,true);
 assert.deepEqual(r.violations,[]);
});
test("E05 scientific sources and eight gates never falsely assert outcomes",()=>{
 assert.equal(audit.source_evidence.length,8);
 assert.ok(audit.source_evidence.every(s=>s.url.startsWith("https://")));
 assert.equal(audit.content_release_gates.length,8);
 assert.equal(new Set(audit.content_release_gates.map(g=>g.id)).size,8);
 assert.ok(audit.content_release_gates.every(g=>g.status==="NOT_DONE"||
  g.status==="BLOCKED_E02_E04"||g.status==="NOT_RUN"));
 assert.equal(audit.trial_plan.status,"NOT_RUN");
});
test("EXAM player has only practice playback and reference gate is not active",()=>{
 const app=readFileSync(join(root,"app/exam.mjs"),"utf8");
 assert.ok(app.includes("<audio controls"));
 assert.ok(app.includes("не підтверджене"));
 assert.ok(!app.includes('from "./e05-listening-asset-gate.mjs"'));
 assert.equal(audit.implementation_scope.added_reference_gate_only,true);
});
