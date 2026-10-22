#!/usr/bin/env python3
"""Import only explicitly open-licensed Finnish audio from the reviewed catalog.

No scraping of official YKI audio, Yle audio, or paid materials.
Check the item's provenance in assets/audio/catalog.json before adding new items.
"""
from __future__ import annotations

import json
import os
import pathlib
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
CATALOG = ROOT / "audio" / "catalog.json"
MAX_BYTES = 5_000_000
COMMONS_API = "https://commons.wikimedia.org/w/api.php"
GITHUB_RAW = "https://raw.githubusercontent.com/GAIK-project/finnish-asr/main/"
USER_AGENT = "HospOdarYKI-audio-curation/1.0 (noncommercial educational corpus; contact via GitHub)"


def fetch_bytes(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "*/*", "Referer": "https://commons.wikimedia.org/"})
    with urllib.request.urlopen(req, timeout=60) as response:
        length = response.headers.get("Content-Length")
        if length and int(length) > MAX_BYTES:
            raise ValueError(f"Source too large: {url}")
        data = response.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise ValueError(f"Source too large after download: {url}")
    return data


def commons_url(filename: str) -> str:
    """Resolve known Commons originals directly without hammering its API.

    The Commons upload path uses MD5 of the Unicode NFC-normalized file name
    with spaces represented by underscores. Each listed title was inspected
    manually at its source page for licensing.
    """
    import hashlib
    import unicodedata

    name = unicodedata.normalize("NFC", filename.replace(" ", "_"))
    digest = hashlib.md5(name.encode("utf-8")).hexdigest()
    return ("https://upload.wikimedia.org/wikipedia/commons/"
            + digest[:1] + "/" + digest[:2] + "/"
            + urllib.parse.quote(name))


def original_url(entry: dict) -> str:
    info = entry["download"]
    if info["type"] == "commons":
        return commons_url(info["file_title"])
    if info["type"] == "github_raw":
        relative = info["path"]
        if not relative.startswith("docs/listen/") or ".." in pathlib.PurePosixPath(relative).parts:
            raise ValueError(f"Disallowed GitHub source: {relative}")
        return GITHUB_RAW + urllib.parse.quote(relative, safe="/")
    raise ValueError("Unreviewed source type " + repr(info["type"]))


def validate(data: bytes, fmt: str) -> None:
    if fmt == "ogg" and not data.startswith(b"OggS"):
        raise ValueError("Not an Ogg audio file")
    if fmt == "mp3" and not (data.startswith(b"ID3") or
        (len(data) > 2 and data[0] == 255 and data[1] & 224 == 224)):
        raise ValueError("Not an MP3 audio file")
    if len(data) < 500:
        raise ValueError("Audio too small to be credible")


def main() -> int:
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    errors = []
    for entry in catalog["open_licensed_downloads"]:
        path = ROOT / entry["relative_path"]
        if not path.resolve().is_relative_to((ROOT / "audio" / "open").resolve()):
            raise ValueError("Path outside assets/audio/open: " + str(path))
        try:
            if path.exists():
                validate(path.read_bytes(), entry["format"])
                print(f"EXISTS {path.relative_to(ROOT)} ({path.stat().st_size} bytes)")
                continue
            data = fetch_bytes(original_url(entry))
            validate(data, entry["format"])
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
            print(f"SAVED {path.relative_to(ROOT)} ({len(data)} bytes, {entry['license']})")
        except Exception as exc:
            errors.append((entry["id"], str(exc)))
            print(f"FAILED {entry['id']}: {exc}", file=sys.stderr)
        time.sleep(0.9)
    if errors:
        print(f"{len(errors)} downloads failed of {len(catalog['open_licensed_downloads'])}", file=sys.stderr)
        print("Partial import is acceptable: successfully downloaded files will be committed; failed sources remain catalogued.", file=sys.stderr)
        successful = sum((ROOT / entry["relative_path"]).is_file() for entry in catalog["open_licensed_downloads"])
        return 0 if successful > 0 else 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
