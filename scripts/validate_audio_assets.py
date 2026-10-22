#!/usr/bin/env python3
"""Validate *present* audio assets for the app and distinguish from link-only candidates."""
from __future__ import annotations
import json
import pathlib
import sys
ROOT = pathlib.Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'assets/audio/available.json').read_text(encoding='utf-8'))
segment_index=json.loads((ROOT/'assets/audio/segments/index.json').read_text(encoding='utf-8'))
catalog=json.loads((ROOT/'assets/audio/catalog.json').read_text(encoding='utf-8'))
sources={x['relative_path']:x for x in catalog['open_licensed_downloads']}
segments={x['path']:x for x in segment_index['items']}
def verify(ok,msg):
    if not ok: raise ValueError(msg)
seen=set()
for x in manifest['items']:
    p=ROOT/x['path']
    verify(x['path'] not in seen,'Duplicate path '+x['path']); seen.add(x['path'])
    verify(p.is_file(),'Missing actual audio '+x['path'])
    data=p.read_bytes()
    verify(len(data)==x['bytes'],'Changed bytes '+x['path'])
    verify(data.startswith(b'OggS') if p.suffix in ('.ogg','.oga') else (data.startswith(b'ID3') or data[0:1]==b'\xff'), 'Invalid audio header '+x['path'])
    verify(x.get('license') and x.get('source_page') and x.get('author'),'Missing credit '+x['path'])
    if x['kind']=='derived_excerpt':
        verify(x['path'] in segments,'Missing segment metadata '+x['path'])
        verify((ROOT/x['parent']).is_file(),'Missing source parent '+x['parent'])
        verify(x['transcript_verified'] is False,'Unverified transcript mislabelled')
    else:
        verify(x['path'] in sources,'Uncatalogued original '+x['path'])
verify(sum(x['kind']=='original_recording' for x in manifest['items'])==manifest['counts']['original'],'Original total mismatch')
verify(sum(x['kind']=='derived_excerpt' for x in manifest['items'])==manifest['counts']['derived'],'Excerpt total mismatch')
verify(len(manifest['items'])==manifest['counts']['total'],'Total mismatch')
verify(len(segments)==manifest['counts']['derived'],'Segment metadata mismatch')
print(json.dumps({'status':'PASS','full':manifest['counts']['original'],'clips':manifest['counts']['derived'],'total':len(seen)}))
