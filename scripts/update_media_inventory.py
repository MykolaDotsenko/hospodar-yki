#!/usr/bin/env python3
"""Regenerate Git-object media inventory after deliberate binary imports.

This updates technical file identities only. It NEVER certifies redistribution
rights: every new asset requires separate human provenance/license review.
"""
from __future__ import annotations

import argparse
import json
from datetime import date
from pathlib import Path

from validate_repository_taxonomy import ROOT, binary_files, git_blob_sha


def render_inventory(root: Path) -> dict:
    path = root / "catalog/media-inventory-v1.json"
    prior = json.loads(path.read_text(encoding="utf8"))
    prior_by_path = {x["path"]: x for x in prior.get("entries", [])}
    entries = []
    for relpath, file in sorted(binary_files(root).items()):
        prev = prior_by_path.get(relpath, {})
        entries.append({
            "path": relpath,
            "kind": ("image" if file.suffix.lower() == ".svg"
                     else "video" if file.suffix.lower() == ".webm"
                     else "document" if file.suffix.lower() == ".pdf"
                     else "audio"),
            "size_bytes": file.stat().st_size,
            "git_blob_sha": git_blob_sha(file),
            "rights_state": "verify_in_source_manifest_before_redistribution",
        })
    prior["checked_at"] = date.today().isoformat()
    prior["totals"] = {"files": len(entries), "bytes": sum(x["size_bytes"] for x in entries)}
    prior["entries"] = entries
    return prior


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="Write updated inventory after human rights review")
    args = parser.parse_args()
    current = render_inventory(ROOT)
    if args.write:
        path = ROOT / "catalog/media-inventory-v1.json"
        path.write_text(json.dumps(current, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
        print(f"WROTE {len(current['entries'])} binary file identities. Human rights audit still mandatory.")
        return 0
    print(f"DRY RUN {len(current['entries'])} files; use --write only after validating source and license")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
