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
    "sources/audio/recording-sources.json",
    "sources/audio/yki-targeted-sources-2026-10.json",
    "sources/audio/YKI-LISTENING-RESEARCH-2026-10.md",
    "learning/plans/listening-lesson-plan.json",
    "learning/plans/listening-4-weeks.json",
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
MISPLACED_CONTENT = ("assets/audio/catalog.json", "assets/audio/learning-plan.json",
                     "assets/audio/program-4weeks.json",
                     "assets/audio/yki-targeted-sources-2026-10.json",
                     "assets/audio/YKI-LISTENING-RESEARCH-2026-10.md")
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
    for name in MISPLACED_CONTENT:
        if (root / name).exists():
            errors.append(f"noncanonical duplicate research/plan in assets: {name}")
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



def check_local_media_ownership(root: Path):
    """Every local OGG/MP3/WebM must have exactly one player entry.

    These existing player manifests are not extra catalogs/registries.
    This prevents duplicate bot-generated audio and unreferenced orphan files.
    It checks file ownership, not copyright permissions or transcription QA.
    """
    problems = []
    specs = (
        ("assets/audio/library.json", "entries", "assets/audio", {".ogg", ".mp3"}),
        ("assets/video/open/available.json", "assets", "assets/video/open", {".webm"}),
    )
    discovered_audio_suffixes = {".ogg", ".oga", ".mp3", ".m4a", ".aac", ".wav", ".flac", ".opus", ".aiff"}
    for manifest, collection, folder, extensions in specs:
        path = root / manifest
        if not path.is_file():
            problems.append(f"media manifest missing: {manifest}")
            continue
        try:
            rows = json.loads(path.read_text(encoding="utf-8"))[collection]
        except (ValueError, KeyError, UnicodeError) as exc:
            problems.append(f"invalid media manifest: {manifest}: {exc}")
            continue
        if not isinstance(rows, list):
            problems.append(f"media manifest entries must be a list: {manifest}")
            continue
        listed = set()
        ids = set()
        for row in rows:
            if not isinstance(row, dict):
                problems.append(f"invalid media row: {manifest}: {row!r}")
                continue
            identifier, value = row.get("id"), row.get("path")
            if not isinstance(identifier, str) or not identifier:
                problems.append(f"missing media ID in {manifest}")
            elif identifier in ids:
                problems.append(f"duplicate media ID in {manifest}: {identifier}")
            ids.add(identifier)
            if not isinstance(value, str) or not value:
                problems.append(f"missing media path in {manifest}: {identifier}")
                continue
            reference = Path(value)
            if (reference.is_absolute() or ".." in reference.parts
                    or not value.startswith(folder + "/")
                    or reference.suffix.lower() not in extensions):
                problems.append(f"unsafe/wrong-root media path in {manifest}: {value}")
                continue
            if value in listed:
                problems.append(f"duplicate media path in {manifest}: {value}")
            listed.add(value)
        folder_path = root / folder
        actual = {
            p.relative_to(root).as_posix()
            for p in folder_path.rglob("*")
            if p.is_file() and p.suffix.lower() in (
                discovered_audio_suffixes if folder == "assets/audio" else extensions
            )
        } if folder_path.is_dir() else set()
        problems.extend(f"unreferenced media file: {p}" for p in sorted(actual - listed))
        problems.extend(f"manifest points to missing media file: {p}" for p in sorted(listed - actual))
    return problems


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
    """Check every Markdown navigation link, excluding fenced code examples."""
    from validate_ai_docs import markdown_without_fences
    errors = []
    re_link = re.compile(r"!?\[[^\]\n]+\]\(([^)\n]+)\)")
    markdown_files = sorted(root.rglob("*.md"))
    for file in markdown_files:
        if ".git" in file.parts or "node_modules" in file.parts:
            continue
        name = file.relative_to(root).as_posix()
        body = markdown_without_fences(file.read_text(encoding="utf-8"))
        for raw in re_link.findall(body):
            link = raw.split("#", 1)[0].split("?", 1)[0]
            if not link or link.startswith(("https:", "http:", "mailto:", "tel:", "#")):
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

# Asset imports mutate media and manifests, so they are intentionally explicit
# manual actions on main. Check concrete workflow files, not a synthetic registry.
IMPORT_WORKFLOWS = (
    "import-open-finnish-videos.yml", "import-vierko-oer.yml",
    "import-open-audio.yml", "import-librivox-human.yml",
    "build-listening-excerpts.yml", "import-fleurs-human-audio.yml",
    "import-prinsessa-audio.yml", "build-b1-listening.yml",
    "render-b1-long-audio.yml",
)


