/** E03 source and existing-mini content coverage regression.
 * Static contract only. It does not measure S2 accuracy, 2027 YKI live fidelity, or user efficacy.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join, resolve, dirname} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read=(path)=>JSON.parse(readFileSync(join(root,path),"utf8"));
const official=read("research/yki/yki-official-patterns-v2.json");
const audit=read("research/yki/e03-construct-task-coverage-audit-2026-10.json");
const mini=read("learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json");
const reading=read("learning/exercises/b1/contextual/reading-pack-v1.json");
const listening=read("learning/exercises/b1/audio-long/lessons.json");
const baseline=read("learning/exercises/b1/diagnostics/baseline-v1.json");
const rows=audit.family_mapping;
const map=new Map(rows.map(row=>[row.pattern_id,row]));
const SKILLS=["reading","listening","writing","speaking"];
const sourceIds=new Set([
  ...reading.items.flatMap(item=>[item.id,...item.questions.map(q=>q.id)]),
  ...listening.lessons.flatMap(lesson=>[lesson.id,...lesson.questions.map(q=>q.id)]),
  ...baseline.writing.map(item=>item.id),
  ...baseline.speaking.map(item=>item.id)
]);
test("E03 audit is dated, correctly scoped and not an official 2027 test specification",()=>{
  assert.equal(audit.research_id,"E03");
  assert.equal(audit.checked_at,"2026-10-29");
  assert.match(audit.status,/S2|HUMAN/);
  assert.equal(audit.official_2027_live_profile.verified_for_live_2027,false);
  assert.equal(audit.official_2027_live_profile.reading_item_count,null);
  assert.equal(audit.official_2027_live_profile.listening_item_count,null);
  assert.equal(audit.official_2027_live_profile.writing_item_count,null);
  assert.equal(audit.official_2027_live_profile.speaking_item_count,null);
  assert.equal(audit.official_2027_live_profile.timing_seconds,null);
  assert.equal(audit.official_2027_live_profile.task_family_quotas,null);
  assert.ok(audit.non_accomplishments.some(v=>v.includes("No manual Inspera")));
});
test("E03 references every canonical pattern exactly once; never forks 9/6 taxonomy",()=>{
  assert.equal(rows.length,13);
  assert.equal(map.size,13);
  assert.deepEqual([...map.keys()].sort(),official.patterns.map(x=>x.id).sort());
  assert.equal(official.topic_taxonomy.length,9);
  assert.equal(official.communication_functions.length,6);
  assert.equal(audit.reference_family_count,13);
  assert.equal(audit.authoritative_pattern_path,"research/yki/yki-official-patterns-v2.json");
});
test("Two existing mini forms have precisely 3+4+1+1 units, no fictitious full YKI claim",()=>{
  assert.equal(mini.blueprints.length,2);
  assert.equal(mini.not_official_yki,true);
  assert.equal(mini.exact_digital_format_verified,false);
  assert.equal(mini.human_cefr_calibrated,false);
  assert.equal(audit.mini_blueprints_count,2);
  for(const b of mini.blueprints){
    assert.deepEqual(b.skill_blocks.map(s=>s.skill),SKILLS);
    const n=b.skill_blocks.map(s=>s.question_ids?.length||1);
    assert.deepEqual(n,[3,4,1,1]);
    assert.equal(n.reduce((a,b)=>a+b,0),9);
  }
  assert.deepEqual(audit.current_mini_each,{reading:3,listening:4,writing:1,speaking:1,total:9});
});
test("Derived baseline family counts preserve gaps and human review caveats",()=>{
  const valid=new Set(["STRUCTURAL_PRESENT_UNREVIEWED","PARTIAL_UNREVIEWED","NOT_REPRESENTED"]);
  const tallies={};
  for(const row of rows){
    assert.ok(valid.has(row.status));
    assert.equal(row.human_s2_approved,false);
    assert.equal(row.live_2027_equivalence_verified,false);
    assert.equal(typeof row.observation,"string");
    assert.ok(row.observation.length>24);
    tallies[row.status]=(tallies[row.status]||0)+1;
    if(row.status==="NOT_REPRESENTED")assert.equal(row.example_internal_ids.length,0);
    else assert.ok(row.example_internal_ids.length>0);
    for(const id of row.example_internal_ids)assert.ok(sourceIds.has(id),"Missing internal ID "+id);
  }
  assert.deepEqual(tallies,audit.family_status_counts);
  assert.deepEqual(tallies,{STRUCTURAL_PRESENT_UNREVIEWED:6,NOT_REPRESENTED:5,PARTIAL_UNREVIEWED:2});
});
test("E03 listening and speaking gaps are not relabeled as verified features",()=>{
  for(const id of ["LISTENING_TF","LISTENING_OPEN","WRITING_MESSAGE","SPEAKING_NARRATIVE","SPEAKING_DIALOGUE"])
    assert.equal(map.get(id).status,"NOT_REPRESENTED");
  assert.equal(map.get("SPEAKING_SITUATIONS").status,"PARTIAL_UNREVIEWED");
  assert.equal(map.get("WRITING_FORMAL").status,"PARTIAL_UNREVIEWED");
  assert.equal(map.get("READING_OPEN").status,"STRUCTURAL_PRESENT_UNREVIEWED");
});
test("E03 cites meaningful first-party links and no copied OPH task content",()=>{
  assert.ok(audit.external_primary_sources.length>=7);
  for(const src of audit.external_primary_sources){
    assert.ok(src.url.startsWith("https://"),src.url);
    assert.ok(src.supports.length>30);
  }
  assert.match(audit.rights_policy,/original/i);
  assert.match(audit.intended_planning_coverage.quota_policy,/NEVER_OFFICIAL_ITEM_COUNTS/);
  assert.ok(Object.values(audit.intended_planning_coverage.skill_focus).every(x=>x.length>=5));
  assert.deepEqual(Object.keys(audit.intended_planning_coverage.skill_focus).sort(),[...SKILLS].sort());
});
test("Eight acceptance gates require independently validated S2 and user outcomes",()=>{
  assert.equal(audit.quality_gates.length,8);
  assert.equal(new Set(audit.quality_gates.map(g=>g.id)).size,8);
  assert.ok(audit.quality_gates.every(g=>g.status!=="PASSED"));
  assert.ok(audit.quality_gates.some(g=>g.criterion.includes("S2")));
  assert.ok(audit.quality_gates.some(g=>g.criterion.includes("Held-out")));
  assert.ok(audit.quality_gates.some(g=>g.status==="BLOCKED_BY_E01_E02"));
});
