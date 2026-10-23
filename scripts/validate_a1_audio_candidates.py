#!/usr/bin/env python3
"""Protect source-only Finnish phrase discoveries from fictitious local/graded claims."""
from __future__ import annotations
import json
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT=Path(__file__).resolve().parents[1]
SOURCE="sources/audio/recording-sources.json"
LESSONS="learning/exercises/a1/audio-visual/lessons.json"
AUDIO="assets/audio/library.json"
AVAILABLE="assets/audio/available.json"
PICTURES="assets/images/pictures/available.json"
EXPECTED={
 "ole_hyva_2026":("Suomipoika","CC-BY-3.0","Fi-Ole hyvä.ogg"),
 "hyvaa_paivaa_2026":("Vassilik","CC-BY-SA-3.0","Fi-Hyvää päivää.ogg"),
 "hyvaa_huomenta_2026":("Vassilik","CC-BY-SA-3.0","Fi-Hyvää huomenta.ogg"),
 "en_syo_elaimesta_2026":("Vassilik","CC-BY-SA-3.0","Fi-minä-en-syö-mitään-mikä-tulee-eläimestä.ogg"),
 "ei_missaan_tapauksessa_2026":("Jyri Leskinen","PD-self","Fi-ei missään tapauksessa.ogg")
}

def check(root:Path=ROOT)->list[str]:
    problems=[]
    def load(path):
        try:return json.loads((root/path).read_text(encoding="utf-8"))
        except (OSError,ValueError) as exc:
            problems.append(f"Invalid {path}: {exc}")
            return {}
    all_sources=load(SOURCE).get("open_licensed_downloads",[])
    player=load(AUDIO).get("entries",[])
    offline=load(AVAILABLE).get("items",[])
    photos=load(PICTURES).get("assets",[])
    lesson_data=load(LESSONS)
    known_ids={x.get("id") for x in player}
    ready_ids={x.get("id") for x in offline}
    known_paths={x.get("path") for x in player}
    known_photos={x.get("id") for x in photos if x.get("state")=="verified_binary"}
    ids=[x.get("id") for x in all_sources]
    urls=[unquote(x.get("source_page","")).casefold() for x in all_sources]
    filenames=[x.get("download",{}).get("file_title") for x in all_sources if x.get("download",{}).get("type")=="commons"]
    if len(ids)!=len(set(ids)):
        problems.append("Duplicate source ID")
    # Historical catalog already has two IDs pointing at the same En ymmärrä page.
    # Scope this new gate to newly added items; do not silently rewrite old provenance.
    for item in all_sources:
        if item.get("id") not in EXPECTED:
            continue
        url=unquote(item.get("source_page","")).casefold()
        title=item.get("download",{}).get("file_title")
        if urls.count(url)!=1 or filenames.count(title)!=1:
            problems.append("Duplicate newly proposed Commons page/title "+str(item.get("id")))
    indexed={x.get("id"):x for x in all_sources}
    if not EXPECTED.keys()<=indexed.keys():
        problems.append("Missing required new verified source")
    for sid,(author,license_name,file_title) in EXPECTED.items():
        row=indexed.get(sid,{})
        if row.get("author")!=author or row.get("license")!=license_name or row.get("download")!={"type":"commons","file_title":file_title}:
            problems.append("Source identity/licensing drift "+sid)
        url=urlsplit(row.get("source_page",""))
        if url.scheme!="https" or url.netloc!="commons.wikimedia.org" or not url.path.startswith("/wiki/File:"):
            problems.append("Source not original Commons page "+sid)
        if row.get("source_page_checked") is not True or row.get("source_page_author_and_license_verified") is not True or row.get("verified_license")!="2026-10-23":
            problems.append("Missing verified source page provenance "+sid)
        path=row.get("relative_path","")
        if not path.startswith("assets/audio/open/phrases/") or ".." in Path(path).parts or not path.endswith(".ogg"):
            problems.append("Unsafe prospective local filename "+sid)
        if row.get("local_file_exists") is not False or row.get("binary_checked") is not False or row.get("offline_ready") is not False:
            problems.append("Unverified candidate masquerades as local "+sid)
        if sid in known_ids or sid in ready_ids or path in known_paths or (root/path).exists():
            problems.append("Source-only candidate referenced as actual local audio "+sid)
        if row.get("teacher_review")!="pending" or row.get("acoustic_review")!="pending" or row.get("source_type")!="individual_recorded_phrase_not_dialogue":
            problems.append("Unreviewed single phrase presented as mastered dialogue "+sid)
        if row.get("is_official_yki") is not False:
            problems.append("Unofficial source marked official "+sid)
    drafts=lesson_data.get("source_only_practice_drafts",[])
    if len(drafts)!=5 or {d.get("audio_candidate_id") for d in drafts}!=set(EXPECTED):
        problems.append("Candidate activity source coverage mismatch")
    for item in drafts:
        sid=item.get("audio_candidate_id")
        if not item.get("exercise_id") or item.get("photo_id") not in known_photos:
            problems.append("Missing draft task or verified photo "+str(sid))
        if item.get("asset_status")!="source_link_only_not_in_web_player" or item.get("mode")!="LEARN_draft_not_shipped":
            problems.append("Unshipped candidate misrepresented as playable "+str(sid))
        if item.get("response_status")!="ungraded" or item.get("auto_feedback") is not False or item.get("delayed_review_automation") is not False or item.get("teacher_review")!="pending":
            problems.append("Unsafe grading or automatic review "+str(sid))
        fields=("independent_listening_prompt_fi","independent_task_uk","repair_prompt_fi","transfer_prompt_fi","transfer_prompt_uk","delayed_selftest_fi")
        if any(not isinstance(item.get(k),str) or not item[k].strip() for k in fields):
            problems.append("Missing task sequence "+str(sid))
        models=item.get("models_after_first_attempt_fi",[])
        if len(models)<2 or not all(isinstance(s,str) and s.strip() for s in models):
            problems.append("Missing post-first-answer examples "+str(sid))
        if any(key in item for key in ("score","correct_index","official_yki_score","answer_key")):
            problems.append("Unreviewed draft contains graded answer "+str(sid))
    return problems

if __name__=="__main__":
    errors=check()
    for error in errors:print("FAIL:",error)
    if errors:raise SystemExit(1)
    print("PASS five uniquely sourced, rights-verified, source-only Finnish listening draft activities (0 local files)")
