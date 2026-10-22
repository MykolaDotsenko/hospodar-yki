#!/usr/bin/env python3
"""Static AI-documentation and agent-policy validation. No runtime-readiness claims."""
from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = (
    "AGENTS.md", "CONTRIBUTING.md",
    ".github/copilot-instructions.md", ".github/pull_request_template.md",
    ".github/workflows/validate-ai-engineering-docs.yml",
    "docs/INDEX.md", "docs/ARCHITECTURE.md", "docs/DEVELOPMENT.md",
    "docs/TESTING.md", "docs/CONTRACTS.md", "docs/SECURITY.md",
    "docs/RELEASE.md", "docs/AI-WORKFLOW.md", "docs/QUALITY.md",
    "docs/exec-plans/README.md", "docs/exec-plans/TEMPLATE.md",
)
MARKDOWN = tuple(path for path in REQUIRED if path.endswith(".md"))
LINK = re.compile(r"!?\[[^\]\n]*\]\(([^)\n]+)\)")
FENCE = re.compile(r"^ {0,3}([\x60]{3,}|~{3,})")


def markdown_without_fences(body: str) -> str:
    kept = []
    fence_char = None
    fence_length = 0
    for line in body.splitlines():
        match = FENCE.match(line)
        if match:
            marker = match.group(1)
            if fence_char is None:
                fence_char, fence_length = marker[0], len(marker)
                kept.append("")
                continue
            if marker[0] == fence_char and len(marker) >= fence_length:
                fence_char = None
                kept.append("")
                continue
        kept.append(line if fence_char is None else "")
    return "\n".join(kept)


def links_in(body: str) -> list[str]:
    return [m.group(1).strip().split(' "', 1)[0] for m in LINK.finditer(markdown_without_fences(body))]


def check_link(root: Path, relative_doc: str, url: str) -> str | None:
    if not url or url.startswith(("#", "https://", "http://", "mailto:", "tel:")):
        return None
    if url.startswith(("/", "\\")) or re.match(r"^[A-Za-z][\w+.-]*:", url):
        return f"{relative_doc}: unsupported or absolute link {url!r}"
    decoded = unquote(urlsplit(url).path)
    if not decoded:
        return None
    if "%" in decoded and re.search(r"%2[eEfF]|%5[cC]", decoded):
        return f"{relative_doc}: double-encoded path {url!r}"
    target_root = root.resolve()
    target = (target_root / Path(relative_doc).parent / decoded).resolve()
    if not target.is_relative_to(target_root):
        return f"{relative_doc}: link escapes repository: {url!r}"
    if not target.exists():
        return f"{relative_doc}: missing local link {url!r} ({target.relative_to(target_root)})"
    return None


def check_docs(root: Path) -> list[str]:
    failures = [f"missing required file: {path}" for path in REQUIRED if not (root / path).is_file()]
    for path in MARKDOWN:
        target = root / path
        if not target.is_file():
            continue
        body = target.read_text(encoding="utf-8")
        if len(body.strip()) < 100 or not body.lstrip().startswith("# "):
            failures.append(f"{path}: missing substantive Markdown heading/content")
        for url in links_in(body):
            problem = check_link(root, path, url)
            if problem:
                failures.append(problem)
    return failures


def check_invariants(root: Path) -> list[str]:
    failures: list[str] = []
    expected: dict[str, tuple[str, ...]] = {
        "AGENTS.md": ("localStorage", "IndexedDB", "Room", "FirstAttemptEvent",
                      "ExamCheckpoint", "node --test", "Do not claim"),
        "docs/ARCHITECTURE.md": ("app/core.mjs", "app/attempt-storage.mjs",
                                 "Room", "Dexie", "Phaser"),
        "docs/CONTRACTS.md": ("EXAM_COMMIT_PROTOCOL=1", "FirstAttemptEvent",
                              "ExamCheckpoint", "IDEMPOTENCY_CONFLICT",
                              "REVISION_CONFLICT", "event ID", "not implemented"),
        "docs/TESTING.md": ("node --test app/tests/*.test.mjs",
                            "node --test packages/contracts/tests/*.test.mjs",
                            "run-chromium-idb.mjs", "NOT RUN"),
        "docs/RELEASE.md": ("AAB", "PAD", "NOT BUILT", "rollback"),
        ".github/pull_request_template.md": ("NOT RUN", "Privacy", "Evidence"),
        ".github/workflows/validate-ai-engineering-docs.yml": (
            "python3 scripts/validate_ai_docs.py", "unittest discover",
            "'AGENTS.md'", "'docs/**'"),
        "docs/INDEX.md": ("24-reliability-hardened-architecture-web-android.md",
                          "27-stack-architecture-compatibility-and-implementation-gates.md",
                          "IMPLEMENTED"),
    }
    for name, markers in expected.items():
        path = root / name
        if not path.is_file():
            continue
        body = path.read_text(encoding="utf-8")
        for marker in markers:
            if marker not in body:
                failures.append(f"{name}: required invariant/evidence marker absent: {marker!r}")
    for source in (
        "app/index.html", "app/exam.html", "app/core.mjs",
        "app/attempt-storage.mjs", "app/tests/atomic-idb-browser.html",
        "scripts/run-chromium-idb.mjs", "packages/contracts/src/index.mjs",
        "native/android/prototype/ExamDatabase.kt",
        "docs/24-reliability-hardened-architecture-web-android.md",
        "docs/27-stack-architecture-compatibility-and-implementation-gates.md",
    ):
        if not (root / source).is_file():
            failures.append(f"documented source missing: {source}")
    return failures


def validate(root: Path) -> list[str]:
    return check_docs(root) + check_invariants(root)


def main() -> int:
    failures = validate(ROOT)
    if failures:
        for failure in failures:
            print("FAIL:", failure, file=sys.stderr)
        return 1
    print(f"PASS: {len(REQUIRED)} AI-engineering files, relative links, source and review/CI policy markers")
    print("NOTE: static documentation only; no Android build, physical device or production release proven")
    return 0


if __name__ == "__main__":
    sys.exit(main())
