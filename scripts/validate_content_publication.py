#!/usr/bin/env python3
"""Content publication gate (docs/28 §10 task 1, QL-01, LE-13, AC-59).

A learning item may be treated as reviewed/published ONLY if it carries a complete
`review_card` (schema `hospodar-review-card-v1`, see docs/guides/CONTENT-AUTHORING.md):
human S2 decision, level, skill, communicative outcome, source + redistributable licence,
reviewed answer variants / transcript, version and a content hash of the reviewed item.

    python3 scripts/validate_content_publication.py           # check (CI)
    python3 scripts/validate_content_publication.py --hash FILE ITEM_ID   # print hash for a card

Fails when:
  * any review/status field claims approval/publication without a valid card;
  * a card is incomplete, uses a non-redistributable licence, or its content_hash no longer
    matches the item (edited after review -> must be re-reviewed);
  * a card says published while a field on the same item still says pending / script-only /
    not valid for assessment.
Static only: it cannot prove that the named reviewer exists or that the Finnish is correct.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT_GLOB = "learning/exercises/**/*.json"
SCHEMA = "hospodar-review-card-v1"
STATUSES = {"draft", "s2_reviewed", "published", "withdrawn"}
REVIEWED = {"s2_reviewed", "published"}
LEVELS = {"A1.3", "A2.1", "A2.2", "B1.1", "B1.2", "B2.1"}
SKILLS = {"reading", "listening", "writing", "speaking", "grammar", "vocabulary"}
SOURCE_KINDS = {"project_original", "licensed", "public_domain"}
REDISTRIBUTABLE = {"project_original", "CC0-1.0", "CC-BY-4.0", "CC-BY-SA-4.0", "CC-BY-3.0",
                   "CC-BY-SA-3.0", "public-domain"}
CLAIM = re.compile(r"(^|_)(approved|published|s2_reviewed|s2_approved|teacher_approved|reviewed_ok)($|_)", re.I)
NEGATION = re.compile(r"pending|not|never|unverified|draft|needs|without|until", re.I)
BLOCKING_VALUES = re.compile(r"pending|script_only|not_valid|unverified|needs_|draft", re.I)
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def content_hash(item: dict) -> str:
    body = {k: v for k, v in item.items() if k != "review_card"}
    canonical = json.dumps(body, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return "sha256:" + hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def is_claim(key: str, value) -> bool:
    return (("review" in key or "status" in key) and isinstance(value, str)
            and bool(CLAIM.search(value)) and not NEGATION.search(value))


def card_errors(item: dict) -> list[str]:
    card = item.get("review_card")
    if not isinstance(card, dict):
        return ["missing review_card"]
    e: list[str] = []
    if card.get("schema") != SCHEMA:
        e.append(f"schema must be {SCHEMA}")
    status = card.get("status")
    if status not in STATUSES:
        e.append(f"status must be one of {sorted(STATUSES)}")
    if status not in REVIEWED:
        return e  # drafts/withdrawn may be partial
    if card.get("level") not in LEVELS:
        e.append("level must be one of A1.3…B2.1")
    skills = card.get("skills")
    if not isinstance(skills, list) or not skills or not set(skills) <= SKILLS:
        e.append("skills must be a non-empty list of known skills")
    if not isinstance(card.get("communicative_outcome_uk"), str) or len(card["communicative_outcome_uk"].strip()) < 10:
        e.append("communicative_outcome_uk is required")
    src = card.get("source") or {}
    if src.get("kind") not in SOURCE_KINDS:
        e.append("source.kind must be project_original, licensed or public_domain")
    if src.get("license") not in REDISTRIBUTABLE:
        e.append("source.license must be redistributable (no ND/NC/link-only) — use an SPDX-like id")
    if src.get("kind") != "project_original" and not str(src.get("url", "")).startswith("https://"):
        e.append("source.url (https) is required for non-original material")
    rev = card.get("s2_review") or {}
    if rev.get("decision") != "approved":
        e.append("s2_review.decision must be approved")
    if rev.get("reviewer_role") != "S2_teacher":
        e.append("s2_review.reviewer_role must be S2_teacher (human)")
    if not re.fullmatch(r"[A-Za-z0-9_.-]{2,64}", str(rev.get("reviewer_id", ""))):
        e.append("s2_review.reviewer_id is required (pseudonymous id, no personal data)")
    if not DATE.match(str(rev.get("reviewed_at", ""))):
        e.append("s2_review.reviewed_at must be YYYY-MM-DD")
    if card.get("answer_variants_reviewed") is not True:
        e.append("answer_variants_reviewed must be true")
    if card.get("transcript_reviewed") not in (True, None):
        e.append("transcript_reviewed must be true, or null when the item has no audio")
    if not isinstance(card.get("content_version"), int) or card["content_version"] < 1:
        e.append("content_version must be an integer ≥1")
    if card.get("content_hash") != content_hash(item):
        e.append("content_hash does not match the item (edited after review → re-review and re-hash)")
    if status == "published":
        for k, v in item.items():
            if k != "review_card" and ("review" in k or "status" in k) and isinstance(v, str) and BLOCKING_VALUES.search(v):
                e.append(f"published item still says {k}={v!r}")
    return e


def walk(node, path, out):
    if isinstance(node, dict):
        yield_item = "review_card" in node or any(is_claim(k, v) for k, v in node.items())
        if yield_item:
            out.append((path, node))
        for k, v in node.items():
            if k != "review_card":
                walk(v, f"{path}.{k}", out)
    elif isinstance(node, list):
        for i, v in enumerate(node):
            walk(v, f"{path}[{i}]", out)


def check(files: dict[str, object]) -> tuple[list[str], dict]:
    errors: list[str] = []
    stats = {"files": len(files), "cards": 0, "reviewed": 0, "published": 0}
    for name, data in files.items():
        found: list = []
        walk(data, "$", found)
        for path, item in found:
            label = f"{name} {path} id={item.get('id', '?')}"
            card = item.get("review_card")
            if isinstance(card, dict):
                stats["cards"] += 1
                stats["reviewed"] += card.get("status") in REVIEWED
                stats["published"] += card.get("status") == "published"
            claims = [f"{k}={v!r}" for k, v in item.items() if is_claim(k, v)]
            if claims and not (isinstance(card, dict) and card.get("status") in REVIEWED):
                errors.append(f"{label}: claims review/publication ({', '.join(claims)}) without an s2_reviewed/published review_card")
                continue
            if isinstance(card, dict):
                errors.extend(f"{label}: {m}" for m in card_errors(item))
    return errors, stats


def load_files() -> dict[str, object]:
    return {str(p.relative_to(ROOT)): json.loads(p.read_text(encoding="utf-8"))
            for p in sorted(ROOT.glob(CONTENT_GLOB))}


def find_item(node, item_id):
    if isinstance(node, dict):
        if node.get("id") == item_id:
            return node
        node = list(node.values())
    if isinstance(node, list):
        for v in node:
            hit = find_item(v, item_id)
            if hit is not None:
                return hit
    return None


def main(argv: list[str]) -> int:
    if argv[:1] == ["--hash"]:
        if len(argv) != 3:
            print("usage: --hash FILE ITEM_ID"); return 2
        item = find_item(json.loads(Path(argv[1]).read_text(encoding="utf-8")), argv[2])
        if item is None:
            print("item not found"); return 2
        print(content_hash(item)); return 0
    errors, s = check(load_files())
    if errors:
        print("FAIL content publication gate:\n  " + "\n  ".join(errors)); return 1
    print(f"PASS: {s['files']} content files; {s['cards']} review cards, {s['reviewed']} S2-reviewed, "
          f"{s['published']} published; no unreviewed item claims approval (static check — "
          "does not prove Finnish quality or reviewer identity)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
