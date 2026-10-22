#!/usr/bin/env python3
"""Static ownership, rights-boundary and binary inventory checks for Hospodar YKI.

Stdlib only. Does NOT validate Finnish quality, video playback, commercial rights
or Android packaging. Safe to run on an ordinary GitHub checkout.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATEGORIES = {
    "images", "audio", "video", "youtube", "external_sources", "knowledge",
    "dictionaries", "exercises", "pedagogy", "design", "ux", "gameplay",
    "user_cases", "architecture",
}
STATUSES = {"implemented_source", "curated_link_only", "research_only", "target_only"}
MEDIA_EXT = {".mp3", ".ogg", ".webm", ".pdf", ".svg"}
MEDIA_ROOTS = ("audio/", "video/open/", "brand/logo/", "content/third-party/")
STABLE_DOCS = (
    "docs/CONTENT-ARCHITECTURE.md", "catalog/README.md",
    "assets/README.md", "assets/images/README.md", "assets/audio/README.md",
    "assets/video/README.md", "sources/README.md",
    "sources/youtube/README.md", "sources/publishers/README.md",
    "sources/official/README.md", "knowledge/README.md",
    "knowledge/dictionaries/README.md", "learning/README.md",
    "learning/exercises/README.md", "research/README.md",
    "research/pedagogy/README.md", "research/design/README.md",
    "research/ux/README.md", "research/gameplay/README.md",
    "research/user-cases/README.md", "catalog/registry.v1.json",
    "catalog/media-inventory-v1.json", "catalog/schemas/resource.v1.schema.json",
)


def load_json(file: Path) -> dict:
    return json.loads(file.read_text(encoding="utf-8"))


def check_registry(root: Path) -> list[str]:
    errors: list[str] = []
    file = root / "catalog/registry.v1.json"
    if not file.is_file():
        return ["missing catalog/registry.v1.json"]
    data = load_json(file)
    if data.get("schema_version") != "1.0.0":
        errors.append("registry schema_version must be 1.0.0")
    if data.get("rights_default") != "unknown_not_redistributable_without_item_level_evidence":
        errors.append("registry rights must default to unknown/not redistributable")
    dirs = data.get("root_directories", {})
    if set(dirs) != CATEGORIES:
        errors.append(f"registry categories differ: {sorted(CATEGORIES ^ set(dirs))}")
    for category, path in dirs.items():
        if not isinstance(path, str) or not (root / path).is_dir():
            errors.append(f"{category} missing directory: {path!r}")
    owned, ids = {}, set()
    for row in data.get("collections", []):
        id = row.get("id")
        category = row.get("category")
        paths = row.get("canonical_paths", [])
        if not isinstance(id, str) or not re.fullmatch(r"[a-z][a-z0-9_.-]{2,80}", id):
            errors.append(f"invalid collection id {id!r}")
        if id in ids:
            errors.append(f"duplicate collection id {id}")
        ids.add(id)
        if category not in CATEGORIES:
            errors.append(f"{id}: unsupported category {category}")
        if row.get("status") not in STATUSES:
            errors.append(f"{id}: invalid status")
        if not isinstance(paths, list) or not paths:
            errors.append(f"{id}: no canonical paths")
        owner = row.get("owner")
        if not isinstance(owner, str) or not (root / owner).is_file():
            errors.append(f"{id}: missing owner document {owner!r}")
        if category == "youtube" and row.get("status") != "curated_link_only":
            errors.append(f"{id}: YouTube must always remain link-only")
        if category == "youtube" and not all(
            x.endswith((".json", ".md")) for x in paths
        ):
            errors.append(f"{id}: YouTube catalog cannot claim audiovisual binaries")
        for path in paths:
            if not isinstance(path, str) or path.startswith("/") or ".." in Path(path).parts:
                errors.append(f"{id}: invalid repository path {path!r}")
                continue
            if not (root / path).exists():
                errors.append(f"{id}: missing canonical path {path}")
            if path in owned:
                errors.append(f"{id}: {path} also canonically owned by {owned[path]}")
            owned[path] = id
        for path in row.get("references", []):
            if not isinstance(path, str) or not (root / path).exists():
                errors.append(f"{id}: missing supporting reference {path!r}")
    if not ids:
        errors.append("registry must contain real collections")
    return errors


def binary_files(root: Path) -> dict[str, Path]:
    found = {}
    for prefix in MEDIA_ROOTS:
        base = root / prefix
        if not base.is_dir():
            continue
        for f in base.rglob("*"):
            if f.is_file() and f.suffix.lower() in MEDIA_EXT:
                found[f.relative_to(root).as_posix()] = f
    return found


def git_blob_sha(file: Path) -> str:
    # Git SHA-1 object identity is NOT a cryptographic media-content SHA-256.
    size = file.stat().st_size
    sha = hashlib.sha1()
    sha.update(f"blob {size}\0".encode("ascii"))
    with file.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            sha.update(chunk)
    return sha.hexdigest()


def check_media_inventory(root: Path) -> list[str]:
    problems: list[str] = []
    filename = root / "catalog/media-inventory-v1.json"
    if not filename.is_file():
        return ["missing catalog/media-inventory-v1.json"]
    data = load_json(filename)
    if data.get("schema_version") != "1.0.0":
        problems.append("media inventory version must be 1.0.0")
    if data.get("sha_type") != "git_blob_sha1_not_sha256":
        problems.append("Git blob identity must not be advertised as SHA-256")
    items = data.get("entries", [])
    seen = set()
    registered_size = 0
    for item in items:
        name = item.get("path")
        if not isinstance(name, str) or not any(name.startswith(x) for x in MEDIA_ROOTS):
            problems.append(f"inventory invalid path {name!r}")
            continue
        if name in seen:
            problems.append(f"inventory duplicate {name}")
            continue
        seen.add(name)
        if Path(name).suffix.lower() not in MEDIA_EXT:
            problems.append(f"inventory non-media {name}")
        file = root / name
        if not file.is_file():
            problems.append(f"inventory missing binary {name}")
            continue
        size = file.stat().st_size
        registered_size += size
        if item.get("size_bytes") != size:
            problems.append(f"inventory size changed {name}")
        sha = item.get("git_blob_sha")
        if not isinstance(sha, str) or not re.fullmatch("[a-f0-9]{40}", sha):
            problems.append(f"inventory invalid sha {name}")
        elif sha != git_blob_sha(file):
            problems.append(f"inventory git blob changed {name}")
        if item.get("rights_state") != "verify_in_source_manifest_before_redistribution":
            problems.append(f"inventory not a license assertion: {name}")
    actual = set(binary_files(root))
    if seen != actual:
        problems.extend(f"unregistered binary {path}" for path in sorted(actual - seen))
        problems.extend(f"orphan inventory entry {path}" for path in sorted(seen - actual))
    totals = data.get("totals", {})
    if totals.get("files") != len(items) or totals.get("bytes") != registered_size:
        problems.append("inventory totals mismatch actual tracked binary sizes")
    return problems


def check_docs(root: Path) -> list[str]:
    problems = [f"missing taxonomy document {name}" for name in STABLE_DOCS if not (root / name).is_file()]
    # Use the existing tested link-policy implementation as a shared small helper.
    from validate_ai_docs import check_link, links_in
    for name in STABLE_DOCS:
        if not name.endswith(".md") or not (root / name).is_file():
            continue
        for url in links_in((root / name).read_text(encoding="utf-8")):
            error = check_link(root, name, url)
            if error:
                problems.append(error)
    return problems


def validate(root: Path) -> list[str]:
    return check_registry(root) + check_media_inventory(root) + check_docs(root)


def main() -> int:
    errors = validate(ROOT)
    if errors:
        for error in errors:
            print("FAIL:", error, file=sys.stderr)
        return 1
    data = load_json(ROOT / "catalog/registry.v1.json")
    media = load_json(ROOT / "catalog/media-inventory-v1.json")
    print(f"PASS: {len(data['collections'])} collections, {len(CATEGORIES)} categories, {len(media['entries'])} binary assets, link integrity and rights-boundaries")
    print("NOTE: does not assert source licensing, live YouTube availability, human reviews or deployed Android/PWA")
    return 0


if __name__ == "__main__":
    sys.exit(main())
