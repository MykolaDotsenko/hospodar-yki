#!/usr/bin/env python3
"""Every saved material is used by the app, or registered with a reason (CURATED-09); new materials are searched for
regularly and added to use (CURATED-10).

Inventory:
  media      every audio, video and image file under assets/ (not README/manifests/subtitles)
  sources    every machine catalog under sources/**/*.json (link lists, intake ledgers)
  content    every authored exercise/dictionary JSON (learning/, knowledge/) — the --next "no app loads" list

"Used" means the new web app (apps/web) loads it: a media file's path appears in apps/web source or in a JSON file
that apps/web imports (manifests list their files); a catalog or content file is imported by apps/web.

docs/material-usage-register.json lists every unused item with a reason. This check FAILS when
  - a saved item is unused and not registered (nothing new may lie unused silently),
  - a registered item is used now or no longer exists (the register stays honest),
  - a reason or plan is missing.
It never fails because time passed: whether the next material search is due is reported (--report, and in
validate_design_traceability.py --next), not enforced in CI.
"""
from __future__ import annotations

import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTER = "docs/material-usage-register.json"
MEDIA_DIRS = ("assets/audio", "assets/video", "assets/images")
MEDIA_EXT = {".ogg", ".oga", ".mp3", ".m4a", ".opus", ".wav", ".flac", ".mp4", ".webm", ".mov",
             ".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".svg"}
SOURCE_GLOB = "sources/**/*.json"
CONTENT_GLOBS = ("learning/exercises/**/*.json", "knowledge/dictionaries/**/*.json")
WEB_SOURCES = ("apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "apps/web/src/**/*.css", "apps/web/index.html")
REASONS = {
    "TO_CONNECT": "ready to be used; a planned stage says when",
    "RIGHTS_PENDING": "redistribution or in-app use not cleared yet (link-only or waiting for permission)",
    "S2_PENDING": "needs Finnish S2 review before learners may see it",
    "NOT_LEARNER_MATERIAL": "not meant for learners (brand variant, research ledger, index)",
    "HELD_OUT": "reserved for unseen checks (delayed checks, exam); a LEARN screen must never show it, even if a manifest lists it",
}
IMPORT = re.compile(r"""(?:from\s+|import\(\s*)["']([^"']+\.json)["']""")
GLOB = re.compile(r"""import\.meta\.glob\(\s*["']([^"']+)["']""")


def _web_files(root: Path) -> list[Path]:
    return [f for g in WEB_SOURCES for f in root.glob(g) if not re.search(r"\.test\.tsx?$", f.name)]


def imported_json(root: Path) -> set[Path]:
    """JSON files apps/web imports directly or through import.meta.glob."""
    out: set[Path] = set()
    for f in _web_files(root):
        text = f.read_text(encoding="utf-8")
        for spec in IMPORT.findall(text):
            p = (f.parent / spec).resolve()
            if p.exists():
                out.add(p)
        for pattern in GLOB.findall(text):
            base = f.parent
            out.update(p.resolve() for p in base.glob(pattern) if p.suffix == ".json")
    return out


def web_text(root: Path) -> str:
    """Everything apps/web reads: its source plus every JSON it imports (manifests name their media files)."""
    parts = [f.read_text(encoding="utf-8") for f in _web_files(root)]
    parts += [p.read_text(encoding="utf-8") for p in sorted(imported_json(root))]
    return "\n".join(parts)


def media_files(root: Path) -> list[str]:
    return sorted(p.relative_to(root).as_posix() for d in MEDIA_DIRS for p in (root / d).rglob("*")
                  if p.is_file() and p.suffix.lower() in MEDIA_EXT)


def media_used(rel: str, text: str) -> bool:
    """By its path as manifests write it: from assets/, from its media folder, or folder/name."""
    parts = rel.split("/")
    keys = {rel, "/".join(parts[1:]), "/".join(parts[2:]), "/".join(parts[-2:])}
    return any(k and k in text for k in keys)


def unused_items(root: Path = ROOT) -> dict[str, list[str]]:
    text = web_text(root)
    imported = {p.relative_to(root.resolve()).as_posix() for p in imported_json(root) if p.is_relative_to(root.resolve())}
    # A catalog/content file counts only when apps/web CODE imports it (by name or folder glob) — a mere mention inside
    # another JSON (e.g. "rubric_ref") does not load it.
    globbed = "\n".join(f.read_text(encoding="utf-8") for f in _web_files(root))
    media = [m for m in media_files(root) if not media_used(m, text)]
    sources = sorted(p.relative_to(root).as_posix() for p in root.glob(SOURCE_GLOB)
                     if p.relative_to(root).as_posix() not in imported and f"{p.parent.name}/{p.name}" not in globbed)
    content = sorted(p.relative_to(root).as_posix() for g in CONTENT_GLOBS for p in root.glob(g)
                     if p.relative_to(root).as_posix() not in imported and f"{p.parent.name}/{p.name}" not in globbed
                     and f"{p.parent.name}/*.json" not in globbed and p.name not in ("index.json", "available.json")
                     and not media_or_manifest(p))
    return {"media": media, "sources": sources, "content": content}


def media_or_manifest(p: Path) -> bool:
    return p.name in ("available.json", "library.json")


def load_register(root: Path = ROOT) -> dict:
    return json.loads((root / REGISTER).read_text(encoding="utf-8"))


def check(root: Path = ROOT) -> list[str]:
    errors: list[str] = []
    reg = load_register(root)
    entries = reg.get("items", [])
    if not isinstance(reg.get("search_every_days"), int) or reg["search_every_days"] < 1:
        errors.append("register: search_every_days must be a positive integer")
    for s in reg.get("search_log", []):
        counts_ok = all(s.get(k) is None or (isinstance(s.get(k), int) and s[k] >= 0) for k in ("found", "added"))
        if not (isinstance(s.get("date"), str) and re.fullmatch(r"\d{4}-\d{2}-\d{2}", s["date"]) and s.get("scope_uk") and
                "found" in s and "added" in s and counts_ok and s.get("record")):
            errors.append(f"register: search_log entry needs date, scope_uk, found, added (a number or null = not recorded) and record: {s}")
        elif not (root / s["record"]).exists():
            errors.append(f"register: search_log record {s['record']} does not exist")
    unused = unused_items(root)
    registered: dict[str, dict] = {}
    for e in entries:
        path = e.get("path", "")
        if path in registered:
            errors.append(f"register: duplicate {path}")
        registered[path] = e
        if e.get("reason") not in REASONS:
            errors.append(f"register: {path}: reason must be one of {sorted(REASONS)}")
        if not str(e.get("note_uk", "")).strip():
            errors.append(f"register: {path}: note_uk (why, in plain words) is required")
        if e.get("reason") == "TO_CONNECT" and not str(e.get("plan_uk", "")).strip():
            errors.append(f"register: {path}: TO_CONNECT needs plan_uk (where and when it will be used)")
        if not (root / path).exists():
            errors.append(f"register: {path} does not exist any more — remove the entry")
    all_unused = {p for group in unused.values() for p in group}
    for p in sorted(all_unused - set(registered)):
        errors.append(f"{p}: saved but not used by the app and not in {REGISTER} — use it, or register it with a reason")
    for p in sorted(set(registered) - all_unused):
        if registered[p].get("reason") == "HELD_OUT":
            continue                                               # filtered out by the app on purpose; a web test guards that
        if (root / p).exists():
            errors.append(f"register: {p} is used by the app now — remove it from {REGISTER}")
    return errors


def search_status(root: Path = ROOT, today: date | None = None) -> str:
    reg = load_register(root)
    today = today or date.today()
    log = sorted(reg.get("search_log", []), key=lambda s: s["date"])
    every = reg.get("search_every_days", 28)
    if not log:
        return f"New-material search: none recorded yet (due now; every {every} days, CURATED-10)."
    last = date.fromisoformat(log[-1]["date"])
    age = (today - last).days
    due = "DUE NOW" if age >= every else f"next in {every - age} days"
    n = lambda v: "not recorded" if v is None else v
    return f"New-material search: last {last.isoformat()} ({age} days ago, found {n(log[-1]['found'])}, added {n(log[-1]['added'])}); {due}."


def report(root: Path = ROOT) -> str:
    reg = {e["path"]: e for e in load_register(root).get("items", [])}
    unused = unused_items(root)
    lines = []
    for group, items in unused.items():
        lines.append(f"Saved {group} not used by the app ({len(items)}):")
        lines += [f"  {reg.get(p, {}).get('reason', 'UNREGISTERED'):<20} {p}" for p in items]
    lines.append(search_status(root))
    return "\n".join(lines)


def main(argv: list[str]) -> int:
    if "--report" in argv:
        print(report())
        return 0
    errors = check()
    if errors:
        print("FAIL: material usage (CURATED-09)\n" + "\n".join(f"  {e}" for e in errors))
        return 1
    u = unused_items()
    print(f"PASS: every saved material is used by the app or registered with a reason "
          f"(unused: media {len(u['media'])}, source catalogs {len(u['sources'])}, content {len(u['content'])}). {search_status()}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
