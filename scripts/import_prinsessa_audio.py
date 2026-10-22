#!/usr/bin/env python3
"""Store one COMPLETE human Finnish story (2:39) and lawful full Finnish printed text.

Audio: LibriVox Cygnaeus reads H. C. Andersen/Maila Talvio (public domain).
Printed book: Project Gutenberg #53484. Printed story is the source transcript,
NOT verified word-aligned ASR (LibriVox chapter includes introduction/credits).
"""
from __future__ import annotations
import hashlib,json,pathlib,re,subprocess,urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/"assets/audio/human/short-stories"
INDEX=ROOT/"learning/exercises/b1/audio-long/human-stories.json"
LIB=ROOT/"assets/audio/library.json"
AUDIO="https://www.archive.org/download/satujajatarinoitai_2507_librivox/satujajatarinoitai_03_andersen_128kb.mp3"
TEXT="https://www.gutenberg.org/cache/epub/53484/pg53484.txt"
def fetch(url,limit):
    req=urllib.request.Request(url,headers={"User-Agent":"HospodarYKI/1.0 (public domain educational text and audio)","Accept":"*/*"})
    with urllib.request.urlopen(req,timeout=70) as resp:
        content=resp.read(limit+1)
    if len(content)>limit:raise ValueError(f"Too large: {url}")
    return content
def main():
    OUT.mkdir(parents=True,exist_ok=True)
    mp3=OUT/"todellinen-prinsessa-cygnaeus.mp3"
    if not mp3.is_file():
        audio=fetch(AUDIO,5_000_000)
        if len(audio)<100_000 or not (audio.startswith(b"ID3") or (audio[0]==255 and audio[1]&224==224)):
            raise ValueError("MP3 did not download properly")
        mp3.write_bytes(audio)
    p=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",str(mp3)],capture_output=True,text=True,check=True)
    seconds=float(p.stdout.strip())
    if not 125<=seconds<=190:raise ValueError(f"Unexpected story duration {seconds}")
    whole=fetch(TEXT,1_800_000).decode("utf-8-sig")
    # Exact section boundaries from the original source (note book's one-S 'PRINSESA').
    match=re.search(r'\bTODELLINEN\s+PRINSESA\.\s*(.*?)\s*PIKKU IIDAN KUKKASET\.',whole,re.S)
    if not match:raise ValueError("Could not extract complete printed story from Project Gutenberg")
    story=match.group(1).strip()
    if not 700<len(story)<3000:raise ValueError(f"Unexpected story transcript length {len(story)}")
    transcript=OUT/"todellinen-prinsessa-original-text-fi.txt"
    transcript.write_text("TODELLINEN PRINSESA\n\n"+story+"\n",encoding="utf-8")
    actual=mp3.read_bytes()
    item=dict(id="human-prinsessa-complete",title_fi="Todellinen prinsessa",audio_path=str(mp3.relative_to(ROOT)),
       transcript_path=str(transcript.relative_to(ROOT)),duration_seconds=round(seconds,2),bytes=len(actual),
       sha256=hashlib.sha256(actual).hexdigest(),narrator="Cygnaeus",genre="fairy_tale",
       author="H. C. Andersen (died 1875)",translator="Maila Talvio (died 1951)",
       audio_source="https://librivox.org/satuja-ja-tarinoita-i-by-hans-christian-andersen/",
       printed_source="https://www.gutenberg.org/ebooks/53484",
       rights="Public domain Finland (original author and translator 70 years after death; LibriVox PD recording)",
       transcript_kind="complete_public_domain_original_story_text_not_word_aligned",
       transcript_caution="The LibriVox recording may include spoken chapter credit, and deviations/pauses; transcript is the printed source, not a manually synchronized transcription.",
       vtt_status="no_aligned_subtitles",level_estimate="B1+–B2 literary, NOT calibrated",
       teacher_review="pending",official_yki=False,
       questions=[
         dict(prompt_fi="Miksi prinssi oli murheellinen alussa?",options_fi=["Hän ei ollut löytänyt todellista prinsessaa","Hän oli menettänyt laivansa","Kuningas kielsi häntä matkustamasta"],correct_index=0),
         dict(prompt_fi="Millaista sää oli, kun prinsessa tuli linnalle?",options_fi=["Kova ukkosmyrsky","Aurinkoista ja lämmintä","Pakkasta ja lunta"],correct_index=0),
         dict(prompt_fi="Mitä kuningatar pani vuoteen pohjalle?",options_fi=["Herneen","Kiven","Omenan"],correct_index=0),
         dict(prompt_fi="Mitä tapahtui lopuksi herneelle?",options_fi=["Se vietiin museoon","Se istutettiin puutarhaan","Se annettiin hevoselle"],correct_index=0)
       ])
    INDEX.write_text(json.dumps(dict(schema_version=1,date="2026-10-21",items=[item],count=1),ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    lib=json.loads(LIB.read_text(encoding="utf-8"))
    if not any(x["path"]==item["audio_path"] for x in lib["entries"]):
        lib["entries"].append(dict(id=item["id"],kind="human_public_domain_story",path=item["audio_path"],
           synthetic=False,actual_human=True,license=item["rights"],author="Cygnaeus / LibriVox",
           source_page=item["audio_source"],duration_seconds=item["duration_seconds"],
           level=item["level_estimate"],topic="fiction",transcript_ref=item["transcript_path"],
           subtitles_ref=None,lesson_ref="learning/exercises/b1/audio-long/human-stories.json",
           qa="original_story_transcript_not_aligned_teacher_review_pending"))
    lib["counts"]["human_public_domain_story"]=1
    lib["counts"]["total_files"]=len(lib["entries"])
    lib["human_story_manifest"]="learning/exercises/b1/audio-long/human-stories.json"
    LIB.write_text(json.dumps(lib,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"saved":item["audio_path"],"duration":seconds,"transcript_characters":len(story),"total_audio":len(lib["entries"])},ensure_ascii=False))
if __name__=="__main__":main()
