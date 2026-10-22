/** Same logical media identity across Web and Android; platform transport is separate. */
export function validateMediaAsset(asset) {
  if (!asset || typeof asset !== "object") throw new TypeError("Invalid asset");
  for (const field of ["mediaId","contentHash","mimeType","rights"]) if (typeof asset[field] !== "string" || !asset[field].trim()) throw new TypeError("Missing " + field);
  if (!Number.isSafeInteger(asset.version) || asset.version < 1) throw new TypeError("Invalid version");
  if (!["redistributable","external_link_only"].includes(asset.rights)) throw new TypeError("Invalid rights");
  return Object.freeze({...asset});
}
export function createMediaProvider(adapter) {
  if (!adapter || typeof adapter.resolve !== "function") throw new TypeError("Missing media resolve");
  return Object.freeze({resolve:async asset=>{
    const a=validateMediaAsset(asset);
    if (a.rights!=="redistributable") throw new Error("Asset cannot be bundled or cached");
    return adapter.resolve(a);
  }});
}
