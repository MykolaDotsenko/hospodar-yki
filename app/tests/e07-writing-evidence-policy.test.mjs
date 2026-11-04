/** E07 exact text and task provenance reference tests. Synthetic fixtures only. */
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve,dirname,join} from "node:path";
import {fileURLToPath} from "node:url";
import {
 E07_STAGE,E07_EXACT_DIGITAL_2027,E07_WRITING_FAMILIES,
 createWritingPracticeProfile,inspectWritingTask,inspectWritingDraftReceipt,
 canUnlockWritingReview,canTransitionWriting
} from "../e07-writing-evidence-policy.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const read=p=>JSON.parse(readFileSync(join(root,p),"utf8"));
const ledger=read("research/yki/e07-writing-editor-evidence-2026-10.json");
const patterns=read("research/yki/yki-official-patterns-v2.json");
const blueprints=read("learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json");
const baseline=read("learning/exercises/b1/diagnostics/baseline-v1.json");
const base={sessionId:"session-test-1",taskId:"writing-test-1"};
const writingText="Hyvää päivää! Voisitteko auttaa? Kiitoksia. Näemme vielä.";
const receipt=(x={})=>({...base,revision:2,contentSha256:"f".repeat(64),
  writeCommitted:true,committedAt:"2026-10-29T10:00:00.000Z",...x});
const task=(x={})=>({id:"original-writing-1",patternId:"WRITING_FORMAL",
  audience:"housing service",communicativeGoal:"request repair",
  requiredPoints:["state defect","ask for visit"],
  rights:{status:"original-authorized",rehostAllowed:true},
  s2Review:{approved:true,reviewerIds:["s2-a","s2-b"]},exactDigital2027:false,...x});
