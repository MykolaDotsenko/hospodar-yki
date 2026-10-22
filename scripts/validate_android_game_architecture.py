#!/usr/bin/env python3
"""Static requirements validation for ADR-023 Android offline game delivery.

This validator tests spec consistency, not a signed AAB, Android compatibility,
offline delivery, multimedia licensing, or measured artifact size.
"""
import json
from pathlib import Path
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parents[1]
def read(p):return json.loads((ROOT/p).read_text(encoding="utf8"))

def main():
    j=read("research/architecture/android-game-distribution-v1.json")
    parent=read("research/architecture/architecture-decision-v1.json")
    assert j["schema_version"]=="1.0.0"
    assert j["adr"]=="ADR-023" and j["based_on"]=="ADR-022"
    assert parent["latest_amendment"]=="ADR-023"
    assert parent["android_supplemental_adr"]=="research/architecture/android-game-distribution-v1.json"
    assert parent["repository_baseline"]["full_exam_implemented"] is False
    assert j["status"]=="TARGET_SPEC_NOT_IMPLEMENTED"
    preferred=[x for x in j["distributions"] if x["preferred"]]
    assert len(preferred)==1
    play=preferred[0]
    assert play["id"]=="google_play_aab_pad_install_time"
    assert play["first_run_offline"] is True
    assert play["one_user_install_action"] is True
    assert play["literally_one_standalone_apk"] is False
    limits=play["verified_limits_mb"]
    assert limits=={"base_module":500,"each_asset_pack":1500,"cumulative_base_and_installtime":4000}
    direct=[x for x in j["distributions"] if x["id"]=="direct_single_2gb_3gb_apk"][0]
    assert direct["preferred"] is False
    assert direct["literally_one_standalone_apk"]=="PROTOTYPE_REQUIRED_NOT_GUARANTEED"
    assert direct["status"]=="FEASIBILITY_RESEARCH_ONLY"
    assert j["packaging_budget_status"]=="PLANNED_UNMEASURED"
    budget=j["budget_mb"]
    assert j["measured"] is False
    assert budget and len(budget)==5
    assert sum(x["proposed_compressed_mb"] for x in budget)==j["total_budget_mb"]==2600
    assert 2000<=j["total_budget_mb"]<=3000
    assert j["max_pack_mb"]==1500 and j["max_installtime_mb"]==4000
    assert all(x["proposed_compressed_mb"]<=1500 for x in budget if x["delivery"]=="install-time")
    assert next(x for x in budget if x["name"]=="base")["proposed_compressed_mb"]<=500
    assert all(x["delivery"] in {"base","install-time","base-or-install-time"} for x in budget)
    assert j["youtube_and_official_solki"]=="LINK_ONLY_AND_ONLINE_UNLESS_EXPLICIT_DISTRIBUTION_LICENSE"
    assert "all" not in j["rights"].lower().split() or "licensed" in j["rights"]
    engine=j["engine"]
    assert "Phaser" in engine["game2d"] and "Capacitor" in engine["android_shell"]
    assert "Kotlin" in engine["android_shell"]
    assert "install-time" in engine["asset_delivery"]
    assert "Dexie" in engine["local_events"]
    assert "XState" in engine["exam"]
    assert j["offline_guarantees"]["generative_AI_feedback_without_network"] is False
    assert j["offline_guarantees"]["official_YKI2027_clone"] is False
    assert j["offline_guarantees"]["base_curriculum_without_network"] is True
    assert j["offline_guarantees"]["installed_video_audio_without_network"] is True
    assert j["android_asset_access"]["webview_local_uri"]=="NOT_ASSUMED_READY"
    assert j["android_asset_access"]["no_bundle_content_copy_to_indexeddb"] is True
    assert j["game_design"]["exam_mode_no_gameplay"] is True
    assert j["game_design"]["skip_scene"] is True
    assert j["game_design"]["reduced_motion"] is True
    assert j["acceptance_ids"]==(
        [f"ANDR-{i:02d}" for i in range(1,19)] +
        [f"WEB-{i:02d}" for i in range(1,11)]
    )
    platforms=j["platform_strategy"]
    assert platforms["web"]["mandatory"] is True
    assert platforms["android"]["mandatory"] is True
    assert "PWA" in platforms["web"]["kind"]
    assert "Capacitor" in platforms["android"]["kind"]
    assert "Phaser" in platforms["model"]
    assert "2–3 GB" in platforms["web"]["media"]
    assert "install-time" in platforms["android"]["deploy"]
    assert platforms["sync"]["optional"] is True
    assert platforms["sync"]["upload_raw_learner_voice_by_default"] is False
    assert len(platforms["strict_parity"])>=6
    assert any(x["id"]=="web_pwa_parity" for x in j["development_gates"])
    assert any(x["id"]=="cross_platform_domain_parity" for x in j["development_gates"])
    assert "WEB-01" in (ROOT/"docs/23-android-offline-game-and-3gb-media-architecture.md").read_text(encoding="utf8")
    assert "WEB-10" in (ROOT/"docs/23-android-offline-game-and-3gb-media-architecture.md").read_text(encoding="utf8")

    assert j["source_urls"] and all(urlparse(x).scheme=="https" for x in j["source_urls"])
    assert all(x["status"]=="NOT_IMPLEMENTED" for x in j["development_gates"])
    for path,markers in {
      "docs/23-android-offline-game-and-3gb-media-architecture.md":["ADR-023","2–3 GB","install-time","1.5GB","ANDR-01","ANDR-18","Phaser","Capacitor","YouTube","WebView"],
      "docs/22-optimal-stack-and-architecture-adr-2026-10.md":["PRODUCT AMENDMENT","ADR-023","Phaser"],
      "docs/15-two-modes-skill-scopes.md":["ANDR-01…18","docs/23-android-offline-game-and-3gb-media-architecture.md".split("/")[-1]],
      "docs/12-mvp-architecture.md":["ADR-023", "Capacitor"],
      "README.md":["Android game with all offline multimedia","research/architecture/android-game-distribution-v1.json"]
    }.items():
      text=(ROOT/path).read_text(encoding="utf8")
      for marker in markers:
        assert marker in text,(path,marker)
    assert not (ROOT/"apps/android").is_dir(), "Android scaffold exists; revisit NOT_IMPLEMENTED status before merging"
    print("PASS: dual-platform ADR-023: Web/PWA + Android, 18 Android and 10 Web gates, shared TS, 2.6GB planning pack")

if __name__=="__main__":main()
