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
CATALOG = ROOT / "research" / "pedagogy" / "learning-methods-v1.json"
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



def validate_research_counts(method_count, source_count, rating_count, stated_count):
    """Permit adding rigorously reviewed methods, never silently shrinking or desyncing.

    New method additions still require source-backed details, ranked documentation,
    and one-to-one effectiveness ratings validated in main().
    """
    errors = []
    if method_count < 67:
        errors.append("Method baseline shrank below 67")
    if source_count < 69:
        errors.append("Source baseline shrank below 69")
    if rating_count != method_count or stated_count != rating_count:
        errors.append("Method and effectiveness counts differ")
    return errors


def main():
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    sources, methods = data["source_register"], data["methods"]
    require(data["schema_version"] == "1.2.0", "Unexpected schema")
    require(data["score_component_limits"] == LIMITS, "Rubric changed without updating validator")
    require(not validate_research_counts(len(methods), len(sources), len(methods), len(methods)), "Reviewed evidence baseline unexpectedly shrank")
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
    blueprint_file = ROOT / "research" / "pedagogy" / "yki-methodology-implementation-v1.json"
    blueprint = json.loads(blueprint_file.read_text(encoding="utf-8"))
    require(blueprint["status"] == "implementation_design_not_implemented", "Blueprint cannot claim implementation")
    require(len(blueprint["modules"]) >= 11, "Implementation blueprint unexpectedly shrank")
    require(len(blueprint["experiment_backlog"]) >= 4, "Experiment backlog unexpectedly shrank")
    require(len(blueprint.get("new_evidence_workstreams", [])) >= 5, "Evidence workstreams unexpectedly shrank")
    require(blueprint.get("evidence_effectiveness_registry") == "research/pedagogy/learning-effectiveness-ratings-v1.json", "Missing efficacy link")

    known_method_ids = {m["id"] for m in methods}
    modules = blueprint["modules"]
    require(len({mod["id"] for mod in modules}) == len(modules), "Duplicate blueprint modules")
    for mod in modules:
        require(mod.get("methods") and set(mod["methods"]) <= known_method_ids, "Unknown method in module: " + mod["id"])
        require(mod.get("steps") and mod.get("acceptance") and mod.get("risks"), "Module missing concrete protocol: " + mod["id"])
        require(mod["priority"] in {"P0","P1","P2"}, "Module priority invalid: " + mod["id"])
    require(len({w["id"] for w in blueprint["new_evidence_workstreams"]}) == len(blueprint["new_evidence_workstreams"]), "Duplicate evidence workstream")
    for w in blueprint["new_evidence_workstreams"]:
        require(set(w["research_method_ids"]) <= known_method_ids, "Unknown methodology for workstream " + w["id"])
        require(w["done_when"] and w["assets"] and w["flow"], "Workstream acceptance/provenance missing " + w["id"])
        require(w["status"] in {"researched_not_implemented", "research_option_only"}, "Workstream falsely marked implemented")
    for exp in blueprint["experiment_backlog"]:
        require(exp["source_methods"] and set(exp["source_methods"]) <= known_method_ids, "Unknown experiment methods " + exp["id"])
        require(all(exp.get(k) for k in ("treatment","control","primary_outcome","guardrail")), "Incomplete A/B hypothesis " + exp["id"])
    require(len({e["id"] for e in blueprint["experiment_backlog"]}) == len(blueprint["experiment_backlog"]), "Duplicate experiment ID")
    legacy_docs = (ROOT / "research" / "pedagogy" / "08-learning-methods-evidence-2026-10.md").read_text(encoding="utf-8")
    new_docs = (ROOT / "research" / "pedagogy" / "11-advanced-yki-learning-methods-2026-10.md").read_text(encoding="utf-8")
    require(f"## Повний рейтинг (Product-fit, {len(methods)} методик)" in legacy_docs, "Main method ranking count stale")
    for method in methods:
        require("(`" + method["id"] + "`)" in legacy_docs, "Missing detailed method card " + method["id"])
    require(f"{len(modules)} модулів" in new_docs and "16" in new_docs, "Implementation research summary stale")


    effectiveness = json.loads((ROOT / "research" / "pedagogy" / "learning-effectiveness-ratings-v1.json").read_text(encoding="utf-8"))
    require(not validate_research_counts(len(methods), len(sources), len(effectiveness["ratings"]), effectiveness["count"]), "Effectiveness and research counts drifted")
    require(len({r["id"] for r in effectiveness["ratings"]}) == len(methods), "Duplicate effectiveness rating IDs")
    require({r["id"] for r in effectiveness["ratings"]} == known_method_ids, "Effectiveness index not a one-to-one match with methods")
    require(effectiveness["scoring_methodology"]["model"] == "EXPERT_JUDGMENT_ORDINAL", "Method effectiveness cannot be claimed as empirical outcome")
    previous_effectiveness = 101
    for rating in effectiveness["ratings"]:
        method = next(m for m in methods if m["id"] == rating["id"])
        ident = rating["id"]
        n = rating["learning_effectiveness_0_to_100"]
        require(type(n) is int and 0 <= n <= 100, "Bad effectiveness rating: " + ident)
        require(n <= previous_effectiveness, "Effectiveness not sorted: " + ident)
        previous_effectiveness = n
        require(method["score"] == rating["previous_product_fit_0_to_100"], "Product-fit overwritten: " + ident)
        require(rating["source_ids"] == method["sources"], "Rating citations drifted: " + ident)
        if "effectiveness_preestimate" in method:
            require(n == method["effectiveness_preestimate"], "New research effectiveness estimate drifted: " + ident)
        low, high = rating["plausible_expert_band"]
        require(type(low) is int and type(high) is int and 0 <= low <= n <= high <= 100, "Illogical uncertainty range: " + ident)
        require(rating["actual_research_effect_size_not_this_score"] is True, "Score misrepresented as evidence: " + ident)
        require(rating["not_yki_pass_probability"] is True, "Unvalidated YKI score misrepresented: " + ident)
        require(rating["confidence_in_score"] in {"high", "moderate", "low"}, "Unknown evidence confidence")
        require(rating["role"] in {"learning_intervention", "assessment_or_infrastructure", "technology_conditional", "not_recommended_standalone"}, "Unknown method role")
    effectiveness_report = (ROOT / "research" / "pedagogy" / "12-finnish-yki-learning-effectiveness-2026-10.md").read_text(encoding="utf-8")
    require(str(len(methods)) in effectiveness_report and str(len(sources)) in effectiveness_report and "g=0,18" in effectiveness_report, "Research findings summary count incomplete")
    require(effectiveness_report.count("| **") >= len(methods), "Not all rated methods shown in table")

    print(json.dumps({
        "result": "PASS",
        "methods": len(methods),
        "effectiveness_ratings": len(effectiveness["ratings"]),
        "rated_scores_not_empirical": True,
        "blueprint_modules": len(modules),
        "ab_hypotheses": len(blueprint["experiment_backlog"]),
        "future_workstreams": len(blueprint["new_evidence_workstreams"]),
        "sources": len(sources),
        "priority_counts": counts,
        "scope": "metadata integrity only; research interpretation and CEFR suitability require expert review",
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
