#!/usr/bin/env python3
"""Ensure the critical 2026-10-24 Finnish-method synthesis reuses canonical /100 scores.

This validates provenance and truthful research/implementation boundaries; it
does NOT certify causal effects, Finnish teaching accuracy, or YKI outcomes.
"""
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
METHODS = "research/pedagogy/learning-methods-v1.json"
RATINGS = "research/pedagogy/learning-effectiveness-ratings-v1.json"
REPORT = "research/pedagogy/24-global-best-methods-finnish-2026-10.md"
INDEX = "research/pedagogy/README.md"
STUDY = "docs/05-study-system.md"

def audit(root: Path = ROOT) -> list[str]:
    problems = []
    try:
        catalog = json.loads((root / METHODS).read_text(encoding="utf-8"))
        impact = json.loads((root / RATINGS).read_text(encoding="utf-8"))
        report = (root / REPORT).read_text(encoding="utf-8")
        index = (root / INDEX).read_text(encoding="utf-8")
        study = (root / STUDY).read_text(encoding="utf-8")
    except (OSError, ValueError) as exc:
        return ["Required canonical evidence or report missing/invalid: " + str(exc)]

    sources = catalog.get("source_register", {})
    methods = {m.get("id"): m for m in catalog.get("methods", [])}
    ratings = {m.get("id"): m for m in impact.get("ratings", [])}
    if len(methods) != 67 or len(sources) != 70 or impact.get("count") != 67 or set(methods) != set(ratings):
        problems.append("67-method/70-source authoritative baseline drifted")
    novel = sources.get("extensive2025", {})
    if novel.get("url") != "https://doi.org/10.1007/s10648-025-10068-6" or novel.get("type") != "L2-extensive-reading-meta":
        problems.append("Missing 2025 reading meta-analysis citation and evidence class")
    reading = methods.get("extensive-reading", {})
    read_rating = ratings.get("extensive-reading", {})
    if "extensive2025" not in reading.get("sources", []) or read_rating.get("source_ids") != reading.get("sources", []):
        problems.append("Reading study not attached to BOTH canonical score views")
    if len(re.findall(r"^\| \`[a-z0-9-]+\` \| \*\*\d+\*\* \| \*\*\d+\*\* \|", report, re.M)) < 24:
        problems.append("Main comparison table lacks 24 directly linked method scores")
    table = re.findall(r"^\| \`([a-z0-9-]+)\` \| \*\*(\d+)\*\* \| \*\*(\d+)\*\* \|", report, re.M)
    antipatterns = re.findall(r"^\| \`([a-z0-9-]+)\` [^|\n]* \| (\d+) \| (\d+) \|", report, re.M)
    if len(antipatterns) != 6:
        problems.append("Six harmful/low-yield practices lack explicit dual /100 scores")
    if len({name for name, _, _ in [*table, *antipatterns]}) != len(table) + len(antipatterns):
        problems.append("Duplicate named method in /100 ranking excerpts")
    for identifier, product, learning in [*table, *antipatterns]:
        mm, rr = methods.get(identifier), ratings.get(identifier)
        if not mm or not rr:
            problems.append("Invented second-registry method " + identifier)
            continue
        if int(product) != mm["score"] or int(learning) != rr["learning_effectiveness_0_to_100"]:
            problems.append("Reported product/learning rating mismatches canonical registry " + identifier)
    if len(table) < 24:
        problems.append("Too few documented high-impact methods")
    for identifier in ("yki-constructive-alignment","human-anchor-calibration","unseen-diagnostics"):
        m, r = methods.get(identifier), ratings.get(identifier)
        if not m or not r or f"`{identifier}` **{m['score']}/{r['learning_effectiveness_0_to_100']}**" not in report:
            problems.append("Assessment infrastructure score omitted: " + identifier)
    expected_links = [
      "10.1007/s10648-025-10068-6", "10.1111/lang.12479",
      "10.1016/j.system.2025.103868", "10.1016/j.jslw.2025.101255",
      "10.1016/j.learninstruc.2024.101961", "10.1111/lang.12697",
      "10.1075/jslp.20040.sal", "10.1111/j.1539-6053.2009.01038.x",
      "https://www.oph.fi/en/national-certificates-language-proficiency-yki"
    ]
    for url_fragment in expected_links:
        if url_fragment not in report:
            problems.append("Missing critical primary/official evidence: " + url_fragment)
    for marker in ("НЕ", "не", "відкладен", "delayed", "LEARN", "EXAM", "puhekieli", "rektio", "YKI", "67", "70"):
        if marker not in report:
            problems.append("Missing necessary research/safety boundary " + marker)
    if Path(REPORT).name not in index or Path(REPORT).name not in study:
        problems.append("Newest study not discoverable from researcher and learner docs")
    for path in ("research/pedagogy/08-learning-methods-evidence-2026-10.md",
                 "research/pedagogy/12-finnish-yki-learning-effectiveness-2026-10.md"):
        try:
            text = (root / path).read_text(encoding="utf-8")
        except OSError:
            problems.append("Canonical original report missing: " + path)
            continue
        if Path(REPORT).name not in text or "70" not in text:
            problems.append("Canonical historical report not updated: " + path)
    return problems

if __name__ == "__main__":
    problems = audit()
    for p in problems: print("FAIL:", p)
    if problems: raise SystemExit(1)
    print("PASS: 67 canonical /100 methods; 70 sources; 24 priority dual-score rows, 6 anti-pattern rows, 2025 extensive-reading meta, methodological safety and research links")
