#!/usr/bin/env python3
"""Import explicitly CC BY-SA 4.0 VIERKO S2 original PDF files.

Source record: https://www.finna.fi/Record/aoe.4276
Do not convert to text, alter, or strip attribution.
"""
from __future__ import annotations
import pathlib
import urllib.request
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEST = ROOT / "content" / "third-party" / "VIERKO-2024"
MAX_BYTES = 10_000_000
PDFS = [
    ("01-vuorovaikutus.pdf", "https://aoe.fi/api/v1/download/file/s2osa1vuorovaikutusselkokielivierko-1731401579848.pdf"),
    ("02-tekstit-ja-lahteet.pdf", "https://aoe.fi/api/v1/download/file/s2osa2tekstitjalahteetselkokielivierko-1731920723127.pdf"),
    ("03-tee-teksteja.pdf", "https://aoe.fi/api/v1/download/file/s2osamiskokonaisuus3vierko-1731400923414.pdf"),
]

def main() -> int:
    ok, failed = 0, []
    DEST.mkdir(parents=True, exist_ok=True)
    for filename, url in PDFS:
        output = DEST / filename
        try:
            if output.exists():
                original = output.read_bytes()
                if not original.startswith(b"%PDF-") or len(original) < 10_000:
                    raise ValueError("Existing file is not a real PDF")
                print(f"EXISTS: {filename}, {len(original)} bytes")
                ok += 1
                continue
            request = urllib.request.Request(url, headers={
                "User-Agent": "HospodarYKI-OERImport/1.0 (GitHub educational mirror)",
                "Accept": "application/pdf,*/*"
            })
            with urllib.request.urlopen(request, timeout=60) as response:
                if response.geturl().startswith("http://"):
                    raise ValueError("Insecure redirect")
                data = response.read(MAX_BYTES+1)
            if len(data) > MAX_BYTES or len(data) < 10_000 or not data.startswith(b"%PDF-"):
                raise ValueError("Not a valid PDF within limits")
            output.write_bytes(data)
            print(f"SAVED: {filename}, {len(data)} bytes")
            ok += 1
        except Exception as exc:
            failed.append(f"{filename}: {exc}")
            print("FAILED: " + failed[-1], file=sys.stderr)
    if failed:
        print(f"{len(failed)} skipped, {ok} saved/valid; no fabricated local files", file=sys.stderr)
    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(main())
