#!/usr/bin/env python3
"""Strict Wikimedia Commons allowlist import for 8 Finnish A1.3–B1.1 photos.

DO NOT copy arbitrary YouTube/Yle image assets. Offline manifest is generated
only for JPEGs whose bytes and dimensions were genuinely inspected.
"""
from __future__ import annotations
import hashlib
import io
import json
import pathlib
import sys
import time
from urllib.parse import quote,urlparse
from urllib.request import Request,urlopen
from PIL import Image

ROOT=pathlib.Path(__file__).resolve().parents[1]
SOURCES=ROOT/"assets/images/pictures/sources.json"
AVAILABLE=ROOT/"assets/images/pictures/available.json"
COMMONS="https://commons.wikimedia.org/wiki/File:"
MAX_BYTES=2_500_000
MAX_IMAGES=8
EXPECTED_IDS={"kauppatori-turku","s-market-kauppa","kerava-kerrostalo","espoo-bussipysakki","turku-paakirjasto","intercity-junassa","maunula-terveysasema","qwensel-kahvila-turku"}
ALLOWED_LICENSE="CC BY-SA 4.0"
UA="HospodarYKI-educational-media-import/1.0 (https://github.com/MykolaDotsenko/hospodar-yki; Wikimedia Commons licensed thumbnail)";

def download(item):
    filename=item["filename"]
    source=item["source_url"]
    assert source == COMMONS+filename.replace(" ","_"), "Unexpected source page: "+source
    width=item.get("download_max_width",960)
    if width not in (640,960):
        raise ValueError("Unapproved thumbnail width")
    redirect="https://commons.wikimedia.org/wiki/Special:Redirect/file/"+quote(filename.replace(" ","_"),safe="")+f"?width={width}"
    last=None
    for retry in range(3):
        try:
            request=Request(redirect,headers={"User-Agent":UA,"Accept":"image/jpeg"})
            with urlopen(request,timeout=60) as response:
                actual=urlparse(response.geturl())
                if actual.scheme!="https" or actual.hostname not in {"upload.wikimedia.org","thumb.wikimedia.org"}:
                    raise ValueError("Untrusted image redirect to "+str(actual.hostname))
                mime=response.headers.get("Content-Type","")
                if "image/jpeg" not in mime:
                    raise ValueError("Unrecognized MIME: "+mime)
                raw=response.read(MAX_BYTES+1)
            if not (20_000 <= len(raw) <= MAX_BYTES and raw[:3]==b"\xff\xd8\xff"):
                raise ValueError("Image too big, small or not JPEG")
            with Image.open(io.BytesIO(raw)) as im:
                im.verify()
            with Image.open(io.BytesIO(raw)) as im:
                if im.format!="JPEG":
                    raise ValueError("Unexpected image format")
                # Commons Redirect can serve a cached larger thumbnail even when a
                # smaller width was requested. Reduce *proportionally*, preserving
                # the real licensed pixels and without hiding a corrupt download.
                if im.width > 2400 or im.height > 2400:
                    raise ValueError("Unexpectedly oversized Commons thumbnail")
                if im.width > 1200 or im.height > 1200:
                    im.thumbnail((1200,1200), Image.Resampling.LANCZOS)
                    dest=io.BytesIO()
                    im.convert("RGB").save(dest,format="JPEG",quality=87,optimize=True)
                    raw=dest.getvalue()
                    width,height=im.size
                else:
                    width,height=im.size
                if not (400<=width<=1200 and 250<=height<=1200):
                    raise ValueError(f"Unsupported image dimensions after safe resize: {width}x{height}")
            return raw,width,height,response.geturl()
        except Exception as exc:
            last=exc
            print(f"RETRY {retry+1}/3 {item['id']}: {exc}",file=sys.stderr)
            time.sleep(2*(retry+1))
    raise RuntimeError(f"Image import failed for {item['id']}: {last}")

def main():
    data=json.loads(SOURCES.read_text(encoding="utf-8"))
    items=data["items"]
    if len(items)!=MAX_IMAGES or {x["id"] for x in items}!=EXPECTED_IDS:
        raise ValueError("Import allowlist changed; require human review")
    previous={}
    if AVAILABLE.exists():
        old=json.loads(AVAILABLE.read_text(encoding="utf-8"))
        previous={record["id"]:record for record in old.get("assets",[])}
    ready=[];errors=[]
    for item in items:
        if item["license"]!=ALLOWED_LICENSE or not item.get("source_page_attribution_verified"):
            raise ValueError("Unverified photo rights: "+item["id"])
        path=(ROOT/item["path"]).resolve()
        if not path.is_relative_to((ROOT/"assets/images/pictures").resolve()) or path.suffix.lower()!=".jpg":
            raise ValueError("Unsafe picture path")
        try:
            if path.exists():
                raw=path.read_bytes()
                with Image.open(io.BytesIO(raw)) as im:
                    im.verify()
                with Image.open(io.BytesIO(raw)) as im:
                    width,height=im.size
                if len(raw)>MAX_BYTES or not (400<=width<=1200 and 250<=height<=1200):
                    raise ValueError("Existing photo outside quality boundaries")
                earlier=previous.get(item["id"])
                current_hash=hashlib.sha256(raw).hexdigest()
                if earlier and earlier.get("sha256")!=current_hash:
                    raise ValueError("Existing image changed since verified manifest: "+item["id"])
                download_url="https://commons.wikimedia.org/wiki/Special:Redirect/file/"+quote(item["filename"].replace(" ","_"),safe="")+f"?width={item.get('download_max_width',960)}"
            else:
                raw,width,height,_=download(item)
                download_url="https://commons.wikimedia.org/wiki/Special:Redirect/file/"+quote(item["filename"].replace(" ","_"),safe="")+"?width=960"
                path.write_bytes(raw)
            ready.append({**{k:item[k] for k in ("id","path","source_url","author","license","license_url","alt_fi","alt_uk","levels","topics","teacher_review")},
                          "state":"verified_binary","bytes":len(raw),"sha256":hashlib.sha256(raw).hexdigest(),
                          "width":width,"height":height,"download_method":"Wikimedia Commons JPEG 960px thumbnail",
                          "derivative_note":"Commons JPEG thumbnail; portrait files may be proportionally downsampled with Pillow to <=1200px; CC BY-SA 4.0 applies; no other edits",
                          "download_url":download_url})
            print("VERIFIED",item["id"],width,height,len(raw))
        except Exception as exc:
            errors.append({"id":item["id"],"error":str(exc)[:240]})
            print("FAILED",item["id"],str(exc),file=sys.stderr)
    AVAILABLE.write_text(json.dumps({"schema_version":"1.0.0","verified_count":len(ready),
                       "source_count":len(items),"assets":ready,"failures":errors,
                       "status":"binary_sha256_validated" if len(ready)==len(items) else "partial_import_needs_review",
                       "imported_on":"2026-10-23","teacher_review":"pending"},
                      ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    if errors or len(ready)!=len(items):
        raise RuntimeError(f"Refusing completed import claim: {len(ready)}/{len(items)} verified")
    return 0

if __name__=="__main__":
    try:raise SystemExit(main())
    except Exception as error:
        print("FAILED licensed pictures:",error,file=sys.stderr)
        raise SystemExit(1)
