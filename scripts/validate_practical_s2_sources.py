#!/usr/bin/env python3
"""Check source-only Finnish S2 workplace/foundation missions without claiming audio files."""
from __future__ import annotations
import json
from pathlib import Path
from urllib.parse import urlsplit

ROOT=Path(__file__).resolve().parents[1]
CATALOG="sources/learning/practical-s2-resources-2026-10.json"
PREVIOUS="sources/audio/authentic-dialogues-2026-10.json"
EXPECTED={
 "eira-kiitajat-2026":("eira.clients.crasman.fi","CC BY-NC-ND 4.0",2),
 "taste-finnish-2026":("tasteoffinnish.fi","not_verified_for_republication",2),
 "kielibuusti-work-intro-2026":("www.kielibuusti.fi","CC BY 4.0",2),
 "kielibuusti-internship-2026":("www.kielibuusti.fi","CC BY 4.0",2)
}
EXPECTED_TASK_IDS={
"eira-leisure-listening-a22","eira-work-conversations-a22",
"taste-arrival-a13","taste-shopping-a21",
"work-intro-questions-a13","work-intro-smalltalk-a21",
"internship-clarify-b11","internship-language-diary-b12"
}
def issues(root:Path=ROOT)->list[str]:
    problems=[]
    try:
        data=json.loads((root/CATALOG).read_text(encoding="utf-8"))
        old=json.loads((root/PREVIOUS).read_text(encoding="utf-8"))
    except (OSError,ValueError) as exc:
        return ["Missing or invalid catalogue: "+str(exc)]
    src=data.get("external_sources",[])
    items=data.get("items",[])
    if data.get("schema_version")!="1.0.0" or data.get("curated_on")!="2026-10-24" or data.get("source_count")!=4 or data.get("exercise_count")!=8 or data.get("imported_audio_files")!=0 or data.get("imported_video_files")!=0:
        problems.append("Unverified summary of sources, missions or media")
    if len(src)!=4 or {x.get("id") for x in src}!=set(EXPECTED):
        problems.append("Source set must contain four uniquely identified pages")
    if len({x.get("url") for x in src})!=len(src) or any(x.get("url")==old_item.get("source_page") for x in src for old_item in old.get("items",[])):
        problems.append("Source URL duplicate of prior catalog or new resource")
    index={x.get("id"):x for x in src}
    for sid,(host,license_expected,count) in EXPECTED.items():
        x=index.get(sid,{})
        parsed=urlsplit(x.get("url",""))
        if parsed.scheme!="https" or parsed.netloc!=host or parsed.username or parsed.password or parsed.fragment or parsed.query:
            problems.append("Untrusted publisher host or noncanonical URL: "+sid)
        if x.get("licence")!=license_expected or not x.get("publisher") or not x.get("author"):
            problems.append("Incorrect author or license metadata: "+sid)
        if not x.get("scope"):
            problems.append("Unexplained source copyright and limits: "+sid)
        component=x.get("reported_components",{})
        if sid=="eira-kiitajat-2026":
            if component.get("published_worksheet_count")!=5 or component.get("type")!="text" or component.get("audio_file_presence_verified") is not False:
                problems.append("Eira PDF worksheets falsely counted as audio")
        if sid=="taste-finnish-2026":
            if component.get("chapter_count")!=10 or component.get("lesson_count")!=30 or component.get("publisher_reported_count") is not None or component.get("individual_audio_files_not_counted") is not True:
                problems.append("30 lessons falsely reported as 30 downloadable recordings")
        if sid=="kielibuusti-work-intro-2026":
            if component.get("type")!="text" or component.get("publisher_reported_count")!=4:
                problems.append("Four textual work examples mislabelled")
        if component.get("audio_file_presence_verified") is not False:
            problems.append("External media marked locally verified: "+sid)
        if len([x for x in items if x.get("source_id")==sid])!=count:
            problems.append("Missing or duplicated source-specific missions: "+sid)
    if len(items)!=8 or {x.get("id") for x in items}!=EXPECTED_TASK_IDS or len({x.get("id") for x in items})!=len(items):
        problems.append("Unreviewed new task count or duplicate mission ID")
    previous_ids={x.get("id") for x in old.get("items",[])}
    if any(x.get("id") in previous_ids for x in items):
        problems.append("Practice mission ID collides with existing lessons")
    for x in items:
        sid=x.get("source_id","")
        source=index.get(sid,{})
        ident=x.get("id","")
        if x.get("source_page")!=source.get("url") or x.get("license")!=source.get("licence") or x.get("publisher")!=source.get("publisher") or x.get("author")!=source.get("author"):
            problems.append("Mission source attribution inconsistent: "+ident)
        if x.get("access")!="external_link_only" or x.get("media_binaries_imported")!=0 or x.get("graded") is not False or x.get("is_official_yki") is not False or x.get("ui_status")!="external_task_usable_now" or x.get("teaching_review")!="pending" or x.get("acoustic_review")!="not_performed":
            problems.append("Fake local media, teacher-reviewed score or official exam: "+ident)
        for forbidden in ("file_path","audio_path","answer_key","grade","score","download_url","transcript","correct_index"):
            if forbidden in x:
                problems.append("Unreviewed media/download/key in task: "+ident)
        for k in ("title_fi","cefr_suggested","material_kind","source_note_uk","source_rights_note"):
            if not isinstance(x.get(k),str) or len(x[k].strip())<10:
                problems.append("Missing description or rights disclosure: "+ident+"."+k)
        mission=x.get("mission",{})
        for k in ("independent_prompt_fi","reflection_uk","transfer_prompt_fi","delayed_recall_prompt_fi"):
            if not isinstance(mission.get(k),str) or len(mission[k].strip())<20:
                problems.append("Missing meaningful independent/repair/transfer phase: "+ident+"."+k)
        component=x.get("reported_components",{})
        if component.get("type")=="audio" and sid!="taste-finnish-2026":
            problems.append("PDF/text misrepresented as recorded audio: "+ident)
    return problems
if __name__=="__main__":
    failures=issues()
    for failure in failures:print("FAIL",failure)
    if failures:raise SystemExit(1)
    print("PASS: 4 provenance-scoped external Finnish learning sources; 8 original ungraded LEARN tasks; 0 imported media; 5 Eira PDFs not MP3")
