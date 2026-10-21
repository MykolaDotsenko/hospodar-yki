#!/usr/bin/env python3
"""Validate design-truth and platform boundaries in Hospodar YKI ADR-024.

This is static specification consistency, NOT a real-device reliability test.
"""
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[1]
def read(path):
    return json.loads((ROOT/path).read_text(encoding="utf-8"))

def main():
    a=read("research/reliability-architecture-adr-v1.json")
    assert a["adr"]=="ADR-024"
    assert a["status"]=="TARGET_ONLY_NOT_IMPLEMENTED"
    assert a["platforms"]["web"]["repository"]=="IndexedDB/Dexie"
    assert a["platforms"]["android"]["repository"]=="Kotlin Room/SQLite via Capacitor bridge"
    assert a["platforms"]["web"]["data_eviction_possible"] is True
    assert "Play Asset Delivery install-time" in a["platforms"]["android"]["media"]
    assert a["contracts"]["domain_pure_ts"] is True
    assert a["contracts"]["transactional_first_attempt_and_snapshot"] is True
    assert a["contracts"]["save_failure_blocks_progression"] is True
    assert a["contracts"]["unverified_2027_exactness_blocked"] is True
    assert a["contracts"]["production_grade_official_yki_grade"] is False
    assert a["contracts"]["voice_upload_by_default"] is False
    assert a["release_constraints"]["base_mb_max"]==500
    assert a["release_constraints"]["single_asset_pack_gb_max"]==1.5
    assert a["release_constraints"]["total_installtime_gb_max"]==4
    assert a["release_constraints"]["installtime_disk_headroom_factor_min"]>=2
    assert all(a["release_constraints"][x] is False for x in ("actual_aab_size_measured","actual_room_plugin_implemented","actual_pwa_build_implemented"))
    assert a["test_ids"]==[f"REL-{i:02d}" for i in range(1,17)]
    assert len(a["audit_rounds"])==3
    for f,s in {
      "docs/24-reliability-hardened-architecture-web-android.md":["Room","Dexie","REL-01","REL-16","AssetManager","SQLite","2–3GB","IndexedDB"],
      "docs/22-optimal-stack-and-architecture-adr-2026-10.md":["ADR-024","Room"],
      "docs/23-android-offline-game-and-3gb-media-architecture.md":["ADR-024","Room"],
      "docs/12-mvp-architecture.md":["ADR-024","LearnerRepository"],
      "README.md":["Reliability-first architecture ADR-024"],
    }.items():
      body=(ROOT/f).read_text(encoding="utf-8")
      for value in s:
        assert value in body,(f,value)
    print("PASS ADR-024: independent Web Dexie/Android Room persistence, 16 release gates and honest not-yet-built offline game")

if __name__=="__main__":
    main()
