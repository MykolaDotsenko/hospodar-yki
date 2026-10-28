/** R12 bench data invariants only. Not a learner-facing app or ranking engine. */
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join,resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const data=JSON.parse(readFileSync(join(root,"research/benchmark/r12-competitor-evidence-snapshot-2026-10.json"),"utf8"));
const sourceMap=new Map(data.evidenceSources.map(s=>[s.id,s]));
const PROOF=new Set(["official_standard","independent_catalog_review","developer_listing","vendor_claim","scientific_synthesis"]);
const S=new Set(["advertised_or_independent_review","independent_reviewed","source_claimed","repo_source_present","limited","partial_and_unverified","not_implemented","not_verified","unmeasured","unknown"]);
const ids=data.products.map(x=>x.id);
test("R12 is a frozen date-stamped source snapshot, not commercial endorsement",()=>{
  assert.equal(data.researchId,"R12");
  assert.equal(data.evidenceAsOf,"2026-10-28");
  assert.match(data.purpose,/NOT a verified/);
  assert.match(data.conflictsOfInterest,/Hospodar team/);
});
test("benchmark includes Hospodar and eight distinct public alternatives",()=>{
  assert.equal(data.products.length,9);
  assert.equal(new Set(ids).size,9);
  assert.equal(ids.includes("hospodar-yki"),true);
  assert.deepEqual(ids.filter(x=>x!=="hospodar-yki").sort(),[
    "duolingo-finnish","finnish-it","finnly","lukla","speakly","worddive","yki-trainer","yle-ykitreenit"
  ]);
});
test("official OPH anchors are not scored as an extra competitor",()=>{
  assert.equal(data.officialAnchor.productType,"official_ungraded_system_reference_not_competitor");
  assert.equal(ids.some(x=>x.startsWith("oph-")),false);
  assert.deepEqual([...data.officialAnchor.skills].sort(),["listening","reading","speaking","writing"]);
});
test("source IDs unique, strict URLs, no fabricated direct competitors",()=>{
  assert.equal(sourceMap.size,data.evidenceSources.length);
  for(const [id,s] of sourceMap){
    assert.equal(typeof id,"string");
    assert.ok(PROOF.has(s.type));
    assert.ok(/^https:\/\//.test(s.url));
    assert.ok(!s.url.includes("example.com"));
  }
});
test("every reviewed competitor source ref resolves to dated evidence inventory",()=>{
  for(const p of data.products){
    assert.ok(/^https:\/\//.test(p.primaryUrl));
    assert.equal(p.reviewedDate,data.evidenceAsOf);
    const sourceIds=[
      ...Object.values(p.skills).flatMap(x=>x.sourceIds),
      ...Object.values(p.featureClaims).flatMap(x=>x.sourceIds),
      ...(p.price.sourceIds||[])
    ];
    assert.ok(p.id==="hospodar-yki"||sourceIds.length>0,p.id);
    for(const id of sourceIds)assert.ok(sourceMap.has(id),id);
  }
});
test("unknown is distinct from NO for unsupported offline, 2027 fidelity and delayed mastery",()=>{
  for(const p of data.products){
    assert.ok(S.has(p.featureClaims.completeOfflineAtInstall.status));
    assert.ok(S.has(p.featureClaims.faithful2027DigitalExam.status));
    assert.equal(p.featureClaims.delayedIndependentLearningGain.status,"unmeasured",p.id);
    assert.equal(p.independentTrialStatus,"NOT_RUN");
  }
});
test("every product has four explicitly tracked skills with verifiable evidence status",()=>{
  for(const p of data.products){
    assert.deepEqual(Object.keys(p.skills).sort(),["listening","reading","speaking","writing"]);
    for(const v of Object.values(p.skills))assert.ok(S.has(v.status),p.id+" "+v.status);
  }
});
test("no source-level observation is marketed as verified installed-app behavior",()=>{
  for(const p of data.products)assert.equal(p.verifiedInstalledApp,false);
  assert.equal(data.verification.realDeviceCompetitorInstallAuditsRun,0);
});
test("no invented competitor numeric efficacy ratings or winners",()=>{
  for(const p of data.products){
    assert.equal(p.scoreOutOf100,null);
    assert.equal(p.headToHeadWinner,null);
    assert.equal(typeof p.criticalLimit,"string");
  }
  assert.equal(data.rubric.scoreNow,null);
  assert.equal(data.verification.headToHeadTrialsRun,0);
  assert.equal(data.verification.rankingsAuthorized,false);
});
test("proposed expert rubric sums to 100 without outputting unvalidated ranks",()=>{
  assert.equal(data.rubric.maximumPoints,100);
  assert.equal(data.rubric.dimensions.reduce((n,d)=>n+d.weight,0),100);
  assert.equal(new Set(data.rubric.dimensions.map(x=>x.id)).size,data.rubric.dimensions.length);
  assert.ok(data.rubric.dimensions.find(x=>x.id==="delayed_finnish_transfer").weight>=30);
});
test("actual present Finnish it! Ukrainian capability is not falsely claimed unique",()=>{
  const app=data.products.find(x=>x.id==="finnish-it");
  const ours=data.products.find(x=>x.id==="hospodar-yki");
  assert.equal(app.featureClaims.UkrainianInterface.status,"source_claimed");
  assert.equal(ours.featureClaims.UkrainianInterface.status,"repo_source_present");
  assert.ok(app.featureClaims.UkrainianInterface.sourceIds.includes("appstore-finnishit"));
});
test("actual WordDive and Finnish it purchase options have traceable prices",()=>{
  const wd=data.products.find(x=>x.id==="worddive");
  assert.equal(wd.price.amount,10.99);
  assert.equal(wd.price.currency,"EUR");
  assert.ok(wd.price.sourceIds.includes("worddive"));
  const f=data.products.find(x=>x.id==="finnish-it");
  assert.equal(f.price.options.some(x=>x.amount===7.99),true);
  assert.equal(f.price.options.some(x=>x.amount===5.99),true);
});
test("unknown dynamic prices remain unknown instead of made-up EUR amounts",()=>{
  for(const id of ["yki-trainer","lukla","finnly","speakly","duolingo-finnish"]){
    const p=data.products.find(x=>x.id===id);
    assert.equal(p.price.amount,undefined);
    assert.ok(/unknown|in_app/.test(p.price.status),p.price.status);
  }
});
test("Finnly streak/readiness is a Google Play developer claim not certified YKI",()=>{
  const p=data.products.find(x=>x.id==="finnly");
  assert.ok(p.price.sourceIds.includes("play-finnly"));
  assert.equal(p.featureClaims.faithful2027DigitalExam.status,"unknown");
  assert.match(p.criticalLimit,/vendor claims/);
});
test("Yle authentic audio is not automatically scored writing or speaking",()=>{
  const p=data.products.find(x=>x.id==="yle-ykitreenit");
  assert.equal(p.price.amount,0);
  assert.equal(p.skills.reading.status,"independent_reviewed");
  assert.equal(p.skills.listening.status,"independent_reviewed");
  assert.equal(p.skills.writing.status,"limited");
  assert.equal(p.skills.speaking.status,"limited");
});
test("Hospodar unbuilt release and unreviewed S2 material are explicitly disclosed",()=>{
  const h=data.products.find(x=>x.id==="hospodar-yki");
  assert.equal(h.featureClaims.completeOfflineAtInstall.status,"not_implemented");
  assert.equal(h.featureClaims.faithful2027DigitalExam.status,"not_verified");
  assert.equal(h.featureClaims.originalReviewedFinnish.status,"partial_and_unverified");
  assert.equal(data.verification.originalS2ReviewOfR08Drafts,0);
  assert.equal(h.price.status,"not_for_sale");
});
test("official 2027 behavior not declared known just because four demos exist",()=>{
  assert.equal(data.verification.official2027UiControlsVerified,false);
  assert.deepEqual(data.officialAnchor.sourceIds,["oph-yki","oph-pilot"]);
});
test("data source level is not automatically a claim about causal learning gain",()=>{
  for(const p of data.products){
    assert.notEqual(p.featureClaims.delayedIndependentLearningGain.status,"independent_reviewed");
    assert.equal(p.headToHeadWinner,null);
  }
});
test("no paywalled media or copied exercises included as a competitor example bank",()=>{
  assert.equal(Object.hasOwn(data,"rehostedCompetitorExercises"),false);
  assert.equal(Object.hasOwn(data,"copiedMedia"),false);
  assert.equal(data.scope.primaryOutcome.includes("day14"),true);
});
test("different pedagogical skills and non-marketing outcomes are required",()=>{
  assert.ok(data.scope.secondaryOutcomes.includes("consented human-rated speaking"));
  assert.ok(data.scope.secondaryOutcomes.includes("a11y/real offline"));
  assert.ok(data.rubric.dimensions.find(x=>x.id==="oph_digitesti_fidelity").weight>=10);
});
test("each planned advantage is labelled contingent upon delivery",()=>{
  assert.equal(data.competitiveAdvantagesOnlyIfDelivered.length,4);
  assert.match(data.competitiveAdvantagesOnlyIfDelivered.join(" "),/Reviewed/);
  assert.match(data.rubric.reason,/no unbiased total rank/);
});
