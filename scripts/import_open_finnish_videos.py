#!/usr/bin/env python3
"""Import only hand-curated Creative Commons Finnish speech videos from Commons.

This script downloads actual compact 360p WebM transcodes, checks file signatures,
audio/video streams, duration and size, and writes an evidence/availability manifest.
It never downloads arbitrary links or publishes unverified captions.
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "video/catalog.json"
RESULT = ROOT / "video/open/available.json"
MAX_BYTES = 16 * 1024 * 1024
ALLOWED_LICENSES = {"CC BY 3.0", "CC BY-SA 3.0", "CC BY-SA 4.0"}
USER_AGENT = "HospodarYKI-media-import/1.0 (+https://github.com/MykolaDotsenko/hospodar-yki)"
VARIANT = "360p.vp9.webm"


def allowed_url(url: str) -> bool:
    u = urlparse(url)
    return u.scheme == "https" and u.netloc == "upload.wikimedia.org" and u.path.startswith("/wikipedia/commons/")


def transcode_url(item: dict) -> str:
    source = item["original_upload_url"]
    if not allowed_url(source) or not source.endswith(".webm"):
        raise ValueError("Not a whitelisted Wikimedia Commons WEBM URL")
    expected = quote(item["file_title"].replace(" ", "_"), safe="()-_.")
    if not source.endswith("/" + expected):
        raise ValueError("Filename mismatch against original upload URI: " + item["id"])
    # Wikimedia Commons TimedMediaHandler: /transcoded/{md5 directories}/{filename}/{filename}.360p.vp9.webm
    return source.replace("/wikipedia/commons/", "/wikipedia/commons/transcoded/", 1) + "/" + expected + "." + VARIANT


def stream_to_file(url: str, output: Path) -> None:
    if not allowed_url(url):
        raise ValueError("Unapproved host")
    err = None
    for trial in range(3):
        try:
            req = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "video/webm,application/octet-stream;q=0.5"})
            with urlopen(req, timeout=45) as response, output.open("wb") as fh:
                actual = response.geturl()
                if not allowed_url(actual):
                    raise ValueError("Redirect outside approved host")
                size = 0
                while True:
                    chunk = response.read(256 * 1024)
                    if not chunk:
                        break
                    size += len(chunk)
                    if size > MAX_BYTES:
                        raise ValueError("Media exceeds 16 MiB limit: " + url)
                    fh.write(chunk)
            if size < 50_000:
                raise ValueError("Too small to be a 360p training video")
            if output.open("rb").read(4) != bytes([0x1A, 0x45, 0xDF, 0xA3]):
                raise ValueError("Downloaded content is not EBML/WebM")
            return
        except (HTTPError, URLError, OSError, ValueError, TimeoutError) as ex:
            err = ex
            output.unlink(missing_ok=True)
            print(f"Retry {trial + 1}/3: {type(ex).__name__}: {ex}", file=sys.stderr)
            time.sleep(2 * (trial + 1))
    raise RuntimeError(f"Video download failed after retries: {err}")


def inspect(path: Path) -> dict:
    p = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration,format_name:stream=codec_type,codec_name,width,height", "-of", "json", str(path)],
        capture_output=True, text=True, check=True, timeout=30
    )
    data = json.loads(p.stdout)
    streams = data.get("streams", [])
    vs = next((s for s in streams if s.get("codec_type") == "video"), None)
    audio = next((s for s in streams if s.get("codec_type") == "audio"), None)
    if vs is None or audio is None:
        raise ValueError("No playable video AND audio streams")
    duration = float(data.get("format", {}).get("duration") or 0)
    if not (30 <= duration <= 240):
        raise ValueError("Duration outside 30–240 seconds")
    if vs.get("width", 10000) > 960 or vs.get("height", 10000) > 540:
        raise ValueError("Unexpectedly large video variant")
    return {"duration_seconds": round(duration, 3), "video_codec": vs.get("codec_name"),
            "audio_codec": audio.get("codec_name"), "width": vs.get("width"), "height": vs.get("height"),
            "bytes": path.stat().st_size, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}


def main() -> int:
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    seen = set()
    records = []
    downloaded = 0
    for item in catalog["items"]:
        name = item["id"]
        if name in seen or item["license"] not in ALLOWED_LICENSES or item["license_checked"] is not True:
            raise ValueError("Invalid source allowlist/duplicate/license: " + name)
        seen.add(name)
        dest = ROOT / item["output_path"]
        if not dest.is_relative_to(ROOT / "video/open"):
            raise ValueError("Illegal output path")
        dest.parent.mkdir(parents=True, exist_ok=True)
        uri = transcode_url(item)
        rec = {"id": name, "path": item["output_path"], "source_url": item["source_url"],
               "author": item["author"], "license": item["license"], "license_url": item["license_url"],
               "download_url": uri, "teacher_review": item["teacher_review"]}
        try:
            if not dest.exists():
                tmp = dest.with_suffix(".download")
                stream_to_file(uri, tmp)
                tmp.replace(dest)
            media = inspect(dest)
            rec.update({"state": "verified_binary", **media})
            if abs(media["duration_seconds"] - item["duration_seconds_reported"]) > 6:
                raise ValueError("Downloaded media duration differs from Commons description")
            downloaded += 1
            print("VERIFIED", name, media["bytes"], media["duration_seconds"], media["sha256"])
        except Exception as ex:
            dest.unlink(missing_ok=True)
            rec["state"] = "download_or_validation_failed"
            rec["error"] = str(ex)[:300]
            print("FAILED", name, rec["error"], file=sys.stderr)
        records.append(rec)
    RESULT.parent.mkdir(parents=True, exist_ok=True)
    RESULT.write_text(json.dumps({"schema_version": "1.0.0", "imported_count": downloaded,
       "total_sources": len(records), "assets": records, "note": "All source material is unofficial, teacher review pending; no captions claimed"}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if downloaded == 0:
        raise RuntimeError("ZERO video binaries imported; do not claim completed download")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
