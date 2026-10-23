#!/usr/bin/env python3
"""Validate legally honest publisher-linked Finnish dialogue LEARN discoveries.

This checker validates source metadata and app task invariants only.
It does NOT fetch, listen to, authenticate or license individual media binaries.
"""
from __future__ import annotations
import json
from pathlib import Path
from urllib.parse import urlsplit

ROOT=Path(__file__).resolve().parents[1]
SOURCE="sources/audio/authentic-dialogues-2026-10.json"
OTHER="sources/audio/yki-targeted-sources-2026-10.json"
EXPECTED={
"kielibuusti-public-transport-2024":("audio",6,"CC BY 4.0"),
"kielibuusti-dentist-dialogues-2023":("audio",4,"CC BY 4.0"),
"kielibuusti-hotel-reception-2026":("video",8,"CC BY-ND 4.0"),
"kielibuusti-puhutsa-2026":("video",None,"not_explicitly_verified_on_listing"),
"kielibuusti-fiilis-2025":("text",None,"CC BY (version not specified on page)"),
"kielibuusti-care-dialogues-2026":("text",8,"CC BY 4.0"),
"kielibuusti-literature-podcast-2026":("audio",9,"CC BY-ND 4.0"),
}
def check(root=ROOT):
    problems=[]
    try:
        d=json.loads((root/SOURCE).read_text(encoding="utf8"))
        old=json.loads((root/OTHER).read_text(encoding="utf8"))
    except (OSError,ValueError) as exc:
        return ["Missing or invalid JSON: "+str(exc)]
    items=d.get("items",[])
    if d.get("schema_version")!="1.0.0" or d.get("curated_on")!="2026-10-23":
        problems.append("Wrong schema or review date")
    if len(items)!=7 or len({x.get("id") for x in items})!=7 or {x.get("id") for x in items}!=set(EXPECTED):
        problems.append("Sources missing, added without review or duplicated")
    known_external={x.get("page") for x in old.get("external_candidates",[])}
    urls=[x.get("source_page") for x in items]
    if len(urls)!=len(set(urls)) or any(u in known_external for u in urls):
        problems.append("Duplicate page within new list or existing targeted registry")
    reported_audio=0
    reported_video=0
    reported_text=0
    for x in items:
        i=x.get("id","")
        typ,expected_count,license_expected=EXPECTED.get(i,(None,None,None))
        c=x.get("reported_components",{})
        if x.get("license")!=license_expected:
            problems.append("Licence metadata drift: "+i)
        if not x.get("author") or not x.get("title_fi") or not x.get("cefr_suggested") or not x.get("source_page_checked_on"):
            problems.append("Missing authorship/source data: "+i)
        url=urlsplit(x.get("source_page",""))
        if url.scheme!="https" or url.netloc!="www.kielibuusti.fi" or not url.path.startswith("/fi/") or url.username or url.password or url.port or url.fragment:
            problems.append("Untrusted publisher link: "+i)
        if x.get("publisher")!="Kielibuusti" or x.get("label_level_basis")!="publisher_page" or x.get("source_page_checked_on")!="2026-10-23":
            problems.append("Unverified publisher metadata: "+i)
        if c.get("type")!=typ or c.get("publisher_reported_count")!=expected_count:
            problems.append("Misreported source type/media total: "+i)
        if x.get("media_binaries_imported")!=0 or x.get("access")!="external_link_only" or x.get("graded") is not False or x.get("is_official_yki") is not False or x.get("ui_status")!="external_task_usable_now":
            problems.append("Unsupported offline/exam/graded claim: "+i)
        if x.get("acoustic_review")!="not_performed" or x.get("teaching_review")!="pending":
            problems.append("Review status fabricated: "+i)
        for field in ("media_path","download_url","direct_url","transcript","answer_key","correct_answer","score"):
            if field in x:
                problems.append("Unverified file, answer or URL in record: "+i+"."+field)
        if "ND" in x.get("license","") and x.get("access")!="external_link_only":
            problems.append("ND material not link only: "+i)
        if typ=="text" and c.get("hosts") and any(s.lower() in ("mp3","audio") for s in c.get("hosts",[])):
            problems.append("Text masquerades as audio: "+i)
        if typ=="audio" and expected_count:
            reported_audio+=expected_count
        if typ=="video" and expected_count:
            reported_video+=expected_count
        if typ=="text" and expected_count:
            reported_text+=expected_count
        mission=x.get("mission",{})
        for key in ("independent_prompt_fi","reflection_uk","transfer_prompt_fi","delayed_recall_prompt_fi"):
            if not isinstance(mission.get(key),str) or len(mission[key].strip())<20:
                problems.append("Missing meaningful stage: "+i+"."+key)
        if not isinstance(x.get("license_scope"),str) or "verify individual media" not in x["license_scope"]:
            problems.append("Missing per-media rights caution: "+i)
    summary=d.get("counts",{})
    if summary.get("sources")!=7 or summary.get("publisher_reported_mp3_transport")!=6 or summary.get("publisher_reported_dentist_dialogues")!=4 or summary.get("publisher_reported_hotel_videos")!=8 or summary.get("publisher_reported_literature_podcast_episodes")!=9 or summary.get("publisher_reported_text_only_care_dialogues")!=8 or summary.get("imported_binaries")!=0 or summary.get("exam_items")!=0 or summary.get("graded_items")!=0:
        problems.append("Claims in summary disagree with fixed review")
    if (reported_audio,reported_video,reported_text)!=(19,8,8):
        problems.append("Miscounted publisher-listed audio/video/text media")
    return problems
if __name__=="__main__":
    result=check()
    for issue in result:print("FAIL",issue)
    if result:raise SystemExit(1)
    print("PASS 7 rights-scoped publisher sources: 19 external audio items + 8 external videos + 8 text scripts; 0 imported media or grades")
