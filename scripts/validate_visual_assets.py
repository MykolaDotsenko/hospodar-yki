#!/usr/bin/env python3
"""Visual media ownership, UTF-8 alt, SVG safety, truthful physical photo checks."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
LICENSE="CC BY-SA 4.0"
def check(root:Path=ROOT,require_pictures:bool=False)->list[str]:
    errors=[]
    def load(rel):
        try:return json.loads((root/rel).read_text(encoding="utf-8"))
        except (ValueError,KeyError,OSError) as e:
            errors.append(f"Invalid manifest {rel}: {e}")
            return {}
    illustrations=load("assets/images/illustrations/library.json").get("items",[])
    ids=set();files=set()
    for item in illustrations:
        identifier=item.get("id")
        if identifier in ids: errors.append("Duplicate SVG ID "+str(identifier))
        ids.add(identifier)
        p=item.get("path","")
        if not p.startswith("assets/images/illustrations/") or ".." in Path(p).parts or not p.endswith(".svg"):
            errors.append("Unsafe SVG path "+p);continue
        path=root/p
        files.add(path)
        if not path.is_file():errors.append("Missing SVG "+p);continue
        try:
            raw=path.read_text(encoding="utf-8")
            parsed=ET.fromstring(raw)
            if parsed.tag!="{http://www.w3.org/2000/svg}svg":
                errors.append("Not SVG root "+p)
            ids_svg={e.attrib.get("id") for e in parsed.iter()}
            if not {"title","desc"}.issubset(ids_svg) or "aria-labelledby" not in parsed.attrib:
                errors.append("SVG inaccessible "+p)
            if "<script" in raw or "xlink:href" in raw or "<foreignObject" in raw or "href=\"http" in raw or "href=\u0027http" in raw:
                errors.append("Untrusted SVG active or remote content "+p)
        except (ET.ParseError,UnicodeError) as e:
            errors.append(f"Unparseable SVG {p}: {e}")
        if not item.get("alt_fi") or not item.get("alt_uk") or item.get("mode")!="LEARN_only":
            errors.append("Missing description/mode "+p)
        if item.get("license")!="project_original":
            errors.append("Unverified SVG licensing "+p)
    for f in (root/"assets/images/illustrations").glob("*.svg"):
        if f not in files:errors.append("Unlisted learning illustration "+str(f))
    sources=load("assets/images/pictures/sources.json").get("items",[])
    expected_ids={"kauppatori-turku","s-market-kauppa","kerava-kerrostalo","espoo-bussipysakki"}
    if {x.get("id") for x in sources}!=expected_ids or len(sources)!=4:
        errors.append("Picture source allowlist drift")
    source_by_id={x.get("id"):x for x in sources}
    by_path=set()
    for source in sources:
        p=source.get("path","")
        if not p.startswith("assets/images/pictures/") or not p.endswith(".jpg") or ".." in Path(p).parts or p in by_path:
            errors.append("Unsafe or repeated picture path "+p)
        by_path.add(p)
        if source.get("license")!=LICENSE or source.get("license_url")!="https://creativecommons.org/licenses/by-sa/4.0/":
            errors.append("Unapproved photo license "+p)
        if not all(source.get(k) for k in ("author","source_url","alt_fi","alt_uk","prompt_fi")):
            errors.append("Missing photo attribution/alt "+p)
        if source.get("offline_ready") is not False:
            errors.append("Sources are not a readiness record "+p)
    lessons=load("learning/exercises/a1/image-led/lessons.json").get("items",[])
    if len(lessons)!=4:
        errors.append("Expected exactly four image-driven independent Finnish missions")
    seen_lessons=set()
    for lesson in lessons:
        lid=lesson.get("lesson_id")
        if lid in seen_lessons:errors.append("Repeated image lesson "+str(lid))
        seen_lessons.add(lid)
        if lesson.get("image_id") not in source_by_id:
            errors.append("Image lesson has unknown source ID "+str(lid))
        if lesson.get("response_status")!="ungraded" or not lesson.get("initial_prompt_fi") or not lesson.get("transfer_prompt_fi"):
            errors.append("Unsafe unreviewed image lesson assessment "+str(lid))
    availability=root/"assets/images/pictures/available.json"
    ready=[]
    if availability.exists():
        data=load("assets/images/pictures/available.json")
        ready=data.get("assets",[])
        if data.get("verified_count")!=len(ready):errors.append("Photo manifest count mismatch")
        ids_ready=set();path_ready=set()
        for row in ready:
            rid=row.get("id")
            if rid not in source_by_id or rid in ids_ready:
                errors.append("Unknown or duplicate photo ID "+str(rid));continue
            ids_ready.add(rid)
            original=source_by_id[rid]
            path=row.get("path","")
            path_ready.add(path)
            if path!=original.get("path"):
                errors.append("Manifest/source path mismatch "+str(rid));continue
            asset=root/path
            if not asset.is_file():
                errors.append("Manifest photo missing "+path);continue
            raw=asset.read_bytes()
            if not raw.startswith(b"\xff\xd8\xff") or not raw.endswith(b"\xff\xd9"):
                errors.append("Bad JPEG header/trailer "+path)
            if len(raw)!=row.get("bytes") or hashlib.sha256(raw).hexdigest()!=row.get("sha256"):
                errors.append("JPEG byte count/hash mismatch "+path)
            if row.get("state")!="verified_binary" or row.get("license")!=LICENSE or not row.get("alt_fi") or not row.get("alt_uk"):
                errors.append("Picture rights/QA incomplete "+path)
        if require_pictures and (len(ready)!=4 or data.get("status")!="binary_sha256_validated"):
            errors.append("Not all four photo binaries committed")
    elif require_pictures:
        errors.append("Photo availability missing: no verified pictures")
    actual={p.relative_to(root).as_posix() for p in (root/"assets/images/pictures").glob("*.jpg")}
    listed={x.get("path") for x in ready}
    for orphan in actual-listed:errors.append("Unlisted orphan picture "+orphan)
    if require_pictures and actual!=by_path:
        errors.append("Expected picture file paths incomplete")
    return errors

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--require-pictures",action="store_true")
    args=parser.parse_args()
    problems=check(require_pictures=args.require_pictures)
    for issue in problems:print("FAIL:",issue,file=sys.stderr)
    if problems:raise SystemExit(1)
    print("PASS visual: 5 local lesson SVGs + attributable picture allowlist; photo bytes checked when present.")
