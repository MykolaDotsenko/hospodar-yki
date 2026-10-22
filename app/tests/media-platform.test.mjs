import test from "node:test";
import assert from "node:assert/strict";
import {MediaError,validateMediaManifest,createWebMediaProvider,createAndroidMediaProvider} from "../media-platform.mjs";
const H="a".repeat(64);
const fixture=()=>({version:1,entries:[{id:"audio-lesson-1",kind:"audio",packId:"audio_fi",
  path:"audio/dialogue-1.m4a",sha256:H,bytes:512,
  rights:{basis:"owned",redistributionAllowed:true}}]});
test("media manifest rejects duplicates, traversals, source links without rights",()=>{
  const ok=fixture();assert.equal(validateMediaManifest(ok).size,1);
  const duplicate=fixture();duplicate.entries.push({...duplicate.entries[0]});
  assert.throws(()=>validateMediaManifest(duplicate),e=>e.code==="BAD_ENTRY");
  for(const path of ["../secret","/private/foo","https://evil.example/bad","../..","a\\b","audio/?x","audio/%2e%2e/admin.m4a","%252e%252e/audio.m4a"]){
    const t=fixture();t.entries[0].path=path;
    assert.throws(()=>validateMediaManifest(t),e=>e.code==="BAD_ENTRY",path);
  }
  const unlicensed=fixture();unlicensed.entries[0].rights.redistributionAllowed=false;
  assert.throws(()=>validateMediaManifest(unlicensed),e=>e.code==="BAD_ENTRY");
});
test("web provider uses same content hash but streams on HTTP(S) without huge cache copy",async()=>{
  const provider=createWebMediaProvider(fixture(),"https://cdn.example.test/assets/");
  assert.deepEqual(await provider.resolve("audio-lesson-1"),{
    mediaId:"audio-lesson-1",kind:"audio",
    src:"https://cdn.example.test/assets/audio/dialogue-1.m4a",
    sha256:H,verifiedHash:false,available:true
  });
  await assert.rejects(()=>provider.resolve("unknown"),e=>e.code==="NOT_FOUND");
  assert.throws(()=>createWebMediaProvider(fixture(),"file:///data"),e=>e.code==="BAD_ORIGIN");
});
test("android provider requires verified hash and native handles (no file://)",async()=>{
  const calls=[];
  const native={
    prepareAsset:async arg=>{calls.push(arg);return {ready:true,handle:"asset-001",verifiedSha256:H};},
    playAsset:async arg=>calls.push(["play",arg]),
    seekAsset:async arg=>calls.push(["seek",arg]),
    stopAsset:async arg=>calls.push(["stop",arg])
  };
  const media=createAndroidMediaProvider(fixture(),native);
  const entry=await media.resolve("audio-lesson-1");
  assert.equal(entry.handle,"asset-001");
  assert.equal(entry.verifiedHash,true);
  assert.equal(entry.src,undefined);
  await media.play("audio-lesson-1");
  await media.seek("audio-lesson-1",900);
  await media.stop("audio-lesson-1");
  assert.equal(calls.length,4);
  await assert.rejects(()=>media.play("audio-lesson-1"),e=>e.code==="NOT_RESOLVED");
  await assert.rejects(()=>media.seek("audio-lesson-1",-3),e=>e.code==="BAD_SEEK");
});
test("native hash mismatch refuses playback",async()=>{
  const provider=createAndroidMediaProvider(fixture(),{
    prepareAsset:async()=>({ready:true,handle:"x",verifiedSha256:"b".repeat(64)}),
    playAsset:async()=>{},seekAsset:async()=>{},stopAsset:async()=>{}
  });
  await assert.rejects(()=>provider.resolve("audio-lesson-1"),e=>e.code==="HASH_MISMATCH");
});
