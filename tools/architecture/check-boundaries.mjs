#!/usr/bin/env node
/** Real TypeScript Compiler API AST boundary checker, not a regex approximation.
 * Current JS MVP + future portable TS source. This is architectural static QA,
 * not a TypeScript typecheck, Android build, or a security proof.
 */
import ts from "typescript";
import {existsSync,readFileSync,readdirSync,realpathSync} from "node:fs";
import {resolve,relative,dirname,extname,isAbsolute} from "node:path";
import {fileURLToPath} from "node:url";

export const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const knownPure=["app/core.mjs","app/exam-core.mjs"];
const dirs=["packages/contracts/src","packages/domain/src","packages/learning-engine/src","packages/exam-engine/src"];
const extensions=["",".mjs",".js",".ts",".tsx",".json","/index.mjs","/index.ts"];
const badExternal=/^(react(?:\/|$)|react-dom(?:\/|$)|phaser(?:\/|$)|dexie(?:\/|$)|@capacitor(?:\/|$)|@supabase(?:\/|$)|vite(?:\/|$)|next(?:\/|$)|node:)/;
const browserGlobals=new Set(["window","document","localStorage","sessionStorage","indexedDB","navigator","AudioContext","MediaRecorder","SpeechRecognition","webkitSpeechRecognition"]);
function allFiles(path) {
 if(!existsSync(path))return [];
 const rows=[];
 for(const ent of readdirSync(path,{withFileTypes:true})){
  const full=resolve(path,ent.name);
  if(ent.isDirectory())rows.push(...allFiles(full));
  if(ent.isFile() && /\.(mjs|js|ts|tsx)$/.test(ent.name))rows.push(full);
 }
 return rows;
}
export function checkFile(root,rel,contents) {
 const failures=[],file=resolve(root,rel);
 const kind=rel.endsWith(".tsx")?ts.ScriptKind.TSX:rel.endsWith(".ts")?ts.ScriptKind.TS:ts.ScriptKind.JS;
 const sf=ts.createSourceFile(rel,contents,ts.ScriptTarget.Latest,true,kind);
 if(sf.parseDiagnostics?.length)failures.push(rel+": syntax errors in source file");
 const rootReal=realpathSync(root);
 function checkImport(spec){
  if(typeof spec!=="string"){failures.push(rel+": nonliteral dynamic import forbidden in pure domain");return;}
  if(badExternal.test(spec)){failures.push(rel+": framework/host import "+spec);return;}
  if(spec.startsWith("/")||spec.startsWith("\\")){failures.push(rel+": absolute import "+spec);return;}
  if(!spec.startsWith("."))return; // package boundaries allow pure dependencies only
  const absolute=resolve(dirname(file),spec);
  if(!absolute.startsWith(rootReal+"/") && absolute!==rootReal){
    failures.push(rel+": import escapes repository "+spec);return;
  }
  if(!extensions.some(ext=>existsSync(absolute+ext))){
    failures.push(rel+": missing local module "+spec);return;
  }
  const target=relative(root,absolute).replaceAll("\\","/");
  if(rel.startsWith("packages/") && /^(app\/|apps\/|native\/|infrastructure\/|platform\/)/.test(target))
    failures.push(rel+": pure package reverse-imports UI/platform "+spec);
 }
 function visit(node){
  if(ts.isImportDeclaration(node)||ts.isExportDeclaration(node)){
    if(node.moduleSpecifier)checkImport(ts.isStringLiteral(node.moduleSpecifier)?node.moduleSpecifier.text:undefined);
  }else if(ts.isCallExpression(node)){
    const ex=node.expression;
    if(ex.kind===ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(ex)&&ex.text==="require")){
      const arg=node.arguments[0];
      checkImport(arg && ts.isStringLiteral(arg)?arg.text:undefined);
    }
  }else if(ts.isPropertyAccessExpression(node)||ts.isElementAccessExpression(node)){
    if(ts.isIdentifier(node.expression) && browserGlobals.has(node.expression.text))
      failures.push(rel+": platform global "+node.expression.text);
    if(ts.isIdentifier(node.expression) && node.expression.text==="globalThis")
      failures.push(rel+": globalThis platform dependency");
  }else if(ts.isIdentifier(node) && browserGlobals.has(node.text) && node.parent &&
            !ts.isPropertyAccessExpression(node.parent) &&
            ts.isCallExpression(node.parent) && node.parent.expression===node){
    failures.push(rel+": platform global invoked "+node.text);
  }
  ts.forEachChild(node,visit);
 }
 visit(sf);
 return [...new Set(failures)];
}
export function validate(root=ROOT){
 const paths=[...knownPure,...dirs.flatMap(p=>allFiles(resolve(root,p)).map(x=>relative(root,x)))];
 const errors=[];
 for(const rel of paths){
  if(!existsSync(resolve(root,rel))){errors.push(rel+": missing required pure module");continue;}
  errors.push(...checkFile(root,rel,readFileSync(resolve(root,rel),"utf8")));
 }
 return errors;
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const errors=validate();
 for(const error of errors)console.error("FAIL: "+error);
 if(errors.length)process.exitCode=1;
 else console.log("PASS TypeScript AST: pure JS/TS domains contain no framework/platform reverse dependencies");
}
