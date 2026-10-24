#!/usr/bin/env python3
"""Strict follow-up evidence check: three 2026/2025 PI/AI papers, 70 unchanged /100 method scores.

Passing tests confirms traceability, *not* scholarly validity nor Finnish CEFR/YKI outcomes.
"""
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[1]
M="research/pedagogy/learning-methods-v1.json"
E="research/pedagogy/learning-effectiveness-ratings-v1.json"
REPORT="research/pedagogy/25-pragmatics-processing-notes-finnish-2026-10.md"
INDEX="research/pedagogy/README.md"
DOC="docs/05-study-system.md"
SOURCES={
 "pi-online-rct26":("https://doi.org/10.1177/13621688261480080","L2-processing-instruction-randomized-three-arm-study","structured-input-grammar"),
 "ai-aif-writing26":("https://doi.org/10.1016/j.system.2026.104018","L2-AI-feedback-three-level-meta","hybrid-ai-teacher-loop"),
 "ai-human-comparison25":("https://doi.org/10.1080/01443410.2025.2553639","cross-domain-AI-vs-human-feedback-meta","human-anchor-calibration")
}
SCORES={
 "structured-input-grammar":(92,88),
 "hybrid-ai-teacher-loop":(93,80),
 "human-anchor-calibration":(97,73)
}
def audit(root=ROOT):
    problems=[]
    try:
        m=json.loads((root/M).read_text(encoding="utf8"))
        e=json.loads((root/E).read_text(encoding="utf8"))
        report=(root/REPORT).read_text(encoding="utf8")
        index=(root/INDEX).read_text(encoding="utf8")
        learner=(root/DOC).read_text(encoding="utf8")
    except (OSError,ValueError) as exc:
        return ["Missing/corrupt 2026 evidence data: "+str(exc)]
    methods={x.get("id"):x for x in m.get("methods",[])}
    ratings={x.get("id"):x for x in e.get("ratings",[])}
    refs=m.get("source_register",{})
    if len(methods)!=70 or len(ratings)!=70 or len(refs)!=80 or e.get("count")!=70 or methods.keys()!=ratings.keys():
        problems.append("Canonical 70 method / 80 distinct sources / 70 unchanged ratings count mismatch")
    if len({x.get("url") for x in refs.values()})!=len(refs):
        problems.append("Scholarly source duplicate URL")
    for key,(url,typ,method_id) in SOURCES.items():
        src=refs.get(key,{})
        if src.get("url")!=url or src.get("type")!=typ or not src.get("title"):
            problems.append("Incorrect verified DOI/type/title: "+key)
        if url not in report:
            problems.append("Missing DOI from written critical analysis: "+key)
        mth=methods.get(method_id,{})
        rating=ratings.get(method_id,{})
        if key not in mth.get("sources",[]) or key not in rating.get("source_ids",[]):
            problems.append("Source not linked to matching method and rated impact: "+key)
    for identifier,(p,impact) in SCORES.items():
        method=methods.get(identifier,{})
        rating=ratings.get(identifier,{})
        if method.get("score")!=p or rating.get("learning_effectiveness_0_to_100")!=impact or rating.get("previous_product_fit_0_to_100")!=p:
            problems.append("Fabricated/overwritten evidence score /100: "+identifier)
        if rating.get("source_ids")!=method.get("sources",[]):
            problems.append("Canonical product/impact source list out of sync: "+identifier)
        if rating.get("actual_research_effect_size_not_this_score") is not True or rating.get("not_yki_pass_probability") is not True:
            problems.append("False YKI grade or causal score claim: "+identifier)
        if ("**Product-fit "+str(p)+"/100 / Learning-impact "+str(impact)+"/100**") not in report:
            problems.append("Missing explicit /100 rating in critical addendum: "+identifier)
    for label in ("## 8. Доказовий follow-up","через 3 тижні","PI-vs-SI","не була статистично значущою","16 досліджень / 60 ефектів","41 дослідження, N=4 813","No significant difference","RESEARCH_ONLY","не","70 методів / 80 джерел"):
        if label not in report:
            problems.append("Missing null result, control or epistemic caution: "+label)
    if "25-pragmatics-processing-notes-finnish-2026-10.md" not in index or "25-pragmatics-processing-notes-finnish-2026-10.md" not in learner:
        problems.append("Critical evidence not accessible from learner/research docs")
    return problems
if __name__=="__main__":
    problems=audit()
    for msg in problems:print("FAIL:",msg)
    if problems:raise SystemExit(1)
    print("PASS: canonical 70 dual-/100 method ratings, 80 distinct scholarly sources, 3 new PI/AI citations, 2026 randomized null findings and no invented YKI product effect")
