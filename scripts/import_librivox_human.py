#!/usr/bin/env python3
"""Create reusable Finnish listening excerpts from public-domain LibriVox human voices."""
from __future__ import annotations
import hashlib, json, pathlib, subprocess, tempfile, urllib.request, re, sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
MAX_BYTES=8000000
SOURCES=[
 ("tuija-rautatie","Tuija Aalto","Rautatie","Juhani Aho",1921,"https://librivox.org/rautatie-by-juhani-aho/","https://archive.org/download/rautatie_ta_librivox/rautatie_1_aho.mp3"),
 ("mari-laulu","Mari Mattila","Laulu tulipunaisesta kukasta","Johannes Linnankoski",1913,"https://librivox.org/laulu-tulipunaisesta-kukasta-by-johannes-linnankoski/","https://archive.org/download/laulutulipunaisestakukasta_1501_librivox/laulutulipunaisestakukasta_01_linnankoski_128kb.mp3"),
 ("teemu-laulu","Teemu","Laulu tulipunaisesta kukasta","Johannes Linnankoski",1913,"https://librivox.org/laulu-tulipunaisesta-kukasta-by-johannes-linnankoski/","https://archive.org/download/laulutulipunaisestakukasta_1501_librivox/laulutulipunaisestakukasta_21_linnankoski_64kb.mp3")
]
DEST=ROOT/"assets/audio/human/librivox"
MANIFEST=ROOT/"learning/exercises/b1/audio-training/librivox-human.json"
LIB=ROOT/"assets/audio/library.json"
def cmd(args):
    return subprocess.run(args,capture_output=True,text=True,check=True)
def seconds(file):
    return float(cmd(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",str(file)]).stdout.strip())
def fetch(url,path):
    req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (HospodarYKI open Finnish audio project)","Accept":"audio/mpeg,*/*","Range":f"bytes=0-{MAX_BYTES-1}"})
    with urllib.request.urlopen(req,timeout=65) as resp:
        if "text/html" in resp.headers.get("Content-Type",""):raise ValueError("Archive returned HTML")
        b=resp.read(MAX_BYTES+1)[:MAX_BYTES]
    if len(b)<150000 or not (b.startswith(b"ID3") or (b[0]==255 and (b[1]&224)==224)):raise ValueError("Invalid or empty MP3")
    path.write_bytes(b)
    return len(b)
def near_pause(file,t):
    begin=max(0,t-4)
    r=subprocess.run(["ffmpeg","-hide_banner","-nostdin","-ss",str(begin),"-t","8","-i",str(file),"-af","silencedetect=noise=-35dB:d=0.14","-f","null","-"],capture_output=True,text=True)
    if r.returncode:
        return t,"approximate_unverified"
    candidate=[begin+float(s) for s in re.findall(r"silence_end:\s*([0-9.]+)",r.stderr)]
    candidate=[s for s in candidate if abs(s-t)<4]
    return (min(candidate,key=lambda x:abs(x-t)),"pause_detected") if candidate else (t,"approximate_unverified")
def cut(file,output,a,b):
    output.parent.mkdir(parents=True,exist_ok=True)
    cmd(["ffmpeg","-hide_banner","-nostdin","-loglevel","error","-y","-ss",str(a),"-i",str(file),"-t",str(b-a),"-vn","-ar","24000","-ac","1","-c:a","libvorbis","-q:a","3",str(output)])
    data=output.read_bytes()
    if len(data)<12000 or not data.startswith(b"OggS"):raise ValueError("Invalid resulting OGG")
    return data
def main():
    DEST.mkdir(parents=True,exist_ok=True);MANIFEST.parent.mkdir(parents=True,exist_ok=True)
    items=[];errors=[]
    with tempfile.TemporaryDirectory() as temp:
        for sid,reader,work,writer,died,page,url in SOURCES:
            src=pathlib.Path(temp)/(sid+".mp3")
            try:
                n=fetch(url,src);length=seconds(src)
                print(f"DOWNLOADED {sid} {n} bytes {length:.1f}s",flush=True)
                if length<220:raise ValueError("Source too short")
                for i,offset in enumerate([68,135,205,275,345],1):
                    if offset+31>=length:continue
                    a,am=near_pause(src,offset)
                    b,bm=near_pause(src,offset+24)
                    if not 16<=b-a<=34:a,b,am,bm=offset,offset+24,"approximate_unverified","approximate_unverified"
                    path=DEST/sid/f"part-{i:02d}.ogg"
                    data=cut(src,path,a,b)
                    items.append(dict(id=f"librivox-{sid}-{i:02d}",path=str(path.relative_to(ROOT)),sha256=hashlib.sha256(data).hexdigest(),bytes=len(data),duration_seconds=round(seconds(path),2),start_seconds=round(a,2),end_seconds=round(b,2),boundary_start=am,boundary_end=bm,narrator=reader,work=work,writer=writer,writer_died=died,source_page=page,archive_file=url,license="Public domain (LibriVox recordings and Finnish author rights expired)",read_speech=True,real_human=True,transcript_verified=False,is_official_yki=False,level_hint="B1+-B2+",teacher_review="pending",questions=[{"kind":"gist","prompt_fi":"Mistä katkelmassa puhutaan? Kerro omin sanoin.","automated_grading":False},{"kind":"details","prompt_fi":"Kirjoita kaksi selvästi kuulemaasi ilmausta ja kerro, mitä ne tarkoittavat.","automated_grading":False},{"kind":"transfer","prompt_fi":"Kerro yksi samanaiheinen asia nykyelämästä.","automated_grading":False}]))
                print(f"SAVED {sid}: {sum(x['narrator']==reader for x in items)} excerpts",flush=True)
            except Exception as ex:
                errors.append(f"{sid}: {type(ex).__name__}: {ex}")
                print("SOURCE FAILED "+errors[-1],file=sys.stderr,flush=True)
    if not items:raise RuntimeError("No human voice clips fetched: "+"; ".join(errors))
    manifest=dict(schema_version=1,date="2026-10-21",count=len(items),narrators=sorted({x["narrator"] for x in items}),warning="Read literary historical Finnish, not representative B1 YKI. Not scored without transcripts.",errors=errors,items=items)
    MANIFEST.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    library=json.loads(LIB.read_text(encoding="utf8"))
    present={e["path"] for e in library["entries"]}
    for i in items:
        if i["path"] in present:continue
        library["entries"].append(dict(id=i["id"],kind="human_librivox_excerpt",path=i["path"],actual_human=True,synthetic=False,author=i["narrator"],license=i["license"],source_page=i["source_page"],duration_seconds=i["duration_seconds"],level=i["level_hint"],topic="literary_narrative",transcript_ref=None,lesson_ref="learning/exercises/b1/audio-training/librivox-human.json",qa="teacher_review_pending"))
    library["counts"]["human_librivox_excerpts"]=len(items)
    library["counts"]["total_files"]=len(library["entries"])
    library["librivox_manifest"]="learning/exercises/b1/audio-training/librivox-human.json"
    LIB.write_text(json.dumps(library,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print(json.dumps({"created":len(items),"narrators":manifest["narrators"],"errors":errors,"total":len(library["entries"])},ensure_ascii=False),flush=True)
if __name__=="__main__":main()
