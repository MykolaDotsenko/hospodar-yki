#!/usr/bin/env python3
"""Validate cited exam-experience research and local mini-rehearsal references.

Structural/integration checks only. Does NOT prove external URL uptime,
copyright clearance, language accuracy, digital YKI fidelity or CEFR calibration.
"""
from __future__ import annotations

import json
import pathlib
from datetime import date
from urllib.parse import urlparse

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCES = ROOT / "research/yki-exam-examples-2026-10.json"
MOCKS = ROOT / "content/b1/exam-patterns/mini-rehearsals-v1.json"
SKILLS = {"reading", "listening", "writing", "speaking"}


def load(path: pathlib.Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    assert isinstance(data, dict)
    return data


def https(url: str) -> bool:
    try:
        parsed = urlparse(url)
        return parsed.scheme == "https" and bool(parsed.netloc) and not parsed.username
    except ValueError:
        return False


def validate() -> dict:
    catalog, mocks = load(SOURCES), load(MOCKS)
    assert catalog["schema_version"] == mocks["schema_version"] == "1.0.0"
    assert catalog["checked_at"] == "2026-10-21"
    assert catalog["policy"]["official_examples"] == "EXTERNAL_LINK_ONLY"
    assert catalog["existing_official_audio_ref"]["local_copy_permitted"] is False
    assert "digital" in catalog["target"].lower()
    assert len(catalog["sources"]) >= 12
    ids = set()
    for src in catalog["sources"]:
        assert src["id"] not in ids, src["id"]
        ids.add(src["id"])
        assert https(src["url"]) and src["rights_status"]
        assert src["last_checked"] == catalog["checked_at"]
        assert isinstance(src["skills"], list) and src["skills"]
        assert set(src["skills"]) <= SKILLS | {"all"}
        if src.get("fallback_url"):
            assert https(src["fallback_url"])
    assert {"oph-2027-schedule", "oph-digital-pilot-2026", "jyu-structure",
            "solki-reading", "solki-listening", "solki-writing", "solki-speaking"} <= ids

    yle = catalog["yle_2024_modules"]
    assert len(yle) == 9 and len({x["id"] for x in yle}) == 9
    assert len({x["url"] for x in yle}) == 9
    assert all(https(x["url"]) and x["license_status"] == "LINK_ONLY" for x in yle)
    dates = catalog["spring_2027_suomi_keskitaso"]["dates"]
    assert len(dates) == 6
    assert len({d["date"] for d in dates}) == 6
    for d in dates:
        day = date.fromisoformat(d["date"])
        start, end = map(date.fromisoformat, (d["registration_open"], d["registration_close"]))
        assert start <= end < day and set(d["components"]) <= SKILLS
        assert d["mode"] == "digital"
    april = next(x for x in dates if x["date"] == "2027-04-10")
    assert set(april["components"]) == SKILLS
    assert april["registration_open"] == "2027-03-08"

    assert mocks["not_official_yki"] and not mocks["exact_digital_format_verified"]
    assert not mocks["human_cefr_calibrated"]
    assert len(mocks["blueprints"]) >= 2
    blueprint_ids = set()
    for mock in mocks["blueprints"]:
        assert mock["id"] not in blueprint_ids
        blueprint_ids.add(mock["id"])
        assert len(mock["skill_blocks"]) == 4
        assert {b["skill"] for b in mock["skill_blocks"]} == SKILLS
        for block in mock["skill_blocks"]:
            path = ROOT / block["content_path"]
            assert path.is_file(), f"Missing content file {path}"
            src = load(path)
            skill = block["skill"]
            if skill == "reading":
                item = next(x for x in src["items"] if x["id"] == block["item_id"])
                question_ids = {q["id"] for q in item["questions"]}
                assert set(block["question_ids"]) <= question_ids
                assert len(block["question_ids"]) >= 2
            elif skill == "listening":
                item = next(x for x in src["lessons"] if x["id"] == block["item_id"])
                question_ids = {q["id"] for q in item["questions"]}
                assert set(block["question_ids"]) <= question_ids
                assert item["synthetic_audio"] is True
                assert block["synthetic_audio"] is True
                assert block["audio_path"] == item["path"]
                assert (ROOT / block["audio_path"]).is_file()
                assert len(block["question_ids"]) >= 2
            else:
                assert any(x["id"] == block["item_id"] for x in src[skill])
                assert block["scoring_policy"] == "ungraded_until_human_review"
    return {"PASS": True, "research_sources": len(catalog["sources"]),
            "yle_b1_modules": len(yle), "dates": len(dates),
            "mini_rehearsals": len(blueprint_ids), "skill_blocks": sum(
                len(x["skill_blocks"]) for x in mocks["blueprints"])}


if __name__ == "__main__":
    print(json.dumps(validate(), ensure_ascii=False))
