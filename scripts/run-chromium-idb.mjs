#!/usr/bin/env node
/**
 * Integration test runner using Chrome DevTools Protocol and built-in Node 22
 * WebSocket, without Puppeteer/Playwright or remote test dependencies.
 * Tests a REAL browser IndexedDB database from app/tests/atomic-idb-browser.html.
 */
import {spawn} from "node:child_process";
import {mkdtemp,readFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {setTimeout as delay} from "node:timers/promises";

const chrome=process.env.CHROME_BINARY||"google-chrome";
const url="http://127.0.0.1:8765/app/tests/atomic-idb-browser.html";
const dir=await mkdtemp(join(tmpdir(),"yki-idb-chrome-"));
const proc=spawn(chrome,[
  "--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
  "--disable-background-networking","--disable-extensions",
  "--remote-debugging-port=0","--remote-allow-origins=*",
  "--user-data-dir="+dir,"--no-first-run","--no-default-browser-check",url
],{stdio:["ignore","ignore","pipe"]});
let chromeDiagnostics="";
proc.stderr?.on("data",chunk=>{
  chromeDiagnostics=(chromeDiagnostics+String(chunk)).slice(-12000);
});
async function port(){
  for(let i=0;i<225;i++){
    if(proc.exitCode!==null)throw Error("Chrome quit before opening DevTools: "+proc.exitCode+"; "+chromeDiagnostics);
    try{
      const raw=await readFile(join(dir,"DevToolsActivePort"),"utf8");
      const p=Number(raw.split("\n")[0]);
      if(Number.isInteger(p)&&p>0)return p;
    }catch{}
    await delay(200);
  }
  throw Error("No Chrome DevTools port after 45 seconds; stderr="+chromeDiagnostics);
}
async function getPage(p){
  for(let i=0;i<120;i++){
    try{
      const res=await fetch(`http://127.0.0.1:${p}/json/list`);
      const tabs=await res.json();
      const found=tabs.find(t=>t.type==="page"&&t.url.includes("atomic-idb-browser.html"));
      if(found)return found;
    }catch{}
    await delay(200);
  }
  throw Error("Test tab was never available; Chrome stderr="+chromeDiagnostics);
}
async function devtools(wsUrl){
  const ws=new WebSocket(wsUrl);
  await new Promise((resolve,reject)=>{
    ws.addEventListener("open",resolve,{once:true});
    ws.addEventListener("error",()=>reject(Error("DevTools socket error")),{once:true});
  });
  let id=0;
  const tasks=new Map();
  ws.addEventListener("message",event=>{
    const response=JSON.parse(event.data);
    const pending=tasks.get(response.id);
    if(!pending)return;
    tasks.delete(response.id);
    if(response.error)pending.reject(Error(response.error.message));
    else pending.resolve(response.result);
  });
  function evaluate(expression){
    return new Promise((resolve,reject)=>{
      const n=++id;
      tasks.set(n,{resolve,reject});
      ws.send(JSON.stringify({id:n,method:"Runtime.evaluate",
        params:{expression,returnByValue:true,awaitPromise:false}}));
    });
  }
  return {ws,evaluate};
}
let session=null;
try{
  const p=await port(),tab=await getPage(p);
  session=await devtools(tab.webSocketDebuggerUrl);
  let last="";
  for(let attempt=0;attempt<200;attempt++){
    const response=await session.evaluate("({status:document.querySelector('#result')?.dataset.result,info:document.querySelector('#result')?.textContent})");
    const value=response?.result?.value;
    if(value?.status==="PASS"){
      console.log("PASS real Chromium IndexedDB:",value.info);
      process.exitCode=0;break;
    }
    if(value?.status==="FAIL")throw Error("Browser test: "+value.info);
    if(value?.status)last=JSON.stringify(value);
    await delay(100);
    if(attempt===199)throw Error("Browser IDB test timed out; last="+last);
  }
}catch(error){
  console.error("FAIL Chromium IndexedDB:",error.message);
  process.exitCode=1;
}finally{
  session?.ws.close();
  proc.kill("SIGTERM");
  await delay(100);
  try{proc.kill("SIGKILL")}catch{}
  await rm(dir,{recursive:true,force:true});
}
