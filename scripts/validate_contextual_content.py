#!/usr/bin/env python3
"""Hospodar YKI contextual content + licensed frequency import structural checks.
This does not establish natural Finnish, exam difficulty or rights for unimported external resources.
"""
from __future__ import annotations
import csv
import json
from pathlib import Path
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parents[1]
def load(rel):
    return json.loads((ROOT/rel).read_text(encoding="utf-8"))
def check(ok,msg):
    if not ok: raise AssertionError(msg)

def main():
    freq=ROOT/"knowledge/dictionaries/b1/frequency/yle-news-top10000-v1.1.1.tsv"
    with freq.open(encoding="utf-8", newline="") as f:
        raw=list(csv.DictReader(f,delimiter="\t"))
    check(len(raw)==10000,"Frequency list is not 10,000 rows")
    check(set(raw[0])=={"Hakusana","Sanaluokat","count"},"Frequency TSV header")
    prev=10**100
    for i,word in enumerate(raw,1):
        check(word["Hakusana"].strip()!="","Missing lemma at "+str(i))
        count=int(word["count"])
        check(0<count<=prev,"Missing/unsorted count "+str(i))
        prev=count
    check(raw[0]["Hakusana"]=="olla","Unexpected first lemma, check version")
    chunks=load("knowledge/dictionaries/b1/contextual-chunks-v1.json")
    check(len(chunks["items"])==chunks["counts"]["total"]==132,"Wrong chunk count")
    check(sum(chunks["counts"]["themes"].values())==132,"Wrong theme sum")
    ids=set()
    for x in chunks["items"]:
        check(x["id"] not in ids,"Duplicate chunk "+x["id"]); ids.add(x["id"])
        check(x["theme"] in chunks["counts"]["themes"],"Unknown theme "+x["id"])
        check(all(x.get(field) for field in ("expression_fi","meaning_uk","context_fi","context_uk","retrieval_prompt_uk")),"Incomplete chunk "+x["id"])
        check(x["context_fi"].strip().endswith((".","!","?")),"Example not full sentence "+x["id"])
        check(x["default_known_status"]=="unassessed_not_unknown","Automatically treating words as unknown "+x["id"])
        check(x["linguistic_review"]=="pending_S2_teacher","Wrong review status "+x["id"])
    grammar=load("knowledge/dictionaries/b1/rektio-v1.json")
    check(len(grammar["items"])==grammar["count"]==40,"Wrong rektio count")
    for x in grammar["items"]:
        check(x["id"] not in ids,"Duplicate rektio "+x["id"]); ids.add(x["id"])
        check(all(x.get(f) for f in ("construction_fi","case_or_pattern","meaning_uk","example_fi","example_uk")),"Incomplete rektio "+x["id"])
    reading=load("learning/exercises/b1/contextual/reading-pack-v1.json")
    check(len(reading["items"])==reading["count_texts"]==9,"Wrong reading count")
    check(reading["count_questions"]==27,"Wrong reading question count")
    for item in reading["items"]:
        check(item["id"] not in ids,"Duplicate reading "+item["id"]); ids.add(item["id"])
        check(len(item["text_fi"].split())>=65,"Reading too short "+item["id"])
        check(len(item["questions"])==3,"Missing comprehension questions "+item["id"])
        check(item["quality_status"]=="pending_S2_teacher_review","Unverified teacher quality claim "+item["id"])
        for q in item["questions"]:
            check(q["id"] not in ids,"Duplicate question "+q["id"]);ids.add(q["id"])
            check(q["evidence_fi"] in item["text_fi"],"Evidence absent "+q["id"])
            if q["type"]=="single_choice":
                check(len(q["options_fi"])==3 and len(set(q["options_fi"]))==3,"Bad options "+q["id"])
                check(type(q["correct_index"]) is int and 0<=q["correct_index"]<3,"Bad key "+q["id"])
            elif q["type"]=="true_false":
                check(type(q["answer"]) is bool,"Bad bool "+q["id"])
            elif q["type"]=="open":
                check(bool(q["model_answer_fi"]),"Missing open answer "+q["id"])
            else: raise AssertionError("Unknown Q type "+q["id"])
    dialogs=load("learning/exercises/b1/contextual/dialogues-v1.json")
    check(len(dialogs["items"])==dialogs["count_dialogues"]==9,"Wrong dialogues count")
    check(dialogs["count_turns"]==72 and dialogs["count_questions"]==18,"Wrong dialogue stats")
    for row in dialogs["items"]:
        check(row["id"] not in ids,"Duplicate dialogue "+row["id"]);ids.add(row["id"])
        check(len(row["turns"])==8,"Wrong turn count "+row["id"])
        check(row["audio_status"]=="script_only_no_recording_yet","Unrecorded marked as recorded "+row["id"])
        check(row["scoring_status"].startswith("NOT_VALID"),"Invalid listening assessment "+row["id"])
        for q in row["questions"]:
            check(q["id"] not in ids,"Duplicate dialogue question "+q["id"]);ids.add(q["id"])
            check(any(q["evidence_fi"] in turn["text_fi"] for turn in row["turns"]),"Dialogue evidence missing "+q["id"])
    sources=load("research/yki/yki-content-sources-2026-10.json")
    check(len(sources["items"])>=34,"Source registry unexpectedly shrank")
    rights={i["rights"] for i in sources["items"]}
    check(any("LINK_ONLY" in x for x in rights) and "IMPORT_CC_BY_4_WITH_CREDITS" in rights,"Rights classifications missing")
    source_ids=set()
    for item in sources["items"]:
        check(item["id"] not in source_ids,"Duplicate source ID "+item["id"]);source_ids.add(item["id"])
        u=item["url"]
        if u.startswith("http"):check(urlparse(u).scheme=="https" and bool(urlparse(u).netloc),"Untrusted source URL "+item["id"])
        else:check((ROOT/u).is_file(),"Missing internal source "+item["id"])
        check(item["rights"] and 0<=item["score"]<=100,"Invalid source metadata "+item["id"])
    print(json.dumps({"result":"PASS","frequency_lemmas":len(raw),"contextual_chunks":len(chunks["items"]),"rektio_patterns":len(grammar["items"]),"reading_texts":len(reading["items"]),"reading_questions":reading["count_questions"],"dialogues":len(dialogs["items"]),"dialogue_questions":dialogs["count_questions"],"curated_sources":len(sources["items"]),"scope":"structural only, teacher QA and rights for external sites separate"},ensure_ascii=False,indent=2))

if __name__=="__main__":
    main()
