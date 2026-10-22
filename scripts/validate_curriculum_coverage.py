#!/usr/bin/env python3
"""Structure/consistency gate for TARGET A1.3..B2.1 and newly added lesson folders.

Not an OPH language-level certification or a substitute for human Finnish review.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_LEVELS = ("A1.3","A2.1","A2.2","B1.1","B1.2","B2.1")
SKILLS = {"listening","reading","speaking","writing"}


def validate(root: Path = ROOT) -> list[str]:
    errors = []
    def load(path: str):
        p = root / path
        if not p.is_file():
            errors.append("Missing "+path)
            return {}
        try:
            return json.loads(p.read_text(encoding="utf-8"))
        except (ValueError, UnicodeError) as exc:
            errors.append(f"Invalid {path}: {exc}")
            return {}
    plan=load("learning/curriculum/levels-a1.3-b2.1.json")
    tenses=load("learning/exercises/grammar/tenses/lessons.json")
    clock=load("learning/exercises/grammar/time-and-clock/lessons.json")
    levels=plan.get("levels",[])
    ids=[l.get("id") for l in levels if isinstance(l,dict)]
    if tuple(ids)!=EXPECTED_LEVELS or plan.get("start_level")!="A1.3" or plan.get("end_level")!="B2.1":
        errors.append("Coverage must include A1.3 A2.1 A2.2 B1.1 B1.2 B2.1 exactly in order")
    if set(plan.get("rules",{}).get("skills",[]))!=SKILLS:
        errors.append("All four language skills must be represented")
    if plan.get("status")!="target_syllabus_not_current_app_coverage":
        errors.append("Cannot claim all six levels implemented without evidence")
    for level in levels:
        if not isinstance(level,dict):
            errors.append("Bad level record");continue
        if not level.get("grammar") or not level.get("situations") or not level.get("outputs"):
            errors.append("Incomplete level "+str(level.get("id")))
    tense_ids = [l.get("tense") for l in tenses.get("lessons",[]) if isinstance(l,dict)]
    if tense_ids!=["preesens","imperfekti","perfekti","pluskvamperfekti"]:
        errors.append("Four Finnish tenses must be correctly ordered")
    for lesson in tenses.get("lessons",[]):
        for lev in lesson.get("levels",[]):
            if lev not in EXPECTED_LEVELS:errors.append("Unsupported level in tense lesson "+lev)
        if len(lesson.get("examples",[]))<2:errors.append("Insufficient tense examples")
    for data,label in ((tenses,"tenses"),(clock,"clock")):
        exs=data.get("exercises",[])
        if not exs:errors.append("No exercises in "+label)
        used=set()
        for x in exs:
            key=x.get("id")
            if key in used:errors.append("Duplicate exercise "+str(key))
            used.add(key)
            if x.get("type")=="open_transfer" and x.get("assessment_status")!="ungraded":
                errors.append("Open answer cannot be graded without review "+str(key))
            if "choices" in x:
                if len(x["choices"])!=len(set(x["choices"])) or x.get("answer") not in x["choices"]:
                    errors.append("Invalid choice/answer alignment "+str(key))
                if len(x["choices"])<3:errors.append("Not enough distractors "+str(key))
            if x.get("level") not in EXPECTED_LEVELS:
                errors.append("Unsupported exercise level "+str(key))
    for folder in ("assets/images/illustrations","assets/images/pictures"):
        if not (root / folder / "README.md").is_file():
            errors.append("Missing visual asset ownership README "+folder)
    for path in ("learning/curriculum/README.md","learning/exercises/grammar/tenses/README.md",
                 "learning/exercises/grammar/time-and-clock/README.md"):
        if not (root/path).is_file(): errors.append("Missing curricular guidance "+path)
    return errors


if __name__=="__main__":
    failures=validate()
    for failure in failures:print("FAIL:",failure)
    if failures:raise SystemExit(1)
    print("PASS: planned six-level Finnish curriculum, all four tenses, clock exercises and image folder ownership")
