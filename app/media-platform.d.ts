/** Web and Android share this strict media manifest, but not large binary caches. */
export type MediaKind="audio"|"video";
export interface MediaEntryV1 {
  id:string;
  kind:MediaKind;
  packId:string;
  path:string;
  sha256:string;
  bytes:number;
  rights: {basis:"owned"|"licensed";redistributionAllowed:true;sourceUrl?:string};
}
export interface MediaManifestV1 {version:1;entries:MediaEntryV1[];}
export interface ResolvedWebMedia {
  mediaId:string;kind:MediaKind;src:string;sha256:string;verifiedHash:false;available:true;
}
export interface ResolvedNativeMedia {
  mediaId:string;kind:MediaKind;handle:string;sha256:string;verifiedHash:true;available:true;
}
export interface AndroidAssetBridge {
  prepareAsset(args:{mediaId:string;packId:string;relativePath:string;expectedSha256:string;kind:MediaKind}):
    Promise<{ready:boolean;handle?:string;verifiedSha256?:string}>;
  playAsset(args:{handle:string}):Promise<unknown>;
  seekAsset(args:{handle:string;positionMs:number}):Promise<unknown>;
  stopAsset(args:{handle:string}):Promise<unknown>;
}
export class MediaError extends Error {code:string;constructor(code:string,message:string);}
export function validateMediaManifest(manifest:unknown):Map<string,Readonly<MediaEntryV1>>;
export function createWebMediaProvider(manifest:MediaManifestV1,baseUrl:string):{
  resolve(id:string):Promise<ResolvedWebMedia>;
};
export function createAndroidMediaProvider(manifest:MediaManifestV1,native:AndroidAssetBridge):{
  resolve(id:string):Promise<ResolvedNativeMedia>;
  play(id:string):Promise<unknown>;
  seek(id:string,positionMs:number):Promise<unknown>;
  stop(id:string):Promise<void>;
};
