#!/usr/bin/env python3
"""Check actual folder placement and link integrity after source-tree migration.

No binary registry. Stays stdlib-only and operates on concrete files.
"""
from pathlib import Path
import json
import re
import sys
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = (
    "docs/FOLDER-STRUCTURE.md",
    "app/index.html",
    "app/exam.html",
    "assets/images/brand/hospodar-yki-mark.svg",
    "assets/audio/available.json",
    "assets/audio/library.json",
    "assets/video/open/available.json",
    "sources/youtube/youtube-catalog.json",
    "sources/official/yki-mock-simulation-sources.json",
    "sources/publishers/publisher-series-catalog.json",
    "learning/exercises/b1/index.json",
    "knowledge/dictionaries/b1/contextual-chunks-v1.json",
    "knowledge/dictionaries/b1/rektio-v1.json",
    "research/pedagogy/learning-methods-v1.json",
    "research/design/color-attention-design-policy-v2.json",
    "research/ux/interactive-visual-learning-v1.json",
    "research/gameplay/gameplay-learning-loops-v1.md",
    "research/user-cases/core-flows-v1.md",
)
NO_LONGER_CANONICAL = ("catalog/", "audio/", "video/", "content/", "brand/logo/")
MIME = ("audio/webm", "audio/ogg", "audio/mpeg", "video/webm", "image/svg+xml")
MARKDOWN_FILES = (
    "README.md", "AGENTS.md", "docs/INDEX.md", "docs/FOLDER-STRUCTURE.md",
    "assets/README.md", "assets/audio/README.md", "assets/video/README.md",
    "assets/images/README.md", "learning/README.md", "learning/CONTRIBUTING.md",
    "knowledge/README.md", "sources/README.md", "research/README.md",
)


def check_tree(root: Path):
    errors = []
    for name in REQUIRED:
        if not (root / name).is_file():
            errors.append(f"required file absent: {name}")
    for name in NO_LONGER_CANONICAL:
        if (root / name).exists():
            errors.append(f"old top-level category remains: {name}")
    if list(root.glob("catalog/**/registry*.json")):
        errors.append("machine registry still exists")
    # Essential binary payloads can never be silently dropped to appease checkers.
    counts = {
        "audio": len(list((root / "assets/audio").rglob("*.ogg"))) + len(list((root / "assets/audio").rglob("*.mp3"))),
        "video": len(list((root / "assets/video").rglob("*.webm"))),
        "svg": len(list((root / "assets/images").rglob("*.svg"))),
        "pdf": len(list((root / "knowledge/books").rglob("*.pdf"))),
    }
    for key, min_count in {"audio": 85, "video": 3, "svg": 3, "pdf": 3}.items():
        if counts[key] < min_count:
            errors.append(f"missing physical {key} files: {counts[key]} < {min_count}")
    return errors, counts


def check_json(root: Path):
    errors = []
    count = 0
    for file in root.rglob("*.json"):
        count += 1
        try:
            json.loads(file.read_text(encoding="utf-8"))
        except (ValueError, UnicodeError) as exc:
            errors.append(f"invalid JSON: {file.relative_to(root)}: {exc}")
    return errors, count


def check_links(root: Path):
    errors = []
    re_link = re.compile(r"!?\[[^\]\n]+\]\(([^)\n]+)\)")
    for name in MARKDOWN_FILES:
        file = root / name
        if not file.is_file():
            continue
        body = file.read_text(encoding="utf-8")
        for raw in re_link.findall(body):
            link = raw.split("#", 1)[0].split("?", 1)[0]
            if not link or link.startswith(("https:", "http:", "mailto:")):
                continue
            if " " in link and not (file.parent / link).exists():
                continue
            target = (file.parent / unquote(link)).resolve()
            if not target.is_relative_to(root.resolve()):
                errors.append(f"out-of-tree link {name}: {raw}")
            elif not target.exists():
                errors.append(f"broken link {name}: {raw}")
    return errors


def check_mvp(root: Path):
    errors = []
    for name in ("app/app.mjs", "app/exam.mjs"):
        content = (root / name).read_text(encoding="utf-8")
        if "learning/exercises/b1/" not in content:
            errors.append(f"browser still uses old curriculum path: {name}")
        if 'from "core.mjs"' in content or 'from "exam-core.mjs"' in content:
            errors.append(f"relative JS module import was damaged: {name}")
        for mime in MIME:
            if f"assets/{mime}" in content:
                errors.append(f"MIME accidentally modified: {name}: {mime}")
    return errors



# These are executable content manifests, not a new registry: verify their file
# references by reading the original lesson/source JSON already shipped.
MANIFEST_PATH_FIELDS = (
    ("learning/exercises/b1/index.json", "themes", ("path",)),
    ("learning/exercises/b1/audio-training/index.json", "lessons", ("original_content_path",)),
    ("learning/exercises/b1/audio-long/lessons.json", "lessons",
     ("path", "subtitles_path", "transcript_path")),
    ("learning/exercises/b1/audio-long/human-stories.json", "items",
     ("audio_path", "transcript_path")),
    ("assets/audio/library.json", "entries", ("path",)),
    ("assets/audio/available.json", "items", ("path",)),
    ("assets/audio/segments/index.json", "items", ("path", "parent")),
    ("assets/video/open/available.json", "assets", ("path",)),
)


def check_manifest_file_references(root: Path):
    errors = []
    references = 0

    def check_reference(owner: str, value: str):
        nonlocal references
        if not isinstance(value, str) or not value:
            errors.append(f"invalid manifest reference: {owner}: {value!r}")
            return
        ref = Path(value)
        if ref.is_absolute() or ".." in ref.parts:
            errors.append(f"unsafe manifest path: {owner}: {value}")
            return
        if not value.startswith((
            "learning/exercises/", "assets/audio/", "assets/video/",
        )):
            errors.append(f"noncanonical manifest path: {owner}: {value}")
            return
        if not (root / ref).is_file():
            errors.append(f"missing manifest file: {owner}: {value}")
            return
        references += 1

    for file, collection, keys in MANIFEST_PATH_FIELDS:
        source = root / file
        if not source.is_file():
            errors.append(f"manifest itself missing: {file}")
            continue
        data = json.loads(source.read_text(encoding="utf-8"))
        items = data.get(collection)
        if not isinstance(items, list):
            errors.append(f"manifest items not a list: {file}/{collection}")
            continue
        for row in items:
            if not isinstance(row, dict):
                errors.append(f"invalid row: {file}/{collection}")
                continue
            for key in keys:
                # Some audited source rows genuinely have no optional transcript.
                if row.get(key) is not None:
                    check_reference(f"{file}:{row.get('id', '?')}.{key}", row[key])
            if file.endswith("audio-training/index.json"):
                for version in row.get("audio_versions", []):
                    check_reference(f"{file}:{row.get('id', '?')}.audio_versions",
                                    version.get("path"))
    return errors, references

def validate(root: Path):
    tree_errors, counts = check_tree(root)
    json_errors, num_json = check_json(root)
    manifest_errors, references = check_manifest_file_references(root)
    problems = tree_errors + json_errors + check_links(root) + check_mvp(root) + manifest_errors
    return problems, counts, num_json


if __name__ == "__main__":
    problems, counts, num = validate(ROOT)
    for problem in problems:
        print("FAIL:", problem, file=sys.stderr)
    if problems:
        print(f"FAIL: {len(problems)} errors", file=sys.stderr)
        sys.exit(1)
    print(f"PASS: directories, {num} JSON files, {counts}, internal navigation, Web imports, operational media/lesson references")
