#!/usr/bin/env python3
"""Validate public-source book-science bridge to existing 67-method registry.

Only checks internal consistency and honest provenance, NOT causal validity.
"""
from __future__ import annotations
import json
from pathlib import Path
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parents[1]
CATALOG=ROOT/"research/learning-blueprints-books-v1.json"

def run():
    data=json.loads(CATALOG.read_text(encoding="utf-8"))
    old=json.loads((ROOT/"research/learning-methods-v1.json").read_text(encoding="utf-8"))
    existing={x["id"] for x in old["methods"]}
    assert len(existing)==len(old["methods"])==67, "Original 67 methodological entries should not change"
    assert data["schema_version"]=="1.0.0"
    assert data["existing_method_registry"]=="research/learning-methods-v1.json"
    books=data["books"]; studies=data["studies"]; actions=data["backlog"]
    assert len(books)==11 and len(studies)==13 and len(actions)==13
    assert len(set(x["id"] for x in books))==len(books)
    assert len(set(x["id"] for x in studies))==len(studies)
    assert len(set(x["id"] for x in actions))==len(actions)
    refs={x["id"] for x in studies}
    ids={x["id"] for x in actions}
    assert ids=={f"LE-{i:02d}" for i in range(1,14)}
    for b in books:
        assert b["full_text_read"] is False, b["title"]
        assert b["impact_is_empirically_measured"] is False
        assert b["access"] in ("authorized_excerpt","author_summary_publisher_TOC",
            "publisher_TOC","publisher_description","publisher_TOC_excerpts",
            "professional_public_review","publisher_author_method",
            "publisher_author_excerpt","publisher_author_description")
        assert 0<=b["fit100"]<=100
        assert urlparse(b["url"]).scheme=="https"
    for s in studies:
        assert urlparse(s["url"]).scheme=="https"
        assert s["not_finnish_yki_direct"] is True
        assert s["claim"]
    for action in actions:
        assert action["status"]=="target_not_yet_accepted"
        assert set(action["method_ids"])<=existing,action["id"]
        assert set(action["study_ids"])<=refs,action["id"]
        assert 0<=action["priority100"]<=100
        assert action["phase"] in ("P0","P1","P0/P1")
        assert action["implementation"] and action["success_measure"]
        assert action["score_is"]=="editorial_product_fit_not_measured_effect"
    assert data["effectiveness"]["results_measured"] is False
    assert "7" in data["effectiveness"]["primary"] or "seven" in data["effectiveness"]["primary"]
    example=data["prototype_schedule"];assert example["duration_minutes"]==20
    assert sum(x[1] for x in example["phases"])==20
    assert example["schedule_is_experimental_design_not_optimal_science"] is True
    assert "full copyrighted books were NOT read" in data["book_access_rule"]
    assert "commercial" in data["rights"].lower()
    docs={
        "docs/19-learning-books-to-engineering-2026-10.md": ["LE-11. Calibration","20-хвилинної місії","повні тексти"],
        "docs/15-two-modes-skill-scopes.md": ["**LE-01**","**LE-13**","**AC-47:**","**AC-59:**"],
        "docs/12-mvp-architecture.md": ["Learning-science implementation bridge","RetrievalScheduler"],
        "docs/11-mvp-product-requirements.md": ["Новий фундамент навчального двигуна","LE-01"],
        "docs/04-evidence-and-learning-science.md": ["Додатковий evidence-to-engineering review"],
        "README.md": ["Evidence-to-engineering","research/learning-blueprints-books-v1.json"]
    }
    for path,phrases in docs.items():
        content=(ROOT/path).read_text(encoding="utf-8")
        for phrase in phrases:
            assert phrase in content,(path,phrase)
    print(f"PASS: {len(books)} authorized-preview books, {len(studies)} source records, {len(actions)} feature links, 67 existing method IDs preserved")

if __name__=="__main__":
    run()
