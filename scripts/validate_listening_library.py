#!/usr/bin/env python3
"""Validate the unified local-audio library and four-week reference plan."""
from __future__ import annotations
import json
import pathlib

ROOT=pathlib.Path(__file__).resolve().parents[1]
def load(path):return json.loads((ROOT/path).read_text(encoding="utf-8"))
def require(ok,msg):
    if not ok:raise AssertionError(msg)

def main():
    lib=load("audio/library.json")
    plan=load("audio/program-4weeks.json")
    tts=load("content/b1/audio-training/index.json")
    audio=load("audio/available.json")
    require(lib["counts"]["total_files"]>=63,"Total count")
    require(len(lib["entries"])==lib["counts"]["total_files"],"Actual number of files")
    seen=set()
    for x in lib["entries"]:
        rel=x["path"]
        require(rel not in seen,"Duplicate: "+rel)
        seen.add(rel)
        require((ROOT/rel).is_file(),"Missing audio: "+rel)
        require(x["synthetic"] != x["actual_human"],"Audio kind mismatch: "+rel)
        require((ROOT/rel).read_bytes().startswith(b"OggS") if rel.endswith((".ogg",".oga")) else (ROOT/rel).read_bytes()[:3]==b"ID3" or (ROOT/rel).read_bytes()[:1]==b"\xff","Bad format: "+rel)
    actual_sources={e["path"] for e in audio["items"]}
    actual_tts={v["path"] for item in tts["lessons"] for v in item["audio_versions"]}
    require(actual_sources.isdisjoint(actual_tts),"Overlapping source and TTS sets")
    librivox=set()
    mp=ROOT/"content/b1/audio-training/librivox-human.json"
    if mp.is_file():
        human=load("content/b1/audio-training/librivox-human.json")
        librivox={i["path"] for i in human["items"]}
    longfiles=set()
    lp2=ROOT/"content/b1/audio-long/lessons.json"
    if lp2.is_file():
        longpack=load("content/b1/audio-long/lessons.json")
        longfiles={e["path"] for e in longpack["lessons"]}
    stories=set()
    story_manifest=ROOT/"content/b1/audio-long/human-stories.json"
    if story_manifest.exists():
        stories={entry["audio_path"] for entry in load("content/b1/audio-long/human-stories.json")["items"]}
    require(seen==actual_sources|actual_tts|librivox|longfiles|stories,"Index doesn't match actual recording manifests")
    require(len(plan["days"])==28,"Four week plan incomplete")
    ordered=[d["lesson_id"] for d in plan["days"] if d["lesson_id"]]
    require(len(ordered)==23 and len(set(ordered))==23,"Lesson coverage count")
    require(set(ordered)=={x["id"] for x in tts["lessons"]},"Unknown study lessons")
    for day in plan["days"]:
        require(sum(day["minutes"].values())==20,"Wrong duration: day "+str(day["day"]))
        require(day["controls"]["transcription_hidden_until_first_attempt"] is True,"Transcript leak")
        require(day["controls"]["first_listen_score_only_for_unseen_material"] is True,"Practice leakage")
    print(json.dumps({"status":"PASS","audio_files":len(seen),"study_days":28,"unique_lesson_ids":len(ordered)},ensure_ascii=False))

if __name__=="__main__":main()
