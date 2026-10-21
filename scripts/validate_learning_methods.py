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
    require(data["schema_version"] == "1.1.0", "Unexpected schema")
    require(data["score_component_limits"] == LIMITS, "Rubric changed without updating validator")
    require(len(methods) == 51, "Expected 51 reviewed methods")
    require(len(sources) == 49, "Expected 49 references")
    require(len({m["id"] for m in methods}) == len(methods), "Duplicate method IDs")

    for ref_id, entry in sources.items():
        require(ref_id and entry.get("title") and entry.get("type"), "Incomplete source: " + ref_id)
        parsed = urlparse(entry.get("url", ""))
        require(parsed.scheme == "https" and parsed.netloc, "Non-HTTPS source: " + ref_id)

    require(all(m.get("added_at") == "2026-10-21" for m in methods if m["id"] in { "yki-constructive-alignment", "human-anchor-calibration", "finnish-quantity-dual-track", "uncertainty-aware-asr" }), "Missing metadata for new research")
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

    # Implementation blueprint must trace directly to researched method IDs.
    blueprint_file = ROOT / "research" / "yki-methodology-implementation-v1.json"
    blueprint = json.loads(blueprint_file.read_text(encoding="utf-8"))
    require(blueprint["status"] == "implementation_design_not_implemented", "Blueprint cannot claim implementation")
    require(len(blueprint["modules"]) == 11, "Expected 11 implementation proposals")
    require(len(blueprint["experiment_backlog"]) == 4, "Expected 4 explicit experiments")
    known_method_ids = {m["id"] for m in methods}
    modules = blueprint["modules"]
    require(len({mod["id"] for mod in modules}) == len(modules), "Duplicate blueprint modules")
    for mod in modules:
        require(mod.get("methods") and set(mod["methods"]) <= known_method_ids, "Unknown method in module: " + mod["id"])
        require(mod.get("steps") and mod.get("acceptance") and mod.get("risks"), "Module missing concrete protocol: " + mod["id"])
        require(mod["priority"] in {"P0","P1","P2"}, "Module priority invalid: " + mod["id"])
    for exp in blueprint["experiment_backlog"]:
        require(exp["source_methods"] and set(exp["source_methods"]) <= known_method_ids, "Unknown experiment methods " + exp["id"])
        require(all(exp.get(k) for k in ("treatment","control","primary_outcome","guardrail")), "Incomplete A/B hypothesis " + exp["id"])
    require(len({e["id"] for e in blueprint["experiment_backlog"]}) == 4, "Duplicate experiment ID")
    legacy_docs = (ROOT / "docs" / "08-learning-methods-evidence-2026-10.md").read_text(encoding="utf-8")
    new_docs = (ROOT / "docs" / "11-advanced-yki-learning-methods-2026-10.md").read_text(encoding="utf-8")
    require("## Повний рейтинг: 51 методика" in legacy_docs, "Main method ranking stale")
    for method in methods:
        require("(`" + method["id"] + "`)" in legacy_docs, "Missing detailed method card " + method["id"])
    require("11 модулів" in new_docs and "16" in new_docs, "Implementation research summary stale")

    print(json.dumps({
        "result": "PASS",
        "methods": len(methods),
        "blueprint_modules": len(modules),
        "ab_hypotheses": len(blueprint["experiment_backlog"]),
        "sources": len(sources),
        "priority_counts": counts,
        "scope": "metadata integrity only; research interpretation and CEFR suitability require expert review",
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
