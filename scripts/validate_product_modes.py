#!/usr/bin/env python3
"""Validate the product requirements contract, not the browser implementation.

Use this to prevent accidental regression from two top-level modes and
full/individual four-skill preparation/exam options.
"""
from __future__ import annotations
import json
from pathlib import Path
from datetime import date
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parents[1]
SKILLS={"reading","listening","writing","speaking"}

def main() -> None:
    p=ROOT/"research/product-session-modes-v1.json"
    doc=ROOT/"docs/15-two-modes-skill-scopes.md"
    data=json.loads(p.read_text(encoding="utf-8"))
    spec=doc.read_text(encoding="utf-8")
    assert data["schema_version"]=="1.0.0"
    assert data["status"]=="PRODUCT_REQUIREMENTS_ONLY_NOT_IMPLEMENTED"
    assert data["canonical_spec"]=="docs/15-two-modes-skill-scopes.md"
    assert len(data["skills"])==4
    assert {x["id"] for x in data["skills"]}==SKILLS
    assert all(x["title_uk"] and x["name_fi"] for x in data["skills"])
    modes={x["id"]:x for x in data["modes"]}
    assert set(modes)=={"learn","exam"}
    learn,exam=modes["learn"],modes["exam"]
    assert learn["default_scope"]=="adaptive_mix"
    assert exam["default_scope"]=="full_exam"
    assert learn["hints"] and learn["self_repair"] and learn["spaced_repetition"]
    assert not exam["hints"] and not exam["self_repair"] and not exam["spaced_repetition"]
    assert exam["feedback"]=="after_submission_only"
    lscope={x["id"]:x for x in learn["scopes"]}
    escope={x["id"]:x for x in exam["scopes"]}
    assert {"adaptive_mix","structured_all","single_skill","custom_mix"}<=set(lscope)
    assert {"full_exam","single_subtest","practice_subset","official_partial_profile"}<=set(escope)
    for key in ["adaptive_mix","structured_all"]:
        assert lscope[key]["min_skills"]==lscope[key]["max_skills"]==4
    assert lscope["single_skill"]["min_skills"]==lscope["single_skill"]["max_skills"]==1
    assert escope["single_subtest"]["min_skills"]==escope["single_subtest"]["max_skills"]==1
    assert escope["full_exam"]["min_skills"]==escope["full_exam"]["max_skills"]==4
    assert escope["practice_subset"]["unofficial_practice"] is True
    assert escope["official_partial_profile"]["official_calendar_required"] is True
    assert exam["scoring"]=="per_skill_objective_accuracy_and_ungraded_productive"

    calendar=data["real_exam_day_profiles"]
    assert calendar["allowed_selection_rule"].startswith("selectedSkills nonempty subset")
    days=calendar["days"]
    assert len({x["id"] for x in days})==len(days)
    assert len(days)>=4
    for d in days:
        assert set(d["allowedSkills"])<=SKILLS and len(d["allowedSkills"]) in {2,4}
        assert d["examType"] in {"official_partial_day","official_full_day"}
        assert date.fromisoformat(d["registration"]["start"])<=date.fromisoformat(d["registration"]["end"])<date.fromisoformat(d["date"])
        url=urlparse(d["source"])
        assert url.scheme=="https" and url.hostname=="www.oph.fi"
    april=next(x for x in days if x["date"]=="2027-04-10")
    assert set(april["allowedSkills"])==SKILLS
    assert april["registration"]["start"]=="2027-03-08"
    assert set(data["fidelity"]["unconfirmed"])
    for heading in ["## 1. Дерево вибору","## 2. Обов'язкова матриця",
                    "## 3. Режим A","## 4. Режим B",
                    "## 5. Єдина інформаційна","## 6. Архітектурний",
                    "## 7. Критерії приймання"]:
        assert heading in spec, f"missing document section {heading}"
    for id_ in ["LEARN-01","LEARN-16","EXAM-01","EXAM-15","AC-01","AC-24"]:
        assert id_ in spec, f"missing requirement {id_}"
    assert "реаліз" in spec and "не" in spec.lower()
    print("OK: two modes, four skills, 8 selector scopes, 4 official day profiles, 24 acceptance scenarios")

if __name__=="__main__":
    main()
