#!/usr/bin/env python3
"""Research-only integrity: two canonical 70-method /100 rankings and 77 sources."""
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
M="research/pedagogy/learning-methods-v1.json"
E="research/pedagogy/learning-effectiveness-ratings-v1.json"
A="research/pedagogy/08-learning-methods-evidence-2026-10.md"
D="research/pedagogy/12-finnish-yki-learning-effectiveness-2026-10.md"
T="research/pedagogy/25-pragmatics-processing-notes-finnish-2026-10.md"
OTHER=["research/pedagogy/README.md","research/pedagogy/24-global-best-methods-finnish-2026-10.md","docs/05-study-system.md"]
SOURCES={
"pi-review26":"https://doi.org/10.3390/educsci16020295",
"pi-efl26":"https://doi.org/10.1007/s43545-026-01787-w",
"pragmeta23":"https://doi.org/10.1093/applin/amac055",
"finnpliis22":"https://doi.org/10.1017/9781108864183.015",
"notesmeta24":"https://doi.org/10.1017/S0272263123000529",
"hvptmeta25":"https://doi.org/10.1017/S0272263125100879",
"listeningmeta24":"https://eric.ed.gov/?id=EJ1423906",
}
NEW={"pragmatic-speech-acts":(94,91),
     "structured-input-grammar":(92,88),
     "strategic-audio-notes":(89,85)}
def verify(root=ROOT):
    try:
        m=json.loads((root/M).read_text(encoding="utf8"))
        e=json.loads((root/E).read_text(encoding="utf8"))
        product=(root/A).read_text(encoding="utf8")
        learning=(root/D).read_text(encoding="utf8")
        report=(root/T).read_text(encoding="utf8")
        index=[(root/p).read_text(encoding="utf8") for p in OTHER]
    except (OSError,ValueError) as exc:return ["Missing or corrupt research: "+str(exc)]
    errors=[]
    ms=m.get("methods",[])
    es=e.get("ratings",[])
    refs=m.get("source_register",{})
    mm={x.get("id"):x for x in ms}
    ee={x.get("id"):x for x in es}
    if len(ms)!=70 or len(es)!=70 or len(refs)!=77 or e.get("count")!=70 or len(mm)!=70 or len(ee)!=70 or set(mm)!=set(ee):
        errors.append("Canonical 70 scored methods and 77 sources invalid")
    for k,url in SOURCES.items():
        if refs.get(k,{}).get("url")!=url:errors.append("Scholarly source changed: "+k)
        if url not in report:errors.append("Scientific source omitted from report: "+k)
    if "Pouresmaeil" not in refs.get("pi-review26",{}).get("title","") or "Wang" not in refs.get("pi-review26",{}).get("title",""):
        errors.append("Wrong authors for 2026 processing review")
    for key,(p,i) in NEW.items():
        method=mm.get(key,{})
        rating=ee.get(key,{})
        if method.get("score")!=p or method.get("added_at")!="2026-10-24":
            errors.append("Incorrect added expert product-fit score: "+key)
        if rating.get("learning_effectiveness_0_to_100")!=i or rating.get("previous_product_fit_0_to_100")!=p or rating.get("source_ids")!=method.get("sources"):
            errors.append("Incorrect added expert impact score: "+key)
        if key not in product or key not in learning or key not in report:
            errors.append("Missing method in public documentation: "+key)
        if ("**"+str(p)+"/100**") not in report or ("**"+str(i)+"/100**") not in report:
            errors.append("Missing explicit dual 100-point scores: "+key)
        if rating.get("not_yki_pass_probability") is not True or rating.get("actual_research_effect_size_not_this_score") is not True:
            errors.append("Expert /100 score misrepresented as empirical: "+key)
    for k,source in (("high-variability-phonetics","hvptmeta25"),("metacognitive-listening","listeningmeta24")):
        if source not in mm.get(k,{}).get("sources",[]) or source not in ee.get(k,{}).get("source_ids",[]):
            errors.append("Missing critical existing-method evidence: "+k)
    first=product.split("## Повний рейтинг (Product-fit, 70 методик)",1)[-1].split("## Картки методик",1)[0]
    first_rows=re.findall(r"^\| (\d+) \| (.*?) \| \*\*(\d+)\*\* \|",first,re.M)
    if len(first_rows)!=70 or any((int(n)!=j+1 or name!=ms[j]["name_uk"] or int(score)!=ms[j]["score"]) for j,(n,name,score) in enumerate(first_rows)):
        errors.append("Complete 70-entry product-score ranking drift")
    second=learning.split("## 2. Повний рейтинг ефективності — усі 70",1)[-1].split("## 3. Як оцінювати ефективність",1)[0]
    second_rows=re.findall(r"^\| (\d+) \| \*\*.*?\*\* \(\x60([a-z0-9-]+)\x60\) \| \*\*(\d+)\*\* \| (\d+) \|",second,re.M)
    if len(second_rows)!=70 or any((int(n)!=j+1 or ident!=es[j]["id"] or int(score)!=es[j]["learning_effectiveness_0_to_100"] or int(p)!=es[j]["previous_product_fit_0_to_100"]) for j,(n,ident,score,p) in enumerate(second_rows)):
        errors.append("Complete 70-entry learning-score ranking drift")
    if any("25-pragmatics-processing-notes-finnish-2026-10.md" not in doc for doc in index):
        errors.append("New research not discoverable in existing documentation")
    for marker in ("29 досліджень","23 EFL","21 первинне","g=1.656","g=0.56","d=0.25","RESEARCH_ONLY","неперевірене"):
        if marker not in report:errors.append("Incomplete review or missing caution: "+marker)
    return errors
if __name__=="__main__":
    problems=verify()
    for p in problems:print("FAIL:",p)
    if problems:raise SystemExit(1)
    print("PASS: 70 methods, 77 source links, three new scored methods and complete dual /100 rankings")
