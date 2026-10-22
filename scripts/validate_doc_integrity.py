#!/usr/bin/env python3
"""Guard operational docs and GitHub Actions path filters against drift.

Stdlib-only: no extra registry and no inference that future architecture exists.
This validates actual file paths, not whether a deployment is production-ready.
"""
from __future__ import annotations

import glob
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
LEGACY_ROOTS = ("content/", "audio/", "video/", "catalog/", "knowledge/sources/")
PLANNED_ONLY_FILTERS = frozenset({"apps/web/**"})
ACTIVE_CONTENT_FILES = (
    "docs/11-mvp-product-requirements.md",
    "docs/12-mvp-architecture.md",
    "docs/15-two-modes-skill-scopes.md",
    "learning/exercises/b1/audio-training/README.md",
    "research/pedagogy/yki-methodology-implementation-v1.json",
)
STALE_CONTENT = re.compile(r"content/b1/|knowledge/sources/|(?<!assets/)audio/tts/")


def workflow_paths(source: str):
    """Yield (event, path) only within YAML push/PR paths filters.

    Do not confuse quoted job steps, branches or permissions with path filters.
    """
    event = None
    inside_paths = False
    for line in source.splitlines():
        match = re.match(r"^  (push|pull_request):\s*(?:#.*)?$", line)
        if match:
            event, inside_paths = match.group(1), False
            continue
        if re.match(r"^  [\w-]+:", line):
            event, inside_paths = None, False
        if event and re.match(r"^    paths:\s*(?:#.*)?$", line):
            inside_paths = True
            continue
        if inside_paths and re.match(r"^    [\w-]+:", line):
            inside_paths = False
        if not inside_paths:
            continue
        match = re.match(r"^\s+-\s+['\"]([^'\"]+)['\"]\s*(?:#.*)?$", line)
        if match:
            yield event, match.group(1)


def check_workflow_paths(root: Path):
    errors = []
    for file in sorted((root / ".github/workflows").glob("*.yml")):
        relative = file.relative_to(root).as_posix()
        seen = set()
        for event, raw in workflow_paths(file.read_text(encoding="utf-8")):
            pattern = raw.lstrip("!")
            key = (event, raw)
            if key in seen:
                errors.append(f"{relative}: duplicate {event} path filter {raw}")
            seen.add(key)
            if not pattern or pattern.startswith("/") or ".." in Path(pattern).parts:
                errors.append(f"{relative}: unsafe path filter {raw}")
                continue
            if pattern.startswith(LEGACY_ROOTS):
                errors.append(f"{relative}: obsolete path filter {raw}")
                continue
            if pattern in PLANNED_ONLY_FILTERS:
                continue  # approved future scaffold; not evidence of implemented code
            if not glob.glob(str(root / pattern), recursive=True):
                errors.append(f"{relative}: filter matches no current files {raw}")
    return errors


def check_active_content_paths(root: Path):
    errors = []
    for relative in ACTIVE_CONTENT_FILES:
        source = root / relative
        if not source.is_file():
            errors.append(f"active documentation absent: {relative}")
            continue
        for line_number, line in enumerate(source.read_text(encoding="utf-8").splitlines(), 1):
            if STALE_CONTENT.search(line):
                errors.append(f"{relative}:{line_number}: old physical content path")
    return errors


def validate(root: Path):
    return check_workflow_paths(root) + check_active_content_paths(root)


if __name__ == "__main__":
    failures = validate(ROOT)
    for failure in failures:
        print("FAIL:", failure, file=sys.stderr)
    if failures:
        raise SystemExit(f"FAIL: {len(failures)} documentation integrity errors")
    print("PASS: GitHub Actions path filters and active documentation paths match the repository")
