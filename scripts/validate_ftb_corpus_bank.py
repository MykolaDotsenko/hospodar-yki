#!/usr/bin/env python3
"""Validate derived FTB morphology training candidates (structural only)."""
from __future__ import annotations
import json
from collections import Counter
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT/"learning/exercises/b1/grammar/ftb-frequency-cloze-v1.json").read_text(encoding="utf-8"))
focuses = {"Gen","Par","Ill","Ela","All","Ade","Conditional","Passive"}
assert data["count"] == len(data["items"]) == 120
assert set(data["counts_by_focus"]) == focuses
assert all(data["counts_by_focus"][x] == 15 for x in focuses)
assert data["provenance"]["license_url"] == "https://creativecommons.org/licenses/by/4.0/"
assert len(data["provenance"]["source_commit"]) == 40
ids=set()
src=set()
for item in data["items"]:
    ident=item["id"]
    assert ident not in ids, "Duplicate ID "+ident
    ids.add(ident)
    assert item["source_sent_id"] not in src, "Duplicate corpus sentence "+ident
    src.add(item["source_sent_id"])
    assert item["grammar_focus"] in focuses
    assert item["cloze_fi"].count("_____") == 1, "Wrong cloze "+ident
    assert item["cloze_fi"].replace("_____",item["answer_fi"]) == item["context_fi"], "Mismatched answer "+ident
    assert len(item["lemma_fi"]) >= 2 and len(item["answer_fi"]) >= 4
    assert 0.65 <= item["top5000_lemma_coverage"] <= 1
    if item["grammar_focus"] in ("Gen","Par","Ill","Ela","All","Ade"):
        assert ("Case="+item["grammar_focus"]) in item["morph_features"], "Case tag mismatch "+ident
    elif item["grammar_focus"] == "Conditional":
        assert "Mood=Cnd" in item["morph_features"] and "VerbForm=Fin" in item["morph_features"]
    else:
        assert "Voice=Pass" in item["morph_features"] and "VerbForm=Fin" in item["morph_features"]
    assert item["teacher_review"]=="pending_S2_teacher" and item["assessment_eligible"] is False, "Unsound assessment eligibility"
    assert item["source_license"]=="CC BY 4.0"
    assert item["origin_selection"]=="frequency_aware_structural_candidate_not_human_curated"
assert Counter(x["grammar_focus"] for x in data["items"]) == data["counts_by_focus"]
print(json.dumps({"status":"PASS", "corpus_candidates":len(data["items"]),"categories":len(focuses),"license":"CC BY 4.0","teacher_review":"pending","scope":"structural only; not approved B1 exercises"}))
