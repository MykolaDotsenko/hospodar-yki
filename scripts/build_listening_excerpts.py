#!/usr/bin/env python3
"""Make short Finnish listening excerpts from the two already-licensed local audio sources.

No protected YKI recordings, no network fetches, no guessed transcripts.
Originals and derivatives are CC BY-SA 3.0, attributed to Vassilik.
"""
from __future__ import annotations
import hashlib
import json
import pathlib
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'audio' / 'segments'
SOURCES = (
  ('suomen_kieli_johdanto', 'audio/open/monologues/suomen_kieli_johdanto.ogg', 'Fi-Suomen kieli johdanto.ogg', 'Finnish language introduction'),
  ('suomi_johdanto', 'audio/open/monologues/suomi_johdanto.ogg', 'Fi-Suomi johdanto.ogg', 'Introduction to Finland'),
)
LICENSE = 'https://creativecommons.org/licenses/by-sa/3.0/'


def command(*args):
    return subprocess.run(args, capture_output=True, text=True, check=True)


def duration(path):
    return float(command('ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(path)).stdout.strip())


def silences(path):
    r = subprocess.run(['ffmpeg','-hide_banner','-nostdin','-i',str(path),'-af','silencedetect=noise=-35dB:d=0.12','-f','null','-'],capture_output=True,text=True)
    if r.returncode != 0:
        raise RuntimeError('ffmpeg silencedetect failed: '+r.stderr[-400:])
    starts=[float(v) for v in re.findall(r'silence_start:\s*([0-9.]+)',r.stderr)]
    ends=[float(v) for v in re.findall(r'silence_end:\s*([0-9.]+)',r.stderr)]
    return [(a+b)/2 for a,b in zip(starts,ends) if b>a]


def choose_intervals(total,pause_times):
    cuts=[0.0]
    methods=[]
    while total-cuts[-1] > 28:
        start=cuts[-1]
        choices=[t for t in pause_times if start+11 <= t <= min(start+24,total-9)]
        if choices:
            chosen=min(choices,key=lambda x:abs(x-(start+17)))
            method='silence_boundary'
        else:
            chosen=min(start+19,total-9)
            method='fixed_time_fallback_possible_mid_word'
        if chosen-start<8: break
        cuts.append(chosen);methods.append(method)
    cuts.append(total)
    if total-cuts[-2]<8 and len(cuts)>2:
        cuts.pop(-2);methods.pop()
    return [(round(a,3),round(b,3),(methods[i-1] if i>0 else 'source_start')) for i,(a,b) in enumerate(zip(cuts,cuts[1:]))]


def main():
    OUT.mkdir(parents=True,exist_ok=True)
    entries=[]
    for slug,source,orig,title in SOURCES:
        source_path=ROOT/source
        if not source_path.exists():
            print('SOURCE MISSING', source);continue
        assert source_path.read_bytes()[:4]==b'OggS',f'Invalid OGG {source}'
        seconds=duration(source_path)
        intervals=choose_intervals(seconds,silences(source_path))
        for i,(a,b,method) in enumerate(intervals,1):
            rel=f'audio/segments/{slug}/part-{i:02d}.ogg'
            p=ROOT/rel;p.parent.mkdir(parents=True,exist_ok=True)
            if not p.exists():
                command('ffmpeg','-hide_banner','-nostdin','-loglevel','error','-y','-ss',str(a),'-i',str(source_path),'-t',str(b-a),'-vn','-c:a','libvorbis','-q:a','4',str(p))
            data=p.read_bytes()
            if not data.startswith(b'OggS') or len(data)<1000:
                raise ValueError(f'Corrupted excerpt: {rel}')
            entries.append(dict(id=f'{slug}-clip-{i:02}',path=rel,parent=source,source_page='https://commons.wikimedia.org/wiki/File:'+orig.replace(' ','_'),original_title=title,author='Vassilik',license='CC BY-SA 3.0',license_url=LICENSE,modification='Cropped from original Ogg to a shorter Ogg Vorbis excerpt; no changes to spoken content',original_start_seconds=a,original_end_seconds=b,approx_duration_seconds=round(b-a,1),boundary_method=method,sha256=hashlib.sha256(data).hexdigest(),bytes=len(data),level_hint='B1-B2',official_yki=False,transcript_verified=False,training_task_fi='Kuuntele tämä lyhyt äänite. Kerro omin sanoin, mistä siinä puhutaan. Kuuntele uudelleen ja mainitse yksi yksityiskohta.'))
        print(f'{slug}: {len(intervals)} excerpts from {seconds:.1f}s')
    if not entries: raise RuntimeError('No source audio to segment')
    (OUT/'index.json').write_text(json.dumps(dict(schema_version=1,generated_by='scripts/build_listening_excerpts.py',count=len(entries),warning_uk='Обрізані фрагменти з двох ліцензованих оригінальних записів, не нові диктори. CC BY-SA 3.0. Не офіційні YKI, без перевірених транскриптів. Потребують слухової редактури меж фраз.',items=entries),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Created',len(entries),'excerpts')


if __name__=='__main__':
    main()
