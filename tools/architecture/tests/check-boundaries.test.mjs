import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {checkFile,validate} from "../check-boundaries.mjs";
function scoped(run){
 const root=mkdtempSync(join(tmpdir(),"yki-ast-"));
 try {
  mkdirSync(join(root,"app"),{recursive:true});
  mkdirSync(join(root,"packages/contracts/src"),{recursive:true});
  writeFileSync(join(root,"app/core.mjs"),"export const pure = 1;");
  writeFileSync(join(root,"app/exam-core.mjs"),"export const pure = 1;");
  writeFileSync(join(root,"packages/contracts/src/index.mjs"),"export const x=1;");
  return run(root);
 } finally {rmSync(root,{recursive:true,force:true});}
}
test("actual syntax tree does not flag comments or string literals",()=>scoped(root=>{
 assert.deepEqual(checkFile(root,"app/core.mjs",
  '// import "react"; localStorage.clear()\nconst text="document.querySelector"; export const value = 2;'),[]);
}));
test("multiline ES imports, reexports and dynamic imports are parsed",()=>scoped(root=>{
 for(const sample of [
  'import {a} from\n "react";',
  'export {x} from "@capacitor/core";',
  'const engine=import("phaser");',
  'const e=import(variable);',
  'const fs=require("node:fs");'
 ])assert.ok(checkFile(root,"app/core.mjs",sample).length,sample);
}));
test("forbid Web platform object access but allow task DTO names",()=>scoped(root=>{
 assert.ok(checkFile(root,"app/core.mjs",'globalThis.localStorage.getItem("k")').length);
 assert.ok(checkFile(root,"app/core.mjs",'document.querySelector("h1")').length);
 assert.deepEqual(checkFile(root,"app/core.mjs",'const obj={document:"meaning"};export {obj};'),[]);
}));
test("domain import cannot point to app or missing sibling",()=>scoped(root=>{
 assert.ok(checkFile(root,"packages/contracts/src/index.mjs",'import x from "../../../app/core.mjs";').length);
 assert.ok(checkFile(root,"app/core.mjs",'import x from "./missing.mjs";').length);
}));
test("current pure modules and future directory discovered by AST",()=>scoped(root=>{
 assert.deepEqual(validate(root),[]);
 mkdirSync(join(root,"packages/domain/src"),{recursive:true});
 writeFileSync(join(root,"packages/domain/src/future.ts"),'import {x} from "dexie";');
 assert.ok(validate(root).some(x=>x.includes("dexie")));
}));
