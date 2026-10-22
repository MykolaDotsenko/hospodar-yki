#!/usr/bin/env python3
"""Validate imported human LibriVox clips and unified catalog."""
import hashlib,json,pathlib
R=pathlib.Path(__file__).resolve().parents[1]
m=json.loads((R/"learning/exercises/b1/audio-training/librivox-human.json").read_text())
l=json.loads((R/"assets/audio/library.json").read_text())
assert len(m["items"])==m["count"]>0
paths=set()
for i in m["items"]:
 p=R/i["path"];d=p.read_bytes()
 assert i["path"] not in paths;paths.add(i["path"])
 assert d.startswith(b"OggS") and hashlib.sha256(d).hexdigest()==i["sha256"]
 assert len(d)==i["bytes"] and 10<i["duration_seconds"]<40
 assert i["narrator"] and i["writer"] and i["source_page"] and i["license"]
 assert i["transcript_verified"] is False and i["is_official_yki"] is False
assert paths=={x["path"] for x in l["entries"] if x["kind"]=="human_librivox_excerpt"}
assert len(l["entries"])==l["counts"]["total_files"]
print(json.dumps({"result":"PASS","new_human_clips":len(paths),"voices":m["narrators"],"total_audio":len(l["entries"])},ensure_ascii=False))