test("E07 research snapshot names actual two writing prompts, ungraded and nonofficial",()=>{
  assert.equal(ledger.research_id,"E07");
  assert.equal(ledger.checked_at,"2026-10-29");
  assert.equal(ledger.current_state.active_mini_count,2);
  assert.equal(ledger.current_state.writing_per_mini,1);
  assert.deepEqual(ledger.current_state.writing_ids,["d-w1","d-w2"]);
  assert.equal(ledger.current_state.automatic_writing_score,"UNGRADED, no YKI 3/4 prediction");
  assert.equal(ledger.implementation_scope.content_items_written,0);
  assert.equal(ledger.implementation_scope.participant_studies,0);
});
test("All three canonical writing families reused, no forked taxonomy",()=>{
  const fromCanonical=patterns.patterns.filter(x=>x.skill==="writing").map(x=>x.id).sort();
  assert.deepEqual([...E07_WRITING_FAMILIES].sort(),fromCanonical);
  assert.deepEqual(ledger.canonical_families.slice().sort(),fromCanonical);
  assert.equal(baseline.writing.length,2);
  for(const blueprint of blueprints.blueprints){
    const w=blueprint.skill_blocks.filter(x=>x.skill==="writing");
    assert.equal(w.length,1);
    assert.ok(baseline.writing.some(x=>x.id===w[0].item_id));
  }
});
test("2027 editor and official word count cannot be manufactured",()=>{
  assert.equal(E07_STAGE,"REFERENCE_ONLY_NOT_LIVE");
  assert.equal(E07_EXACT_DIGITAL_2027,false);
  const p=createWritingPracticeProfile();
  assert.equal(p.kind,"practice");assert.equal(p.official2027,false);
  assert.equal(p.maxCharacters,12000);assert.equal(p.officialWordCount,null);
  assert.equal(p.officialEditorFeatures,null);
  assert.throws(()=>createWritingPracticeProfile({kind:"verified-live-2027"}));
  for(const maxCharacters of [0,12001,3.4,NaN,"2000"])
    assert.throws(()=>createWritingPracticeProfile({maxCharacters}));
  assert.equal(ledger.current_unknowns.official_2027_spellcheck_policy,null);
});
test("Task provenance requires two independent S2 approvals and real genre purpose",()=>{
  assert.equal(inspectWritingTask(task()).eligible,true);
  const x=inspectWritingTask(task({id:"!",patternId:"unverified",audience:"",
    communicativeGoal:"",requiredPoints:["one"],
    rights:{status:"unknown"},s2Review:{approved:false,reviewerIds:["a"]},
    exactDigital2027:true}));
  for(const reason of ["INVALID_TASK_ID","UNKNOWN_CANONICAL_FAMILY","AUDIENCE_REQUIRED",
  "COMMUNICATIVE_GOAL_REQUIRED","REQUIRED_POINTS_MISSING","ORIGINAL_RIGHTS_REQUIRED",
  "TWO_INDEPENDENT_S2_REVIEWS_REQUIRED","OFFICIAL_DIGITAL_EQUIVALENCE_UNVERIFIED"])
    assert.ok(x.errors.includes(reason),reason);
});
test("Synthetic Unicode Finnish draft is recognized only after committed exact readback",()=>{
  const ck=inspectWritingDraftReceipt(receipt(),{...base,
    visibleText:writingText,storedText:writingText});
  assert.equal(ck.saved,true);assert.deepEqual(ck.errors,[]);
});
test("Different input, normalized Unicode or pasted character changes invalidate readback",()=>{
  const expected="Hyvää päivää! Ystävä.";
  const changed="Hyvää päivää! Ysta\u0308vä.";
  assert.notEqual(expected,changed);
  const ck=inspectWritingDraftReceipt(receipt(),{...base,
    visibleText:expected,storedText:changed});
  assert.equal(ck.saved,false);
  assert.ok(ck.errors.includes("DRAFT_READBACK_MISMATCH"));
});
test("Receipt missing commit, revision, digest, session, date cannot authorize persisted state",()=>{
  const ck=inspectWritingDraftReceipt(receipt({
    revision:0,contentSha256:"bad",writeCommitted:false,sessionId:"other-session",
    committedAt:"soon"}),{...base,visibleText:writingText,storedText:writingText});
  for(const s of ["NO_DURABLE_REVISION","DRAFT_SHA256_MISSING",
    "DRAFT_NOT_COMMITTED","WRONG_SESSION","NO_COMMIT_TIMESTAMP"])
    assert.ok(ck.errors.includes(s),s);
});
test("CompositionActive blocks navigation/submit pending actual compositionend+input+save",()=>{
  assert.deepEqual(canTransitionWriting({phase:"draft",compositionActive:true}),
    {allowed:false,reason:"IME_COMPOSITION_UNFINISHED"});
  assert.deepEqual(canTransitionWriting({phase:"draft",unsavedDraft:true}),
    {allowed:false,reason:"DURABLE_DRAFT_REQUIRED"});
  assert.equal(canTransitionWriting({phase:"draft"}).allowed,true);
  assert.equal(canTransitionWriting({phase:"submitted"}).allowed,false);
  assert.throws(()=>canTransitionWriting({phase:"unknown"}));
});
test("Feedback is sealed until durable finish and verified final revision",()=>{
  const props={...base,receipt:receipt(),visibleText:writingText,storedText:writingText};
  assert.deepEqual(canUnlockWritingReview({...props,finishedCommitted:false,revisionCommitted:true}),
    {allowed:false,reason:"SEALED_EXAM_NOT_FINISHED"});
  assert.deepEqual(canUnlockWritingReview({...props,finishedCommitted:true,revisionCommitted:false}),
    {allowed:false,reason:"FINISH_REVISION_UNVERIFIED"});
  assert.equal(canUnlockWritingReview({...props,finishedCommitted:true,revisionCommitted:true}).allowed,true);
});
test("Official YKI 3/4 output cannot be produced by formative tool",()=>{
  assert.deepEqual(canUnlockWritingReview({
    ...base,receipt:receipt(),visibleText:writingText,storedText:writingText,
    finishedCommitted:true,revisionCommitted:true,feedbackKind:"official"}),
  {allowed:false,reason:"OFFICIAL_YKI_GRADE_UNAVAILABLE"});
  assert.throws(()=>canUnlockWritingReview({feedbackKind:"unknown"}));
});
test("12 known risks and ten gates remain unpassed, novel prompts are only briefs",()=>{
  assert.equal(ledger.source_evidence.length,12);
  assert.equal(ledger.risks.length,12);
  assert.equal(ledger.acceptance_gates.length,10);
  assert.equal(new Set(ledger.acceptance_gates.map(x=>x.id)).size,10);
  assert.ok(ledger.acceptance_gates.every(x=>x.status!=="PASSED"));
  assert.equal(ledger.original_genre_briefs.length,5);
  assert.ok(ledger.original_genre_briefs.every(x=>x.draft_status==="BRIEF_ONLY_NOT_S2_REVIEWED"));
});
test("Editor reference is not deployed; live textarea is practice 12000 chars",()=>{
  const app=readFileSync(join(root,"app/exam.mjs"),"utf8");
  const core=readFileSync(join(root,"app/exam-core.mjs"),"utf8");
  assert.ok(app.includes('lang="fi" maxlength="12000"'));
  assert.ok(app.includes("},250)"));
  assert.ok(app.includes('root.addEventListener("input",'));
  assert.ok(!app.includes('from "./e07-writing-evidence-policy.mjs"'));
  assert.equal(core.includes("MAX_ANSWER_CHARS = 12000"),true);
  assert.equal(ledger.implementation_scope.live_editor_fix,"NOT_DONE");
});
