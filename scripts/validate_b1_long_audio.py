#!/usr/bin/env python3
"""Validate 2-3 minute B1 generated audio and its exact transcript/subtitle cues."""
import json,pathlib,hashlib,re
R=pathlib.Path(__file__).resolve().parents[1]
s=json.loads((R/"learning/exercises/b1/audio-long/source-lessons.json").read_text())
m=json.loads((R/"learning/exercises/b1/audio-long/lessons.json").read_text())
l=json.loads((R/"assets/audio/library.json").read_text())
assert len(s["items"])==len(m["lessons"])==6
assert len({x["id"] for x in m["lessons"]})==6
for source,lesson in zip(s["items"],m["lessons"]):
    assert source["id"]==lesson["id"]
    assert source["segments_fi"]==lesson["segments_fi"]
    assert source["questions"]==lesson["questions"]
    p=R/lesson["path"]; b=p.read_bytes()
    assert b.startswith(b"OggS") and len(b)==lesson["bytes"]
    assert hashlib.sha256(b).hexdigest()==lesson["sha256"]
    assert 118<=lesson["duration_seconds"]<=185
    txt=(R/lesson["transcript_path"]).read_text().strip()
    assert txt=="\n\n".join(lesson["segments_fi"])
    v=(R/lesson["subtitles_path"]).read_text()
    assert v.startswith("WEBVTT\n")
    assert lesson["vtt_cues"]==len(lesson["segments_fi"])
    assert v.count(" --> ")==lesson["vtt_cues"]
    assert all(text in v for text in lesson["segments_fi"])
    assert len(lesson["questions"])==4
    for q in lesson["questions"]:
        assert len(q["options_fi"])==3 and q["correct_index"] in (0,1,2)
assert len([x for x in l["entries"] if x["kind"]=="tts_b1_long"])==6
assert len(l["entries"])==l["counts"]["total_files"]
print(json.dumps({"PASS":True,"tracks":6,"format":"ogg","subtitles":"vtt","text":"exact","total_audio":len(l["entries"])}))
