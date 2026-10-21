#!/usr/bin/env python3
"""Contract tests for source-grounded Hospodar YKI digital fidelity dossier.

Static consistency validation only; cannot prove digital 2027 UI or legal accuracy.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOOK = ROOT / "research" / "official-yki-deep-audit-v2.json"
PATTERNS = ROOT / "research" / "yki-official-patterns-v2.json"
SKILLS = {"reading", "listening", "writing", "speaking"}
VALID_CLASSES = {
    "official_current", "official_current_mixed_legacy",
    "legal_foundation_2011", "legal_2011_registry",
    "official_rubric", "historical_official_demo",
    "historical_paper_instruction", "university_description",
    "third_party_training"
}
VALID_CLAIMS = {
    "official_current", "official_current_mixed_legacy",
    "legal_foundation_2011", "official_rubric",
    "historical_sample", "unverified_2027"
}

def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))

def validate():
    j = load(BOOK)
    p = load(PATTERNS)
    assert j["schema_version"] == p["schema_version"] == "2.0.0"
    assert j["checked_at"] == p["checked_at"] == "2026-10-21"
    sources = {s["id"]: s for s in j["sources"]}
    assert len(sources) == len(j["sources"]) == 18
    assert set(sources) >= {"oph_basis","finlex_basis","oph_schedule","oph_pilot",
                            "speaking_rubric","writing_rubric",
                            "jyu_reading","jyu_listening","jyu_writing","jyu_speaking"}
    for source in sources.values():
        assert source["url"].startswith("https://")
        assert source["evidence_class"] in VALID_CLASSES, source["id"]
        assert source["license_to_rehost_exam_content"] is False

    doc = j["source_document_year_warning"]
    assert doc["actual_pdf_year"] == 2011
    assert "2011" in sources["oph_basis"]["url"]
    assert doc["oph_link_label"].endswith("2026")
    assert "2011" in sources["finlex_basis"]["url"]
    claims = j["claims"]
    assert len(claims) == 40
    assert len({x["id"] for x in claims}) == len(claims)
    for claim in claims:
        assert claim["id"].startswith("FY-")
        assert claim["source_ids"]
        assert set(claim["source_ids"]) <= set(sources), claim["id"]
        assert claim["status"] in VALID_CLAIMS, claim["id"]
        if claim["status"] in {"historical_sample", "unverified_2027"}:
            assert claim["assertible_in_2027_digital"] is False
        if claim["status"] == "unverified_2027":
            assert claim["fidelity_policy"] == "BLOCK_STRICT_OFFICIAL_CLAIM"
    assert j["confirmed"]["grade3_cefr"] == "B1"
    assert j["confirmed"]["grade4_cefr"] == "B2"
    assert set(j["confirmed"]["subtests"]) == SKILLS
    assert j["confirmed"]["digital_2027"] is True
    assert j["strict_digital_fidelity"]["enabled"] is False
    assert j["repeat_legacy_not_equal_digital"] is True
    unknown = j["unknowns"]
    assert len(unknown) >= 15 and len({u["id"] for u in unknown}) == len(unknown)
    assert set(j["strict_digital_fidelity"]["missing_fields"]) == {u["id"] for u in unknown}
    assert all(u["value"] is None and u["status"] == "UNVERIFIED_2027" for u in unknown)
    assert j["result_policy"]["official_conversion_cutoffs_known"] is False
    assert j["result_policy"]["single_overall_official_score"] is False
    assert j["result_policy"]["human_calibration_required"] is True

    dates = j["calendar"]
    assert any(d["date"] == "2027-04-10" and set(d["skills"]) == SKILLS and
               d["registration_open"] == "2027-03-08" and
               d["registration_close"] == "2027-03-25" for d in dates)
    assert len({d["date"] for d in dates}) == len(dates)
    assert all(d["mode"] == "digital" and set(d["skills"]) <= SKILLS for d in dates)

    assert len(p["topic_taxonomy"]) == 9
    assert len(p["communication_functions"]) == 6
    patterns = p["patterns"]
    ids = {f["id"] for f in patterns}
    assert len(patterns) == len(ids) == 13
    assert {q["skill"] for q in patterns} == SKILLS
    for pattern in patterns:
        assert set(pattern["source_ids"]) <= set(sources), pattern["id"]
        assert pattern["official_2027_item_count"] is None
        assert pattern["official_2027_timer_seconds"] is None
        assert pattern["rights"] == "external_description_only_no_official_item_text"
    examples = p["historical_examples"]
    assert len(examples) == 12
    assert len({s["sample_id"] for s in examples}) == len(examples)
    for sample in examples:
        assert sample["pattern_id"] in ids
        assert sample["digital_2027_timing_verified"] is False
        assert sample["rights"] == "LINK_ONLY_NOT_DISTRIBUTABLE_BY_DEFAULT"
        if "official_audio_url" in sample:
            assert sample["official_audio_url"].startswith("https://ykitesti.solki.jyu.fi/")
    spec = p["official_2027_exact_profile"]
    assert spec["source_status"] == "UNVERIFIED"
    assert spec["can_prove_exact_fidelity"] is False
    assert all(v is None for k, v in spec.items() if k not in {"source_status", "can_prove_exact_fidelity"})
    for name, parts in {
        "docs/20-yki-official-complete-audit-2026-10.md": [
            "30.11.2011", "13", "2027", "SOLKI", "B1", "B2", "2011", "U10"],
        "docs/21-digital-yki-exam-simulator-executable-spec.md": [
            "F1", "F6", "strict_verified", "EXV-01", "EXV-20", "ASR"],
        "docs/14-digital-yki-fidelity-spec.md": ["Офіційний комплексний аудит v2"],
        "docs/13-yki-exam-format-and-real-examples-2027.md": ["granular SOLKI"],
        "docs/15-two-modes-skill-scopes.md": ["YKI-FID-01", "YKI-FID-10"],
        "README.md": ["Повний офіційний аудит YKI"]
    }.items():
        t=(ROOT / name).read_text(encoding="utf-8")
        for part in parts:
            assert part in t, (name, part)
    print("PASS: official YKI provenance and unknowns; 40 verified-classified claims, 13 task families, 12 historic specimens, 2027 strict mode blocked")

if __name__ == "__main__":
    validate()
