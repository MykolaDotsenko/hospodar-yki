#!/usr/bin/env python3
"""Turn six original Finnish B1 scripts into complete 120-180s audio WITH accurate WebVTT subtitles.

Segments are synthesized independently and joined with half-second silent gaps.
WebVTT cue boundaries come from actual sample counts, not guessed speech alignment.
Files carry full exact source text, linked objective questions and provenance.
"""
from __future__ import annotations
import hashlib,json,pathlib,subprocess,tempfile,wave
ROOT=pathlib.Path(__file__).resolve().parents[1]
SOURCE=ROOT/"learning/exercises/b1/audio-long/source-lessons.json"
OUT=ROOT/"assets/audio/long/b1"
LESSONS=ROOT/"learning/exercises/b1/audio-long/lessons.json"
LIBRARY=ROOT/"assets/audio/library.json"
VOICE=pathlib.Path("/tmp/hospodar-yki-piper/fi_FI-harri-medium.onnx")
MODEL_SHA="a44167faa34caed940e4fcad139fcc35922266b2593bcebe77701774c0fb2389"

def command(args,**kwargs):
    return subprocess.run(args,capture_output=True,check=True,**kwargs)

def seconds_from_file(path):
    d=command(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",str(path)])
    return float(d.stdout.decode().strip())

def time_str(t):
    millis=round(t*1000)
    h,millis=divmod(millis,3600000)
    minutes,millis=divmod(millis,60000)
    s,ms=divmod(millis,1000)
    return f"{h:02d}:{minutes:02d}:{s:02d}.{ms:03d}"

def render(item,tmp):
    wavs=[]
    for n,para in enumerate(item["segments_fi"],1):
        target=tmp/f"segment-{n:02d}.wav"
        command(["piper","--model",str(VOICE),"--output_file",str(target)],
                input=(para+"\n").encode(),timeout=120)
        wavs.append(target)
    final=tmp/"combined.wav"
    cues=[]
    with wave.open(str(wavs[0]),"rb") as f:
        channels,width,rate=f.getnchannels(),f.getsampwidth(),f.getframerate()
    if channels!=1 or width!=2:raise ValueError("Unexpected Piper audio format")
    silence=b"\x00"*(round(rate*0.55)*width*channels)
    cursor=0
    with wave.open(str(final),"wb") as out:
        out.setnchannels(channels);out.setsampwidth(width);out.setframerate(rate)
        for i,p in enumerate(wavs):
            with wave.open(str(p),"rb") as f:
                if (f.getnchannels(),f.getsampwidth(),f.getframerate())!=(channels,width,rate):
                    raise ValueError("Inconsistent sample rates")
                frames=f.readframes(f.getnframes());length=len(frames)//(width*channels)
            a=cursor/rate
            out.writeframes(frames);cursor+=length
            b=cursor/rate
            cues.append((a,b,item["segments_fi"][i]))
            if i<len(wavs)-1:
                out.writeframes(silence);cursor+=len(silence)//(width*channels)
    raw_duration=cursor/rate
    # 140s ideal, but do not unnaturally over-speed the voice.
    tempo=min(1.15,max(0.75,raw_duration/143.0))
    target=OUT/(item["id"]+".ogg")
    target.parent.mkdir(parents=True,exist_ok=True)
    command(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(final),
             "-af",f"atempo={tempo:.6f}","-vn","-c:a","libvorbis","-q:a","4",str(target)],timeout=180)
    actual=seconds_from_file(target)
    if not 118<=actual<=185:raise ValueError(f"Audio is not about 2–3 min: {actual}s {item['id']} (raw {raw_duration}s)")
    # VTT timestamps derived from exact WAV sample offsets adjusted by the
    # measured output duration, so final cue is never longer than the output.
    factor=actual/raw_duration
    subtitles=["WEBVTT","","NOTE Sentences follow source-script chunks; timing from concatenated WAV samples. Synthetic Piper speech.",""]
    for i,(a,b,text) in enumerate(cues,1):
        subtitles.extend([str(i),time_str(a*factor)+" --> "+time_str(b*factor),text,""])
    vtt=OUT/(item["id"]+".vtt")
    vtt.write_text("\n".join(subtitles),encoding="utf-8")
    transcript=OUT/(item["id"]+".txt")
    transcript.write_text("\n\n".join(item["segments_fi"])+"\n",encoding="utf-8")
    d=target.read_bytes()
    if not d.startswith(b"OggS") or len(d)<50000:raise ValueError("Bad Ogg payload")
    return dict(path=str(target.relative_to(ROOT)),subtitles_path=str(vtt.relative_to(ROOT)),
                transcript_path=str(transcript.relative_to(ROOT)),
                duration_seconds=round(actual,2),bytes=len(d),sha256=hashlib.sha256(d).hexdigest(),
                tempo_adjustment=round(tempo,4),vtt_cues=len(cues),vtt_alignment="actual_segment_sample_offsets",
                synthetic_audio=True,speaker="Piper fi_FI-harri-medium",voice_count=1)

def main():
    if not VOICE.is_file() or hashlib.sha256(VOICE.read_bytes()).hexdigest()!=MODEL_SHA:raise RuntimeError("Piper model SHA mismatch")
    doc=json.loads(SOURCE.read_text(encoding="utf-8"))
    lessons=doc["items"]
    if len(lessons)!=6:raise ValueError("Missing six texts")
    OUT.mkdir(parents=True,exist_ok=True);LESSONS.parent.mkdir(parents=True,exist_ok=True)
    result=[]
    for n,item in enumerate(lessons,1):
        with tempfile.TemporaryDirectory() as temporary:
            details=render(item,pathlib.Path(temporary))
        result.append({**item,**details, "subtitle_license":"original_project_script",
             "teacher_audio_review":"pending","cefr_level_verified":False,
             "exam_like_not_official":True})
        print(f"{n}/6 SAVED {item['id']} {details['duration_seconds']}s {details['bytes']} bytes {details['vtt_cues']} VTT blocks",flush=True)
    data=dict(schema_version=1,build_date="2026-10-21",type="original_b1_listening_synthetic",
        lessons=result,count=len(result),voice_info={"source":"Piper Harri","sha256":MODEL_SHA,"human":False},
        transcript_policy="Exact authored scripts; cue timings derived from real synthesized segment length; not native-editor reviewed",
        exam_policy="Non-official B1 practice; do not claim CEFR certification")
    LESSONS.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    lib=json.loads(LIBRARY.read_text(encoding="utf-8"))
    old={x["path"] for x in lib["entries"]}
    for x in result:
        if x["path"] in old:continue
        lib["entries"].append(dict(id=x["id"],kind="tts_b1_long",path=x["path"],
             synthetic=True,actual_human=False,license="original_project_speech",
             author="Hospodar YKI / Piper Harri",source_page="https://github.com/MykolaDotsenko/hospodar-yki",
             duration_seconds=x["duration_seconds"],level=x["level_target"],topic=x["topic"],
             transcript_ref=x["transcript_path"],subtitles_ref=x["subtitles_path"],
             lesson_ref="learning/exercises/b1/audio-long/lessons.json",qa="machine_checked_native_teacher_review_pending"))
    lib["counts"]["tts_b1_long"]=len(result)
    lib["counts"]["total_files"]=len(lib["entries"])
    lib["b1_long_manifest"]="learning/exercises/b1/audio-long/lessons.json"
    LIBRARY.write_text(json.dumps(lib,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"COMPLETE {len(result)} original B1 tracks and VTTs. Total audio {len(lib['entries'])}",flush=True)
if __name__=="__main__":main()
