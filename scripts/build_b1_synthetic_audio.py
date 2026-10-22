#!/usr/bin/env python3
"""Create ORIGINAL practice audio, not official YKI audio.

Piper Harri fi_FI medium (source dataset CC0); no model weights committed.
One synthetic speaker is used throughout. All transcripts and keyed questions
are compiled directly from the original, machine-readable Hospodar YKI bank.
These assets supplement, not replace, authentic Finnish recordings.
"""
from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import tempfile
import time

ROOT=pathlib.Path(__file__).resolve().parents[1]
VOICE=pathlib.Path("/tmp/hospodar-yki-piper/fi_FI-harri-medium.onnx")
SOURCES=ROOT/"learning"/"exercises"/"b1"
DEST=ROOT/"assets"/"audio"/"tts"/"harri"
LESSONS=ROOT/"learning"/"exercises"/"b1"/"audio-training"/"index.json"
MODEL_SHA="a44167faa34caed940e4fcad139fcc35922266b2593bcebe77701774c0fb2389"
VOICE_URL="https://huggingface.co/rhasspy/piper-voices/tree/main/fi/fi_FI/harri/medium"
LICENSE_URL="https://huggingface.co/rhasspy/piper-voices/blob/main/fi/fi_FI/harri/medium/MODEL_CARD"

def run(args, **kwargs):
    return subprocess.run(args,check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,**kwargs)

def duration(path):
    p=run(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",str(path)])
    return round(float(p.stdout.decode().strip()),2)

def make(title, category, level, transcript, questions, source_path, speakers=1):
    return dict(id=title,category=category,level_hint=level,transcript_fi=transcript,questions=questions,original_content_path=source_path,
                created_in_project=True,synthetic_audio=True,speaker_model="Piper fi_FI-harri-medium",
                different_character_voices=False,speaker_count=speakers,
                official_yki=False,quality_status="needs_native_listening_review",transcript_status="original_text_tts_unverified_pronunciation",
                intended_use=["gist","details","delayed_recall","transfer"],answer_reveal="after_submission",
                disclaimer_uk="Синтетичний голос (один диктор). Не відтворює автентичні акценти чи екзаменаційний формат YKI.")

def collect():
    index=json.loads((SOURCES/"index.json").read_text(encoding="utf-8"))
    lessons=[]
    for row in index["themes"]:
        path=ROOT/row["path"]; m=json.loads(path.read_text(encoding="utf-8"))
        lid=m["id"]
        listening=m["listening"]; reading=m["reading"]
        # The original is a two-speaker script, but audio is voiced by ONE synthetic speaker.
        # Mark this explicitly rather than misrepresenting voice variety.
        turns="\n\n".join(x["text_fi"] for x in listening["turns"])
        lessons.append(make(lid+"-dialogue","one_voice_dialogue_script","A2.2-B1",turns,
                       listening["questions"],row["path"]))
        lessons.append(make(lid+"-notice","informational_monologue","A2.2-B1",reading["text_fi"],
                       reading["questions"],row["path"]))
    high=json.loads((SOURCES/"high-yield"/"reading-inference-bank.json").read_text(encoding="utf-8"))
    for item in high["items"]:
        lessons.append(make(item["id"]+"-audio","complex_notice","B1-B2",item["text_fi"],
                        item["questions"],"learning/exercises/b1/high-yield/reading-inference-bank.json"))
    if len(lessons)!=23 or len({x["id"] for x in lessons})!=23:
        raise ValueError("Expected 9 dialogue + 9 notice + 5 complex notice lessons")
    return lessons

def synthesis(text,wav):
    if len(text)<20:raise ValueError("Too short text")
    try:
        run(["piper","--model",str(VOICE),"--output_file",str(wav)],
            input=(text.strip()+"\n").encode("utf-8"),timeout=180)
    except subprocess.CalledProcessError as error:
        raise RuntimeError(f"Piper error: {error.stderr[-800:]!r}") from error
    if not wav.exists() or wav.stat().st_size<4000:
        raise RuntimeError("Piper generated no credible sound: "+str(wav))

def output_variant(wav,target,tempo=1.0):
    target.parent.mkdir(parents=True,exist_ok=True)
    if target.exists() and target.stat().st_size>4000 and target.read_bytes().startswith(b"OggS"):
        return
    filters=["-af",f"atempo={tempo}"] if tempo!=1.0 else []
    run(["ffmpeg","-hide_banner","-loglevel","error","-nostdin","-y","-i",str(wav),
         *filters,"-vn","-c:a","libvorbis","-q:a","3",str(target)],timeout=180)
    if target.stat().st_size<4000 or not target.read_bytes().startswith(b"OggS"):
        raise RuntimeError("Invalid audio: "+str(target))

def main():
    if not VOICE.exists() or hashlib.sha256(VOICE.read_bytes()).hexdigest()!=MODEL_SHA:
        raise RuntimeError("The pinned 63MB Finnish model was not downloaded/verified")
    DEST.mkdir(parents=True,exist_ok=True)
    LESSONS.parent.mkdir(parents=True,exist_ok=True)
    lessons=collect()
    with tempfile.TemporaryDirectory() as temp:
        for num,lesson in enumerate(lessons,1):
            wav=pathlib.Path(temp)/f"{lesson['id']}.wav"
            # Synthesizes text from our own source material.
            synthesis(lesson["transcript_fi"],wav)
            versions=[("normal",1.0)]
            if lesson["category"]=="informational_monologue": versions.append(("scaffold_slow",0.87))
            if lesson["category"]=="complex_notice": versions.append(("challenge_fast",1.12))
            playable=[]
            for label,tempo in versions:
                rel=f"audio/tts/harri/{lesson['id']}-{label}.ogg"
                target=ROOT/rel
                output_variant(wav,target,tempo)
                seconds=duration(target)
                if not (3<seconds<210):
                    raise ValueError(f"Suspicious duration {seconds} for {rel}")
                data=target.read_bytes()
                playable.append(dict(path=rel,variant=label,tempo_multiplier=tempo,
                                duration_seconds=seconds,bytes=len(data),sha256=hashlib.sha256(data).hexdigest(),
                                contains_human_voices=False))
            lesson["audio_versions"]=playable
            print(f"{num}/{len(lessons)} {lesson['id']}: {[x['duration_seconds'] for x in playable]}",flush=True)
    flat=sum(len(x["audio_versions"]) for x in lessons)
    if flat!=37: raise ValueError(f"Expected 37 OGGs, got {flat}")
    out={
        "schema_version":1,
        "updated_at":"2026-10-21",
        "generated_by":"scripts/build_b1_synthetic_audio.py",
        "provenance":"original_content_and_open_licensed_speech_model",
        "source_model":dict(name="Piper Harri medium",locale="fi-FI",source=VOICE_URL,model_card=LICENSE_URL,
                            model_sha256=MODEL_SHA,training_dataset="CC0",tts_engine="piper-tts 1.3.0",
                            sample_rate_hz=22050,synthetic_single_voice=True),
        "count_lessons":len(lessons),"count_audio_files":flat,
        "recommendation_uk":"Спочатку природне людське аудіо й власні діалоги; це синтетичне, придатне для керованого слухання/диктантів. 'slow' — адаптивна опора, 'fast' — окремий складніший режим.",
        "disclaimer_uk":"Не є матеріалами офіційного YKI. Вимова, наголос, числа й паузи потребують перевірки носієм/викладачем; один синтетичний диктор не заміняє живу розмову.",
        "lessons":lessons
    }
    LESSONS.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"DONE {len(lessons)} lessons, {flat} real ogg files",flush=True)

if __name__=="__main__":
    main()
