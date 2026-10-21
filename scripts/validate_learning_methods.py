#!/usr/bin/env python3
"""Validate the evidence-informed method registry used for future Hospodar YKI modules.

Structural QA only. Passing this script does NOT prove pedagogy, Finnish linguistic
accuracy, research quality, nor that a method improves YKI examination results.
"""
from __future__ import annotations

import json
import pathlib
from urllib.parse import urlparse

ROOT = pathlib.Path(__file__).resolve().parents[1]
CATALOG = ROOT / "research" / "learning-methods-v1.json"
LIMITS = {
    "evidence": 30,
    "Finnish_YKI_fit": 30,
    "A2_to_B1_fit": 20,
    "implementation": 10,
    "learner_agency": 10,
}
PRIORITIES = {"P0", "P1", "P2", "AVOID_OR_SUPPLEMENT_ONLY"}


def require(test, message):
    if not test:
        raise AssertionError(message)


def main():
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    sources, methods = data["source_register"], data["methods"]
    require(data["schema_version"] == "1.0.0", "Unexpected schema")
    require(data["score_component_limits"] == LIMITS, "Rubric changed without updating validator")
    require(len(methods) == 35, "Expected 35 reviewed methods")
    require(len(sources) == 29, "Expected 29 references")
    require(len({m["id"] for m in methods}) == len(methods), "Duplicate method IDs")

    for ref_id, entry in sources.items():
        require(ref_id and entry.get("title") and entry.get("type"), "Incomplete source: " + ref_id)
        parsed = urlparse(entry.get("url", ""))
        require(parsed.scheme == "https" and parsed.netloc, "Non-HTTPS source: " + ref_id)

    previous = 101
    counts = {p: 0 for p in PRIORITIES}
    for m in methods:
        key = m["id"]
        require(isinstance(key, str) and key and key.isascii(), "Invalid method ID")
        require(0 <= m["score"] <= 100 and isinstance(m["score"], int), "Bad rating: " + key)
        require(m["score"] <= previous, "Catalog is not sorted descending: " + key)
        previous = m["score"]
        parts = m["score_components"]
        require(set(parts) == set(LIMITS), "Incomplete score breakdown: " + key)
        for component, limit in LIMITS.items():
            value = parts[component]
            require(type(value) is int and 0 <= value <= limit, "Bad component: " + key + "/" + component)
        require(sum(parts.values()) == m["score"], "Score does not add up: " + key)
        expected = "P0" if m["score"] >= 90 else (
            "P1" if m["score"] >= 80 else (
                "P2" if m["score"] >= 70 else "AVOID_OR_SUPPLEMENT_ONLY"
            )
        )
        require(m["priority"] == expected, "Bad priority: " + key)
        require(m["evidence_confidence"], "Missing evidence label: " + key)
        for field in ("name_uk", "reason_uk", "example_fi", "app_feature_uk", "measurement_uk", "limitation_uk"):
            require(isinstance(m.get(field), str) and m[field].strip(), "Missing " + field + ": " + key)
        require(m["sources"] and len(m["sources"]) == len(set(m["sources"])), "Missing/duplicate sources: " + key)
        for ref_id in m["sources"]:
            require(ref_id in sources, "Unknown cited source: " + ref_id + " in " + key)
        counts[m["priority"]] += 1

    print(json.dumps({
        "result": "PASS",
        "methods": len(methods),
        "sources": len(sources),
        "priority_counts": counts,
        "scope": "metadata integrity only; research interpretation and CEFR suitability require expert review",
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
