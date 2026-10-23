#!/usr/bin/env python3
"""Validate licensed, committed human-audio/photo A1.3–A2.2 LEARN lessons."""
from __future__ import annotations
import json
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
LESSONS="learning/exercises/a1/audio-visual/lessons.json"

def check(root:Path=ROOT)->list[str]:
    errors=[]
    def load(path):
        try:return json.loads((root/path).read_text(encoding="utf-8"))
        except (OSError,ValueError) as e:
            errors.append(f"Invalid {path}: {e}")
            return {}
    content=load(LESSONS)
    audio={r.get("id"):r for r in load("assets/audio/library.json").get("entries",[])}
    audio_ready={r.get("id"):r for r in load("assets/audio/available.json").get("items",[])}
    pictures={r.get("id"):r for r in load("assets/images/pictures/available.json").get("assets",[])}
    illustrations={r.get("id"):r for r in load("assets/images/illustrations/library.json").get("items",[])}
    if any(content.get(k)!=v for k,v in {"mode":"LEARN_only","grading":"ungraded","automatic_srs":"not_implemented"}.items()):
        errors.append("Unsafe grading or SRS claims")
    rows=content.get("items",[])
    if len(rows)<5:errors.append("Five required missions missing")
    ids=set();audio_ids=set();picture_ids=set()
    for row in rows:
        rid=row.get("lesson_id")
        if not isinstance(rid,str) or not re.fullmatch(r"av-a(?:13|21|22)-[a-z0-9-]+",rid):
            errors.append("Invalid stable id "+str(rid))
        if rid in ids:errors.append("Duplicate lesson "+str(rid))
        ids.add(rid)
        if row.get("level") not in ("A1.3","A2.1","A2.2"):
            errors.append("Unsupported sublevel "+str(rid))
        if row.get("teacher_review")!="pending" or row.get("response_status")!="ungraded":
            errors.append("Open-response grading must remain ungraded "+str(rid))
        aid=row.get("audio_id");audio_ids.add(aid)
        a=audio.get(aid,{});ready=audio_ready.get(aid,{})
        if not a or not ready or a.get("path")!=ready.get("path"):
            errors.append("Unverified audio reference "+str(rid))
        else:
            p=a["path"]
            if not p.startswith("assets/audio/") or ".." in Path(p).parts or not (root/p).is_file():
                errors.append("Audio binary missing "+str(rid))
            if a.get("synthetic") is not False or a.get("actual_human") is not True or ready.get("audio_verified") is not True:
                errors.append("Recording not verified as human "+str(rid))
            if not all(a.get(k) for k in ("source_page","author","license")):
                errors.append("Audio attribution missing "+str(rid))
        pid=row.get("image_id");picture_ids.add(pid)
        p=pictures.get(pid,{})
        if not p or p.get("state")!="verified_binary" or not re.fullmatch("[0-9a-f]{64}",str(p.get("sha256",""))):
            errors.append("Unverified photo "+str(rid))
        else:
            path=p.get("path","")
            if not path.startswith("assets/images/pictures/") or ".." in Path(path).parts or not (root/path).is_file():
                errors.append("Photo binary missing "+str(rid))
            if not all(p.get(k) for k in ("author","license","source_url","alt_uk")):
                errors.append("Photo attribution missing "+str(rid))
        iid=row.get("scaffold_illustration_id")
        if iid:
            s=illustrations.get(iid,{})
            if s.get("mode")!="LEARN_only" or s.get("has_visible_solution") is not True or not (root/s.get("path","-")).is_file():
                errors.append("Unsafe post-attempt scaffold "+str(rid))
        fields=("title_uk","audio_relation","listen_fi","first_task_fi","first_task_uk","repair_task_fi","transfer_task_fi","transfer_task_uk","delayed_prompt_fi")
        if any(not isinstance(row.get(k),str) or not row[k].strip() for k in fields):
            errors.append("Incomplete pedagogy "+str(rid))
        models=row.get("model_after_attempt_fi")
        if not isinstance(models,list) or len(models)<2 or not all(isinstance(v,str) and v.strip() for v in models):
            errors.append("Missing post-attempt models "+str(rid))
        if row.get("review_days")!=[1,7,14] or row.get("review_status")!="suggested_only":
            errors.append("Delayed review mislabeled "+str(rid))
        if any(key in row for key in ("answer_key","correct_index","official_yki_score","score")):
            errors.append("Unsafe answer key "+str(rid))
    if len(audio_ids)<3 or len(picture_ids)<5:errors.append("Missing distinct media contexts")
    return errors

if __name__=="__main__":
    problems=check()
    for err in problems:print("FAIL:",err)
    if problems:raise SystemExit(1)
    print("PASS verified live-audio, photos and five draft ungraded transfer missions")
