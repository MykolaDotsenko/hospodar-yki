import test from "node:test";import assert from "node:assert/strict";import {createMediaProvider} from "../src/media.mjs";
const asset={mediaId:"audio-1",contentHash:"sha256:abc",mimeType:"audio/mp4",version:1,rights:"redistributable"};
test("provider preserves logical identity",async()=>{const p=createMediaProvider({resolve:async a=>({mediaId:a.mediaId,uri:"https://example.invalid/a.mp4"})});assert.equal((await p.resolve(asset)).mediaId,"audio-1");});
test("external-only assets cannot be redistributed",async()=>{const p=createMediaProvider({resolve:async a=>a});await assert.rejects(p.resolve({...asset,rights:"external_link_only"}),/cannot be bundled/);});
