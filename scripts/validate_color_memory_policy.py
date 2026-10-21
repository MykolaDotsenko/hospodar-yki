#!/usr/bin/env python3
"""Static validation of evidence-linked and delayed color cues, not efficacy proof."""
from __future__ import annotations

import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SKILLS={"reading","listening","writing","speaking"}

def luminance(col:str)->float:
    h=col.lstrip("#")
    vals=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    rgb=[x/12.92 if x<=0.04045 else ((x+0.055)/1.055)**2.4 for x in vals]
    return sum(x*y for x,y in zip(rgb,(0.2126,0.7152,0.0722)))

def contrast(a:str,b:str)->float:
    x,y=sorted((luminance(a),luminance(b)))
    return (y+0.05)/(x+0.05)

def main():
    data=json.loads((ROOT/"research/color-memory-evidence-v1.json").read_text(encoding="utf8"))
    tokens=json.loads((ROOT/"brand/tokens.json").read_text(encoding="utf8"))
    assert data["schema_version"]=="1.0.0"
    assert data["not_systematic_review"] is True
    assert data["study_plan"]["status"]=="not_run"
    assert data["study_plan"]["no_learning_claim_until_tested"] is True
    assert data["mode_policy"]["exam"]["answer_cues"] is False
    assert data["mode_policy"]["learn"]["morphology_segmentation"]=="manual_teacher_reviewed"
    ids={s["id"] for s in data["sources"]}
    assert len(ids)==len(data["sources"])>=15
    assert {"schneider2018","richter2016","alpizar2020","meusel2024",
        "dunlosky2013","cintron2021","garcia2021","wcag2023"}<=ids
    for src in data["sources"]:
        assert src["url"].startswith("https://")
        assert 1990<=src["year"]<=2026
        assert src["finding"] and src["scope"]
        assert 0<=src["evidenceFit100"]<=100
    for feature in data["features"]:
        assert set(feature["why"])<=ids
        assert feature["first_attempt_colored"] is False or feature["id"]=="use_skill_colors_only_for_navigation"
        assert feature["exam_colored"] is False or feature["id"]=="use_skill_colors_only_for_navigation"
    assert set(data["colors"]) >= SKILLS|{"cue_background","cue_ink"}
    assert contrast(data["colors"]["cue_ink"],data["colors"]["cue_background"])>=4.5
    assert tokens["version"]=="0.3.1"
    assert tokens["learning_cue"]["allowed_phases"]==["feedback"]
    assert "answer" in tokens["learning_cue"]["blocked_phases"]
    assert "exam" in tokens["learning_cue"]["blocked_phases"]
    assert tokens["learning_cue"]["underline"] is True
    assert tokens["evidence"]["long_term_yki_gain_verified"] is False

    js=(ROOT/"app/app.mjs").read_text(encoding="utf8")
    appcss=(ROOT/"app/styles.css").read_text(encoding="utf8")
    exam=(ROOT/"app/exam.mjs").read_text(encoding="utf8")
    mission=js.split("function renderMission()",1)[1].split("function renderDiagnostic()",1)[0]
    before=mission.split('if(m.phase === "feedback")',1)[0]
    feedback=mission.split('if(m.phase === "feedback")',1)[1].split('if(m.phase === "transfer")',1)[0]
    transfer=mission.split('if(m.phase === "transfer")',1)[1]
    assert "learning-cue" not in before and "learning-cue" not in transfer
    assert feedback.count('class="learning-cue"')==1
    assert "h(t.answer_fi)" in feedback
    assert "learning-cue" not in exam
    assert ".learning-cue" in appcss and "text-decoration:underline" in appcss
    assert "forced-colors:active" in appcss
    assert (ROOT/"docs/16-color-attention-memory-research-2026-10.md").exists()
    spec=(ROOT/"docs/15-two-modes-skill-scopes.md").read_text(encoding="utf8")
    for tag in ["COLOR-01","COLOR-02","COLOR-03","COLOR-04","COLOR-05",
                "COLOR-06","COLOR-07","COLOR-08","COLOR-09","COLOR-10",
                "AC-33","AC-34","AC-35","AC-36","AC-37","AC-38"]:
        assert tag in spec,tag
    print(f"PASS: {len(ids)} sources, delayed-feedback-only color cue, no exam leaks, contrast={contrast(data['colors']['cue_ink'],data['colors']['cue_background']):.2f}:1")

if __name__=="__main__":
    main()
