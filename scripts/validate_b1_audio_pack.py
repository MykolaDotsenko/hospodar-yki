#!/usr/bin/env python3
"""Strict machine validation of B1 audio + text + keyed questions.

Checks the SOURCE text and question identity against our original content bank.
Does not claim a teacher has audited Finnish pronunciation or CEFR suitability.
"""
from __future__ import annotations
import hashlib
import json
import pathlib

ROOT=pathlib.Path(__file__).resolve().parents[1]
LESSONS=ROOT/'learning/exercises/b1/audio-training/index.json'
INDEX=ROOT/'learning/exercises/b1/index.json'
HIGH=ROOT/'learning/exercises/b1/high-yield/reading-inference-bank.json'

def load(path):
    return json.loads(path.read_text(encoding='utf-8'))

def check(ok,msg):
    if not ok:raise AssertionError(msg)

def main():
    data=load(LESSONS)
    index=load(INDEX)
    high=load(HIGH)
    original={}
    for x in index['themes']:
        m=load(ROOT/x['path'])
        title=m['id']
        original[title+'-dialogue']={
            'text':'\n\n'.join(t['text_fi'] for t in m['listening']['turns']),
            'q':m['listening']['questions']
        }
        original[title+'-notice']={
            'text':m['reading']['text_fi'],
            'q':m['reading']['questions']
        }
    for m in high['items']:
        original[m['id']+'-audio']={'text':m['text_fi'],'q':m['questions']}
    check(len(original)==23,'Original source count mismatch')
    check(data['count_lessons']==23,'Lesson metadata count mismatch')
    check(len(data['lessons'])==23,'Actual lesson count mismatch')
    ids=set();paths=set();audios=0;questions=0
    kinds={'one_voice_dialogue_script':0,'informational_monologue':0,'complex_notice':0}
    for lesson in data['lessons']:
        id=lesson['id']
        check(id not in ids,'Duplicate lesson ID '+id); ids.add(id)
        check(id in original,'Unknown source lesson '+id)
        check(lesson['transcript_fi']==original[id]['text'],'TTS transcript differs from source: '+id)
        check(lesson['questions']==original[id]['q'],'Answer keys differ from source: '+id)
        check(lesson['synthetic_audio'] is True and lesson['official_yki'] is False,'Missing TTS disclaimer: '+id)
        check(lesson['quality_status']=='needs_native_listening_review','Unreviewed voice mislabeled: '+id)
        kind=lesson['category'];check(kind in kinds,'Unexpected lesson kind');kinds[kind]+=1
        if kind=='one_voice_dialogue_script':
            check(lesson['different_character_voices'] is False,'Single voice must be explicit')
        versions=lesson['audio_versions']
        expected=('normal','scaffold_slow') if kind=='informational_monologue' else (
                 ('normal','challenge_fast') if kind=='complex_notice' else ('normal',))
        check(tuple(x['variant'] for x in versions)==expected,'Variants mismatch: '+id)
        questions+=len(lesson['questions'])
        for audio in versions:
            pstr=audio['path']; path=ROOT/pstr
            check(pstr not in paths,'Duplicate audio path '+pstr);paths.add(pstr)
            check(pstr.startswith('audio/tts/harri/') and pstr.endswith('.ogg'),'Path invalid '+pstr)
            check(path.exists() and path.is_file(),'Missing audio file '+pstr)
            body=path.read_bytes()
            check(len(body)>4000 and body.startswith(b'OggS'),'Invalid audio data '+pstr)
            check(len(body)==audio['bytes'],'Byte count mismatch '+pstr)
            check(hashlib.sha256(body).hexdigest()==audio['sha256'],'SHA mismatch '+pstr)
            check(3<audio['duration_seconds']<210,'Bad duration '+pstr)
            check(audio['contains_human_voices'] is False,'Incorrect human-voice flag '+pstr)
            audios+=1
    check(kinds=={'one_voice_dialogue_script':9,'informational_monologue':9,'complex_notice':5},'Wrong categories')
    check(audios==37 and data['count_audio_files']==37,'Expected exactly 37 audio files')
    check(questions==56,'Expected 56 source questions')
    check(data['source_model']['model_sha256']=='a44167faa34caed940e4fcad139fcc35922266b2593bcebe77701774c0fb2389','Model lineage not pinned')
    print(json.dumps({'result':'PASS','lessons':len(ids),'ogg_files':audios,'questions':questions,'sources':kinds}))

if __name__=='__main__':
    main()