def check_import_workflows(root: Path):
    errors = []
    for name in IMPORT_WORKFLOWS:
        file = root / ".github" / "workflows" / name
        if not file.is_file():
            errors.append(f"missing importer workflow: {name}")
            continue
        content = file.read_text(encoding="utf-8")
        trigger = content.partition("permissions:")[0]
        if "on:" not in trigger.splitlines() or "  workflow_dispatch:" not in trigger.splitlines():
            errors.append(f"import must be manually dispatched: {name}")
        if "push:" in trigger:
            errors.append(f"import auto-runs on push: {name}")
        if "if: github.ref == 'refs/heads/main'" not in content:
            errors.append(f"import lacks main-only guard: {name}")
        for line in content.splitlines():
            if "git add " in line:
                for old in ("-- audio/", "-- video/", "-- content/"):
                    if old in line:
                        errors.append(f"old git add path in {name}: {line.strip()}")
    path = root / "sources/audio/recording-sources.json"
    if path.is_file():
        data = json.loads(path.read_text(encoding="utf-8"))
        for record in data.get("open_licensed_downloads", []):
            relative = record.get("relative_path", "")
            if not isinstance(relative, str) or not relative.startswith("assets/audio/open/"):
                errors.append(f"open audio uses invalid source path: {record.get('id')}: {relative!r}")
    else:
        errors.append("missing sources/audio/recording-sources.json")
    return errors


# Validate the actual source JSON already consumed by lessons and media players.
# No parallel file index: references are discovered in place, recursively.
REFERENCE_FOLDERS = (
    "assets/audio", "assets/video", "learning", "sources/audio",
)
REFERENCE_PREFIXES = (
    "assets/", "learning/", "knowledge/", "research/", "sources/", "docs/", "brand/",
)
REFERENCE_SUFFIXES = {
    ".json", ".ogg", ".oga", ".mp3", ".webm", ".wav", ".flac", ".opus",
    ".m4a", ".aac", ".aiff", ".vtt", ".txt", ".pdf", ".svg", ".png",
    ".jpg", ".jpeg", ".webp", ".avif", ".tsv", ".md",
}


def check_operational_json_references(root: Path):
    """Every repository-root file reference in runtime/authoring JSON must resolve.

    Values such as 'file.json#lesson-id' resolve against the file portion.
    Prose, HTTP(S) citations and future architecture research are not paths.
    Reject traversal and absolute forms rather than attempting to resolve them.
    """
    from urllib.parse import urlsplit
    problems = []
    checked = 0
    visited = set()
    for folder in REFERENCE_FOLDERS:
        base = root / folder
        for source in sorted(base.rglob("*.json")) if base.is_dir() else ():
            if source in visited:
                continue
            visited.add(source)
            try:
                payload = json.loads(source.read_text(encoding="utf-8"))
            except (ValueError, UnicodeError):
                # check_json already owns the parse error.
                continue

            def walk(value, pointer="$"):
                nonlocal checked
                if isinstance(value, dict):
                    for key, inner in value.items():
                        walk(inner, f"{pointer}.{key}")
                elif isinstance(value, list):
                    for i, inner in enumerate(value):
                        walk(inner, f"{pointer}[{i}]")
                elif isinstance(value, str):
                    # Only explicit repo-root paths, not prose or external URLs.
                    if not value.startswith(REFERENCE_PREFIXES):
                        return
                    path_text = urlsplit(value).path
                    # Support references like .json#item_id while checking file existence.
                    if Path(path_text).suffix.lower() not in REFERENCE_SUFFIXES:
                        return
                    checked += 1
                    display = f"{source.relative_to(root)}:{pointer}"
                    decoded = unquote(path_text)
                    ref = Path(decoded)
                    if ("\\" in decoded or ref.is_absolute()
                            or ".." in ref.parts or decoded.startswith("./")
                            or "\x00" in decoded):
                        problems.append(f"unsafe resource path {display}: {value}")
                        return
                    resolved = (root / ref).resolve()
                    if not resolved.is_relative_to(root.resolve()):
                        problems.append(f"resource path escapes repository {display}: {value}")
                    elif not resolved.is_file():
                        problems.append(f"missing referenced resource {display}: {value}")
            walk(payload)
    return problems, checked


def check_youtube_link_only(root: Path):
    """The source folder must not turn into an offline copy of YouTube."""
    source = root / "sources/youtube"
    if not source.is_dir():
        return ["YouTube source folder is missing"]
    binary = {".mp4", ".webm", ".mkv", ".mov", ".m4v", ".mp3",
              ".ogg", ".m4a", ".aac", ".wav", ".flac"}
    return [
        f"downloaded media in YouTube link-only folder: {p.relative_to(root)}"
        for p in sorted(source.rglob("*"))
        if p.is_file() and p.suffix.lower() in binary
    ]


def validate(root: Path):
    tree_errors, counts = check_tree(root)
    json_errors, num_json = check_json(root)
    manifest_errors, references = check_manifest_file_references(root)
    resource_errors, _ = check_operational_json_references(root)
    problems = (tree_errors + json_errors + check_links(root) + check_mvp(root)
                + manifest_errors + check_import_workflows(root)
                + check_local_media_ownership(root) + resource_errors
                + check_youtube_link_only(root))
    return problems, counts, num_json


if __name__ == "__main__":
    problems, counts, num = validate(ROOT)
    for problem in problems:
        print("FAIL:", problem, file=sys.stderr)
    if problems:
        print(f"FAIL: {len(problems)} errors", file=sys.stderr)
        sys.exit(1)
    print(f"PASS: directories, {num} JSON files, {counts}, internal navigation, Web imports, operational media/lesson references")
