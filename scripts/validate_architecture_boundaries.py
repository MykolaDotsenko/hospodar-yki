#!/usr/bin/env python3
"""Architecture fitness tests for pure, reusable learning/exam domain modules.

No new framework or registry: read the physical source tree. Checks do NOT imply
a completed React/Android architecture or prove runtime isolation/security.
"""
from __future__ import annotations

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
CURRENT_PURE = ("app/core.mjs", "app/exam-core.mjs")
PURE_PACKAGE_ROOTS = ("packages/contracts/src", "packages/domain/src",
                      "packages/exam-engine/src", "packages/learning-engine/src")
SOURCE_SUFFIXES = {".mjs", ".js", ".ts", ".tsx"}
# Static import/export, dynamic import, and CommonJS require in pure modules.
MODULE_REF = re.compile(
    r"(?:^\s*(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?|"
    r"\bimport\s*\(\s*|\brequire\s*\(\s*)"
    r"""['"]([^'"]+)['"]""", re.MULTILINE
)
FORBIDDEN_EXTERNAL = re.compile(
    r"^(?:react(?:/|$)|react-dom(?:/|$)|phaser(?:/|$)|dexie(?:/|$)|"
    r"@capacitor(?:/|$)|@supabase(?:/|$)|vite(?:/|$)|next(?:/|$)|"
    r"node:|@/apps/)"
)
FORBIDDEN_PLATFORM = re.compile(
    r"\b(?:window|document|localStorage|sessionStorage|indexedDB|"
    r"navigator|AudioContext|HTMLAudioElement|MediaRecorder|"
    r"SpeechRecognition|webkitSpeechRecognition)\s*(?:[.([])"
)
ALLOWED_RELATIVE_SUFFIXES = (".mjs", ".js", ".ts", ".tsx", ".json")
NOT_IMPORTABLE = ("app/", "apps/", "native/", "infrastructure/", "platform/")


def pure_sources(root: Path):
    for rel in CURRENT_PURE:
        yield rel, root / rel
    for name in PURE_PACKAGE_ROOTS:
        directory = root / name
        if directory.exists():
            for src in sorted(directory.rglob("*")):
                if src.is_file() and src.suffix in SOURCE_SUFFIXES:
                    yield src.relative_to(root).as_posix(), src


def check_source(root: Path, relative: str, source: str) -> list[str]:
    failures = []
    # Remove obvious comments before matching global identifiers; this is
    # deliberately conservative, not a full JavaScript/TypeScript parser.
    uncommented = re.sub(r"/\*[\s\S]*?\*/|^\s*//.*$", "", source, flags=re.MULTILINE)
    if FORBIDDEN_PLATFORM.search(uncommented):
        failures.append(f"{relative}: platform API in reusable domain")
    for match in MODULE_REF.finditer(uncommented):
        module = match.group(1)
        if FORBIDDEN_EXTERNAL.search(module):
            failures.append(f"{relative}: framework/host import {module}")
        if module.startswith(("/", "\\")):
            failures.append(f"{relative}: absolute import {module}")
        if module.startswith("."):
            target = (root / Path(relative).parent / module).resolve()
            if not target.is_relative_to(root.resolve()):
                failures.append(f"{relative}: import escapes repository {module}")
                continue
            resolved = (target.is_file() or any(
                target.with_suffix(s).is_file() for s in ALLOWED_RELATIVE_SUFFIXES
            ) or (target / "index.mjs").is_file() or (target / "index.ts").is_file())
            if not resolved:
                failures.append(f"{relative}: unresolved source import {module}")
            rel_target = target.relative_to(root.resolve()).as_posix()
            if relative.startswith("packages/") and rel_target.startswith(NOT_IMPORTABLE):
                failures.append(f"{relative}: pure package imports UI/platform {module}")
    return failures


def validate(root: Path) -> list[str]:
    failures = []
    for relative, file in pure_sources(root):
        if not file.is_file():
            failures.append(f"{relative}: required pure module missing")
            continue
        failures.extend(check_source(root, relative, file.read_text(encoding="utf-8")))
    return failures


if __name__ == "__main__":
    errors = validate(ROOT)
    for error in errors:
        print("FAIL:", error, file=sys.stderr)
    if errors:
        raise SystemExit(f"FAIL: {len(errors)} domain boundary violations")
    print("PASS: shared learning/exam domain boundary stays independent of browser, React and native adapters")
