/**
 * Shared, validated media manifest and platform adapters. Native install-time
 * packs are NEVER exposed as file:// URLs or copied to IndexedDB.
 */
export class MediaError extends Error {
  constructor(code,message){super(message);this.name="MediaError";this.code=code;}
}
const NAME=/^[a-z0-9][a-z0-9._-]{1,99}$/i;
const HASH=/^[a-f0-9]{64}$/;
function safePath(s){
  return typeof s==="string" && s.length<400 && s[0]!=="/" &&
    !s.startsWith("//") && !s.includes("\\") && !s.includes("?") &&
    !s.includes("#") && !s.includes(":") &&
    s.split("/").every(x=>x!=="" && x!=="." && x!=="..");
}
export function validateMediaManifest(manifest){
  if(!manifest||manifest.version!==1||!Array.isArray(manifest.entries))
    throw new MediaError("BAD_MANIFEST","Invalid media manifest version");
  const ids=new Set(),out=new Map();
  for(const e of manifest.entries){
    if(!e||!NAME.test(e.id||"")||ids.has(e.id)||
       !["audio","video"].includes(e.kind)||
       !NAME.test(e.packId||"")||!safePath(e.path)||
       !HASH.test(e.sha256||"")||!Number.isSafeInteger(e.bytes)||e.bytes<0||
       !e.rights||e.rights.redistributionAllowed!==true||
       !["owned","licensed"].includes(e.rights.basis)){
      throw new MediaError("BAD_ENTRY","Invalid, duplicate or unlicensed media entry");
    }
    ids.add(e.id);out.set(e.id,Object.freeze({...e}));
  }
  return out;
}
function requireEntry(entries,id){
  const entry=entries.get(id);
  if(!entry)throw new MediaError("NOT_FOUND","Unknown media asset");
  return entry;
}
export function createWebMediaProvider(manifest,baseUrl){
  const entries=validateMediaManifest(manifest);
  const base=new URL(baseUrl);
  if(!["https:","http:"].includes(base.protocol)||!base.pathname.endsWith("/"))
    throw new MediaError("BAD_ORIGIN","Web media requires HTTP(S) folder origin");
  return {
    async resolve(id){
      const e=requireEntry(entries,id);
      const url=new URL(e.path,base);
      if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname))
        throw new MediaError("BAD_ORIGIN","Media escaped permitted folder");
      return {mediaId:id,kind:e.kind,src:url.href,sha256:e.sha256,
        verifiedHash:false,available:true};
    }
  };
}
export function createAndroidMediaProvider(manifest,native){
  const entries=validateMediaManifest(manifest);
  if(!native||typeof native.prepareAsset!=="function"||
     typeof native.playAsset!=="function"||typeof native.seekAsset!=="function"||
     typeof native.stopAsset!=="function"){
    throw new MediaError("NO_NATIVE_BRIDGE","Native media bridge is unavailable");
  }
  const handles=new Map();
  return {
    async resolve(id){
      const e=requireEntry(entries,id);
      const result=await native.prepareAsset({mediaId:e.id,packId:e.packId,
        relativePath:e.path,expectedSha256:e.sha256,kind:e.kind});
      if(result?.ready!==true||typeof result.handle!=="string"||!result.handle)
        throw new MediaError("ASSET_UNAVAILABLE","Install-time media asset not ready");
      if(result.verifiedSha256!==e.sha256)
        throw new MediaError("HASH_MISMATCH","Native SHA-256 did not match manifest");
      handles.set(id,result.handle);
      return {mediaId:id,kind:e.kind,handle:result.handle,
        sha256:e.sha256,verifiedHash:true,available:true};
    },
    async play(id){const handle=handles.get(id);if(!handle)throw new MediaError("NOT_RESOLVED","Resolve asset first");return native.playAsset({handle});},
    async seek(id,positionMs){if(!Number.isFinite(positionMs)||positionMs<0)throw new MediaError("BAD_SEEK","Invalid seek");const handle=handles.get(id);if(!handle)throw new MediaError("NOT_RESOLVED","Resolve asset first");return native.seekAsset({handle,positionMs});},
    async stop(id){const handle=handles.get(id);if(handle){await native.stopAsset({handle});handles.delete(id);}}
  };
}
