#!/usr/bin/env python3
"""Structure-only QA for the YKI-oriented external-audio discovery registry.

This script does not download media, validate permission to redistribute it,
listen for human voices, or certify B1/YKI level.
"""
from __future__ import annotations
import json
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]

def verify(ok, message):
    if not ok:
        raise AssertionError(message)

def https_url(value, label):
    parsed = urlparse(value)
    verify(parsed.scheme == "https" and parsed.netloc, "Must be an HTTPS URL: " + label)

def main():
    data = json.loads((ROOT / "sources/audio/yki-targeted-sources-2026-10.json").read_text(encoding="utf-8"))
    old = json.loads((ROOT / "sources/audio/recording-sources.json").read_text(encoding="utf-8"))
    entries = data["external_candidates"]
    summary = data["summary"]
    official = old["official_yki_link_only"]
    official_listening = sum(x["module"] == "puheen_ymmartaminen" for x in official)
    official_speaking = sum(x["module"] == "puhuminen" for x in official)
    verify(official_listening == 11 and official_speaking == 2, "Official catalog changed; recheck counts")
    verify(len(entries) == summary["new_catalogued_sources"] == 16, "Entry count changed")
    verify(summary["official_yki_demo_audio_already_registered"] == official_listening, "Duplicate count incorrect")
    verify(summary["official_yki_spoken_prompt_audio_already_registered"] == official_speaking, "Official speaking count incorrect")
    verify(summary["physically_imported_audio_files_this_update"] == 0, "Do not claim copies")
    verify(len({x["id"] for x in entries}) == len(entries), "Duplicate ID")
    direct = 0
    for x in entries:
        ident = x["id"]
        for field in ("provider", "name", "level", "format", "transcript", "license", "license_verification", "audio_type", "legal", "notes"):
            verify(isinstance(x.get(field), str) and x[field].strip(), "Missing " + field + " in " + ident)
        https_url(x["page"], ident + ".page")
        if x.get("audio_url"):
            direct += 1
            https_url(x["audio_url"], ident + ".audio_url")
            verify(x["audio_url"].lower().split("?")[0].endswith(".mp3"), "Not a direct mp3: " + ident)
        if x.get("transcript_url"):
            https_url(x["transcript_url"], ident + ".transcript_url")
        verify(x["duration_seconds"] is None or 0 < x["duration_seconds"] < 86400, "Bad duration")
        verify(x["local_file_exists"] is False and x["binary_checked"] is False, "Unverified local file in catalog " + ident)
        verify(x["is_official_yki_sample"] is False and x["not_exam_simulation"] is True, "Mislabelled exam audio " + ident)
        verify(type(x["expert_fit_score_0_100"]) is int and 0 <= x["expert_fit_score_0_100"] <= 100, "Bad rating")
    verify(direct == summary["verified_direct_external_mp3_urls"] == 2, "Direct links mismatched")
    doc = (ROOT / "sources/audio/YKI-LISTENING-RESEARCH-2026-10.md").read_text(encoding="utf-8")
    verify("16 каталогізованих" in doc, "Doc lost entry count")
    verify("0 нових аудіофайлів" in doc, "Must distinguish sources from downloaded audio")
    print(json.dumps({"result": "PASS", "new_external_candidates": len(entries), "publisher_linked_direct_mp3": direct, "official_listening_existing": official_listening, "official_speaking_existing": official_speaking, "new_local_audio_files": 0, "scope": "metadata-only; not acoustic or license compliance testing"}, ensure_ascii=False))

if __name__ == "__main__":
    main()
