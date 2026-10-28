/** R10: source-level regression checks. NOT a WCAG conformance certificate
 * or proof of real screen-reader/mobile behavior. */
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join,dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const read=p=>readFileSync(join(ROOT,p),"utf8");
const css=read("app/styles.css"),examCSS=read("app/exam.css");
const pages=[
  ["app/index.html","main","notice"],
  ["app/exam.html","exam-main","exam-notice"],
  ["app/real-life.html","reallife-root","reallife-status"],
  ["app/authentic-listening.html","authentic-root","authentic-status"]
];
const brand=JSON.parse(read("brand/tokens.json"));
function rgb(hex){
  if(!/^#[a-f0-9]{6}$/i.test(hex))throw new Error("six-digit hex required");
  return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
}
function luminance(hex){
  const [r,g,b]=rgb(hex).map(v=>v<=0.04045?v/12.92:((v+.055)/1.055)**2.4);
  return .2126*r+.7152*g+.0722*b;
}
function contrast(a,b){
  const hi=Math.max(luminance(a),luminance(b));
  const lo=Math.min(luminance(a),luminance(b));
  return (hi+.05)/(lo+.05);
}
test("contrast calculation matches WCAG white/black and same-color reference",()=>{
  assert.ok(Math.abs(contrast("#000000","#FFFFFF")-21)<1e-9);
  assert.equal(contrast("#FFFFFF","#FFFFFF"),1);
  assert.throws(()=>contrast("#xyz","#fff"),/six-digit/);
});
test("chosen brand text and keyboard focus colors meet ratios on current pages",()=>{
  for(const background of [brand.colors.surface,brand.colors.paper,brand.colors.learn_tint,brand.colors.exam_tint]){
    assert.ok(contrast(brand.colors.ink,background)>=4.5);
    assert.ok(contrast(brand.colors.primary,background)>=4.5);
  }
  assert.ok(contrast(brand.colors.primary,brand.colors.surface)>=3);
  assert.ok(contrast(brand.colors.accent,brand.colors.surface)<3,
    "gold is decorative, never used as sole keyboard focus indication");
  assert.match(css,/:focus-visible\s*\{outline:3px solid var\(--navy\)/);
  assert.doesNotMatch(css,/:focus-visible\s*\{outline:3px solid var\(--gold\)/);
});
test("all four HTML pages declare Ukrainian, permit mobile zoom and have skip destinations",()=>{
  for(const [file,id] of pages){
    const html=read(file);
    assert.match(html,/<html\b[^>]*lang="uk"/);
    assert.match(html,/<meta\s+name="viewport"\s+content="width=device-width,initial-scale=1"/);
    assert.doesNotMatch(html,/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/i);
    assert.match(html,new RegExp('class="skip"\\s+href="#'+id+'"'));
    assert.match(html,new RegExp('<main id="'+id+'"\\s+tabindex="-1"'));
  }
});
test("each entry page has a status region for updates without unsolicited focus theft",()=>{
  for(const [file,,status] of pages){
    const html=read(file);
    assert.match(html,new RegExp('id="'+status+'"[^>]*role="status"'));
    assert.match(html,/aria-live="polite"/);
    assert.doesNotMatch(html,/autofocus|autoplay/i);
  }
});
test("LEARN and EXAM clearly distinguish independent mode and do not claim OPH endorsement",()=>{
  const learn=read("app/index.html"),exam=read("app/exam.html");
  assert.match(learn,/aria-current="page"/);
  assert.match(exam,/aria-current="page"/);
  assert.match(exam,/Неофіційний тренажер/);
  assert.match(learn,/не OPH і не офіційний YKI/);
});
test("focus retained as visible high-contrast 3px outline in forced-colors mode",()=>{
  assert.match(css,/@media\(forced-colors:active\)\s*\{\s*:focus-visible\{outline:3px solid Highlight/);
  assert.match(css,/:focus-visible\{outline:3px solid var\(--navy\)/);
});
test("native/form controls receive >=44px comfortable targets where audited",()=>{
  assert.match(css,/\.tab,\.radio\{min-height:44px\}/);
  assert.match(css,/\.mode-label\{min-height:44px\}/);
  assert.match(examCSS,/\.back\{display:inline-flex;align-items:center;min-height:44px\}/);
  assert.match(css,/\.btn\{[^}]*min-height:46px/);
});
test("narrow route reflows to two columns with legible type",()=>{
  assert.match(css,/@media\(max-width:380px\)\{[\s\S]*?\.threshold-route\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css,/\.threshold-label\{font-size:\.83rem\}/);
  assert.match(examCSS,/@media\(max-width:380px\)\{[\s\S]*?\.module-grid\{grid-template-columns:1fr\}/);
});
test("audio controls fit panels and media has no automatic sound on page render",()=>{
  assert.match(css,/audio\{max-width:100%;min-width:0\}/);
  for(const file of ["app/app.mjs","app/exam.mjs","app/real-life.mjs","app/authentic-listening.mjs"]){
    const source=read(file);
    assert.doesNotMatch(source,/<audio\b[^>]*\sautoplay\b/i);
  }
});
test("reduced-motion media query and forced-color support remain present",()=>{
  assert.match(css,/@media\s*\(prefers-reduced-motion:no-preference\)/);
  assert.match(css,/@media\(forced-colors:active\)/);
});
test("visual feedback does not depend on color only for the learner's task",()=>{
  const source=read("app/app.mjs");
  assert.match(source,/Правильно з першої спроби/);
  assert.match(source,/Самовиправлення вдалося/);
  assert.match(source,/Перша незалежна спроба/);
});
test("R10 remains a bounded static regression, not an Android/screen-reader test",()=>{
  assert.match(read("docs/TESTING.md"),/R10 static accessibility contracts/);
});
