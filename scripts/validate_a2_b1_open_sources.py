#!/usr/bin/env python3
"""Guard new source-linked A1.3–B1.2 learning tasks and legal/learning status."""
import json
from pathlib import Path
from urllib.parse import urlsplit

ROOT=Path(__file__).resolve().parents[1]
CATALOG="sources/learning/a2-b1-verified-source-missions-2026-10.json"
PREVIOUS=[
"sources/audio/authentic-dialogues-2026-10.json",
"sources/learning/practical-s2-resources-2026-10.json",
"sources/audio/oph-adult-spoken-finnish-2026-10.json"
]
EXPECTED={
"oph-helppoa-audio-2026":("www.oph.fi","publisher_copyright_no_redistribution_verified","audio"),
"vierko2-s2-2026":("aoe.fi","conflicting_historical_records_CC_BY_NC_SA_4_0_vs_latest_CC_BY_SA_4_0","text"),
"kielibuusti-health-verbs-2026":("www.kielibuusti.fi","CC BY 4.0 publisher-listed; individual attachments review pending","text"),
"vierko2-society-2026":("aoe.fi","item_license_unconfirmed_link_only","text")
}
TASK_IDS={
"helppoa-listen-main","helppoa-simple-question",
"vierko2-interaction-fix","vierko2-write-email",
"health-need-verbs","health-transitivity",
"civic-service-question","civic-consumer-return"}
def check(root=ROOT):
    errors=[]
    def load(path):
        try:return json.loads((root/path).read_text(encoding="utf-8"))
        except (OSError, ValueError) as exc:
            errors.append("Cannot read "+path+": "+str(exc))
            return {}
    d=load(CATALOG)
    older=[load(path) for path in PREVIOUS]
    sources=d.get("sources",[])
    tasks=d.get("items",[])
    if d.get("schema_version")!="1.0.0" or d.get("checked_on")!="2026-10-24" or d.get("sources_count")!=4 or d.get("missions_count")!=8 or d.get("source_only") is not True or d.get("local_media_added")!=0:
        errors.append("Summary fabricated/mismatched")
    if "CC BY-NC-SA" not in d.get("license_caveat","") or "CC BY-SA" not in d.get("license_caveat",""):
        errors.append("VIERKO license discrepancy erased")
    if len(sources)!=4 or {s.get("id") for s in sources}!=set(EXPECTED):
        errors.append("Four unique verified sources required")
    old_urls={x.get("source_page") for x in older[0].get("items",[])}
    old_urls|={x.get("url") for x in older[1].get("external_sources",[])}
    old_urls|={x.get("chapter_url") for x in older[2].get("sources",[])}
    old_urls|={x.get("audio_playlist_url") for x in older[2].get("sources",[])}
    urls=[s.get("url") for s in sources]
    if len(urls)!=len(set(urls)) or set(urls)&old_urls:
        errors.append("Previously catalogued or repeated source URL")
    index={s.get("id"):s for s in sources}
    for sid,(host,rights,expected_type) in EXPECTED.items():
        s=index.get(sid,{})
        url=urlsplit(s.get("url",""))
        if url.scheme!="https" or url.netloc!=host or url.username or url.password or url.port or url.fragment or url.query or not url.path:
            errors.append("Unsafe or noncanonical source URL: "+sid)
        if s.get("license")!=rights or not s.get("rights_note"):
            errors.append("License/rights attribution drift: "+sid)
        if s.get("year") not in (2016,2023,2026) or not s.get("publisher") or not s.get("author") or not s.get("format"):
            errors.append("Incomplete provenance: "+sid)
        if sid=="vierko2-s2-2026" and "2026-10" not in s.get("rights_note",""):
            errors.append("Current and historical VIERKO licences conflated")
        if sid=="kielibuusti-health-verbs-2026" and ("NOT audio" not in s.get("media_claim","") and "NOT audio" not in s.get("rights_note","")):
            errors.append("Grammar slides mislabelled as audio")
        if len([x for x in tasks if x.get("source_id")==sid])!=2:
            errors.append("Require two original lessons per distinct source: "+sid)
    old_ids={i.get("id") for p in older for i in p.get("items",[])}
    if len(tasks)!=8 or len({x.get("id") for x in tasks})!=8 or {x.get("id") for x in tasks}!=TASK_IDS or {x.get("id") for x in tasks}&old_ids:
        errors.append("Task duplicate or missing")
    for item in tasks:
        name=item.get("id","")
        sid=item.get("source_id")
        src=index.get(sid,{})
        if item.get("source_page")!=src.get("url") or item.get("publisher")!=src.get("publisher") or item.get("author")!=src.get("author") or item.get("license")!=src.get("license"):
            errors.append("Lesson attribution mismatch: "+name)
        if item.get("access")!="external_link_only" or item.get("media_binaries_imported")!=0 or item.get("acoustic_review")!="not_performed" or item.get("teaching_review")!="pending" or item.get("is_official_yki") is not False or item.get("graded") is not False or item.get("ui_status")!="external_task_usable_now":
            errors.append("Fabricated offline/teacher/exam/grade claim: "+name)
        ty=EXPECTED.get(sid,("", "",None))[2]
        comp=item.get("reported_components",{})
        if comp.get("type")!=ty or comp.get("publisher_reported_count") is not None or comp.get("exact_track_binary_verified") is not False:
            errors.append("Fictitious publisher audio/count: "+name)
        for banned in ("audio_path","video_path","local_path","transcript","answer_key","correct_index","score","download_url","cached_assets","teacher_reviewed"):
            if banned in item:
                errors.append("Unlicensed file, grading or answer leak: "+name+":"+banned)
        for k in ("source_note_uk","source_rights_note","title_fi","cefr_suggested"):
            if not isinstance(item.get(k),str) or len(item[k].strip())<3:
                errors.append("Missing content metadata: "+name+":"+k)
        for k in ("independent_prompt_fi","reflection_uk","transfer_prompt_fi","delayed_recall_prompt_fi"):
            x=item.get("mission",{}).get(k)
            if not isinstance(x,str) or len(x.strip())<20:
                errors.append("Missing independent/repair/transfer pedagogy: "+name+":"+k)
    return errors

if __name__=="__main__":
    findings=check()
    for f in findings:print("FAIL:",f)
    if findings:raise SystemExit(1)
    print("PASS: 4 new distinct source-only educational resources, 8 independent/review/transfer tasks; truthful format and uncertain VIERKO licence, 0 binaries")
