/** E01/E02 source-level regression: four OPH demo entrypoints, safe trust boundaries.
 * This does NOT verify Inspera availability, manual UI behavior, browser rendering or 2027 rules.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const app=readFileSync(join(root,"app/exam.mjs"),"utf8");
const ledger=JSON.parse(readFileSync(join(root,"research/yki/yki-digital-fidelity-evidence-2026-10.json"),"utf8"));
const r02=ledger.r02_2026_10_28_official_update;
const recheck=ledger.e01_e02_2026_10_29_recheck;
const welcome=app.slice(app.indexOf("function renderWelcome"),app.indexOf("function renderExam"));
const active=app.slice(app.indexOf("function renderExam"),app.indexOf("function renderFinished"));
const finished=app.slice(app.indexOf("function renderFinished"),app.indexOf("function draw"));

test("E01 source recheck dated and 2027 exact mode still blocked",()=>{
  assert.equal(recheck.checked_at,"2026-10-29");
  assert.equal(recheck.strict_exact_2027_enabled,false);
  assert.deepEqual(recheck.newly_confirmed_digital_ui_parameters,[]);
  assert.equal(recheck.activity_completed.live_manual_demo_walkthrough,false);
  assert.equal(recheck.activity_completed.running_browser_e2e,false);
  assert.equal(r02.simulator_policy.exact_digital_profile_status,"BLOCKED");
  assert.deepEqual(recheck.still_unknown_for_live_2027,r02.still_unknown_for_live_2027);
});

test("E02 four official external demos match unchanged OPH-linked evidence",()=>{
  assert.equal(r02.digital_demo_links.length,4);
  assert.deepEqual(r02.digital_demo_links.map(d=>d.skill),["reading","listening","writing","speaking"]);
  assert.ok(welcome.includes("Офіційні цифрові демоверсії OPH"));
  for(const demo of r02.digital_demo_links){
    const matches=recheck.inspera_demo_recheck.filter(d=>d.skill===demo.skill);
    assert.equal(matches.length,1);
    assert.equal(matches[0].url,demo.url);
    assert.equal(matches[0].result,"HTTP_403_AUTOMATED_WEB_CLIENT");
    assert.equal(matches[0].ui_observed,false);
    assert.equal(matches[0].manual_browser_walkthrough_completed,false);
    assert.equal(matches[0].live_2027_equivalence_verified,false);
    const safeHref=demo.url.replaceAll("&","&amp;");
    assert.ok(welcome.includes('href="'+safeHref+'"'),demo.skill);
    assert.ok(!active.includes(safeHref),"No OPH demo links inside active EXAM");
    assert.ok(!finished.includes(safeHref),"No OPH demo links inside post-exam results");
    assert.ok(welcome.includes('target="_blank" rel="noopener noreferrer"'));
  }
  assert.ok(welcome.includes("OPH не оцінює відповіді"));
  assert.ok(welcome.includes("не гарантія тотожного інтерфейсу"));
});

test("OPH official root source is clearly linked but does not imply rights to copy",()=>{
  assert.ok(welcome.includes("https://www.oph.fi/fi/koulutus-ja-tutkinnot/ennen-yki-testia"));
  assert.match(ledger.rights,/do not commit copyrighted/i);
  assert.equal(r02.simulator_policy.media_reuse,"EXTERNAL_LINK_ONLY_UNLESS_LICENSED");
  assert.ok(app.includes("не перевірені</strong> правила цифрового YKI 2027"));
});

test("no simulated YKI grade asserted by official demo link addition",()=>{
  assert.ok(finished.includes("Не є прогнозом YKI 3 або B1"));
  assert.ok(finished.includes("не оцінюються"));
  assert.ok(welcome.includes("не</strong> повний YKI"));
});
