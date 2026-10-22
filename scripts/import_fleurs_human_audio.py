#!/usr/bin/env python3
"""Import a small attributed Finnish human-voice sample set from Google FLEURS.

FLEURS: CC BY 4.0, https://huggingface.co/datasets/google/fleurs
This importer fetches selected rows; NOT the ~GB-sized dataset and NOT a YKI mock.
Audio speech is READ, not spontaneous conversation. Transcript is dataset-supplied.
No scraping of Yle, paid YKI, or Common Voice.
"""
from __future__ import annotations
import hashlib
import json
import pathlib
import re
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request

ROOT=pathlib.Path(__file__).resolve().parents[1]
DEST=ROOT/'assets'/'audio'/'human'/'fleurs-fi'
OUT=ROOT/'learning'/'exercises'/'b1'/'audio-training'/'fleurs-fi.json'
API='https://datasets-server.huggingface.co/rows'
DATASET='google/fleurs'
CONFIG='fi_fi'
SPLIT='validation'
USER_AGENT='HospodarYKI/1.0 (educational curated CC-BY-4.0 samples)'
MAX_DOWNLOAD=4_000_000
DESIRED=12

def get(url,max_bytes=1_000_000):
    req=urllib.request.Request(url,headers={"User-Agent":USER_AGENT,
                                          "Accept":"application/json,audio/*,*/*"})
    with urllib.request.urlopen(req,timeout=45) as r:
        data=r.read(max_bytes+1)
    if len(data)>max_bytes:raise ValueError("Too much data")
    return data

def allowed(url):
    u=urllib.parse.urlparse(url)
    host=u.hostname or ''
    return u.scheme=='https' and (host=="huggingface.co" or host.endswith(".huggingface.co") or host.endswith(".hf.co"))

def probe(p):
    r=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",str(p)],capture_output=True,text=True,check=True)
    return round(float(r.stdout.strip()),2)

def convert(src,target):
    target.parent.mkdir(parents=True,exist_ok=True)
    subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-nostdin","-y","-i",str(src),
                    "-vn","-ac","1","-c:a","libvorbis","-q:a","4",str(target)],check=True,timeout=90)
    data=target.read_bytes()
    if len(data)<2000 or not data.startswith(b'OggS'):
        raise ValueError("Not valid audio")
    return data

def fetch_rows():
    """Try modest row windows and preview API; avoid loading the huge shard.

    Dataset server sometimes replies 500 to length=100 even when small
    slices or first-rows are usable. Fail transparently if all methods fail.
    """
    urls=[]
    for length in (12,3,1):
        params=urllib.parse.urlencode({"dataset":DATASET,"config":CONFIG,"split":SPLIT,
                                        "offset":0,"length":length})
        urls.append(API+"?"+params)
    params=urllib.parse.urlencode({"dataset":DATASET,"config":CONFIG,"split":SPLIT})
    urls.append("https://datasets-server.huggingface.co/first-rows?"+params)
    failures=[]
    for url in urls:
        try:
            raw=json.loads(get(url,1_200_000))
            rows=raw.get('rows') or []
            if rows:
                print(f"Fetched {len(rows)} FLEURS entries from {url.split('?')[0]}",flush=True)
                return rows
            failures.append("no rows")
        except (urllib.error.HTTPError, urllib.error.URLError,ValueError,KeyError) as ex:
            failures.append(f"{type(ex).__name__} ({getattr(ex,'code','unknown')})")
    raise RuntimeError("FLEURS dataset preview currently unavailable: "+"; ".join(failures))


def main():
    rows=fetch_rows()
    DEST.mkdir(parents=True,exist_ok=True)
    OUT.parent.mkdir(parents=True,exist_ok=True)
    entries=[]
    names=set()
    for item in rows:
        if len(entries)>=DESIRED:break
        row=item.get('row') or {}
        transcript=(row.get("raw_transcription") or row.get("transcription") or "").strip()
        if not (55<=len(transcript)<=225 and re.search(r'[a-zA-ZäöÄÖ]',transcript)):continue
        audio=row.get("audio")
        if not isinstance(audio,dict):continue
        src=audio.get("src") or audio.get("url")
        if not src or not allowed(src):continue
        idpart=re.sub(r"[^0-9A-Za-z-]","",str(row.get("id",item.get("row_idx",""))))[:24]
        if not idpart or idpart in names:continue
        out=DEST/f"fleurs-fi-val-{idpart}.ogg"
        try:
            if out.is_file():
                data=out.read_bytes()
                if not data.startswith(b'OggS'):raise ValueError("Bad cached audio")
            else:
                with tempfile.TemporaryDirectory() as tmp:
                    inf=pathlib.Path(tmp)/"audio.original"
                    inf.write_bytes(get(src,MAX_DOWNLOAD))
                    data=convert(inf,out)
            sec=probe(out)
            if sec<3 or sec>38:
                out.unlink(missing_ok=True)
                continue
            names.add(idpart)
            entries.append(dict(id=f"fleurs-fi-val-{idpart}",source="google/fleurs",
                 config=CONFIG,split=SPLIT,sample_id=row.get("id",item.get("row_idx")),
                 path=str(out.relative_to(ROOT)),bytes=len(data),duration_seconds=sec,
                 sha256=hashlib.sha256(data).hexdigest(),text_fi=transcript,
                 gender_corpus_label=row.get("gender"),
                 provenance="Google FLEURS validation sample, original read Finnish",
                 license="CC BY 4.0",license_url="https://creativecommons.org/licenses/by/4.0/",
                 dataset_url="https://huggingface.co/datasets/google/fleurs",
                 dataset_reference="FLEURS: Few-shot Learning Evaluation of Universal Representations of Speech (Conneau et al., 2022)",
                 origin_speaker="FLEURS dataset contributor (anonymous)",recording_type="human_read_speech",
                 questions=[{"type":"dictation","prompt_fi":"Kuuntele kerran ja kirjoita, mitä kuulet.","correct_text_fi":transcript,"scoring":"normalize_case_punctuation_then_review_spelling"},
                            {"type":"gist","prompt_fi":"Mistä äänitteessä puhutaan? Kerro se omin sanoin.","scoring":"human_or_reviewed_ai_semantic_no_answer_key"}],
                 display_transcript_after_first_attempt=True,is_official_yki=False,
                 level_hint="uncalibrated_A2_B1_B2",teacher_quality_check="pending"))
            print(f"SAVED {idpart} {sec}s {len(transcript)} chars",flush=True)
        except Exception as ex:
            print(f"SKIPPED sample {idpart}: {type(ex).__name__}: {ex}",file=sys.stderr,flush=True)
    if len(entries)<4:
        raise RuntimeError(f"Only {len(entries)} downloadable samples: FLEURS importer needs >=4 for a useful pack")
    OUT.write_text(json.dumps(dict(schema_version=1,date="2026-10-21",
      title="FLEURS Finnish human-read dictation and gist pack",
      license="CC BY 4.0",count=len(entries),data_type="human_read_speech",
      about="Not an official YKI mock; level and content style not validated by a teacher.",
      author_citation="Conneau et al. (2022), FLEURS, https://arxiv.org/abs/2205.12446",
      items=entries),ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"DONE {len(entries)} human speech clips with corpus transcripts",flush=True)

if __name__=="__main__":main()
