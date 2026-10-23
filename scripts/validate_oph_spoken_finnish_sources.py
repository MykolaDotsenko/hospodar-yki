#!/usr/bin/env python3
"""Audit OPH adult Finnish audio source-only LEARN missions.

This checks public page provenance, didactic shape, response safety and absence
of fictional local media; it does not play/inspect audio or grant redistribution.
"""
from __future__ import annotations
import json
from pathlib import Path
from urllib.parse import urlsplit

ROOT=Path(__file__).resolve().parents[1]
CATALOG="sources/audio/oph-adult-spoken-finnish-2026-10.json"
PRIOR_AUDIO="sources/audio/authentic-dialogues-2026-10.json"
PRIOR_PRACTICE="sources/learning/practical-s2-resources-2026-10.json"
EXPECTED_IDS={
"oph-paivaa-everyday-2026",
"oph-paivaa-bus-2026",
"oph-palataan-neighbor-2026",
"oph-palataan-messages-2026",
"oph-palataan-shopping-2026",
"oph-palataan-health-2026"
}
def check(root:Path=ROOT)->list[str]:
    bad=[]
    def load(path):
        try:return json.loads((root/path).read_text(encoding="utf8"))
        except (OSError,ValueError) as exc:
            bad.append("Unreadable "+path+": "+str(exc))
            return {}
    data=load(CATALOG)
    old=load(PRIOR_AUDIO)
    prev=load(PRIOR_PRACTICE)
    sources=data.get("sources",[])
    items=data.get("items",[])
    if data.get("schema_version")!="1.0.0" or data.get("curated_on")!="2026-10-24" or data.get("source_count")!=6 or data.get("exercise_count")!=12 or data.get("series_count")!=2:
        bad.append("Source/exercise/series summary mismatch")
    if data.get("original_prompts_not_copied_from_textbook") is not True or data.get("restricted_media_and_text") is not True or data.get("imported_audio_files")!=0 or data.get("imported_video_files")!=0:
        bad.append("Fictitious new audio or copied licensed content")
    if len(sources)!=6 or {s.get("id") for s in sources}!=EXPECTED_IDS:
        bad.append("Missing or duplicate OPH pages")
    all_old_urls={i.get("source_page") for i in old.get("items",[])}|{s.get("url") for s in prev.get("external_sources",[])}
    source_urls=[s.get("chapter_url") for s in sources]
    if len(set(source_urls))!=len(source_urls) or any(u in all_old_urls for u in source_urls):
        bad.append("Duplicate public source page")
    index={x.get("id"):x for x in sources}
    for s in sources:
        sid=s.get("id","")
        chapter=urlsplit(s.get("chapter_url",""))
        audio=urlsplit(s.get("audio_playlist_url",""))
        if any(u.scheme!="https" or u.netloc!="www.oph.fi" or not u.path.startswith("/fi/oppimateriaali/") or u.username or u.password or u.port or u.fragment or u.query for u in [chapter,audio]):
            bad.append("Unapproved publisher URL "+sid)
        if s.get("chapter_url")==s.get("audio_playlist_url") or not audio.path.endswith("/aanitteet"):
            bad.append("Answer-bearing chapter page opened as audio playlist "+sid)
        if s.get("publisher")!="Opetushallitus (Finnish National Agency for Education)" or s.get("author")!="Minna Intke Hernández" or s.get("series") not in ("Päivää!","Palataan!"):
            bad.append("Publisher/author/series not verified "+sid)
        if s.get("license")!="publisher_copyright_no_redistribution_rights_verified" or s.get("rights_checked_on")!="2026-10-24":
            bad.append("Misleading copyright clearance "+sid)
        if s.get("confirmed_playlist_link") is not True or s.get("per_chapter_exact_track_url_verified") is not False or s.get("format_mime_sha256_or_duration_verified") is not False:
            bad.append("Fabricated media verification "+sid)
        if s.get("is_official_yki") is not False:
            bad.append("Publisher exercise misrepresented as official YKI "+sid)
        if len([x for x in items if x.get("source_id")==sid])!=2:
            bad.append("Source not mapped to exactly two missions "+sid)
    mission_ids=[i.get("id") for i in items]
    past_ids={i.get("id") for i in old.get("items",[])}|{i.get("id") for i in prev.get("items",[])}
    if len(items)!=12 or len(set(mission_ids))!=12 or set(mission_ids)&past_ids:
        bad.append("New mission count/identity collision")
    for x in items:
        ident=x.get("id","")
        src=index.get(x.get("source_id"),{})
        if x.get("source_page")!=src.get("chapter_url") or x.get("audio_index_url")!=src.get("audio_playlist_url") or x.get("author")!=src.get("author"):
            bad.append("Incorrect OPH source/audio page relation "+ident)
        if x.get("teacher_page_contains_answers") is not True or x.get("first_attempt_url_policy")!="audio_index_only_hide_teacher_answer_page_until_attempt":
            bad.append("Publisher teacher answer key leaked before first answer "+ident)
        if x.get("access")!="external_link_only" or x.get("media_binaries_imported")!=0 or x.get("graded") is not False or x.get("is_official_yki") is not False or x.get("ui_status")!="external_task_usable_now" or x.get("teaching_review")!="pending" or x.get("acoustic_review")!="not_performed":
            bad.append("False media/grade/human-review state "+ident)
        if x.get("license")!="publisher_copyright_no_redistribution_rights_verified":
            bad.append("Rights misrepresented in task "+ident)
        if x.get("reported_components",{}).get("publisher_reported_count") is not None or x.get("reported_components",{}).get("exact_track_binary_verified") is not False:
            bad.append("Unverified track count/format claimed "+ident)
        if not isinstance(x.get("source_rights_note"),str) or "does NOT grant permission" not in x["source_rights_note"]:
            bad.append("Missing license boundary "+ident)
        for field in ("audio_path","video_path","local_path","answer_key","correct_answer","correct_index","transcript","graded_score","download_url","media_url"):
            if field in x:
                bad.append("Unverified answer/media leak "+ident+":"+field)
        for name in ("independent_prompt_fi","reflection_uk","transfer_prompt_fi","delayed_recall_prompt_fi"):
            prompt=x.get("mission",{}).get(name)
            if not isinstance(prompt,str) or len(prompt.strip())<20:
                bad.append("Missing independent/review/transfer prompt "+ident+":"+name)
    return bad
if __name__=="__main__":
    issues=check()
    for x in issues:print("FAIL:",x)
    if issues:raise SystemExit(1)
    print("PASS six distinct rights-restricted OPH adult learning sources and twelve ungraded, answer-gated LEARN missions; zero imported media")
